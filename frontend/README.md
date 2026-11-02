# 🎯 Talenta RH — Frontend

Interface web de la plateforme intelligente de recrutement **Talenta RH**, construite avec **Next.js 16**, **React 19** et **TailwindCSS v4**.

---

## 📁 Structure du projet

```
frontend/
├── app/
│   ├── globals.css          # Styles globaux & tokens CSS
│   ├── layout.tsx           # Layout racine (SEO, fonts)
│   └── page.tsx             # Contrôleur principal (toutes les vues)
│
├── components/
│   ├── Navbar.tsx           # Barre de navigation, sélecteur d'acteur
│   └── screens/             # Écrans métier (E1 à E15)
│       ├── OffresPubliquesView.tsx      # E1 + E3 — Liste & détail offres
│       ├── AuthModal.tsx               # E2  — Connexion / Inscription
│       ├── PostulerModal.tsx           # E4  — Dépôt de candidature
│       ├── MesCandidaturesView.tsx     # E5  — Suivi candidatures candidat
│       ├── ProfilCandidatView.tsx      # E6  — Profil & CVs candidat
│       ├── DashboardRecruteurView.tsx  # E7  — Tableau de bord recruteur
│       ├── NouvelleOffreView.tsx       # E8  — Création / édition offre
│       ├── CandidaturesOffreView.tsx   # E9  — Candidatures d'une offre
│       ├── FicheCandidatIaView.tsx     # E10 — Fiche candidat + score IA
│       ├── FicheEntrepriseView.tsx     # E11 — Profil entreprise
│       ├── AdminUsersView.tsx          # E12 — Gestion utilisateurs (admin)
│       ├── AdminRolesView.tsx          # E13 — Matrice permissions (admin)
│       ├── AdminEntreprisesView.tsx    # E14 — Supervision entreprises (admin)
│       └── AdminNotificationsView.tsx  # E15 — Journal emails (admin)
│
├── lib/
│   ├── api.ts               # Client API — 11 modules, fallback offline
│   ├── types.ts             # Types TypeScript — 12 entités métier
│   ├── initialData.ts       # Données démo locales (seed miroir)
│   └── utils.ts             # Utilitaires (cn, formatDate…)
│
├── public/                  # Fichiers statiques
├── .env.local               # Variables d'environnement (non committé)
├── .env.local.example       # Modèle de configuration
├── next.config.mjs          # Config Next.js (proxy API, CORS, sécurité)
├── package.json
└── tsconfig.json
```

---

## 🚀 Démarrage rapide

### Prérequis
- **Node.js** ≥ 20
- **npm** ≥ 10
- Backend Laravel démarré sur `http://127.0.0.1:8000` (optionnel — fallback offline disponible)

### Installation

```bash
cd frontend
npm install
```

### Configurer les variables d'environnement

```bash
# Copier le modèle
cp .env.local.example .env.local
```

Contenu de `.env.local` :
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
NEXT_PUBLIC_APP_NAME=Talenta RH
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Lancer en développement

```bash
npm run dev
# http://localhost:3000
```

---

## 👥 Acteurs & Comptes de démonstration

| Rôle | E-mail | Mot de passe | Écrans accessibles |
|------|--------|-------------|-------------------|
| **Administrateur** | `admin@talenta.example` | `password123` | E12, E13, E14, E15 |
| **Recruteur Alpha** | `rh@alpha.example` | `password123` | E7, E8, E9, E10, E11 |
| **Candidat** | `amina@mail.example` | `password123` | E1, E2, E4, E5, E6 |
| **Candidat (inactif)** | `karim@mail.example` | `password123` | Refusé — test RM10 |
| **Visiteur** | *(aucune connexion)* | — | E1, E3 uniquement |

> 💡 Le **sélecteur de rôles** dans la Navbar permet de basculer entre les acteurs instantanément sans connexion.

---

## 🗺️ Écrans (E1 à E15)

| Écran | Titre | Acteur | Description |
|-------|-------|--------|-------------|
| **E1** | Offres publiques | Visiteur | Recherche, filtres, pagination |
| **E2** | Authentification | Tout | Connexion, inscription, RGPD |
| **E3** | Détail offre | Visiteur / Candidat | Fiche complète + bouton postuler |
| **E4** | Postuler | Candidat | Upload CV, lettre motivation, RM2 |
| **E5** | Mes candidatures | Candidat | Stepper de statut, retrait RM5 |
| **E6** | Mon profil | Candidat | Édition profil, CVs, RGPD |
| **E7** | Dashboard recruteur | Recruteur | KPIs, graphiques, candidats IA |
| **E8** | Nouvelle offre | Recruteur | Brouillon / publication, compétences |
| **E9** | Candidatures offre | Recruteur | Filtres, score IA, bulk actions |
| **E10** | Fiche candidat IA | Recruteur | Analyse IA, notes, décision humaine |
| **E11** | Fiche entreprise | Recruteur | Profil entreprise, offres associées |
| **E12** | Gestion utilisateurs | Admin | CRUD, activation/suspension |
| **E13** | Rôles & permissions | Admin | Matrice interactive, RM9 immédiat |
| **E14** | Entreprises | Admin | Supervision, activation/désactivation |
| **E15** | Notifications | Admin | Journal emails, réexpédition, modèles |

---

## ⚖️ Règles métier implémentées

| Règle | Description | Écran(s) |
|-------|-------------|----------|
| **RM1** | Seules les offres publiées non expirées sont visibles | E1, E3 |
| **RM2** | Un candidat ne peut postuler qu'une fois par offre | E4 |
| **RM3** | Seul le recruteur de l'entreprise peut gérer ses offres | E8, E9 |
| **RM4** | Statuts de candidature ordonnés et irréversibles | E5, E9 |
| **RM5** | Retrait possible uniquement si non traitée | E5 |
| **RM6** | Clôturer une offre conserve les candidatures | E8 |
| **RM7** | CVs accessibles uniquement aux recruteurs concernés | E10 |
| **RM8** | L'IA ne décide jamais seule — validation humaine obligatoire | E10 |
| **RM9** | Permissions appliquées immédiatement | E13 |
| **RM10** | Comptes inactifs refusés à la connexion | E2 |

---

## 🏗️ Architecture technique

### Mode connecté (backend Laravel actif)
```
Next.js → api.ts → fetch() → Laravel API → MySQL integration
```

### Mode hors ligne (fallback automatique)
```
Next.js → api.ts → initialData.ts (données démo locales)
```

La barre de navigation affiche un **indicateur de connectivité** en temps réel :
- 🟢 **API connectée** — toutes les opérations sont réelles
- 🔴 **Mode hors ligne** — données de démonstration

---

## 🛠️ Commandes

```bash
npm run dev          # Démarrage local (http://localhost:3000)
npm run build        # Build de production
npm run start        # Serveur de production
npm run type-check   # Vérification TypeScript sans build
```

---

## 🔗 Liens utiles

- **Backend API** : `http://127.0.0.1:8000/api`
- **Documentation API** : voir `../backend/README.md`
- **Cahier des charges** : *Projet Recrutement — Compte rendu complet* (Barry Oumouratou, Oct 2026)
