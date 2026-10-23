# 🚀 Talenta — Application Intelligente de Recrutement

Système complet de recrutement développé dans le respect strict du cahier des charges (Compte rendu complet : modules, entités, règles métier, parcours et interfaces E1 à E15).

---

## 🏛️ Architecture du Projet

Le projet adopte une architecture applicative modulaire et moderne :
- **Backend API REST (Laravel 12 / PHP 8.4)** : Gestion sécurisée des données, des règles métier (RM1–RM10), de l'authentification par jeton (Sanctum), des rôles & permissions, de l'analyse assistée par IA et du journal des notifications.
- **Frontend Web App (Next.js 16 / React 19 / TailwindCSS / Lucide)** : Interface utilisateur haut de gamme, fluide et dynamique implémentant l'ensemble des 15 maquettes (E1 à E15) avec un commutateur de rôles en un clic.

```
integration/
├── backend/                  # API REST Laravel
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/   # 11 contrôleurs modulaires
│   │   │   └── Middleware/        # CheckPermission (contrôle 403)
│   │   ├── Models/                # 11 modèles Eloquent avec UUIDs
│   │   └── Services/
│   │       ├── AiCvAnalysisService.php # Moteur d'analyse IA avec anti-biais
│   │       └── NotificationService.php # Service transactionnel d'e-mails
│   ├── database/
│   │   ├── migrations/            # 11 migrations (12 entités)
│   │   └── seeders/               # Jeu de données d'essai complet
│   └── tests/Feature/             # Tests unitaires & fonctionnels PHPUnit
│
├── app/                      # Frontend Next.js (Router & Pages)
├── components/
│   ├── Navbar.tsx            # Navigation & commutateur de rôles
│   └── screens/              # Les écrans E1 à E15 conformes aux maquettes
├── lib/
│   ├── types.ts              # Interfaces TypeScript des 12 entités
│   ├── api.ts                # Client API & résilience hors-ligne
│   └── initialData.ts        # Données de démonstration miroir
└── package.json
```

---

## 📋 Périmètre Fonctionnel (11 Modules)

| Module | Fonctionnalité | Écrans associés |
| :--- | :--- | :--- |
| **Module 1** | **Gestion des utilisateurs** (Créer, lister, modifier, suspendre, profil) | E2, E12 |
| **Module 2** | **Gestion des droits** (Rôles & permissions, refus 403, masquer actions) | E13 |
| **Module 3** | **Authentification** (Inscription candidat, connexion email/mdp, session, reset) | E2 |
| **Module 4** | **Gestion des entreprises** (Fiche entreprise, logo, offres, recruteurs) | E11, E14 |
| **Module 5** | **Gestion des offres** (Créer, brouillon/publier, filtres, date limite, clôture) | E1, E3, E8 |
| **Module 6** | **Gestion des candidats** (Profil complet, compétences, formations, CVs, RGPD) | E6, E10 |
| **Module 7** | **Dépôt des candidatures** (Postuler avec CV, lettre, confirmation, suivi, retrait) | E4, E5 |
| **Module 8** | **Gestion des candidatures recruteur** (Trier par score IA, statuts, notes, export CSV) | E7, E9, E10 |
| **Module 9** | **Analyse des CV par IA** (Extraction structurée, scoring 0-100, anti-biais, suggestion) | E7, E9, E10 |
| **Module 10**| **Tableau de bord** (Indicateurs clés, taux présélection, délai moyen, graphes) | E7 |
| **Module 11**| **Notifications** (E-mails automatiques, journalisation, renvoi, modèles) | E15 |

---

## 🧠 Analyse des CV par IA & Cadre Éthique

Conformément à la **Section 7** et au **Module 9** :
1. **Suggestion d'aide à la décision uniquement** : L'IA ne valide ni ne refuse jamais automatiquement une candidature (Règle RM8). La décision finale appartient toujours au recruteur.
2. **Élimination préventive des biais démographiques** (Module 9.8) : Les photos, âges, genres et nationalités sont masqués avant l'analyse pour garantir une évaluation neutre fondée uniquement sur les compétences et expériences.
3. **Explicabilité & Transparence** : Chaque résultat présente un score de correspondance (0 à 100), les points forts (+), les points manquants (-) et un niveau de confiance (`FAIBLE`, `MOYEN`, `ELEVE`).
4. **Correction humaine & Relance** : Le recruteur peut corriger les informations extraites ou relancer l'analyse.

---

## 🛡️ Règles Métier (RM1 à RM10)

- **RM1** : Une offre n'est visible des candidats que si son statut est `PUBLIEE` et que sa date limite n'est pas dépassée.
- **RM2** : Un candidat ne peut postuler qu'une seule fois à une même offre (vérification d'unicité).
- **RM3** : Seul un recruteur rattaché à l'entreprise modifie ses offres et traite ses candidatures.
- **RM4** : Le statut suit l'ordre : *Reçue > En examen > Présélectionnée > Entretien > Acceptée / Refusée*.
- **RM5** : Un candidat peut retirer sa candidature tant qu'elle n'est ni Acceptée ni Refusée.
- **RM6** : La clôture d'une offre ne supprime pas ses candidatures.
- **RM7** : Un CV n'est accessible qu'à son propriétaire et aux recruteurs de l'entreprise concernée.
- **RM8** : Aucun statut n'est modifié automatiquement par l'IA.
- **RM9** : Toute permission modifiée pour un rôle s'applique immédiatement à tous les comptes associés dès la requête suivante.
- **RM10** : Un compte `INACTIF` ne peut pas se connecter.

---

## 💻 Démarrage Rapide

### 1. Démarrer le Backend Laravel

```bash
cd backend
php artisan migrate:fresh --seed
php artisan serve
```
> Le backend sera actif sur `http://127.0.0.1:8000`.

### 2. Démarrer le Frontend Web

```bash
# Dans le dossier principal (integration)
npm install
npm run dev
```
> Ouvrez votre navigateur sur `http://localhost:3000`.

### 3. Lancer les Tests Automatisés

- **Backend (PHPUnit)** :
  ```bash
  cd backend && php artisan test
  ```
  *(7 tests fonctionnels couvrant les règles métier RM1, RM2, RM4, RM5, RM10 et les notifications)*

- **Frontend (Build & Types)** :
  ```bash
  npm run build
  ```

---

## 👥 Comptes de Démonstration (Seeder)

| Profil | Nom | E-mail | Mot de passe | Rôle |
| :--- | :--- | :--- | :--- | :--- |
| **Administrateur** | Amélie Moreau | `admin@talenta.example` | `password123` | ADMIN (E12, E13, E14, E15) |
| **Recruteur Alpha** | Rached Ben Ali | `rh@alpha.example` | `password123` | RECRUTEUR (E7, E8, E9, E10, E11) |
| **Recruteur Beta** | Sami Khedhir | `rh@beta.example` | `password123` | RECRUTEUR (Société Beta) |
| **Candidat 1** | Amina Ben Salem | `amina@mail.example` | `password123` | CANDIDAT (E1, E3, E4, E5, E6) |
| **Candidat 2** | Karim Trabelsi | `karim@mail.example` | `password123` | CANDIDAT (Compte Inactif RM10) |
| **Candidat 3** | Sara Mansour | `sara@mail.example` | `password123` | CANDIDAT |
