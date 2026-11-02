'use client';

import React, { useState } from 'react';
import {
  BriefcaseBusiness,
  Building2,
  Edit2,
  ExternalLink,
  Globe,
  MapPin,
  Plus,
  Users,
} from 'lucide-react';
import { Entreprise, Offre, User } from '@/lib/types';

interface FicheEntrepriseViewProps {
  entreprise: Entreprise;
  offres: Offre[];
  recruteurs: User[];
  onUpdateEntreprise: (updated: Partial<Entreprise>) => void;
  onSelectOffre: (offre: Offre) => void;
}

export function FicheEntrepriseView({
  entreprise,
  offres,
  recruteurs,
  onUpdateEntreprise,
  onSelectOffre,
}: FicheEntrepriseViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [nom, setNom] = useState(entreprise.nom);
  const [secteur, setSecteur] = useState(entreprise.secteur);
  const [ville, setVille] = useState(entreprise.ville);
  const [siteWeb, setSiteWeb] = useState(entreprise.site_web || '');
  const [description, setDescription] = useState(entreprise.description || '');

  const companyJobs = offres.filter((o) => o.entreprise_id === entreprise.id);
  const activeJobs = companyJobs.filter((o) => o.statut === 'PUBLIEE');
  const closedJobs = companyJobs.filter((o) => o.statut === 'CLOTUREE');

  const handleSave = () => {
    onUpdateEntreprise({
      nom,
      secteur,
      ville,
      site_web: siteWeb,
      description,
    });
    setIsEditing(false);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Top Banner (E11) */}
      <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-[#594be0] to-[#7f73f2] text-2xl font-black text-white shadow-md shadow-[#594be0]/20">
              {entreprise.nom[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-[#171f33]">{entreprise.nom}</h1>
                <span className="rounded-full bg-[#edf9f3] px-2.5 py-0.5 text-[10px] font-bold text-[#279257]">
                  {entreprise.statut}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#757e95]">
                <span>{entreprise.secteur}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <MapPin size={13} /> {entreprise.ville}, {entreprise.pays}
                </span>
                {entreprise.site_web && (
                  <>
                    <span>·</span>
                    <a
                      href={entreprise.site_web}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 font-bold text-[#594be0] hover:underline"
                    >
                      <Globe size={13} /> {entreprise.site_web} <ExternalLink size={11} />
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1.5 rounded-xl border border-[#dde1ed] bg-white px-4 py-2.5 text-xs font-bold text-[#4e566c] shadow-xs hover:bg-[#fafbfc]"
          >
            <Edit2 size={14} /> {isEditing ? 'Annuler' : 'Modifier la fiche (E11)'}
          </button>
        </div>

        {/* Edit Form */}
        {isEditing ? (
          <div className="mt-6 space-y-4 border-t border-[#f0f2f7] pt-6 text-xs">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="font-bold text-[#232a3e]">Nom de l'entreprise</label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-[#232a3e]">Secteur</label>
                <input
                  type="text"
                  value={secteur}
                  onChange={(e) => setSecteur(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="font-bold text-[#232a3e]">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                className="rounded-xl bg-[#594be0] px-5 py-2 font-bold text-white shadow-xs"
              >
                Enregistrer les modifications
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 border-t border-[#f0f2f7] pt-6 text-xs leading-6 text-[#525a6f]">
            {description || entreprise.description}
          </div>
        )}
      </div>

      {/* Recruteurs Rattachés (E11) */}
      <div className="mt-8 rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#f0f2f7] pb-4">
          <div className="flex items-center gap-2">
            <Users size={17} className="text-[#594be0]" />
            <h2 className="text-sm font-extrabold text-[#171f33]">
              Recruteurs rattachés à {entreprise.nom}
            </h2>
          </div>
          <span className="rounded-full bg-[#f0efff] px-2.5 py-0.5 text-xs font-bold text-[#594be0]">
            {recruteurs.length} recruteur(s)
          </span>
        </div>

        <div className="mt-4 divide-y divide-[#f2f4f9]">
          {recruteurs.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between py-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-full bg-[#eef0f7] text-xs font-bold text-[#4a5266]">
                  {r.prenom[0]}
                  {r.nom[0]}
                </div>
                <div>
                  <div className="font-bold text-[#1f273b]">
                    {r.prenom} {r.nom}{' '}
                    <span className="text-[#8790a4] font-normal">(Responsable RH)</span>
                  </div>
                  <div className="text-[11px] text-[#8790a4]">{r.email}</div>
                </div>
              </div>

              <button
                onClick={() => alert(`Retrait du recruteur ${r.prenom} ${r.nom}`)}
                className="rounded-lg border border-[#ffd5d5] px-2.5 py-1 font-bold text-[#cf3b3b] hover:bg-[#fff5f5]"
              >
                Retirer
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Offres de l'entreprise (E11) */}
      <div className="mt-8 rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#f0f2f7] pb-4">
          <div className="flex items-center gap-2">
            <BriefcaseBusiness size={17} className="text-[#594be0]" />
            <h2 className="text-sm font-extrabold text-[#171f33]">
              Offres d'emploi ({activeJobs.length} actives · {closedJobs.length} clôturées)
            </h2>
          </div>
        </div>

        <div className="mt-4 divide-y divide-[#f2f4f9]">
          {companyJobs.map((job) => (
            <div
              key={job.id}
              className="flex items-center justify-between py-3 text-xs"
            >
              <div>
                <div className="font-bold text-[#1f273b]">{job.titre}</div>
                <div className="text-[11px] text-[#868fa4]">
                  {job.type_contrat} · {job.lieu} · Statut : {job.statut}
                </div>
              </div>

              <button
                onClick={() => onSelectOffre(job)}
                className="rounded-xl bg-[#594be0] px-3.5 py-1.5 font-bold text-white shadow-xs hover:bg-[#483ad3]"
              >
                Voir l'offre
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
