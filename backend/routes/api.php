<?php

use App\Http\Controllers\Api\AnalyseCvController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CandidatController;
use App\Http\Controllers\Api\CandidatureController;
use App\Http\Controllers\Api\CvController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\EntrepriseController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OffreController;
use App\Http\Controllers\Api\RolePermissionController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes API - Projet Recrutement Intelligent
| Architecture modulaire et respect strict du cahier des charges
|--------------------------------------------------------------------------
*/

// --- 1. Authentification & Accès Public (Module 3) ---
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::put('/change-password', [AuthController::class, 'changePassword']);
    });
});

// --- 2. Offres Publiques & Recherche (Module 5) ---
Route::get('/jobs', [OffreController::class, 'index']);
Route::get('/jobs/{id}', [OffreController::class, 'show']);
Route::get('/companies', [EntrepriseController::class, 'index']);
Route::get('/companies/{id}', [EntrepriseController::class, 'show']);

// --- 3. Routes Protégées par Authentification Sanctum ---
Route::middleware('auth:sanctum')->group(function () {

    // --- Module 1 : Utilisateurs (Admin & Profil) ---
    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index'])->middleware('permission:VOIR_UTILISATEURS');
        Route::post('/', [UserController::class, 'store'])->middleware('permission:CREER_UTILISATEUR');
        Route::get('/{id}', [UserController::class, 'show']);
        Route::patch('/{id}', [UserController::class, 'update'])->middleware('permission:MODIFIER_UTILISATEUR');
        Route::patch('/{id}/toggle-statut', [UserController::class, 'toggleStatut'])->middleware('permission:SUSPENDRE_UTILISATEUR');
        Route::delete('/{id}', [UserController::class, 'destroy'])->middleware('permission:SUPPRIMER_UTILISATEUR');
    });

    // --- Module 2 : Droits, Rôles et Permissions ---
    Route::prefix('roles')->middleware('permission:GERER_ROLES')->group(function () {
        Route::get('/', [RolePermissionController::class, 'getRoles']);
        Route::post('/', [RolePermissionController::class, 'storeRole']);
        Route::patch('/{id}', [RolePermissionController::class, 'updateRole']);
        Route::delete('/{id}', [RolePermissionController::class, 'deleteRole']);
        Route::put('/{id}/permissions', [RolePermissionController::class, 'updateRolePermissions']);
    });
    Route::get('/permissions', [RolePermissionController::class, 'getPermissions'])->middleware('permission:GERER_PERMISSIONS');

    // --- Module 4 : Entreprises ---
    Route::prefix('companies')->group(function () {
        Route::post('/', [EntrepriseController::class, 'store'])->middleware('permission:CREER_ENTREPRISE');
        Route::patch('/{id}', [EntrepriseController::class, 'update'])->middleware('permission:MODIFIER_ENTREPRISE');
        Route::delete('/{id}', [EntrepriseController::class, 'destroy'])->middleware('permission:DESACTIVER_ENTREPRISE');
    });

    // --- Module 5 : Offres (Recruteurs & Admin) ---
    Route::prefix('jobs')->group(function () {
        Route::post('/', [OffreController::class, 'store'])->middleware('permission:CREER_OFFRE');
        Route::patch('/{id}', [OffreController::class, 'update'])->middleware('permission:MODIFIER_OFFRE');
        Route::post('/{id}/publish', [OffreController::class, 'publish'])->middleware('permission:PUBLIER_OFFRE');
        Route::post('/{id}/close', [OffreController::class, 'close'])->middleware('permission:CLOTURER_OFFRE');
        Route::post('/{id}/duplicate', [OffreController::class, 'duplicate'])->middleware('permission:CREER_OFFRE');
        Route::delete('/{id}', [OffreController::class, 'destroy'])->middleware('permission:SUPPRIMER_OFFRE');

        // Candidatures pour cette offre
        Route::post('/{id}/applications', [CandidatureController::class, 'postuler'])->middleware('permission:POSTULER');
        Route::get('/{id}/applications', [CandidatureController::class, 'indexByOffre'])->middleware('permission:VOIR_CANDIDATURES');
        Route::get('/{id}/applications/export', [CandidatureController::class, 'exportCsv'])->middleware('permission:VOIR_CANDIDATURES');
    });

    // --- Module 6 : Candidats & CV ---
    Route::prefix('candidates')->group(function () {
        Route::get('/', [CandidatController::class, 'index'])->middleware('permission:VOIR_CANDIDAT');
        Route::get('/{id}', [CandidatController::class, 'show']);
        Route::put('/profile', [CandidatController::class, 'updateProfile']);
        Route::delete('/my-data', [CandidatController::class, 'deleteMyData'])->middleware('permission:SUPPRIMER_DONNEES_CANDIDAT');
        Route::post('/cvs', [CvController::class, 'store']);
    });
    Route::get('/cvs/{id}/download', [CvController::class, 'download']);
    Route::delete('/cvs/{id}', [CvController::class, 'destroy']);

    // --- Module 7 & 8 : Candidatures ---
    Route::prefix('applications')->group(function () {
        Route::get('/my', [CandidatureController::class, 'mesCandidatures']);
        Route::get('/{id}', [CandidatureController::class, 'show']);
        Route::delete('/{id}', [CandidatureController::class, 'retirer'])->middleware('permission:RETIRER_CANDIDATURE');
        Route::patch('/{id}/status', [CandidatureController::class, 'updateStatus'])->middleware('permission:CHANGER_STATUT');
        Route::post('/{id}/notes', [CandidatureController::class, 'addNote'])->middleware('permission:AJOUTER_NOTE');
        Route::post('/bulk-status', [CandidatureController::class, 'bulkUpdateStatus'])->middleware('permission:CHANGER_STATUT');
    });

    // --- Module 9 : Analyse IA ---
    Route::prefix('analyses')->group(function () {
        Route::post('/{id}/relancer', [AnalyseCvController::class, 'relancer'])->middleware('permission:LANCER_ANALYSE');
        Route::patch('/{id}', [AnalyseCvController::class, 'corriger'])->middleware('permission:CORRIGER_ANALYSE');
        Route::post('/{id}/valider', [AnalyseCvController::class, 'valider'])->middleware('permission:CORRIGER_ANALYSE');
    });

    // --- Module 10 : Tableaux de bord ---
    Route::prefix('dashboard')->group(function () {
        Route::get('/recruiter', [DashboardController::class, 'recruiter'])->middleware('permission:VOIR_DASHBOARD_RECRUTEUR');
        Route::get('/admin', [DashboardController::class, 'admin'])->middleware('permission:VOIR_DASHBOARD_ADMIN');
    });

    // --- Module 11 : Notifications ---
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::post('/{id}/resend', [NotificationController::class, 'resend']);
        Route::get('/templates', [NotificationController::class, 'getTemplates']);
    });
});
