<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Offre;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OffreController extends Controller
{
    /**
     * Module 5.3 & 5.4 : Lister les offres publiées avec filtres et pagination (Public / Candidat)
     * RM1 : Visible uniquement si PUBLIEE et date limite non dépassée
     */
    public function index(Request $request): JsonResponse
    {
        $query = Offre::with(['entreprise', 'auteur'])
            ->withCount('candidatures');

        // Pour un visiteur ou candidat, appliquer strictement RM1
        $user = $request->user();
        if (!$user || $user->isCandidat()) {
            $query->publieesEtActives();
        } else if ($user->isRecruteur() && $request->boolean('mes_offres')) {
            // Filtrer sur son entreprise
            $query->where('entreprise_id', $user->entreprise_id);
        }

        // Filtre par mot-clé (titre, description, compétences)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('titre', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('missions', 'like', "%{$search}%")
                  ->orWhereHas('entreprise', function ($eq) use ($search) {
                      $eq->where('nom', 'like', "%{$search}%");
                  });
            });
        }

        // Filtre par ville
        if ($request->filled('ville')) {
            $query->where('lieu', 'like', "%{$request->ville}%");
        }

        // Filtre par type de contrat (CDI, CDD, STAGE, ALTERNANCE, FREELANCE)
        if ($request->filled('type_contrat')) {
            $types = is_array($request->type_contrat) ? $request->type_contrat : explode(',', $request->type_contrat);
            $query->whereIn('type_contrat', $types);
        }

        // Filtre par entreprise
        if ($request->filled('entreprise_id')) {
            $query->where('entreprise_id', $request->entreprise_id);
        }

        // Filtre par statut (pour recruteurs/admins)
        if ($request->filled('statut') && ($user?->isRecruteur() || $user?->isAdmin())) {
            $query->where('statut', $request->statut);
        }

        // Filtre date de publication (ex: 24h, 7j, 30j)
        if ($request->filled('date_filtre')) {
            if ($request->date_filtre === '24h') {
                $query->where('date_publication', '>=', Carbon::now()->subDay()->toDateString());
            } elseif ($request->date_filtre === '7j') {
                $query->where('date_publication', '>=', Carbon::now()->subDays(7)->toDateString());
            } elseif ($request->date_filtre === '30j') {
                $query->where('date_publication', '>=', Carbon::now()->subDays(30)->toDateString());
            }
        }

        // Tri
        $tri = $request->get('sort', 'recent');
        if ($tri === 'recent') {
            $query->orderBy('created_at', 'desc');
        } elseif ($tri === 'salaire') {
            $query->orderBy('salaire', 'desc');
        }

        $offres = $query->paginate($request->get('per_page', 10));

        return response()->json($offres);
    }

    /**
     * Module 5.1 & 5.2 : Créer une offre (Brouillon ou Publiée)
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isRecruteur() && !$user->isAdmin()) {
            return response()->json(['message' => 'Action réservée aux recruteurs et administrateurs'], 403);
        }

        if (!$user->entreprise_id && !$user->isAdmin()) {
            return response()->json(['message' => 'Veuillez rattacher votre profil à une entreprise avant de publier une offre'], 422);
        }

        $validated = $request->validate([
            'titre' => 'required|string|max:150',
            'description' => 'required|string',
            'missions' => 'nullable|string',
            'competences_requises' => 'nullable|array',
            'type_contrat' => 'required|in:CDI,CDD,STAGE,ALTERNANCE,FREELANCE',
            'lieu' => 'required|string|max:100',
            'salaire' => 'nullable|string|max:100',
            'date_limite' => 'nullable|date|after_or_equal:today',
            'statut' => 'nullable|in:BROUILLON,PUBLIEE',
            'entreprise_id' => 'nullable|uuid|exists:entreprises,id',
        ]);

        $statut = $validated['statut'] ?? 'BROUILLON';
        $entrepriseId = $validated['entreprise_id'] ?? $user->entreprise_id;

        $offre = Offre::create([
            'titre' => $validated['titre'],
            'description' => $validated['description'],
            'missions' => $validated['missions'] ?? null,
            'competences_requises' => $validated['competences_requises'] ?? [],
            'type_contrat' => $validated['type_contrat'],
            'lieu' => $validated['lieu'],
            'salaire' => $validated['salaire'] ?? null,
            'date_publication' => $statut === 'PUBLIEE' ? Carbon::today() : null,
            'date_limite' => $validated['date_limite'] ?? null,
            'statut' => $statut,
            'entreprise_id' => $entrepriseId,
            'auteur_id' => $user->id,
        ]);

        return response()->json([
            'message' => $statut === 'PUBLIEE' ? 'Offre publiée avec succès' : 'Offre enregistrée en brouillon',
            'offre' => $offre->load(['entreprise', 'auteur']),
        ], 201);
    }

    /**
     * Module 5.5 : Consulter le détail d'une offre
     */
    public function show(string $id): JsonResponse
    {
        $offre = Offre::with(['entreprise', 'auteur'])
            ->withCount('candidatures')
            ->findOrFail($id);

        return response()->json(['offre' => $offre]);
    }

    /**
     * Module 5.6 & RM3 : Modifier une offre
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $offre = Offre::findOrFail($id);
        $user = $request->user();

        // RM3 : Seul un recruteur de l'entreprise modifie ses offres
        if (!$user->isAdmin() && ($user->entreprise_id !== $offre->entreprise_id || $user->id !== $offre->auteur_id)) {
            return response()->json(['message' => 'Action non autorisée sur cette offre'], 403);
        }

        $validated = $request->validate([
            'titre' => 'sometimes|required|string|max:150',
            'description' => 'sometimes|required|string',
            'missions' => 'nullable|string',
            'competences_requises' => 'nullable|array',
            'type_contrat' => 'sometimes|required|in:CDI,CDD,STAGE,ALTERNANCE,FREELANCE',
            'lieu' => 'sometimes|required|string|max:100',
            'salaire' => 'nullable|string|max:100',
            'date_limite' => 'nullable|date',
            'statut' => 'nullable|in:BROUILLON,PUBLIEE,CLOTUREE,ARCHIVEE',
        ]);

        if (isset($validated['statut']) && $validated['statut'] === 'PUBLIEE' && !$offre->date_publication) {
            $validated['date_publication'] = Carbon::today();
        }

        $offre->update($validated);

        return response()->json([
            'message' => 'Offre mise à jour avec succès',
            'offre' => $offre->load(['entreprise', 'auteur']),
        ]);
    }

    /**
     * Publier une offre en brouillon
     */
    public function publish(string $id): JsonResponse
    {
        $offre = Offre::findOrFail($id);
        $offre->update([
            'statut' => 'PUBLIEE',
            'date_publication' => Carbon::today(),
        ]);

        return response()->json([
            'message' => 'Offre publiée avec succès',
            'offre' => $offre,
        ]);
    }

    /**
     * Module 5.7 & RM6 : Clôturer une offre
     * RM6 : La clôture d'une offre ne supprime pas ses candidatures
     */
    public function close(string $id): JsonResponse
    {
        $offre = Offre::findOrFail($id);
        $offre->update(['statut' => 'CLOTUREE']);

        return response()->json([
            'message' => 'Offre clôturée avec succès',
            'offre' => $offre,
        ]);
    }

    /**
     * Module 5.8 : Dupliquer une offre
     */
    public function duplicate(Request $request, string $id): JsonResponse
    {
        $source = Offre::findOrFail($id);
        $user = $request->user();

        $clone = $source->replicate();
        $clone->titre = "Copie de {$source->titre}";
        $clone->statut = 'BROUILLON';
        $clone->date_publication = null;
        $clone->auteur_id = $user->id;
        $clone->save();

        return response()->json([
            'message' => 'Offre dupliquée en brouillon',
            'offre' => $clone->load('entreprise'),
        ], 201);
    }

    /**
     * Supprimer une offre
     */
    public function destroy(string $id): JsonResponse
    {
        $offre = Offre::findOrFail($id);
        $offre->delete();

        return response()->json(['message' => 'Offre supprimée']);
    }
}
