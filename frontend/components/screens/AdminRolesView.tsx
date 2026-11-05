'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  AlertCircle,
  Briefcase,
  Check,
  CheckCircle2,
  CheckSquare,
  FileText,
  KeyRound,
  Lock,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { Permission, Role, RoleName, User } from '@/lib/types';

interface AdminRolesViewProps {
  roles: Role[];
  allPermissions: Permission[];
  users?: User[];
  onUpdateRolePermissions: (roleId: string, permissionIds: string[]) => Promise<boolean> | void;
  onCreateRole?: (data: { nom: string; description?: string; permission_ids?: string[] }) => Promise<boolean> | void;
  onDeleteRole?: (roleId: string) => Promise<boolean> | void;
}

export function AdminRolesView({
  roles,
  allPermissions,
  users = [],
  onUpdateRolePermissions,
  onCreateRole,
  onDeleteRole,
}: AdminRolesViewProps) {
  // Rôle sélectionné (par défaut RECRUTEUR ou 2ème rôle)
  const [selectedRoleId, setSelectedRoleId] = useState<string>(
    () => roles.find((r) => r.nom === 'RECRUTEUR')?.id || roles[1]?.id || roles[0]?.id || ''
  );

  // État local de la matrice rôle -> liste des IDs de permissions actives
  const [rolePermissionsMap, setRolePermissionsMap] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    roles.forEach((r) => {
      map[r.id] = r.permissions?.map((p) => p.id) || [];
      if (r.nom) map[r.nom] = map[r.id];
    });
    return map;
  });

  // Recherche & filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successSaved, setSuccessSaved] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal création nouveau rôle
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [newRoleNom, setNewRoleNom] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleLoading, setNewRoleLoading] = useState(false);
  const [newRoleError, setNewRoleError] = useState('');

  // Synchronisation si les rôles changent depuis les props (ex: chargement asynchrone MySQL)
  useEffect(() => {
    setRolePermissionsMap((prev) => {
      const next = { ...prev };
      roles.forEach((r) => {
        // Si non encore défini localement, initialiser
        if (!next[r.id]) {
          next[r.id] = r.permissions?.map((p) => p.id) || [];
        }
        if (r.nom && !next[r.nom]) {
          next[r.nom] = next[r.id];
        }
      });
      return next;
    });

    // Si le rôle sélectionné n'existe plus ou est vide, prendre le premier
    if (!selectedRoleId && roles.length > 0) {
      setSelectedRoleId(roles.find((r) => r.nom === 'RECRUTEUR')?.id || roles[0].id);
    }
  }, [roles, selectedRoleId]);

  const selectedRole = roles.find((r) => r.id === selectedRoleId || r.nom === selectedRoleId) || roles[0];
  const activePermIds = rolePermissionsMap[selectedRole?.id || selectedRoleId] || [];

  // Vérifier si une permission est active (par ID ou par NOM)
  const isPermissionActive = (perm: Permission): boolean => {
    return activePermIds.includes(perm.id) || activePermIds.includes(perm.nom);
  };

  // Comparaison avec l'état d'origine du rôle pour détecter les modifications non enregistrées
  const savedPermIds = useMemo(() => {
    return selectedRole?.permissions?.map((p) => p.id) || [];
  }, [selectedRole]);

  const hasUnsavedChanges = useMemo(() => {
    if (activePermIds.length !== savedPermIds.length) return true;
    return activePermIds.some((id) => !savedPermIds.includes(id));
  }, [activePermIds, savedPermIds]);

  // Utilisateurs ayant ce rôle
  const assignedUsers = useMemo(() => {
    if (!selectedRole) return [];
    return users.filter(
      (u) =>
        u.role_id === selectedRole.id ||
        u.role?.id === selectedRole.id ||
        u.role?.nom === selectedRole.nom
    );
  }, [users, selectedRole]);

  // Basculer une permission individuelle
  const togglePermission = (perm: Permission) => {
    const roleKey = selectedRole.id;
    const current = rolePermissionsMap[roleKey] || [];
    const isActive = isPermissionActive(perm);

    let updated: string[];
    if (isActive) {
      // Retirer
      updated = current.filter((id) => id !== perm.id && id !== perm.nom);
    } else {
      // Ajouter (on utilise l'ID réel)
      updated = [...current, perm.id];
    }

    setRolePermissionsMap({
      ...rolePermissionsMap,
      [roleKey]: updated,
      [selectedRole.nom]: updated,
    });
    setSuccessSaved(null);
  };

  // Tout cocher / décocher pour le rôle entier
  const handleToggleAllForRole = (activateAll: boolean) => {
    const roleKey = selectedRole.id;
    const updated = activateAll ? allPermissions.map((p) => p.id) : [];

    setRolePermissionsMap({
      ...rolePermissionsMap,
      [roleKey]: updated,
      [selectedRole.nom]: updated,
    });
    setSuccessSaved(null);
  };

  // Tout cocher / décocher pour une catégorie spécifique
  const handleToggleCategory = (categoryPerms: Permission[], activateAll: boolean) => {
    const roleKey = selectedRole.id;
    const current = rolePermissionsMap[roleKey] || [];
    const catPermIds = categoryPerms.map((p) => p.id);
    const catPermNoms = categoryPerms.map((p) => p.nom);

    let updated: string[];
    if (activateAll) {
      const toAdd = catPermIds.filter((id) => !current.includes(id));
      updated = [...current, ...toAdd];
    } else {
      updated = current.filter((id) => !catPermIds.includes(id) && !catPermNoms.includes(id));
    }

    setRolePermissionsMap({
      ...rolePermissionsMap,
      [roleKey]: updated,
      [selectedRole.nom]: updated,
    });
    setSuccessSaved(null);
  };

  // Rétablir la configuration d'origine
  const handleResetToDefault = () => {
    const roleKey = selectedRole.id;
    const original = selectedRole.permissions?.map((p) => p.id) || [];

    setRolePermissionsMap({
      ...rolePermissionsMap,
      [roleKey]: original,
      [selectedRole.nom]: original,
    });
    setSuccessSaved(null);
  };

  // Enregistrer les modifications vers MySQL (RM9)
  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessSaved(null);

    try {
      // On passe la liste des IDs de permissions actives
      await onUpdateRolePermissions(selectedRole.id, activePermIds);
      setSuccessSaved(
        `Permissions du rôle ${selectedRole.nom} enregistrées avec succès ! Les modifications s'appliquent immédiatement à la prochaine requête.`
      );
    } catch (err: any) {
      setErrorMessage(
        err?.message || "Une erreur est survenue lors de l'enregistrement des permissions en base de données."
      );
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        setSuccessSaved(null);
      }, 5000);
    }
  };

  // Création d'un rôle personnalisé
  const handleCreateNewRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleNom.trim()) return;

    setNewRoleLoading(true);
    setNewRoleError('');

    try {
      if (onCreateRole) {
        await onCreateRole({
          nom: newRoleNom.trim().toUpperCase(),
          description: newRoleDesc.trim(),
          permission_ids: [],
        });
      }
      setShowCreateRoleModal(false);
      setNewRoleNom('');
      setNewRoleDesc('');
      setSuccessSaved(`Rôle "${newRoleNom.toUpperCase()}" créé avec succès ! Vous pouvez maintenant lui attribuer ses permissions.`);
    } catch (err: any) {
      setNewRoleError(err?.message || 'Erreur lors de la création du rôle');
    } finally {
      setNewRoleLoading(false);
    }
  };

  // Suppression d'un rôle
  const handleDeleteRoleClick = async (role: Role) => {
    if (['ADMIN', 'RECRUTEUR', 'CANDIDAT'].includes(role.nom)) {
      alert('Impossible de supprimer un rôle système de base.');
      return;
    }

    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le rôle "${role.nom}" ?`)) {
      return;
    }

    try {
      if (onDeleteRole) {
        await onDeleteRole(role.id);
      }
      setSelectedRoleId(roles[0]?.id || '');
      setSuccessSaved(`Rôle "${role.nom}" supprimé avec succès.`);
    } catch (err: any) {
      alert(err?.message || 'Erreur lors de la suppression du rôle.');
    }
  };

  // Définition des catégories de permissions avec icônes
  const baseCategories = useMemo(() => {
    const list = [
      {
        id: 'offres',
        titre: 'OFFRES',
        icon: Briefcase,
        color: 'text-[#594be0]',
        perms: allPermissions.filter((p) =>
          ['CREER_OFFRE', 'MODIFIER_OFFRE', 'PUBLIER_OFFRE', 'CLOTURER_OFFRE', 'SUPPRIMER_OFFRE'].includes(
            p.nom
          )
        ),
      },
      {
        id: 'candidatures',
        titre: 'CANDIDATURES',
        icon: FileText,
        color: 'text-[#2f6cb5]',
        perms: allPermissions.filter((p) =>
          ['POSTULER', 'RETIRER_CANDIDATURE', 'VOIR_CANDIDATURES', 'CHANGER_STATUT'].includes(
            p.nom
          )
        ),
      },
      {
        id: 'utilisateurs',
        titre: 'UTILISATEURS & PROFILS',
        icon: Users,
        color: 'text-[#1a8145]',
        perms: allPermissions.filter((p) =>
          [
            'CREER_UTILISATEUR',
            'MODIFIER_UTILISATEUR',
            'SUSPENDRE_UTILISATEUR',
            'SUPPRIMER_UTILISATEUR',
            'VOIR_UTILISATEURS',
            'VOIR_CANDIDAT',
            'AJOUTER_NOTE',
            'SUPPRIMER_DONNEES_CANDIDAT',
          ].includes(p.nom)
        ),
      },
      {
        id: 'droits',
        titre: 'DROITS & ENTREPRISES',
        icon: KeyRound,
        color: 'text-[#cf3838]',
        perms: allPermissions.filter((p) =>
          [
            'GERER_ROLES',
            'GERER_PERMISSIONS',
            'ATTRIBUER_ROLE',
            'CREER_ENTREPRISE',
            'MODIFIER_ENTREPRISE',
            'DESACTIVER_ENTREPRISE',
          ].includes(p.nom)
        ),
      },
      {
        id: 'ia',
        titre: 'ANALYSE IA & TABLEAUX DE BORD',
        icon: Sparkles,
        color: 'text-[#d69e2e]',
        perms: allPermissions.filter((p) =>
          [
            'LANCER_ANALYSE',
            'VOIR_ANALYSE',
            'CORRIGER_ANALYSE',
            'VOIR_DASHBOARD_RECRUTEUR',
            'VOIR_DASHBOARD_ADMIN',
          ].includes(p.nom)
        ),
      },
    ];

    // Vérifier les permissions restantes non catégorisées
    const categorizedNames = list.flatMap((c) => c.perms.map((p) => p.nom));
    const extraPerms = allPermissions.filter((p) => !categorizedNames.includes(p.nom));

    if (extraPerms.length > 0) {
      list.push({
        id: 'autres',
        titre: 'AUTRES PERMISSIONS SYSTÈME',
        icon: Shield,
        color: 'text-[#7e879c]',
        perms: extraPerms,
      });
    }

    return list;
  }, [allPermissions]);

  // Filtrage selon la recherche
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return baseCategories;

    const q = searchQuery.toLowerCase().trim();
    return baseCategories
      .map((cat) => ({
        ...cat,
        perms: cat.perms.filter(
          (p) =>
            p.nom.toLowerCase().includes(q) ||
            (p.description && p.description.toLowerCase().includes(q))
        ),
      }))
      .filter((cat) => cat.perms.length > 0);
  }, [baseCategories, searchQuery]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 space-y-6 animate-in fade-in">
      {/* Top Header (E13) */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#eef1f7] pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#8c94a9] uppercase tracking-wider">
              Administration & Sécurité RBAC
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-[#171f33] tracking-tight">
            Rôles et permissions
          </h1>
          <p className="mt-1 text-xs text-[#7e879c]">
            Définissez précisément les actions et les accès accordés à chaque rôle utilisateur.
          </p>
        </div>

        {/* RM9 Banner */}
        <div className="flex items-center gap-2 rounded-2xl bg-[#edf9f3] px-4 py-2.5 text-xs font-bold text-[#279257] border border-[#c9eed9] shadow-2xs">
          <ShieldCheck size={18} className="shrink-0 text-[#279257]" />
          <span>
            Application immédiate des droits à la prochaine requête
          </span>
        </div>
      </div>

      {/* Notifications Succès / Erreur */}
      {successSaved && (
        <div className="flex items-start gap-3 rounded-2xl border border-[#bde9ce] bg-[#edf9f3] p-4 text-xs font-bold text-[#1a8145] shadow-xs animate-in slide-in-from-top-2">
          <CheckCircle2 size={18} className="shrink-0 text-[#1a8145] mt-0.5" />
          <div className="flex-1">{successSaved}</div>
          <button
            onClick={() => setSuccessSaved(null)}
            className="text-[#1a8145] hover:opacity-75"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-[#fcc] bg-[#fff0f0] p-4 text-xs font-bold text-[#cf3838] shadow-xs animate-in slide-in-from-top-2">
          <AlertCircle size={18} className="shrink-0 text-[#cf3838] mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-[#cf3838] hover:opacity-75"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Main Grid: Left Roles List + Right Matrix (E13) */}
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Colonne Gauche : Rôles Système & Rôles Personnalisés */}
        <aside className="space-y-4 rounded-3xl border border-[#e8ebf3] bg-white p-5 sm:p-6 shadow-xs h-fit">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-[#171f33] uppercase tracking-wider">
              Rôles système ({roles.length})
            </h3>
            {onCreateRole && (
              <button
                type="button"
                onClick={() => setShowCreateRoleModal(true)}
                title="Ajouter un rôle"
                className="flex items-center gap-1 text-[11px] font-bold text-[#594be0] hover:text-[#4538c2] transition"
              >
                <Plus size={13} />
                <span>Nouveau</span>
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {roles.map((r) => {
              const isSelected = r.id === selectedRole?.id || r.nom === selectedRole?.nom;
              const countPerms = (rolePermissionsMap[r.id] || r.permissions?.map((p) => p.id) || []).length;
              const isBaseRole = ['ADMIN', 'RECRUTEUR', 'CANDIDAT'].includes(r.nom);

              return (
                <div
                  key={r.id}
                  onClick={() => {
                    setSelectedRoleId(r.id);
                    setSuccessSaved(null);
                  }}
                  className={`group relative flex w-full cursor-pointer flex-col rounded-2xl p-3.5 text-left text-xs transition border ${
                    isSelected
                      ? 'bg-[#594be0] text-white border-[#594be0] shadow-md shadow-[#594be0]/20'
                      : 'bg-[#fafbfc] text-[#343b4f] border-[#edf0f7] hover:bg-[#f2f4fa] hover:border-[#dfe3ef]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm">{r.nom}</span>
                      {isBaseRole && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-[#edeafc] text-[#594be0]'
                          }`}
                        >
                          Système
                        </span>
                      )}
                    </div>
                    <span className="font-extrabold text-xs">
                      {isSelected ? '●' : '○'}
                    </span>
                  </div>

                  <div
                    className={`mt-1 text-[11px] line-clamp-2 leading-relaxed ${
                      isSelected ? 'text-white/80' : 'text-[#7e879c]'
                    }`}
                  >
                    {r.description || 'Rôle utilisateur sur la plateforme'}
                  </div>

                  <div className="mt-2.5 flex items-center justify-between border-t border-white/15 pt-2 text-[10px]">
                    <span
                      className={`font-semibold ${
                        isSelected ? 'text-white/90' : 'text-[#8c94a9]'
                      }`}
                    >
                      {countPerms} permission(s)
                    </span>

                    {!isBaseRole && onDeleteRole && !isSelected && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRoleClick(r);
                        }}
                        title="Supprimer ce rôle"
                        className="text-[#cf3b3b] hover:underline"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Guide informatif RM9 */}
          <div className="rounded-2xl border border-[#e4dffd] bg-[#f9f8ff] p-3 text-[11px] text-[#5547d7] leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <KeyRound size={13} /> Sécurité RBAC & Cache
            </div>
            Les habilitations définies ici contrôlent l'accès aux boutons, formulaires, routes et actions de l'API. Toute modification est active sans redémarrage.
          </div>
        </aside>

        {/* Colonne Droite : Matrice des permissions du rôle sélectionné */}
        <div className="space-y-6 rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-8 shadow-xs">
          {/* Header de la matrice */}
          <div className="flex flex-col justify-between gap-4 border-b border-[#f0f2f7] pb-5 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#828ba0]">
                  Configuration des privilèges
                </span>
                {hasUnsavedChanges && (
                  <span className="rounded-md bg-[#fff3e0] px-2 py-0.5 text-[10px] font-black text-[#d97706] border border-[#fed7aa] animate-pulse">
                    Modifications non enregistrées
                  </span>
                )}
              </div>
              <h2 className="text-xl font-black text-[#171f33] mt-0.5">
                Permissions du rôle :{' '}
                <span className="text-[#594be0]">{selectedRole?.nom}</span>
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[#828ba0]">
                <span>
                  <strong>{activePermIds.length}</strong> sur <strong>{allPermissions.length}</strong> permissions activées
                </span>
                <span>•</span>
                <span>
                  {assignedUsers.length} utilisateur(s) rattaché(s)
                </span>
              </div>
            </div>

            {/* Bouton d'enregistrement principal (RM9) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className={`flex items-center gap-2 rounded-2xl px-6 py-2.5 text-xs font-bold text-white shadow-md transition ${
                  hasUnsavedChanges
                    ? 'bg-[#594be0] hover:bg-[#483ad3] ring-4 ring-[#594be0]/20'
                    : 'bg-[#594be0] hover:bg-[#483ad3]'
                } disabled:opacity-60`}
              >
                {isSaving ? (
                  <RefreshCw size={15} className="animate-spin" />
                ) : (
                  <Save size={15} />
                )}
                <span>
                  {isSaving
                    ? 'Enregistrement...'
                    : hasUnsavedChanges
                    ? 'Enregistrer les modifications'
                    : 'Enregistrer les permissions'}
                </span>
              </button>
            </div>
          </div>

          {/* Barre d'outils dynamique : Recherche & Actions globales */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-[#fafbfc] border border-[#e8ebf3] p-3 text-xs">
            {/* Champ de recherche instantané */}
            <div className="flex flex-1 items-center gap-2 min-w-[220px] rounded-xl border border-[#dfe3ee] bg-white px-3 py-1.5 focus-within:border-[#594be0]">
              <Search size={14} className="text-[#9ea6bb]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une permission par mot-clé (ex: offre, ia, profil)..."
                className="w-full bg-transparent outline-none text-[#1e2538]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[#9ea6bb] hover:text-[#171f33]"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Actions rapides globales */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleToggleAllForRole(true)}
                title="Activer toutes les 28 permissions pour ce rôle"
                className="flex items-center gap-1 rounded-xl border border-[#dde1ec] bg-white px-2.5 py-1.5 text-xs font-bold text-[#594be0] hover:bg-[#f4f2ff] transition"
              >
                <CheckSquare size={13} />
                <span>Tout cocher</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleAllForRole(false)}
                title="Désactiver toutes les permissions"
                className="flex items-center gap-1 rounded-xl border border-[#dde1ec] bg-white px-2.5 py-1.5 text-xs font-bold text-[#626a80] hover:bg-[#f1f3f8] transition"
              >
                <Square size={13} />
                <span>Tout décocher</span>
              </button>

              <button
                type="button"
                onClick={handleResetToDefault}
                title="Annuler les modifications et rétablir les permissions d'origine"
                className="flex items-center gap-1 rounded-xl border border-[#dde1ec] bg-white px-2.5 py-1.5 text-xs font-bold text-[#626a80] hover:bg-[#f1f3f8] transition"
              >
                <RotateCcw size={13} />
                <span>Rétablir</span>
              </button>
            </div>
          </div>

          {/* Barre de progression des permissions actives */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-bold text-[#717b92]">
              <span>Couverture des habilitations</span>
              <span className="text-[#594be0]">
                {Math.round((activePermIds.length / (allPermissions.length || 1)) * 100)}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#eef1f7]">
              <div
                className="h-full bg-gradient-to-r from-[#594be0] to-[#7f73ff] transition-all duration-300"
                style={{
                  width: `${Math.round(
                    (activePermIds.length / (allPermissions.length || 1)) * 100
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Grille des catégories de permissions */}
          <div className="space-y-6 pt-2">
            {filteredCategories.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#dde1ed] p-8 text-center text-xs text-[#8c94a9]">
                Aucune permission ne correspond à votre recherche "{searchQuery}".
              </div>
            ) : (
              filteredCategories.map((cat) => {
                const CatIcon = cat.icon;
                const activeCountInCat = cat.perms.filter(isPermissionActive).length;
                const totalInCat = cat.perms.length;
                const isAllCheckedInCat = activeCountInCat === totalInCat && totalInCat > 0;

                return (
                  <div
                    key={cat.id}
                    className="border-b border-[#f4f6fa] pb-6 last:border-0"
                  >
                    {/* Header de catégorie avec statistiques et actions de groupe */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <CatIcon size={16} className={cat.color} />
                        <h4 className="text-xs font-black text-[#232b3e] uppercase tracking-wider">
                          {cat.titre}
                        </h4>
                        <span className="rounded-full bg-[#f0f2f7] px-2 py-0.5 text-[10px] font-extrabold text-[#697287]">
                          {activeCountInCat} / {totalInCat} active(s)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleCategory(cat.perms, !isAllCheckedInCat)}
                          className="text-[11px] font-bold text-[#594be0] hover:underline"
                        >
                          {isAllCheckedInCat ? 'Tout désactiver dans ce groupe' : 'Tout activer dans ce groupe'}
                        </button>
                      </div>
                    </div>

                    {/* Grille de cartes de permissions (Style exact du mockup RM9) */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {cat.perms.map((perm) => {
                        const isChecked = isPermissionActive(perm);

                        return (
                          <label
                            key={perm.id}
                            className={`group relative flex items-start gap-3 rounded-2xl border p-3.5 cursor-pointer text-xs transition select-none ${
                              isChecked
                                ? 'border-[#cdc7fc] bg-[#f8f7ff] shadow-xs'
                                : 'border-[#eaedf5] bg-white hover:bg-[#fafbfc] hover:border-[#dfe2ec]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => togglePermission(perm)}
                              className="mt-0.5 size-4 rounded accent-[#594be0] cursor-pointer"
                            />
                            <div className="flex-1 pr-1">
                              <div
                                className={`font-mono font-black tracking-tight ${
                                  isChecked ? 'text-[#5547d7]' : 'text-[#20273a]'
                                }`}
                              >
                                {perm.nom}
                              </div>
                              <div className="text-[11px] text-[#7d869d] mt-0.5 leading-relaxed">
                                {perm.description || 'Action autorisée sur le système'}
                              </div>
                            </div>

                            {isChecked && (
                              <Check
                                size={14}
                                className="text-[#594be0] shrink-0 mt-0.5 opacity-80"
                              />
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pied de page du panneau : Résumé & Rappel RM9 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#f0f2f7] pt-5 text-xs text-[#828ba0]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#279257]" />
              <span>
                Sécurité système : Déploiement instantané sans délai de cache.
              </span>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 font-bold text-[#594be0] hover:underline self-end sm:self-auto disabled:opacity-50"
            >
              <Save size={13} />
              <span>Enregistrer maintenant</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Créer un nouveau Rôle */}
      {showCreateRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-[#edf0f7] pb-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#594be0]">
                  Gestion des profils
                </span>
                <h3 className="text-lg font-black text-[#171f33] mt-0.5">
                  Créer un nouveau rôle
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateRoleModal(false)}
                className="rounded-xl p-1.5 text-[#8b95aa] hover:bg-[#f1f3f8] hover:text-[#171f33]"
              >
                <X size={18} />
              </button>
            </div>

            {newRoleError && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#fff0f0] p-3 text-xs font-bold text-[#cf3838]">
                <AlertCircle size={15} />
                {newRoleError}
              </div>
            )}

            <form onSubmit={handleCreateNewRoleSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#353e54] mb-1">
                  Nom du rôle (Code identifiant) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: AUDITEUR, GESTIONNAIRE_RH..."
                  value={newRoleNom}
                  onChange={(e) => setNewRoleNom(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-[#dde1ed] bg-white px-3.5 py-2.5 font-mono text-xs font-bold text-[#1e2538] outline-none focus:border-[#594be0]"
                />
                <p className="mt-1 text-[10px] text-[#858fa6]">
                  Sera automatiquement converti en majuscules sans espaces.
                </p>
              </div>

              <div>
                <label className="block font-bold text-[#353e54] mb-1">
                  Description du rôle
                </label>
                <textarea
                  rows={3}
                  placeholder="Décrivez les responsabilités et cas d'usage de ce rôle..."
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full rounded-xl border border-[#dde1ed] bg-white px-3.5 py-2 text-xs text-[#1e2538] outline-none focus:border-[#594be0]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[#edf0f7] pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateRoleModal(false)}
                  className="rounded-xl border border-[#dde1ed] bg-white px-4 py-2 text-xs font-bold text-[#5c657a] hover:bg-[#fafbfc]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={newRoleLoading}
                  className="rounded-xl bg-[#594be0] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#483ad3] disabled:opacity-50 flex items-center gap-1.5"
                >
                  {newRoleLoading ? <RefreshCw size={13} className="animate-spin" /> : null}
                  {newRoleLoading ? 'Création...' : 'Créer le rôle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
