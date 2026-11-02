'use client';

import React, { useState, useEffect } from 'react';
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
import { AdminUsersView } from '@/components/screens/AdminUsersView';
import { AdminRolesView } from '@/components/screens/AdminRolesView';
import { AdminEntreprisesView } from '@/components/screens/AdminEntreprisesView';
import { AdminNotificationsView } from '@/components/screens/AdminNotificationsView';
import {
  ApplicationStatus,
  Candidat,
  Candidature,
  Entreprise,
  NotificationRecord,
  Offre,
  RoleName,
  User,
} from '@/lib/types';
import {
  INITIAL_CANDIDATS,
  INITIAL_CANDIDATURES,
  INITIAL_COMPANIES,
  INITIAL_CVS,
  INITIAL_NOTIFICATIONS,
  INITIAL_OFFRES,
  INITIAL_PERMISSIONS,
  INITIAL_ROLES,
  INITIAL_USERS,
} from '@/lib/initialData';
import { api } from '@/lib/api';

export default function AppRoot() {
  // Application State
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
  const [roles, setRoles] = useState(INITIAL_ROLES);
  const [allPermissions] = useState(INITIAL_PERMISSIONS);
  const [notifications, setNotifications] = useState<NotificationRecord[]>(INITIAL_NOTIFICATIONS);

  // Active items for detail views
  const [selectedOffreForDetail, setSelectedOffreForDetail] = useState<Offre | null>(null);
  const [selectedCandidatureForDetail, setSelectedCandidatureForDetail] = useState<Candidature | null>(
    INITIAL_CANDIDATURES[0]
  );
  const [editingOffre, setEditingOffre] = useState<Offre | null>(null);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [postulerModalOpen, setPostulerModalOpen] = useState(false);
  const [postulerOffreTarget, setPostulerOffreTarget] = useState<Offre | null>(null);

  // Check Laravel Backend Health on mount
  useEffect(() => {
    api.checkBackendHealth().then((isOnline) => {
      setBackendOnline(isOnline);
    });
  }, []);

  // Handle Actor Role Switch
  const handleRoleChange = (role: RoleName) => {
    setCurrentRole(role);
    if (role === 'VISITEUR') {
      setCurrentUser(null);
      setActiveScreen('E1');
    } else if (role === 'CANDIDAT') {
      setCurrentUser(INITIAL_USERS[3]); // Amina
      setActiveScreen('E1');
    } else if (role === 'RECRUTEUR') {
      setCurrentUser(INITIAL_USERS[1]); // R. Ben Ali
      setActiveScreen('E7');
    } else if (role === 'ADMIN') {
      setCurrentUser(INITIAL_USERS[0]); // Amélie
      setActiveScreen('E12');
    }
  };

  // Open Apply Modal (E4)
  const handleOpenPostuler = (offre: Offre) => {
    if (currentRole === 'VISITEUR') {
      setAuthModalTab('login');
      setAuthModalOpen(true);
      return;
    }
    setPostulerOffreTarget(offre);
    setPostulerModalOpen(true);
  };

  // Submit Application (Parcours B: Dépôt candidature)
  const handleApplicationSubmit = async ({
    offreId,
    file,
  }: {
    offreId: string;
    file: File;
  }): Promise<{ analyse?: import('@/lib/types').AnalyseCv; error?: string }> => {
    const formData = new FormData();
    formData.append('cv_file', file);
    const upload = await api.uploadCv(formData);
    if (!upload.success || !upload.data) {
      return { error: upload.error?.message || 'Le CV n’a pas pu être téléversé.' };
    }
    const analysisResponse = await api.analyserCv(upload.data.id);
    if (!analysisResponse.success || !analysisResponse.data) {
      return { error: analysisResponse.error?.message || 'Le CV n’a pas pu être analysé.' };
    }

    const targetOffre = offres.find((o) => o.id === offreId);
    const newCand: Candidature = {
      id: `app-${Date.now()}`,
      candidat_id: INITIAL_CANDIDATS[0].id,
      candidat: INITIAL_CANDIDATS[0],
      offre_id: offreId,
      offre: targetOffre,
      cv_id: upload.data.id,
      cv: upload.data,
      lettre_motivation: '',
      message: '',
      statut: 'RECUE',
      created_at: new Date().toISOString().split('T')[0],
      analyse: analysisResponse.data,
      notes_internes: [],
    };

    setCandidatures([newCand, ...candidatures]);

    // Notification logs (Module 11.1 & 11.3)
    const newNotif1: NotificationRecord = {
      id: `notif-${Date.now()}-1`,
      utilisateur_id: INITIAL_USERS[3].id,
      user: INITIAL_USERS[3],
      type: 'CONFIRMATION_DEPOT',
      objet: `Confirmation de votre candidature : ${targetOffre?.titre}`,
      message: `Votre candidature pour le poste « ${targetOffre?.titre} » a bien été enregistrée.`,
      statut_envoi: 'ENVOYE',
      created_at: 'À l’instant',
    };
    const newNotif2: NotificationRecord = {
      id: `notif-${Date.now()}-2`,
      utilisateur_id: INITIAL_USERS[1].id,
      user: INITIAL_USERS[1],
      type: 'NOUVELLE_CANDIDATURE',
      objet: `Nouvelle candidature pour : ${targetOffre?.titre}`,
      message: `Amina Ben Salem a postulé. L'analyse IA est disponible.`,
      statut_envoi: 'ENVOYE',
      created_at: 'À l’instant',
    };
    setNotifications([newNotif1, newNotif2, ...notifications]);
    return { analyse: analysisResponse.data };
  };

  // Withdraw Application (RM5)
  const handleWithdrawApplication = (candId: string) => {
    setCandidatures((prev) =>
      prev.map((c) => (c.id === candId ? { ...c, statut: 'RETIREE' } : c))
    );
  };

  // Recruiter Updates Status (Parcours C & RM4)
  const handleUpdateStatus = (
    candId: string,
    newStatus: ApplicationStatus,
    commentaire?: string
  ) => {
    setCandidatures((prev) =>
      prev.map((c) => {
        if (c.id === candId) {
          return {
            ...c,
            statut: newStatus,
            commentaire_recruteur: commentaire || c.commentaire_recruteur,
          };
        }
        return c;
      })
    );

    if (selectedCandidatureForDetail?.id === candId) {
      setSelectedCandidatureForDetail((prev) =>
        prev ? { ...prev, statut: newStatus } : null
      );
    }

    // Module 11.2 Notification
    const notif: NotificationRecord = {
      id: `notif-${Date.now()}`,
      utilisateur_id: INITIAL_USERS[3].id,
      user: INITIAL_USERS[3],
      type: 'CHANGEMENT_STATUT',
      objet: 'Mise à jour du statut de votre candidature',
      message: `Votre candidature est passée au statut : ${newStatus}`,
      statut_envoi: 'ENVOYE',
      created_at: 'À l’instant',
    };
    setNotifications([notif, ...notifications]);
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
    setCandidatures((prev) =>
      prev.map((c) => {
        if (c.id === candId && c.analyse) {
          return {
            ...c,
            analyse: {
              ...c.analyse,
              score_correspondance: Math.min(95, c.analyse.score_correspondance + 2),
              niveau_confiance: 'ELEVE',
              valide_par_recruteur: true,
            },
          };
        }
        return c;
      })
    );
  };

  // Publish / Save Job Offer (Parcours A)
  const handleSaveJob = (jobData: Partial<Offre>, publishImmediately: boolean) => {
    if (editingOffre) {
      // Update
      setOffres((prev) =>
        prev.map((o) => (o.id === editingOffre.id ? { ...o, ...jobData } : o))
      );
      setEditingOffre(null);
    } else {
      // Create new
      const newJob: Offre = {
        id: `job-${Date.now()}`,
        titre: jobData.titre || 'Nouvelle offre',
        description: jobData.description || '',
        missions: jobData.missions || '',
        competences_requises: jobData.competences_requises || ['React', 'Node.js'],
        type_contrat: jobData.type_contrat || 'CDI',
        lieu: jobData.lieu || 'Sfax',
        salaire: jobData.salaire || '',
        date_publication: publishImmediately ? new Date().toISOString().split('T')[0] : '',
        date_limite: jobData.date_limite || '2026-11-30',
        statut: publishImmediately ? 'PUBLIEE' : 'BROUILLON',
        entreprise_id: 'c-alpha',
        entreprise: INITIAL_COMPANIES[0],
        auteur_id: currentUser?.id || 'u-rec-alpha',
        auteur: currentUser || INITIAL_USERS[1],
        candidatures_count: 0,
        created_at: new Date().toISOString().split('T')[0],
      };
      setOffres([newJob, ...offres]);
    }
    setActiveScreen('E7'); // Return to Recruiter Dashboard
  };

  // Close Job Offer (RM6)
  const handleCloseJob = (jobId: string) => {
    setOffres((prev) =>
      prev.map((o) => (o.id === jobId ? { ...o, statut: 'CLOTUREE' } : o))
    );
  };

  // Candidate applications IDs for RM2 check
  const candidateApplicationOfferIds = candidatures
    .filter((c) => c.candidat_id === INITIAL_CANDIDATS[0].id)
    .map((c) => c.offre_id);

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-[#172033] flex flex-col font-sans">
      {/* Navbar with role switcher & Section 5.4 navigation */}
      <Navbar
        currentRole={currentRole}
        onNavigate={setActiveScreen}
        currentUser={currentUser}
        onOpenAuth={(tab) => {
          setAuthModalTab(tab);
          setAuthModalOpen(true);
        }}
        onLogout={() => handleRoleChange('VISITEUR')}
      />

      <div className="flex flex-1">
        <Sidebar currentRole={currentRole} activeScreen={activeScreen} onNavigate={setActiveScreen} />
        {/* Main Screen Router according to Section 5 Aperçu des interfaces */}
        <main className="min-w-0 flex-1 pb-16 lg:ml-64">
          {/* E1 / E3 : Offres Publiques & Recherche / Détail Offre */}
          {(activeScreen === 'E1' || activeScreen === 'E3') && (
            <OffresPubliquesView
              offres={offres}
              onSelectOffre={(o) => {
                setSelectedOffreForDetail(o);
                setActiveScreen('E3');
              }}
              onPostuler={handleOpenPostuler}
              currentRole={currentRole}
              currentUser={currentUser}
              candidatureOffreIds={candidateApplicationOfferIds}
            />
          )}

          {/* E5 : Mes Candidatures (Espace Candidat) */}
          {activeScreen === 'E5' && (
            <MesCandidaturesView
              candidatures={candidatures.filter(
                (c) => c.candidat_id === INITIAL_CANDIDATS[0].id
              )}
              onWithdrawApplication={handleWithdrawApplication}
              onViewJobDetail={(o) => {
                setSelectedOffreForDetail(o);
                setActiveScreen('E3');
              }}
            />
          )}

          {/* E6 / E6_PROFIL : Profil Candidat */}
          {(activeScreen === 'E6' || activeScreen === 'E6_PROFIL') && (
            <ProfilCandidatView
              candidat={candidatProfile}
              onNavigateScreen={setActiveScreen}
              onUpdateProfile={(updated) => {
                setCandidatProfile((prev) => ({ ...prev, ...updated }));
                if (updated.user && currentUser) {
                  setCurrentUser((prevUser) =>
                    prevUser
                      ? {
                          ...prevUser,
                          nom: updated.user?.nom !== undefined ? updated.user.nom : prevUser.nom,
                          prenom: updated.user?.prenom !== undefined ? updated.user.prenom : prevUser.prenom,
                        }
                      : prevUser
                  );
                }
              }}
              onDeleteMyData={() => {
                alert('Vos données ont été supprimées conformément au RGPD.');
                handleRoleChange('VISITEUR');
              }}
            />
          )}

          {/* E6_CV : Mes CV & Créateur de CV */}
          {activeScreen === 'E6_CV' && (
            <MesCvsView
              candidat={candidatProfile}
              onNavigateToProfile={() => setActiveScreen('E6_PROFIL')}
              onUpdateCvList={(newCvs) => setCandidatProfile((prev) => ({ ...prev, cvs: newCvs }))}
              onUploadCv={async (file: File) => {
                const formData = new FormData();
                formData.append('cv_file', file);
                const upload = await api.uploadCv(formData);
                if (!upload.success || !upload.data) {
                  return { error: upload.error?.message || 'Échec du téléversement du CV.' };
                }
                const newCv = upload.data!;
                setCandidatProfile((prev) => ({
                  ...prev,
                  cvs: [newCv, ...(prev.cvs || [])],
                }));
                return { cv: newCv };
              }}
            />
          )}

          {/* E7 : Tableau de Bord Recruteur */}
          {activeScreen === 'E7' && (
            <DashboardRecruteurView
              offres={offres}
              candidatures={candidatures}
              onOpenNewJob={() => {
                setEditingOffre(null);
                setActiveScreen('E8');
              }}
              onOpenApplicationDetail={(cand) => {
                setSelectedCandidatureForDetail(cand);
                setActiveScreen('E10');
              }}
              onViewAllApplications={() => setActiveScreen('E9')}
              onEditJob={(job) => {
                setEditingOffre(job);
                setActiveScreen('E8');
              }}
              onCloseJob={handleCloseJob}
            />
          )}

          {/* E8 : Création et Édition d'Offre */}
          {activeScreen === 'E8' && (
            <NouvelleOffreView
              initialOffre={editingOffre}
              onSave={handleSaveJob}
              onCancel={() => setActiveScreen('E7')}
            />
          )}

          {/* E9 : Candidatures Reçues pour une Offre */}
          {activeScreen === 'E9' && (
            <CandidaturesOffreView
              offres={offres}
              candidatures={candidatures}
              onOpenDetail={(cand) => {
                setSelectedCandidatureForDetail(cand);
                setActiveScreen('E10');
              }}
              onBulkUpdateStatus={(ids, newStatus) => {
                ids.forEach((id) => handleUpdateStatus(id, newStatus));
              }}
            />
          )}

          {/* E10 : Fiche Candidat & Analyse IA */}
          {activeScreen === 'E10' && selectedCandidatureForDetail && (
            <FicheCandidatIaView
              candidature={selectedCandidatureForDetail}
              onBack={() => setActiveScreen('E9')}
              onUpdateStatus={handleUpdateStatus}
              onAddNote={handleAddNote}
              onRerunAi={handleRerunAi}
            />
          )}

          {/* E11 : Fiche Entreprise */}
          {activeScreen === 'E11' && (
            <FicheEntrepriseView
              entreprise={entreprises[0]}
              offres={offres}
              recruteurs={[INITIAL_USERS[1]]}
              onUpdateEntreprise={(data) => {
                setEntreprises((prev) =>
                  prev.map((e) => (e.id === entreprises[0].id ? { ...e, ...data } : e))
                );
              }}
              onSelectOffre={(o) => {
                setSelectedOffreForDetail(o);
                setActiveScreen('E3');
              }}
            />
          )}

          {/* E12 : Espace Admin - Utilisateurs */}
          {activeScreen === 'E12' && (
            <AdminUsersView
              users={users}
              roles={roles}
              onToggleStatus={(userId) => {
                setUsers((prev) =>
                  prev.map((u) =>
                    u.id === userId
                      ? { ...u, statut: u.statut === 'ACTIF' ? 'INACTIF' : 'ACTIF' }
                      : u
                  )
                );
              }}
              onDeleteUser={(userId) => {
                setUsers((prev) => prev.filter((u) => u.id !== userId));
              }}
              onCreateUser={(userData) => {
                const u: User = {
                  id: `u-${Date.now()}`,
                  nom: userData.nom || '',
                  prenom: userData.prenom || '',
                  email: userData.email || '',
                  statut: 'ACTIF',
                  role: userData.role,
                };
                setUsers([...users, u]);
              }}
            />
          )}

          {/* E13 : Espace Admin - Rôles & Permissions */}
          {activeScreen === 'E13' && (
            <AdminRolesView
              roles={roles}
              allPermissions={allPermissions}
              onUpdateRolePermissions={(roleId, permissionIds) => {
                setRoles((prev) =>
                  prev.map((r) => {
                    if (r.id === roleId) {
                      const newPerms = allPermissions.filter((p) =>
                        permissionIds.includes(p.id)
                      );
                      return { ...r, permissions: newPerms };
                    }
                    return r;
                  })
                );
              }}
            />
          )}

          {/* E14 : Espace Admin - Entreprises & Offres */}
          {activeScreen === 'E14' && (
            <AdminEntreprisesView
              entreprises={entreprises}
              onToggleStatus={(entId) => {
                setEntreprises((prev) =>
                  prev.map((e) =>
                    e.id === entId
                      ? { ...e, statut: e.statut === 'ACTIVE' ? 'DESACTIVEE' : 'ACTIVE' }
                      : e
                  )
                );
              }}
              onDeleteEntreprise={(entId) => {
                setEntreprises((prev) => prev.filter((e) => e.id !== entId));
              }}
              onAddEntreprise={(entData) => {
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
                setEntreprises([...entreprises, newEnt]);
              }}
              onViewCompany={(ent) => setActiveScreen('E11')}
            />
          )}

          {/* E15 : Espace Admin - Journal des Notifications */}
          {activeScreen === 'E15' && (
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
        </main>
      </div>

      {/* Modals E2 & E4 */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authModalTab}
        users={users}
        onLoginSuccess={async (user, role, credentials) => {
          if (credentials) {
            const login = await api.login(credentials.email, credentials.password);
            if (!login.success) {
              return false;
            }
          }
          setCurrentUser(user);
          setCurrentRole(role);
          if (role === 'RECRUTEUR') setActiveScreen('E7');
          else if (role === 'ADMIN') setActiveScreen('E12');
          else setActiveScreen('E1');
          return true;
        }}
      />

      <PostulerModal
        isOpen={postulerModalOpen}
        onClose={() => setPostulerModalOpen(false)}
        offre={postulerOffreTarget}
        currentUser={currentUser}
        hasAlreadyApplied={
          postulerOffreTarget
            ? candidateApplicationOfferIds.includes(postulerOffreTarget.id)
            : false
        }
        onApplicationSubmit={handleApplicationSubmit}
        onGoToMyApplications={() => {
          setCurrentRole('CANDIDAT');
          setActiveScreen('E5');
        }}
      />
    </div>
  );
}
