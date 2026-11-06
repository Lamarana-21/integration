<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Candidat;
use App\Models\Entreprise;
use App\Models\Role;
use App\Models\User;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Module 3.1 : Inscription publique (exclusivement réservée aux Candidats)
     * Règle métier : Les comptes Recruteurs et Administrateurs sont créés par l'Administrateur
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'email' => 'required|string|email|max:150|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => 'nullable|string',
            'titre' => 'nullable|string|max:150',
            'telephone' => 'nullable|string|max:50',
            'ville' => 'nullable|string|max:100',
        ]);

        // Vérification stricte : Seuls les candidats peuvent s'inscrire publiquement
        if ($request->filled('role') && strtoupper($request->input('role')) !== 'CANDIDAT') {
            return response()->json([
                'success' => false,
                'message' => 'L\'inscription directe est exclusivement réservée aux candidats. Les comptes recruteurs sont créés par l\'administrateur.',
            ], 403);
        }

        $roleName = 'CANDIDAT';
        $role = Role::firstOrCreate(
            ['nom' => 'CANDIDAT'],
            ['description' => 'Candidat postulant aux offres et gérant ses CV']
        );

        $user = User::create([
            'nom' => $validated['nom'],
            'prenom' => $validated['prenom'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role_id' => $role->id,
            'entreprise_id' => null,
            'statut' => 'ACTIF',
            'derniere_connexion' => Carbon::now(),
        ]);

        if ($roleName === 'CANDIDAT') {
            Candidat::create([
                'utilisateur_id' => $user->id,
                'nom' => $validated['nom'],
                'prenom' => $validated['prenom'],
                'titre' => $request->input('titre', 'Développeur Web Full Stack'),
                'telephone' => $request->input('telephone'),
                'ville' => $request->input('ville', 'Tunis'),
                'pays' => 'Tunisie',
                'competences' => ['React', 'Node.js', 'SQL', 'TypeScript'],
                'experiences' => [],
                'formations' => [],
                'langues' => ['Français', 'Anglais'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Inscription réussie',
            'user' => $user->load(['role', 'entreprise', 'candidat']),
            'token' => $token,
        ], 201);
    }

    /**
     * Module 3.2 : Connexion avec e-mail et mot de passe
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::with(['role.permissions', 'entreprise', 'candidat.cvs'])->where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Les identifiants fournis sont incorrects.'],
            ]);
        }

        // RM10 : Un compte {Inactif} ne peut pas se connecter
        if ($user->statut === 'INACTIF') {
            return response()->json([
                'message' => 'Votre compte est suspendu ou inactif. Veuillez contacter un administrateur.',
            ], 403);
        }

        $user->update(['derniere_connexion' => Carbon::now()]);
        $token = $user->createToken('auth_token')->plainTextToken;

        if ($user->candidat) {
            if (empty($user->candidat->nom) || empty($user->candidat->prenom)) {
                $user->candidat->update(['nom' => $user->nom, 'prenom' => $user->prenom]);
            }
            $user->candidat->setRelation('user', $user);
        }

        return response()->json([
            'message' => 'Connexion réussie',
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * Module 3.3 : Déconnexion
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Déconnexion effectuée avec succès',
        ]);
    }

    /**
     * Profil personnel connecté
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['role.permissions', 'entreprise', 'candidat.cvs']);
        if ($user->candidat) {
            $user->candidat->setRelation('user', $user);
        }

        return response()->json([
            'user' => $user,
        ]);
    }

    /**
     * Module 3.5 : Mot de passe oublié
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        if ($user) {
            $resetToken = Str::random(40);
            $this->notificationService->notifierReinitialisationMdp($user, $resetToken);
        }

        return response()->json([
            'message' => 'Si l\'adresse existe, un lien de réinitialisation vous a été envoyé par e-mail.',
        ]);
    }

    /**
     * Modifier son profil personnel (Module 1.5)
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:100',
            'prenom' => 'sometimes|required|string|max:100',
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Profil mis à jour',
            'user' => $user,
        ]);
    }

    /**
     * Changer son mot de passe (Module 1.6)
     */
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'ancien_mot_de_passe' => 'required|string',
            'nouveau_mot_de_passe' => 'required|string|min:8|different:ancien_mot_de_passe',
        ]);

        $user = $request->user();

        if (!Hash::check($request->ancien_mot_de_passe, $user->password)) {
            throw ValidationException::withMessages([
                'ancien_mot_de_passe' => ['L\'ancien mot de passe est incorrect.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($request->nouveau_mot_de_passe),
        ]);

        return response()->json([
            'message' => 'Mot de passe modifié avec succès',
        ]);
    }
}
