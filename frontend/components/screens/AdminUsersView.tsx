'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Database,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  Key,
  Lock,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  UserX,
  Users,
  X,
} from 'lucide-react';
import { Entreprise, Role, User as UserType, UserStatus } from '@/lib/types';

interface AdminUsersViewProps {
  users: UserType[];
  roles: Role[];
  entreprises?: Entreprise[];
  onToggleStatus: (id: string) => void;
  onDeleteUser: (id: string) => void;
  onRefreshUsers?: () => Promise<void> | void;
  onCreateUser: (userData: {
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
  }) => Promise<{ success: boolean; message?: string; user?: UserType }> | void;
  onUpdateUser?: (
    id: string,
    userData: {
      nom?: string;
      prenom?: string;
      email?: string;
      password?: string;
      statut?: 'ACTIF' | 'INACTIF';
      titre?: string;
      telephone?: string;
      ville?: string;
      role?: 'CANDIDAT' | 'RECRUTEUR' | 'ADMIN';
    }
  ) => Promise<{ success: boolean; message?: string; user?: UserType }> | void;
  onViewCompany?: (companyId: string) => void;
}

export function AdminUsersView({
  users,
  roles,
  entreprises = [],
  onToggleStatus,
  onDeleteUser,
  onRefreshUsers,
  onCreateUser,
  onUpdateUser,
  onViewCompany,
}: AdminUsersViewProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('TOUS');
  const [statutFilter, setStatutFilter] = useState<string>('TOUS');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<UserType | null>(null);
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // État du mode édition / récupération de compte pour un utilisateur sélectionné
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editNom, setEditNom] = useState('');
  const [editPrenom, setEditPrenom] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editTitre, setEditTitre] = useState('');
  const [editTelephone, setEditTelephone] = useState('');
  const [editVille, setEditVille] = useState('');
  const [editStatut, setEditStatut] = useState<UserStatus>('ACTIF');
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState('');
  const [editErrorMsg, setEditErrorMsg] = useState('');
  const [copiedCredentials, setCopiedCredentials] = useState(false);

  // Initialisation du formulaire d'édition
  const handleOpenDetailModal = (u: UserType, startInEdit = false) => {
    setSelectedUserForDetail(u);
    setIsEditingUser(startInEdit);
    setResetPasswordSuccess(false);
    setEditSuccessMsg('');
    setEditErrorMsg('');
    setCopiedCredentials(false);
    setEditNom(u.nom || '');
    setEditPrenom(u.prenom || '');
    setEditEmail(u.email || '');
    setEditPassword('');
    setShowEditPassword(false);
    setEditTitre(u.candidat?.titre || '');
    setEditTelephone(u.candidat?.telephone || '');
    setEditVille(u.candidat?.ville || 'Tunis');
    setEditStatut(u.statut);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!#$';
    let pwd = 'Talenta!';
    for (let i = 0; i < 4; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setEditPassword(pwd);
    setShowEditPassword(true);
  };

  const handleCopyCredentials = () => {
    const credText = `Bonjour ${selectedUserForDetail?.prenom},\nVos identifiants d'accès Talenta ont été mis à jour par l'administrateur :\n- E-mail de connexion : ${editEmail || selectedUserForDetail?.email}\n${editPassword ? `- Mot de passe provisoire : ${editPassword}\n` : ''}Vous pouvez vous connecter dès maintenant sur la plateforme.`;
    navigator.clipboard.writeText(credText);
    setCopiedCredentials(true);
    setTimeout(() => setCopiedCredentials(false), 3000);
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForDetail) return;
    setEditErrorMsg('');
    setEditSuccessMsg('');

    if (!editNom.trim() || !editPrenom.trim()) {
      setEditErrorMsg('Veuillez renseigner le nom et le prénom.');
      return;
    }

    if (!editEmail.trim() || !editEmail.includes('@')) {
      setEditErrorMsg('Veuillez renseigner une adresse e-mail valide.');
      return;
    }

    if (editPassword && editPassword.length < 8) {
      setEditErrorMsg('Le mot de passe doit comporter au moins 8 caractères.');
      return;
    }

    setEditLoading(true);

    try {
      if (onUpdateUser) {
        const res = await onUpdateUser(selectedUserForDetail.id, {
          nom: editNom.trim(),
          prenom: editPrenom.trim(),
          email: editEmail.trim(),
          password: editPassword.trim() || undefined,
          statut: editStatut,
          titre: editTitre.trim() || undefined,
          telephone: editTelephone.trim() || undefined,
          ville: editVille.trim() || undefined,
        });

        if (res && !res.success) {
          setEditErrorMsg(res.message || 'Erreur lors de la mise à jour.');
          setEditLoading(false);
          return;
        }

        if (res?.user) {
          setSelectedUserForDetail(res.user);
        } else {
          setSelectedUserForDetail((prev) =>
            prev
              ? {
                  ...prev,
                  nom: editNom.trim(),
                  prenom: editPrenom.trim(),
                  email: editEmail.trim(),
                  statut: editStatut,
                  candidat: prev.candidat
                    ? {
                        ...prev.candidat,
                        nom: editNom.trim(),
                        prenom: editPrenom.trim(),
                        titre: editTitre.trim() || prev.candidat.titre,
                        telephone: editTelephone.trim() || prev.candidat.telephone,
                        ville: editVille.trim() || prev.candidat.ville,
                      }
                    : undefined,
                }
              : null
          );
        }
      }

      setEditSuccessMsg(
        editPassword
          ? `Compte mis à jour avec succès ! Nouvel e-mail : "${editEmail}" et nouveau mot de passe défini.`
          : `L'adresse e-mail et les informations de ${editPrenom} ${editNom} ont été mises à jour avec succès.`
      );
      setIsEditingUser(false);
    } catch (err: unknown) {
      setEditErrorMsg(err instanceof Error ? err.message : 'Erreur réseau inattendue.');
    } finally {
      setEditLoading(false);
    }
  };

  // Synchronisation automatique des utilisateurs depuis la BDD MySQL au montage
  useEffect(() => {
    if (onRefreshUsers) {
      onRefreshUsers();
    }
  }, []);

  const handleRefresh = async () => {
    if (!onRefreshUsers || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefreshUsers();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // New user form state - Tous les champs sont vides par défaut
  const [newNom, setNewNom] = useState('');
  const [newPrenom, setNewPrenom] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'CANDIDAT' | 'RECRUTEUR' | 'ADMIN'>('RECRUTEUR');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newEntrepriseId, setNewEntrepriseId] = useState('');
  const [newEntrepriseNom, setNewEntrepriseNom] = useState('');
  const [newTitre, setNewTitre] = useState('');
  const [newTelephone, setNewTelephone] = useState('');
  const [newVille, setNewVille] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccessMsg, setCreateSuccessMsg] = useState('');

  // Fonction pour vider complètement tous les champs du formulaire
  const handleClearFields = () => {
    setNewNom('');
    setNewPrenom('');
    setNewEmail('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setNewEntrepriseId('');
    setNewEntrepriseNom('');
    setNewTitre('');
    setNewTelephone('');
    setNewVille('');
    setCreateError('');
    setCreateSuccessMsg('');
  };

  // Réinitialiser et vider les champs à chaque ouverture de la modal
  useEffect(() => {
    if (showCreateModal) {
      handleClearFields();
      setCreatedCredentialsInfo(null);
      setCopiedNewCredentials(false);
    }
  }, [showCreateModal]);

  // Stockage des identifiants créés pour transmission immédiate au recruteur / utilisateur
  const [createdCredentialsInfo, setCreatedCredentialsInfo] = useState<{
    nom: string;
    prenom: string;
    email: string;
    password: string;
    role: string;
    entrepriseNom?: string;
  } | null>(null);
  const [copiedNewCredentials, setCopiedNewCredentials] = useState(false);

  // Génération rapide d'un mot de passe sécurisé pour l'utilisateur créé
  const generateRandomNewPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!#$';
    let pwd = 'Talenta!';
    for (let i = 0; i < 4; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
    setConfirmPassword(pwd);
    setShowPassword(true);
    setShowConfirmPassword(true);
  };

  // Copier le message d'accès à envoyer au recruteur
  const handleCopyNewCredentials = () => {
    if (!createdCredentialsInfo) return;
    const credText = `Bonjour ${createdCredentialsInfo.prenom} ${createdCredentialsInfo.nom},\n\nVotre compte ${createdCredentialsInfo.role === 'RECRUTEUR' ? 'Recruteur' : createdCredentialsInfo.role} sur la plateforme Talenta a été créé par l'administrateur.\n\nVoici vos informations de connexion pour accéder à votre espace :\n- Adresse e-mail : ${createdCredentialsInfo.email}\n- Mot de passe provisoire : ${createdCredentialsInfo.password}\n${createdCredentialsInfo.entrepriseNom ? `- Entreprise rattachée : ${createdCredentialsInfo.entrepriseNom}\n` : ''}- Lien de connexion : ${typeof window !== 'undefined' ? window.location.origin : ''}#login\n\nNous vous recommandons de personnaliser votre mot de passe après votre première connexion.\nÀ bientôt sur Talenta !`;
    navigator.clipboard.writeText(credText);
    setCopiedNewCredentials(true);
    setTimeout(() => setCopiedNewCredentials(false), 3000);
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'TOUS' && u.role?.nom !== roleFilter) return false;
    if (statutFilter !== 'TOUS' && u.statut !== statutFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchName = `${u.prenom} ${u.nom}`.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      if (!matchName && !matchEmail) return false;
    }
    return true;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccessMsg('');

    if (!newNom.trim() || !newPrenom.trim() || !newEmail.trim() || !newPassword) {
      setCreateError('Veuillez renseigner tous les champs obligatoires (*).');
      return;
    }

    if (newPassword.length < 8) {
      setCreateError('Le mot de passe doit comporter au moins 8 caractères.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setCreateError('La confirmation ne correspond pas au mot de passe saisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onCreateUser({
        nom: newNom.trim(),
        prenom: newPrenom.trim(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        role: newRole,
        entreprise_id: newRole === 'RECRUTEUR' ? newEntrepriseId || undefined : undefined,
        entreprise_nom: newRole === 'RECRUTEUR' ? newEntrepriseNom || undefined : undefined,
        titre: newRole === 'CANDIDAT' ? newTitre || 'Candidat' : undefined,
        telephone: newTelephone.trim() || undefined,
        ville: newVille.trim() || undefined,
      });

      if (result && !result.success) {
        setCreateError(result.message || 'Échec lors de la création du compte.');
        setIsSubmitting(false);
        return;
      }

      const entObj = entreprises.find((e) => e.id === newEntrepriseId);
      const resolvedEntrepriseNom = entObj?.nom || newEntrepriseNom || undefined;

      // Conserver les identifiants pour que l'admin puisse les copier et les fournir au recruteur
      setCreatedCredentialsInfo({
        nom: newNom.trim(),
        prenom: newPrenom.trim(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        role: newRole,
        entrepriseNom: resolvedEntrepriseNom,
      });

      setCreateSuccessMsg(`Le compte ${newPrenom} ${newNom} (${newRole}) a été créé et sauvegardé dans MySQL avec succès !`);
    } catch (err: any) {
      setCreateError(err.message || 'Erreur inattendue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      {/* Top Header (E12) */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#eef1f7] pb-5 sm:flex-row sm:items-center">
        <div>
          <span className="text-xs font-bold text-[#8c94a9] uppercase tracking-wider">
            Administration système
          </span>
          <h1 className="mt-1 text-2xl font-black text-[#171f33]">
            Gestion des utilisateurs
          </h1>
          <p className="mt-1 text-xs text-[#7e879c]">
            {users.length} comptes enregistrés (candidats, recruteurs, administrateurs).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onRefreshUsers && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 rounded-2xl border border-[#dde1ec] bg-white px-4 py-2.5 text-xs font-bold text-[#444f69] hover:bg-[#f6f8fc] hover:text-[#171f33] transition shadow-xs disabled:opacity-50"
              title="Recharger la liste des utilisateurs"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-[#594be0]' : ''} />
              <span>{isRefreshing ? 'Actualisation...' : 'Actualiser'}</span>
            </button>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-2xl bg-[#594be0] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#483ad3] transition w-fit"
          >
            <Plus size={16} /> Créer un compte (1.1)
          </button>
        </div>
      </div>

      {/* Filter Row (E12) */}
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl bg-[#fafbfc] border border-[#e8ebf3] p-3 text-xs">
        <div className="flex flex-1 items-center gap-2 min-w-[200px] rounded-xl border border-[#dfe3ee] bg-white px-3 py-1.5">
          <Search size={14} className="text-[#9ea6bb]" />
          <input
            type="text"
            value={search ?? ''}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou e-mail..."
            className="w-full bg-transparent outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-[#626a80]">Rôle :</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-[#dfe3ee] bg-white px-2.5 py-1.5 font-semibold text-[#1e2538] outline-none"
          >
            <option value="TOUS">Tous les rôles</option>
            <option value="ADMIN">Administrateur</option>
            <option value="RECRUTEUR">Recruteur</option>
            <option value="CANDIDAT">Candidat</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-[#626a80]">Statut :</span>
          <select
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
            className="rounded-xl border border-[#dfe3ee] bg-white px-2.5 py-1.5 font-semibold text-[#1e2538] outline-none"
          >
            <option value="TOUS">Tous statuts</option>
            <option value="ACTIF">Actif</option>
            <option value="INACTIF">Inactif / Suspendu</option>
          </select>
        </div>
      </div>

      {/* Users Table (E12) */}
      <div className="mt-6 overflow-hidden rounded-3xl border border-[#e8ebf3] bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-[#eef1f7] bg-[#fafbfc] text-[11px] font-bold text-[#8d96ab] uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Nom & Prénom</th>
              <th className="px-6 py-4">E-mail</th>
              <th className="px-6 py-4">Rôle</th>
              <th className="px-6 py-4">Entreprise</th>
              <th className="px-6 py-4">Statut</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2f4f9]">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-[#fafbfc] transition">
                <td className="px-6 py-4">
                  <div className="font-extrabold text-[#171f33]">
                    {u.prenom} {u.nom}
                  </div>
                </td>
                <td className="px-6 py-4 text-[#5c657a]">{u.email}</td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-md px-2.5 py-0.5 text-[11px] font-bold ${
                      u.role?.nom === 'ADMIN'
                        ? 'bg-[#ffe8e8] text-[#c93232]'
                        : u.role?.nom === 'RECRUTEUR'
                        ? 'bg-[#f0efff] text-[#594be0]'
                        : 'bg-[#e8f1ff] text-[#2f6cb5]'
                    }`}
                  >
                    {u.role?.nom}
                  </span>
                </td>
                <td className="px-6 py-4 text-[#5c657a]">
                  {u.entreprise?.nom || '—'}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      u.statut === 'ACTIF'
                        ? 'bg-[#edf9f3] text-[#248e56]'
                        : 'bg-[#ffe8e8] text-[#cf3b3b]'
                    }`}
                  >
                    {u.statut === 'ACTIF' ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenDetailModal(u, false)}
                      title="Voir le profil complet"
                      className="flex items-center gap-1 rounded-lg border border-[#dde1ec] bg-[#f8f9fd] px-2.5 py-1 text-xs font-bold text-[#594be0] hover:bg-[#eeeaff] transition"
                    >
                      <Eye size={13} />
                      <span>Voir profil</span>
                    </button>

                    <button
                      onClick={() => handleOpenDetailModal(u, true)}
                      title="Modifier les coordonnées ou récupérer le compte"
                      className="flex items-center gap-1 rounded-lg border border-[#dde1ec] bg-white px-2.5 py-1 text-xs font-bold text-[#454e64] hover:bg-[#f3f4fa] transition"
                    >
                      <Edit3 size={12} />
                      <span>Modifier</span>
                    </button>

                    <button
                      onClick={() => onToggleStatus(u.id)}
                      title={u.statut === 'ACTIF' ? 'Suspendre le compte' : 'Activer le compte'}
                      className={`rounded-lg p-1.5 text-xs font-bold transition ${
                        u.statut === 'ACTIF'
                          ? 'text-[#cf3b3b] hover:bg-[#ffebeb]'
                          : 'text-[#248e56] hover:bg-[#edf9f3]'
                      }`}
                    >
                      {u.statut === 'ACTIF' ? <UserX size={15} /> : <UserCheck size={15} />}
                    </button>

                    <button
                      onClick={() => onDeleteUser(u.id)}
                      title="Supprimer définitivement"
                      className="rounded-lg p-1.5 text-[#9da6bb] hover:bg-[#fff0f0] hover:text-[#cf3b3b]"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-[11px] font-semibold text-[#8c94a8]">
        ℹ️ Toute suspension ou suppression est journalisée. Un compte inactif ne peut pas se connecter.
      </div>

      {/* Modal Créer Utilisateur Professionnel avec Persistance Base de Données */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#edf0f7] pb-4">
              <div>
                <span className="text-[11px] font-extrabold text-[#594be0] uppercase tracking-wider">
                  Administration des comptes
                </span>
                <h3 className="text-xl font-black text-[#171f33] mt-0.5">
                  Créer un compte utilisateur
                </h3>
                <p className="text-xs text-[#7e879c] mt-0.5">
                  L'utilisateur sera automatiquement créé et pourra se connecter immédiatement.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearFields}
                  className="flex items-center gap-1.5 rounded-xl border border-[#dfe3ee] bg-[#f8f9fc] px-3 py-1.5 text-xs font-bold text-[#5c6579] hover:bg-[#edf0f7] hover:text-[#182033] transition cursor-pointer"
                  title="Vider tous les champs du formulaire"
                >
                  <RotateCcw size={12} />
                  <span>Vider les champs</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl p-1.5 text-[#8c96ac] hover:bg-[#f1f3f8] hover:text-[#171f33] cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Notifications Erreur / Succès */}
            {createError && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[#fff2f2] p-3 text-xs font-bold text-[#c93232] border border-[#ffd5d5]">
                <AlertCircle size={16} />
                <span>{createError}</span>
              </div>
            )}

            {createSuccessMsg && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[#edf9f3] p-3 text-xs font-bold text-[#248e56] border border-[#c4ebd3]">
                <CheckCircle2 size={16} />
                <span>{createSuccessMsg}</span>
              </div>
            )}

            {/* Vue après création réussie : Récapitulatif et Copie des accès à fournir */}
            {createdCredentialsInfo ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-[#c4ebd3] bg-[#edf9f3] p-4 text-center">
                  <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#248e56] text-white shadow-md shadow-[#248e56]/25">
                    <CheckCircle2 size={24} />
                  </div>
                  <h4 className="mt-2 text-base font-black text-[#171f33]">
                    Compte {createdCredentialsInfo.role === 'RECRUTEUR' ? 'Recruteur' : createdCredentialsInfo.role} créé avec succès !
                  </h4>
                  <p className="mt-1 text-xs text-[#525d74]">
                    Le compte est actif. Vous pouvez maintenant copier et transmettre ces identifiants au recruteur pour qu'il puisse se connecter :
                  </p>
                </div>

                {/* Bloc d'identifiants à fournir */}
                <div className="rounded-2xl border border-[#e4e8f2] bg-[#f8f9fd] p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[#eceff6]">
                    <span className="font-bold text-[#657089]">Utilisateur :</span>
                    <span className="font-black text-[#171f33]">{createdCredentialsInfo.prenom} {createdCredentialsInfo.nom}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-[#eceff6]">
                    <span className="font-bold text-[#657089]">Rôle attribué :</span>
                    <span className="font-extrabold text-[#594be0] bg-[#f0efff] px-2.5 py-0.5 rounded-full text-[11px]">
                      {createdCredentialsInfo.role}
                    </span>
                  </div>
                  {createdCredentialsInfo.entrepriseNom && (
                    <div className="flex items-center justify-between pb-2 border-b border-[#eceff6]">
                      <span className="font-bold text-[#657089]">Entreprise rattachée :</span>
                      <span className="font-bold text-[#171f33]">{createdCredentialsInfo.entrepriseNom}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pb-2 border-b border-[#eceff6]">
                    <span className="font-bold text-[#657089]">E-mail de connexion :</span>
                    <span className="font-black text-[#171f33] font-mono bg-white px-2 py-1 rounded-lg border border-[#e2e5ef]">
                      {createdCredentialsInfo.email}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#657089]">Mot de passe provisoire :</span>
                    <span className="font-black text-[#594be0] font-mono bg-white px-2.5 py-1 rounded-lg border border-[#e2e5ef]">
                      {createdCredentialsInfo.password}
                    </span>
                  </div>
                </div>

                {/* Bouton de copie du message pour le recruteur */}
                <button
                  type="button"
                  onClick={handleCopyNewCredentials}
                  className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md ${
                    copiedNewCredentials
                      ? 'bg-[#248e56] text-white shadow-[#248e56]/20'
                      : 'bg-[#594be0] text-white shadow-[#594be0]/25 hover:bg-[#483ad3]'
                  }`}
                >
                  {copiedNewCredentials ? (
                    <>
                      <Check size={16} />
                      Informations de connexion copiées dans le presse-papier !
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Copier les informations à fournir au recruteur
                    </>
                  )}
                </button>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#edf0f7]">
                  <button
                    type="button"
                    onClick={() => {
                      setCreatedCredentialsInfo(null);
                      setShowCreateModal(false);
                      setNewNom('');
                      setNewPrenom('');
                      setNewEmail('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setNewEntrepriseId('');
                      setNewEntrepriseNom('');
                    }}
                    className="rounded-xl bg-[#f0f2f8] px-4 py-2.5 text-xs font-bold text-[#444c60] hover:bg-[#e4e7f0] transition cursor-pointer"
                  >
                    Fermer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreatedCredentialsInfo(null);
                      setNewNom('');
                      setNewPrenom('');
                      setNewEmail('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setNewEntrepriseId('');
                      setNewEntrepriseNom('');
                    }}
                    className="rounded-xl border border-[#d8dce8] bg-white px-4 py-2.5 text-xs font-bold text-[#594be0] hover:bg-[#f6f5fe] transition cursor-pointer"
                  >
                    Créer un autre compte
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreate} autoComplete="off" className="mt-5 space-y-4 text-xs">
                {/* Empêcher le navigateur d'injecter automatiquement les identifiants enregistrés */}
                <input type="text" name="fake_username_anti_autofill" className="hidden" tabIndex={-1} autoComplete="off" />
                <input type="password" name="fake_password_anti_autofill" className="hidden" tabIndex={-1} autoComplete="off" />

                {/* Information Recruteur */}
                {newRole === 'RECRUTEUR' && (
                  <div className="rounded-2xl border border-[#eceafc] bg-[#f8f7fe] p-3 text-xs text-[#4e44b8] flex items-start gap-2.5">
                    <Building2 size={16} className="shrink-0 mt-0.5 text-[#594be0]" />
                    <span className="leading-relaxed text-[11px]">
                      <strong>Création d'un compte Recruteur :</strong> L'e-mail et le mot de passe définis ici serviront au recruteur pour se connecter. Vous pourrez copier en 1 clic les identifiants complets dès la création.
                    </span>
                  </div>
                )}

                {/* 1. Sélection du Rôle (Boutons Visuels Modernes) */}
                <div>
                  <label className="block font-bold text-[#353e54] mb-1.5">
                    Type de profil & Rôle *
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setNewRole('CANDIDAT')}
                      className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition ${
                        newRole === 'CANDIDAT'
                          ? 'border-[#594be0] bg-[#f0efff] text-[#594be0] ring-2 ring-[#594be0]/20'
                          : 'border-[#e4e7f0] bg-white text-[#555e75] hover:bg-[#fafbfe]'
                      }`}
                    >
                      <User size={18} />
                      <span className="font-extrabold text-[11px]">Candidat</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewRole('RECRUTEUR')}
                      className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition ${
                        newRole === 'RECRUTEUR'
                          ? 'border-[#594be0] bg-[#f0efff] text-[#594be0] ring-2 ring-[#594be0]/20'
                          : 'border-[#e4e7f0] bg-white text-[#555e75] hover:bg-[#fafbfe]'
                      }`}
                    >
                      <Building2 size={18} />
                      <span className="font-extrabold text-[11px]">Recruteur</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewRole('ADMIN')}
                      className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition ${
                        newRole === 'ADMIN'
                          ? 'border-[#c93232] bg-[#ffe8e8] text-[#c93232] ring-2 ring-[#c93232]/20'
                          : 'border-[#e4e7f0] bg-white text-[#555e75] hover:bg-[#fafbfe]'
                      }`}
                    >
                      <Shield size={18} />
                      <span className="font-extrabold text-[11px]">Admin</span>
                    </button>
                  </div>
                </div>

                {/* 2. Coordonnées d'identité */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#353e54] mb-1">Nom *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Ben Salem"
                      value={newNom ?? ''}
                      onChange={(e) => setNewNom(e.target.value)}
                      className="w-full rounded-2xl border border-[#dde1ed] bg-white px-3.5 py-2.5 text-xs text-[#1e2538] outline-none focus:border-[#594be0] focus:ring-2 focus:ring-[#594be0]/15"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#353e54] mb-1">Prénom *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Amina"
                      value={newPrenom ?? ''}
                      onChange={(e) => setNewPrenom(e.target.value)}
                      className="w-full rounded-2xl border border-[#dde1ed] bg-white px-3.5 py-2.5 text-xs text-[#1e2538] outline-none focus:border-[#594be0] focus:ring-2 focus:ring-[#594be0]/15"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#353e54] mb-1">Adresse e-mail de connexion *</label>
                  <div className="flex items-center gap-2 rounded-2xl border border-[#dde1ed] bg-white px-3.5 py-2.5 focus-within:border-[#594be0] focus-within:ring-2 focus-within:ring-[#594be0]/15">
                    <Mail size={15} className="text-[#98a2b8]" />
                    <input
                      type="email"
                      name="admin_new_user_email_empty"
                      autoComplete="new-email"
                      required
                      placeholder="utilisateur@example.com"
                      value={newEmail ?? ''}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full bg-transparent text-xs text-[#1e2538] outline-none [&:-webkit-autofill]:shadow-[0_0_0_1000px_white_inset] [&:-webkit-autofill]:-webkit-text-fill-color-[#1e2538]"
                    />
                  </div>
                </div>

                {/* 3. Champs conditionnels selon le Rôle */}
                {newRole === 'RECRUTEUR' && (
                  <div className="rounded-2xl bg-[#fafbfe] border border-[#e8ebf5] p-3.5 space-y-3">
                    <div className="font-bold text-[#1e2538] flex items-center gap-1.5 text-xs">
                      <Building2 size={14} className="text-[#594be0]" />
                      Rattachement Entreprise
                    </div>

                    <div>
                      <label className="block font-semibold text-[#525b72] mb-1">Sélectionner une entreprise existante :</label>
                      <select
                        value={newEntrepriseId}
                        onChange={(e) => {
                          setNewEntrepriseId(e.target.value);
                          if (e.target.value) setNewEntrepriseNom('');
                        }}
                        className="w-full rounded-xl border border-[#dde1ed] bg-white p-2 text-xs font-medium text-[#1e2538] outline-none"
                      >
                        <option value="">-- Ou saisir une nouvelle entreprise ci-dessous --</option>
                        {entreprises.map((ent) => (
                          <option key={ent.id} value={ent.id}>
                            {ent.nom} ({ent.ville})
                          </option>
                        ))}
                      </select>
                    </div>

                    {!newEntrepriseId && (
                      <div>
                        <label className="block font-semibold text-[#525b72] mb-1">Ou Nom de la nouvelle entreprise :</label>
                        <input
                          type="text"
                          placeholder="Ex: Société Gamma SARL"
                          value={newEntrepriseNom ?? ''}
                          onChange={(e) => setNewEntrepriseNom(e.target.value)}
                          className="w-full rounded-xl border border-[#dde1ed] bg-white px-3 py-2 text-xs text-[#1e2538] outline-none"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block font-semibold text-[#525b72] mb-1">Téléphone professionnel :</label>
                      <input
                        type="text"
                        placeholder="Ex: +216 71 000 000"
                        value={newTelephone ?? ''}
                        onChange={(e) => setNewTelephone(e.target.value)}
                        className="w-full rounded-xl border border-[#dde1ed] bg-white px-3 py-2 text-xs text-[#1e2538] outline-none"
                      />
                    </div>
                  </div>
                )}

                {newRole === 'CANDIDAT' && (
                  <div className="rounded-2xl bg-[#fafbfe] border border-[#e8ebf5] p-3.5 space-y-3">
                    <div className="font-bold text-[#1e2538] flex items-center gap-1.5 text-xs">
                      <FileText size={14} className="text-[#594be0]" />
                      Informations Candidat
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-[#525b72] mb-1">Titre professionnel :</label>
                        <input
                          type="text"
                          placeholder="Ex: Développeuse Full Stack"
                          value={newTitre ?? ''}
                          onChange={(e) => setNewTitre(e.target.value)}
                          className="w-full rounded-xl border border-[#dde1ed] bg-white px-3 py-2 text-xs text-[#1e2538] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#525b72] mb-1">Ville de résidence :</label>
                        <input
                          type="text"
                          name="admin_new_user_ville"
                          autoComplete="off"
                          placeholder="Ex: Tunis, Sfax, Sousse..."
                          value={newVille ?? ''}
                          onChange={(e) => setNewVille(e.target.value)}
                          className="w-full rounded-xl border border-[#dde1ed] bg-white px-3 py-2 text-xs text-[#1e2538] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Mots de passe & Confirmation avec bouton Générer */}
                <div className="rounded-2xl bg-[#fafbfc] border border-[#edf0f7] p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-[#1e2538] flex items-center gap-1.5 text-xs">
                      <Lock size={14} className="text-[#594be0]" />
                      Sécurité & Mot de passe du compte
                    </div>
                    <button
                      type="button"
                      onClick={generateRandomNewPassword}
                      className="text-[11px] font-bold text-[#594be0] hover:underline flex items-center gap-1 cursor-pointer bg-[#f0efff] px-2.5 py-1 rounded-lg"
                      title="Générer un mot de passe sécurisé en 1 clic"
                    >
                      <Key size={12} /> Générer auto
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#353e54] mb-1">
                        Mot de passe * (min. 8 car.)
                      </label>
                      <div className="flex items-center gap-2 rounded-2xl border border-[#dde1ed] bg-white px-3.5 py-2 focus-within:border-[#594be0]">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="admin_new_user_pwd_field"
                          id="admin_new_user_pwd_field"
                          autoComplete="new-password"
                          required
                          minLength={8}
                          placeholder="••••••••"
                          value={newPassword ?? ''}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-transparent text-xs text-[#1e2538] outline-none [&:-webkit-autofill]:shadow-[0_0_0_1000px_white_inset] [&:-webkit-autofill]:-webkit-text-fill-color-[#1e2538]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-[#96a0b5] hover:text-[#171f33]"
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-[#353e54]">
                          Confirmer mot de passe *
                        </label>
                        {confirmPassword && (
                          <span
                            className={`text-[10px] font-bold ${
                              newPassword === confirmPassword ? 'text-[#248e56]' : 'text-[#cf3b3b]'
                            }`}
                          >
                            {newPassword === confirmPassword ? '✓ Correspond' : '✗ Différent'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 rounded-2xl border border-[#dde1ed] bg-white px-3.5 py-2 focus-within:border-[#594be0]">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="admin_new_user_conf_pwd_field"
                          id="admin_new_user_conf_pwd_field"
                          autoComplete="new-password"
                          required
                          minLength={8}
                          placeholder="••••••••"
                          value={confirmPassword ?? ''}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-transparent text-xs text-[#1e2538] outline-none [&:-webkit-autofill]:shadow-[0_0_0_1000px_white_inset] [&:-webkit-autofill]:-webkit-text-fill-color-[#1e2538]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="text-[#96a0b5] hover:text-[#171f33]"
                        >
                          {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="mt-6 flex items-center justify-end gap-2.5 pt-2 border-t border-[#edf0f7]">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    disabled={isSubmitting}
                    className="rounded-xl border border-[#d8dce8] bg-white px-4 py-2.5 font-bold text-[#5c657a] hover:bg-[#f6f7fa] transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 rounded-xl bg-[#594be0] px-5 py-2.5 font-bold text-white shadow-md shadow-[#594be0]/25 hover:bg-[#483ad3] transition disabled:opacity-50 cursor-pointer"
                  >
                    <UserPlus size={15} />
                    {isSubmitting ? 'Enregistrement en cours...' : 'Créer et obtenir les accès'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL FICHE PROFIL & RÉCUPÉRATION DE COMPTE (ADMIN) */}
      {selectedUserForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="my-6 w-full max-w-xl rounded-3xl border border-[#e4e8f2] bg-white p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            {/* Header Modal avec bascule Consultation / Modification */}
            <div className="flex items-start justify-between border-b border-[#edf0f7] pb-4">
              <div className="flex items-center gap-3.5">
                {selectedUserForDetail.avatar_url ? (
                  <img
                    src={selectedUserForDetail.avatar_url}
                    alt={selectedUserForDetail.nom}
                    className="size-14 rounded-2xl object-cover border border-[#e2e6f0]"
                  />
                ) : (
                  <div
                    className={`grid size-14 place-items-center rounded-2xl text-lg font-black ${
                      selectedUserForDetail.role?.nom === 'ADMIN'
                        ? 'bg-[#ffe8e8] text-[#c93232]'
                        : selectedUserForDetail.role?.nom === 'RECRUTEUR'
                        ? 'bg-[#f0efff] text-[#594be0]'
                        : 'bg-[#e8f1ff] text-[#2f6cb5]'
                    }`}
                  >
                    {selectedUserForDetail.prenom?.[0]}
                    {selectedUserForDetail.nom?.[0]}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-[#171f33]">
                      {selectedUserForDetail.prenom} {selectedUserForDetail.nom}
                    </h3>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                        selectedUserForDetail.role?.nom === 'ADMIN'
                          ? 'bg-[#ffe8e8] text-[#c93232]'
                          : selectedUserForDetail.role?.nom === 'RECRUTEUR'
                          ? 'bg-[#f0efff] text-[#594be0]'
                          : 'bg-[#e8f1ff] text-[#2f6cb5]'
                      }`}
                    >
                      {selectedUserForDetail.role?.nom}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-[#7d879d] flex items-center gap-1.5">
                    <span>{selectedUserForDetail.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingUser(!isEditingUser);
                    setEditSuccessMsg('');
                    setEditErrorMsg('');
                  }}
                  className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-2xs border ${
                    isEditingUser
                      ? 'bg-[#594be0] text-white border-[#594be0]'
                      : 'bg-[#f8f7ff] text-[#594be0] border-[#d6d0fa] hover:bg-[#eeeaff]'
                  }`}
                >
                  <Edit3 size={13} />
                  <span>{isEditingUser ? 'Mode lecture' : 'Modifier / Récupérer'}</span>
                </button>
                <button
                  onClick={() => setSelectedUserForDetail(null)}
                  className="rounded-xl p-1.5 text-[#8b95aa] hover:bg-[#f1f3f8] hover:text-[#171f33]"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Notification de mise à jour réussie / récupération */}
            {editSuccessMsg && (
              <div className="mt-4 rounded-2xl border border-[#bde9ce] bg-[#edf9f3] p-4 text-xs font-bold text-[#1a8145] animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#1a8145] shrink-0" />
                  <span>{editSuccessMsg}</span>
                </div>
                {(editPassword || editEmail) && (
                  <div className="mt-2.5 rounded-xl bg-white/85 p-3 border border-[#c6edcf] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono">
                    <div>
                      <div>E-mail : <strong>{editEmail || selectedUserForDetail.email}</strong></div>
                      {editPassword && <div>Mot de passe : <strong>{editPassword}</strong></div>}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyCredentials}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#1a8145] text-white px-2.5 py-1 font-sans text-[11px] font-bold hover:bg-[#156e3a] transition shrink-0"
                    >
                      {copiedCredentials ? <Check size={12} /> : <Copy size={12} />}
                      {copiedCredentials ? 'Identifiants copiés !' : 'Copier les accès'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Notification de réinitialisation mot de passe standard */}
            {resetPasswordSuccess && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#edf9f3] p-3 text-xs font-bold text-[#248e56] border border-[#c4ebd3]">
                <CheckCircle2 size={16} />
                Un e-mail sécurisé de réinitialisation de mot de passe a été envoyé à {selectedUserForDetail.email}.
              </div>
            )}

            {/* Message d'erreur s'il y a lieu */}
            {editErrorMsg && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#fff0f0] p-3 text-xs font-bold text-[#cf3838] border border-[#fcc]">
                <AlertCircle size={16} />
                {editErrorMsg}
              </div>
            )}

            {/* CORPS DU MODAL : MODE ÉDITION VS MODE CONSULTATION */}
            {isEditingUser ? (
              /* FORMULAIRE DE MODIFICATION / RÉCUPÉRATION DU COMPTE */
              <form onSubmit={handleSaveEditUser} className="mt-5 space-y-4 text-xs">
                <div className="rounded-2xl border border-[#e4dffd] bg-[#f9f8ff] p-3.5 text-[11px] text-[#5547d7] leading-relaxed flex items-start gap-2.5">
                  <Key size={16} className="shrink-0 mt-0.5 text-[#594be0]" />
                  <div>
                    <strong>Assistance Récupération de Compte :</strong> Si le candidat a perdu l'accès à son adresse e-mail ({selectedUserForDetail.email}), mettez à jour son e-mail ici et attribuez-lui directement un nouveau mot de passe provisoire. Il pourra se reconnecter immédiatement sans avoir besoin du lien par e-mail.
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-[#4e566d] block mb-1">Prénom *</label>
                    <input
                      type="text"
                      value={editPrenom ?? ''}
                      onChange={(e) => setEditPrenom(e.target.value)}
                      className="w-full rounded-xl border border-[#dde1ed] bg-white p-2.5 text-xs font-bold text-[#171f33] outline-none focus:border-[#594be0]"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[#4e566d] block mb-1">Nom *</label>
                    <input
                      type="text"
                      value={editNom ?? ''}
                      onChange={(e) => setEditNom(e.target.value)}
                      className="w-full rounded-xl border border-[#dde1ed] bg-white p-2.5 text-xs font-bold text-[#171f33] outline-none focus:border-[#594be0]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-[#4e566d]">
                      Nouvelle adresse e-mail de connexion *
                    </label>
                    <span className="text-[10px] font-bold text-[#594be0]">
                      E-mail perdu ? Saisissez la nouvelle adresse
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="email"
                      value={editEmail ?? ''}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full rounded-xl border border-[#dde1ed] bg-white p-2.5 pl-8 text-xs font-bold text-[#171f33] outline-none focus:border-[#594be0]"
                      placeholder="nouveau.email@example.com"
                      required
                    />
                    <Mail size={14} className="absolute left-2.5 top-3 text-[#9aa2b5]" />
                  </div>
                </div>

                <div className="rounded-2xl border border-[#eceff6] bg-[#fafbfc] p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-[#4e566d] flex items-center gap-1.5">
                      <Lock size={13} className="text-[#594be0]" /> Nouveau mot de passe provisoire (optionnel) :
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-[10px] font-bold text-[#594be0] hover:underline"
                    >
                      ⚡ Générer un mot de passe
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      value={editPassword ?? ''}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Laissez vide pour conserver l'actuel ou min. 8 caractères"
                      className="w-full rounded-xl border border-[#dde1ed] bg-white p-2.5 pr-8 text-xs outline-none focus:border-[#594be0]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-2.5 top-3 text-[#9da5b8] hover:text-[#594be0]"
                    >
                      {showEditPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-[#788297]">
                    Permet au candidat de se connecter tout de suite avec ses nouveaux accès.
                  </p>
                </div>

                {selectedUserForDetail.role?.nom === 'CANDIDAT' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="font-bold text-[#4e566d] block mb-1">Téléphone</label>
                      <input
                        type="text"
                        value={editTelephone ?? ''}
                        onChange={(e) => setEditTelephone(e.target.value)}
                        placeholder="+216 ..."
                        className="w-full rounded-xl border border-[#dde1ed] bg-white p-2 text-xs outline-none focus:border-[#594be0]"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-[#4e566d] block mb-1">Titre pro</label>
                      <input
                        type="text"
                        value={editTitre ?? ''}
                        onChange={(e) => setEditTitre(e.target.value)}
                        placeholder="Ex: Développeur Web"
                        className="w-full rounded-xl border border-[#dde1ed] bg-white p-2 text-xs outline-none focus:border-[#594be0]"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-[#4e566d] block mb-1">Ville</label>
                      <input
                        type="text"
                        value={editVille ?? ''}
                        onChange={(e) => setEditVille(e.target.value)}
                        placeholder="Ex: Tunis, Sfax"
                        className="w-full rounded-xl border border-[#dde1ed] bg-white p-2 text-xs outline-none focus:border-[#594be0]"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-[#edf0f7] pt-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#5c657a]">Statut :</span>
                    <select
                      value={editStatut}
                      onChange={(e) => setEditStatut(e.target.value as UserStatus)}
                      className="rounded-xl border border-[#dde1ed] bg-white px-3 py-1.5 text-xs font-bold text-[#1f283d] outline-none"
                    >
                      <option value="ACTIF">Actif</option>
                      <option value="INACTIF">Inactif / Suspendu</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingUser(false)}
                      className="rounded-xl border border-[#dde1ed] bg-white px-4 py-2 text-xs font-bold text-[#5c657a] hover:bg-[#fafbfc]"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={editLoading}
                      className="rounded-xl bg-[#594be0] px-5 py-2 text-xs font-black text-white shadow-md hover:bg-[#483ad3] disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {editLoading ? <RefreshCw size={13} className="animate-spin" /> : null}
                      {editLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* VUE CONSULTATION DU PROFIL */
              <div className="mt-5 space-y-4 text-xs">
                {/* Informations du compte */}
                <div className="rounded-2xl bg-[#fafbfc] border border-[#eff1f6] p-4 space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-[#7c869c] font-medium">Statut du compte :</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        selectedUserForDetail.statut === 'ACTIF'
                          ? 'bg-[#edf9f3] text-[#248e56]'
                          : 'bg-[#ffe8e8] text-[#cf3b3b]'
                      }`}
                    >
                      {selectedUserForDetail.statut === 'ACTIF' ? 'Actif' : 'Suspendu / Inactif'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7c869c] font-medium">Adresse e-mail :</span>
                    <span className="font-bold text-[#1f283d] flex items-center gap-1">
                      {selectedUserForDetail.email}
                      <button
                        type="button"
                        onClick={() => setIsEditingUser(true)}
                        className="text-[10px] text-[#594be0] underline font-normal ml-1"
                      >
                        (Modifier)
                      </button>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7c869c] font-medium">Identifiant unique (UUID) :</span>
                    <span className="font-mono text-[#525b71]">{selectedUserForDetail.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7c869c] font-medium">Dernière activité enregistrée :</span>
                    <span className="text-[#594be0] font-bold">
                      {selectedUserForDetail.derniere_connexion || 'Actif récemment'}
                    </span>
                  </div>
                </div>

                {/* Détails spécifiques RECRUTEUR */}
                {selectedUserForDetail.role?.nom === 'RECRUTEUR' && (
                  <div className="rounded-2xl border border-[#edf0f7] p-4 space-y-2">
                    <div className="font-bold text-[#1e2538] flex items-center gap-1.5 mb-1 text-sm">
                      <Building2 size={15} className="text-[#594be0]" />
                      Entreprise & Rôle Recrutement
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7c869c] font-medium">Entreprise rattachée :</span>
                      <span className="font-bold text-[#1f283d]">
                        {selectedUserForDetail.entreprise?.nom || 'Société Alpha'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7c869c] font-medium">Secteur & Localisation :</span>
                      <span className="text-[#4e576e]">
                        {selectedUserForDetail.entreprise?.secteur || 'Technologies & Conseil'} · {selectedUserForDetail.entreprise?.ville || 'Tunis'}
                      </span>
                    </div>
                    {onViewCompany && (
                      <div className="pt-2">
                        <button
                          onClick={() => {
                            const entId = selectedUserForDetail.entreprise_id || 'c-alpha';
                            onViewCompany(entId);
                            setSelectedUserForDetail(null);
                          }}
                          className="flex items-center gap-1.5 font-bold text-[#594be0] hover:underline"
                        >
                          Consulter la fiche publique de cette entreprise →
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Détails spécifiques CANDIDAT */}
                {selectedUserForDetail.role?.nom === 'CANDIDAT' && (
                  <div className="rounded-2xl border border-[#edf0f7] p-4 space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-bold text-[#1e2538] flex items-center gap-1.5 text-sm">
                        <FileText size={15} className="text-[#594be0]" />
                        Profil Candidat & CV
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsEditingUser(true)}
                        className="text-[11px] font-bold text-[#594be0] hover:underline"
                      >
                        Modifier le profil
                      </button>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7c869c] font-medium">Titre professionnel :</span>
                      <span className="font-bold text-[#1f283d]">
                        {selectedUserForDetail.candidat?.titre || 'Développeuse Web Junior Full Stack'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7c869c] font-medium">Ville de résidence :</span>
                      <span className="text-[#4e576e]">
                        {selectedUserForDetail.candidat?.ville || 'Sfax'}, {selectedUserForDetail.candidat?.pays || 'Tunisie'}
                      </span>
                    </div>
                    {selectedUserForDetail.candidat?.telephone && (
                      <div className="flex justify-between">
                        <span className="text-[#7c869c] font-medium">Téléphone :</span>
                        <span className="font-bold text-[#1f283d]">
                          {selectedUserForDetail.candidat.telephone}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-[#7c869c] font-medium block mb-1">Compétences déclarées :</span>
                      <div className="flex flex-wrap gap-1.5">
                        {['React', 'Node.js', 'SQL', 'TypeScript', 'TailwindCSS'].map((tag) => (
                          <span key={tag} className="rounded-md bg-[#f2f0fd] px-2 py-0.5 text-[10px] font-bold text-[#594be0]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Détails spécifiques ADMIN */}
                {selectedUserForDetail.role?.nom === 'ADMIN' && (
                  <div className="rounded-2xl border border-[#edf0f7] p-4 space-y-2 bg-[#fffafa]">
                    <div className="font-bold text-[#c93232] flex items-center gap-1.5 mb-1 text-sm">
                      <Shield size={15} />
                      Droits d'administration système
                    </div>
                    <p className="text-[#687082] leading-relaxed">
                      Ce compte dispose des privilèges maximaux sur la plateforme : gestion des utilisateurs, des entreprises partenaires, paramétrage des modèles d'e-mails et modération des offres.
                    </p>
                  </div>
                )}

                {/* Actions Administrateur dans le modal */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#edf0f7] pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingUser(true)}
                      className="flex items-center gap-1.5 rounded-xl border border-[#d6d0fa] bg-[#f8f7ff] px-3.5 py-2 text-xs font-bold text-[#594be0] hover:bg-[#eeeaff] transition shadow-2xs"
                    >
                      <Edit3 size={14} /> Modifier & Récupérer compte
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onToggleStatus(selectedUserForDetail.id);
                        setSelectedUserForDetail((prev: UserType | null) =>
                          prev
                            ? {
                                ...prev,
                                statut: prev.statut === 'ACTIF' ? 'INACTIF' : 'ACTIF',
                              }
                            : null
                        );
                      }}
                      className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                        selectedUserForDetail.statut === 'ACTIF'
                          ? 'bg-[#ffe8e8] text-[#c93232] hover:bg-[#ffd5d5]'
                          : 'bg-[#edf9f3] text-[#248e56] hover:bg-[#d9f2e4]'
                      }`}
                    >
                      {selectedUserForDetail.statut === 'ACTIF' ? (
                        <>
                          <UserX size={14} /> Suspendre
                        </>
                      ) : (
                        <>
                          <UserCheck size={14} /> Réactiver
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setResetPasswordSuccess(true)}
                      className="rounded-xl border border-[#dfe3ee] bg-white px-3.5 py-2 text-xs font-bold text-[#4d556b] hover:bg-[#f8f9fd] transition"
                    >
                      Réinitialiser mot de passe
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Confirmez-vous la suppression de l'utilisateur ${selectedUserForDetail.prenom} ${selectedUserForDetail.nom} ?`)) {
                          onDeleteUser(selectedUserForDetail.id);
                          setSelectedUserForDetail(null);
                        }
                      }}
                      className="rounded-xl p-2 text-[#9ba4b8] hover:bg-[#fff0f0] hover:text-[#c93232] transition"
                      title="Supprimer définitivement"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedUserForDetail(null)}
                      className="rounded-xl bg-[#594be0] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#483ad3] transition"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
