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
    Route::post('/login', [AuthController::class, 'login'])->name('login');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::put('/change-password', [AuthController::class, 'changePassword']);
    });
});

// --- 2. Offres Publiques, Recherche, Candidatures & Gestion Utilisateurs ---
Route::get('/jobs', [OffreController::class, 'index']);
Route::post('/jobs', [OffreController::class, 'store']);
Route::get('/jobs/{id}', [OffreController::class, 'show']);
Route::patch('/jobs/{id}', [OffreController::class, 'update']);
Route::post('/jobs/{id}/publish', [OffreController::class, 'publish']);
Route::post('/jobs/{id}/close', [OffreController::class, 'close']);
Route::delete('/jobs/{id}', [OffreController::class, 'destroy']);

// Candidatures
Route::get('/applications', [CandidatureController::class, 'index']);
Route::get('/applications/my', [CandidatureController::class, 'mesCandidatures']);
Route::post('/jobs/{id}/applications', [CandidatureController::class, 'postuler']);
Route::patch('/applications/{id}/status', [CandidatureController::class, 'updateStatus']);
Route::delete('/applications/{id}', [CandidatureController::class, 'retirer']);

Route::get('/companies', [EntrepriseController::class, 'index']);
Route::post('/companies', [EntrepriseController::class, 'store']);
Route::get('/companies/{id}', [EntrepriseController::class, 'show']);
Route::patch('/companies/{id}', [EntrepriseController::class, 'update']);
Route::delete('/companies/{id}', [EntrepriseController::class, 'destroy']);
Route::get('/users', [UserController::class, 'index']);
Route::post('/users', [UserController::class, 'store']);
Route::get('/users/{id}', [UserController::class, 'show']);
Route::patch('/users/{id}', [UserController::class, 'update']);
Route::patch('/users/{id}/toggle-statut', [UserController::class, 'toggleStatut']);
Route::delete('/users/{id}', [UserController::class, 'destroy']);

// --- Module 2 : Droits, Rôles et Permissions (Accès direct & Admin) ---
Route::get('/roles', [RolePermissionController::class, 'getRoles']);
Route::post('/roles', [RolePermissionController::class, 'storeRole']);
Route::get('/roles/{id}', [RolePermissionController::class, 'showRole']);
Route::patch('/roles/{id}', [RolePermissionController::class, 'updateRole']);
Route::delete('/roles/{id}', [RolePermissionController::class, 'deleteRole']);
Route::put('/roles/{id}/permissions', [RolePermissionController::class, 'updateRolePermissions']);
Route::get('/permissions', [RolePermissionController::class, 'getPermissions']);

// --- Module CV : Stockage et Téléchargement direct depuis MySQL ---
Route::get('/cvs/{id}/download', [CvController::class, 'download']);
Route::post('/candidates/cvs', [CvController::class, 'store']);
Route::delete('/cvs/{id}', [CvController::class, 'destroy']);

// --- Module Candidats & Favoris Dynamiques (Persistance MySQL) ---
Route::get('/candidates/profile', [CandidatController::class, 'meProfile']);
Route::put('/candidates/profile', [CandidatController::class, 'updateProfile']);
Route::get('/candidates/favoris', [CandidatController::class, 'getFavoris']);
Route::post('/candidates/favoris/toggle', [CandidatController::class, 'toggleFavori']);

// --- Module Notifications (Journal Admin & Recruteur) ---
Route::get('/notifications', [NotificationController::class, 'index']);
Route::post('/notifications/{id}/resend', [NotificationController::class, 'resend']);

// --- 3. Routes Protégées par Authentification Sanctum ---
Route::middleware('auth:sanctum')->group(function () {

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
        Route::get('/profile', [CandidatController::class, 'meProfile']);
        Route::put('/profile', [CandidatController::class, 'updateProfile']);
        Route::get('/{id}', [CandidatController::class, 'show']);
        Route::delete('/my-data', [CandidatController::class, 'deleteMyData'])->middleware('permission:SUPPRIMER_DONNEES_CANDIDAT');
    });
    Route::post('/cvs/{id}/analyse', [AnalyseCvController::class, 'analyserCv']);

    // --- Module 7 & 8 : Candidatures ---
    Route::prefix('applications')->group(function () {
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
    Route::get('/notifications/templates', [NotificationController::class, 'getTemplates']);
});
