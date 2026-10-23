<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Entreprise;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EntrepriseController extends Controller
{
    /**
     * Module 4.4 : Lister, rechercher et filtrer les entreprises
     */
    public function index(Request $request): JsonResponse
    {
        $query = Entreprise::withCount([
            'recruteurs',
            'offres as offres_actives_count' => function ($q) {
                $q->where('statut', 'PUBLIEE');
            }
        ]);

        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }

        if ($request->filled('secteur')) {
            $query->where('secteur', 'like', "%{$request->secteur}%");
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('ville', 'like', "%{$search}%")
                  ->orWhere('secteur', 'like', "%{$search}%");
            });
        }

        $entreprises = $query->orderBy('nom', 'asc')->paginate($request->get('per_page', 12));

        return response()->json($entreprises);
    }

    /**
     * Module 4.1 : Créer une entreprise
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom' => 'required|string|unique:entreprises,nom|max:150',
            'secteur' => 'required|string|max:100',
            'ville' => 'required|string|max:100',
            'pays' => 'nullable|string|max:100',
            'site_web' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'logo_url' => 'nullable|string',
        ]);

        $entreprise = Entreprise::create($validated);

        // Si l'utilisateur est un recruteur sans entreprise, on peut le rattacher automatiquement
        $user = $request->user();
        if ($user && $user->isRecruteur() && !$user->entreprise_id) {
            $user->update(['entreprise_id' => $entreprise->id]);
        }

        return response()->json([
            'message' => 'Entreprise enregistrée avec succès',
            'entreprise' => $entreprise,
        ], 201);
    }

    /**
     * Module 4.2 : Consulter la fiche d'une entreprise et ses offres
     */
    public function show(string $id): JsonResponse
    {
        $entreprise = Entreprise::with(['recruteurs', 'offres' => function ($q) {
            $q->where('statut', 'PUBLIEE')->orderBy('created_at', 'desc');
        }])->withCount('offres')->findOrFail($id);

        return response()->json(['entreprise' => $entreprise]);
    }

    /**
     * Module 4.3 & 4.5 : Modifier les informations d'une entreprise et logo
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $entreprise = Entreprise::findOrFail($id);
        $user = $request->user();

        // RM3 : Vérifier que c'est bien l'entreprise du recruteur (ou admin)
        if ($user && !$user->isAdmin() && $user->entreprise_id !== $entreprise->id) {
            return response()->json(['message' => 'Action non autorisée sur cette entreprise'], 403);
        }

        $validated = $request->validate([
            'nom' => "sometimes|required|string|max:150|unique:entreprises,nom,{$id}",
            'secteur' => 'sometimes|required|string|max:100',
            'ville' => 'sometimes|required|string|max:100',
            'pays' => 'nullable|string|max:100',
            'site_web' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'logo_url' => 'nullable|string',
            'statut' => 'nullable|in:ACTIVE,DESACTIVEE',
        ]);

        $entreprise->update($validated);

        return response()->json([
            'message' => 'Entreprise mise à jour avec succès',
            'entreprise' => $entreprise,
        ]);
    }

    /**
     * Module 4.6 : Désactiver ou supprimer une entreprise
     */
    public function destroy(string $id): JsonResponse
    {
        $entreprise = Entreprise::findOrFail($id);
        $entreprise->update(['statut' => 'DESACTIVEE']);

        return response()->json([
            'message' => 'Entreprise désactivée avec succès',
            'entreprise' => $entreprise,
        ]);
    }
}
