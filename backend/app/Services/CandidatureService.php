<?php

namespace App\Services;

use App\Exceptions\CandidatureDejaExistanteException;
use App\Exceptions\LimiteCandidaturesActivesException;
use App\Exceptions\OffreFermeeOuExpireeException;
use App\Models\Candidat;
use App\Models\Candidature;
use App\Models\Cv;
use App\Models\Entreprise;
use App\Models\Offre;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class CandidatureService
{
    protected ?AiCvAnalysisService $aiService;
    protected ?NotificationService $notificationService;

    public function __construct(
        ?AiCvAnalysisService $aiService = null,
        ?NotificationService $notificationService = null
    ) {
        $this->aiService = $aiService ?? app(AiCvAnalysisService::class);
        $this->notificationService = $notificationService ?? app(NotificationService::class);
    }

    /**
     * Enregistre une candidature en appliquant strictement les règles ATS.
     *
     * Vérifications ordonnées :
     * 1. L'offre est ouverte et la date limite n'est pas dépassée.
     * 2. Le candidat n'a pas déjà postulé à cette offre (pas de doublon).
     * 3. Si l'entreprise a configuré une limite max_candidatures_actives_par_candidat,
     *    le nombre de candidatures actives du candidat dans cette entreprise est inférieur à cette limite.
     * 4. Création atomique avec statut initial dans une transaction DB.
     *
     * @param Candidat $candidat
     * @param Offre $offre
     * @param array $data (cv_id, lettre_motivation, message, cv_payload...)
     * @return Candidature
     *
     * @throws OffreFermeeOuExpireeException (HTTP 422)
     * @throws CandidatureDejaExistanteException (HTTP 409)
     * @throws LimiteCandidaturesActivesException (HTTP 422)
     */
    public function postuler(Candidat $candidat, Offre $offre, array $data = []): Candidature
    {
        // a. Vérifier que l'offre est ouverte et que sa date limite n'est pas dépassée
        $this->verifierDisponibiliteOffre($offre);

        // b. Vérifier que le candidat n'a pas déjà postulé à cette offre (évite doublon)
        $this->verifierNonDoublonOffre($candidat, $offre);

        // c. Si l'entreprise a configuré une limite, vérifier le quota de candidatures actives
        $this->verifierLimiteCandidaturesActives($candidat, $offre);

        // d. Création atomique sous transaction pour éviter toute race condition
        return DB::transaction(function () use ($candidat, $offre, $data) {
            // Re-vérification avec verrouillage de ligne dans la transaction
            $this->verifierNonDoublonOffre($candidat, $offre, true);
            $this->verifierLimiteCandidaturesActives($candidat, $offre, true);

            // Résolution ou création du CV associé
            $cvId = $this->resoudreCvId($candidat, $data);

            $statutInitial = $data['statut'] ?? Candidature::STATUT_INITIAL;

            $candidature = Candidature::create([
                'candidat_id' => $candidat->id,
                'offre_id' => $offre->id,
                'cv_id' => $cvId,
                'lettre_motivation' => $data['lettre_motivation'] ?? null,
                'message' => $data['message'] ?? null,
                'statut' => $statutInitial,
                'commentaire_recruteur' => $data['commentaire_recruteur'] ?? null,
            ]);

            // Notifications automatiques
            if ($this->notificationService) {
                try {
                    $this->notificationService->notifierConfirmationDepot($candidature);
                    $this->notificationService->notifierNouvelleCandidature($candidature);
                } catch (\Throwable $e) {
                    Log::warning('Erreur notification candidature: ' . $e->getMessage());
                }
            }

            // Déclenchement automatique de l'analyse IA du CV déposé
            if ($this->aiService) {
                try {
                    $cvInstance = Cv::find($cvId);
                    if ($cvInstance) {
                        $this->aiService->analyser($cvInstance, $candidature);
                    }
                } catch (\Throwable $e) {
                    Log::warning('Erreur analyse IA candidature: ' . $e->getMessage());
                }
            }

            return $candidature;
        });
    }

    /**
     * Règle a : L'offre est ouverte et la date limite n'est pas dépassée.
     */
    public function verifierDisponibiliteOffre(Offre $offre): void
    {
        $statut = strtoupper((string) $offre->statut);
        if (!in_array($statut, ['PUBLIEE', 'OUVERTE'], true)) {
            throw new OffreFermeeOuExpireeException(
                "Cette offre n'est plus disponible (statut : {$offre->statut}). Les candidatures sont fermées.",
                ['statut_offre' => $offre->statut]
            );
        }

        if ($offre->date_limite && Carbon::parse($offre->date_limite)->endOfDay()->isPast()) {
            throw new OffreFermeeOuExpireeException(
                "La date limite pour postuler à cette offre est dépassée (" . Carbon::parse($offre->date_limite)->format('d/m/Y') . "). Les candidatures sont closes.",
                ['date_limite' => $offre->date_limite, 'expired' => true]
            );
        }
    }

    /**
     * Règle b : Le candidat ne peut postuler qu'une seule fois à la même offre.
     */
    public function verifierNonDoublonOffre(Candidat $candidat, Offre $offre, bool $lockForUpdate = false): void
    {
        $query = Candidature::where('candidat_id', $candidat->id)
            ->where('offre_id', $offre->id);

        if ($lockForUpdate) {
            $query->lockForUpdate();
        }

        $existant = $query->first();

        if ($existant) {
            throw new CandidatureDejaExistanteException(
                "Vous avez déjà postulé à cette offre. Une seule candidature par candidat est autorisée.",
                [
                    'candidature_id' => $existant->id,
                    'statut_candidature' => $existant->statut,
                    'created_at' => $existant->created_at,
                ]
            );
        }
    }

    /**
     * Règle c : Si l'entreprise a une limite max_candidatures_actives_par_candidat,
     * vérifier que le nombre de candidatures actives du candidat dans cette entreprise < limite.
     */
    public function verifierLimiteCandidaturesActives(Candidat $candidat, Offre $offre, bool $lockForUpdate = false): void
    {
        $entreprise = $offre->entreprise ?: Entreprise::find($offre->entreprise_id);
        if (!$entreprise) {
            return;
        }

        $limite = $entreprise->max_candidatures_actives_par_candidat;
        // NULL ou <= 0 signifie sans restriction (illimité)
        if ($limite === null || $limite <= 0) {
            return;
        }

        $query = Candidature::join('offres', 'candidatures.offre_id', '=', 'offres.id')
            ->where('offres.entreprise_id', $entreprise->id)
            ->where('candidatures.candidat_id', $candidat->id)
            ->whereIn('candidatures.statut', Candidature::STATUTS_ACTIFS);

        if ($lockForUpdate) {
            $query->lockForUpdate();
        }

        $nbActives = $query->count();

        if ($nbActives >= $limite) {
            throw new LimiteCandidaturesActivesException(
                "L'entreprise {$entreprise->nom} limite à {$limite} candidature(s) active(s) simultanée(s) par candidat. Vous avez déjà {$nbActives} candidature(s) en cours d'examen.",
                $limite,
                $nbActives,
                [
                    'entreprise_id' => $entreprise->id,
                    'entreprise_nom' => $entreprise->nom,
                ]
            );
        }
    }

    /**
     * Obtient le nombre de candidatures actives d'un candidat dans une entreprise donnée.
     */
    public function countActiveCandidaturesForEntreprise(Candidat $candidat, Entreprise $entreprise): int
    {
        return Candidature::join('offres', 'candidatures.offre_id', '=', 'offres.id')
            ->where('offres.entreprise_id', $entreprise->id)
            ->where('candidatures.candidat_id', $candidat->id)
            ->whereIn('candidatures.statut', Candidature::STATUTS_ACTIFS)
            ->count();
    }

    /**
     * Résout l'identifiant du CV à rattacher à la candidature.
     */
    protected function resoudreCvId(Candidat $candidat, array $data): string
    {
        if (!empty($data['cv_id'])) {
            $cv = Cv::find($data['cv_id']);
            if ($cv) {
                return $cv->id;
            }
        }

        if (!empty($data['cv_payload']) && is_array($data['cv_payload'])) {
            $payload = $data['cv_payload'];
            $newCv = Cv::create([
                'candidat_id' => $candidat->id,
                'nom_fichier' => $payload['nom_fichier'] ?? ('CV_' . ($candidat->nom ?: 'Candidat') . '.pdf'),
                'type_mime' => $payload['type_mime'] ?? 'application/pdf',
                'taille_octets' => $payload['taille_octets'] ?? 2048,
                'url_stockage' => $payload['url_stockage'] ?? ('database://cvs/' . Str::uuid()),
                'contenu_base64' => $payload['contenu_base64'] ?? null,
            ]);
            return $newCv->id;
        }

        $dernierCv = $candidat->cvs()->latest()->first();
        if ($dernierCv) {
            return $dernierCv->id;
        }

        // Créer un CV par défaut pour le candidat si aucun CV n'est encore enregistré
        $cvParDefaut = Cv::create([
            'candidat_id' => $candidat->id,
            'nom_fichier' => 'CV_' . ($candidat->nom ?: 'Candidat') . '.pdf',
            'type_mime' => 'application/pdf',
            'taille_octets' => 1024,
            'url_stockage' => 'database://cvs/' . Str::uuid(),
            'contenu_base64' => base64_encode('%PDF-1.4 Profil candidat automatique'),
        ]);

        return $cvParDefaut->id;
    }
}
