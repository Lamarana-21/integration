export type RoleName = 'ADMIN' | 'RECRUTEUR' | 'CANDIDAT' | 'VISITEUR';

export type UserStatus = 'ACTIF' | 'INACTIF';
export type CompanyStatus = 'ACTIVE' | 'DESACTIVEE';
export type JobStatus = 'BROUILLON' | 'PUBLIEE' | 'CLOTUREE' | 'ARCHIVEE';
export type ContractType = 'CDI' | 'CDD' | 'STAGE' | 'ALTERNANCE' | 'FREELANCE';
export type ApplicationStatus = 'RECUE' | 'EN_EXAMEN' | 'PRESELECTIONNEE' | 'ENTRETIEN' | 'ACCEPTEE' | 'REFUSEE' | 'RETIREE';
export type ConfidenceLevel = 'FAIBLE' | 'MOYEN' | 'ELEVE';
export type NotificationType = 'CONFIRMATION_DEPOT' | 'CHANGEMENT_STATUT' | 'NOUVELLE_CANDIDATURE' | 'REINITIALISATION_MDP' | 'NOUVELLE_OFFRE';
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
  source_type?: 'DYNAMIQUE' | 'FICHIER_LOCAL' | 'ENREGISTRE';
  template_style?: 'moderne' | 'minimaliste' | 'corporate';
}

export interface Candidat {
  id: string;
  utilisateur_id: string;
  user?: User;
  nom?: string;
  prenom?: string;
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
  favoris_offres_ids?: string[];
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
  date_entretien?: string;
  type_entretien?: 'VISIO' | 'PRESENTIEL' | 'TELEPHONE';
  lien_ou_lieu_entretien?: string;
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
  lu?: boolean;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: RoleName;
  sender_name: string;
  receiver_id: string;
  receiver_name: string;
  contenu: string;
  created_at: string;
  lu: boolean;
}

export interface Conversation {
  id: string;
  candidat_id: string;
  candidat_nom: string;
  candidat_avatar?: string;
  recruteur_id: string;
  recruteur_nom: string;
  entreprise_id?: string;
  entreprise_nom: string;
  offre_id?: string;
  offre_titre?: string;
  dernier_message?: string;
  updated_at: string;
  non_lus_candidat: number;
  non_lus_recruteur: number;
}

export const JOB_ALIAS_MAP: Record<string, string[]> = {
  'job-1': ['01a16a74-f953-716c-8d14-dafd2fdd5f2d'],
  '01a16a74-f953-716c-8d14-dafd2fdd5f2d': ['job-1'],
  'job-4': ['01a16a74-f97c-7188-9923-e7c1229ba727'],
  '01a16a74-f97c-7188-9923-e7c1229ba727': ['job-4'],
};

export function isJobFavorited(jobId?: string | null, favIds: string[] = []): boolean {
  if (!jobId || !Array.isArray(favIds) || favIds.length === 0) return false;
  const cleanTarget = String(jobId).trim().toLowerCase();
  const aliases = [cleanTarget, ...(JOB_ALIAS_MAP[cleanTarget] || []).map((a) => a.toLowerCase())];
  return favIds.some((f) => aliases.includes(String(f).trim().toLowerCase()));
}

export function isOfferExpired(dateLimite?: string | null): boolean {
  if (!dateLimite) return false;
  try {
    const clean = dateLimite.includes('T') ? dateLimite.split('T')[0] : dateLimite;
    const deadline = new Date(`${clean}T23:59:59`);
    if (isNaN(deadline.getTime())) return false;
    const now = new Date();
    return now.getTime() > deadline.getTime();
  } catch {
    return false;
  }
}

export function hasCandidateAppliedToJob(jobId?: string | null, appliedJobIds: string[] = []): boolean {
  if (!jobId || !Array.isArray(appliedJobIds) || appliedJobIds.length === 0) return false;
  const cleanTarget = String(jobId).trim().toLowerCase();
  const aliases = [cleanTarget, ...(JOB_ALIAS_MAP[cleanTarget] || []).map((a) => a.toLowerCase())];
  return appliedJobIds.some((id) => aliases.includes(String(id).trim().toLowerCase()));
}

export function formatFrenchDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = clean.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}


