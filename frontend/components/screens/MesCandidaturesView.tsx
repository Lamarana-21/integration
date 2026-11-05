'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Trash2,
  XCircle,
} from 'lucide-react';
import { ApplicationStatus, Candidature, Offre } from '@/lib/types';

interface MesCandidaturesViewProps {
  candidatures: Candidature[];
  onWithdrawApplication: (id: string) => void;
  onViewJobDetail: (offre: Offre) => void;
}

const STATUS_STEPS: ApplicationStatus[] = [
  'RECUE',
  'EN_EXAMEN',
  'PRESELECTIONNEE',
  'ENTRETIEN',
  'ACCEPTEE',
];

export function MesCandidaturesView({
  candidatures,
  onWithdrawApplication,
  onViewJobDetail,
}: MesCandidaturesViewProps) {
  const [filterStatut, setFilterStatut] = useState<string>('TOUS');
  const [selectedId, setSelectedId] = useState<string>(candidatures[0]?.id || '');

  const filtered = candidatures.filter((c) => {
    if (filterStatut !== 'TOUS' && c.statut !== filterStatut) return false;
    return true;
  });

  const selectedCandidature = candidatures.find((c) => c.id === selectedId) || filtered[0];

  const getStatusBadge = (statut: ApplicationStatus) => {
    switch (statut) {
      case 'RECUE':
        return <span className="rounded-full bg-[#f0efff] px-2.5 py-0.5 text-[11px] font-bold text-[#5c4ce0]">Reçue</span>;
      case 'EN_EXAMEN':
        return <span className="rounded-full bg-[#e8f1ff] px-2.5 py-0.5 text-[11px] font-bold text-[#3572d4]">En examen</span>;
      case 'PRESELECTIONNEE':
        return <span className="rounded-full bg-[#e6f7ef] px-2.5 py-0.5 text-[11px] font-bold text-[#2e9c63]">Présélectionnée</span>;
      case 'ENTRETIEN':
        return <span className="rounded-full bg-[#fff4de] px-2.5 py-0.5 text-[11px] font-bold text-[#c7881d]">Entretien</span>;
      case 'ACCEPTEE':
        return <span className="rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-[11px] font-bold text-[#15803d]">Acceptée</span>;
      case 'REFUSEE':
        return <span className="rounded-full bg-[#ffe8e8] px-2.5 py-0.5 text-[11px] font-bold text-[#c83939]">Refusée</span>;
      case 'RETIREE':
        return <span className="rounded-full bg-[#f1f3f8] px-2.5 py-0.5 text-[11px] font-bold text-[#7d879e]">Retirée</span>;
      default:
        return <span>{statut}</span>;
    }
  };

  const getStepIndex = (statut: ApplicationStatus) => {
    if (statut === 'REFUSEE' || statut === 'RETIREE') return -1;
    return STATUS_STEPS.indexOf(statut);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black text-[#171e31] sm:text-3xl">
            Mes candidatures
          </h1>
          <p className="mt-1 text-xs text-[#7c859c]">
            Suivez en temps réel l'avancement de vos dossiers et consultez les retours des recruteurs.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-[#666f85]">Statut :</span>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="rounded-xl border border-[#dfe3ed] bg-white px-3 py-1.5 text-xs font-bold text-[#1f2638] outline-none"
          >
            <option value="TOUS">Tous les statuts</option>
            <option value="RECUE">Reçue</option>
            <option value="EN_EXAMEN">En examen</option>
            <option value="PRESELECTIONNEE">Présélectionnée</option>
            <option value="ENTRETIEN">Entretien</option>
            <option value="ACCEPTEE">Acceptée</option>
            <option value="REFUSEE">Refusée</option>
            <option value="RETIREE">Retirée</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-[#d8dce8] bg-white p-12 text-center">
          <FileText size={38} className="mx-auto text-[#adb5cb]" />
          <h3 className="mt-3 text-base font-bold text-[#192135]">
            Aucune candidature trouvée
          </h3>
          <p className="mt-1 text-xs text-[#7d869c]">
            Vous n'avez pas encore postulé à une offre correspondant à ce filtre.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Applications Table (E5) */}
          <div className="overflow-hidden rounded-3xl border border-[#e8ebf3] bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#eef1f7] bg-[#fafbfc] text-[11px] font-bold text-[#8d96ab] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Offre</th>
                  <th className="px-6 py-4">Entreprise</th>
                  <th className="px-6 py-4">Envoyée le</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f4f9]">
                {filtered.map((cand) => {
                  const isSelected = selectedCandidature?.id === cand.id;
                  return (
                    <tr
                      key={cand.id}
                      onClick={() => setSelectedId(cand.id)}
                      className={`cursor-pointer transition ${
                        isSelected ? 'bg-[#f7f6ff]' : 'hover:bg-[#fafbfc]'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-extrabold text-[#171f33] text-sm">
                          {cand.offre?.titre || 'Poste proposé'}
                        </div>
                        <div className="text-[11px] text-[#7d869d]">
                          {cand.offre?.type_contrat ? `Contrat ${cand.offre.type_contrat}` : 'Offre'} {cand.offre?.lieu ? `· ${cand.offre.lieu}` : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-[#3b4356]">
                        {cand.offre?.entreprise?.nom || 'Entreprise partenaire'}
                      </td>
                      <td className="px-6 py-4 text-[#6e778d]">
                        {cand.created_at ? (cand.created_at.includes('T') ? cand.created_at.split('T')[0] : cand.created_at) : 'À l’instant'}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(cand.statut)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(cand.id);
                          }}
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                            isSelected
                              ? 'bg-[#594be0] text-white'
                              : 'bg-[#f1f3f8] text-[#555d72] hover:bg-[#e4e7f0]'
                          }`}
                        >
                          Détails
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Stepper Card for Selected Application (E5 bottom section) */}
          {selectedCandidature && (
            <div className="rounded-3xl border border-[#e4e7f2] bg-white p-6 sm:p-7 shadow-xs">
              <div className="flex flex-col justify-between gap-4 border-b border-[#f0f2f7] pb-5 sm:flex-row sm:items-center">
                <div>
                  <div className="text-xs font-bold text-[#8c95aa] uppercase tracking-wider">
                    Suivi de candidature sélectionnée
                  </div>
                  <h3 className="mt-1 text-lg font-black text-[#171f33]">
                    {selectedCandidature.offre?.titre || 'Poste postulé'} — {selectedCandidature.offre?.entreprise?.nom || 'Entreprise partenaire'}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {selectedCandidature.offre && (
                    <button
                      onClick={() => onViewJobDetail(selectedCandidature.offre!)}
                      className="flex items-center gap-1.5 rounded-xl border border-[#dde1ed] px-3.5 py-2 text-xs font-bold text-[#444d62] hover:bg-[#fafbfc]"
                    >
                      <Eye size={14} /> Voir l'offre
                    </button>
                  )}

                  {/* RM5 : Retrait autorisé tant que non acceptée ni refusée */}
                  {selectedCandidature.statut !== 'ACCEPTEE' &&
                    selectedCandidature.statut !== 'REFUSEE' &&
                    selectedCandidature.statut !== 'RETIREE' && (
                      <button
                        onClick={() => onWithdrawApplication(selectedCandidature.id)}
                        className="flex items-center gap-1.5 rounded-xl border border-[#ffd5d5] bg-[#fff6f6] px-3.5 py-2 text-xs font-bold text-[#cf3b3b] hover:bg-[#ffebeb]"
                      >
                        <Trash2 size={14} /> Retirer la candidature
                      </button>
                    )}
                </div>
              </div>

              {/* Progress Stepper Visualizer */}
              <div className="mt-6">
                <div className="text-xs font-bold text-[#353d52]">
                  Progression du recrutement :
                </div>

                {selectedCandidature.statut === 'REFUSEE' ? (
                  <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#ffcfcf] bg-[#fff5f5] p-4 text-xs font-bold text-[#cb3434]">
                    <XCircle size={18} />
                    Candidature non retenue pour ce poste. Vous pouvez postuler à d'autres opportunités.
                  </div>
                ) : selectedCandidature.statut === 'RETIREE' ? (
                  <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#e5e8f0] bg-[#f9fafc] p-4 text-xs font-bold text-[#747e94]">
                    <AlertCircle size={18} />
                    Vous avez retiré cette candidature.
                  </div>
                ) : (
                  <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    {[
                      { key: 'RECUE', label: '1. Reçue' },
                      { key: 'EN_EXAMEN', label: '2. En examen' },
                      { key: 'PRESELECTIONNEE', label: '3. Présélectionnée' },
                      { key: 'ENTRETIEN', label: '4. Entretien' },
                      { key: 'ACCEPTEE', label: '5. Décision finale' },
                    ].map((step, idx) => {
                      const currentIdx = getStepIndex(selectedCandidature.statut);
                      const isPast = idx < currentIdx;
                      const isCurrent = idx === currentIdx;

                      return (
                        <div
                          key={step.key}
                          className="flex flex-1 items-center gap-3 w-full sm:w-auto"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                                isPast
                                  ? 'bg-[#2b965f] text-white'
                                  : isCurrent
                                  ? 'bg-[#594be0] text-white ring-4 ring-[#efedff]'
                                  : 'bg-[#eeeff5] text-[#939cae]'
                              }`}
                            >
                              {isPast ? '✓' : idx + 1}
                            </div>
                            <span
                              className={`text-xs font-bold ${
                                isCurrent
                                  ? 'text-[#594be0]'
                                  : isPast
                                  ? 'text-[#2b965f]'
                                  : 'text-[#8c95aa]'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>

                          {idx < 4 && (
                            <div
                              className={`hidden sm:block flex-1 h-0.5 mx-2 ${
                                isPast ? 'bg-[#2b965f]' : 'bg-[#e7eaf2]'
                              }`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recruiter feedback message if present */}
              {selectedCandidature.commentaire_recruteur && (
                <div className="mt-6 rounded-2xl bg-[#f8f9fd] border border-[#e9ebf4] p-4 text-xs text-[#525a70]">
                  <span className="font-bold text-[#1f2638]">
                    Message du recruteur :{' '}
                  </span>
                  {selectedCandidature.commentaire_recruteur}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
