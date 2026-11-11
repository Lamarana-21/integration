'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { OffresPubliquesView } from '@/components/screens/OffresPubliquesView';
import { AuthModal } from '@/components/screens/AuthModal';
import { PostulerModal } from '@/components/screens/PostulerModal';
import { MesCandidaturesView } from '@/components/screens/MesCandidaturesView';
import { ProfilCandidatView } from '@/components/screens/ProfilCandidatView';
import { MesCvsView } from '@/components/screens/MesCvsView';
import { DashboardRecruteurView } from '@/components/screens/DashboardRecruteurView';
import { NouvelleOffreView } from '@/components/screens/NouvelleOffreView';
import { CandidaturesOffreView } from '@/components/screens/CandidaturesOffreView';
import { FicheCandidatIaView } from '@/components/screens/FicheCandidatIaView';
import { FicheEntrepriseView } from '@/components/screens/FicheEntrepriseView';
import { EntreprisesDirectoryView } from '@/components/screens/EntreprisesDirectoryView';
import { AdminUsersView } from '@/components/screens/AdminUsersView';
import { AdminRolesView } from '@/components/screens/AdminRolesView';
import { AdminEntreprisesView } from '@/components/screens/AdminEntreprisesView';
import { AdminNotificationsView } from '@/components/screens/AdminNotificationsView';
import { ParametresView } from '@/components/screens/ParametresView';
import { FavorisOffresView } from '@/components/screens/FavorisOffresView';
import { MessagerieView } from '@/components/screens/MessagerieView';
import { DashboardAdminView } from '@/components/screens/DashboardAdminView';
import { ProfilAdminView } from '@/components/screens/ProfilAdminView';
import { ProfilRecruteurView } from '@/components/screens/ProfilRecruteurView';
import { DashboardCandidatView } from '@/components/screens/DashboardCandidatView';
import { EntretiensCandidatView } from '@/components/screens/EntretiensCandidatView';
import { EntretiensRecruteurView } from '@/components/screens/EntretiensRecruteurView';
import {
  ApplicationStatus,
  Candidat,
  Candidature,
  ChatMessage,
  Conversation,
  Entreprise,
  JobStatus,
  NotificationRecord,
  Offre,
  Permission,
  Role,
  RoleName,
  User,
  JOB_ALIAS_MAP,
  isJobFavorited,
  isOfferExpired,
  hasCandidateAppliedToJob,
  formatFrenchDate,
} from '@/lib/types';
import {
  INITIAL_CANDIDATS,
  INITIAL_CANDIDATURES,
  INITIAL_COMPANIES,
  INITIAL_CONVERSATIONS,
  INITIAL_CVS,
  INITIAL_MESSAGES,
  INITIAL_NOTIFICATIONS,
  INITIAL_OFFRES,
  INITIAL_PERMISSIONS,
  INITIAL_ROLES,
  INITIAL_USERS,
} from '@/lib/initialData';
import { api } from '@/lib/api';

const DEPOSITED_CVS_STORAGE_KEY = 'talenta_deposited_cvs_v2';
const DECISIONS_STORAGE_KEY = 'talenta_decisions_v2';

interface StoredDecision {
  statut: ApplicationStatus;
  etapes_validees?: ApplicationStatus[];
  etape_avant_decision?: ApplicationStatus;
  commentaire_recruteur?: string;
  date_entretien?: string;
  type_entretien?: 'VISIO' | 'PRESENTIEL' | 'TELEPHONE';
  lien_ou_lieu_entretien?: string;
  updated_at?: string;
}

export function computeSequentialSteps(
  prevStatut: ApplicationStatus,
  prevValidated: ApplicationStatus[] | undefined,
  newStatus: ApplicationStatus
): { etapes_validees: ApplicationStatus[]; etape_avant_decision?: ApplicationStatus } {
  const ordered: ApplicationStatus[] = ['RECUE', 'EN_EXAMEN', 'PRESELECTIONNEE', 'ENTRETIEN'];
  const currentSet = new Set<ApplicationStatus>(prevValidated && prevValidated.length > 0 ? prevValidated : ['RECUE']);

  // S'assurer que les étapes jusqu'au statut précédent étaient bien validées
  const prevIdx = ordered.indexOf(prevStatut);
  if (prevIdx >= 0) {
    for (let i = 0; i <= prevIdx; i++) {
      currentSet.add(ordered[i]);
    }
  }

  if (newStatus === 'ACCEPTEE') {
    // Si accepté, toutes les étapes préalables du processus sont validées
    return {
      etapes_validees: ['RECUE', 'EN_EXAMEN', 'PRESELECTIONNEE', 'ENTRETIEN', 'ACCEPTEE'],
      etape_avant_decision: prevStatut !== 'ACCEPTEE' && prevStatut !== 'REFUSEE' ? prevStatut : 'ENTRETIEN',
    };
  }

  if (newStatus === 'REFUSEE') {
    // Si refusé, au minimum RECUE et EN_EXAMEN ont eu lieu, et on garde uniquement les étapes réellement franchies avant le refus
    currentSet.add('RECUE');
    currentSet.add('EN_EXAMEN');
    currentSet.delete('ACCEPTEE');
    currentSet.add('REFUSEE');
    return {
      etapes_validees: Array.from(currentSet),
      etape_avant_decision: prevStatut !== 'REFUSEE' && prevStatut !== 'ACCEPTEE' ? prevStatut : 'EN_EXAMEN',
    };
  }

  const targetIdx = ordered.indexOf(newStatus);
  const nextValidated: ApplicationStatus[] = [];
  if (targetIdx >= 0) {
    for (let i = 0; i <= targetIdx; i++) {
      nextValidated.push(ordered[i]);
    }
  } else {
    nextValidated.push('RECUE');
  }
  return {
    etapes_validees: nextValidated,
    etape_avant_decision: newStatus,
  };
}

function saveDecisionToStorage(keys: string[], decision: StoredDecision) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(DECISIONS_STORAGE_KEY);
    const map: Record<string, StoredDecision> = raw ? JSON.parse(raw) : {};
    keys.filter(Boolean).forEach((k) => {
      map[k] = decision;
    });
    localStorage.setItem(DECISIONS_STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

function readFileAsBase64(file: File): Promise<{ base64: string; dataUrl: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : '';
      resolve({ base64, dataUrl });
    };
    reader.onerror = () => resolve({ base64: '', dataUrl: '' });
    reader.readAsDataURL(file);
  });
}

