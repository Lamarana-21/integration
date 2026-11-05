<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Candidat;
use App\Models\Entreprise;
use App\Models\Role;
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
     * Module 1.1 & 1.7 : Créer un compte candidat, recruteur ou administrateur
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role_id' => 'nullable|string',
            'role' => 'nullable|string|in:CANDIDAT,RECRUTEUR,ADMIN',
            'entreprise_id' => 'nullable|string',
            'entreprise_nom' => 'nullable|string|max:150',
            'statut' => 'nullable|in:ACTIF,INACTIF',
            'titre' => 'nullable|string|max:150',
            'telephone' => 'nullable|string|max:50',
            'ville' => 'nullable|string|max:100',
        ]);

        $roleName = $request->filled('role') ? strtoupper($request->input('role')) : null;
        $roleId = $request->input('role_id');

        if (!$roleId && $roleName) {
            $roleObj = Role::firstOrCreate(
                ['nom' => $roleName],
                ['description' => "Rôle {$roleName} sur Talenta"]
            );
            $roleId = $roleObj->id;
        } elseif ($roleId) {
            $roleObj = Role::find($roleId);
            if ($roleObj) {
                $roleName = $roleObj->nom;
            }
        } else {
            $roleObj = Role::firstOrCreate(
                ['nom' => 'RECRUTEUR'],
                ['description' => 'Recruteur d\'entreprise']
            );
            $roleId = $roleObj->id;
            $roleName = 'RECRUTEUR';
        }

        $entrepriseId = $request->input('entreprise_id');
        if ($roleName === 'RECRUTEUR') {
            if (!$entrepriseId && $request->filled('entreprise_nom')) {
                $ent = Entreprise::firstOrCreate(
                    ['nom' => trim($request->input('entreprise_nom'))],
                    [
                        'secteur' => 'Technologies & Conseil',
                        'ville' => $request->input('ville', 'Tunis'),
                        'pays' => 'Tunisie',
                        'statut' => 'ACTIVE',
                    ]
                );
                $entrepriseId = $ent->id;
            } elseif (!$entrepriseId) {
                $firstEnt = Entreprise::first();
                $entrepriseId = $firstEnt?->id;
            }
        }

        $user = User::create([
            'nom' => $validated['nom'],
            'prenom' => $validated['prenom'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role_id' => $roleId,
            'entreprise_id' => $entrepriseId,
            'statut' => $validated['statut'] ?? 'ACTIF',
            'derniere_connexion' => null,
        ]);

        if ($roleName === 'CANDIDAT') {
            Candidat::create([
                'utilisateur_id' => $user->id,
                'nom' => $validated['nom'],
                'prenom' => $validated['prenom'],
                'titre' => $request->input('titre', 'Candidat'),
                'telephone' => $request->input('telephone'),
                'ville' => $request->input('ville', 'Tunis'),
                'pays' => 'Tunisie',
                'competences' => ['React', 'Node.js', 'SQL', 'TypeScript'],
                'experiences' => [],
                'formations' => [],
                'langues' => ['Français', 'Anglais'],
            ]);
        }

        return response()->json([
            'message' => 'Utilisateur créé avec succès dans la base de données',
            'user' => $user->load(['role', 'entreprise', 'candidat']),
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
     * Module 1.3 & 1.7 : Modifier un compte / Récupération de compte
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $rules = [
            'nom' => 'sometimes|required|string|max:100',
            'prenom' => 'sometimes|required|string|max:100',
            'email' => "sometimes|required|email|unique:users,email,{$id}",
            'password' => 'nullable|string|min:8',
            'role' => 'nullable|string|in:CANDIDAT,RECRUTEUR,ADMIN',
            'role_id' => 'nullable|uuid|exists:roles,id',
            'statut' => 'sometimes|required|in:ACTIF,INACTIF',
            'titre' => 'nullable|string|max:150',
            'telephone' => 'nullable|string|max:30',
            'ville' => 'nullable|string|max:100',
        ];

        $detachEntreprise = false;
        if ($request->has('entreprise_id')) {
            $rawEnt = $request->input('entreprise_id');
            if ($rawEnt === null || $rawEnt === '' || $rawEnt === 'null' || $rawEnt === 'none') {
                $detachEntreprise = true;
            } else {
                $rules['entreprise_id'] = 'required|uuid|exists:entreprises,id';
            }
        }

        $validated = $request->validate($rules);

        if ($detachEntreprise) {
            $user->entreprise_id = null;
            $user->save();
        }

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        if (!empty($validated['role'])) {
            $roleObj = Role::where('nom', $validated['role'])->first();
            if ($roleObj) {
                $validated['role_id'] = $roleObj->id;
            }
            unset($validated['role']);
        }

        // Extraction des champs spécifiques au candidat
        $titre = $validated['titre'] ?? null;
        $telephone = $validated['telephone'] ?? null;
        $ville = $validated['ville'] ?? null;
        unset($validated['titre'], $validated['telephone'], $validated['ville']);

        $user->update($validated);

        // Mise à jour ou création du profil candidat associé
        if ($user->role?->nom === 'CANDIDAT' || $user->candidat) {
            $candData = [
                'nom' => $user->nom,
                'prenom' => $user->prenom,
            ];
            if ($titre !== null) $candData['titre'] = $titre;
            if ($telephone !== null) $candData['telephone'] = $telephone;
            if ($ville !== null) $candData['ville'] = $ville;

            if ($user->candidat) {
                $user->candidat->update($candData);
            } else {
                Candidat::create(array_merge([
                    'utilisateur_id' => $user->id,
                    'pays' => 'Tunisie',
                    'competences' => ['React', 'Node.js', 'SQL', 'TypeScript'],
                    'experiences' => [],
                    'formations' => [],
                    'langues' => ['Français', 'Anglais'],
                ], $candData));
            }
        }

        return response()->json([
            'message' => 'Informations du compte mises à jour avec succès',
            'user' => $user->load(['role', 'entreprise', 'candidat']),
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
