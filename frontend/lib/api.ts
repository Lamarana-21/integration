/**
 * client API Talenta RH — v2.0
 * Gère l'authentification (Sanctum), le routage vers le backend Laravel,
 * et le fallback en données locales quand le backend est hors ligne.
 */
import {
  AnalyseCv,
  Candidat,
  Candidature,
  CV,
  Entreprise,
  NotificationRecord,
  Offre,
  Permission,
  Role,
  User,
} from './types';
import {
  INITIAL_CANDIDATURES,
  INITIAL_COMPANIES,
  INITIAL_CVS,
  INITIAL_NOTIFICATIONS,
  INITIAL_OFFRES,
  INITIAL_PERMISSIONS,
  INITIAL_ROLES,
  INITIAL_USERS,
  INITIAL_CANDIDATS,
} from './initialData';

// ─── Configuration ──────────────────────────────────────────────────────────
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000/api';

// ─── Types internes ──────────────────────────────────────────────────────────
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

// ─── Client ─────────────────────────────────────────────────────────────────
class ApiClient {
  private token: string | null = null;
  private _backendAvailable: boolean | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('talenta_token');
    }
  }

  // ── Gestion du jeton ────────────────────────────────────────────────────
  public setToken(token: string | null): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('talenta_token', token);
      else localStorage.removeItem('talenta_token');
    }
  }

  public getToken(): string | null { return this.token; }
  public isBackendOnline(): boolean | null { return this._backendAvailable; }

  // ── Requête générique avec gestion d'erreurs ────────────────────────────
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    if (typeof window !== 'undefined') {
      try {
        const u = sessionStorage.getItem('talenta_current_user');
        if (u) {
          const parsed = JSON.parse(u);
          if (parsed?.id) headers['X-User-Id'] = parsed.id;
        }
      } catch {}
    }

    try {
      const res = await fetch(url, { ...options, headers });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          this.setToken(null);
          this._backendAvailable = true;
        }
        return {
          success: false,
          error: { message: body?.message ?? 'Erreur serveur', errors: body?.errors, status: res.status },
        };
      }
      return { success: true, data: body as T };
    } catch (err) {
      return {
        success: false,
        error: { message: 'Impossible de joindre le serveur.', status: 0 },
      };
    }
  }

  // ── Santé du backend ────────────────────────────────────────────────────
  public async checkBackendHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/jobs`, {
        signal: AbortSignal.timeout(2000),
        headers: { Accept: 'application/json' },
      });
      this._backendAvailable = res.ok;
    } catch {
      this._backendAvailable = false;
    }
    return this._backendAvailable!;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  MODULE 3 — AUTHENTIFICATION
  // ══════════════════════════════════════════════════════════════════════════

  /** Connexion — retourne l'utilisateur et le jeton Sanctum */
  public async login(
    email: string,
    mdp: string
  ): Promise<{ success: boolean; user?: User; message?: string }> {
    const res = await this.request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: mdp }),
    });
    if (res.success && res.data) {
      this._backendAvailable = true;
      this.setToken(res.data.token);
      return { success: true, user: res.data.user };
    }
    if (res.error?.status === 403) {
      return { success: false, message: 'Compte suspendu ou inactif (RM10).' };
    }
    if (res.error && res.error.status !== 0) {
      return {
        success: false,
        message: res.error.message || 'Identifiants invalides.',
      };
    }

    this._backendAvailable = false;
    // Fallback local
    const user = INITIAL_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return { success: false, message: 'Identifiants invalides.' };
    if (user.statut === 'INACTIF')
      return { success: false, message: 'Votre compte est suspendu ou inactif (RM10).' };
    return { success: true, user };
  }

  /** Inscription utilisateur (Candidat ou Recruteur) avec persistance MySQL */
  public async register(payload: {
    nom: string;
    prenom: string;
    email: string;
    password: string;
    role?: 'CANDIDAT' | 'RECRUTEUR';
    entreprise_nom?: string;
    entreprise_id?: string;
    titre?: string;
    telephone?: string;
    ville?: string;
    rgpd?: boolean;
  }): Promise<ApiResponse<{ token: string; user: User }>> {
    const res = await this.request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.success && res.data?.token) {
      this.setToken(res.data.token);
      this._backendAvailable = true;
    }
    return res;
  }

  /** Déconnexion */
  public async logout(): Promise<void> {
    if (this._backendAvailable && this.token) {
      await this.request('/auth/logout', { method: 'POST' });
    }
    this.setToken(null);
  }

  /** Mot de passe oublié */
  public async forgotPassword(email: string): Promise<ApiResponse> {
    if (this._backendAvailable) {
      return this.request('/auth/password/forgot', { method: 'POST', body: JSON.stringify({ email }) });
    }
    return { success: true }; // Simulation OK hors ligne
  }

  /** Changer le mot de passe */
  public async changePassword(
    ancienMotDePasse: string,
    nouveauMotDePasse: string
  ): Promise<ApiResponse<{ message: string }>> {
    return this.request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({
        ancien_mot_de_passe: ancienMotDePasse,
        nouveau_mot_de_passe: nouveauMotDePasse,
      }),
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  MODULE 5 — OFFRES (Persistance directe Base de Données MySQL)
  // ══════════════════════════════════════════════════════════════════════════

  public async getOffresPubliques(params?: {
    search?: string; contrat?: string; lieu?: string; statut?: string;
  }): Promise<Offre[]> {
    try {
      const qs = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
      const res = await this.request<{ data?: Offre[] } | Offre[]>(`/jobs${qs ? '?' + qs : ''}`);
      if (res.success && res.data) {
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.data.data)) return res.data.data;
      }
    } catch {}
    return INITIAL_OFFRES.filter((o) => o.statut === 'PUBLIEE');
  }

  public async getOffreById(id: string): Promise<Offre | null> {
    try {
      const res = await this.request<{ offre?: Offre } | Offre>(`/jobs/${id}`);
      if (res.success && res.data) {
        if ('offre' in res.data && res.data.offre) return res.data.offre;
        return res.data as Offre;
      }
    } catch {}
    return INITIAL_OFFRES.find((o) => o.id === id) ?? null;
  }

  public async createOffre(data: Partial<Offre>): Promise<ApiResponse<{ offre: Offre; message?: string }>> {
    return this.request<{ offre: Offre; message?: string }>('/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateOffre(id: string, data: Partial<Offre>): Promise<ApiResponse<{ offre: Offre; message?: string }>> {
    return this.request<{ offre: Offre; message?: string }>(`/jobs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  public async publierOffre(id: string): Promise<ApiResponse<{ offre: Offre; message?: string }>> {
    return this.request<{ offre: Offre; message?: string }>(`/jobs/${id}/publish`, {
      method: 'POST',
    });
  }

  public async cloturerOffre(id: string): Promise<ApiResponse<{ offre: Offre; message?: string }>> {
    return this.request<{ offre: Offre; message?: string }>(`/jobs/${id}/close`, {
      method: 'POST',
    });
  }

  public async deleteOffre(id: string): Promise<ApiResponse<{ message?: string }>> {
    return this.request<{ message?: string }>(`/jobs/${id}`, {
      method: 'DELETE',
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  MODULE 7 & 8 — CANDIDATURES (Persistance directe Base de Données MySQL)
  // ══════════════════════════════════════════════════════════════════════════

  public async getAllCandidatures(): Promise<Candidature[]> {
    try {
      const res = await this.request<{ candidatures?: Candidature[] } | Candidature[]>('/applications');
      if (res.success && res.data) {
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.data.candidatures)) return res.data.candidatures;
      }
    } catch {}
    return INITIAL_CANDIDATURES;
  }

  public async getMesCandidatures(): Promise<Candidature[]> {
    try {
      const res = await this.request<{ candidatures?: Candidature[]; data?: Candidature[] } | Candidature[]>('/applications/my');
      if (res.success && res.data) {
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.data.candidatures)) return res.data.candidatures;
        if (Array.isArray(res.data.data)) return res.data.data;
      }
    } catch {}
    return INITIAL_CANDIDATURES;
  }

  public async postuler(payload: {
    offre_id: string; cv_id?: string; candidat_id?: string; lettre_motivation?: string; message?: string;
  }): Promise<ApiResponse<{ candidature: Candidature; message?: string }>> {
    return this.request<{ candidature: Candidature; message?: string }>(`/jobs/${payload.offre_id}/applications`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async retirerCandidature(id: string): Promise<ApiResponse<{ message?: string }>> {
    return this.request<{ message?: string }>(`/applications/${id}`, {
      method: 'DELETE',
    });
  }

  public async getCandidaturesOffre(offreId: string): Promise<Candidature[]> {
    try {
      const res = await this.request<{ data?: Candidature[]; candidatures?: Candidature[] } | Candidature[]>(`/jobs/${offreId}/applications`);
      if (res.success && res.data) {
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.data.candidatures)) return res.data.candidatures;
        if (Array.isArray(res.data.data)) return res.data.data;
      }
    } catch {}
    return INITIAL_CANDIDATURES.filter((c) => c.offre_id === offreId);
  }

  public async changerStatutCandidature(
    id: string, statut: string, commentaire?: string
  ): Promise<ApiResponse<{ candidature: Candidature; message?: string }>> {
    return this.request<{ candidature: Candidature; message?: string }>(`/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ statut, commentaire_recruteur: commentaire }),
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  MODULE 9 — ANALYSE IA
  // ══════════════════════════════════════════════════════════════════════════

  public async lancerAnalyse(candidatureId: string): Promise<ApiResponse<AnalyseCv>> {
    if (this._backendAvailable) {
      return this.request(`/recruiter/candidatures/${candidatureId}/analyse`, { method: 'POST' });
    }
    return { success: false, error: { message: 'Backend hors ligne.', status: 0 } };
  }

  public async getAnalyse(candidatureId: string): Promise<AnalyseCv | null> {
    if (this._backendAvailable) {
      const res = await this.request<AnalyseCv>(`/recruiter/candidatures/${candidatureId}/analyse`);
      if (res.success && res.data) return res.data;
    }
    return null;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  MODULE 6 — PROFIL CANDIDAT
  // ══════════════════════════════════════════════════════════════════════════

  public async getMonProfil(): Promise<Candidat | null> {
    const res = await this.request<{ candidat: Candidat }>('/candidates/profile');
    if (res.success && res.data?.candidat) {
      this._backendAvailable = true;
      return res.data.candidat;
    }
    return null;
  }

  public async updateProfil(data: Record<string, unknown>): Promise<ApiResponse<Candidat>> {
    const res = await this.request<{ candidat: Candidat; message: string }>('/candidates/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (res.success && res.data?.candidat) {
      this._backendAvailable = true;
      return { success: true, data: res.data.candidat };
    }
    return { success: false, error: res.error };
  }

  public async uploadCv(formData: FormData): Promise<ApiResponse<CV>> {
    if (!this.token) {
      return {
        success: false,
        error: {
          message: 'Vous devez être connecté pour déposer un CV.',
          status: 401,
        },
      };
    }
    if (this._backendAvailable) {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
      try {
        const res = await fetch(`${API_BASE}/candidates/cvs`, { method: 'POST', headers, body: formData });
        const body = await res.json().catch(() => ({}));
        if (res.status === 401) {
          this.setToken(null);
          return {
            success: false,
            error: {
              message: 'Votre session a expiré. Reconnectez-vous avant de déposer un CV.',
              status: 401,
            },
          };
        }
        return res.ok
          ? { success: true, data: body.cv as CV }
          : { success: false, error: { message: body.message, status: res.status } };
      } catch {
        return { success: false, error: { message: 'Erreur upload.', status: 0 } };
      }
    }
    return { success: false, error: { message: 'Backend hors ligne.', status: 0 } };
  }

  public async analyserCv(cvId: string): Promise<ApiResponse<AnalyseCv>> {
    if (!this.token) {
      return {
        success: false,
        error: {
          message: 'Votre session a expiré. Reconnectez-vous avant de lancer l’analyse.',
          status: 401,
        },
      };
    }
    if (this._backendAvailable) {
      return this.request(`/cvs/${cvId}/analyse`, { method: 'POST' });
    }
    return { success: false, error: { message: 'Backend hors ligne.', status: 0 } };
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  MODULE 10 — TABLEAU DE BORD
  // ══════════════════════════════════════════════════════════════════════════

  public async getDashboardRecruteur(): Promise<ApiResponse<Record<string, unknown>>> {
    if (this._backendAvailable) return this.request('/recruiter/dashboard');
    return {
      success: true,
      data: {
        total_offres: INITIAL_OFFRES.length,
        candidatures_recues: INITIAL_CANDIDATURES.length,
        taux_preselection: 33,
        delai_moyen_jours: 5,
      },
    };
  }

  public async getDashboardAdmin(): Promise<ApiResponse<Record<string, unknown>>> {
    if (this._backendAvailable) return this.request('/admin/dashboard');
    return {
      success: true,
      data: {
        total_utilisateurs: INITIAL_USERS.length,
        total_entreprises: INITIAL_COMPANIES.length,
        total_offres_publiees: INITIAL_OFFRES.filter((o) => o.statut === 'PUBLIEE').length,
        total_candidatures: INITIAL_CANDIDATURES.length,
      },
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  MODULE 1 — UTILISATEURS (Admin)
  // ══════════════════════════════════════════════════════════════════════════

  public async getUsers(): Promise<User[]> {
    try {
      const res = await this.request<any>('/users?per_page=100');
      if (res.success && res.data) {
        const list: User[] = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.data)
          ? res.data.data
          : [];
        if (list.length > 0) {
          this._backendAvailable = true;
          return list;
        }
      }
    } catch (e) {
      console.warn('Erreur récupération utilisateurs BDD:', e);
    }
    return INITIAL_USERS;
  }

  public async toggleUserStatus(id: string): Promise<ApiResponse<{ message: string; user: User }>> {
    return this.request(`/users/${id}/toggle-statut`, { method: 'PATCH' });
  }

  public async deleteUser(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/users/${id}`, { method: 'DELETE' });
  }

  /** Création d'un utilisateur par l'administrateur avec persistance MySQL */
  public async createUser(payload: {
    nom: string;
    prenom: string;
    email: string;
    password: string;
    role: 'CANDIDAT' | 'RECRUTEUR' | 'ADMIN';
    entreprise_id?: string;
    entreprise_nom?: string;
    titre?: string;
    telephone?: string;
    ville?: string;
  }): Promise<ApiResponse<{ user: User; message: string }>> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /** Modification d'un compte par l'administrateur / Récupération de compte (changement email, mot de passe) */
  public async updateUser(
    id: string,
    payload: {
      nom?: string;
      prenom?: string;
      email?: string;
      password?: string;
      role?: 'CANDIDAT' | 'RECRUTEUR' | 'ADMIN';
      statut?: 'ACTIF' | 'INACTIF';
      titre?: string;
      telephone?: string;
      ville?: string;
      entreprise_id?: string | null;
    }
  ): Promise<ApiResponse<{ user: User; message: string }>> {
    return this.request(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  /** Détacher un recruteur de son entreprise */
  public async detachRecruteurFromEntreprise(userId: string): Promise<ApiResponse<{ user: User; message: string }>> {
    return this.updateUser(userId, { entreprise_id: null });
  }

  /** Rattacher un recruteur à une entreprise */
  public async attachRecruteurToEntreprise(userId: string, entrepriseId: string): Promise<ApiResponse<{ user: User; message: string }>> {
    return this.updateUser(userId, { entreprise_id: entrepriseId });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  MODULE 2 — ROLES & PERMISSIONS (Admin)
  // ══════════════════════════════════════════════════════════════════════════

  public async getRoles(): Promise<Role[]> {
    try {
      const res = await this.request<{ roles?: Role[] } | Role[]>('/roles');
      if (res.success && res.data) {
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.data.roles)) return res.data.roles;
      }
    } catch {
      // fallback
    }
    return INITIAL_ROLES;
  }

  public async getPermissions(): Promise<Permission[]> {
    try {
      const res = await this.request<{ permissions?: Permission[] } | Permission[]>('/permissions');
      if (res.success && res.data) {
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.data.permissions)) return res.data.permissions;
      }
    } catch {
      // fallback
    }
    return INITIAL_PERMISSIONS;
  }

  public async updateRolePermissions(
    roleId: string,
    permissionIds: string[]
  ): Promise<ApiResponse<{ role: Role; message?: string }>> {
    return this.request<{ role: Role; message?: string }>(`/roles/${roleId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({
        permission_ids: permissionIds,
        permissions: permissionIds,
      }),
    });
  }

  public async createRole(data: {
    nom: string;
    description?: string;
    permission_ids?: string[];
  }): Promise<ApiResponse<{ role: Role; message?: string }>> {
    return this.request<{ role: Role; message?: string }>('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateRole(
    roleId: string,
    data: { nom?: string; description?: string }
  ): Promise<ApiResponse<{ role: Role; message?: string }>> {
    return this.request<{ role: Role; message?: string }>(`/roles/${roleId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  public async deleteRole(roleId: string): Promise<ApiResponse<{ message?: string }>> {
    return this.request<{ message?: string }>(`/roles/${roleId}`, {
      method: 'DELETE',
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  MODULE 4 — ENTREPRISES (Persistance directe Base de Données MySQL)
  // ══════════════════════════════════════════════════════════════════════════

  public async getEntreprises(): Promise<Entreprise[]> {
    try {
      const res = await this.request<{ data?: Entreprise[] } | Entreprise[]>('/companies');
      if (res.success && res.data) {
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.data.data)) return res.data.data;
      }
    } catch {}
    return INITIAL_COMPANIES;
  }

  public async createEntreprise(data: Partial<Entreprise>): Promise<ApiResponse<{ entreprise: Entreprise; message?: string }>> {
    return this.request<{ entreprise: Entreprise; message?: string }>('/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateEntreprise(id: string, data: Partial<Entreprise>): Promise<ApiResponse<{ entreprise: Entreprise; message?: string }>> {
    return this.request<{ entreprise: Entreprise; message?: string }>(`/companies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  public async toggleEntrepriseStatus(id: string, statut: 'ACTIVE' | 'DESACTIVEE'): Promise<ApiResponse<{ entreprise: Entreprise }>> {
    return this.request<{ entreprise: Entreprise }>(`/companies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ statut }),
    });
  }

  public async deleteEntreprise(id: string): Promise<ApiResponse<{ message?: string }>> {
    return this.request<{ message?: string }>(`/companies/${id}`, {
      method: 'DELETE',
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  MODULE FAVORIS (Persistance MySQL immédiate)
  // ══════════════════════════════════════════════════════════════════════════

  public async getFavoris(userId?: string): Promise<string[]> {
    try {
      const query = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
      const res = await this.request<{ favoris_offres_ids: string[] }>(`/candidates/favoris${query}`);
      if (res.success && res.data?.favoris_offres_ids) {
        return res.data.favoris_offres_ids;
      }
    } catch {}
    return [];
  }

  public async toggleFavori(offreId: string, userId?: string): Promise<string[] | null> {
    try {
      const res = await this.request<{ success: boolean; favoris_offres_ids: string[] }>('/candidates/favoris/toggle', {
        method: 'POST',
        body: JSON.stringify({ offre_id: offreId, user_id: userId }),
      });
      if (res.success && res.data?.favoris_offres_ids) {
        return res.data.favoris_offres_ids;
      }
    } catch {}
    return null;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  MODULE 11 — NOTIFICATIONS (Admin & Recruteurs)
  // ══════════════════════════════════════════════════════════════════════════

  public async getNotifications(): Promise<NotificationRecord[]> {
    try {
      const res = await this.request<any>('/notifications');
      if (res.success && res.data) {
        if (Array.isArray(res.data)) return res.data;
        if (res.data.data && Array.isArray(res.data.data)) return res.data.data;
      }
    } catch {}
    return INITIAL_NOTIFICATIONS;
  }

  public async resendNotification(id: string): Promise<ApiResponse> {
    try {
      return await this.request(`/notifications/${id}/resend`, { method: 'POST' });
    } catch {
      return { success: false, error: { message: 'Backend hors ligne.', status: 0 } };
    }
  }
}

// ─── Singleton exporté ───────────────────────────────────────────────────────
export const api = new ApiClient();
