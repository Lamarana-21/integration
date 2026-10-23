<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Candidature;
use App\Models\Cv;
use App\Models\NoteInterne;
use App\Models\Offre;
use App\Services\AiCvAnalysisService;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CandidatureController extends Controller
{
    protected AiCvAnalysisService $aiService;
    protected NotificationService $notificationService;

    public function __construct(AiCvAnalysisService $aiService, NotificationService $notificationService)
    {
        $this->aiService = $aiService;
        $this->notificationService = $notificationService;
    }

    /**
     * Module 7.1, 7.2, 7.3 : Postuler à une offre
     * RM1 : Offre doit être PUBLIEE et date_limite non dépassée
     * RM2 : Empêcher une double candidature à la même offre
     */
    public function postuler(Request $request, string $offreId): JsonResponse
    {
        $user = $request->user();
        $candidat = $user->candidat;

        if (!$candidat) {
            return response()->json(['message' => 'Profil candidat introuvable. Veuillez compléter votre profil.'], 403);
        }

        $offre = Offre::findOrFail($offreId);

        // RM1 Check
        if ($offre->statut !== 'PUBLIEE' || $offre->isExpired()) {
            return response()->json(['message' => 'Cette offre n’est plus disponible aux candidatures.'], 422);
        }

        // RM2 Check : Double candidature interdite
        $alreadyApplied = Candidature::where('candidat_id', $candidat->id)
            ->where('offre_id', $offre->id)
            ->exists();

        if ($alreadyApplied) {
            return response()->json(['message' => 'Vous avez déjà postulé à cette offre.'], 422);
        }

        $validated = $request->validate([
            'cv_id' => 'required|uuid|exists:cvs,id',
            'lettre_motivation' => 'nullable|string',
            'message' => 'nullable|string',
        ]);

        $cv = Cv::where('id', $validated['cv_id'])
            ->where('candidat_id', $candidat->id)
            ->firstOrFail();

        // Créer la candidature (statut initial : RECUE)
        $candidature = Candidature::create([
            'candidat_id' => $candidat->id,
            'offre_id' => $offre->id,
            'cv_id' => $cv->id,
            'lettre_motivation' => $validated['lettre_motivation'] ?? null,
            'message' => $validated['message'] ?? null,
            'statut' => 'RECUE',
            'commentaire_recruteur' => null,
        ]);

        // Lancer l'analyse IA du CV par rapport à l'offre (Module 9)
        try {
            $this->aiService->analyser($cv, $candidature);
        } catch (\Exception $e) {
            // L'échec de l'IA ne bloque pas la candidature
        }

        // Notifications automatiques (Module 11.1 & 11.3)
        $this->notificationService->notifierConfirmationDepot($candidature);
        $this->notificationService->notifierNouvelleCandidature($candidature);

        return response()->json([
            'message' => 'Votre candidature a été transmise avec succès !',
            'candidature' => $candidature->load(['offre.entreprise', 'cv', 'analyse']),
        ], 201);
    }

    /**
     * Module 7.4 & 7.6 : Suivre le statut de ses candidatures (candidat connecté)
     */
    public function mesCandidatures(Request $request): JsonResponse
    {
        $user = $request->user();
        $candidat = $user->candidat;

        if (!$candidat) {
            return response()->json(['candidatures' => []]);
        }

        $query = Candidature::with(['offre.entreprise', 'cv'])
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
        $candidature = Candidature::findOrFail($id);

        if ($candidature->candidat_id !== $user->candidat?->id) {
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
        $candidature = Candidature::with(['offre', 'candidat.user'])->findOrFail($id);
        $user = $request->user();

        if (!$user->isAdmin() && $user->entreprise_id !== $candidature->offre->entreprise_id) {
            return response()->json(['message' => 'Action non autorisée'], 403);
        }

        $validated = $request->validate([
            'statut' => 'required|in:RECUE,EN_EXAMEN,PRESELECTIONNEE,ENTRETIEN,ACCEPTEE,REFUSEE,RETIREE',
            'commentaire_recruteur' => 'nullable|string',
        ]);

        $candidature->update([
            'statut' => $validated['statut'],
            'commentaire_recruteur' => $validated['commentaire_recruteur'] ?? $candidature->commentaire_recruteur,
        ]);

        // Module 11.2 : Notification par email au candidat
        $this->notificationService->notifierChangementStatut($candidature);

        return response()->json([
            'message' => 'Statut mis à jour et candidat notifié',
            'candidature' => $candidature->load(['analyse', 'notesInternes']),
        ]);
    }

    /**
     * Module 8.4 : Ajouter une note interne
     */
    public function addNote(Request $request, string $id): JsonResponse
    {
        $candidature = Candidature::with('offre')->findOrFail($id);
        $user = $request->user();

        if (!$user->isAdmin() && $user->entreprise_id !== $candidature->offre->entreprise_id) {
            return response()->json(['message' => 'Action non autorisée'], 403);
        }

        $validated = $request->validate([
            'contenu' => 'required|string',
            'etiquettes' => 'nullable|array',
        ]);

        $note = NoteInterne::create([
            'auteur_id' => $user->id,
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
            'candidature_ids.*' => 'uuid|exists:candidatures,id',
            'statut' => 'required|in:EN_EXAMEN,PRESELECTIONNEE,ENTRETIEN,REFUSEE',
        ]);

        $user = $request->user();

        $candidatures = Candidature::whereIn('id', $validated['candidature_ids'])
            ->whereHas('offre', function ($q) use ($user) {
                if (!$user->isAdmin()) {
                    $q->where('entreprise_id', $user->entreprise_id);
                }
            })->get();

        foreach ($candidatures as $cand) {
            $cand->update(['statut' => $validated['statut']]);
            $this->notificationService->notifierChangementStatut($cand);
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
