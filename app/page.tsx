'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { OffresPubliquesView } from '@/components/screens/OffresPubliquesView';
import { AuthModal } from '@/components/screens/AuthModal';
import { PostulerModal } from '@/components/screens/PostulerModal';
import { MesCandidaturesView } from '@/components/screens/MesCandidaturesView';
import { ProfilCandidatView } from '@/components/screens/ProfilCandidatView';
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
  const [currentRole, setCurrentRole] = useState<RoleName>('RECRUTEUR');
  const [currentUser, setCurrentUser] = useState<User | null>(INITIAL_USERS[1]); // Recruteur Alpha par défaut
  const [activeScreen, setActiveScreen] = useState<string>('E7'); // E7 Dashboard Recruteur par défaut
  const [backendOnline, setBackendOnline] = useState<boolean | null>(false);

  // Entities Data Store
  const [offres, setOffres] = useState<Offre[]>(INITIAL_OFFRES);
  const [candidatures, setCandidatures] = useState<Candidature[]>(INITIAL_CANDIDATURES);
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
  const handleApplicationSubmit = ({
    offreId,
    cvId,
    lettre,
    message,
  }: {
    offreId: string;
    cvId: string;
    lettre: string;
    message: string;
  }) => {
    const targetOffre = offres.find((o) => o.id === offreId);
    const newCand: Candidature = {
      id: `app-${Date.now()}`,
      candidat_id: INITIAL_CANDIDATS[0].id,
      candidat: INITIAL_CANDIDATS[0],
      offre_id: offreId,
      offre: targetOffre,
      cv_id: cvId,
      cv: INITIAL_CVS[0],
      lettre_motivation: lettre,
      message,
      statut: 'RECUE',
      created_at: new Date().toISOString().split('T')[0],
      analyse: {
        id: `ai-${Date.now()}`,
        cv_id: cvId,
        infos_extraites: {
          competences: ['React', 'Node.js', 'SQL', 'Git', 'TypeScript'],
          experiences: INITIAL_CANDIDATS[0].experiences,
          formations: INITIAL_CANDIDATS[0].formations,
          langues: INITIAL_CANDIDATS[0].langues,
        },
        resume: `Développeuse web en adéquation avec les attentes du poste « ${targetOffre?.titre} ». Solide base technique.`,
        score_correspondance: 84,
        points_forts: ['Stack technique React/Node.js en phase', 'Expérience démontrée'],
        points_manquants: ['Tests automatisés à approfondir'],
        niveau_confiance: 'MOYEN',
        version_modele: 'Talenta-AI-v2.1',
        valide_par_recruteur: false,
      },
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
        onRoleChange={handleRoleChange}
        activeScreen={activeScreen}
        onNavigate={setActiveScreen}
        currentUser={currentUser}
        onOpenAuth={(tab) => {
          setAuthModalTab(tab);
          setAuthModalOpen(true);
        }}
        onLogout={() => handleRoleChange('VISITEUR')}
        backendOnline={backendOnline}
      />

      {/* Main Screen Router according to Section 5 Aperçu des interfaces */}
      <main className="flex-1 pb-16">
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

        {/* E6 : Profil Candidat */}
        {activeScreen === 'E6' && (
          <ProfilCandidatView
            candidat={INITIAL_CANDIDATS[0]}
            onUpdateProfile={(updated) => alert('Profil mis à jour avec succès !')}
            onDeleteMyData={() => {
              alert('Vos données ont été supprimées conformément au RGPD.');
              handleRoleChange('VISITEUR');
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

      {/* Footer */}
      <footer className="border-t border-[#e8ebf3] bg-white py-6 text-center text-xs text-[#8a93a8]">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <strong>Talenta Recruitment OS</strong> · Application intelligente de recrutement conforme aux 11 modules & 12 entités du cahier des charges.
          </div>
          <div className="flex items-center gap-4 text-[11px] font-semibold text-[#5a4be0]">
            <span>Laravel REST API</span>
            <span>·</span>
            <span>Next.js Frontend</span>
            <span>·</span>
            <span>Assistance IA Éthique</span>
          </div>
        </div>
      </footer>

      {/* Modals E2 & E4 */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authModalTab}
        users={users}
        onLoginSuccess={(user, role) => {
          setCurrentUser(user);
          setCurrentRole(role);
          if (role === 'RECRUTEUR') setActiveScreen('E7');
          else if (role === 'ADMIN') setActiveScreen('E12');
          else setActiveScreen('E1');
        }}
      />

      <PostulerModal
        isOpen={postulerModalOpen}
        onClose={() => setPostulerModalOpen(false)}
        offre={postulerOffreTarget}
        currentUser={currentUser}
        savedCvs={INITIAL_CVS}
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
