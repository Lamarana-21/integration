'use client';

import React, { useState } from 'react';
import {
  MoreHorizontal,
  Plus,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserX,
  Users,
  X,
} from 'lucide-react';
import { Role, RoleName, User, UserStatus } from '@/lib/types';

interface AdminUsersViewProps {
  users: User[];
  roles: Role[];
  onToggleStatus: (id: string) => void;
  onDeleteUser: (id: string) => void;
  onCreateUser: (userData: Partial<User>) => void;
}

export function AdminUsersView({
  users,
  roles,
  onToggleStatus,
  onDeleteUser,
  onCreateUser,
}: AdminUsersViewProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('TOUS');
  const [statutFilter, setStatutFilter] = useState<string>('TOUS');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New user form state
  const [newNom, setNewNom] = useState('');
  const [newPrenom, setNewPrenom] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<RoleName>('RECRUTEUR');

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

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNom || !newPrenom || !newEmail) return;

    onCreateUser({
      nom: newNom,
      prenom: newPrenom,
      email: newEmail,
      statut: 'ACTIF',
      role: roles.find((r) => r.nom === newRole) || {
        id: 'r-custom',
        nom: newRole,
        description: '',
      },
    });

    setNewNom('');
    setNewPrenom('');
    setNewEmail('');
    setShowCreateModal(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      {/* Top Header (E12) */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#eef1f7] pb-5 sm:flex-row sm:items-center">
        <div>
          <span className="text-xs font-bold text-[#8c94a9] uppercase tracking-wider">
            Administration système (E12)
          </span>
          <h1 className="mt-1 text-2xl font-black text-[#171f33]">
            Gestion des utilisateurs
          </h1>
          <p className="mt-1 text-xs text-[#7e879c]">
            Administrez les comptes recruteurs, candidats et administrateurs de la plateforme.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-2xl bg-[#594be0] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#483ad3] transition w-fit"
        >
          <Plus size={16} /> Créer un compte (1.1)
        </button>
      </div>

      {/* Filter Row (E12) */}
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl bg-[#fafbfc] border border-[#e8ebf3] p-3 text-xs">
        <div className="flex flex-1 items-center gap-2 min-w-[200px] rounded-xl border border-[#dfe3ee] bg-white px-3 py-1.5">
          <Search size={14} className="text-[#9ea6bb]" />
          <input
            type="text"
            value={search}
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
                      onClick={() => onToggleStatus(u.id)}
                      title={u.statut === 'ACTIF' ? 'Suspendre (RM10)' : 'Activer'}
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
        ℹ️ Toute suspension ou suppression est journalisée. Un compte inactif ne peut pas se connecter (RM10).
      </div>

      {/* Modal Créer Utilisateur */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-extrabold text-[#1a2133]">
                Créer un compte recruteur ou administrateur
              </h3>
              <button onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold">Nom *</label>
                  <input
                    type="text"
                    required
                    value={newNom}
                    onChange={(e) => setNewNom(e.target.value)}
                    className="mt-1 w-full rounded-xl border p-2.5 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={newPrenom}
                    onChange={(e) => setNewPrenom(e.target.value)}
                    className="mt-1 w-full rounded-xl border p-2.5 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold">Adresse e-mail *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border p-2.5 outline-none"
                />
              </div>

              <div>
                <label className="font-bold">Rôle à attribuer *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as RoleName)}
                  className="mt-1 w-full rounded-xl border p-2.5 outline-none"
                >
                  <option value="RECRUTEUR">Recruteur</option>
                  <option value="ADMIN">Administrateur</option>
                  <option value="CANDIDAT">Candidat</option>
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border px-4 py-2 font-bold text-[#626a80]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#594be0] px-5 py-2 font-bold text-white"
                >
                  Créer le compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
