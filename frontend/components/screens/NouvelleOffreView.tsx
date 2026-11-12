'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Download,
  Edit3,
  Eye,
  FileText,
  Lock,
  MapPin,
  Plus,
  Save,
  Search,
  Send,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  ApplicationStatus,
  Candidature,
  ContractType,
  Entreprise,
  Offre,
  User,
  formatFrenchDate,
} from '@/lib/types';
import { resolveDepositedCv, downloadCandidateCvFile } from './CandidaturesOffreView';

interface NouvelleOffreViewProps {
  initialOffre?: Offre | null;
  offres?: Offre[];
  candidatures?: Candidature[];
  entreprises?: Entreprise[];
  currentUser?: User | null;
  onSave: (offreData: Partial<Offre>, publishImmediately: boolean) => void;
  onCancel: () => void;
  onEditJob?: (job: Offre | null) => void;
  onCloseJob?: (id: string) => void;
  onDeleteJob?: (id: string) => void;
  onOpenCandidatureDetail?: (candidature: Candidature) => void;
}

export function NouvelleOffreView({
  initialOffre,
  offres = [],
  candidatures = [],
  entreprises = [],
  currentUser,
  onSave,
  onCancel,
  onEditJob,
  onCloseJob,
  onDeleteJob,
  onOpenCandidatureDetail,
}: NouvelleOffreViewProps) {
  const [mode, setMode] = useState<'LIST' | 'FORM'>(initialOffre ? 'FORM' : 'LIST');
  const [editingJob, setEditingJob] = useState<Offre | null>(initialOffre || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLIEE' | 'CLOTUREE' | 'BROUILLON'>('ALL');
  const [confirmDeleteJob, setConfirmDeleteJob] = useState<Offre | null>(null);
  const [expandedOfferId, setExpandedOfferId] = useState<string | null>(null);

  // Form states
  const [titre, setTitre] = useState(initialOffre?.titre || '');
  const [typeContrat, setTypeContrat] = useState<ContractType>(
    initialOffre?.type_contrat || 'CDI'
  );
  const [lieu, setLieu] = useState(initialOffre?.lieu || 'Sfax (Hybride)');
  const [salaire, setSalaire] = useState(initialOffre?.salaire || '');
  const [description, setDescription] = useState(initialOffre?.description || '');
  const [missions, setMissions] = useState(initialOffre?.missions || '');
  const [competences, setCompetences] = useState<string[]>(
    initialOffre?.competences_requises || ['React', 'Node.js', 'SQL']
  );
  const [newComp, setNewComp] = useState('');
  const [datePublication, setDatePublication] = useState(
    initialOffre?.date_publication || new Date().toISOString().split('T')[0]
  );
  const [dateLimite, setDateLimite] = useState(
    initialOffre?.date_limite || '2026-11-30'
  );
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');

  // Entreprise du recruteur connecté (automatique, sans sélecteur d'autres entreprises)
  const recruiterEntrepriseId =
    editingJob?.entreprise_id ||
    currentUser?.entreprise_id ||
    currentUser?.entreprise?.id ||
    entreprises[0]?.id ||
    '01a16a74-f27b-738f-a948-0fb179d8aed4';

  const recruiterEntrepriseNom =
    currentUser?.entreprise?.nom ||
    entreprises.find((e) => e.id === recruiterEntrepriseId)?.nom ||
    'Votre entreprise';

  useEffect(() => {
    if (initialOffre) {
      populateForm(initialOffre);
      setMode('FORM');
    }
  }, [initialOffre]);

  const populateForm = (job: Offre | null) => {
    setEditingJob(job);
    setTitre(job?.titre || '');
    setTypeContrat(job?.type_contrat || 'CDI');
    setLieu(job?.lieu || currentUser?.entreprise?.ville || 'Tunis');
    setSalaire(job?.salaire || '');
    setDescription(job?.description || '');
    setMissions(job?.missions || '');
    setCompetences(job?.competences_requises || ['React', 'Node.js', 'SQL']);
    setDatePublication(job?.date_publication || new Date().toISOString().split('T')[0]);
    setDateLimite(job?.date_limite || '2026-11-30');
    setError('');
  };

  const handleOpenCreateForm = () => {
    onEditJob?.(null);
    populateForm(null);
    setMode('FORM');
  };

  const handleOpenEditForm = (job: Offre) => {
    onEditJob?.(job);
    populateForm(job);
    setMode('FORM');
  };

  const handleBackToList = () => {
    onEditJob?.(null);
    setEditingJob(null);
    setMode('LIST');
  };

  // Offres publiées par ce recruteur / son entreprise (hors offres supprimées)
  const myOffres = useMemo(() => {
    const curEntId = currentUser?.entreprise_id || currentUser?.entreprise?.id;
    const activeOffres = offres.filter((o) => !o.supprimee && o.statut !== 'ARCHIVEE');

    const scoped = activeOffres.filter((o) => {
      if (currentUser?.id && o.auteur_id === currentUser.id) return true;
      if (curEntId && (o.entreprise_id === curEntId || o.entreprise?.id === curEntId)) return true;
      if (
        !curEntId &&
        (o.entreprise_id === 'c-alpha' ||
          o.entreprise_id === '01a16a74-f27b-738f-a948-0fb179d8aed4')
      )
        return true;
      return false;
    });

    const baseList = scoped.length > 0 ? scoped : activeOffres;

    return baseList.filter((o) => {
      if (statusFilter !== 'ALL' && o.statut !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = o.titre.toLowerCase().includes(q);
        const matchLieu = o.lieu.toLowerCase().includes(q);
        const matchContrat = o.type_contrat.toLowerCase().includes(q);
        if (!matchTitle && !matchLieu && !matchContrat) return false;
      }
      return true;
    });
  }, [offres, currentUser, statusFilter, searchQuery]);

  const handleAddSkill = () => {
    if (newComp.trim() && !competences.includes(newComp.trim())) {
      setCompetences([...competences, newComp.trim()]);
      setNewComp('');
    }
  };

  const handleRemoveSkill = (c: string) => {
    setCompetences(competences.filter((item) => item !== c));
  };

  const validate = () => {
    if (!titre.trim()) return 'Le titre de l’offre est obligatoire.';
    if (!lieu.trim()) return 'Le lieu est obligatoire.';
    if (!description.trim()) return 'La description du poste est obligatoire.';
    if (!datePublication) return 'La date de publication est obligatoire.';
    if (!dateLimite) return 'La date limite de candidature est obligatoire.';
    if (new Date(dateLimite) < new Date(datePublication)) {
      return 'La date limite de candidature doit être postérieure ou égale à la date de publication.';
    }
    return null;
  };

  const handleSubmit = (publishImmediately: boolean) => {
    setError('');
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    onSave(
      {
        id: editingJob?.id,
        titre,
        type_contrat: typeContrat,
        lieu,
        salaire,
        description,
        missions,
        competences_requises: competences,
        date_publication: datePublication,
        date_limite: dateLimite,
        entreprise_id: recruiterEntrepriseId,
        statut: publishImmediately ? 'PUBLIEE' : 'BROUILLON',
      },
      publishImmediately
    );

    setEditingJob(null);
    setMode('LIST');
  };

  // ==========================================================================
  // VUE 1 : LISTE DE "MES OFFRES" PUBLIÉES PAR CE RECRUTEUR
  // ==========================================================================
  if (mode === 'LIST') {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-6">
        {/* En-tête Mes offres + Bouton Nouvelle offre */}
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-2xs sm:flex-row sm:items-center">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#594be0]">
              {recruiterEntrepriseNom}
            </div>
            <h1 className="mt-1 text-xl font-black text-[#0f172a] sm:text-2xl">
              Mes offres d'emploi ({myOffres.length})
            </h1>
            <p className="mt-1 text-xs text-[#64748b]">
              Gérez toutes les offres publiées pour votre entreprise : créez, modifiez, clôturez ou supprimez vos annonces.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateForm}
            className="inline-flex items-center gap-2 rounded-xl bg-[#594be0] px-5 py-3 text-xs font-extrabold text-white shadow-sm hover:bg-[#483ad3] transition w-fit cursor-pointer"
          >
            <Plus size={16} /> Nouvelle offre
          </button>
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une de vos offres par titre, contrat ou ville..."
              className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] py-2 pl-9 pr-3 text-xs font-medium text-[#0f172a] outline-none focus:border-[#594be0] focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'ALL', label: 'Toutes' },
                { id: 'PUBLIEE', label: 'Publiées' },
                { id: 'CLOTUREE', label: 'Clôturées' },
                { id: 'BROUILLON', label: 'Brouillons' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  statusFilter === tab.id
                    ? 'bg-[#594be0] text-white'
                    : 'bg-[#f8fafc] text-[#475569] hover:bg-[#f1f5f9]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Liste des offres du recruteur */}
        {myOffres.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#cbd5e1] bg-white p-12 text-center">
            <BriefcaseBusiness size={38} className="mx-auto text-[#94a3b8]" />
            <h3 className="mt-3 text-base font-bold text-[#0f172a]">
              Aucune offre d'emploi trouvée
            </h3>
            <p className="mt-1 text-xs text-[#64748b]">
              Cliquez sur le bouton « Nouvelle offre » pour publier une annonce pour {recruiterEntrepriseNom}.
            </p>
            <button
              type="button"
              onClick={handleOpenCreateForm}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#594be0] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#483ad3]"
            >
              <Plus size={14} /> Créer ma première offre
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {myOffres.map((job) => {
              const appCount =
                candidatures.filter((c) => c.offre_id === job.id).length ||
                job.candidatures_count ||
                0;

              return (
                <div
                  key={job.id}
                  className="rounded-2xl border border-[#e2e8f0] bg-white p-5 sm:p-6 shadow-2xs transition hover:border-[#cbd5e1]"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-[#eeeaff] px-2.5 py-0.5 text-[11px] font-extrabold text-[#594be0]">
                          {job.type_contrat}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            job.statut === 'PUBLIEE'
                              ? 'bg-[#ecfdf5] text-[#059669]'
                              : job.statut === 'CLOTUREE'
                              ? 'bg-[#fef2f2] text-[#dc2626]'
                              : 'bg-[#fffbeb] text-[#d97706]'
                          }`}
                        >
                          {job.statut === 'PUBLIEE' ? (
                            <>
                              <CheckCircle2 size={11} /> Publiée
                            </>
                          ) : job.statut === 'CLOTUREE' ? (
                            <>
                              <Lock size={11} /> Clôturée
                            </>
                          ) : (
                            <>
                              <Clock size={11} /> Brouillon
                            </>
                          )}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-[11px] font-bold text-[#334155]">
                          <Users size={11} /> {appCount} candidature(s)
                        </span>
                      </div>

                      <h3 className="text-base font-black text-[#0f172a] sm:text-lg">
                        {job.titre}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#64748b]">
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={13} className="text-[#594be0]" /> {job.lieu}
                        </span>
                        {job.salaire && (
                          <span className="font-bold text-[#334155]">• {job.salaire}</span>
                        )}
                        {job.date_publication && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar size={13} /> Publiée le{' '}
                            {formatFrenchDate(job.date_publication)}
                          </span>
                        )}
                        {job.date_limite && (
                          <span className="inline-flex items-center gap-1 font-semibold text-[#475569]">
                            • Date limite : {formatFrenchDate(job.date_limite)}
                          </span>
                        )}
                      </div>

                      {job.competences_requises && job.competences_requises.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {job.competences_requises.map((comp) => (
                            <span
                              key={comp}
                              className="rounded-lg bg-[#f8fafc] border border-[#e2e8f0] px-2.5 py-0.5 text-[11px] font-semibold text-[#475569]"
                            >
                              {comp}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Boutons d'action : Voir candidatures, Modifier, Clôturer, Supprimer */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setExpandedOfferId((prev) => (prev === job.id ? null : job.id))}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                          expandedOfferId === job.id
                            ? 'border-[#594be0] bg-[#594be0] text-white shadow-xs'
                            : 'border-[#cbd5e1] bg-[#f8fafc] text-[#334155] hover:bg-[#eef2ff] hover:text-[#594be0]'
                        }`}
                      >
                        <Users size={13} />
                        <span>Candidatures ({appCount})</span>
                        {expandedOfferId === job.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditForm(job)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#cbd5e1] bg-white px-3.5 py-2 text-xs font-bold text-[#334155] hover:bg-[#f8fafc] transition cursor-pointer"
                      >
                        <Edit3 size={13} /> Modifier
                      </button>

                      {job.statut === 'PUBLIEE' && onCloseJob && (
                        <button
                          type="button"
                          onClick={() => onCloseJob(job.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#fed7aa] bg-[#fff7ed] px-3.5 py-2 text-xs font-bold text-[#c2410c] hover:bg-[#ffedd5] transition cursor-pointer"
                        >
                          <Lock size={13} /> Clôturer
                        </button>
                      )}

                      {onDeleteJob && (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteJob(job)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-3.5 py-2 text-xs font-bold text-[#dc2626] hover:bg-[#fee2e2] transition cursor-pointer"
                        >
                          <Trash2 size={13} /> Supprimer
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Accordéon déroulant : Liste des candidatures reçues pour cette offre */}
                  {expandedOfferId === job.id && (() => {
                    const jobCands = candidatures
                      .filter((c) => c.offre_id === job.id)
                      .sort((a, b) => {
                        const aRecue = a.statut === 'RECUE' ? 1 : 0;
                        const bRecue = b.statut === 'RECUE' ? 1 : 0;
                        if (bRecue !== aRecue) return bRecue - aRecue;
                        const dA = a.created_at ? new Date(a.created_at).getTime() : 0;
                        const dB = b.created_at ? new Date(b.created_at).getTime() : 0;
                        return dB - dA;
                      });

                    return (
                      <div className="mt-5 border-t border-[#f1f5f9] pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-black uppercase tracking-wider text-[#475569] flex items-center gap-1.5">
                            <Users size={14} className="text-[#594be0]" /> Candidatures reçues pour ce poste ({jobCands.length})
                          </h4>
                          <span className="text-[11px] font-semibold text-[#64748b]">
                            Triées : nouvelles en tête
                          </span>
                        </div>

                        {jobCands.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-6 text-center text-xs font-semibold text-[#64748b]">
                            Aucune candidature n&apos;a encore été déposée pour cette offre.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {jobCands.map((c) => {
                              const candUser = c.candidat?.user;
                              const prenom = c.candidat?.prenom || candUser?.prenom || 'Candidat';
                              const nom = c.candidat?.nom || candUser?.nom || '';
                              const resolvedCv = resolveDepositedCv(c);
                              const cvNom = (resolvedCv?.nom_fichier || '').toLowerCase();
                              const isNonConforme =
                                c.analyse?.score_correspondance === 0 ||
                                cvNom.includes('tp_') ||
                                cvNom.includes('tp-') ||
                                cvNom.includes('cours') ||
                                cvNom.includes('facture') ||
                                cvNom.includes('enonce') ||
                                (c.analyse?.resume && c.analyse.resume.toLowerCase().includes('document non conforme'));
                              const score = isNonConforme ? 0 : (c.analyse?.score_correspondance ?? 78);

                              return (
                                <div
                                  key={c.id}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#e2e8f0] bg-[#fafbfc] p-3.5 hover:bg-white hover:border-[#cbd5e1] transition"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#eef2ff] text-xs font-black text-[#594be0]">
                                      {prenom[0]}
                                      {nom[0] || ''}
                                    </div>
                                    <div>
                                      <div className="font-bold text-xs text-[#0f172a]">
                                        {prenom} {nom}
                                      </div>
                                      <div className="text-[11px] text-[#64748b] flex flex-wrap items-center gap-2">
                                        <span>{candUser?.email || 'candidat@talenta.tn'}</span>
                                        <span>•</span>
                                        <span>Postulé le {formatFrenchDate(c.created_at)}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2">
                                    {/* Statut */}
                                    <span
                                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                        c.statut === 'RECUE'
                                          ? 'bg-[#f1f5f9] text-[#475569]'
                                          : c.statut === 'EN_EXAMEN'
                                          ? 'bg-[#eff6ff] text-[#2563eb]'
                                          : c.statut === 'PRESELECTIONNEE'
                                          ? 'bg-[#ecfdf5] text-[#059669]'
                                          : c.statut === 'ENTRETIEN'
                                          ? 'bg-[#fffbeb] text-[#d97706]'
                                          : c.statut === 'ACCEPTEE'
                                          ? 'bg-[#ecfdf5] text-[#059669]'
                                          : 'bg-[#fef2f2] text-[#dc2626]'
                                      }`}
                                    >
                                      {c.statut}
                                    </span>

                                    {/* Score IA */}
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold ${
                                        score === 0
                                          ? 'border border-[#fecaca] bg-[#fef2f2] text-[#dc2626]'
                                          : score >= 80
                                          ? 'border border-[#bbf7d0] bg-[#ecfdf5] text-[#059669]'
                                          : score >= 65
                                          ? 'border border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]'
                                          : 'border border-[#fde68a] bg-[#fffbeb] text-[#d97706]'
                                      }`}
                                    >
                                      <Sparkles size={11} />
                                      <span>{score === 0 ? 'Invalide (0%)' : `IA : ${score}%`}</span>
                                    </span>

                                    {/* Fichier CV */}
                                    <button
                                      type="button"
                                      onClick={() => downloadCandidateCvFile(c)}
                                      className="inline-flex items-center gap-1 rounded-lg border border-[#e2e8f0] bg-white px-2 py-1 text-[11px] font-semibold text-[#475569] hover:bg-[#f1f5f9]"
                                      title="Télécharger le CV déposé"
                                    >
                                      <Download size={11} />
                                      <span className="max-w-[100px] truncate">{resolvedCv?.nom_fichier || 'CV.pdf'}</span>
                                    </button>

                                    {/* Décider / Évaluer */}
                                    {onOpenCandidatureDetail && (
                                      <button
                                        type="button"
                                        onClick={() => onOpenCandidatureDetail(c)}
                                        className="inline-flex items-center gap-1 rounded-lg bg-[#594be0] px-3 py-1 text-xs font-bold text-white hover:bg-[#483ad3] transition cursor-pointer"
                                      >
                                        <span>Évaluer</span>
                                        <ChevronRight size={12} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        )}

        {/* Modale de confirmation de suppression d'offre */}
        {confirmDeleteJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-2xl space-y-4">
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#fef2f2] text-[#dc2626]">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#0f172a]">
                    Supprimer cette offre d'emploi ?
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#64748b]">
                    Vous êtes sur le point de supprimer l'offre{' '}
                    <strong className="text-[#0f172a]">« {confirmDeleteJob.titre} »</strong>. Elle ne sera plus visible dans les offres publiques et les candidats ayant déjà postulé verront clairement que l'offre a été supprimée.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[#f1f5f9] pt-4">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteJob(null)}
                  className="rounded-xl border border-[#cbd5e1] bg-white px-4 py-2 text-xs font-bold text-[#475569] hover:bg-[#f8fafc]"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteJob?.(confirmDeleteJob.id);
                    setConfirmDeleteJob(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#dc2626] px-4 py-2 text-xs font-bold text-white hover:bg-[#b91c1c]"
                >
                  <Trash2 size={13} /> Confirmer la suppression
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================================================
  // VUE 2 : FORMULAIRE D'AJOUT / MODIFICATION D'UNE OFFRE (SANS CHAMP ENTREPRISE)
  // ==========================================================================
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <button
        type="button"
        onClick={handleBackToList}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#594be0] hover:underline"
      >
        <ArrowLeft size={15} /> Retour à mes offres
      </button>

      {/* Top Header (E8) */}
      <div className="flex items-center justify-between border-b border-[#eef1f7] pb-5">
        <div>
          <span className="rounded-md bg-[#eeeaff] px-2.5 py-0.5 text-xs font-bold text-[#5547d7]">
            {editingJob ? 'Modification d’offre' : `Nouvelle offre · ${recruiterEntrepriseNom}`}
          </span>
          <h1 className="mt-2 text-2xl font-black text-[#171f33]">
            {editingJob ? `Modifier : ${editingJob.titre}` : 'Publier une nouvelle offre d’emploi'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#fff5df] px-3 py-1 text-xs font-bold text-[#b07817]">
            {editingJob?.statut || 'Brouillon'}
          </span>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-[#ffcfcf] bg-[#fff5f5] p-4 text-xs font-bold text-[#cf3b3b]">
          {error}
        </div>
      )}

      {/* Formulaire sans sélection d'entreprise (rattaché automatiquement à l'entreprise du recruteur) */}
      <div className="mt-6 space-y-6 rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-8 shadow-xs">
        <div>
          <label className="text-xs font-bold text-[#20283c]">
            Titre de l'offre *
          </label>
          <input
            type="text"
            required
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            placeholder="Ex: Développeur Fullstack React / Node.js, Ingénieur DevOps..."
            className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-4 py-3 text-xs text-[#1a2133] outline-none focus:border-[#6355e8]"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs font-bold text-[#20283c]">
              Type de contrat *
            </label>
            <select
              value={typeContrat}
              onChange={(e) => setTypeContrat(e.target.value as ContractType)}
              className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1a2133] outline-none"
            >
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
              <option value="STAGE">Stage</option>
              <option value="ALTERNANCE">Alternance</option>
              <option value="FREELANCE">Freelance</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#20283c]">Lieu *</label>
            <input
              type="text"
              required
              value={lieu}
              onChange={(e) => setLieu(e.target.value)}
              placeholder="Sfax, Tunis, Télétravail..."
              className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1a2133] outline-none focus:border-[#6355e8]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#20283c]">
              Fourchette de salaire (optionnel)
            </label>
            <input
              type="text"
              value={salaire}
              onChange={(e) => setSalaire(e.target.value)}
              placeholder="Ex: 1 800 - 2 400 TND"
              className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1a2133] outline-none focus:border-[#6355e8]"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-[#20283c]">
            Description du poste *
          </label>
          <textarea
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Présentez le cadre du poste, l'équipe et les objectifs..."
            className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] p-3 text-xs text-[#1a2133] outline-none focus:border-[#6355e8]"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-[#20283c]">
            Missions principales
          </label>
          <textarea
            rows={3}
            value={missions}
            onChange={(e) => setMissions(e.target.value)}
            placeholder="• Concevoir et développer de nouvelles fonctionnalités&#10;• Participer aux revues de code&#10;• Collaborer avec les équipes produit"
            className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] p-3 text-xs text-[#1a2133] outline-none focus:border-[#6355e8]"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-[#20283c]">
            Compétences attendues
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {competences.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#dcd7fb] bg-[#f7f6ff] px-3 py-1 text-xs font-bold text-[#5547d7]"
              >
                {c}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(c)}
                  className="text-[#887fd3] hover:text-[#5547d7]"
                >
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>

          <div className="mt-2.5 flex items-center gap-2 max-w-sm">
            <input
              type="text"
              placeholder="Ex: React, TypeScript, SQL..."
              value={newComp}
              onChange={(e) => setNewComp(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
              className="w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3 py-2 text-xs text-[#1a2133] outline-none"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="rounded-xl bg-[#594be0] px-3.5 py-2 text-xs font-bold text-white shrink-0"
            >
              + Ajouter
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-bold text-[#20283c]">
              Date de publication *
            </label>
            <input
              type="date"
              required
              value={datePublication}
              onChange={(e) => setDatePublication(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1a2133] outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#20283c]">
              Date limite de candidature *
            </label>
            <input
              type="date"
              required
              value={dateLimite}
              onChange={(e) => setDateLimite(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1a2133] outline-none"
            />
          </div>
        </div>

        {/* Boutons d'action du formulaire */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#f0f2f7] pt-6">
          <button
            type="button"
            onClick={handleBackToList}
            className="rounded-xl border border-[#dde0ec] px-4 py-2.5 text-xs font-bold text-[#646c82] hover:bg-[#fafbfc]"
          >
            Annuler
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-1.5 rounded-xl border border-[#dde0ec] px-4 py-2.5 text-xs font-bold text-[#4c546a] hover:bg-[#fafbfc]"
            >
              <Eye size={15} /> Aperçu de l'offre
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="flex items-center gap-1.5 rounded-xl border border-[#d8d2fb] bg-[#f7f6ff] px-4 py-2.5 text-xs font-bold text-[#5547d7] hover:bg-[#efedff]"
            >
              <Save size={15} /> Enregistrer en brouillon
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="flex items-center gap-1.5 rounded-xl bg-[#594be0] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#483ad3] transition"
            >
              <Send size={15} /> {editingJob ? 'Enregistrer les modifications' : "Publier l'offre"}
            </button>
          </div>
        </div>
      </div>

      {/* Modal Aperçu (E8) */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <span className="text-xs font-bold text-[#8f98ad] uppercase">
                Aperçu candidat · {recruiterEntrepriseNom}
              </span>
              <button onClick={() => setShowPreview(false)}>
                <X size={18} />
              </button>
            </div>
            <h3 className="mt-4 text-2xl font-black text-[#171f33]">{titre || 'Titre du poste'}</h3>
            <div className="mt-1 flex items-center gap-3 text-xs text-[#717a90]">
              <span className="font-bold text-[#594be0]">{typeContrat}</span>
              <span>· {lieu}</span>
              {salaire && <span>· {salaire}</span>}
              <span>· Limite : {formatFrenchDate(dateLimite)}</span>
            </div>
            <p className="mt-4 text-xs leading-5 text-[#525a6e] whitespace-pre-line">
              {description}
            </p>
            {missions && (
              <div className="mt-4 text-xs leading-5 text-[#525a6e] whitespace-pre-line">
                <strong>Missions :</strong>
                <div>{missions}</div>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {competences.map((c) => (
                <span key={c} className="rounded-lg bg-[#eeeaff] px-2.5 py-1 text-xs font-bold text-[#5547d7]">
                  {c}
                </span>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowPreview(false)}
                className="rounded-xl bg-[#594be0] px-5 py-2 text-xs font-bold text-white"
              >
                Fermer l'aperçu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
