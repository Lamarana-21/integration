'use client';

import React, { useState, useMemo } from 'react';
import {
  Download,
  Eye,
  Filter,
  Search,
  Sparkles,
  User,
  Users,
  FileText,
  FileCheck,
  X,
  Printer,
  ChevronRight,
  Briefcase,
  GraduationCap,
  Globe,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import { ApplicationStatus, Candidature, Offre } from '@/lib/types';

interface CandidaturesOffreViewProps {
  offres: Offre[];
  candidatures: Candidature[];
  onOpenDetail: (candidature: Candidature) => void;
  onBulkUpdateStatus: (ids: string[], newStatus: ApplicationStatus) => void;
}

export function CandidaturesOffreView({
  offres,
  candidatures,
  onOpenDetail,
  onBulkUpdateStatus,
}: CandidaturesOffreViewProps) {
  const [selectedOffreId, setSelectedOffreId] = useState<string>(offres[0]?.id || '');
  const [filterStatut, setFilterStatut] = useState<string>('TOUS');
  const [minScore, setMinScore] = useState<number>(0);
  const [search, setSearch] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [quickViewCand, setQuickViewCand] = useState<Candidature | null>(null);

  const selectedOffre = offres.find((o) => o.id === selectedOffreId) || offres[0];

  const filteredCandidatures = useMemo(() => {
    return candidatures.filter((c) => {
      if (selectedOffreId && c.offre_id !== selectedOffreId) return false;
      if (filterStatut !== 'TOUS' && c.statut !== filterStatut) return false;
      if (minScore > 0 && (c.analyse?.score_correspondance || 0) < minScore) return false;

      if (search) {
        const q = search.toLowerCase();
        const nom = (c.candidat?.nom || c.candidat?.user?.nom || '').toLowerCase();
        const prenom = (c.candidat?.prenom || c.candidat?.user?.prenom || '').toLowerCase();
        const email = (c.candidat?.user?.email || '').toLowerCase();
        if (!nom.includes(q) && !prenom.includes(q) && !email.includes(q)) return false;
      }

      return true;
    });
  }, [candidatures, selectedOffreId, filterStatut, minScore, search]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCandidatures.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCandidatures.map((c) => c.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkAction = (status: ApplicationStatus) => {
    if (selectedIds.length === 0) return;
    onBulkUpdateStatus(selectedIds, status);
    setSelectedIds([]);
  };

  const exportCsv = () => {
    const headers = ['Nom', 'Prénom', 'E-mail', 'Type CV', 'Offre', 'Date', 'Statut', 'Score IA'];
    const rows = filteredCandidatures.map((c) => [
      c.candidat?.user?.nom || '',
      c.candidat?.user?.prenom || '',
      c.candidat?.user?.email || '',
      c.cv?.source_type === 'DYNAMIQUE' ? 'CV Dynamique' : 'Fichier importé',
      c.offre?.titre || '',
      c.created_at,
      c.statut,
      c.analyse?.score_correspondance ? `${c.analyse.score_correspondance}%` : 'N/A',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `candidatures_${selectedOffre?.titre || 'offres'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      {/* Top Header (E9) */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#eef1f7] pb-5 sm:flex-row sm:items-center">
        <div>
          <span className="text-xs font-bold text-[#8d95ab] uppercase tracking-wider">
            Gestion des candidatures reçues
          </span>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <select
              value={selectedOffreId}
              onChange={(e) => setSelectedOffreId(e.target.value)}
              className="rounded-2xl border border-[#dde1ed] bg-white px-4 py-2 text-lg font-black text-[#171f33] outline-none shadow-xs"
            >
              {offres.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.titre}
                </option>
              ))}
            </select>
            <span className="rounded-full bg-[#f0efff] px-3 py-1 text-xs font-extrabold text-[#594be0]">
              {filteredCandidatures.length} candidature(s)
            </span>
          </div>
        </div>

        <button
          onClick={exportCsv}
          className="flex items-center gap-2 rounded-2xl border border-[#dde1ed] bg-white px-4 py-2.5 text-xs font-bold text-[#4c546a] shadow-xs hover:bg-[#fafbfc]"
        >
          <Download size={15} /> Exporter en CSV
        </button>
      </div>

      {/* Filter Row (E9) */}
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl bg-[#fafbfc] border border-[#e8ebf3] p-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#626a80]">Statut :</span>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="rounded-xl border border-[#dfe3ee] bg-white px-2.5 py-1.5 font-semibold text-[#1e2538] outline-none"
          >
            <option value="TOUS">Tous les statuts</option>
            <option value="RECUE">Reçue</option>
            <option value="EN_EXAMEN">En examen</option>
            <option value="PRESELECTIONNEE">Présélectionnée</option>
            <option value="ENTRETIEN">Entretien</option>
            <option value="ACCEPTEE">Acceptée</option>
            <option value="REFUSEE">Refusée</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-[#626a80]">Score IA min :</span>
          <input
            type="number"
            min={0}
            max={100}
            value={minScore || ''}
            onChange={(e) => setMinScore(Number(e.target.value))}
            placeholder="Ex: 70"
            className="w-20 rounded-xl border border-[#dfe3ee] bg-white px-2.5 py-1.5 font-bold text-[#594be0] outline-none text-center"
          />
          <span className="text-[#8c94a8]">%</span>
        </div>

        <div className="flex flex-1 items-center gap-2 min-w-[200px] rounded-xl border border-[#dfe3ee] bg-white px-3 py-1.5 text-xs">
          <Search size={14} className="text-[#9ea6bb]" />
          <input
            type="text"
            value={search ?? ''}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, prénom ou e-mail..."
            className="w-full bg-transparent outline-none"
          />
        </div>
      </div>

      {/* Bulk Action Bar (E9) */}
      {selectedIds.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#594be0] p-3 text-xs text-white shadow-lg animate-in fade-in">
          <div className="font-bold">
            {selectedIds.length} candidature(s) sélectionnée(s)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkAction('EN_EXAMEN')}
              className="rounded-xl bg-white/20 px-3 py-1.5 font-bold hover:bg-white/30 backdrop-blur-xs"
            >
              Passer en examen
            </button>
            <button
              onClick={() => handleBulkAction('PRESELECTIONNEE')}
              className="rounded-xl bg-white/20 px-3 py-1.5 font-bold hover:bg-white/30 backdrop-blur-xs"
            >
              Présélectionner
            </button>
            <button
              onClick={() => handleBulkAction('REFUSEE')}
              className="rounded-xl bg-[#cf3b3b] px-3 py-1.5 font-bold hover:bg-[#b82a2a]"
            >
              Refuser
            </button>
          </div>
        </div>
      )}

      {/* Applications Table (E9) */}
      <div className="mt-6 overflow-hidden rounded-3xl border border-[#e8ebf3] bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-[#eef1f7] bg-[#fafbfc] text-[11px] font-bold text-[#8d96ab] uppercase tracking-wider">
            <tr>
              <th className="w-10 px-4 py-4 text-center">
                <input
                  type="checkbox"
                  checked={
                    selectedIds.length > 0 &&
                    selectedIds.length === filteredCandidatures.length
                  }
                  onChange={toggleSelectAll}
                  className="size-4 rounded accent-[#594be0]"
                />
              </th>
              <th className="px-6 py-4">Candidat</th>
              <th className="px-6 py-4">CV / Document</th>
              <th className="px-6 py-4">Date dépôt</th>
              <th className="px-6 py-4">Score IA (Aide)</th>
              <th className="px-6 py-4">Statut</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2f4f9]">
            {filteredCandidatures.map((cand) => {
              const isChecked = selectedIds.includes(cand.id);
              const score = cand.analyse?.score_correspondance || 0;
              const isDyn = cand.cv?.source_type === 'DYNAMIQUE' || cand.cv?.est_genere || cand.cv?.nom_fichier?.includes('Dynamique');

              return (
                <tr
                  key={cand.id}
                  className={`hover:bg-[#fafbfc] transition ${
                    isChecked ? 'bg-[#f7f6ff]' : ''
                  }`}
                >
                  <td className="px-4 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelectOne(cand.id)}
                      className="size-4 rounded accent-[#594be0]"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-extrabold text-[#171f33] text-sm">
                      {cand.candidat?.prenom || cand.candidat?.user?.prenom || 'Candidat'} {cand.candidat?.nom || cand.candidat?.user?.nom || ''}
                    </div>
                    <div className="text-[11px] text-[#7d869d]">
                      {cand.candidat?.user?.email || 'email@exemple.com'} · {cand.candidat?.ville || 'Tunisie'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                          isDyn
                            ? 'bg-[#efedff] text-[#5547d7] border border-[#dcd7fc]'
                            : 'bg-[#f0f2f7] text-[#555d72] border border-[#e1e4ee]'
                        }`}
                      >
                        {isDyn ? <Sparkles size={11} /> : <FileText size={11} />}
                        {isDyn ? 'CV Dynamique' : 'Fichier Importé'}
                      </span>
                      <span className="text-[10px] text-[#8a93a8] max-w-[150px] truncate">
                        {cand.cv?.nom_fichier || 'CV.pdf'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#6e778d]">{cand.created_at}</td>
                  <td className="px-6 py-4">
                    {cand.analyse ? (
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-lg px-2.5 py-1 text-xs font-black ${
                            score >= 80
                              ? 'bg-[#edf9f3] text-[#248e56] border border-[#c6eed6]'
                              : score >= 65
                              ? 'bg-[#f0efff] text-[#594be0] border border-[#dfdbfd]'
                              : 'bg-[#fff5df] text-[#ad7615] border border-[#f7e6c4]'
                          }`}
                        >
                          <Sparkles size={13} className="inline mr-1" />
                          {score} / 100
                        </span>
                      </div>
                    ) : (
                      <span className="text-[#a0a8bc]">Non analysé</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        cand.statut === 'RECUE'
                          ? 'bg-[#f0efff] text-[#5c4ce0]'
                          : cand.statut === 'EN_EXAMEN'
                          ? 'bg-[#e8f1ff] text-[#3572d4]'
                          : cand.statut === 'PRESELECTIONNEE'
                          ? 'bg-[#e6f7ef] text-[#2e9c63]'
                          : cand.statut === 'ENTRETIEN'
                          ? 'bg-[#fff4de] text-[#c7881d]'
                          : cand.statut === 'ACCEPTEE'
                          ? 'bg-[#dcfce7] text-[#15803d]'
                          : 'bg-[#ffe8e8] text-[#c83939]'
                      }`}
                    >
                      {cand.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setQuickViewCand(cand)}
                        className="inline-flex items-center gap-1 rounded-xl border border-[#dde1ed] bg-white px-3 py-1.5 text-xs font-bold text-[#4d556c] shadow-2xs hover:bg-[#fafbfc]"
                      >
                        <Eye size={12} /> Lire le CV
                      </button>
                      <button
                        onClick={() => onOpenDetail(cand)}
                        className="inline-flex items-center gap-1 rounded-xl bg-[#594be0] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#483ad3]"
                      >
                        <Sparkles size={12} /> Évaluer & Décider
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-[11px] font-semibold text-[#8c94a8]">
        ℹ️ Règle éthique : Le score IA est une aide à la sélection. Le tri par date et l'analyse humaine restent souverains.
      </div>

      {/* QUICK VIEW MODAL POUR LIRE LE CV INSTANTANÉMENT */}
      {quickViewCand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative my-6 w-full max-w-3xl rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setQuickViewCand(null)}
              className="absolute right-5 top-5 grid size-8 place-items-center rounded-full text-[#959eb4] hover:bg-[#f5f6fa]"
            >
              <X size={18} />
            </button>

            <div className="border-b border-[#f0f2f7] pb-4 flex items-center justify-between pr-8">
              <div>
                <span className="rounded-md bg-[#eeeaff] px-2.5 py-0.5 text-[11px] font-bold text-[#5547d7]">
                  {quickViewCand.cv?.source_type === 'DYNAMIQUE' || quickViewCand.cv?.est_genere ? '✨ CV Dynamique de l\'application' : '📎 Document CV Importé'}
                </span>
                <h2 className="mt-2 text-xl font-black text-[#161e31]">
                  CV de {quickViewCand.candidat?.user?.prenom} {quickViewCand.candidat?.user?.nom}
                </h2>
                <p className="text-xs text-[#7f889e]">
                  {quickViewCand.candidat?.titre || 'Candidat'} · {quickViewCand.candidat?.user?.email} · {quickViewCand.candidat?.ville || 'Tunisie'}
                </p>
              </div>
            </div>

            {/* Corps du CV dans la modale */}
            <div className="mt-5 space-y-4 text-xs text-[#222a3d]">
              {/* Pitch */}
              <div className="rounded-2xl border border-[#eceff6] bg-[#fafbfc] p-4">
                <span className="font-extrabold text-[#707990] uppercase text-[10px] block mb-1">
                  Résumé professionnel
                </span>
                <p className="text-xs text-[#4b5368] leading-relaxed">
                  {quickViewCand.candidat?.resume || 'Candidat passionné avec compétences vérifiées.'}
                </p>
              </div>

              {/* Compétences */}
              <div>
                <span className="font-extrabold text-[#707990] uppercase text-[10px] block mb-1.5">
                  Compétences techniques
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(quickViewCand.candidat?.competences || quickViewCand.analyse?.infos_extraites?.competences || []).map((sk) => (
                    <span key={sk} className="rounded-lg bg-[#eeeaff] px-2.5 py-1 text-xs font-bold text-[#5547d7]">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Expériences */}
              {quickViewCand.candidat?.experiences && quickViewCand.candidat.experiences.length > 0 && (
                <div>
                  <span className="font-extrabold text-[#707990] uppercase text-[10px] block mb-1.5">
                    Expériences professionnelles
                  </span>
                  <div className="space-y-2">
                    {quickViewCand.candidat.experiences.map((exp, i) => (
                      <div key={i} className="rounded-xl border border-[#e8ebf3] p-3 bg-white">
                        <div className="flex justify-between font-bold text-[#151c2e]">
                          <span>{exp.poste} — {exp.employeur}</span>
                          <span className="text-[#8e97ac] font-normal">{exp.dates}</span>
                        </div>
                        <p className="mt-1 text-xs text-[#525a6f]">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lettre de motivation si présente */}
              {quickViewCand.lettre_motivation && (
                <div className="rounded-2xl border border-[#e5e1fc] bg-[#f7f6ff] p-4 text-xs">
                  <span className="font-black text-[#5547d7] block mb-1">Mot d'accompagnement :</span>
                  <p className="italic text-[#4c546b]">« {quickViewCand.lettre_motivation} »</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[#f0f2f7] flex items-center justify-end gap-3">
              <button
                onClick={() => setQuickViewCand(null)}
                className="rounded-xl border border-[#dde1ed] px-4 py-2 text-xs font-bold text-[#555d72] hover:bg-[#fafbfc]"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  const target = quickViewCand;
                  setQuickViewCand(null);
                  onOpenDetail(target);
                }}
                className="rounded-xl bg-[#594be0] px-5 py-2 text-xs font-black text-white shadow-md hover:bg-[#483ad3] flex items-center gap-1.5"
              >
                <Sparkles size={14} /> Passer à l'évaluation & décision complète
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
