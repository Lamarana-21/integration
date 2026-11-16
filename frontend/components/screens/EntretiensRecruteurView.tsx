'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Mail,
  MapPin,
  Search,
  UserCheck2,
  Video,
  XCircle,
} from 'lucide-react';
import { Candidature, User, formatFrenchDate } from '@/lib/types';
import { resolveDepositedCv, downloadCandidateCvFile } from './CandidaturesOffreView';

interface EntretiensRecruteurViewProps {
  candidatures: Candidature[];
  currentUser?: User | null;
  onOpenDetail: (candidature: Candidature) => void;
  onUpdateInterviewStatus: (
    candId: string,
    statutEntretien: 'PROGRAMME' | 'PASSE' | 'NON_PASSE'
  ) => void;
}

export function EntretiensRecruteurView({
  candidatures,
  currentUser,
  onOpenDetail,
  onUpdateInterviewStatus,
}: EntretiensRecruteurViewProps) {
  const [filterStatut, setFilterStatut] = useState<'TOUS' | 'PROGRAMME' | 'PASSE' | 'NON_PASSE'>('TOUS');
  const [search, setSearch] = useState('');

  // Filtrer UNIQUEMENT les entretiens programmés par ce recruteur connecté (ou dont l'offre lui est rattachée)
  const interviewCands = useMemo(() => {
    const curUserId = currentUser?.id;
    return candidatures.filter((c) => {
      const hasInterview =
        c.statut === 'ENTRETIEN' ||
        Boolean(c.date_entretien) ||
        Boolean(c.statut_entretien);
      if (!hasInterview) return false;

      // Il ne doit voir que les entretiens qu'IL a programmés
      if (curUserId) {
        if (c.recruteur_entretien_id && c.recruteur_entretien_id === curUserId) return true;
        if (c.traitee_par_id && c.traitee_par_id === curUserId) return true;
        // Si non encore assigné spécifiquement à un autre recruteur mais auteur de l'offre
        if (!c.recruteur_entretien_id && !c.traitee_par_id && c.offre?.auteur_id === curUserId) return true;
        // S'il n'y a aucun recruteur assigné dans la graine, on l'affiche pour permettre la gestion
        if (!c.recruteur_entretien_id && !c.traitee_par_id && !c.offre?.auteur_id) return true;
        return false;
      }

      return true;
    });
  }, [candidatures, currentUser]);

  const filtered = useMemo(() => {
    return interviewCands.filter((c) => {
      const interviewStatus = c.statut_entretien || 'PROGRAMME';
      if (filterStatut !== 'TOUS' && interviewStatus !== filterStatut) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const prenom = (c.candidat?.prenom || c.candidat?.user?.prenom || '').toLowerCase();
        const nom = (c.candidat?.nom || c.candidat?.user?.nom || '').toLowerCase();
        const email = (c.candidat?.user?.email || '').toLowerCase();
        const titre = (c.offre?.titre || '').toLowerCase();
        if (!prenom.includes(q) && !nom.includes(q) && !email.includes(q) && !titre.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [interviewCands, filterStatut, search]);

  const countProgramme = interviewCands.filter(
    (c) => (c.statut_entretien || 'PROGRAMME') === 'PROGRAMME'
  ).length;
  const countPasse = interviewCands.filter((c) => c.statut_entretien === 'PASSE').length;
  const countNonPasse = interviewCands.filter((c) => c.statut_entretien === 'NON_PASSE').length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-2xs sm:flex-row sm:items-center">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#594be0]">
            Gestion des rendez-vous
          </div>
          <h1 className="mt-1 text-xl font-black text-[#0f172a] sm:text-2xl">
            Mes entretiens candidats ({interviewCands.length})
          </h1>
          <p className="mt-1 text-xs text-[#64748b]">
            Suivez les entretiens programmés avec les candidats et indiquez en 1 clic s'ils sont passés ou non passés.
          </p>
        </div>

        {/* Badges de synthèse */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#fed7aa] bg-[#fff7ed] px-3 py-1.5 text-xs font-bold text-[#c2410c]">
            <Clock size={13} /> {countProgramme} Programmé(s)
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1.5 text-xs font-bold text-[#166534]">
            <CheckCircle2 size={13} /> {countPasse} Passé(s)
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-3 py-1.5 text-xs font-bold text-[#991b1b]">
            <XCircle size={13} /> {countNonPasse} Non passé(s)
          </span>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-2xs sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par candidat, email ou poste..."
            className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] py-2 pl-9 pr-3 text-xs font-medium text-[#0f172a] outline-none focus:border-[#594be0] focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'TOUS', label: `Tous (${interviewCands.length})` },
              { id: 'PROGRAMME', label: `Programmés (${countProgramme})` },
              { id: 'PASSE', label: `Passés (${countPasse})` },
              { id: 'NON_PASSE', label: `Non passés (${countNonPasse})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatut(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                filterStatut === tab.id
                  ? 'bg-[#594be0] text-white'
                  : 'bg-[#f8fafc] text-[#475569] hover:bg-[#f1f5f9]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau des entretiens */}
      <div className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#e2e8f0] bg-[#f8fafc] text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
              <tr>
                <th className="px-5 py-3.5">Candidat</th>
                <th className="px-4 py-3.5">Poste visé</th>
                <th className="px-4 py-3.5">Date & Modalités</th>
                <th className="px-4 py-3.5">État de l'entretien</th>
                <th className="px-4 py-3.5">Indiquer le résultat</th>
                <th className="py-3.5 pl-4 pr-6 text-right">Dossier</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#f1f5f9]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs font-semibold text-[#64748b]">
                    Aucun entretien ne correspond à ce filtre.
                  </td>
                </tr>
              ) : (
                filtered.map((cand) => {
                  const candUser = cand.candidat?.user;
                  const prenom = cand.candidat?.prenom || candUser?.prenom || 'Candidat';
                  const nom = cand.candidat?.nom || candUser?.nom || '';
                  const resolvedCv = resolveDepositedCv(cand);
                  const currentInterviewState = cand.statut_entretien || 'PROGRAMME';

                  return (
                    <tr key={cand.id} className="hover:bg-[#f8fafc] transition">
                      {/* Candidat */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#eef2ff] text-xs font-black text-[#594be0]">
                            {prenom[0]}
                            {nom[0] || ''}
                          </div>
                          <div>
                            <div className="font-bold text-[#0f172a] text-sm">
                              {prenom} {nom}
                            </div>
                            <div className="text-[11px] text-[#64748b]">
                              {candUser?.email || 'email@example.com'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Poste */}
                      <td className="px-4 py-4">
                        <div className="font-bold text-[#1e293b]">
                          {cand.offre?.titre || 'Poste proposé'}
                        </div>
                        <div className="text-[11px] text-[#64748b]">
                          {cand.offre?.type_contrat || 'CDI'} • {cand.offre?.lieu || 'Tunisie'}
                        </div>
                      </td>

                      {/* Date & Modalité */}
                      <td className="px-4 py-4">
                        <div className="inline-flex items-center gap-1.5 font-extrabold text-[#0f172a] text-xs">
                          <Calendar size={13} className="text-[#594be0]" />
                          <span>{cand.date_entretien || 'À définir'}</span>
                        </div>
                        <div className="text-[11px] font-semibold mt-1">
                          {cand.type_entretien === 'VISIO' ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-[#eff6ff] text-[#2563eb] px-2 py-0.5 border border-[#bfdbfe]">
                              <Video size={11} /> Visio-conférence
                            </span>
                          ) : cand.type_entretien === 'TELEPHONE' ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-[#f8fafc] text-[#475569] px-2 py-0.5 border border-[#e2e8f0]">
                              Téléphonique
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-[#f8fafc] text-[#475569] px-2 py-0.5 border border-[#e2e8f0]">
                              Présentiel sur site
                            </span>
                          )}
                        </div>
                      </td>

                      {/* État actuel de l'entretien */}
                      <td className="px-4 py-4">
                        {currentInterviewState === 'PASSE' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] px-3 py-1 text-xs font-black text-[#047857] shadow-2xs">
                            <CheckCircle2 size={13} className="text-[#10b981]" /> Passé
                          </span>
                        ) : currentInterviewState === 'NON_PASSE' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fef2f2] border border-[#fecaca] px-3 py-1 text-xs font-black text-[#b91c1c] shadow-2xs">
                            <XCircle size={13} className="text-[#ef4444]" /> Non passé
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fffbeb] border border-[#fed7aa] px-3 py-1 text-xs font-black text-[#c2410c] shadow-2xs">
                            <Clock size={13} className="text-[#f59e0b]" /> Programmé
                          </span>
                        )}
                      </td>

                      {/* Actions 1-clic : Passé / Non passé / Re-programmer */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] w-fit shadow-2xs">
                          <button
                            type="button"
                            onClick={() => onUpdateInterviewStatus(cand.id, 'PASSE')}
                            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-black transition-all cursor-pointer ${
                              currentInterviewState === 'PASSE'
                                ? 'bg-[#10b981] text-white shadow-sm'
                                : 'text-[#065f46] hover:bg-[#ecfdf5]'
                            }`}
                            title="Indiquer que l'entretien a eu lieu"
                          >
                            <CheckCircle2 size={13} className={currentInterviewState === 'PASSE' ? 'text-white' : 'text-[#10b981]'} />
                            <span>Passé</span>
                          </button>

                          <div className="h-4 w-px bg-[#cbd5e1]" />

                          <button
                            type="button"
                            onClick={() => onUpdateInterviewStatus(cand.id, 'NON_PASSE')}
                            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-black transition-all cursor-pointer ${
                              currentInterviewState === 'NON_PASSE'
                                ? 'bg-[#ef4444] text-white shadow-sm'
                                : 'text-[#991b1b] hover:bg-[#fef2f2]'
                            }`}
                            title="Indiquer que le candidat ne s'est pas présenté"
                          >
                            <XCircle size={13} className={currentInterviewState === 'NON_PASSE' ? 'text-white' : 'text-[#ef4444]'} />
                            <span>Non passé</span>
                          </button>

                          {currentInterviewState !== 'PROGRAMME' && (
                            <>
                              <div className="h-4 w-px bg-[#cbd5e1]" />
                              <button
                                type="button"
                                onClick={() => onUpdateInterviewStatus(cand.id, 'PROGRAMME')}
                                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-[#64748b] hover:text-[#0f172a] hover:bg-[#e2e8f0] transition cursor-pointer"
                                title="Réinitialiser l'entretien à Programmé"
                              >
                                <Clock size={11} />
                                <span>Programmé</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Évaluation / Dossier */}
                      <td className="py-4 pl-4 pr-6 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenDetail(cand)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#594be0] to-[#483ad3] px-4 py-2 text-xs font-black text-white hover:opacity-95 shadow-xs transition-all cursor-pointer"
                        >
                          <span>Évaluer & Décider</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

