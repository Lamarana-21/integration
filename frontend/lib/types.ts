export type RoleName = 'ADMIN' | 'RECRUTEUR' | 'CANDIDAT' | 'VISITEUR';

export type UserStatus = 'ACTIF' | 'INACTIF';
export type CompanyStatus = 'ACTIVE' | 'DESACTIVEE';
export type JobStatus = 'BROUILLON' | 'PUBLIEE' | 'CLOTUREE' | 'ARCHIVEE';
export type ContractType = 'CDI' | 'CDD' | 'STAGE' | 'ALTERNANCE' | 'FREELANCE';
export type ApplicationStatus = 'RECUE' | 'EN_EXAMEN' | 'PRESELECTIONNEE' | 'ENTRETIEN' | 'ACCEPTEE' | 'REFUSEE' | 'RETIREE';
export type ConfidenceLevel = 'FAIBLE' | 'MOYEN' | 'ELEVE';
export type NotificationType = 'CONFIRMATION_DEPOT' | 'CHANGEMENT_STATUT' | 'NOUVELLE_CANDIDATURE' | 'REINITIALISATION_MDP';
export type NotificationStatus = 'EN_ATTENTE' | 'ENVOYE' | 'ECHEC';

export interface Permission {
  id: string;
  nom: string;
  description: string;
}

export interface Role {
  id: string;
  nom: RoleName;
  description: string;
  permissions?: Permission[];
}

export interface Entreprise {
  id: string;
  nom: string;
  secteur: string;
  ville: string;
  pays: string;
  site_web?: string;
  description?: string;
  logo_url?: string;
  statut: CompanyStatus;
  offres_count?: number;
  recruteurs_count?: number;
  created_at?: string;
}

export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role_id?: string;
  role?: Role;
  entreprise_id?: string;
  entreprise?: Entreprise;
  statut: UserStatus;
  derniere_connexion?: string;
  candidat?: Candidat;
  avatar_url?: string;
}

export interface Experience {
  id?: string;
  poste: string;
  employeur: string;
  dates: string;
  description: string;
  lieu?: string;
  technologies?: string[];
  actuel?: boolean;
}

export interface Formation {
  id?: string;
  diplome: string;
  ecole: string;
  annee: string;
  description?: string;
}

export interface CV {
  id: string;
  candidat_id: string;
  nom_fichier: string;
  type_mime: string;
  taille_octets: number;
  url_stockage: string;
  created_at?: string;
  est_principal?: boolean;
  score_ia?: number;
  est_genere?: boolean;
  template_style?: 'moderne' | 'minimaliste' | 'corporate';
}

export interface Candidat {
  id: string;
  utilisateur_id: string;
  user?: User;
  titre?: string;
  telephone?: string;
  ville?: string;
  pays?: string;
  code_postal?: string;
  avatar_url?: string;
  avatar_bg?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  resume?: string;
  statut_recherche?: 'EN_RECHERCHE' | 'A_LECOUTE' | 'NON_DISPONIBLE';
  type_contrat_souhaite?: string[];
  pretention_salariale?: string;
  teletravail_souhaite?: 'TOTAL' | 'HYBRIDE' | 'SUR_SITE' | 'INDIFFERENT';
  competences: string[];
  experiences: Experience[];
  formations: Formation[];
  langues: string[];
  disponibilite?: string;
  cvs?: CV[];
  created_at?: string;
}

export interface Offre {
  id: string;
  titre: string;
  description: string;
  missions?: string;
  competences_requises: string[];
  type_contrat: ContractType;
  lieu: string;
  salaire?: string;
  date_publication?: string;
  date_limite?: string;
  statut: JobStatus;
  entreprise_id: string;
  entreprise?: Entreprise;
  auteur_id: string;
  auteur?: User;
  candidatures_count?: number;
  created_at?: string;
}

export interface AnalyseCv {
  id: string;
  cv_id: string;
  candidature_id?: string;
  infos_extraites: {
    competences: string[];
    experiences: Experience[];
    formations: Formation[];
    langues: string[];
  };
  resume: string;
  score_correspondance: number; // 0..100
  points_forts: string[];
  points_manquants: string[];
  niveau_confiance: ConfidenceLevel;
  version_modele: string;
  valide_par_recruteur: boolean;
  created_at?: string;
}

export interface NoteInterne {
  id: string;
  auteur_id: string;
  auteur?: User;
  candidature_id: string;
  contenu: string;
  etiquettes: string[];
  created_at: string;
}

export interface Candidature {
  id: string;
  candidat_id: string;
  candidat?: Candidat;
  offre_id: string;
  offre?: Offre;
  cv_id: string;
  cv?: CV;
  lettre_motivation?: string;
  message?: string;
  statut: ApplicationStatus;
  commentaire_recruteur?: string;
  analyse?: AnalyseCv;
  notes_internes?: NoteInterne[];
  created_at: string;
  updated_at?: string;
}

export interface NotificationRecord {
  id: string;
  utilisateur_id: string;
  user?: User;
  type: NotificationType;
  objet: string;
  message: string;
  statut_envoi: NotificationStatus;
  created_at: string;
}
