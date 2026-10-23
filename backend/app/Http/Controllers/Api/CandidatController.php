<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Candidat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CandidatController extends Controller
{
    /**
     * Module 6.4 : Lister, rechercher et filtrer les candidats (pour recruteurs)
     */
    public function index(Request $request): JsonResponse
    {
        $query = Candidat::with(['user', 'cvs']);

        if ($request->filled('ville')) {
            $query->where('ville', 'like', "%{$request->ville}%");
        }

        if ($request->filled('competence')) {
            $comp = $request->competence;
            $query->whereJsonContains('competences', $comp);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('ville', 'like', "%{$search}%")
                  ->orWhere('resume', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('nom', 'like', "%{$search}%")
                         ->orWhere('prenom', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        $candidats = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 15));

        return response()->json($candidats);
    }

    /**
     * Module 6.3 & 6.5 : Consulter la fiche d'un candidat et son historique
     */
    public function show(string $id): JsonResponse
    {
        $candidat = Candidat::with([
            'user',
            'cvs',
            'candidatures.offre.entreprise',
            'candidatures.analyse'
        ])->findOrFail($id);

        return response()->json(['candidat' => $candidat]);
    }

    /**
     * Module 6.1 : Créer et compléter son profil candidat
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $candidat = Candidat::firstOrCreate(['utilisateur_id' => $user->id]);

        $validated = $request->validate([
            'telephone' => 'nullable|string|max:30',
            'ville' => 'nullable|string|max:100',
            'resume' => 'nullable|string',
            'competences' => 'nullable|array',
            'experiences' => 'nullable|array',
            'formations' => 'nullable|array',
            'langues' => 'nullable|array',
            'disponibilite' => 'nullable|date',
            // Info utilisateur
            'nom' => 'sometimes|required|string|max:100',
            'prenom' => 'sometimes|required|string|max:100',
        ]);

        if (isset($validated['nom']) || isset($validated['prenom'])) {
            $user->update([
                'nom' => $validated['nom'] ?? $user->nom,
                'prenom' => $validated['prenom'] ?? $user->prenom,
            ]);
        }

        $candidat->update([
            'telephone' => $validated['telephone'] ?? $candidat->telephone,
            'ville' => $validated['ville'] ?? $candidat->ville,
            'resume' => $validated['resume'] ?? $candidat->resume,
            'competences' => $validated['competences'] ?? $candidat->competences,
            'experiences' => $validated['experiences'] ?? $candidat->experiences,
            'formations' => $validated['formations'] ?? $candidat->formations,
            'langues' => $validated['langues'] ?? $candidat->langues,
            'disponibilite' => $validated['disponibilite'] ?? $candidat->disponibilite,
        ]);

        return response()->json([
            'message' => 'Profil candidat mis à jour avec succès',
            'candidat' => $candidat->load(['user', 'cvs']),
        ]);
    }

    /**
     * Module 6.7 : Supprimer son profil et ses données personnelles (RGPD)
     */
    public function deleteMyData(Request $request): JsonResponse
    {
        $user = $request->user();
        $candidat = $user->candidat;

        if ($candidat) {
            $candidat->candidatures()->delete();
            $candidat->cvs()->delete();
            $candidat->delete();
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json([
            'message' => 'Toutes vos données ont été définitivement supprimées de la plateforme',
        ]);
    }
}
