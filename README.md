# 🏢 Talenta RH — Plateforme de Recrutement Intelligente

> Application Web fullstack de recrutement — Gestion des entreprises, offres, candidats et candidatures avec analyse de CV assistée par IA.
>
> *Cahier des charges : Barry Oumouratou · Oct 2026*

---

## 📁 Structure du dépôt

```
integration/
├── backend/          ← API REST Laravel 12 (PHP 8.4)
│   ├── app/
│   │   ├── Http/Controllers/Api/     # 11 contrôleurs (1 par module)
│   │   ├── Models/                   # 12 modèles Eloquent (UUIDs)
│   │   ├── Services/
│   │   │   ├── AiCvAnalysisService.php   # Analyse IA + anti-biais
│   │   │   └── NotificationService.php   # Journal des e-mails
│   │   └── Http/Middleware/
│   │       └── CheckPermission.php       # Contrôle d'accès (RM9)
│   ├── database/
│   │   ├── migrations/               # 13 migrations (MySQL / SQLite)
│   │   └── seeders/DatabaseSeeder.php    # Jeu de données complet
│   ├── routes/api.php                # 56 endpoints REST
│   └── tests/Feature/RecruitmentApiTest.php  # 7 tests (RM1-RM10)
│
└── frontend/         ← Application Next.js 16 / React 19
    ├── app/
    │   ├── globals.css               # Design system & tokens CSS
    │   ├── layout.tsx                # Layout SEO
    │   └── page.tsx                  # Contrôleur principal (E1–E15)
    ├── components/
    │   ├── Navbar.tsx                # Navigation + sélecteur d'acteur
    │   └── screens/                  # 15 écrans métier (E1 à E15)
    ├── lib/
    │   ├── api.ts                    # Client API — 11 modules + fallback
    │   ├── types.ts                  # Types TypeScript (12 entités)
    │   └── initialData.ts            # Données démo (miroir du seeder)
    └── README.md                     # Documentation frontend complète
```

---

## ⚡ Démarrage rapide

### 1. Backend (Laravel 12)

```powershell
cd backend

# Variables d'environnement (déjà configuré pour MySQL integration)
# DB_CONNECTION=mysql, DB_DATABASE=integration, DB_PORT=3306, root/''

# Migrations + données de démonstration
php artisan migrate:fresh --seed --force

# Démarrer l'API
php artisan serve
# → http://127.0.0.1:8000
```

### 2. Frontend (Next.js 16)

```powershell
cd frontend

# Configuration
cp .env.local.example .env.local

# Installation (déjà fait si node_modules présent)
npm install

# Démarrer l'interface
npm run dev
# → http://localhost:3000
```

---

## 👥 Comptes de démonstration

| Rôle | E-mail | Mot de passe | Statut |
|------|--------|-------------|--------|
| **Administrateur** | `admin@talenta.example` | `password123` | Actif |
| **Recruteur Alpha** | `rh@alpha.example` | `password123` | Actif |
| **Recruteur Beta** | `rh@beta.example` | `password123` | Actif |
| **Candidat** | `amina@mail.example` | `password123` | Actif |
| **Candidat** | `sara@mail.example` | `password123` | Actif |
| **Candidat (inactif)** | `karim@mail.example` | `password123` | **Inactif (test RM10)** |

---

## 🏗️ Modules & Couverture

| # | Module | Backend | Frontend |
|---|--------|---------|---------|
| 1 | Gestion des utilisateurs | `UserController` | E12 — AdminUsersView |
| 2 | Rôles & Permissions | `RolePermissionController` + middleware | E13 — AdminRolesView |
| 3 | Authentification | `AuthController` (Sanctum) | E2 — AuthModal |
| 4 | Entreprises | `EntrepriseController` | E11, E14 |
| 5 | Offres | `OffreController` | E1, E3, E8 |
| 6 | Profil candidat | `CandidatController`, `CvController` | E6 |
| 7 | Dépôt candidatures | `CandidatureController::store` | E4, E5 |
| 8 | Gestion candidatures | `CandidatureController` | E9 |
| 9 | Analyse IA | `AiCvAnalysisService` | E10 |
| 10 | Tableau de bord | `DashboardController` | E7 |
| 11 | Notifications | `NotificationService` | E15 |

---

## 🗄️ Base de données

- **SGBD** : MySQL 3306 (WAMP) — base `integration`
- **Tables** : 21 tables créées par les 13 migrations
- **Données démo** : 28 permissions, 3 rôles, 3 entreprises, 6 utilisateurs, 4 offres, 3 candidatures, 3 analyses IA

---

## ✅ Tests

```powershell
cd backend
php artisan test
# ✔ 7 tests passés · 19 assertions (RM1, RM2, RM4, RM5, RM10, notifications)
```

---

## 🔐 Règles métier (RM1–RM10)

| RM | Règle | Contrôle |
|----|-------|----------|
| RM1 | Seules les offres publiées non expirées sont visibles | `scopePublieesEtActives()` |
| RM2 | Un candidat · une offre (1 candidature max) | Contrainte UNIQUE BD + 422 API |
| RM3 | Recruteur ne gère que ses propres offres | Contrôle `entreprise_id` |
| RM4 | Statuts ordonnés et irréversibles | Validation enum ordonnée |
| RM5 | Retrait possible si non traitée | Contrôle statut avant DELETE |
| RM6 | Clôturer conserve les candidatures | Pas de cascade DELETE |
| RM7 | CV privés (candidat + recruteurs concernés) | Contrôle accès storage |
| RM8 | IA = aide, jamais décision automatique | Bannière obligatoire + statut manuel |
| RM9 | Permissions appliquées immédiatement | Middleware `CheckPermission` |
| RM10 | Comptes inactifs refusés | HTTP 403 + message clair |
