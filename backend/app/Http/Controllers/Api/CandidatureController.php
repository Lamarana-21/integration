<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\CandidatureDejaExistanteException;
use App\Exceptions\LimiteCandidaturesActivesException;
use App\Exceptions\OffreFermeeOuExpireeException;
use App\Http\Controllers\Controller;
use App\Http\Requests\PostulerCandidatureRequest;
use App\Models\Candidat;
use App\Models\Candidature;
use App\Models\Cv;
use App\Models\NoteInterne;
use App\Models\Notification;
use App\Models\Offre;
use App\Models\User;
use App\Services\AiCvAnalysisService;
use App\Services\CandidatureService;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CandidatureController extends Controller
{
    protected AiCvAnalysisService $aiService;
    protected NotificationService $notificationService;
    protected CandidatureService $candidatureService;

    public function __construct(
        AiCvAnalysisService $aiService,
        NotificationService $notificationService,
        CandidatureService $candidatureService
    ) {
        $this->aiService = $aiService;
        $this->notificationService = $notificationService;
        $this->candidatureService = $candidatureService;
    }

    /**
     * Lister toutes les candidatures (recruteurs & admin)
     */
    public function index(Request $request): JsonResponse
    {
        $candidatures = Candidature::with([
            'offre.entreprise',
            'candidat.user',
            'cv',
            'analyse',
            'notesInternes.auteur',
        ])->orderBy('created_at', 'desc')->get();

        return response()->json(['candidatures' => $candidatures]);
    }

    /**
     * Résout l'instance de Candidat associée à la requête.
     */
    protected function resoudreCandidat(Request $request): ?Candidat
    {
        $user = $request->user();
        if (!$user && $request->header('X-User-Id')) {
            $user = User::find($request->header('X-User-Id'));
        }
        if (!$user && $request->filled('user_id')) {
            $user = User::find($request->user_id);
        }
        if (!$user && $request->filled('candidat_id')) {
            $c = Candidat::find($request->candidat_id);
            if ($c) {
                return $c;
            }
        }
        if (!$user) {
            $user = User::whereHas('role', fn($q) => $q->where('nom', 'CANDIDAT'))->first();
        }

        if ($user) {
            $candidat = $user->candidat ?: Candidat::where('utilisateur_id', $user->id)->first();
            if (!$candidat) {
                $candidat = Candidat::create([
                    'utilisateur_id' => $user->id,
                    'nom' => $user->nom,
                    'prenom' => $user->prenom,
                ]);
            }
            return $candidat;
        }

        if ($request->filled('candidat_id')) {
            return Candidat::find($request->candidat_id);
        }

        return Candidat::first();
    }

    /**
     * Endpoint API standardisé ATS : POST /offres/{id}/candidatures
     * Valide les données et applique la logique métier via CandidatureService.
     * Codes HTTP :
     * - 201 Created : Candidature enregistrée
     * - 404 Not Found : Offre introuvable
     * - 409 Conflict : Candidature déjà existante pour cette offre (doublon)
     * - 422 Unprocessable Content : Offre expirée/fermée ou quota actif atteint
     */
    public function postulerViaService(PostulerCandidatureRequest $request, string $id): JsonResponse
    {
        $offre = Offre::with('entreprise')->find($id);
        if (!$offre) {
            return response()->json([
                'message' => 'Offre d\'emploi introuvable.',
                'error_code' => 'OFFRE_INTROUVABLE',
            ], 404);
        }

        $candidat = $this->resoudreCandidat($request);
        if (!$candidat) {
            return response()->json([
                'message' => 'Profil candidat introuvable. Veuillez vous identifier ou compléter votre profil.',
                'error_code' => 'CANDIDAT_INTROUVABLE',
            ], 422);
        }

        try {
            $candidature = $this->candidatureService->postuler($candidat, $offre, $request->all());

            return response()->json([
                'message' => 'Candidature enregistrée avec succès.',
                'candidature' => $candidature->load(['offre.entreprise', 'candidat.user', 'cv', 'analyse']),
            ], 201);
        } catch (CandidatureDejaExistanteException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'error_code' => 'CANDIDATURE_DEJA_EXISTANTE',
                'details' => $e->getPayload(),
            ], 409);
        } catch (LimiteCandidaturesActivesException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'error_code' => 'LIMITE_CANDIDATURES_ACTIVES_ATTEINTE',
                'details' => $e->getPayload(),
            ], 422);
        } catch (OffreFermeeOuExpireeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'error_code' => 'OFFRE_FERMEE_OU_EXPIREE',
                'details' => $e->getPayload(),
            ], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Une erreur est survenue lors de l\'enregistrement de votre candidature: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Endpoint API existant /jobs/{id}/applications (rétro-compatible frontend)
     * Délégué à CandidatureService pour garantir la cohérence des règles métier.
     */
    public function postuler(Request $request, string $offreId): JsonResponse
    {
        $offre = Offre::with('entreprise')->find($offreId);
        if (!$offre) {
            return response()->json(['message' => 'Offre d\'emploi introuvable.'], 404);
        }

        $candidat = $this->resoudreCandidat($request);
        if (!$candidat) {
            return response()->json(['message' => 'Profil candidat introuvable. Veuillez compléter votre profil.'], 403);
        }

        try {
            $candidature = $this->candidatureService->postuler($candidat, $offre, $request->all());

            return response()->json([
                'message' => 'Candidature enregistrée avec succès dans la base de données',
                'candidature' => $candidature->load(['offre.entreprise', 'candidat.user', 'cv', 'analyse']),
            ], 201);
        } catch (CandidatureDejaExistanteException $e) {
            $alreadyApplied = Candidature::where('candidat_id', $candidat->id)->where('offre_id', $offre->id)->first();
            return response()->json([
                'message' => $e->getMessage(),
                'already_applied' => true,
                'error_code' => 'CANDIDATURE_DEJA_EXISTANTE',
                'candidature' => $alreadyApplied ? $alreadyApplied->load(['offre.entreprise', 'candidat.user', 'cv', 'analyse']) : null,
            ], 422);
        } catch (LimiteCandidaturesActivesException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'limit_exceeded' => true,
                'error_code' => 'LIMITE_CANDIDATURES_ACTIVES_ATTEINTE',
                'details' => $e->getPayload(),
            ], 422);
        } catch (OffreFermeeOuExpireeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'expired' => true,
                'error_code' => 'OFFRE_FERMEE_OU_EXPIREE',
                'details' => $e->getPayload(),
            ], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Une erreur est survenue lors de l\'enregistrement de votre candidature: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Module 7.4 & 7.6 : Suivre le statut de ses candidatures (candidat connecté)
     */
    public function mesCandidatures(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user && $request->header('X-User-Id')) {
            $user = User::find($request->header('X-User-Id'));
        }
        if (!$user && $request->filled('user_id')) {
            $user = User::find($request->user_id);
        }
        if (!$user) {
            $user = User::whereHas('role', fn($q) => $q->where('nom', 'CANDIDAT'))->first();
        }

        $candidat = $user?->candidat ?: \App\Models\Candidat::where('utilisateur_id', $user?->id)->first();

        if (!$candidat) {
            return response()->json(['candidatures' => []]);
        }

        $query = Candidature::with(['offre.entreprise', 'cv', 'analyse'])
            ->where('candidat_id', $candidat->id);

        if ($request->filled('statut') && $request->statut !== 'TOUS') {
            $query->where('statut', $request->statut);
        }

        $candidatures = $query->orderBy('created_at', 'desc')->get();

        return response()->json(['candidatures' => $candidatures]);
    }

    /**
     * Module 7.5 & RM5 : Retirer une candidature non traitée
     * RM5 : Possible tant qu'elle n'est ni ACCEPTÉE ni REFUSÉE
     */
    public function retirer(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        if (!$user && $request->header('X-User-Id')) {
            $user = User::find($request->header('X-User-Id'));
        }
        $candidature = Candidature::findOrFail($id);

        if ($user && $user->candidat && $candidature->candidat_id !== $user->candidat->id) {
            return response()->json(['message' => 'Action non autorisée'], 403);
        }

        if (!$candidature->canBeWithdrawn()) {
            return response()->json(['message' => 'Impossible de retirer une candidature déjà clôturée ou acceptée/refusée.'], 422);
        }

        $candidature->update(['statut' => 'RETIREE']);

        return response()->json([
            'message' => 'Candidature retirée avec succès',
            'candidature' => $candidature,
        ]);
    }

    /**
     * Module 8.1 & 8.5 : Lister les candidatures reçues pour une offre (recruteur)
     */
    public function indexByOffre(Request $request, string $offreId): JsonResponse
    {
        $offre = Offre::findOrFail($offreId);
        $user = $request->user();

        // RM3 : Vérifier l'appartenance à l'entreprise
        if (!$user->isAdmin() && $user->entreprise_id !== $offre->entreprise_id) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        $query = Candidature::with(['candidat.user', 'cv', 'analyse', 'notesInternes.auteur'])
            ->where('offre_id', $offre->id);

        if ($request->filled('statut') && $request->statut !== 'TOUS') {
            $query->where('statut', $request->statut);
        }

        if ($request->filled('score_min')) {
            $min = (int) $request->score_min;
            $query->whereHas('analyse', function ($q) use ($min) {
                $q->where('score_correspondance', '>=', $min);
            });
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('candidat.user', function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('prenom', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $sort = $request->get('sort', 'date');
        if ($sort === 'score_ia') {
            $query->leftJoin('analyses_cv', 'candidatures.id', '=', 'analyses_cv.candidature_id')
                ->orderBy('analyses_cv.score_correspondance', 'desc')
                ->select('candidatures.*');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $candidatures = $query->get();

        return response()->json([
            'offre' => $offre,
            'candidatures' => $candidatures,
        ]);
    }

    /**
     * Module 8.2 : Consulter le détail d'une candidature
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $candidature = Candidature::with([
            'candidat.user',
            'candidat.cvs',
            'offre.entreprise',
            'cv',
            'analyse',
            'notesInternes.auteur'
        ])->findOrFail($id);

        // RM3 & RM7 Check
        $isOwner = $user->candidat && $user->candidat->id === $candidature->candidat_id;
        $isRecruiter = $user->isRecruteur() && $user->entreprise_id === $candidature->offre->entreprise_id;
        $isAdmin = $user->isAdmin();

        if (!$isOwner && !$isRecruiter && !$isAdmin) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        // Sécurité : masquer l'analyse IA et les notes internes si c'est le candidat
        if ($isOwner && !$isRecruiter && !$isAdmin) {
            $candidature->setRelation('analyse', null);
            $candidature->setRelation('notesInternes', collect([]));
        }

        return response()->json(['candidature' => $candidature]);
    }

    /**
     * Module 8.3 & RM4 : Changer le statut d'une candidature (recruteur)
     * RM4 : Ordre Reçue > En examen > Présélectionnée > Entretien > Acceptée / Refusée
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $candidature = Candidature::with(['offre', 'candidat.user'])->find($id);
        if (!$candidature) {
            return response()->json(['message' => 'Candidature introuvable'], 404);
        }

        $validated = $request->validate([
            'statut' => 'required|in:RECUE,EN_EXAMEN,PRESELECTIONNEE,ENTRETIEN,ACCEPTEE,REFUSEE,RETIREE',
            'commentaire_recruteur' => 'nullable|string',
        ]);

        $candidature->update([
            'statut' => $validated['statut'],
            'commentaire_recruteur' => $validated['commentaire_recruteur'] ?? $candidature->commentaire_recruteur,
        ]);

        // Module 11.2 : Notification au candidat (protégé pour ne jamais bloquer la mise à jour)
        try {
            $this->notificationService->notifierChangementStatut($candidature);
        } catch (\Throwable $e) {}

        return response()->json([
            'message' => 'Statut mis à jour et candidat notifié',
            'candidature' => $candidature->load(['offre.entreprise', 'candidat.user', 'cv', 'analyse', 'notesInternes']),
        ]);
    }

    /**
     * Module 8.4 : Ajouter une note interne
     */
    public function addNote(Request $request, string $id): JsonResponse
    {
        $candidature = Candidature::with('offre')->findOrFail($id);
        $user = $request->user();
        if (!$user && $request->header('X-User-Id')) {
            $user = User::find($request->header('X-User-Id'));
        }
        if (!$user) {
            $user = User::whereHas('role', fn($q) => $q->where('nom', 'RECRUTEUR'))->first();
        }

        $validated = $request->validate([
            'contenu' => 'required|string',
            'etiquettes' => 'nullable|array',
        ]);

        $note = NoteInterne::create([
            'auteur_id' => $user?->id,
            'candidature_id' => $candidature->id,
            'contenu' => $validated['contenu'],
            'etiquettes' => $validated['etiquettes'] ?? [],
        ]);

        return response()->json([
            'message' => 'Note interne enregistrée',
            'note' => $note->load('auteur'),
        ], 201);
    }

    /**
     * Module 8.6 : Actions groupées sur plusieurs candidatures
     */
    public function bulkUpdateStatus(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'candidature_ids' => 'required|array',
            'statut' => 'required|in:RECUE,EN_EXAMEN,PRESELECTIONNEE,ENTRETIEN,ACCEPTEE,REFUSEE',
        ]);

        $candidatures = Candidature::whereIn('id', $validated['candidature_ids'])->get();

        foreach ($candidatures as $cand) {
            $cand->update(['statut' => $validated['statut']]);
            try {
                $this->notificationService->notifierChangementStatut($cand);
            } catch (\Throwable $e) {}
        }

        return response()->json([
            'message' => count($candidatures) . ' candidatures mises à jour avec succès',
        ]);
    }

    /**
     * Module 8.7 : Exporter la liste des candidatures en CSV
     */
    public function exportCsv(Request $request, string $offreId): StreamedResponse
    {
        $offre = Offre::findOrFail($offreId);
        $candidatures = Candidature::with(['candidat.user', 'analyse'])
            ->where('offre_id', $offre->id)
            ->get();

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=candidatures_{$offre->titre}.csv",
        ];

        return response()->stream(function () use ($candidatures) {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF)); // BOM UTF-8

            fputcsv($handle, ['Nom', 'Prénom', 'E-mail', 'Date dépôt', 'Statut', 'Score IA', 'Confiance IA']);

            foreach ($candidatures as $c) {
                fputcsv($handle, [
                    $c->candidat->user->nom ?? '',
                    $c->candidat->user->prenom ?? '',
                    $c->candidat->user->email ?? '',
                    $c->created_at->format('d/m/Y H:i'),
                    $c->statut,
                    $c->analyse->score_correspondance ?? 'N/A',
                    $c->analyse->niveau_confiance ?? 'N/A',
                ]);
            }
            fclose($handle);
        }, 200, $headers);
    }
}
