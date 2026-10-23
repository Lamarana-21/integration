<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Candidat;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserController extends Controller
{
    /**
     * Module 1.2 : Lister, rechercher et filtrer les utilisateurs
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with(['role', 'entreprise', 'candidat']);

        if ($request->filled('role')) {
            $query->whereHas('role', function ($q) use ($request) {
                $q->where('nom', $request->role);
            });
        }

        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('prenom', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 15));

        return response()->json($users);
    }

    /**
     * Module 1.1 & 1.7 : Créer un compte recruteur ou administrateur
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role_id' => 'required|uuid|exists:roles,id',
            'entreprise_id' => 'nullable|uuid|exists:entreprises,id',
            'statut' => 'nullable|in:ACTIF,INACTIF',
        ]);

        $user = User::create([
            'nom' => $validated['nom'],
            'prenom' => $validated['prenom'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role_id' => $validated['role_id'],
            'entreprise_id' => $validated['entreprise_id'] ?? null,
            'statut' => $validated['statut'] ?? 'ACTIF',
        ]);

        return response()->json([
            'message' => 'Utilisateur créé avec succès',
            'user' => $user->load(['role', 'entreprise']),
        ], 201);
    }

    /**
     * Module 1.3 : Consulter un compte
     */
    public function show(string $id): JsonResponse
    {
        $user = User::with(['role.permissions', 'entreprise', 'candidat'])->findOrFail($id);

        return response()->json(['user' => $user]);
    }

    /**
     * Module 1.3 & 1.7 : Modifier un compte
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:100',
            'prenom' => 'sometimes|required|string|max:100',
            'email' => "sometimes|required|email|unique:users,email,{$id}",
            'password' => 'nullable|string|min:8',
            'role_id' => 'sometimes|required|uuid|exists:roles,id',
            'entreprise_id' => 'nullable|uuid|exists:entreprises,id',
            'statut' => 'sometimes|required|in:ACTIF,INACTIF',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return response()->json([
            'message' => 'Utilisateur mis à jour avec succès',
            'user' => $user->load(['role', 'entreprise']),
        ]);
    }

    /**
     * Module 1.4 : Activer ou suspendre un compte
     */
    public function toggleStatut(string $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $nouveauStatut = $user->statut === 'ACTIF' ? 'INACTIF' : 'ACTIF';
        $user->update(['statut' => $nouveauStatut]);

        return response()->json([
            'message' => "Le compte est désormais {$nouveauStatut}",
            'user' => $user,
        ]);
    }

    /**
     * Module 1.4 : Supprimer un compte
     */
    public function destroy(string $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json([
            'message' => 'Utilisateur supprimé avec succès',
        ]);
    }
}
