'use client';

import React, { useState } from 'react';
import {
  BriefcaseBusiness,
  Building2,
  Check,
  Edit2,
  Globe,
  Plus,
  Power,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { Entreprise } from '@/lib/types';

interface AdminEntreprisesViewProps {
  entreprises: Entreprise[];
  onToggleStatus: (id: string) => void;
  onDeleteEntreprise: (id: string) => void;
  onAddEntreprise: (data: Partial<Entreprise>) => void;
  onViewCompany: (entreprise: Entreprise) => void;
}

export function AdminEntreprisesView({
  entreprises,
  onToggleStatus,
  onDeleteEntreprise,
  onAddEntreprise,
  onViewCompany,
}: AdminEntreprisesViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [nom, setNom] = useState('');
  const [secteur, setSecteur] = useState('');
  const [ville, setVille] = useState('Tunis');
  const [siteWeb, setSiteWeb] = useState('');
  const [description, setDescription] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !secteur) return;

    onAddEntreprise({
      nom,
      secteur,
      ville,
      pays: 'Tunisie',
      site_web: siteWeb,
      description,
      statut: 'ACTIVE',
    });

    setNom('');
    setSecteur('');
    setShowAddModal(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      {/* Top Header (E14) */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#eef1f7] pb-5 sm:flex-row sm:items-center">
        <div>
          <span className="text-xs font-bold text-[#8c94a9] uppercase tracking-wider">
            Supervision du contenu (E14)
          </span>
          <h1 className="mt-1 text-2xl font-black text-[#171f33]">
            Entreprises et offres
          </h1>
          <p className="mt-1 text-xs text-[#7e879c]">
            Supervisez les organisations inscrites et vérifiez la conformité des offres publiées.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-2xl bg-[#594be0] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#483ad3] transition w-fit"
        >
          <Plus size={16} /> Ajouter une entreprise (4.1)
        </button>
      </div>

      {/* Companies Table (E14) */}
      <div className="mt-6 overflow-hidden rounded-3xl border border-[#e8ebf3] bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-[#eef1f7] bg-[#fafbfc] text-[11px] font-bold text-[#8d96ab] uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Entreprise</th>
              <th className="px-6 py-4">Secteur</th>
              <th className="px-6 py-4">Recruteurs</th>
              <th className="px-6 py-4">Offres actives</th>
              <th className="px-6 py-4">Statut</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2f4f9]">
            {entreprises.map((ent) => (
              <tr key={ent.id} className="hover:bg-[#fafbfc] transition">
                <td className="px-6 py-4">
                  <div className="font-extrabold text-[#171f33] text-sm flex items-center gap-2.5">
                    <div className="grid size-8 place-items-center rounded-xl bg-[#eeeaff] text-xs font-black text-[#594be0]">
                      {ent.nom[0]}
                    </div>
                    <div>
                      <div>{ent.nom}</div>
                      <div className="text-[11px] text-[#868fa4] font-normal">
                        {ent.ville}, {ent.pays}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-semibold text-[#4e566c]">
                  {ent.secteur}
                </td>
                <td className="px-6 py-4 font-bold text-[#1e2539]">
                  {ent.recruteurs_count || 1}
                </td>
                <td className="px-6 py-4 font-bold text-[#594be0]">
                  {ent.offres_count || 0}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      ent.statut === 'ACTIVE'
                        ? 'bg-[#edf9f3] text-[#248e56]'
                        : 'bg-[#ffe8e8] text-[#cf3b3b]'
                    }`}
                  >
                    {ent.statut === 'ACTIVE' ? 'Active' : 'Désactivée'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      onClick={() => onViewCompany(ent)}
                      className="rounded-lg border border-[#dde0ec] px-2.5 py-1 text-xs font-bold text-[#4d556b] hover:bg-white"
                    >
                      Voir
                    </button>
                    <button
                      onClick={() => onToggleStatus(ent.id)}
                      title={ent.statut === 'ACTIVE' ? 'Désactiver' : 'Activer'}
                      className={`rounded-lg p-1.5 font-bold transition ${
                        ent.statut === 'ACTIVE'
                          ? 'text-[#cf3b3b] hover:bg-[#ffebeb]'
                          : 'text-[#248e56] hover:bg-[#edf9f3]'
                      }`}
                    >
                      <Power size={14} />
                    </button>
                    <button
                      onClick={() => onDeleteEntreprise(ent.id)}
                      title="Supprimer"
                      className="rounded-lg p-1.5 text-[#98a1b6] hover:text-[#cf3b3b]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Company Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-extrabold text-[#1a2133]">
                Ajouter une nouvelle entreprise (4.1)
              </h3>
              <button onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdd} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[#20273a]">Nom de l'entreprise *</label>
                <input
                  type="text"
                  required
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Société Delta"
                  className="mt-1 w-full rounded-xl border p-2.5 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#20273a]">Secteur d'activité *</label>
                <input
                  type="text"
                  required
                  value={secteur}
                  onChange={(e) => setSecteur(e.target.value)}
                  placeholder="Technologies, Finance, etc."
                  className="mt-1 w-full rounded-xl border p-2.5 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#20273a]">Ville *</label>
                <input
                  type="text"
                  required
                  value={ville}
                  onChange={(e) => setVille(e.target.value)}
                  placeholder="Tunis, Sfax, Sousse..."
                  className="mt-1 w-full rounded-xl border p-2.5 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#20273a]">Site Web</label>
                <input
                  type="text"
                  value={siteWeb}
                  onChange={(e) => setSiteWeb(e.target.value)}
                  placeholder="https://delta.example"
                  className="mt-1 w-full rounded-xl border p-2.5 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#20273a]">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Courte présentation..."
                  className="mt-1 w-full rounded-xl border p-2.5 outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border px-4 py-2 font-bold text-[#626a80]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#594be0] px-5 py-2 font-bold text-white shadow-xs"
                >
                  Ajouter l'entreprise
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
