'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileCheck,
  FileText,
  MessageSquare,
  Trash2,
  Video,
  X,
  XCircle,
} from 'lucide-react';
import { ApplicationStatus, Candidature, Offre, formatFrenchDate } from '@/lib/types';

interface MesCandidaturesViewProps {
  candidatures: Candidature[];
  onWithdrawApplication: (id: string) => void;
  onViewJobDetail: (offre: Offre) => void;
  onNavigateScreen?: (screen: string) => void;
}

export function MesCandidaturesView({
  candidatures,
  onWithdrawApplication,
  onViewJobDetail,
  onNavigateScreen,
}: MesCandidaturesViewProps) {
  const [filterStatut, setFilterStatut] = useState<string>('TOUS');
  const [selectedId, setSelectedId] = useState<string>(candidatures[0]?.id || '');

  // Modale pour le bouton "Détails"
  const [detailModalCand, setDetailModalCand] = useState<Candidature | null>(null);

  // Modale pour le bouton "Voir mes résultats"
  const [resultModalCand, setResultModalCand] = useState<Candidature | null>(null);
  const [decisionTick, setDecisionTick] = useState(0);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'talenta_decisions_v2') {
        setDecisionTick((t) => t + 1);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Synchronisation directe avec les décisions enregistrées par les recruteurs
  const syncedCandidatures = useMemo(() => {
    if (typeof window === 'undefined') return candidatures;
    try {
      const raw = localStorage.getItem('talenta_decisions_v2');
      if (!raw) return candidatures;
      const decMap: Record<string, Partial<Candidature>> = JSON.parse(raw);
      return candidatures.map((c) => {
        const userId = c.candidat?.utilisateur_id || c.candidat?.user?.id || '';
        const email = (c.candidat?.user?.email || '').toLowerCase().trim();
        const fullName = `${c.candidat?.prenom || c.candidat?.user?.prenom || ''}_${c.candidat?.nom || c.candidat?.user?.nom || ''}`
          .toLowerCase()
          .trim();
        const offreTitle = (c.offre?.titre || '').toLowerCase().trim();
        const match =
          decMap[c.id] ||
          decMap[`${c.candidat_id}_${c.offre_id}`] ||
          (userId ? decMap[`${userId}_${c.offre_id}`] : undefined) ||
          (email ? decMap[`${email}_${c.offre_id}`] : undefined) ||
          (email && offreTitle ? decMap[`${email}_${offreTitle}`] : undefined) ||
          (fullName && c.offre_id ? decMap[`${fullName}_${c.offre_id}`] : undefined) ||
          (fullName && offreTitle ? decMap[`${fullName}_${offreTitle}`] : undefined);
        if (!match) return c;
        return {
          ...c,
          statut: (match.statut as ApplicationStatus) || c.statut,
          etapes_validees: match.etapes_validees || c.etapes_validees,
          etape_avant_decision: match.etape_avant_decision || c.etape_avant_decision,
          commentaire_recruteur:
            match.commentaire_recruteur !== undefined
              ? match.commentaire_recruteur
              : c.commentaire_recruteur,
          date_entretien: match.date_entretien || c.date_entretien,
          type_entretien: match.type_entretien || c.type_entretien,
          lien_ou_lieu_entretien: match.lien_ou_lieu_entretien || c.lien_ou_lieu_entretien,
          updated_at: match.updated_at || c.updated_at,
        };
      });
    } catch {
      return candidatures;
    }
  }, [candidatures, decisionTick]);

  const filtered = syncedCandidatures.filter((c) => {
    if (filterStatut !== 'TOUS' && c.statut !== filterStatut) return false;
    return true;
  });

  const selectedCandidature =
    syncedCandidatures.find((c) => c.id === selectedId) || filtered[0] || syncedCandidatures[0];

  const getStatusBadge = (statut: ApplicationStatus) => {
    switch (statut) {
      case 'RECUE':
        return (
          <span className="rounded-full bg-[#f0efff] px-2.5 py-0.5 text-[11px] font-bold text-[#5c4ce0]">
            Reçue
          </span>
        );
      case 'EN_EXAMEN':
        return (
          <span className="rounded-full bg-[#e8f1ff] px-2.5 py-0.5 text-[11px] font-bold text-[#3572d4]">
            En examen
          </span>
        );
      case 'PRESELECTIONNEE':
        return (
          <span className="rounded-full bg-[#e6f7ef] px-2.5 py-0.5 text-[11px] font-bold text-[#2e9c63]">
            Présélectionnée
          </span>
        );
      case 'ENTRETIEN':
        return (
          <span className="rounded-full bg-[#fff4de] px-2.5 py-0.5 text-[11px] font-bold text-[#c7881d]">
            Entretien
          </span>
        );
      case 'ACCEPTEE':
        return (
          <span className="rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-[11px] font-bold text-[#15803d]">
            Acceptée
          </span>
        );
      case 'REFUSEE':
        return (
          <span className="rounded-full bg-[#ffe8e8] px-2.5 py-0.5 text-[11px] font-bold text-[#c83939]">
            Refusée
          </span>
        );
      case 'RETIREE':
        return (
          <span className="rounded-full bg-[#f1f3f8] px-2.5 py-0.5 text-[11px] font-bold text-[#7d879e]">
            Retirée
          </span>
        );
      default:
        return <span>{statut}</span>;
    }
  };

  // Progression sur 5 étapes avec flèches d'évolution toujours visibles :
  // 0: Reçue -> 1: En examen -> 2: Présélectionnée -> 3: Entretien -> 4: Décision finale / Résultats
  const getStepIndex = (statut: ApplicationStatus) => {
    switch (statut) {
      case 'RECUE':
        return 0;
      case 'EN_EXAMEN':
        return 1;
      case 'PRESELECTIONNEE':
        return 2;
      case 'ENTRETIEN':
        return 3;
      case 'ACCEPTEE':
      case 'REFUSEE':
        return 4;
      default:
        return -1;
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* En-tête simple et propre (sans statistiques) */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black text-[#171e31] sm:text-3xl">
            Mes candidatures
          </h1>
          <p className="mt-1 text-xs text-[#7c859c]">
            Suivez en temps réel l'avancement de vos dossiers et consultez les décisions des entreprises.
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
          {/* Tableau épuré des candidatures */}
          <div className="overflow-hidden rounded-3xl border border-[#e8ebf3] bg-white shadow-xs">
            <div className="overflow-x-auto">
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
                    const hasDecision = cand.statut === 'ACCEPTEE' || cand.statut === 'REFUSEE';
                    const hasInterview =
                      cand.statut === 'ENTRETIEN' || Boolean(cand.date_entretien);

                    return (
                      <tr
                        key={cand.id}
                        onClick={() => setSelectedId(cand.id)}
                        className={`cursor-pointer transition ${isSelected ? 'bg-[#f7f6ff]' : 'hover:bg-[#fafbfc]'
                          }`}
                      >
                        <td className="px-6 py-4">
                          <div className="font-extrabold text-[#171f33] text-sm">
                            {cand.offre?.titre || 'Poste proposé'}
                          </div>
                          <div className="text-[11px] text-[#7d869d]">
                            {cand.offre?.type_contrat
                              ? `Contrat ${cand.offre.type_contrat}`
                              : 'Offre'}{' '}
                            {cand.offre?.lieu ? `· ${cand.offre.lieu}` : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-[#3b4356]">
                          {cand.offre?.entreprise?.nom || 'Entreprise partenaire'}
                        </td>
                        <td className="px-6 py-4 text-[#6e778d]">
                          {cand.created_at
                            ? formatFrenchDate(
                              cand.created_at.includes('T')
                                ? cand.created_at.split('T')[0]
                                : cand.created_at
                            )
                            : 'Récemment'}
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(cand.statut)}</td>
                        <td className="px-6 py-4 text-right">
                          <div
                            className="flex flex-wrap items-center justify-end gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {hasInterview && onNavigateScreen && (
                              <button
                                type="button"
                                onClick={() => onNavigateScreen('E_ENTRETIENS')}
                                className="inline-flex items-center gap-1 rounded-lg bg-[#fff4de] border border-[#fde68a] px-2.5 py-1 text-xs font-bold text-[#b45309] hover:bg-[#fef3c7] transition"
                              >
                                <Calendar size={12} /> Entretien
                              </button>
                            )}

                            {hasDecision && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedId(cand.id);
                                  setResultModalCand(cand);
                                }}
                                className="inline-flex items-center gap-1 rounded-lg bg-[#594be0] px-2.5 py-1 text-xs font-bold text-white hover:bg-[#483ad3] transition"
                              >
                                <Award size={12} /> Voir mes résultats
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedId(cand.id);
                                setDetailModalCand(cand);
                              }}
                              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${isSelected
                                  ? 'bg-[#594be0] text-white'
                                  : 'bg-[#f1f3f8] text-[#555d72] hover:bg-[#e4e7f0]'
                                }`}
                            >
                              Détails
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Carte de suivi avec les flèches d'évolution (toujours affichée même en cas de décision) */}
          {selectedCandidature && (() => {
            const currentIdx = getStepIndex(selectedCandidature.statut);
            const hasDecision =
              selectedCandidature.statut === 'ACCEPTEE' ||
              selectedCandidature.statut === 'REFUSEE';
            const isAccepted = selectedCandidature.statut === 'ACCEPTEE';
            const isRejected = selectedCandidature.statut === 'REFUSEE';
            const hasInterview =
              selectedCandidature.statut === 'ENTRETIEN' ||
              Boolean(selectedCandidature.date_entretien);
            const isOfferDeleted = Boolean(
              selectedCandidature.offre_supprimee ||
              selectedCandidature.offre?.supprimee ||
              selectedCandidature.offre?.statut === 'ARCHIVEE'
            );

            const steps = [
              { key: 'RECUE', label: '1. Reçue' },
              { key: 'EN_EXAMEN', label: '2. En examen' },
              { key: 'PRESELECTIONNEE', label: '3. Présélectionnée' },
              { key: 'ENTRETIEN', label: '4. Entretien' },
              {
                key: 'DECISION',
                label: isAccepted
                  ? '5. Décision : Retenue'
                  : isRejected
                    ? '5. Décision : Non retenue'
                    : '5. Décision finale / Résultats',
              },
            ];

            return (
              <div className="rounded-3xl border border-[#e4e7f2] bg-white p-6 sm:p-7 shadow-xs">
                {/* ALERTE OFFRE SUPPRIMÉE PAR L'ENTREPRISE MENTIONNÉE EN GRAND */}
                {isOfferDeleted && (
                  <div className="mb-6 rounded-2xl border-2 border-[#ef4444] bg-[#fef2f2] p-4 text-[#991b1b] shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <div className="text-sm font-black uppercase tracking-wide text-[#b91c1c]">
                          Cette offre d'emploi a été supprimée par l'entreprise
                        </div>
                        <div className="text-xs text-[#7f1d1d] mt-0.5">
                          L'entreprise a retiré cette annonce. Votre historique de candidature ci-dessous reste conservé pour votre suivi personnel.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col justify-between gap-4 border-b border-[#f0f2f7] pb-5 sm:flex-row sm:items-center">
                  <div>
                    <div className="text-xs font-bold text-[#8c95aa] uppercase tracking-wider">
                      Suivi de candidature sélectionnée
                    </div>
                    <h3 className="mt-1 text-lg font-black text-[#171f33]">
                      {selectedCandidature.offre?.titre || 'Poste postulé'} —{' '}
                      {selectedCandidature.offre?.entreprise?.nom || 'Entreprise partenaire'}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDetailModalCand(selectedCandidature)}
                      className="flex items-center gap-1.5 rounded-xl border border-[#dde1ed] px-3.5 py-2 text-xs font-bold text-[#444d62] hover:bg-[#fafbfc]"
                    >
                      <FileText size={14} /> Détails
                    </button>

                    {selectedCandidature.offre && (
                      <button
                        type="button"
                        onClick={() => onViewJobDetail(selectedCandidature.offre!)}
                        className="flex items-center gap-1.5 rounded-xl border border-[#dde1ed] px-3.5 py-2 text-xs font-bold text-[#444d62] hover:bg-[#fafbfc]"
                      >
                        <Eye size={14} /> Voir l'offre
                      </button>
                    )}

                    {hasInterview && onNavigateScreen && (
                      <button
                        type="button"
                        onClick={() => onNavigateScreen('E_ENTRETIENS')}
                        className="flex items-center gap-1.5 rounded-xl bg-[#fff4de] border border-[#fcd34d] px-3.5 py-2 text-xs font-bold text-[#b45309] hover:bg-[#fef3c7]"
                      >
                        <Calendar size={14} /> Voir mon entretien
                      </button>
                    )}

                    {hasDecision && (
                      <button
                        type="button"
                        onClick={() => setResultModalCand(selectedCandidature)}
                        className="flex items-center gap-1.5 rounded-xl bg-[#594be0] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#483ad3]"
                      >
                        <Award size={14} /> Voir mes résultats
                      </button>
                    )}

                    {selectedCandidature.statut !== 'ACCEPTEE' &&
                      selectedCandidature.statut !== 'REFUSEE' &&
                      selectedCandidature.statut !== 'RETIREE' && (
                        <button
                          type="button"
                          onClick={() => onWithdrawApplication(selectedCandidature.id)}
                          className="flex items-center gap-1.5 rounded-xl border border-[#ffd5d5] bg-[#fff6f6] px-3.5 py-2 text-xs font-bold text-[#cf3b3b] hover:bg-[#ffebeb]"
                        >
                          <Trash2 size={14} /> Retirer la candidature
                        </button>
                      )}
                  </div>
                </div>

                {/* Progression avec flèches d'évolution */}
                <div className="mt-6">
                  <div className="text-xs font-bold text-[#353d52]">
                    Progression du recrutement :
                  </div>

                  {selectedCandidature.statut === 'RETIREE' ? (
                    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#e5e8f0] bg-[#f9fafc] p-4 text-xs font-bold text-[#747e94]">
                      <AlertCircle size={18} />
                      Vous avez retiré cette candidature.
                    </div>
                  ) : (
                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                      {steps.map((step, idx) => {
                        const validatedList = selectedCandidature.etapes_validees || [];
                        const beforeDec = selectedCandidature.etape_avant_decision;

                        let isStepValidated = false;
                        let isStepSkippedOnReject = false;

                        if (isAccepted) {
                          // Si le candidat est retenu, toutes les étapes préalables (1 à 4) sont validées
                          isStepValidated = idx < 4;
                        } else if (isRejected) {
                          // Si refusé : les étapes 1 (Reçue) et 2 (En examen) ont bien eu lieu
                          if (idx === 0 || idx === 1) {
                            isStepValidated = true;
                          } else if (idx === 2) {
                            // Étape 3 (Présélectionnée) validée uniquement si atteinte avant le refus
                            isStepValidated =
                              validatedList.includes('PRESELECTIONNEE') ||
                              validatedList.includes('ENTRETIEN') ||
                              beforeDec === 'PRESELECTIONNEE' ||
                              beforeDec === 'ENTRETIEN' ||
                              Boolean(selectedCandidature.date_entretien);
                            isStepSkippedOnReject = !isStepValidated;
                          } else if (idx === 3) {
                            // Étape 4 (Entretien) validée uniquement si entretien programmé/effectué avant le refus
                            isStepValidated =
                              validatedList.includes('ENTRETIEN') ||
                              beforeDec === 'ENTRETIEN' ||
                              Boolean(selectedCandidature.date_entretien);
                            isStepSkippedOnReject = !isStepValidated;
                          }
                        } else {
                          isStepValidated = idx < currentIdx;
                        }

                        const isCurrent = !hasDecision && idx === currentIdx;
                        const isFinalRejected = idx === 4 && isRejected;
                        const isFinalAccepted = idx === 4 && isAccepted;

                        return (
                          <div
                            key={step.key}
                            className="flex flex-1 items-center gap-2 w-full sm:w-auto"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                                  isStepValidated || isFinalAccepted
                                    ? 'bg-[#2b965f] text-white'
                                    : isFinalRejected
                                      ? 'bg-[#c83939] text-white ring-4 ring-[#ffe8e8]'
                                      : isCurrent
                                        ? 'bg-[#594be0] text-white ring-4 ring-[#efedff]'
                                        : 'bg-[#eeeff5] text-[#939cae]'
                                  }`}
                              >
                                {isStepValidated || isFinalAccepted
                                  ? '✓'
                                  : isFinalRejected
                                  ? '✕'
                                  : isStepSkippedOnReject
                                  ? '—'
                                  : idx + 1}
                              </div>
                              <div>
                                <span
                                  className={`text-xs font-bold whitespace-nowrap block ${
                                    isFinalAccepted
                                      ? 'text-[#2b965f]'
                                      : isFinalRejected
                                      ? 'text-[#c83939]'
                                      : isCurrent
                                      ? 'text-[#594be0]'
                                      : isStepValidated
                                      ? 'text-[#2b965f]'
                                      : 'text-[#8c95aa]'
                                  }`}
                                >
                                  {step.label}
                                </span>
                                {isStepSkippedOnReject && (
                                  <span className="text-[10px] font-medium text-[#94a3b8] block">
                                    Non franchie
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Flèche d'évolution entre chaque étape */}
                            {idx < 4 && (
                              <div className="hidden sm:flex flex-1 items-center mx-2">
                                <div
                                  className={`h-0.5 flex-1 ${
                                    isStepValidated ? 'bg-[#2b965f]' : 'bg-[#e2e6f0]'
                                  }`}
                                />
                                <ChevronRight
                                  size={15}
                                  className={`-ml-1 shrink-0 ${
                                    isStepValidated ? 'text-[#2b965f]' : 'text-[#c5ccd9]'
                                  }`}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Bandeau d'action rapide sous le suivi selon l'état */}
                {hasDecision && (
                  <div
                    className={`mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-4 text-xs ${isAccepted
                        ? 'border-[#bbf7d0] bg-[#f0fdf4] text-[#14532d]'
                        : 'border-[#fecaca] bg-[#fff5f5] text-[#991b1b]'
                      }`}
                  >
                    <div className="flex items-center gap-3 font-bold">
                      {isAccepted ? (
                        <CheckCircle2 size={18} className="shrink-0 text-[#16a34a]" />
                      ) : (
                        <XCircle size={18} className="shrink-0 text-[#dc2626]" />
                      )}
                      <span>
                        {isAccepted
                          ? 'Félicitations ! Votre candidature a été retenue par l’entreprise.'
                          : 'Une décision finale a été rendue concernant votre candidature.'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setResultModalCand(selectedCandidature)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#171f33] px-4 py-2 text-xs font-bold text-white hover:bg-[#2a3450] transition"
                    >
                      <Award size={14} /> Voir mes résultats
                    </button>
                  </div>
                )}

                {hasInterview && onNavigateScreen && (
                  <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#fde68a] bg-[#fffbeb] p-4 text-xs text-[#92400e]">
                    <div className="flex items-center gap-3 font-bold">
                      <Calendar size={18} className="shrink-0 text-[#d97706]" />
                      <span>
                        Un entretien est programmé pour cette candidature{' '}
                        {selectedCandidature.date_entretien
                          ? `(${selectedCandidature.date_entretien})`
                          : ''}
                        .
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigateScreen('E_ENTRETIENS')}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#d97706] px-4 py-2 text-xs font-bold text-white hover:bg-[#b45309] transition"
                    >
                      <span>Accéder à la page Entretiens</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* MODALE "DÉTAILS" : INFORMATIONS DE LA CANDIDATURE ET DE L'OFFRE */}
      {detailModalCand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative my-6 w-full max-w-xl rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-[#f0f2f7] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#594be0]">Détails de la candidature</span>
                  {getStatusBadge(detailModalCand.statut)}
                </div>
                <h2 className="mt-1 text-lg font-black text-[#171f33]">
                  {detailModalCand.offre?.titre || "Offre d'emploi"}
                </h2>
                <p className="text-xs text-[#6b748b]">
                  {detailModalCand.offre?.entreprise?.nom || 'Entreprise partenaire'} ·{' '}
                  {detailModalCand.offre?.lieu || 'Tunisie'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDetailModalCand(null)}
                className="grid size-8 place-items-center rounded-full bg-[#f3f5fa] text-[#6d768d] hover:bg-[#e5e9f2]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-2xl bg-[#f8f9fd] border border-[#edf0f7] p-4 text-xs">
              <div>
                <div className="text-[10px] font-bold text-[#848ea4] uppercase">Contrat</div>
                <div className="mt-0.5 font-bold text-[#171f33]">
                  {detailModalCand.offre?.type_contrat || 'CDI'}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-[#848ea4] uppercase">Rémunération</div>
                <div className="mt-0.5 font-bold text-[#171f33]">
                  {detailModalCand.offre?.salaire || 'Selon profil'}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-[#848ea4] uppercase">Envoyée le</div>
                <div className="mt-0.5 font-bold text-[#171f33]">
                  {formatFrenchDate(detailModalCand.created_at?.split('T')[0])}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#e7eaf2] bg-white p-4 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-xl bg-[#f0efff] text-[#594be0]">
                  <FileCheck size={16} />
                </div>
                <div>
                  <div className="font-bold text-[#171f33]">
                    CV transmis : {detailModalCand.cv?.nom_fichier || 'CV_Candidat.pdf'}
                  </div>
                  <div className="text-[11px] text-[#7c859c]">
                    {detailModalCand.cv?.source_type === 'DYNAMIQUE' || detailModalCand.cv?.est_genere
                      ? 'CV Dynamique de la plateforme'
                      : 'Document PDF importé'}
                  </div>
                </div>
              </div>
            </div>

            {detailModalCand.offre?.description && (
              <div className="rounded-2xl border border-[#e7eaf2] bg-[#fafbfc] p-4 text-xs space-y-1.5">
                <div className="font-bold text-[#171f33]">Description du poste :</div>
                <p className="text-[#525a70] leading-relaxed">
                  {detailModalCand.offre.description}
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#f0f2f7] pt-4">
              {detailModalCand.offre && (
                <button
                  type="button"
                  onClick={() => {
                    const offre = detailModalCand.offre!;
                    setDetailModalCand(null);
                    onViewJobDetail(offre);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#594be0] px-4 py-2 text-xs font-bold text-white hover:bg-[#483ad3]"
                >
                  <Eye size={14} /> Voir l'offre complète
                </button>
              )}
              <button
                type="button"
                onClick={() => setDetailModalCand(null)}
                className="rounded-xl border border-[#dde1ee] bg-white px-4 py-2 text-xs font-bold text-[#4b546a] hover:bg-[#f6f7fb]"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE "VOIR MES RÉSULTATS" : DÉCISION FINALE DU RECRUTEUR */}
      {resultModalCand && (() => {
        const isAccepted = resultModalCand.statut === 'ACCEPTEE';
        const entName = resultModalCand.offre?.entreprise?.nom || "L'entreprise";

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="relative w-full max-w-lg rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-2xl space-y-5">
              <div className="flex items-start justify-between gap-4 border-b border-[#f0f2f7] pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`grid size-11 place-items-center rounded-2xl ${isAccepted
                        ? 'bg-[#dcfce7] text-[#15803d]'
                        : 'bg-[#ffe8e8] text-[#c83939]'
                      }`}
                  >
                    {isAccepted ? <CheckCircle2 size={22} /> : <XCircle size={22} />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#7c859c]">
                      Décision finale · {entName}
                    </div>
                    <h2 className="text-lg font-black text-[#171f33]">
                      {isAccepted ? 'Candidature retenue' : 'Candidature non retenue'}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setResultModalCand(null)}
                  className="grid size-8 place-items-center rounded-full bg-[#f3f5fa] text-[#6d768d] hover:bg-[#e5e9f2]"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="font-bold text-[#171f33]">
                  Poste : {resultModalCand.offre?.titre}
                </div>

                <div className="rounded-2xl border border-[#e5e8f2] bg-[#fafbfe] p-4 leading-6 text-[#334155] whitespace-pre-line">
                  {resultModalCand.commentaire_recruteur ||
                    (isAccepted
                      ? `Bonjour,\n\nNous avons le plaisir de vous informer que votre candidature au poste de « ${resultModalCand.offre?.titre} » chez ${entName} a été retenue.\n\nNotre équipe prendra contact avec vous très prochainement pour la suite.`
                      : `Bonjour,\n\nNous vous remercions pour l'intérêt porté à ${entName} pour le poste de « ${resultModalCand.offre?.titre} ».\n\nAprès étude de votre candidature, nous avons retenu un autre profil pour cette session. Nous vous souhaitons plein succès dans vos démarches.`)}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[#f0f2f7] pt-4">
                {onNavigateScreen && (
                  <button
                    type="button"
                    onClick={() => {
                      setResultModalCand(null);
                      onNavigateScreen('E_MESSAGES');
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#dde1ee] bg-white px-4 py-2 text-xs font-bold text-[#594be0] hover:bg-[#f5f3ff]"
                  >
                    <MessageSquare size={14} /> Messagerie
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setResultModalCand(null)}
                  className="rounded-xl bg-[#594be0] px-5 py-2 text-xs font-bold text-white hover:bg-[#483ad3]"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