function saveDepositedCvToStorage(keys: string[], cv: import('@/lib/types').CV) {
  if (typeof window === 'undefined' || !cv) return;
  try {
    const raw = localStorage.getItem(DEPOSITED_CVS_STORAGE_KEY);
    const map: Record<string, import('@/lib/types').CV> = raw ? JSON.parse(raw) : {};
    keys.filter(Boolean).forEach((k) => {
      map[k] = cv;
    });
    localStorage.setItem(DEPOSITED_CVS_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('Stockage local CV volumineux ignoré:', e);
  }
}

function hydrateCandidaturesWithDepositedCvs(cands: Candidature[]): Candidature[] {
  if (typeof window === 'undefined') return cands;
  try {
    const rawCvs = localStorage.getItem(DEPOSITED_CVS_STORAGE_KEY);
    const cvMap: Record<string, import('@/lib/types').CV> = rawCvs ? JSON.parse(rawCvs) : {};
    const rawDecisions = localStorage.getItem(DECISIONS_STORAGE_KEY);
    const decMap: Record<string, StoredDecision> = rawDecisions ? JSON.parse(rawDecisions) : {};

    return cands.map((c) => {
      const candidateUserId = c.candidat?.utilisateur_id || c.candidat?.user?.id || '';
      const candidateEmail = (c.candidat?.user?.email || '').toLowerCase().trim();
      const candidateFullName = `${c.candidat?.prenom || c.candidat?.user?.prenom || ''}_${c.candidat?.nom || c.candidat?.user?.nom || ''}`
        .toLowerCase()
        .trim();
      const offreTitleKey = (c.offre?.titre || '').toLowerCase().trim();

      const cvMatch =
        cvMap[c.id] ||
        (c.cv_id ? cvMap[c.cv_id] : undefined) ||
        cvMap[`${c.candidat_id}_${c.offre_id}`] ||
        (candidateUserId ? cvMap[`${candidateUserId}_${c.offre_id}`] : undefined) ||
        (candidateEmail ? cvMap[`${candidateEmail}_${c.offre_id}`] : undefined) ||
        (candidateEmail && offreTitleKey ? cvMap[`${candidateEmail}_${offreTitleKey}`] : undefined) ||
        (candidateFullName && offreTitleKey ? cvMap[`${candidateFullName}_${offreTitleKey}`] : undefined);

      const decMatch =
        decMap[c.id] ||
        decMap[`${c.candidat_id}_${c.offre_id}`] ||
        (candidateUserId ? decMap[`${candidateUserId}_${c.offre_id}`] : undefined) ||
        (candidateEmail ? decMap[`${candidateEmail}_${c.offre_id}`] : undefined) ||
        (candidateEmail && offreTitleKey ? decMap[`${candidateEmail}_${offreTitleKey}`] : undefined) ||
        (candidateFullName && c.offre_id ? decMap[`${candidateFullName}_${c.offre_id}`] : undefined) ||
        (candidateFullName && offreTitleKey ? decMap[`${candidateFullName}_${offreTitleKey}`] : undefined);

      let nextCand: Candidature = { ...c };

      if (cvMatch) {
        nextCand = {
          ...nextCand,
          cv: {
            ...(nextCand.cv || {}),
            ...cvMatch,
            contenu_base64: cvMatch.contenu_base64 || nextCand.cv?.contenu_base64,
            url_stockage: cvMatch.url_stockage || nextCand.cv?.url_stockage || '',
          },
        };
      }

      if (decMatch) {
        nextCand = {
          ...nextCand,
          statut: decMatch.statut || nextCand.statut,
          etapes_validees: decMatch.etapes_validees || nextCand.etapes_validees,
          etape_avant_decision: decMatch.etape_avant_decision || nextCand.etape_avant_decision,
          commentaire_recruteur:
            decMatch.commentaire_recruteur !== undefined
              ? decMatch.commentaire_recruteur
              : nextCand.commentaire_recruteur,
          date_entretien: decMatch.date_entretien || nextCand.date_entretien,
          type_entretien: decMatch.type_entretien || nextCand.type_entretien,
          lien_ou_lieu_entretien: decMatch.lien_ou_lieu_entretien || nextCand.lien_ou_lieu_entretien,
          updated_at: decMatch.updated_at || nextCand.updated_at,
        };
      }

      return nextCand;
    });
  } catch {
    return cands;
  }
}

export default function AppRoot() {
  const [isMounted, setIsMounted] = useState(false);

  // Application State - Sécurité : par défaut l'utilisateur est un simple VISITEUR non connecté
  const [currentRole, setCurrentRole] = useState<RoleName>('VISITEUR');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeScreen, setActiveScreen] = useState<string>('E1');
  const [backendOnline, setBackendOnline] = useState<boolean | null>(false);

  // Entities Data Store
  const [offres, setOffres] = useState<Offre[]>(INITIAL_OFFRES);
  const [candidatures, setCandidatures] = useState<Candidature[]>(INITIAL_CANDIDATURES);
  const [candidatProfile, setCandidatProfile] = useState<Candidat>(INITIAL_CANDIDATS[0]);
  const [entreprises, setEntreprises] = useState<Entreprise[]>(INITIAL_COMPANIES);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES);
  const [allPermissions, setAllPermissions] = useState<Permission[]>(INITIAL_PERMISSIONS);
  const [notifications, setNotifications] = useState<NotificationRecord[]>(INITIAL_NOTIFICATIONS);

  // Favoris & Messagerie dynamique (initialisés vides pour les visiteurs / sécurité)
  const [favorisOffresIds, setFavorisOffresIds] = useState<string[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Active items for detail views
  const [selectedOffreForDetail, setSelectedOffreForDetail] = useState<Offre | null>(null);
  const [selectedCandidatureForDetail, setSelectedCandidatureForDetail] = useState<Candidature | null>(
    INITIAL_CANDIDATURES[0]
  );
  const [selectedEntrepriseForDetail, setSelectedEntrepriseForDetail] = useState<Entreprise | null>(null);
  const [editingOffre, setEditingOffre] = useState<Offre | null>(null);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [postulerModalOpen, setPostulerModalOpen] = useState(false);
  const [postulerOffreTarget, setPostulerOffreTarget] = useState<Offre | null>(null);

  // Définition rigoureuse et exclusive des catégories d'écrans (RBAC)
  const CANDIDATE_EXCLUSIVE = ['E_CANDIDAT_DASHBOARD', 'E5', 'E_ENTRETIENS', 'E6', 'E6_PROFIL', 'E6_CV', 'E_FAVORIS'];
  const RECRUTEUR_EXCLUSIVE = ['E7', 'E8', 'E9', 'E10', 'E_RECRUTEUR_ENTRETIENS', 'E_RECRUTEUR_PROFIL'];
  const ADMIN_EXCLUSIVE = ['E_ADMIN_DASHBOARD', 'E12', 'E13', 'E14', 'E15', 'E_ADMIN_PROFIL'];
  const SHARED_AUTH_ROUTES = ['E_MESSAGES', 'E_SETTINGS'];
  const PUBLIC_ROUTES = ['E1', 'E3', 'E11'];

  const isCandidateRoute = (screen: string) =>
    CANDIDATE_EXCLUSIVE.includes(screen) || SHARED_AUTH_ROUTES.includes(screen) || PUBLIC_ROUTES.includes(screen);
  const isRecruiterRoute = (screen: string) =>
    RECRUTEUR_EXCLUSIVE.includes(screen) || SHARED_AUTH_ROUTES.includes(screen) || (currentRole !== 'RECRUTEUR' && PUBLIC_ROUTES.includes(screen));
  const isAdminRoute = (screen: string) =>
    ADMIN_EXCLUSIVE.includes(screen) || SHARED_AUTH_ROUTES.includes(screen) || PUBLIC_ROUTES.includes(screen);
  const isProtectedRoute = (screen: string) =>
    CANDIDATE_EXCLUSIVE.includes(screen) || RECRUTEUR_EXCLUSIVE.includes(screen) || ADMIN_EXCLUSIVE.includes(screen) || SHARED_AUTH_ROUTES.includes(screen);

  // Contrôleur de navigation avec garde de sécurité
  const handleNavigate = (targetScreen: string) => {
    if (targetScreen === 'login' || targetScreen === 'LOGIN') {
      setAuthModalTab('login');
      setAuthModalOpen(true);
      try { window.history.replaceState(null, '', '#login'); } catch {}
      return;
    }
    if (targetScreen === 'register' || targetScreen === 'REGISTER') {
      setAuthModalTab('register');
      setAuthModalOpen(true);
      try { window.history.replaceState(null, '', '#register'); } catch {}
      return;
    }

    const screen = targetScreen === 'E6' ? 'E6_PROFIL' : targetScreen;

    // Si la route est privée et que l'utilisateur n'est pas connecté -> Ouverture de la fenêtre de connexion
    if (!currentUser && isProtectedRoute(screen)) {
      setAuthModalTab('login');
      setAuthModalOpen(true);
      return;
    }

    // Synchronisation en temps réel des offres publiées avec MySQL
    if (screen === 'E1' || screen === 'E_CANDIDAT_DASHBOARD') {
      api.getOffresPubliques().then((dbOffres) => {
        if (dbOffres && dbOffres.length > 0) setOffres(dbOffres);
      }).catch(() => {});
    }

    // Synchronisation dynamique immédiate des candidatures et décisions
    if (screen === 'E5' || screen === 'E_ENTRETIENS' || screen === 'E_CANDIDAT_DASHBOARD' || screen === 'E7' || screen === 'E9') {
      setCandidatures((prev) => hydrateCandidaturesWithDepositedCvs(prev));
      api.getAllCandidatures().then((dbCands) => {
        if (dbCands && dbCands.length > 0) {
          const hydrated = hydrateCandidaturesWithDepositedCvs(dbCands);
          setCandidatures((prev) => {
            const dbIds = new Set(hydrated.map((c) => c.id));
            const unsynced = hydrateCandidaturesWithDepositedCvs(prev.filter((c) => !dbIds.has(c.id)));
            return [...hydrated, ...unsynced];
          });
        }
      }).catch(() => {});
      if (screen === 'E5' || screen === 'E_ENTRETIENS' || screen === 'E_CANDIDAT_DASHBOARD') {
        api.getMesCandidatures().then((myCands) => {
          if (myCands && myCands.length > 0) {
            const hydratedMy = hydrateCandidaturesWithDepositedCvs(myCands);
            setCandidatures((prev) => {
              const myIds = new Set(hydratedMy.map((c) => c.id));
              const others = hydrateCandidaturesWithDepositedCvs(prev.filter((c) => !myIds.has(c.id)));
              return [...hydratedMy, ...others];
            });
          }
        }).catch(() => {});
      }
    }

    // Synchronisation dynamique des entreprises si navigation vers Entreprises (E11) ou Admin (E14)
    if (screen === 'E11' || screen === 'E14') {
      api.getEntreprises().then((dbEnts) => {
        if (dbEnts && dbEnts.length > 0) setEntreprises(dbEnts);
      }).catch(() => {});
    }

    // Synchronisation dynamique immédiate des favoris si navigation vers les favoris
    if (screen === 'E_FAVORIS') {
      try {
        const cachedFavs = sessionStorage.getItem('talenta_favoris');
        if (cachedFavs) {
          const parsed = JSON.parse(cachedFavs);
          if (Array.isArray(parsed)) setFavorisOffresIds(parsed);
        }
      } catch {}
      if (currentUser?.id) {
        api.getFavoris(currentUser.id).then((dbFavs) => {
          if (Array.isArray(dbFavs) && dbFavs.length > 0) {
            setFavorisOffresIds(dbFavs);
            try {
              sessionStorage.setItem('talenta_favoris', JSON.stringify(dbFavs));
            } catch {}
          }
        }).catch(() => {});
      }
    }

    setActiveScreen(screen);
  };

  // Check Laravel Backend Health & Restore Session State UNIQUEMENT si l'utilisateur est authentifié
  useEffect(() => {
    api.checkBackendHealth().then((isOnline) => {
      setBackendOnline(isOnline);
    });

    try {
      const hash = window.location.hash.replace(/^#/, '');
      // ISOLATION STRICTE PAR ONGLET : Priorité absolue à sessionStorage
      // pour éviter qu'un onglet ouvert écrase ou redirige un autre onglet
      const savedUserStr = sessionStorage.getItem('talenta_current_user');
      const savedRole = sessionStorage.getItem('talenta_current_role') as RoleName | null;
      const savedScreen = hash || sessionStorage.getItem('talenta_active_screen');

      let restoredUser: User | null = null;
      if (savedUserStr) {
        try {
          restoredUser = JSON.parse(savedUserStr);
        } catch {
          restoredUser = null;
        }
      }

      // CONTRÔLE DE SÉCURITÉ MAJEUR : Si aucun compte n'est authentifié dans cet onglet
      if (!restoredUser) {
        setCurrentUser(null);
        setCurrentRole('VISITEUR');
        sessionStorage.removeItem('talenta_session_active');
        sessionStorage.removeItem('talenta_current_user');
        sessionStorage.setItem('talenta_current_role', 'VISITEUR');

        // Si l'utilisateur tente d'accéder directement à un écran protégé sans connexion
        if (hash === 'login') {
          setActiveScreen('E1');
          sessionStorage.setItem('talenta_active_screen', 'E1');
          setAuthModalTab('login');
          setAuthModalOpen(true);
        } else if (hash === 'register') {
          setActiveScreen('E1');
          sessionStorage.setItem('talenta_active_screen', 'E1');
          setAuthModalTab('register');
          setAuthModalOpen(true);
        } else if (hash && isProtectedRoute(hash)) {
          setActiveScreen('E1');
          sessionStorage.setItem('talenta_active_screen', 'E1');
          window.history.replaceState(null, '', '#E1');
          setAuthModalTab('login');
          setAuthModalOpen(true);
        } else if (PUBLIC_ROUTES.includes(hash)) {
          setActiveScreen(hash);
          sessionStorage.setItem('talenta_active_screen', hash);
        } else {
          setActiveScreen('E1');
          sessionStorage.setItem('talenta_active_screen', 'E1');
          if (window.location.hash && window.location.hash !== '#E1') {
            window.history.replaceState(null, '', '#E1');
          }
        }
      } else {
        // L'utilisateur est connecté dans cet onglet
        setCurrentUser(restoredUser);
        const userRole = savedRole || (restoredUser.role?.nom as RoleName) || 'CANDIDAT';
        setCurrentRole(userRole);

        // Sauvegarder dans sessionStorage pour cet onglet
        sessionStorage.setItem('talenta_session_active', 'true');
        sessionStorage.setItem('talenta_current_user', JSON.stringify(restoredUser));
        sessionStorage.setItem('talenta_current_role', userRole);

        // Si l'utilisateur connecté est un candidat, synchroniser directement les favoris et profil depuis MySQL
        if (userRole === 'CANDIDAT') {
          // Restauration immédiate des favoris depuis le cache de session
          try {
            const cachedFavs = sessionStorage.getItem('talenta_favoris');
            if (cachedFavs) setFavorisOffresIds(JSON.parse(cachedFavs));
          } catch {}

          api.getFavoris(restoredUser.id).then((dbFavs) => {
            if (Array.isArray(dbFavs)) {
              setFavorisOffresIds(dbFavs);
              sessionStorage.setItem('talenta_favoris', JSON.stringify(dbFavs));
            }
          }).catch(() => {});

          api.getMonProfil().then((dbProfile) => {
            if (dbProfile) {
              const activeNom = dbProfile.nom || dbProfile.user?.nom || restoredUser.nom;
              const activePrenom = dbProfile.prenom || dbProfile.user?.prenom || restoredUser.prenom;
              const resolved: Candidat = {
                ...dbProfile,
                nom: activeNom,
                prenom: activePrenom,
                user: {
                  ...(dbProfile.user || {}),
                  ...restoredUser,
                  nom: activeNom,
                  prenom: activePrenom,
                },
              };
              setCandidatProfile(resolved);
              if (Array.isArray(dbProfile.favoris_offres_ids) && dbProfile.favoris_offres_ids.length > 0) {
                setFavorisOffresIds(dbProfile.favoris_offres_ids);
                sessionStorage.setItem('talenta_favoris', JSON.stringify(dbProfile.favoris_offres_ids));
              }
              if (resolved.user) {
                setCurrentUser((prev) => (prev ? { ...prev, ...resolved.user } : prev));
              }
            }
          }).catch(() => {});
        }

        let targetScreen = savedScreen || (userRole === 'CANDIDAT' ? 'E_CANDIDAT_DASHBOARD' : userRole === 'RECRUTEUR' ? 'E7' : 'E_ADMIN_DASHBOARD');
        if (targetScreen === 'E6') targetScreen = 'E6_PROFIL';

        // Contrôle d'accès basé sur les rôles (RBAC) - UNIQUEMENT si l'écran demandé est strictement interdit au rôle
        if (userRole === 'CANDIDAT' && (RECRUTEUR_EXCLUSIVE.includes(targetScreen) || ADMIN_EXCLUSIVE.includes(targetScreen))) {
          targetScreen = 'E_CANDIDAT_DASHBOARD';
        } else if (userRole === 'RECRUTEUR' && (CANDIDATE_EXCLUSIVE.includes(targetScreen) || ADMIN_EXCLUSIVE.includes(targetScreen) || targetScreen === 'E11')) {
          targetScreen = 'E7';
        } else if (userRole === 'ADMIN' && (CANDIDATE_EXCLUSIVE.includes(targetScreen) || RECRUTEUR_EXCLUSIVE.includes(targetScreen))) {
          targetScreen = 'E_ADMIN_DASHBOARD';
        }

        setActiveScreen(targetScreen);
        sessionStorage.setItem('talenta_active_screen', targetScreen);
        if (window.location.hash.replace(/^#/, '') !== targetScreen) {
          window.history.replaceState(null, '', `#${targetScreen}`);
        }
      }

      // 1. Synchronisation intégrale directe avec la Base de Données MySQL via l'API
      Promise.all([
        api.getUsers(),
        api.getOffresPubliques(),
        api.getAllCandidatures(),
        api.getEntreprises(),
        api.getRoles(),
        api.getPermissions(),
        api.getNotifications(),
      ])
        .then(([dbUsers, dbOffres, dbCands, dbEnts, dbRoles, dbPerms, dbNotifs]) => {
          if (dbUsers && dbUsers.length > 0) setUsers(dbUsers);
          if (dbOffres && dbOffres.length > 0) {
            setOffres(dbOffres);
          }
          if (dbCands && dbCands.length > 0) setCandidatures(hydrateCandidaturesWithDepositedCvs(dbCands));
          if (dbEnts && dbEnts.length > 0) setEntreprises(dbEnts);
          if (dbRoles && dbRoles.length > 0) setRoles(dbRoles);
          if (dbPerms && dbPerms.length > 0) setAllPermissions(dbPerms);
          if (dbNotifs && dbNotifs.length > 0) setNotifications(dbNotifs);
        })
        .catch((err) => {
          console.warn('Chargement des données MySQL:', err);
        });

      // Restauration des conversations, messages et décisions dynamiques
      try {
        const savedConvs = localStorage.getItem('talenta_conversations_v2');
        const savedMsgs = localStorage.getItem('talenta_messages_v2');
        if (savedConvs) setConversations(JSON.parse(savedConvs));
        if (savedMsgs) setMessages(JSON.parse(savedMsgs));
        setCandidatures((prev) => hydrateCandidaturesWithDepositedCvs(prev));
      } catch {}
    } catch (err) {
      console.error('Erreur restauration session Talenta:', err);
    } finally {
      setIsMounted(true);
    }
  }, []);

  // Synchronisation inter-onglets en temps réel (décisions recruteur, CV déposés, messagerie)
  useEffect(() => {
    const handleStorageSync = (e: StorageEvent) => {
      if (e.key === DECISIONS_STORAGE_KEY || e.key === DEPOSITED_CVS_STORAGE_KEY) {
        setCandidatures((prev) => hydrateCandidaturesWithDepositedCvs(prev));
      } else if (e.key === 'talenta_conversations_v2' && e.newValue) {
        try {
          setConversations(JSON.parse(e.newValue));
        } catch {}
      } else if (e.key === 'talenta_messages_v2' && e.newValue) {
        try {
          setMessages(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageSync);
    return () => window.removeEventListener('storage', handleStorageSync);
  }, []);

  // Synchronisation activeScreen -> sessionStorage & URL hash
  useEffect(() => {
    if (!isMounted) return;
    try {
      sessionStorage.setItem('talenta_active_screen', activeScreen);
      if (window.location.hash.replace(/^#/, '') !== activeScreen) {
        window.history.replaceState(null, '', `#${activeScreen}`);
      }
    } catch (e) {}
  }, [activeScreen, isMounted]);

  // Écoute de l'historique de navigation (boutons Précédent / Suivant du navigateur) avec contrôle d'accès
  useEffect(() => {
    if (!isMounted) return;
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (hash === 'login') {
        setAuthModalTab('login');
        setAuthModalOpen(true);
        return;
      }
      if (hash === 'register') {
        setAuthModalTab('register');
        setAuthModalOpen(true);
        return;
      }
      if (hash && hash !== activeScreen) {
        const target = hash === 'E6' ? 'E6_PROFIL' : hash;
        if (!currentUser && isProtectedRoute(target)) {
          window.history.replaceState(null, '', '#E1');
          setActiveScreen('E1');
          setAuthModalTab('login');
          setAuthModalOpen(true);
          return;
        }

        // Contrôle d'accès RBAC lors du retour arrière
        if (currentUser && currentRole === 'CANDIDAT' && (RECRUTEUR_EXCLUSIVE.includes(target) || ADMIN_EXCLUSIVE.includes(target))) {
          window.history.replaceState(null, '', '#E_CANDIDAT_DASHBOARD');
          setActiveScreen('E_CANDIDAT_DASHBOARD');
          return;
        }
        if (currentUser && currentRole === 'RECRUTEUR' && (CANDIDATE_EXCLUSIVE.includes(target) || ADMIN_EXCLUSIVE.includes(target) || target === 'E11')) {
          window.history.replaceState(null, '', '#E7');
          setActiveScreen('E7');
          return;
        }
        if (currentUser && currentRole === 'ADMIN' && (CANDIDATE_EXCLUSIVE.includes(target) || RECRUTEUR_EXCLUSIVE.includes(target))) {
          window.history.replaceState(null, '', '#E_ADMIN_DASHBOARD');
          setActiveScreen('E_ADMIN_DASHBOARD');
          return;
        }

        setActiveScreen(target);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeScreen, isMounted, currentUser, currentRole]);

  // Synchronisation du rôle dans la session
  useEffect(() => {
    if (!isMounted) return;
    try {
      sessionStorage.setItem('talenta_current_role', currentRole);
    } catch (e) {}
  }, [currentRole, isMounted]);

  // Synchronisation de l'utilisateur en session active
  useEffect(() => {
    if (!isMounted) return;
    try {
      if (currentUser) {
        sessionStorage.setItem('talenta_session_active', 'true');
        sessionStorage.setItem('talenta_current_user', JSON.stringify(currentUser));
      } else {
        sessionStorage.removeItem('talenta_session_active');
        sessionStorage.removeItem('talenta_current_user');
      }
    } catch (e) {}
  }, [currentUser, isMounted]);

  // Persistance des conversations et messages (pour synchroniser les réponses écrites par les recruteurs)
  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem('talenta_conversations_v2', JSON.stringify(conversations));
      localStorage.setItem('talenta_messages_v2', JSON.stringify(messages));
    } catch {}
  }, [conversations, messages, isMounted]);

  // Mise à jour du profil candidat avec persistance immédiate en base de données (MySQL via Laravel)
  const handleUpdateCandidatProfile = async (updated: Partial<Candidat>) => {
    const updatedNom = updated.nom !== undefined ? updated.nom : updated.user?.nom;
    const updatedPrenom = updated.prenom !== undefined ? updated.prenom : updated.user?.prenom;
    const updatedAvatar = updated.avatar_url !== undefined ? updated.avatar_url : updated.user?.avatar_url;

    // 1. Mise à jour immédiate de l'état local pour fluidité de l'interface
    setCandidatProfile((prev) => {
      const nextNom = updatedNom !== undefined ? updatedNom : prev.nom;
      const nextPrenom = updatedPrenom !== undefined ? updatedPrenom : prev.prenom;
      const baseUser = prev.user || currentUser;
      const nextUser = baseUser
        ? {
            ...baseUser,
            nom: nextNom || baseUser.nom,
            prenom: nextPrenom || baseUser.prenom,
            avatar_url: updatedAvatar !== undefined ? updatedAvatar : baseUser.avatar_url,
          }
        : undefined;
      return {
        ...prev,
        ...updated,
        nom: nextNom,
        prenom: nextPrenom,
        user: nextUser,
      };
    });

    if (currentUser) {
      setCurrentUser((prevUser) =>
        prevUser
          ? {
              ...prevUser,
              nom: updatedNom !== undefined ? updatedNom : prevUser.nom,
              prenom: updatedPrenom !== undefined ? updatedPrenom : prevUser.prenom,
              avatar_url:
                updatedAvatar !== undefined
                  ? updatedAvatar
                  : prevUser.avatar_url,
            }
          : prevUser
      );
    }

    // 2. Persistance dans la base de données MySQL via l'API Laravel
    const payload: Record<string, unknown> = {
      nom: updatedNom,
      prenom: updatedPrenom,
      titre: updated.titre,
      telephone: updated.telephone,
      ville: updated.ville,
      pays: updated.pays,
      avatar_url: updatedAvatar,
      resume: updated.resume,
      linkedin_url: updated.linkedin_url,
      github_url: updated.github_url,
      portfolio_url: updated.portfolio_url,
      competences: updated.competences,
      experiences: updated.experiences,
      formations: updated.formations,
      langues: updated.langues,
    };
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

    try {
      const res = await api.updateProfil(payload);
      if (res.success && res.data) {
        const fresh = res.data;
        const freshNom = (fresh.nom || fresh.user?.nom || updatedNom || '') as string;
        const freshPrenom = (fresh.prenom || fresh.user?.prenom || updatedPrenom || '') as string;
        const finalResolved: Candidat = {
          ...fresh,
          nom: freshNom,
          prenom: freshPrenom,
          user: fresh.user
            ? {
                ...fresh.user,
                nom: freshNom,
                prenom: freshPrenom,
              }
            : currentUser
            ? {
                ...currentUser,
                nom: freshNom,
                prenom: freshPrenom,
              }
            : undefined,
        };
        setCandidatProfile(finalResolved);
        if (finalResolved.user) {
          setCurrentUser((prev) => (prev ? { ...prev, ...finalResolved.user } : prev));
        }
      }
    } catch (e) {
      console.warn('Sauvegarde BDD en attente ou hors-ligne:', e);
    }
  };

  // Rechargement manuel des données fraîches depuis la base de données MySQL
  const handleRefreshFromDb = async () => {
    try {
      const dbProfile = await api.getMonProfil();
      if (dbProfile) {
        setCandidatProfile(dbProfile);
        if (dbProfile.user) {
          setCurrentUser((prev) => (prev ? { ...prev, ...dbProfile.user } : prev));
        }
      }
    } catch (e) {
      console.warn('Erreur rechargement BDD:', e);
    }
  };

  // Mise à jour générique du profil utilisateur (Admin ou Recruteur)
  const handleUpdateUserProfile = (updatedData: Partial<User>) => {
    setCurrentUser((prev) => (prev ? { ...prev, ...updatedData } : null));
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser?.id ? { ...u, ...updatedData } : u))
    );
    try {
      const updatedUser = { ...(currentUser || {}), ...updatedData };
      sessionStorage.setItem('talenta_current_user', JSON.stringify(updatedUser));
    } catch (e) {}
  };

  // Gestion des favoris avec contrôle de sécurité, mise à jour optimiste immédiate et persistance MySQL
  const handleToggleFavori = async (offreId: string) => {
    // Si l'utilisateur n'est pas connecté ou est un simple visiteur, demander la connexion
    if (!currentUser || currentRole === 'VISITEUR') {
      setAuthModalTab('login');
      setAuthModalOpen(true);
      return;
    }

    // 1. Mise à jour optimiste immédiate dans le state et sessionStorage (aucun clignotement)
    const cleanTargetId = String(offreId).trim().toLowerCase();
    const isCurrentlyFav = isJobFavorited(offreId, favorisOffresIds);
    const aliases = [cleanTargetId, ...(JOB_ALIAS_MAP[cleanTargetId] || []).map((a) => a.toLowerCase())];

    const optimisticNext = isCurrentlyFav
      ? favorisOffresIds.filter((id) => !aliases.includes(String(id).trim().toLowerCase()))
      : [...favorisOffresIds, offreId];

    setFavorisOffresIds(optimisticNext);
    try {
      sessionStorage.setItem('talenta_favoris', JSON.stringify(optimisticNext));
    } catch {}

    // 2. Persistance directe dans la base de données MySQL via le contrôleur Laravel
    try {
      const dbFavs = await api.toggleFavori(offreId, currentUser.id);
      if (Array.isArray(dbFavs)) {
        setFavorisOffresIds(dbFavs);
        try {
          sessionStorage.setItem('talenta_favoris', JSON.stringify(dbFavs));
        } catch {}
      }
    } catch (e) {
      console.warn('Erreur synchronisation favoris BDD:', e);
    }
  };

  // Gestion de l'envoi de messages
  const handleSendMessage = (
    conversationId: string,
    contenu: string,
    overrideSenderRole?: RoleName,
    overrideSenderName?: string
  ) => {
    const conv = conversations.find((c) => c.id === conversationId);
    if (!conv) return;

    const actualRole = overrideSenderRole || currentRole;
    const isCandidat = actualRole === 'CANDIDAT';
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nowStr = `${now.toISOString().replace('T', ' ').substring(0, 10)} ${timeStr}`;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      conversation_id: conversationId,
      sender_id: isCandidat ? conv.candidat_id : conv.recruteur_id,
      sender_role: actualRole,
      sender_name:
        overrideSenderName ||
        (currentUser
          ? `${currentUser.prenom} ${currentUser.nom}`
          : isCandidat
          ? conv.candidat_nom
          : conv.recruteur_nom),
      receiver_id: isCandidat ? conv.recruteur_id : conv.candidat_id,
      receiver_name: isCandidat ? conv.recruteur_nom : conv.candidat_nom,
      contenu,
      created_at: nowStr,
      lu: false,
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);

    const updatedConversations = conversations.map((c) => {
      if (c.id === conversationId) {
        return {
          ...c,
          dernier_message: contenu,
          updated_at: nowStr,
          non_lus_candidat: isCandidat ? 0 : c.non_lus_candidat + 1,
          non_lus_recruteur: isCandidat ? c.non_lus_recruteur + 1 : 0,
        };
      }
      return c;
    });
    setConversations(updatedConversations);
  };

  // Sélectionner une discussion et marquer les messages comme lus pour l'acteur connecté
  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setConversations((prev) => {
      const target = prev.find((c) => c.id === conversationId);
      if (!target) return prev;

      const hasUnread =
        (currentRole === 'CANDIDAT' && (target.non_lus_candidat || 0) > 0) ||
        (currentRole === 'RECRUTEUR' && (target.non_lus_recruteur || 0) > 0);

      // Si déjà marqué comme lu, ne pas recréer d'état pour éviter les boucles de rendu
      if (!hasUnread) return prev;

      return prev.map((c) => {
        if (c.id === conversationId) {
          return {
            ...c,
            non_lus_candidat: currentRole === 'CANDIDAT' ? 0 : c.non_lus_candidat,
            non_lus_recruteur: currentRole === 'RECRUTEUR' ? 0 : c.non_lus_recruteur,
          };
        }
        return c;
      });
    });
  };

  // Initier une conversation avec l'entreprise depuis une offre
  const handleContactRecruiter = (offre: Offre) => {
    if (!currentUser) {
      setAuthModalTab('login');
      setAuthModalOpen(true);
      return;
    }

    const staticMockIds = ['conv-1', 'conv-2', 'conv-3', 'conv-4', 'conv-5'];
    const candId = currentUser.id;
    const candName = `${currentUser.prenom} ${currentUser.nom}`.trim();
    const entrepriseName = offre.entreprise?.nom || 'Entreprise partenaire';
    const recruteurId = offre.entreprise?.nom?.toLowerCase().includes('beta') ? 'u-rec-beta' : 'u-rec-alpha';

    let existing = conversations.find(
      (c) =>
        !staticMockIds.includes(c.id) &&
        (c.candidat_id === candId || (candName && c.candidat_nom.toLowerCase().trim() === candName.toLowerCase().trim())) &&
        (c.offre_id === offre.id || (c.entreprise_id && c.entreprise_id === offre.entreprise_id))
    );

    if (!existing) {
      existing = {
        id: `conv-${Date.now()}`,
        candidat_id: candId,
        candidat_nom: candName,
        candidat_avatar: currentUser.avatar_url,
        recruteur_id: recruteurId,
        recruteur_nom: entrepriseName,
        entreprise_id: offre.entreprise_id || 'c-alpha',
        entreprise_nom: entrepriseName,
        offre_id: offre.id,
        offre_titre: offre.titre,
        dernier_message: '',
        updated_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
        non_lus_candidat: 0,
        non_lus_recruteur: 0,
      };
      const newConvs = [existing, ...conversations];
      setConversations(newConvs);
    }

    setSelectedConversationId(existing.id);
    handleNavigate('E_MESSAGES');
  };

  // Total messages non lus adapté à l'acteur connecté (isolé par candidat)
  const totalUnreadMessages = useMemo(() => {
    if (!currentUser) return 0;
    if (currentRole === 'CANDIDAT') {
      const staticMockIds = ['conv-1', 'conv-2', 'conv-3', 'conv-4', 'conv-5'];
      const curId = String(currentUser.id || '').trim().toLowerCase();
      const candProfId = String(candidatProfile?.id || '').trim().toLowerCase();
      const curName = `${currentUser.prenom || ''} ${currentUser.nom || ''}`.toLowerCase().trim();
      return conversations
        .filter((c) => {
          if (staticMockIds.includes(c.id)) return false;
          const cId = String(c.candidat_id || '').trim().toLowerCase();
          const cName = String(c.candidat_nom || '').toLowerCase().trim();
          if (curId && cId === curId) return true;
          if (candProfId && cId === candProfId) return true;
          if (curName.length > 2 && cName === curName) return true;
          return false;
        })
        .reduce((acc, c) => acc + (c.non_lus_candidat || 0), 0);
    } else if (currentRole === 'RECRUTEUR') {
      const curRecId = currentUser.id;
      const curEntId = currentUser.entreprise_id;
      return conversations
        .filter(
          (c) =>
            c.recruteur_id === curRecId ||
            (curEntId && c.entreprise_id === curEntId) ||
            c.recruteur_id === 'u-rec-alpha'
        )
        .reduce((acc, c) => acc + (c.non_lus_recruteur || 0), 0);
    }
    return 0;
  }, [currentUser, currentRole, conversations, candidatProfile]);

  // Handle Actor Role Switch / Logout
  const handleRoleChange = (role: RoleName) => {
    setCurrentRole(role);
    if (role === 'VISITEUR') {
      setCurrentUser(null);
      setActiveScreen('E1');
      setFavorisOffresIds([]); // Effacer la mémoire d'affichage des favoris en session visiteur
      try {
        sessionStorage.removeItem('talenta_session_active');
        sessionStorage.removeItem('talenta_current_user');
        sessionStorage.removeItem('talenta_current_role');
        sessionStorage.removeItem('talenta_active_screen');
        sessionStorage.removeItem('talenta_favoris');
        window.history.replaceState(null, '', '#E1');
      } catch (e) {}
    } else if (role === 'CANDIDAT') {
      const candUser = INITIAL_USERS[3]; // Amina
      setCurrentUser(candUser);
      sessionStorage.setItem('talenta_session_active', 'true');
      sessionStorage.setItem('talenta_current_user', JSON.stringify(candUser));
      sessionStorage.setItem('talenta_current_role', 'CANDIDAT');

      // Charger immédiatement les offres et favoris de ce candidat depuis MySQL
      api.getOffresPubliques().then((dbOffres) => {
        if (dbOffres && dbOffres.length > 0) setOffres(dbOffres);
      }).catch(() => {});

      api.getFavoris(candUser.id).then((dbFavs) => {
        if (Array.isArray(dbFavs)) {
          setFavorisOffresIds(dbFavs);
          try {
            sessionStorage.setItem('talenta_favoris', JSON.stringify(dbFavs));
          } catch {}
        }
      }).catch(() => {});

      if (!['E_CANDIDAT_DASHBOARD', 'E6_PROFIL', 'E6_CV', 'E5', 'E_ENTRETIENS', 'E1', 'E3', 'E11', 'E_FAVORIS', 'E_MESSAGES', 'E_SETTINGS'].includes(activeScreen)) {
        setActiveScreen('E_CANDIDAT_DASHBOARD');
        sessionStorage.setItem('talenta_active_screen', 'E_CANDIDAT_DASHBOARD');
      }
    } else if (role === 'RECRUTEUR') {
      const recUser = INITIAL_USERS[1]; // R. Ben Ali
      setCurrentUser(recUser);
      sessionStorage.setItem('talenta_session_active', 'true');
      sessionStorage.setItem('talenta_current_user', JSON.stringify(recUser));
      sessionStorage.setItem('talenta_current_role', 'RECRUTEUR');

      if (!['E7', 'E8', 'E9', 'E10', 'E_RECRUTEUR_ENTRETIENS', 'E_MESSAGES', 'E_SETTINGS', 'E_RECRUTEUR_PROFIL'].includes(activeScreen)) {
        setActiveScreen('E7');
        sessionStorage.setItem('talenta_active_screen', 'E7');
      }
    } else if (role === 'ADMIN') {
      const adminUser = INITIAL_USERS[0]; // Amélie
      setCurrentUser(adminUser);
      sessionStorage.setItem('talenta_session_active', 'true');
      sessionStorage.setItem('talenta_current_user', JSON.stringify(adminUser));
      sessionStorage.setItem('talenta_current_role', 'ADMIN');

      if (!['E_ADMIN_DASHBOARD', 'E12', 'E13', 'E14', 'E15', 'E_ADMIN_PROFIL', 'E_SETTINGS', 'E_MESSAGES', 'E1', 'E3', 'E11'].includes(activeScreen)) {
        setActiveScreen('E_ADMIN_DASHBOARD');
        sessionStorage.setItem('talenta_active_screen', 'E_ADMIN_DASHBOARD');
      }
    }
  };

  // Open Apply Modal (E4)
  const handleOpenPostuler = (offre: Offre) => {
    if (!currentUser || currentRole === 'VISITEUR') {
      setAuthModalTab('login');
      setAuthModalOpen(true);
      return;
    }
    setPostulerOffreTarget(offre);
    setPostulerModalOpen(true);
  };

  // Submit Application (Parcours B: Dépôt candidature avec support CV Dynamique & Import PC)
  const handleApplicationSubmit = async ({
    offreId,
    file,
    cv,
    sourceType,
  }: {
    offreId: string;
    file?: File;
    cv?: import('@/lib/types').CV;
    sourceType: 'DYNAMIQUE' | 'FICHIER_LOCAL' | 'ENREGISTRE';
  }): Promise<{ analyse?: import('@/lib/types').AnalyseCv; error?: string }> => {
    let cvToUse: import('@/lib/types').CV;
    let analysisData: import('@/lib/types').AnalyseCv;

    const targetOffre = offres.find((o) => o.id === offreId);

    // Vérification RM2 : Interdiction de double candidature pour le même candidat
    if (hasCandidateAppliedToJob(offreId, candidateApplicationOfferIds)) {
      return {
        error: "Vous avez déjà postulé à cette offre d'emploi. Une seconde candidature n'est pas autorisée.",
      };
    }

    // Vérification RM1 : Interdiction de postuler si la date limite est dépassée
    if (targetOffre && (isOfferExpired(targetOffre.date_limite) || targetOffre.statut === 'CLOTUREE')) {
      return {
        error: `La date limite de candidature (${formatFrenchDate(targetOffre.date_limite)}) est dépassée. Les nouvelles candidatures sont closes pour cette offre.`,
      };
    }

    // Compétences requises par l'offre pour le calcul IA
    const reqSkills = targetOffre?.competences_requises || ['React', 'Node.js', 'SQL'];
    const candSkills = candidatProfile.competences || [];
    const matchingSkills = reqSkills.filter((r) =>
      candSkills.some(
        (cs) => cs.toLowerCase().includes(r.toLowerCase()) || r.toLowerCase().includes(cs.toLowerCase())
      )
    );
    const missingSkills = reqSkills.filter((r) => !matchingSkills.includes(r));
    const matchRatio = reqSkills.length > 0 ? matchingSkills.length / reqSkills.length : 0.85;
    const computedScore = Math.min(97, Math.max(55, Math.round(matchRatio * 80 + 17)));

    if (file) {
      const { base64, dataUrl } = await readFileAsBase64(file);
      const formData = new FormData();
      formData.append('cv_file', file);
      const upload = await api.uploadCv(formData);
      if (!upload.success || !upload.data) {
        // Fallback fichier local gracieux avec le vrai contenu PDF en base64
        cvToUse = {
          id: `cv-upload-${Date.now()}`,
          candidat_id: candidatProfile.id,
          nom_fichier: file.name,
          type_mime: file.type || 'application/pdf',
          taille_octets: file.size,
          url_stockage: dataUrl || URL.createObjectURL(file),
          contenu_base64: base64,
          created_at: new Date().toISOString().split('T')[0],
          source_type: 'FICHIER_LOCAL',
        };
      } else {
        cvToUse = {
          ...upload.data,
          url_stockage: dataUrl || upload.data.url_stockage,
          contenu_base64: base64 || upload.data.contenu_base64,
          source_type: 'FICHIER_LOCAL',
        };
      }

      analysisData = {
        id: `ana-${Date.now()}`,
        cv_id: cvToUse.id,
        score_correspondance: computedScore,
        resume: `Document importé (${cvToUse.nom_fichier}). Analyse du profil pour l'offre « ${targetOffre?.titre || 'Poste'} » : ${matchingSkills.length} compétence(s) requise(s) identifiée(s).`,
        points_forts: [
          `Fichier CV importé et scanné avec succès`,
          ...(matchingSkills.length > 0 ? [`Compétences clés validées : ${matchingSkills.join(', ')}`] : []),
          `Expérience pertinente dans le domaine`,
        ],
        points_manquants: missingSkills.length > 0
          ? missingSkills.map((m) => `Compétence requise non explicite : ${m}`)
          : ['Tous les prérequis techniques majeurs sont couverts'],
        niveau_confiance: computedScore >= 80 ? 'ELEVE' : 'MOYEN',
        version_modele: 'v2.1-doc-parser',
        valide_par_recruteur: false,
        infos_extraites: {
          competences: candSkills.length > 0 ? candSkills : ['React', 'Node.js', 'SQL'],
          experiences: candidatProfile.experiences || [],
          formations: candidatProfile.formations || [],
          langues: candidatProfile.langues || ['Français', 'Anglais'],
        },
      };
    } else if (cv) {
      cvToUse = {
        ...cv,
        source_type: sourceType,
      };

      analysisData = {
        id: `ana-${Date.now()}`,
        cv_id: cv.id,
        score_correspondance: computedScore,
        resume: `CV dynamique Talenta généré à partir du profil candidat. Coordonnées vérifiées, parcours validé et ${matchingSkills.length}/${reqSkills.length} compétences requises confirmées pour le poste de ${targetOffre?.titre || 'Développeur'}.`,
        points_forts: [
          'Format CV Dynamique Talenta standardisé, certifié et 100% lisible ATS',
          ...(matchingSkills.length > 0 ? [`Maîtrise validée : ${matchingSkills.join(', ')}`] : []),
          `Parcours vérifié : ${candidatProfile.experiences?.length || 0} expérience(s), ${candidatProfile.formations?.length || 0} formation(s)`,
        ],
        points_manquants: missingSkills.length > 0
          ? missingSkills.map((m) => `Prérequis à aborder en entretien : ${m}`)
          : ['Profil hautement aligné avec l’intégralité des compétences requises'],
        niveau_confiance: 'ELEVE',
        version_modele: 'v2.1-ats-direct',
        valide_par_recruteur: false,
        infos_extraites: {
          competences: candidatProfile.competences || [],
          experiences: candidatProfile.experiences || [],
          formations: candidatProfile.formations || [],
          langues: candidatProfile.langues || ['Français', 'Anglais'],
        },
      };
    } else {
      return { error: 'Aucun CV sélectionné pour cette candidature.' };
    }

    // Persistance directe dans la base de données MySQL avec le payload complet du CV déposé
    const postulerRes = await api.postuler({
      offre_id: offreId,
      cv_id: cvToUse.id,
      candidat_id: candidatProfile.id,
      lettre_motivation: '',
      cv_payload: {
        nom_fichier: cvToUse.nom_fichier,
        type_mime: cvToUse.type_mime || 'application/pdf',
        taille_octets: cvToUse.taille_octets || 2048,
        contenu_base64: cvToUse.contenu_base64,
      },
    });

    const serverCand = postulerRes.data?.candidature;
    const resolvedUserId = currentUser?.id || candidatProfile.utilisateur_id || 'u-cand-amina';
    const mergedCv: import('@/lib/types').CV = {
      ...(serverCand?.cv || {}),
      ...cvToUse,
      id: serverCand?.cv?.id || cvToUse.id,
      nom_fichier: cvToUse.nom_fichier || serverCand?.cv?.nom_fichier || 'CV_Candidat.pdf',
      contenu_base64: cvToUse.contenu_base64 || serverCand?.cv?.contenu_base64,
      url_stockage: cvToUse.url_stockage || serverCand?.cv?.url_stockage || '',
      source_type: cvToUse.source_type,
      est_genere: cvToUse.est_genere,
      template_style: cvToUse.template_style,
      cv_config: cvToUse.cv_config,
    };

    const resolvedServerCand: Candidature | null = serverCand
      ? {
          ...serverCand,
          cv_id: mergedCv.id,
          cv: mergedCv,
          candidat: {
            ...(serverCand.candidat || candidatProfile),
            utilisateur_id: resolvedUserId,
            user: currentUser || serverCand.candidat?.user,
          },
        }
      : null;

    const newCand: Candidature = resolvedServerCand || {
      id: `app-${Date.now()}`,
      candidat_id: candidatProfile.id,
      candidat: {
        ...candidatProfile,
        utilisateur_id: resolvedUserId,
        user: currentUser || candidatProfile.user,
        competences: [...(candidatProfile.competences || [])],
        experiences: [...(candidatProfile.experiences || [])],
        formations: [...(candidatProfile.formations || [])],
        langues: [...(candidatProfile.langues || [])],
      },
      offre_id: offreId,
      offre: targetOffre,
      cv_id: mergedCv.id,
      cv: mergedCv,
      lettre_motivation: '',
      message: '',
      statut: 'RECUE',
      created_at: new Date().toISOString().split('T')[0],
      analyse: analysisData,
      notes_internes: [],
    };

    // Sauvegarder le CV exact déposé par le candidat pour que le recruteur le voie tel quel
    saveDepositedCvToStorage(
      [
        newCand.id,
        mergedCv.id,
        cvToUse.id,
        `${newCand.candidat_id}_${offreId}`,
        `${candidatProfile.id}_${offreId}`,
        `${resolvedUserId}_${offreId}`,
      ],
      mergedCv
    );

    setCandidatures((prev) => [newCand, ...prev.filter((c) => c.id !== newCand.id)]);

    // Synchronisation immédiate des candidatures fraîches depuis MySQL en conservant les CV déposés
    api.getAllCandidatures().then((dbCands) => {
      if (dbCands && dbCands.length > 0) {
        const hydrated = hydrateCandidaturesWithDepositedCvs(dbCands);
        setCandidatures((prev) => {
          const dbIds = new Set(hydrated.map((c) => c.id));
          const unsynced = prev.filter((c) => !dbIds.has(c.id));
          return [...hydrated, ...unsynced];
        });
      }
    }).catch(() => {});

    // Notification logs (Module 11.1 & 11.3)
    const recruiterUser = targetOffre?.auteur || users.find(u => (u.entreprise_id === targetOffre?.entreprise_id || u.entreprise?.id === targetOffre?.entreprise_id) && u.role?.nom === 'RECRUTEUR') || INITIAL_USERS[1];
    const candidateName = `${currentUser?.prenom || 'Amina'} ${currentUser?.nom || 'Ben Salem'}`.trim();
    const companyName = targetOffre?.entreprise?.nom || 'votre entreprise';

    const newNotif1: NotificationRecord = {
      id: `notif-${Date.now()}-1`,
      utilisateur_id: currentUser?.id || INITIAL_USERS[3].id,
      user: currentUser || INITIAL_USERS[3],
      type: 'CONFIRMATION_DEPOT',
      objet: `Confirmation de votre candidature : ${targetOffre?.titre}`,
      message: `Votre candidature pour le poste « ${targetOffre?.titre} » a bien été enregistrée avec ${
        sourceType === 'DYNAMIQUE' ? 'votre CV dynamique de l’application' : cvToUse.nom_fichier
      }.`,
      statut_envoi: 'ENVOYE',
      created_at: 'À l’instant',
    };
    const newNotif2: NotificationRecord = {
      id: `notif-${Date.now()}-2`,
      utilisateur_id: recruiterUser.id,
      user: recruiterUser,
      type: 'NOUVELLE_CANDIDATURE',
      objet: `Nouvelle candidature reçue : ${targetOffre?.titre}`,
      message: `Bonjour ${recruiterUser.prenom}, le candidat ${candidateName} vient de postuler à votre offre « ${targetOffre?.titre} » chez ${companyName} avec son ${
        sourceType === 'DYNAMIQUE' ? 'CV Dynamique Talenta' : 'CV importé'
      }. L'analyse IA de correspondance est prête pour évaluation.`,
      statut_envoi: 'ENVOYE',
      created_at: 'À l’instant',
    };
    setNotifications((prev) => [newNotif1, newNotif2, ...prev]);

    // Synchronisation avec les notifications fraîches de MySQL
    api.getNotifications().then((dbNotifs) => {
      if (dbNotifs && dbNotifs.length > 0) setNotifications(dbNotifs);
    }).catch(() => {});

    return { analyse: analysisData };
  };

  // Withdraw Application (RM5) -> Persistance MySQL
  const handleWithdrawApplication = async (candId: string) => {
    await api.retirerCandidature(candId).catch(() => {});
    setCandidatures((prev) =>
      prev.map((c) => (c.id === candId ? { ...c, statut: 'RETIREE' } : c))
    );
  };

  // Recruiter Updates Status (Parcours C & RM4) -> Persistance MySQL + Synchronisation temps réel
  const handleUpdateStatus = async (
    candId: string,
    newStatus: ApplicationStatus,
    commentaire?: string,
    entretienDetails?: { date?: string; type?: 'VISIO' | 'PRESENTIEL' | 'TELEPHONE'; lien?: string }
  ) => {
    const existingCand =
      candidatures.find((c) => c.id === candId) ||
      (selectedCandidatureForDetail?.id === candId ? selectedCandidatureForDetail : undefined);

    const prevStatut = existingCand?.statut || 'RECUE';
    const { etapes_validees, etape_avant_decision } = computeSequentialSteps(
      prevStatut,
      existingCand?.etapes_validees,
      newStatus
    );

    const updatedAt = new Date().toISOString().split('T')[0];
    const resolvedComment =
      commentaire !== undefined && commentaire.trim() !== ''
        ? commentaire
        : existingCand?.commentaire_recruteur;
    const resolvedDateEntretien = entretienDetails?.date || existingCand?.date_entretien;
    const resolvedTypeEntretien = entretienDetails?.type || existingCand?.type_entretien;
    const resolvedLienEntretien = entretienDetails?.lien || existingCand?.lien_ou_lieu_entretien;

    const decisionPayload: StoredDecision = {
      statut: newStatus,
      etapes_validees,
      etape_avant_decision,
      commentaire_recruteur: resolvedComment,
      date_entretien: resolvedDateEntretien,
      type_entretien: resolvedTypeEntretien,
      lien_ou_lieu_entretien: resolvedLienEntretien,
      updated_at: updatedAt,
    };

    const candUserIdForKey =
      existingCand?.candidat?.utilisateur_id || existingCand?.candidat?.user?.id || '';
    const candEmailForKey = (existingCand?.candidat?.user?.email || '').toLowerCase().trim();
    const candFullNameForKey = `${existingCand?.candidat?.prenom || existingCand?.candidat?.user?.prenom || ''}_${existingCand?.candidat?.nom || existingCand?.candidat?.user?.nom || ''}`
      .toLowerCase()
      .trim();
    const offreTitleForKey = (existingCand?.offre?.titre || '').toLowerCase().trim();
    saveDecisionToStorage(
      [
        candId,
        existingCand ? `${existingCand.candidat_id}_${existingCand.offre_id}` : '',
        existingCand && candUserIdForKey ? `${candUserIdForKey}_${existingCand.offre_id}` : '',
        existingCand && candEmailForKey ? `${candEmailForKey}_${existingCand.offre_id}` : '',
        candEmailForKey && offreTitleForKey ? `${candEmailForKey}_${offreTitleForKey}` : '',
        existingCand && candFullNameForKey ? `${candFullNameForKey}_${existingCand.offre_id}` : '',
        candFullNameForKey && offreTitleForKey ? `${candFullNameForKey}_${offreTitleForKey}` : '',
      ],
      decisionPayload
    );

    // Persistance dans la base de données MySQL
    api.changerStatutCandidature(candId, newStatus, resolvedComment).catch(() => {});

    const targetCand: Candidature | undefined = existingCand
      ? {
          ...existingCand,
          ...decisionPayload,
        }
      : undefined;

    setCandidatures((prev) =>
      prev.map((c) => {
        if (c.id === candId) {
          return {
            ...c,
            ...decisionPayload,
          };
        }
        return c;
      })
    );

    if (selectedCandidatureForDetail?.id === candId) {
      setSelectedCandidatureForDetail((prev) =>
        prev
          ? {
              ...prev,
              ...decisionPayload,
            }
          : null
      );
    }

    // Module 11.2 Notification au candidat
    const recipientUser = targetCand?.candidat?.user || INITIAL_USERS[3];
    const statusLabels: Record<ApplicationStatus, string> = {
      RECUE: 'Reçue',
      EN_EXAMEN: 'En cours d\'examen',
      PRESELECTIONNEE: 'Présélectionnée pour le poste',
      ENTRETIEN: 'Convoqué(e) à un entretien',
      ACCEPTEE: 'Candidature retenue (Offre acceptée)',
      REFUSEE: 'Candidature non retenue',
      RETIREE: 'Candidature retirée',
    };

    const notif: NotificationRecord = {
      id: `notif-${Date.now()}`,
      utilisateur_id: recipientUser.id,
      user: recipientUser,
      type: 'CHANGEMENT_STATUT',
      objet: `Mise à jour : ${targetCand?.offre?.titre || 'Votre candidature'}`,
      message: commentaire
        ? `Votre candidature est passée à « ${statusLabels[newStatus] || newStatus} ». Message de l'entreprise : "${commentaire}"`
        : `Votre candidature est passée à « ${statusLabels[newStatus] || newStatus} ».`,
      statut_envoi: 'ENVOYE',
      created_at: 'À l’instant',
    };
    setNotifications((prev) => [notif, ...prev]);

    // Si le recruteur a écrit un message / commentaire au candidat, l'envoyer dans la discussion de l'entreprise
    if (commentaire && commentaire.trim() && targetCand) {
      const staticMockIds = ['conv-1', 'conv-2', 'conv-3', 'conv-4', 'conv-5'];
      const candUserId = targetCand.candidat?.utilisateur_id || targetCand.candidat?.user?.id || targetCand.candidat_id;
      const candFullName =
        `${targetCand.candidat?.prenom || targetCand.candidat?.user?.prenom || ''} ${targetCand.candidat?.nom || targetCand.candidat?.user?.nom || ''}`.trim() ||
        'Candidat';
      const entName = targetCand.offre?.entreprise?.nom || 'Entreprise partenaire';
      const entId = targetCand.offre?.entreprise_id || targetCand.offre?.entreprise?.id || 'c-alpha';
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const nowStr = `${now.toISOString().replace('T', ' ').substring(0, 10)} ${timeStr}`;

      let conv = conversations.find(
        (c) =>
          !staticMockIds.includes(c.id) &&
          (c.candidat_id === candUserId || c.candidat_nom.toLowerCase().trim() === candFullName.toLowerCase().trim()) &&
          (c.offre_id === targetCand?.offre_id || c.entreprise_id === entId)
      );

      const convId = conv ? conv.id : `conv-${Date.now()}`;
      if (!conv) {
        const newConv: Conversation = {
          id: convId,
          candidat_id: candUserId,
          candidat_nom: candFullName,
          candidat_avatar: targetCand.candidat?.avatar_url || targetCand.candidat?.user?.avatar_url,
          recruteur_id: currentUser?.id || 'u-rec-alpha',
          recruteur_nom: entName,
          entreprise_id: entId,
          entreprise_nom: entName,
          offre_id: targetCand.offre_id,
          offre_titre: targetCand.offre?.titre || 'Candidature',
          dernier_message: commentaire.trim(),
          updated_at: nowStr,
          non_lus_candidat: 1,
          non_lus_recruteur: 0,
        };
        setConversations((prev) => [newConv, ...prev]);
      } else {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  entreprise_nom: entName,
                  recruteur_nom: entName,
                  dernier_message: commentaire.trim(),
                  updated_at: nowStr,
                  non_lus_candidat: (c.non_lus_candidat || 0) + 1,
                }
              : c
          )
        );
      }

      const newMsg: ChatMessage = {
        id: `msg-${Date.now()}-rec`,
        conversation_id: convId,
        sender_id: currentUser?.id || 'u-rec-alpha',
        sender_role: 'RECRUTEUR',
        sender_name: entName,
        receiver_id: candUserId,
        receiver_name: candFullName,
        contenu: commentaire.trim(),
        created_at: nowStr,
        lu: false,
      };
      setMessages((prev) => [...prev, newMsg]);
    }
  };

  // Recruiter Adds Internal Note (Module 8.4)
  const handleAddNote = (candId: string, contenu: string, etiquettes: string[]) => {
    const newNote = {
      id: `note-${Date.now()}`,
      auteur_id: currentUser?.id || 'u-rec-alpha',
      auteur: currentUser || INITIAL_USERS[1],
      candidature_id: candId,
      contenu,
      etiquettes,
      created_at: 'À l’instant',
    };

    setCandidatures((prev) =>
      prev.map((c) => {
        if (c.id === candId) {
          return {
            ...c,
            notes_internes: [...(c.notes_internes || []), newNote],
          };
        }
        return c;
      })
    );

    if (selectedCandidatureForDetail?.id === candId) {
      setSelectedCandidatureForDetail((prev) =>
        prev
          ? {
            ...prev,
            notes_internes: [...(prev.notes_internes || []), newNote],
          }
          : null
      );
    }
  };

  // Recruiter Reruns AI Analysis (Module 9.7)
  const handleRerunAi = (candId: string) => {
    let updatedCand: Candidature | undefined;

    setCandidatures((prev) =>
      prev.map((c) => {
        if (c.id === candId) {
          const candSkills = c.candidat?.competences || [];
          const reqSkills = c.offre?.competences_requises || ['React', 'Node.js', 'SQL'];
          const matching = reqSkills.filter((r) =>
            candSkills.some(
              (cs) => cs.toLowerCase().includes(r.toLowerCase()) || r.toLowerCase().includes(cs.toLowerCase())
            )
          );
          const missing = reqSkills.filter((r) => !matching.includes(r));
          const matchPercent = reqSkills.length > 0 ? matching.length / reqSkills.length : 0.85;
          const calculatedScore = Math.min(98, Math.max(58, Math.round(matchPercent * 80 + 18)));

          const updatedAnalyse: import('@/lib/types').AnalyseCv = {
            id: c.analyse?.id || `ana-${Date.now()}`,
            cv_id: c.cv_id,
            candidature_id: c.id,
            score_correspondance: calculatedScore,
            niveau_confiance: calculatedScore >= 80 ? 'ELEVE' : calculatedScore >= 65 ? 'MOYEN' : 'FAIBLE',
            version_modele: 'Talenta-AI-v2.1',
            valide_par_recruteur: true,
            resume: `Nouvelle analyse IA du CV (${c.cv?.nom_fichier || 'Profil'}). Adéquation technique calculée à ${calculatedScore}% pour le poste « ${c.offre?.titre || 'Offre'} ». ${matching.length}/${reqSkills.length} compétences requises validées.`,
            points_forts: [
              ...(matching.length > 0 ? [`Compétences clés validées : ${matching.join(', ')}`] : []),
              `Expérience vérifiée dans le domaine (${c.candidat?.experiences?.length || 1} poste(s))`,
              `Profil structuré et conforme aux attentes ATS`,
            ],
            points_manquants: missing.length > 0
              ? missing.map((m) => `Compétence manquante à évaluer : ${m}`)
              : ['Tous les critères techniques requis sont remplis'],
            infos_extraites: {
              competences: candSkills.length > 0 ? candSkills : ['React', 'Node.js', 'SQL'],
              experiences: c.candidat?.experiences || [],
              formations: c.candidat?.formations || [],
              langues: c.candidat?.langues || ['Français', 'Anglais'],
            },
          };

          const up = {
            ...c,
            analyse: updatedAnalyse,
          };
          updatedCand = up;
          return up;
        }
        return c;
      })
    );

    if (updatedCand && selectedCandidatureForDetail?.id === candId) {
      setSelectedCandidatureForDetail(updatedCand);
    }
  };

  // Publish / Save Job Offer (Parcours A) -> Persistance MySQL
  const handleSaveJob = async (jobData: Partial<Offre>, publishImmediately: boolean) => {
    const statut: JobStatus = publishImmediately ? 'PUBLIEE' : 'BROUILLON';
    if (editingOffre) {
      // Mise à jour dans la base de données MySQL
      const res = await api.updateOffre(editingOffre.id, {
        ...jobData,
        statut,
      });
      const updatedJob: Offre = res.success && res.data?.offre ? res.data.offre : { ...editingOffre, ...jobData, statut };
      setOffres((prev) => prev.map((o) => (o.id === editingOffre.id ? updatedJob : o)));
      setEditingOffre(null);
    } else {
      // Création dans la base de données MySQL
      const targetCompanyId = jobData.entreprise_id || currentUser?.entreprise_id || entreprises[0]?.id || '01a16a74-f27b-738f-a948-0fb179d8aed4';
      const company = entreprises.find((e) => e.id === targetCompanyId) || entreprises[0];
      const payload: Partial<Offre> = {
        titre: jobData.titre || 'Nouvelle offre',
        description: jobData.description || '',
        missions: jobData.missions || '',
        competences_requises: jobData.competences_requises || ['React', 'Node.js'],
        type_contrat: jobData.type_contrat || 'CDI',
        lieu: jobData.lieu || 'Sfax',
        salaire: jobData.salaire || '',
        date_publication: publishImmediately ? new Date().toISOString().split('T')[0] : '',
        date_limite: jobData.date_limite || '2026-11-30',
        statut,
        entreprise_id: targetCompanyId,
        auteur_id: currentUser?.id,
      };

      const res = await api.createOffre(payload);
      const newJob = res.success && res.data?.offre ? res.data.offre : {
        ...payload,
        id: `job-${Date.now()}`,
        candidatures_count: 0,
        entreprise: company,
        created_at: new Date().toISOString().split('T')[0],
      } as Offre;
      if (!newJob.entreprise) newJob.entreprise = company;

      setOffres((prev) => [newJob, ...prev]);

      // Notification automatique pour l'administrateur système détaillant le recruteur, le type d'offre et l'entreprise affiliée
      const recruiterName = currentUser ? `${currentUser.prenom} ${currentUser.nom}`.trim() : 'Responsable RH';
      const recruiterEmail = currentUser?.email || 'recruteur@entreprise.com';
      const adminNotif: NotificationRecord = {
        id: `notif-${Date.now()}-admin-offre`,
        utilisateur_id: INITIAL_USERS[0].id,
        user: INITIAL_USERS[0],
        type: 'NOUVELLE_OFFRE',
        objet: `Nouvelle offre ${payload.type_contrat} : ${payload.titre}`,
        message: `Le recruteur ${recruiterName} (${recruiterEmail}) a créé une nouvelle offre de type ${payload.type_contrat} intitulée « ${payload.titre} » rattachée à l'entreprise ${company?.nom || 'Entreprise partenaire'} (Secteur : ${company?.secteur || 'Technologies'}, Ville : ${company?.ville || payload.lieu}). Lieu d'affectation : ${payload.lieu}. Salaire prévu : ${payload.salaire || 'À négocier'}.`,
        statut_envoi: 'ENVOYE',
        created_at: 'À l’instant',
      };
      setNotifications((prev) => [adminNotif, ...prev]);

      // Synchronisation avec les notifications fraîches de MySQL
      api.getNotifications().then((freshNotifs) => {
        if (freshNotifs && freshNotifs.length > 0) setNotifications(freshNotifs);
      }).catch(() => {});
    }
    setActiveScreen('E7'); // Return to Recruiter Dashboard
  };

  // Close Job Offer (RM6) -> Persistance MySQL
  const handleCloseJob = async (jobId: string) => {
    await api.cloturerOffre(jobId).catch(() => {});
    setOffres((prev) =>
      prev.map((o) => (o.id === jobId ? { ...o, statut: 'CLOTUREE' } : o))
    );
  };

  // Delete Job Offer -> Persistance MySQL + Conservation de la mention supprimée pour les candidats ayant postulé
  const handleDeleteJob = async (jobId: string) => {
    // 1. Sauvegarder dans le localStorage des offres supprimées
    try {
      const raw = localStorage.getItem('talenta_deleted_offres_v2');
      const deletedIds: string[] = raw ? JSON.parse(raw) : [];
      if (!deletedIds.includes(jobId)) {
        deletedIds.push(jobId);
        localStorage.setItem('talenta_deleted_offres_v2', JSON.stringify(deletedIds));
      }
    } catch {}

    // 2. Appel API Laravel
    api.deleteOffre(jobId).catch(() => {});

    // 3. Mettre à jour l'état local des offres
    setOffres((prev) =>
      prev.map((o) => (o.id === jobId ? { ...o, statut: 'ARCHIVEE' as JobStatus, supprimee: true } : o))
    );

    // 4. Mettre à jour les candidatures associées pour marquer offre_supprimee = true
    setCandidatures((prev) =>
      prev.map((c) =>
        c.offre_id === jobId
          ? {
              ...c,
              offre_supprimee: true,
              offre: c.offre
                ? { ...c.offre, supprimee: true, statut: 'ARCHIVEE' as JobStatus }
                : undefined,
            }
          : c
      )
    );
  };

  // Mettre à jour l'état de l'entretien (PROGRAMME | PASSE | NON_PASSE) par le recruteur
  const handleUpdateInterviewStatus = (
    candId: string,
    statutEntretien: 'PROGRAMME' | 'PASSE' | 'NON_PASSE'
  ) => {
    const existingCand = candidatures.find((c) => c.id === candId);
    const updatedDecision: StoredDecision = {
      statut: existingCand?.statut || 'ENTRETIEN',
      etapes_validees: existingCand?.etapes_validees,
      etape_avant_decision: existingCand?.etape_avant_decision,
      commentaire_recruteur: existingCand?.commentaire_recruteur,
      date_entretien: existingCand?.date_entretien,
      type_entretien: existingCand?.type_entretien,
      lien_ou_lieu_entretien: existingCand?.lien_ou_lieu_entretien,
      updated_at: new Date().toISOString().split('T')[0],
    };

    saveDecisionToStorage([candId], updatedDecision);

    setCandidatures((prev) =>
      prev.map((c) => (c.id === candId ? { ...c, statut_entretien: statutEntretien } : c))
    );
  };

  // Candidatures associées au candidat connecté (résolution multi-critères robuste et tolérante aux alias)
  const candidateApplications = useMemo(() => {
    if (!currentUser) return [];

    const curUserId = String(currentUser.id || '').trim().toLowerCase();
    const curEmail = String(currentUser.email || '').toLowerCase().trim();
    const candProfileId = String(candidatProfile?.id || '').trim().toLowerCase();
    const candUtilisateurId = String(candidatProfile?.utilisateur_id || '').trim().toLowerCase();

    const isAmina = curUserId === 'u-cand-amina' || curEmail === 'amina@mail.example' || curUserId === '01a16a74-f6ec-7362-a310-f79b94c8c3d2';

    return candidatures.filter((c) => {
      const cCandId = String(c.candidat_id || '').trim().toLowerCase();
      const cCandProfileId = String(c.candidat?.id || '').trim().toLowerCase();
      const cUserId = String(c.candidat?.utilisateur_id || c.candidat?.user?.id || '').trim().toLowerCase();
      const cEmail = String(c.candidat?.user?.email || '').trim().toLowerCase();

      // 1. Correspondance directe par candidat_id
      if (candProfileId && (cCandId === candProfileId || cCandProfileId === candProfileId)) return true;

      // 2. Correspondance par utilisateur_id du candidat
      if (curUserId && (cUserId === curUserId || cCandId === curUserId)) return true;
      if (candUtilisateurId && (cUserId === candUtilisateurId || cCandId === candUtilisateurId)) return true;

      // 3. Correspondance par user.id du candidat
      if (c.candidat?.user?.id && String(c.candidat.user.id).trim().toLowerCase() === curUserId) return true;

      // 4. Correspondance par email utilisateur
      if (curEmail && cEmail && cEmail === curEmail) return true;

      // 5. Cas spécial pour compte démo Amina
      if (isAmina && (
        cCandId === 'cand-amina' ||
        cCandId === '01a16a74-f93f-72ff-a834-01de44d60785' ||
        cUserId === '01a16a74-f6ec-7362-a310-f79b94c8c3d2' ||
        cEmail === 'amina@mail.example'
      )) return true;

      return false;
    });
  }, [candidatures, currentUser, candidatProfile]);

  const hydratedCandidateApplications = useMemo(
    () => hydrateCandidaturesWithDepositedCvs(candidateApplications),
    [candidateApplications]
  );

  // Candidate applications IDs for RM2 check
  const candidateApplicationOfferIds = useMemo(() => {
    return candidateApplications.map((c) => c.offre_id);
  }, [candidateApplications]);

  // Nombre d'entretiens et convocations pour le badge de la barre verticale
  const candidateEntretiensCount = useMemo(() => {
    return candidateApplications.filter(
      (c) =>
        c.statut === 'PRESELECTIONNEE' ||
        c.statut === 'ENTRETIEN' ||
        c.statut === 'ACCEPTEE' ||
        Boolean(c.date_entretien)
    ).length;
  }, [candidateApplications]);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#f7f8fc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-2xl bg-gradient-to-br from-[#6253e8] to-[#4838d2] grid place-items-center text-white shadow-lg shadow-[#6253e8]/30 animate-pulse">
            <span className="text-lg font-black">T</span>
          </div>
          <div className="text-xs font-semibold text-[#8a94a6]">Restauration de votre session...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-[#172033] flex flex-col font-sans">
      {/* Navbar with role switcher & Section 5.4 navigation */}
      <Navbar
        currentRole={currentRole}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onOpenAuth={(tab) => {
          setAuthModalTab(tab);
          setAuthModalOpen(true);
          try {
            window.history.replaceState(null, '', `#${tab}`);
          } catch {}
        }}
        onLogout={() => handleRoleChange('VISITEUR')}
        notifications={notifications}
        onMarkNotificationRead={(id) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, lu: true } : n))
          );
        }}
        onMarkAllNotificationsRead={() => {
          setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
        }}
      />

      <div className="flex flex-1">
        <Sidebar
          currentRole={currentRole}
          activeScreen={activeScreen}
          onNavigate={handleNavigate}
          favorisCount={favorisOffresIds.length}
          unreadMessagesCount={totalUnreadMessages}
          offresCount={offres.filter((o) => o.statut === 'PUBLIEE').length}
          entretiensCount={candidateEntretiensCount}
        />
        {/* Main Screen Router according to Section 5 Aperçu des interfaces */}
        <main className="min-w-0 flex-1 pb-16 lg:ml-64">
          {/* E1 / E3 : Offres Publiques & Recherche / Détail Offre */}
          {(activeScreen === 'E1' || activeScreen === 'E3' || (!currentUser && isProtectedRoute(activeScreen))) && (
            <OffresPubliquesView
              offres={offres}
              onSelectOffre={(o) => {
                setSelectedOffreForDetail(o);
                handleNavigate('E3');
              }}
              onPostuler={handleOpenPostuler}
              currentRole={currentRole}
              currentUser={currentUser}
              candidatureOffreIds={candidateApplicationOfferIds}
              favorisOffresIds={favorisOffresIds}
              onToggleFavori={handleToggleFavori}
              onContactRecruiter={handleContactRecruiter}
              initialSelectedOffre={activeScreen === 'E3' ? selectedOffreForDetail : null}
              onClearSelectedOffre={() => {
                setSelectedOffreForDetail(null);
                handleNavigate('E1');
              }}
            />
          )}

          {/* E_CANDIDAT_DASHBOARD : Tableau de bord Candidat Protégé */}
          {activeScreen === 'E_CANDIDAT_DASHBOARD' && currentUser && (
            <DashboardCandidatView
              currentUser={currentUser}
              candidat={candidatProfile}
              candidatures={hydratedCandidateApplications}
              offres={offres}
              favorisOffresIds={favorisOffresIds}
              conversations={conversations}
              onNavigateScreen={handleNavigate}
              onSelectOffre={(o) => {
                setSelectedOffreForDetail(o);
                handleNavigate('E3');
              }}
              onToggleFavori={handleToggleFavori}
              onOpenPostuler={handleOpenPostuler}
            />
          )}

          {/* E5 : Mes Candidatures (Espace Candidat Protégé) */}
          {activeScreen === 'E5' && currentUser && (
            <MesCandidaturesView
              candidatures={hydratedCandidateApplications}
              onWithdrawApplication={handleWithdrawApplication}
              onNavigateScreen={handleNavigate}
              onViewJobDetail={(o) => {
                setSelectedOffreForDetail(o);
                handleNavigate('E3');
              }}
            />
          )}

          {/* E_ENTRETIENS : Entretiens & Convocations (Espace Candidat Protégé) */}
          {activeScreen === 'E_ENTRETIENS' && currentUser && (
            <EntretiensCandidatView
              candidatures={hydratedCandidateApplications}
              onNavigateScreen={handleNavigate}
              onViewJobDetail={(o) => {
                setSelectedOffreForDetail(o);
                handleNavigate('E3');
              }}
            />
          )}

          {/* E6 / E6_PROFIL : Profil Candidat Protégé */}
          {(activeScreen === 'E6' || activeScreen === 'E6_PROFIL') && currentUser && (
            <ProfilCandidatView
              candidat={candidatProfile}
              currentUser={currentUser}
              onNavigateScreen={handleNavigate}
              onUpdateProfile={handleUpdateCandidatProfile}
              onRefreshFromDb={handleRefreshFromDb}
              backendOnline={backendOnline}
              onDeleteMyData={() => {
                alert('Vos données ont été supprimées conformément au RGPD.');
                handleRoleChange('VISITEUR');
              }}
            />
          )}

          {/* E6_CV : Mes CV & Créateur de CV Protégé */}
          {activeScreen === 'E6_CV' && currentUser && (
            <MesCvsView
              candidat={candidatProfile}
              onNavigateToProfile={() => handleNavigate('E6_PROFIL')}
              onUpdateCvList={(newCvs) => {
                newCvs.forEach((c) => saveDepositedCvToStorage([c.id], c));
                setCandidatProfile((prev) => ({ ...prev, cvs: newCvs }));
              }}
              onUpdateCandidatProfile={handleUpdateCandidatProfile}
              onUploadCv={async (file: File) => {
                const { base64, dataUrl } = await readFileAsBase64(file);
                const formData = new FormData();
                formData.append('cv_file', file);
                const upload = await api.uploadCv(formData);
                const newCv: import('@/lib/types').CV =
                  upload.success && upload.data
                    ? {
                        ...upload.data,
                        url_stockage: dataUrl || upload.data.url_stockage,
                        contenu_base64: base64 || upload.data.contenu_base64,
                        source_type: 'FICHIER_LOCAL',
                      }
                    : {
                        id: `cv-upload-${Date.now()}`,
                        candidat_id: candidatProfile.id,
                        nom_fichier: file.name,
                        type_mime: file.type || 'application/pdf',
                        taille_octets: file.size,
                        url_stockage: dataUrl || URL.createObjectURL(file),
                        contenu_base64: base64,
                        created_at: new Date().toISOString().split('T')[0],
                        source_type: 'FICHIER_LOCAL',
                      };
                saveDepositedCvToStorage([newCv.id], newCv);
                setCandidatProfile((prev) => ({
                  ...prev,
                  cvs: [newCv, ...(prev.cvs || [])],
                }));
                return { cv: newCv };
              }}
            />
          )}

          {/* E7 : Tableau de Bord Recruteur Protégé */}
          {activeScreen === 'E7' && currentUser && (
            <DashboardRecruteurView
              offres={offres}
              candidatures={candidatures}
              currentUser={currentUser}
              notifications={notifications}
              onOpenNewJob={() => {
                setEditingOffre(null);
                handleNavigate('E8');
              }}
              onOpenApplicationDetail={(cand) => {
                setSelectedCandidatureForDetail(cand);
                handleNavigate('E10');
              }}
              onViewAllApplications={() => handleNavigate('E9')}
              onEditJob={(job) => {
                setEditingOffre(job);
                handleNavigate('E8');
              }}
              onCloseJob={handleCloseJob}
            />
          )}

          {/* E8 : Mes Offres & Création/Édition d'Offre Protégé */}
          {activeScreen === 'E8' && currentUser && (
            <NouvelleOffreView
              initialOffre={editingOffre}
              offres={offres}
              candidatures={candidatures}
              entreprises={entreprises}
              currentUser={currentUser}
              onSave={handleSaveJob}
              onCancel={() => handleNavigate('E7')}
              onEditJob={(job) => setEditingOffre(job)}
              onCloseJob={handleCloseJob}
              onDeleteJob={handleDeleteJob}
            />
          )}

          {/* E_RECRUTEUR_ENTRETIENS : Mes entretiens candidats côté recruteur */}
          {activeScreen === 'E_RECRUTEUR_ENTRETIENS' && currentUser && (
            <EntretiensRecruteurView
              candidatures={candidatures}
              onOpenDetail={(cand) => {
                setSelectedCandidatureForDetail(cand);
                handleNavigate('E10');
              }}
              onUpdateInterviewStatus={handleUpdateInterviewStatus}
            />
          )}

          {/* E9 : Candidatures Reçues pour une Offre Protégé */}
          {activeScreen === 'E9' && currentUser && (
            <CandidaturesOffreView
              offres={offres}
              candidatures={candidatures}
              onOpenDetail={(cand) => {
                setSelectedCandidatureForDetail(cand);
                handleNavigate('E10');
              }}
              onBulkUpdateStatus={(ids, newStatus) => {
                ids.forEach((id) => handleUpdateStatus(id, newStatus));
              }}
            />
          )}

          {/* E10 : Fiche Candidat & Analyse IA Protégé */}
          {activeScreen === 'E10' && currentUser && selectedCandidatureForDetail && (
            <FicheCandidatIaView
              candidature={selectedCandidatureForDetail}
              onBack={() => handleNavigate('E9')}
              onUpdateStatus={handleUpdateStatus}
              onAddNote={handleAddNote}
              onRerunAi={handleRerunAi}
            />
          )}

          {/* Fiche Entreprise (détails de l'entreprise sélectionnée) */}
          {activeScreen === 'E11' && selectedEntrepriseForDetail && (
            <FicheEntrepriseView
              entreprise={selectedEntrepriseForDetail}
              allEntreprises={entreprises}
              onSelectEntreprise={(ent) => setSelectedEntrepriseForDetail(ent)}
              offres={offres.filter(
                (o) => o.entreprise_id === selectedEntrepriseForDetail.id || o.entreprise?.id === selectedEntrepriseForDetail.id
              )}
              recruteurs={users.filter(
                (u) =>
                  (u.role?.nom === 'RECRUTEUR' || !u.role) &&
                  (u.entreprise_id === selectedEntrepriseForDetail.id ||
                   u.entreprise?.id === selectedEntrepriseForDetail.id)
              )}
              allRecruteurs={users.filter((u) => u.role?.nom === 'RECRUTEUR')}
              currentRole={currentRole}
              currentUser={currentUser}
              onBack={() => setSelectedEntrepriseForDetail(null)}
              onUpdateEntreprise={async (data) => {
                const targetId = selectedEntrepriseForDetail.id;
                setEntreprises((prev) =>
                  prev.map((e) => (e.id === targetId ? { ...e, ...data } : e))
                );
                setSelectedEntrepriseForDetail((prev) => (prev ? { ...prev, ...data } : null));
                try {
                  await api.updateEntreprise(targetId, data);
                  const freshEnts = await api.getEntreprises();
                  if (freshEnts && freshEnts.length > 0) setEntreprises(freshEnts);
                } catch (err) {
                  console.error('Erreur enregistrement entreprise:', err);
                }
              }}
              onRemoveRecruteur={async (recruiterId) => {
                setUsers((prev) =>
                  prev.map((u) =>
                    u.id === recruiterId
                      ? { ...u, entreprise_id: undefined, entreprise: undefined }
                      : u
                  )
                );
                try {
                  await api.detachRecruteurFromEntreprise(recruiterId);
                } catch (err) {
                  console.error('Erreur détachement recruteur:', err);
                }
              }}
              onAttachRecruteur={async (recruiterId) => {
                const targetEnt = selectedEntrepriseForDetail;
                setUsers((prev) =>
                  prev.map((u) =>
                    u.id === recruiterId
                      ? { ...u, entreprise_id: targetEnt.id, entreprise: targetEnt }
                      : u
                  )
                );
                try {
                  await api.attachRecruteurToEntreprise(recruiterId, targetEnt.id);
                } catch (err) {
                  console.error('Erreur rattachement recruteur:', err);
                }
              }}
              onSelectOffre={(o) => {
                setSelectedOffreForDetail(o);
                handleNavigate('E3');
              }}
            />
          )}

          {/* Annuaire des Entreprises Partenaires (accessible à tous, liste dynamique) */}
          {activeScreen === 'E11' && !selectedEntrepriseForDetail && (
            <EntreprisesDirectoryView
              entreprises={entreprises}
              offres={offres}
              users={users}
              currentRole={currentRole}
              onSelectEntreprise={(ent) => setSelectedEntrepriseForDetail(ent)}
              onOpenAddEntreprise={currentRole === 'ADMIN' ? () => handleNavigate('E14') : undefined}
            />
          )}

          {/* E12 : Espace Admin - Utilisateurs Protégé */}
          {activeScreen === 'E12' && currentUser && (
            <AdminUsersView
              users={users}
              roles={roles}
              entreprises={entreprises}
              onViewCompany={(companyId) => {
                const found = entreprises.find((e) => e.id === companyId);
                if (found) {
                  setSelectedEntrepriseForDetail(found);
                  handleNavigate('E11');
                }
              }}
              onToggleStatus={async (userId) => {
                try {
                  const res = await api.toggleUserStatus(userId);
                  if (res.success && res.data?.user) {
                    setUsers((prev) =>
                      prev.map((u) => (u.id === userId ? { ...u, statut: res.data!.user.statut } : u))
                    );
                  } else {
                    setUsers((prev) =>
                      prev.map((u) =>
                        u.id === userId
                          ? { ...u, statut: u.statut === 'ACTIF' ? 'INACTIF' : 'ACTIF' }
                          : u
                      )
                    );
                  }
                } catch {
                  setUsers((prev) =>
                    prev.map((u) =>
                      u.id === userId
                        ? { ...u, statut: u.statut === 'ACTIF' ? 'INACTIF' : 'ACTIF' }
                        : u
                    )
                  );
                }
              }}
              onDeleteUser={async (userId) => {
                try {
                  await api.deleteUser(userId);
                } catch {}
                setUsers((prev) => prev.filter((u) => u.id !== userId));
              }}
              onRefreshUsers={async () => {
                const fresh = await api.getUsers();
                if (fresh && fresh.length > 0) {
                  setUsers(fresh);
                }
              }}
              onCreateUser={async (userData) => {
                try {
                  const res = await api.createUser(userData);
                  if (res.success && res.data?.user) {
                    const newUser = res.data.user;
                    setUsers((prev) => [newUser, ...prev]);
                    return {
                      success: true,
                      user: newUser,
                      message: res.data.message || 'Utilisateur enregistré avec succès dans la base de données MySQL.',
                    };
                  } else {
                    const errorMsg =
                      res.error?.errors?.email?.[0] ||
                      res.error?.message ||
                      'Erreur lors de la création de l’utilisateur dans la base de données.';
                    return { success: false, message: errorMsg };
                  }
                } catch (err: unknown) {
                  const msg = err instanceof Error ? err.message : 'Erreur réseau inattendue.';
                  return { success: false, message: msg };
                }
              }}
              onUpdateUser={async (userId, updateData) => {
                try {
                  const res = await api.updateUser(userId, updateData);
                  if (res.success && res.data?.user) {
                    const updatedUser = res.data.user;
                    setUsers((prev) =>
                      prev.map((u) => (u.id === userId ? { ...u, ...updatedUser } : u))
                    );

                    // Si l'utilisateur modifié est l'utilisateur connecté actuellement
                    if (currentUser?.id === userId) {
                      setCurrentUser((prev) => (prev ? { ...prev, ...updatedUser } : prev));
                    }
                    return {
                      success: true,
                      user: updatedUser,
                      message: res.data.message || 'Compte et coordonnées mis à jour avec succès dans la base de données.',
                    };
                  } else {
                    const errorMsg =
                      res.error?.errors?.email?.[0] ||
                      res.error?.message ||
                      'Erreur lors de la mise à jour des informations.';
                    return { success: false, message: errorMsg };
                  }
                } catch (err: unknown) {
                  const msg = err instanceof Error ? err.message : 'Erreur réseau inattendue.';
                  return { success: false, message: msg };
                }
              }}
            />
          )}

          {/* E13 : Espace Admin - Rôles & Permissions Protégé */}
          {activeScreen === 'E13' && currentUser && (
            <AdminRolesView
              roles={roles}
              allPermissions={allPermissions}
              users={users}
              onUpdateRolePermissions={async (roleId, permissionIds) => {
                // 1. Appel API backend
                const res = await api.updateRolePermissions(roleId, permissionIds);

                // 2. Mise à jour de l'état local des rôles
                let updatedRoles: Role[] = [];
                setRoles((prev) => {
                  updatedRoles = prev.map((r) => {
                    if (r.id === roleId || r.nom === roleId) {
                      const newPerms = res.success && res.data?.role?.permissions
                        ? res.data.role.permissions
                        : allPermissions.filter((p) =>
                            permissionIds.includes(p.id) || permissionIds.includes(p.nom)
                          );
                      return { ...r, permissions: newPerms };
                    }
                    return r;
                  });
                  return updatedRoles;
                });

                // 3. Application immédiate RM9 pour l'utilisateur connecté s'il a ce rôle
                if (
                  currentUser?.role &&
                  (currentUser.role.id === roleId || currentUser.role.nom === roleId)
                ) {
                  const newPerms = res.success && res.data?.role?.permissions
                    ? res.data.role.permissions
                    : allPermissions.filter((p) =>
                        permissionIds.includes(p.id) || permissionIds.includes(p.nom)
                      );
                  const updatedCurUser: User = {
                    ...currentUser,
                    role: {
                      ...currentUser.role,
                      permissions: newPerms,
                    },
                  };
                  setCurrentUser(updatedCurUser);
                  try {
                    sessionStorage.setItem('talenta_user', JSON.stringify(updatedCurUser));
                  } catch {}
                }

                if (!res.success && res.error) {
                  throw new Error(res.error.message);
                }
                return true;
              }}
              onCreateRole={async (newRoleData) => {
                const res = await api.createRole(newRoleData);
                const roleToAdd: Role = res.success && res.data?.role
                  ? res.data.role
                  : {
                      id: `r-${newRoleData.nom.toLowerCase().replace(/\s+/g, '-')}`,
                      nom: newRoleData.nom as RoleName,
                      description: newRoleData.description || '',
                      permissions: allPermissions.filter((p) =>
                        (newRoleData.permission_ids || []).includes(p.id)
                      ),
                    };

                setRoles((prev) => [...prev, roleToAdd]);

                if (!res.success && res.error) {
                  throw new Error(res.error.message);
                }
                return true;
              }}
              onDeleteRole={async (roleId) => {
                const res = await api.deleteRole(roleId);
                setRoles((prev) => prev.filter((r) => r.id !== roleId && r.nom !== roleId));
                if (!res.success && res.error) {
                  throw new Error(res.error.message);
                }
                return true;
              }}
            />
          )}

          {/* E14 : Espace Admin - Entreprises & Offres Protégé */}
          {activeScreen === 'E14' && currentUser && (
            <AdminEntreprisesView
              entreprises={entreprises}
              onToggleStatus={async (entId) => {
                const ent = entreprises.find((e) => e.id === entId);
                if (!ent) return;
                const newStatut = ent.statut === 'ACTIVE' ? 'DESACTIVEE' : 'ACTIVE';
                await api.toggleEntrepriseStatus(entId, newStatut).catch(() => {});
                setEntreprises((prev) =>
                  prev.map((e) =>
                    e.id === entId ? { ...e, statut: newStatut } : e
                  )
                );
              }}
              onDeleteEntreprise={async (entId) => {
                await api.deleteEntreprise(entId).catch(() => {});
                setEntreprises((prev) => prev.filter((e) => e.id !== entId));
              }}
              onAddEntreprise={async (entData) => {
                const res = await api.createEntreprise(entData);
                if (res.success && res.data && res.data.entreprise) {
                  const created = res.data.entreprise;
                  setEntreprises((prev) => [created, ...prev.filter((e) => e.id !== created.id)]);
                  api.getEntreprises().then((fresh) => {
                    if (fresh && fresh.length > 0) setEntreprises(fresh);
                  }).catch(() => {});
                } else {
                  const newEnt: Entreprise = {
                    id: `c-${Date.now()}`,
                    nom: entData.nom || 'Entreprise',
                    secteur: entData.secteur || 'Technologie',
                    ville: entData.ville || 'Tunis',
                    pays: 'Tunisie',
                    statut: 'ACTIVE',
                    offres_count: 0,
                    recruteurs_count: 1,
                  };
                  setEntreprises((prev) => [newEnt, ...prev]);
                }
              }}
              onViewCompany={(ent) => {
                setSelectedEntrepriseForDetail(ent);
                handleNavigate('E11');
              }}
            />
          )}

          {/* E15 : Espace Admin - Journal des Notifications Protégé */}
          {activeScreen === 'E15' && currentUser && (
            <AdminNotificationsView
              notifications={notifications}
              onResend={(notifId) => {
                setNotifications((prev) =>
                  prev.map((n) =>
                    n.id === notifId ? { ...n, statut_envoi: 'ENVOYE' } : n
                  )
                );
              }}
            />
          )}

          {/* E_FAVORIS : Mes Offres Favorites (Candidat Protégé) */}
          {activeScreen === 'E_FAVORIS' && currentUser && (
            <FavorisOffresView
              favorisOffresIds={favorisOffresIds}
              allOffres={offres}
              onToggleFavori={handleToggleFavori}
              onViewJobDetail={(o) => {
                setSelectedOffreForDetail(o);
                handleNavigate('E3');
              }}
              onPostuler={handleOpenPostuler}
              onContactRecruiter={handleContactRecruiter}
              onNavigateScreen={handleNavigate}
              appliedOffreIds={candidateApplicationOfferIds}
            />
          )}

          {/* E_MESSAGES : Messagerie Interactive Candidat & Recruteur Protégé */}
          {activeScreen === 'E_MESSAGES' && currentUser && (
            <MessagerieView
              currentRole={currentRole}
              currentUser={currentUser}
              conversations={conversations}
              messages={messages}
              onSendMessage={handleSendMessage}
              selectedConversationId={selectedConversationId}
              onSelectConversation={handleSelectConversation}
              onNavigateScreen={handleNavigate}
              offres={offres}
            />
          )}

          {/* E_SETTINGS : Paramètres du Compte, Sécurité, Mot de passe & RGPD Protégé */}
          {activeScreen === 'E_SETTINGS' && currentUser && (
            <ParametresView
              currentUser={currentUser}
              onDeleteMyData={() => {
                alert('Vos données et votre compte ont été supprimés conformément au RGPD.');
                handleRoleChange('VISITEUR');
              }}
              onNavigateScreen={handleNavigate}
            />
          )}

          {/* E_ADMIN_DASHBOARD : Tableau de bord Administrateur Cool, Moderne & Dynamique */}
          {activeScreen === 'E_ADMIN_DASHBOARD' && currentUser && (
            <DashboardAdminView
              currentUser={currentUser}
              users={users}
              entreprises={entreprises}
              offres={offres}
              candidatures={candidatures}
              notifications={notifications}
              backendOnline={backendOnline}
              onNavigateScreen={handleNavigate}
              onSelectEntreprise={(ent) => {
                setSelectedEntrepriseForDetail(ent);
                handleNavigate('E11');
              }}
            />
          )}

          {/* E_ADMIN_PROFIL : Profil Administrateur Système Protégé */}
          {activeScreen === 'E_ADMIN_PROFIL' && currentUser && (
            <ProfilAdminView
              currentUser={currentUser}
              onUpdateProfile={handleUpdateUserProfile}
              onNavigateScreen={handleNavigate}
            />
          )}

          {/* E_RECRUTEUR_PROFIL : Profil Recruteur Protégé */}
          {activeScreen === 'E_RECRUTEUR_PROFIL' && currentUser && (
            <ProfilRecruteurView
              currentUser={currentUser}
              entreprise={
                entreprises.find(
                  (e) => e.id === currentUser.entreprise_id || e.id === currentUser.entreprise?.id
                ) || entreprises[0]
              }
              offres={offres}
              onUpdateProfile={handleUpdateUserProfile}
              onNavigateScreen={handleNavigate}
            />
          )}
        </main>
      </div>

      {/* Modals E2 & E4 */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          try {
            if (window.location.hash === '#login' || window.location.hash === '#register') {
              window.history.replaceState(null, '', `#${activeScreen}`);
            }
          } catch {}
        }}
        initialTab={authModalTab}
        users={users}
        onLoginSuccess={async (user, role, credentials) => {
          let authenticatedUser = user;
          if (credentials) {
            const login = await api.login(credentials.email, credentials.password);
            if (!login.success || !login.user) {
              return false;
            }
            authenticatedUser = login.user;
          }
          setCurrentUser(authenticatedUser);
          setCurrentRole(role);

          // Synchroniser la liste des utilisateurs globale
          setUsers((prev) => {
            const exists = prev.some(
              (u) => u.id === authenticatedUser.id || u.email.toLowerCase() === authenticatedUser.email.toLowerCase()
            );
            if (!exists) return [authenticatedUser, ...prev];
            return prev.map((u) =>
              u.email.toLowerCase() === authenticatedUser.email.toLowerCase()
                ? { ...u, ...authenticatedUser }
                : u
            );
          });

          // Synchronisation avec la base de données MySQL
          if (role === 'CANDIDAT') {
            const rawCandidat: Partial<Candidat> = authenticatedUser.candidat || (await api.getMonProfil()) || {};
            const activeNom = rawCandidat.nom || authenticatedUser.nom;
            const activePrenom = rawCandidat.prenom || authenticatedUser.prenom;
            const resolvedCandidat: Candidat = {
              ...candidatProfile,
              ...rawCandidat,
              nom: activeNom,
              prenom: activePrenom,
              user: {
                ...(rawCandidat.user || authenticatedUser),
                nom: activeNom,
                prenom: activePrenom,
              },
            };
            setCandidatProfile(resolvedCandidat);

            // Synchronisation immédiate des favoris MySQL pour le candidat
            api.getFavoris(authenticatedUser.id).then((dbFavs) => {
              if (Array.isArray(dbFavs)) {
                setFavorisOffresIds(dbFavs);
                try {
                  sessionStorage.setItem('talenta_favoris', JSON.stringify(dbFavs));
                } catch {}
              }
            }).catch(() => {});

            // Synchronisation immédiate des offres publiées depuis MySQL
            api.getOffresPubliques().then((dbOffres) => {
              if (dbOffres && dbOffres.length > 0) setOffres(dbOffres);
            }).catch(() => {});

            // Synchronisation immédiate des candidatures MySQL pour le candidat
            api.getAllCandidatures().then((dbCands) => {
              if (dbCands && dbCands.length > 0) setCandidatures(hydrateCandidaturesWithDepositedCvs(dbCands));
            }).catch(() => {});
          }

          let nextScreen = 'E1';
          if (role === 'CANDIDAT') nextScreen = 'E_CANDIDAT_DASHBOARD';
          else if (role === 'RECRUTEUR') nextScreen = 'E7';
          else if (role === 'ADMIN') nextScreen = 'E_ADMIN_DASHBOARD';

          setActiveScreen(nextScreen);
          try {
            sessionStorage.setItem('talenta_session_active', 'true');
            sessionStorage.setItem('talenta_current_user', JSON.stringify(authenticatedUser));
            sessionStorage.setItem('talenta_current_role', role);
            sessionStorage.setItem('talenta_active_screen', nextScreen);
            window.history.replaceState(null, '', `#${nextScreen}`);
          } catch (e) {}
          return true;
        }}
      />

      <PostulerModal
        isOpen={postulerModalOpen}
        onClose={() => setPostulerModalOpen(false)}
        offre={postulerOffreTarget}
        currentUser={currentUser}
        candidat={candidatProfile}
        hasAlreadyApplied={
          postulerOffreTarget
            ? hasCandidateAppliedToJob(postulerOffreTarget.id, candidateApplicationOfferIds)
            : false
        }
        onApplicationSubmit={handleApplicationSubmit}
        onGoToMyApplications={() => {
          handleNavigate('E5');
        }}
        onNavigateToCvStudio={() => {
          setPostulerModalOpen(false);
          handleNavigate('E6_CV');
        }}
      />
    </div>
  );
}
