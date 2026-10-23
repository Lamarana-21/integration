import {
  AnalyseCv,
  ApplicationStatus,
  Candidature,
  CV,
  Entreprise,
  JobStatus,
  NotificationRecord,
  Offre,
  Role,
  User,
} from './types';
import {
  INITIAL_CANDIDATS,
  INITIAL_CANDIDATURES,
  INITIAL_COMPANIES,
  INITIAL_NOTIFICATIONS,
  INITIAL_OFFRES,
  INITIAL_PERMISSIONS,
  INITIAL_ROLES,
  INITIAL_USERS,
} from './initialData';

const LARAVEL_API_BASE = 'http://127.0.0.1:8000/api';

class ApiClient {
  private token: string | null = null;
  private backendAvailable: boolean | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('talenta_token');
    }
  }

  public setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('talenta_token', token);
      else localStorage.removeItem('talenta_token');
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  public async checkBackendHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${LARAVEL_API_BASE}/jobs`, { method: 'GET', signal: AbortSignal.timeout(1500) });
      this.backendAvailable = res.ok;
      return res.ok;
    } catch {
      this.backendAvailable = false;
      return false;
    }
  }

  public isBackendOnline(): boolean | null {
    return this.backendAvailable;
  }

  // --- Authentification ---
  public async login(email: string, mdp: string) {
    if (this.backendAvailable) {
      try {
        const res = await fetch(`${LARAVEL_API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ email, password: mdp }),
        });
        if (res.ok) {
          const data = await res.json();
          this.setToken(data.token);
          return { success: true, user: data.user };
        }
      } catch {}
    }

    // Fallback store
    const user = INITIAL_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      if (user.statut === 'INACTIF') {
        return { success: false, message: 'Votre compte est suspendu ou inactif (RM10).' };
      }
      return { success: true, user };
    }
    return { success: false, message: 'Identifiants invalides.' };
  }
}

export const api = new ApiClient();
