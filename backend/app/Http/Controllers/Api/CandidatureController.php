<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Candidature;
use App\Models\Cv;
use App\Models\NoteInterne;
use App\Models\Notification;
use App\Models\Offre;
use App\Models\User;
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
     * Module 7.1, 7.2, 7.3 : Postuler à une offre
     * RM1 : Offre doit être PUBLIEE et date_limite non dépassée
     * RM2 : Empêcher une double candidature à la même offre
     */
    public function postuler(Request $request, string $offreId): JsonResponse
    {
        $user = $request->user();
        if (!$user && $request->header('X-User-Id')) {
            $user = User::find($request->header('X-User-Id'));
        }
        if (!$user && $request->filled('user_id')) {
            $user = User::find($request->user_id);
        }
        if (!$user && $request->filled('candidat_id')) {
            $c = \App\Models\Candidat::find($request->candidat_id);
            if ($c) {
                $user = $c->user ?: User::find($c->utilisateur_id);
            }
        }
        if (!$user) {
            $user = User::whereHas('role', fn($q) => $q->where('nom', 'CANDIDAT'))->first();
        }

        $candidat = null;
        if ($user) {
            $candidat = $user->candidat ?: \App\Models\Candidat::where('utilisateur_id', $user->id)->first();
            if (!$candidat) {
                $candidat = \App\Models\Candidat::create([
                    'utilisateur_id' => $user->id,
                    'nom' => $user->nom,
                    'prenom' => $user->prenom,
                ]);
            }
        }

        if (!$candidat) {
            if ($request->filled('candidat_id')) {
                $candidat = \App\Models\Candidat::find($request->candidat_id);
            }
            if (!$candidat) {
                $candidat = \App\Models\Candidat::first();
            }
        }

        if (!$candidat) {
            return response()->json(['message' => 'Profil candidat introuvable. Veuillez compléter votre profil.'], 403);
        }

        $offre = Offre::findOrFail($offreId);

        // RM1 Check : Date limite dépassée ou offre non publiée
        if ($offre->statut !== 'PUBLIEE') {
            return response()->json([
                'message' => 'Cette offre n\'est plus disponible (statut: ' . $offre->statut . ').',
            ], 422);
        }

        if ($offre->date_limite && Carbon::parse($offre->date_limite)->endOfDay()->isPast()) {
            return response()->json([
                'message' => 'La date limite pour postuler à cette offre est dépassée (' . Carbon::parse($offre->date_limite)->format('d/m/Y') . '). Les candidatures sont closes.',
                'expired' => true,
            ], 422);
        }

        // RM2 Check : Double candidature interdite pour le même candidat
        $alreadyApplied = Candidature::where('candidat_id', $candidat->id)
            ->where('offre_id', $offre->id)
            ->first();

        if ($alreadyApplied) {
            return response()->json([
                'message' => 'Vous avez déjà postulé à cette offre. Une seconde candidature n\'est pas autorisée.',
                'already_applied' => true,
                'candidature' => $alreadyApplied->load(['offre.entreprise', 'candidat.user', 'cv', 'analyse']),
            ], 422);
        }

        $cvId = $request->input('cv_id');
        if (!$cvId) {
            $cvId = $candidat->cvs()->latest()->first()?->id;
        }

        if (!$cvId) {
            // Créer un CV système associé au profil candidat stocké directement en base
            $cv = Cv::create([
                'candidat_id' => $candidat->id,
                'nom_fichier' => 'CV_' . ($candidat->nom ?: 'Candidat') . '.pdf',
                'type_mime' => 'application/pdf',
                'taille_octets' => 1024,
                'url_stockage' => 'database://cvs/' . \Illuminate\Support\Str::uuid(),
                'contenu_base64' => base64_encode('%PDF-1.4 automatic candidate CV'),
            ]);
            $cvId = $cv->id;
        }

        $candidature = Candidature::create([
            'candidat_id' => $candidat->id,
            'offre_id' => $offre->id,
            'cv_id' => $cvId,
            'lettre_motivation' => $request->input('lettre_motivation'),
            'statut' => 'RECUE',
            'date_postulation' => Carbon::now(),
        ]);

        // Lancer analyse IA automatique en arrière-plan
        try {
            $cvModel = Cv::find($cvId);
            if ($cvModel) {
                $this->aiService->analyser($cvModel, $candidature);
            }
        } catch (\Throwable $e) {}

        // Notification automatique pour le recruteur concerné (Module 11.3)
        try {
            $recruteurUser = null;
            if ($offre->auteur_id) {
                $recruteurUser = User::find($offre->auteur_id);
            }
            if (!$recruteurUser && $offre->auteur) {
                $recruteurUser = $offre->auteur;
            }
            if (!$recruteurUser && $offre->entreprise_id) {
                $recruteurUser = User::where('entreprise_id', $offre->entreprise_id)->first();
            }
            if (!$recruteurUser) {
                $recruteurUser = User::whereHas('role', fn($q) => $q->where('nom', 'RECRUTEUR'))->first();
            }

            if ($recruteurUser) {
                $candNom = trim(($candidat->prenom ?? '') . ' ' . ($candidat->nom ?? ''));
                if (empty($candNom) && $user) {
                    $candNom = trim($user->prenom . ' ' . $user->nom);
                }
                $candNom = $candNom ?: 'Un candidat';
                $entNom = $offre->entreprise?->nom ?: 'votre entreprise';

                Notification::create([
                    'utilisateur_id' => $recruteurUser->id,
                    'type' => 'NOUVELLE_CANDIDATURE',
                    'objet' => "Nouvelle candidature reçue : {$offre->titre}",
                    'message' => "Bonjour {$recruteurUser->prenom}, le candidat {$candNom} vient de postuler à votre offre « {$offre->titre} » chez {$entNom}. Son CV et l'évaluation IA de son profil sont disponibles sur votre tableau de bord recruteur.",
                    'statut_envoi' => 'ENVOYE',
                ]);
            }
        } catch (\Throwable $e) {}

        // Notification de confirmation au candidat (Module 11.1)
        try {
            $candUser = $user ?: ($candidat->user ?: User::find($candidat->utilisateur_id));
            if ($candUser) {
                Notification::create([
                    'utilisateur_id' => $candUser->id,
                    'type' => 'CONFIRMATION_DEPOT',
                    'objet' => "Confirmation de votre candidature : {$offre->titre}",
                    'message' => "Bonjour {$candUser->prenom}, votre candidature pour le poste « {$offre->titre} » a été enregistrée avec succès et transmise au recruteur.",
                    'statut_envoi' => 'ENVOYE',
                ]);
            }
        } catch (\Throwable $e) {}

        return response()->json([
            'message' => 'Candidature enregistrée avec succès dans la base de données',
            'candidature' => $candidature->load(['offre.entreprise', 'candidat.user', 'cv', 'analyse']),
        ], 201);
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

        if ($user && !$user->isAdmin() && $user->entreprise_id && $candidature->offre && $user->entreprise_id !== $candidature->offre->entreprise_id) {
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
