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

  /** Inscription candidat */
  public async register(payload: {
    nom: string; prenom: string; email: string; password: string; rgpd: boolean;
  }): Promise<ApiResponse<{ token: string; user: User }>> {
    if (this._backendAvailable) {
      return this.request('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
    }
    return { success: false, error: { message: 'Backend hors ligne.', status: 0 } };
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

  // ══════════════════════════════════════════════════════════════════════════
  //  MODULE 5 — OFFRES
  // ══════════════════════════════════════════════════════════════════════════

  public async getOffresPubliques(params?: {
    search?: string; contrat?: string; lieu?: string;
  }): Promise<Offre[]> {
    if (this._backendAvailable) {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      const res = await this.request<{ data: Offre[] }>(`/jobs${qs ? '?' + qs : ''}`);
      if (res.success && res.data) return res.data.data;
    }
    return INITIAL_OFFRES.filter((o) => o.statut === 'PUBLIEE');
  }

  public async getOffreById(id: string): Promise<Offre | null> {
    if (this._backendAvailable) {
      const res = await this.request<Offre>(`/jobs/${id}`);
      if (res.success && res.data) return res.data;
    }
    return INITIAL_OFFRES.find((o) => o.id === id) ?? null;
  }

  public async createOffre(data: Partial<Offre>): Promise<ApiResponse<Offre>> {
    if (this._backendAvailable) return this.request('/recruiter/offres', { method: 'POST', body: JSON.stringify(data) });
    return { success: false, error: { message: 'Backend hors ligne.', status: 0 } };
  }

  public async updateOffre(id: string, data: Partial<Offre>): Promise<ApiResponse<Offre>> {
    if (this._backendAvailable) return this.request(`/recruiter/offres/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    return { success: false, error: { message: 'Backend hors ligne.', status: 0 } };
  }

  public async publierOffre(id: string): Promise<ApiResponse<Offre>> {
    if (this._backendAvailable) return this.request(`/recruiter/offres/${id}/publier`, { method: 'PATCH' });
    return { success: false, error: { message: 'Backend hors ligne.', status: 0 } };
  }

  public async cloturerOffre(id: string): Promise<ApiResponse<Offre>> {
    if (this._backendAvailable) return this.request(`/recruiter/offres/${id}/cloturer`, { method: 'PATCH' });
    return { success: false, error: { message: 'Backend hors ligne.', status: 0 } };
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  MODULE 7 — CANDIDATURES (Candidat)
  // ══════════════════════════════════════════════════════════════════════════

  public async getMesCandidatures(): Promise<Candidature[]> {
    if (this._backendAvailable) {
      const res = await this.request<{ data: Candidature[] }>('/candidate/candidatures');
      if (res.success && res.data) return res.data.data;
    }
    return INITIAL_CANDIDATURES;
  }

  public async postuler(payload: {
    offre_id: string; cv_id?: string; lettre_motivation?: string; message?: string;
  }): Promise<ApiResponse<Candidature>> {
    if (this._backendAvailable) {
      return this.request('/candidate/candidatures', { method: 'POST', body: JSON.stringify(payload) });
    }
    return { success: false, error: { message: 'Backend hors ligne.', status: 0 } };
  }

  public async retirerCandidature(id: string): Promise<ApiResponse> {
    if (this._backendAvailable) return this.request(`/candidate/candidatures/${id}`, { method: 'DELETE' });
    return { success: false, error: { message: 'Backend hors ligne.', status: 0 } };
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  MODULE 8 — CANDIDATURES (Recruteur)
  // ══════════════════════════════════════════════════════════════════════════

  public async getCandidaturesOffre(offreId: string): Promise<Candidature[]> {
    if (this._backendAvailable) {
      const res = await this.request<{ data: Candidature[] }>(`/recruiter/offres/${offreId}/candidatures`);
      if (res.success && res.data) return res.data.data;
    }
    return INITIAL_CANDIDATURES.filter((c) => c.offre_id === offreId);
  }

  public async changerStatutCandidature(
    id: string, statut: string, commentaire?: string
  ): Promise<ApiResponse<Candidature>> {
    if (this._backendAvailable) {
      return this.request(`/recruiter/candidatures/${id}/statut`, {
        method: 'PATCH', body: JSON.stringify({ statut, commentaire_recruteur: commentaire }),
      });
    }
    return { success: false, error: { message: 'Backend hors ligne.', status: 0 } };
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
    if (this._backendAvailable) {
      const res = await this.request<Candidat>('/candidate/profil');
      if (res.success && res.data) return res.data;
    }
    return INITIAL_CANDIDATS[0] ?? null;
  }

  public async updateProfil(data: Partial<Candidat>): Promise<ApiResponse<Candidat>> {
    if (this._backendAvailable) {
      return this.request('/candidate/profil', { method: 'PUT', body: JSON.stringify(data) });
    }
    return { success: false, error: { message: 'Backend hors ligne.', status: 0 } };
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
    if (this._backendAvailable) {
      const res = await this.request<{ data: User[] }>('/admin/users');
      if (res.success && res.data) return res.data.data;
    }
    return INITIAL_USERS;
  }

  public async toggleUserStatus(id: string, statut: 'ACTIF' | 'INACTIF'): Promise<ApiResponse<User>> {
    if (this._backendAvailable) {
      return this.request(`/admin/users/${id}/statut`, { method: 'PATCH', body: JSON.stringify({ statut }) });
    }
    return { success: false, error: { message: 'Backend hors ligne.', status: 0 } };
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  MODULE 2 — ROLES & PERMISSIONS (Admin)
  // ══════════════════════════════════════════════════════════════════════════

  public async getRoles(): Promise<Role[]> {
    if (this._backendAvailable) {
      const res = await this.request<Role[]>('/admin/roles');
      if (res.success && res.data) return res.data;
    }
    return INITIAL_ROLES;
  }

  public async updateRolePermissions(roleId: string, permissionIds: string[]): Promise<ApiResponse> {
    if (this._backendAvailable) {
      return this.request(`/admin/roles/${roleId}/permissions`, {
        method: 'PUT', body: JSON.stringify({ permissions: permissionIds }),
      });
    }
    return { success: false, error: { message: 'Backend hors ligne.', status: 0 } };
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  MODULE 4 — ENTREPRISES (Admin)
  // ══════════════════════════════════════════════════════════════════════════

  public async getEntreprises(): Promise<Entreprise[]> {
    if (this._backendAvailable) {
      const res = await this.request<{ data: Entreprise[] }>('/admin/entreprises');
      if (res.success && res.data) return res.data.data;
    }
    return INITIAL_COMPANIES;
  }

  public async toggleEntrepriseStatus(id: string, statut: 'ACTIVE' | 'DESACTIVEE'): Promise<ApiResponse<Entreprise>> {
    if (this._backendAvailable) {
      return this.request(`/admin/entreprises/${id}`, { method: 'PUT', body: JSON.stringify({ statut }) });
    }
    return { success: false, error: { message: 'Backend hors ligne.', status: 0 } };
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  MODULE 11 — NOTIFICATIONS (Admin)
  // ══════════════════════════════════════════════════════════════════════════

  public async getNotifications(): Promise<NotificationRecord[]> {
    if (this._backendAvailable) {
      const res = await this.request<{ data: NotificationRecord[] }>('/admin/notifications');
      if (res.success && res.data) return res.data.data;
    }
    return INITIAL_NOTIFICATIONS;
  }

  public async resendNotification(id: string): Promise<ApiResponse> {
    if (this._backendAvailable) return this.request(`/admin/notifications/${id}/resend`, { method: 'POST' });
    return { success: false, error: { message: 'Backend hors ligne.', status: 0 } };
  }
}

// ─── Singleton exporté ───────────────────────────────────────────────────────
export const api = new ApiClient();
