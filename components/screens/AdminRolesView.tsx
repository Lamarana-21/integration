'use client';

import React, { useState } from 'react';
import {
  Check,
  Plus,
  Save,
  Shield,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { Permission, Role, RoleName } from '@/lib/types';

interface AdminRolesViewProps {
  roles: Role[];
  allPermissions: Permission[];
  onUpdateRolePermissions: (roleId: string, permissionIds: string[]) => void;
}

export function AdminRolesView({
  roles,
  allPermissions,
  onUpdateRolePermissions,
}: AdminRolesViewProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[1]?.id || roles[0]?.id);
  const [rolePermissionsMap, setRolePermissionsMap] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    roles.forEach((r) => {
      map[r.id] = r.permissions?.map((p) => p.id) || [];
    });
    return map;
  });
  const [successSaved, setSuccessSaved] = useState(false);

  const selectedRole = roles.find((r) => r.id === selectedRoleId) || roles[0];
  const activePermIds = rolePermissionsMap[selectedRoleId] || [];

  const togglePermission = (permId: string) => {
    const current = rolePermissionsMap[selectedRoleId] || [];
    const updated = current.includes(permId)
      ? current.filter((id) => id !== permId)
      : [...current, permId];

    setRolePermissionsMap({
      ...rolePermissionsMap,
      [selectedRoleId]: updated,
    });
  };

  const handleSave = () => {
    onUpdateRolePermissions(selectedRoleId, activePermIds);
    setSuccessSaved(true);
    setTimeout(() => setSuccessSaved(false), 3000);
  };

  // Group permissions into categories according to Section 4
  const categories = [
    {
      titre: 'Offres',
      perms: allPermissions.filter((p) =>
        ['CREER_OFFRE', 'MODIFIER_OFFRE', 'PUBLIER_OFFRE', 'CLOTURER_OFFRE', 'SUPPRIMER_OFFRE'].includes(
          p.nom
        )
      ),
    },
    {
      titre: 'Candidatures',
      perms: allPermissions.filter((p) =>
        ['POSTULER', 'RETIRER_CANDIDATURE', 'VOIR_CANDIDATURES', 'CHANGER_STATUT'].includes(
          p.nom
        )
      ),
    },
    {
      titre: 'Utilisateurs & Profils',
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
      titre: 'Droits & Entreprises',
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
      titre: 'Analyse IA & Tableaux de bord',
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      {/* Top Header (E13) */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#eef1f7] pb-5 sm:flex-row sm:items-center">
        <div>
          <span className="text-xs font-bold text-[#8c94a9] uppercase tracking-wider">
            Sécurité & Rôles (E13)
          </span>
          <h1 className="mt-1 text-2xl font-black text-[#171f33]">
            Rôles et permissions
          </h1>
          <p className="mt-1 text-xs text-[#7e879c]">
            Définissez précisément les actions et les accès accordés à chaque rôle utilisateur.
          </p>
        </div>

        {/* RM9 Banner */}
        <div className="flex items-center gap-2 rounded-2xl bg-[#edf9f3] px-3.5 py-2 text-xs font-bold text-[#279257] border border-[#c9eed9]">
          <ShieldCheck size={16} /> Règle RM9 : Application immédiate à la prochaine requête
        </div>
      </div>

      {successSaved && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#cbeedc] bg-[#edf9f3] p-4 text-xs font-bold text-[#2a945d] shadow-xs">
          <Check size={16} /> Permissions du rôle mises à jour avec succès (RM9) !
        </div>
      )}

      {/* Main Grid: Left Roles List + Right Matrix (E13) */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Left Column: Roles list */}
        <aside className="space-y-4 rounded-3xl border border-[#e8ebf3] bg-white p-6 shadow-xs h-fit">
          <h3 className="text-xs font-extrabold text-[#171f33] uppercase tracking-wider">
            Rôles système
          </h3>

          <div className="space-y-2">
            {roles.map((r) => {
              const isSelected = r.id === selectedRoleId;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoleId(r.id)}
                  className={`flex w-full items-center justify-between rounded-2xl p-3.5 text-left text-xs transition ${
                    isSelected
                      ? 'bg-[#594be0] text-white shadow-md shadow-[#594be0]/20'
                      : 'bg-[#fafbfc] text-[#343b4f] hover:bg-[#f2f4fa]'
                  }`}
                >
                  <div>
                    <div className="font-black text-sm">{r.nom}</div>
                    <div
                      className={`text-[11px] truncate max-w-[180px] ${
                        isSelected ? 'text-white/80' : 'text-[#8790a4]'
                      }`}
                    >
                      {r.description}
                    </div>
                  </div>
                  <span className="font-extrabold">
                    {isSelected ? '●' : '○'}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Column: Matrix of permissions */}
        <div className="space-y-6 rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#f0f2f7] pb-4">
            <div>
              <h2 className="text-base font-extrabold text-[#171f33]">
                Permissions du rôle :{' '}
                <span className="text-[#594be0]">{selectedRole?.nom}</span>
              </h2>
              <p className="text-xs text-[#828ba0]">
                {activePermIds.length} permission(s) activée(s) pour ce rôle
              </p>
            </div>

            <button
              onClick={handleSave}
              className="flex items-center gap-2 rounded-2xl bg-[#594be0] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#483ad3] transition"
            >
              <Save size={15} /> Enregistrer les permissions (RM9)
            </button>
          </div>

          <div className="space-y-6">
            {categories.map((cat) => (
              <div key={cat.titre} className="border-b border-[#f4f6fa] pb-5 last:border-0">
                <h4 className="text-xs font-extrabold text-[#232b3e] uppercase tracking-wider mb-3">
                  {cat.titre}
                </h4>

                <div className="grid gap-2.5 sm:grid-cols-2">
                  {cat.perms.map((perm) => {
                    const isChecked = activePermIds.includes(perm.id);

                    return (
                      <label
                        key={perm.id}
                        className={`flex items-start gap-3 rounded-2xl border p-3 cursor-pointer text-xs transition ${
                          isChecked
                            ? 'border-[#cdc7fc] bg-[#f8f7ff]'
                            : 'border-[#eaedf5] bg-white hover:bg-[#fafbfc]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(perm.id)}
                          className="mt-0.5 size-4 rounded accent-[#594be0]"
                        />
                        <div>
                          <div
                            className={`font-mono font-bold ${
                              isChecked ? 'text-[#5547d7]' : 'text-[#20273a]'
                            }`}
                          >
                            {perm.nom}
                          </div>
                          <div className="text-[11px] text-[#7d869d]">
                            {perm.description}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
