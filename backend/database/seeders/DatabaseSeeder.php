<?php

namespace Database\Seeders;

use App\Models\AnalyseCv;
use App\Models\Candidat;
use App\Models\Candidature;
use App\Models\Cv;
use App\Models\Entreprise;
use App\Models\NoteInterne;
use App\Models\Notification;
use App\Models\Offre;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Permissions (Section 4 du cahier des charges)
        $permissionsList = [
            // Utilisateurs
            'CREER_UTILISATEUR' => 'Créer un compte utilisateur',
            'MODIFIER_UTILISATEUR' => 'Modifier un compte utilisateur',
            'SUSPENDRE_UTILISATEUR' => 'Suspendre ou activer un utilisateur',
            'SUPPRIMER_UTILISATEUR' => 'Supprimer un utilisateur',
            'VOIR_UTILISATEURS' => 'Consulter la liste des utilisateurs',
            // Droits
            'GERER_ROLES' => 'Gérer les rôles du système',
            'GERER_PERMISSIONS' => 'Consulter et modifier les permissions',
            'ATTRIBUER_ROLE' => 'Attribuer un rôle à un utilisateur',
            // Entreprises
            'CREER_ENTREPRISE' => 'Créer une fiche entreprise',
            'MODIFIER_ENTREPRISE' => 'Modifier les informations d\'une entreprise',
            'DESACTIVER_ENTREPRISE' => 'Désactiver ou supprimer une entreprise',
            // Offres
            'CREER_OFFRE' => 'Rédiger et créer une offre',
            'MODIFIER_OFFRE' => 'Modifier une offre existante',
            'PUBLIER_OFFRE' => 'Publier une offre',
            'CLOTURER_OFFRE' => 'Clôturer ou archiver une offre',
            'SUPPRIMER_OFFRE' => 'Supprimer une offre',
            // Candidats
            'VOIR_CANDIDAT' => 'Consulter les profils des candidats',
            'AJOUTER_NOTE' => 'Ajouter des notes internes et étiquettes',
            'SUPPRIMER_DONNEES_CANDIDAT' => 'Supprimer les données personnelles d\'un candidat',
            // Candidatures
            'POSTULER' => 'Déposer une candidature à une offre',
            'RETIRER_CANDIDATURE' => 'Retirer une candidature non traitée',
            'VOIR_CANDIDATURES' => 'Consulter la liste des candidatures reçues',
            'CHANGER_STATUT' => 'Changer le statut d\'une candidature',
            // Analyse IA
            'LANCER_ANALYSE' => 'Déclencher l\'analyse IA d\'un CV',
            'VOIR_ANALYSE' => 'Consulter l\'analyse IA et les scores',
            'CORRIGER_ANALYSE' => 'Corriger les informations extraites par l\'IA',
            // Tableau de bord
            'VOIR_DASHBOARD_RECRUTEUR' => 'Accéder au tableau de bord recruteur',
            'VOIR_DASHBOARD_ADMIN' => 'Accéder au tableau de bord administrateur',
        ];

        $permissionModels = [];
        foreach ($permissionsList as $nom => $description) {
            $permissionModels[$nom] = Permission::create([
                'nom' => $nom,
                'description' => $description,
            ]);
        }

        // 2. Rôles (Section 3.2 & 4)
        $roleAdmin = Role::create([
            'nom' => 'ADMIN',
            'description' => 'Administrateur système ayant tous les privilèges sur la plateforme',
        ]);
        $roleAdmin->permissions()->sync(array_column($permissionModels, 'id'));

        $roleRecruteur = Role::create([
            'nom' => 'RECRUTEUR',
            'description' => 'Recruteur rattaché à une entreprise pour gérer ses offres et candidats',
        ]);
        $recruteurPerms = [
            'CREER_OFFRE', 'MODIFIER_OFFRE', 'PUBLIER_OFFRE', 'CLOTURER_OFFRE',
            'VOIR_CANDIDATURES', 'CHANGER_STATUT', 'VOIR_CANDIDAT', 'AJOUTER_NOTE',
            'LANCER_ANALYSE', 'VOIR_ANALYSE', 'CORRIGER_ANALYSE',
            'VOIR_DASHBOARD_RECRUTEUR', 'MODIFIER_ENTREPRISE'
        ];
        $roleRecruteur->permissions()->sync(
            array_map(fn ($p) => $permissionModels[$p]->id, $recruteurPerms)
        );

        $roleCandidat = Role::create([
            'nom' => 'CANDIDAT',
            'description' => 'Chercheur d\'emploi pouvant postuler et suivre ses candidatures',
        ]);
        $candidatPerms = ['POSTULER', 'RETIRER_CANDIDATURE', 'SUPPRIMER_DONNEES_CANDIDAT'];
        $roleCandidat->permissions()->sync(
            array_map(fn ($p) => $permissionModels[$p]->id, $candidatPerms)
        );

        // 3. Entreprises (Section 3.5 & E11, E14)
        $alpha = Entreprise::create([
            'nom' => 'Société Alpha',
            'secteur' => 'Logiciel & Ingénierie Web',
            'ville' => 'Sfax',
            'pays' => 'Tunisie',
            'site_web' => 'https://alpha.example',
            'description' => 'Éditeur de logiciels innovants et solutions cloud à haute performance.',
            'logo_url' => '/logos/alpha.png',
            'statut' => 'ACTIVE',
        ]);

        $beta = Entreprise::create([
            'nom' => 'Société Beta',
            'secteur' => 'Conseil & Stratégie RH',
            'ville' => 'Tunis',
            'pays' => 'Tunisie',
            'site_web' => 'https://beta.example',
            'description' => 'Cabinet conseil accompagnant les leaders technologiques dans leur croissance.',
            'logo_url' => '/logos/beta.png',
            'statut' => 'ACTIVE',
        ]);

        $gamma = Entreprise::create([
            'nom' => 'Société Gamma',
            'secteur' => 'Santé & Technologies médicales',
            'ville' => 'Sousse',
            'pays' => 'Tunisie',
            'site_web' => 'https://gamma.example',
            'description' => 'Pionnier des technologies biomédicales et d’analyse de données de santé.',
            'logo_url' => '/logos/gamma.png',
            'statut' => 'DESACTIVEE',
        ]);

        // 4. Utilisateurs (Section 3.1)
        // Admin
        $admin = User::create([
            'nom' => 'Moreau',
            'prenom' => 'Amélie',
            'email' => 'admin@talenta.example',
            'password' => Hash::make('password123'),
            'role_id' => $roleAdmin->id,
            'statut' => 'ACTIF',
            'derniere_connexion' => Carbon::now(),
        ]);

        // Recruteur Alpha (R. Ben Ali)
        $recruteurAlpha = User::create([
            'nom' => 'Ben Ali',
            'prenom' => 'Rached',
            'email' => 'rh@alpha.example',
            'password' => Hash::make('password123'),
            'role_id' => $roleRecruteur->id,
            'entreprise_id' => $alpha->id,
            'statut' => 'ACTIF',
            'derniere_connexion' => Carbon::now()->subHours(2),
        ]);

        // Recruteur Beta
        $recruteurBeta = User::create([
            'nom' => 'Khedhir',
            'prenom' => 'Sami',
            'email' => 'rh@beta.example',
            'password' => Hash::make('password123'),
            'role_id' => $roleRecruteur->id,
            'entreprise_id' => $beta->id,
            'statut' => 'ACTIF',
            'derniere_connexion' => Carbon::now()->subDays(1),
        ]);

        // Candidats (Amina B., Karim T., Sara M.)
        $userAmina = User::create([
            'nom' => 'Ben Salem',
            'prenom' => 'Amina',
            'email' => 'amina@mail.example',
            'password' => Hash::make('password123'),
            'role_id' => $roleCandidat->id,
            'statut' => 'ACTIF',
            'derniere_connexion' => Carbon::now()->subHours(1),
        ]);

        $userKarim = User::create([
            'nom' => 'Trabelsi',
            'prenom' => 'Karim',
            'email' => 'karim@mail.example',
            'password' => Hash::make('password123'),
            'role_id' => $roleCandidat->id,
            'statut' => 'INACTIF',
            'derniere_connexion' => Carbon::now()->subDays(2),
        ]);

        $userSara = User::create([
            'nom' => 'Mansour',
            'prenom' => 'Sara',
            'email' => 'sara@mail.example',
            'password' => Hash::make('password123'),
            'role_id' => $roleCandidat->id,
            'statut' => 'ACTIF',
            'derniere_connexion' => Carbon::now()->subDays(4),
        ]);

        // 5. Profils Candidats (Section 3.7 & E6)
        $candidatAmina = Candidat::create([
            'utilisateur_id' => $userAmina->id,
            'telephone' => '+216 98 123 456',
            'ville' => 'Sfax',
            'resume' => 'Développeuse Web passionnée par l’écosystème React, TypeScript et Node.js. 1 an d\'expérience en conception d\'interfaces réactives et d\'API RESTful.',
            'competences' => ['React', 'Node.js', 'SQL', 'Git', 'TypeScript', 'TailwindCSS'],
            'experiences' => [
                [
                    'poste' => 'Développeuse Web Junior',
                    'employeur' => 'WebLabs Tunisie',
                    'dates' => '2025 - 2026',
                    'description' => 'Développement de tableaux de bord d\'administration React et intégration d\'API Node.js/PostgreSQL.'
                ]
            ],
            'formations' => [
                [
                    'diplome' => 'Licence en Informatique de Gestion',
                    'ecole' => 'Faculté des Sciences de Sfax',
                    'annee' => '2025'
                ]
            ],
            'langues' => ['Français (Bilingue)', 'Anglais (Technique)', 'Arabe (Natif)'],
            'disponibilite' => Carbon::today()->addDays(15),
        ]);

        $candidatKarim = Candidat::create([
            'utilisateur_id' => $userKarim->id,
            'telephone' => '+216 22 456 789',
            'ville' => 'Sfax',
            'resume' => 'Développeur Full Stack avec appétence forte pour le backend PHP et bases de données relationnelles.',
            'competences' => ['PHP', 'Laravel', 'React', 'SQL', 'Docker'],
            'experiences' => [
                [
                    'poste' => 'Stagiaire Développeur PHP',
                    'employeur' => 'InnovIT',
                    'dates' => '2025',
                    'description' => 'Maintenance applicative et création de points de terminaison REST sécurisés.'
                ]
            ],
            'formations' => [
                [
                    'diplome' => 'Licence Technologies de l\'Information',
                    'ecole' => 'ISET Sfax',
                    'annee' => '2025'
                ]
            ],
            'langues' => ['Français (Courant)', 'Anglais (Intermédiaire)'],
            'disponibilite' => Carbon::today()->addMonth(),
        ]);

        $candidatSara = Candidat::create([
            'utilisateur_id' => $userSara->id,
            'telephone' => '+216 55 987 654',
            'ville' => 'Tunis',
            'resume' => 'Chargée de Ressources Humaines spécialisée dans la détection des talents et la gestion de carrières.',
            'competences' => ['Sourcing', 'Entretien de recrutement', 'Gestion administrative', 'Droit du travail'],
            'experiences' => [
                [
                    'poste' => 'Assistante RH',
                    'employeur' => 'HumanGroup',
                    'dates' => '2024 - 2026',
                    'description' => 'Tri de candidatures, organisation des sessions d\'entretiens et onboarding.'
                ]
            ],
            'formations' => [
                [
                    'diplome' => 'Master en Management des RH',
                    'ecole' => 'ISG Tunis',
                    'annee' => '2024'
                ]
            ],
            'langues' => ['Français (Courant)', 'Anglais (Professionnel)'],
            'disponibilite' => Carbon::today(),
        ]);

        // 6. CVs (Section 3.8)
        $cvAmina = Cv::create([
            'candidat_id' => $candidatAmina->id,
            'nom_fichier' => 'cv_amina_2026.pdf',
            'type_mime' => 'application/pdf',
            'taille_octets' => 1450000,
            'url_stockage' => 'cvs_prive/cv_amina_2026.pdf',
        ]);

        $cvKarim = Cv::create([
            'candidat_id' => $candidatKarim->id,
            'nom_fichier' => 'cv_karim_2026.pdf',
            'type_mime' => 'application/pdf',
            'taille_octets' => 1120000,
            'url_stockage' => 'cvs_prive/cv_karim_2026.pdf',
        ]);

        $cvSara = Cv::create([
            'candidat_id' => $candidatSara->id,
            'nom_fichier' => 'cv_sara_2026.pdf',
            'type_mime' => 'application/pdf',
            'taille_octets' => 980000,
            'url_stockage' => 'cvs_prive/cv_sara_2026.pdf',
        ]);

        // 7. Offres (Section 3.6 & E1, E7, E8)
        $offreDevWeb = Offre::create([
            'titre' => 'Développeur Web Junior',
            'description' => 'Société Alpha recrute un(e) Développeur Web Junior passionné(e) pour concevoir et faire évoluer nos plateformes SaaS métier.',
            'missions' => "- Développer des interfaces web modernes et réactives sous React\n- Concevoir et documenter des API RESTful performantes avec Node.js\n- Participer à la modélisation et à l'optimisation des bases de données SQL\n- Collaborer avec l'équipe produit selon la méthodologie Agile Scrum",
            'competences_requises' => ['React', 'Node.js', 'SQL', 'Git', 'TypeScript'],
            'type_contrat' => 'CDI',
            'lieu' => 'Sfax (Hybride)',
            'salaire' => '1 800 - 2 400 TND / mois',
            'date_publication' => Carbon::today()->subDays(2),
            'date_limite' => Carbon::today()->addDays(20),
            'statut' => 'PUBLIEE',
            'entreprise_id' => $alpha->id,
            'auteur_id' => $recruteurAlpha->id,
        ]);

        $offreChargeRecrutement = Offre::create([
            'titre' => 'Chargé de recrutement',
            'description' => 'Rejoignez le pôle conseil de Société Beta pour identifier et attirer les talents technologiques de demain.',
            'missions' => "- Définir les profils de poste avec les managers\n- Rédiger et diffuser les annonces\n- Présélectionner les CV et mener les entretiens de qualification\n- Assurer le suivi et la rétroaction auprès des candidats",
            'competences_requises' => ['Sourcing', 'Entretien RH', 'LinkedIn Recruiter', 'Communication'],
            'type_contrat' => 'STAGE',
            'lieu' => 'Tunis (Présentiel)',
            'salaire' => '800 - 1 100 TND / mois',
            'date_publication' => Carbon::today()->subDays(5),
            'date_limite' => Carbon::today()->addDays(10),
            'statut' => 'PUBLIEE',
            'entreprise_id' => $beta->id,
            'auteur_id' => $recruteurBeta->id,
        ]);

        $offreAssistantRH = Offre::create([
            'titre' => 'Assistant RH',
            'description' => 'Support aux opérations de paie, gestion administrative des dossiers et organisation des sessions d\'entretiens.',
            'missions' => "- Suivi des contrats et des présences\n- Préparation des fiches de poste\n- Coordination des plannings d'entretiens",
            'competences_requises' => ['Droit social', 'Gestion administrative', 'Excel', 'Organisation'],
            'type_contrat' => 'CDD',
            'lieu' => 'Sfax',
            'salaire' => '1 400 TND / mois',
            'date_publication' => null,
            'date_limite' => Carbon::today()->addDays(25),
            'statut' => 'BROUILLON',
            'entreprise_id' => $alpha->id,
            'auteur_id' => $recruteurAlpha->id,
        ]);

        $offreDevOps = Offre::create([
            'titre' => 'Ingénieur DevOps Cloud',
            'description' => 'Gestion de notre infrastructure Kubernetes et sécurisation de nos pipelines CI/CD.',
            'missions' => "- Automatiser les déploiements de conteneurs Docker\n- Monitorer la résilience et les performances applicatives\n- Gérer la haute disponibilité sur le cloud",
            'competences_requises' => ['Docker', 'Kubernetes', 'CI/CD', 'Linux', 'AWS'],
            'type_contrat' => 'CDI',
            'lieu' => 'Tunis (Hybride)',
            'salaire' => '3 500 - 4 500 TND / mois',
            'date_publication' => Carbon::today()->subDays(1),
            'date_limite' => Carbon::today()->addDays(30),
            'statut' => 'PUBLIEE',
            'entreprise_id' => $alpha->id,
            'auteur_id' => $recruteurAlpha->id,
        ]);

        // 8. Candidatures (Section 3.9 & E5, E9, E10)
        // Candidature 1: Amina -> Développeur Web Junior (Alpha)
        $candAmina = Candidature::create([
            'candidat_id' => $candidatAmina->id,
            'offre_id' => $offreDevWeb->id,
            'cv_id' => $cvAmina->id,
            'lettre_motivation' => 'Fortement motivée par les technologies React et les architectures modulaires, je souhaite apporter mon dynamisme et mon sens du détail à Société Alpha.',
            'message' => 'Disponible immédiatement pour un entretien technique ou échange visio.',
            'statut' => 'EN_EXAMEN',
            'commentaire_recruteur' => 'Profil prometteur, correspond bien aux attentes juniors.',
            'created_at' => Carbon::today()->subDays(1),
        ]);

        // Analyse IA Candidature 1 (Module 9, Section 3.10 & E10)
        AnalyseCv::create([
            'cv_id' => $cvAmina->id,
            'candidature_id' => $candAmina->id,
            'infos_extraites' => [
                'competences' => ['React', 'Node.js', 'SQL', 'Git', 'TypeScript'],
                'experiences' => [
                    [
                        'poste' => 'Développeuse Web Junior',
                        'employeur' => 'WebLabs Tunisie',
                        'dates' => '2025 - 2026',
                        'description' => 'Conception d\'interfaces réactives React et endpoints Node.js.'
                    ]
                ],
                'formations' => [
                    [
                        'diplome' => 'Licence en Informatique de Gestion',
                        'ecole' => 'Faculté des Sciences de Sfax',
                        'annee' => '2025'
                    ]
                ],
                'langues' => ['Français (Bilingue)', 'Anglais (Technique)'],
            ],
            'resume' => 'Développeuse Web Junior avec 1 an d\'expérience. Excellente adéquation sur la stack principale (React, Node.js, SQL).',
            'score_correspondance' => 82,
            'points_forts' => [
                'Maîtrise validée : React, Node.js, SQL',
                'Expérience pratique sur une stack similaire',
                'Code source versionné sous Git documenté'
            ],
            'points_manquants' => [
                'Tests automatisés (Jest/Cypress) non mentionnés',
                'Niveau d’anglais oral à valider en entretien'
            ],
            'niveau_confiance' => 'MOYEN',
            'version_modele' => 'Talenta-AI-v2.1',
            'valide_par_recruteur' => false,
        ]);

        // Note interne sur Amina (Module 8.4, Section 3.11 & E10)
        NoteInterne::create([
            'auteur_id' => $recruteurAlpha->id,
            'candidature_id' => $candAmina->id,
            'contenu' => 'Appel prévu jeudi (R. Ben Ali) pour validation des attentes salariales et date de démarrage.',
            'etiquettes' => ['À contacter', 'Entretien tech'],
        ]);

        // Candidature 2: Karim -> Développeur Web Junior (Alpha)
        $candKarim = Candidature::create([
            'candidat_id' => $candidatKarim->id,
            'offre_id' => $offreDevWeb->id,
            'cv_id' => $cvKarim->id,
            'lettre_motivation' => 'Passionné par le développement d\'applications et la résolution de problèmes techniques.',
            'message' => 'Ravi de postuler pour ce poste.',
            'statut' => 'RECUE',
            'created_at' => Carbon::today(),
        ]);

        AnalyseCv::create([
            'cv_id' => $cvKarim->id,
            'candidature_id' => $candKarim->id,
            'infos_extraites' => [
                'competences' => ['PHP', 'Laravel', 'React', 'SQL', 'Docker'],
                'experiences' => [
                    [
                        'poste' => 'Stagiaire Développeur PHP',
                        'employeur' => 'InnovIT',
                        'dates' => '2025',
                        'description' => 'Développement back-end et SQL.'
                    ]
                ],
                'formations' => [
                    [
                        'diplome' => 'Licence Technologies de l\'Information',
                        'ecole' => 'ISET Sfax',
                        'annee' => '2025'
                    ]
                ],
                'langues' => ['Français (Courant)', 'Anglais (Intermédiaire)'],
            ],
            'resume' => 'Profil développeur orienté backend PHP/SQL avec des notions en React.',
            'score_correspondance' => 64,
            'points_forts' => [
                'Bases solides en SQL et développement web',
                'Notions de conteneurisation Docker'
            ],
            'points_manquants' => [
                'Expérience Node.js absente du CV',
                'TypeScript non documenté'
            ],
            'niveau_confiance' => 'MOYEN',
            'version_modele' => 'Talenta-AI-v2.1',
            'valide_par_recruteur' => false,
        ]);

        // Candidature 3: Sara -> Chargé de recrutement (Beta)
        $candSara = Candidature::create([
            'candidat_id' => $candidatSara->id,
            'offre_id' => $offreChargeRecrutement->id,
            'cv_id' => $cvSara->id,
            'lettre_motivation' => 'Expérience solide en sourcing et en gestion des relations candidats.',
            'message' => 'À votre disposition pour échanger.',
            'statut' => 'ENTRETIEN',
            'created_at' => Carbon::today()->subDays(3),
        ]);

        AnalyseCv::create([
            'cv_id' => $cvSara->id,
            'candidature_id' => $candSara->id,
            'infos_extraites' => [
                'competences' => ['Sourcing', 'Entretien RH', 'Gestion administrative', 'Droit du travail'],
                'experiences' => [
                    [
                        'poste' => 'Assistante RH',
                        'employeur' => 'HumanGroup',
                        'dates' => '2024 - 2026',
                        'description' => 'Coordination des recrutements.'
                    ]
                ],
                'formations' => [
                    [
                        'diplome' => 'Master en Management des RH',
                        'ecole' => 'ISG Tunis',
                        'annee' => '2024'
                    ]
                ],
                'langues' => ['Français', 'Anglais'],
            ],
            'resume' => 'Spécialiste recrutement et sourcing RH avec expérience cabinet.',
            'score_correspondance' => 88,
            'points_forts' => [
                'Expérience concrète en cabinet de recrutement',
                'Excellente maîtrise des techniques d\'entretien'
            ],
            'points_manquants' => [
                'Outils ATS spécifiques à découvrir'
            ],
            'niveau_confiance' => 'ELEVE',
            'version_modele' => 'Talenta-AI-v2.1',
            'valide_par_recruteur' => true,
        ]);

        // 9. Notifications (Section 3.12, Module 11 & E15)
        Notification::create([
            'utilisateur_id' => $userAmina->id,
            'type' => 'CONFIRMATION_DEPOT',
            'objet' => 'Confirmation de votre candidature : Développeur Web Junior',
            'message' => 'Bonjour Amina, votre candidature a bien été transmise à Société Alpha.',
            'statut_envoi' => 'ENVOYE',
            'created_at' => Carbon::now()->subDays(1)->setTime(10, 12),
        ]);

        Notification::create([
            'utilisateur_id' => $userAmina->id,
            'type' => 'CHANGEMENT_STATUT',
            'objet' => 'Mise à jour : Développeur Web Junior',
            'message' => 'Votre candidature est passée à l’état : En examen.',
            'statut_envoi' => 'ENVOYE',
            'created_at' => Carbon::now()->subDays(1)->setTime(14, 40),
        ]);

        Notification::create([
            'utilisateur_id' => $userKarim->id,
            'type' => 'REINITIALISATION_MDP',
            'objet' => 'Réinitialisation de votre mot de passe Talenta',
            'message' => 'Lien de réinitialisation sécurisé : /reinitialiser?token=abc-123',
            'statut_envoi' => 'ECHEC',
            'created_at' => Carbon::now()->setTime(9, 5),
        ]);
    }
}
