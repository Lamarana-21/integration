'use client';

import React, { useState, useEffect } from 'react';
import {
  Award,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileCheck,
  FileText,
  Mail,
  MapPin,
  Maximize2,
  MessageSquare,
  Phone,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Video,
  X,
  XCircle,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { ApplicationStatus, Candidature } from '@/lib/types';
import {
  DepositedCvRenderer,
  downloadCandidateCvFile,
  hasRealUploadedPdf,
  resolveDepositedCv,
} from './CandidaturesOffreView';

interface FicheCandidatIaViewProps {
  candidature: Candidature;
  onBack: () => void;
  onUpdateStatus: (
    id: string,
    newStatus: ApplicationStatus,
    commentaire?: string,
    entretienDetails?: { date?: string; type?: 'VISIO' | 'PRESENTIEL' | 'TELEPHONE'; lien?: string }
  ) => void;
  onAddNote: (id: string, contenu: string, etiquettes: string[]) => void;
  onRerunAi: (id: string) => void;
}

const SEQUENTIAL_STEPS: {
  key: ApplicationStatus;
  num: number;
  label: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    key: 'RECUE',
    num: 1,
    label: '1. Candidature reçue',
    shortLabel: '1. Reçue',
    description: 'Dossier déposé par le candidat et enregistré.',
  },
  {
    key: 'EN_EXAMEN',
    num: 2,
    label: '2. En cours d’examen',
    shortLabel: '2. En examen',
    description: 'Lecture et vérification du CV par le recruteur.',
  },
  {
    key: 'PRESELECTIONNEE',
    num: 3,
    label: '3. Présélectionnée',
    shortLabel: '3. Présélection',
    description: 'Profil validé en shortlist pour la suite du processus.',
  },
  {
    key: 'ENTRETIEN',
    num: 4,
    label: '4. Entretien programmé',
    shortLabel: '4. Entretien',
    description: 'Convocation envoyée au candidat avec date et modalités.',
  },
  {
    key: 'ACCEPTEE',
    num: 5,
    label: '5. Décision finale',
    shortLabel: '5. Décision',
    description: 'Résultat officiel transmis au candidat (Retenue ou Non retenue).',
  },
];

export function FicheCandidatIaView({
  candidature,
  onBack,
  onUpdateStatus,
  onAddNote,
  onRerunAi,
}: FicheCandidatIaViewProps) {
  const [pdfZoom, setPdfZoom] = useState<number>(100);
  const [showFullscreenCv, setShowFullscreenCv] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  // Étape / statut sélectionné dans le parcours séquentiel
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>(candidature.statut);
  const [candidateFeedback, setCandidateFeedback] = useState<string>(
    candidature.commentaire_recruteur || ''
  );

  // Synchroniser si la candidature change
  useEffect(() => {
    setSelectedStatus(candidature.statut);
    setCandidateFeedback(candidature.commentaire_recruteur || '');
  }, [candidature.id, candidature.statut, candidature.commentaire_recruteur]);

  // Exécution automatique de l'analyse IA en arrière-plan à l'ouverture si absente
  useEffect(() => {
    if (!candidature.analyse) {
      onRerunAi(candidature.id);
    }
  }, [candidature.id]);

  // Planification entretien
  const [interviewDate, setInterviewDate] = useState<string>(
    candidature.date_entretien?.split(' ')[0] ||
      new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [interviewTime, setInterviewTime] = useState<string>('14:30');
  const [interviewType, setInterviewType] = useState<'VISIO' | 'PRESENTIEL' | 'TELEPHONE'>(
    candidature.type_entretien || 'VISIO'
  );
  const [interviewLink, setInterviewLink] = useState<string>(
    candidature.lien_ou_lieu_entretien || 'https://meet.google.com/talenta-hr-meet'
  );

  // Notes internes RH
  const [newNote, setNewNote] = useState('');
  const [aiRunning, setAiRunning] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  const analyse = candidature.analyse;
  const candidat = candidature.candidat;
  const user = candidat?.user;
  const cv = resolveDepositedCv(candidature);
  const offre = candidature.offre;

  const isRealPdf = hasRealUploadedPdf(cv);
  const isDynamicCv =
    !isRealPdf &&
    (cv?.source_type === 'DYNAMIQUE' ||
      cv?.est_genere ||
      cv?.nom_fichier?.includes('Dynamique'));

  const requiredSkills = offre?.competences_requises || ['React', 'Node.js', 'SQL'];
  const candidateSkills =
    candidat?.competences || analyse?.infos_extraites?.competences || [];

  const matchedSkills = requiredSkills.filter((req) =>
    candidateSkills.some(
      (cs) =>
        cs.toLowerCase().includes(req.toLowerCase()) ||
        req.toLowerCase().includes(cs.toLowerCase())
    )
  );
  const missingSkills = requiredSkills.filter((req) => !matchedSkills.includes(req));
  const score = analyse?.score_correspondance || 85;

  const prenom = candidat?.prenom || user?.prenom || 'Candidat';
  const nom = candidat?.nom || user?.nom || '';

  // Détermination de l'index d'étape actuelle de la candidature enregistrée
  const getSavedStepIdx = (st: ApplicationStatus) => {
    switch (st) {
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
        return 0;
    }
  };

  const savedStepIdx = getSavedStepIdx(candidature.statut);

  // Génère un message professionnel adapté à l'étape choisie
  const buildDefaultMessageForStatus = (target: ApplicationStatus) => {
    const poste = offre?.titre || 'le poste';
    const entreprise = offre?.entreprise?.nom || 'notre entreprise';

    if (target === 'EN_EXAMEN') {
      return `Bonjour ${prenom},\n\nVotre candidature pour le poste de « ${poste} » chez ${entreprise} est actuellement en cours d'examen par notre équipe de recrutement.\n\nCordialement,\nService Recrutement ${entreprise}`;
    }
    if (target === 'PRESELECTIONNEE') {
      return `Bonjour ${prenom},\n\nAprès examen de votre CV, nous avons le plaisir de vous informer que votre profil a été présélectionné pour le poste de « ${poste} » chez ${entreprise}.\n\nNous reviendrons vers vous très prochainement pour l'étape d'entretien.\n\nCordialement,\nService Recrutement ${entreprise}`;
    }
    if (target === 'ENTRETIEN') {
      return `Bonjour ${prenom},\n\nVotre profil ayant été présélectionné pour le poste de « ${poste} » chez ${entreprise}, nous vous convions à un entretien le ${interviewDate} à ${interviewTime} (${
        interviewType === 'VISIO'
          ? 'en visioconférence'
          : interviewType === 'TELEPHONE'
          ? 'par téléphone'
          : 'dans nos locaux'
      }). Vous retrouverez votre convocation dans l'onglet Entretiens & Convocations.\n\nCordialement,\nService Recrutement ${entreprise}`;
    }
    if (target === 'ACCEPTEE') {
      return `Bonjour ${prenom},\n\nNous avons le plaisir de vous annoncer que votre candidature au poste de « ${poste} » chez ${entreprise} a été retenue !\n\nNotre équipe RH prendra contact avec vous sous 24h pour finaliser votre intégration.\n\nFélicitations,\nService Recrutement ${entreprise}`;
    }
    if (target === 'REFUSEE') {
      return `Bonjour ${prenom},\n\nNous vous remercions pour l'intérêt porté à ${entreprise} et pour votre candidature au poste de « ${poste} ».\n\nAprès étude attentive de votre dossier, nous ne donnons pas une suite favorable pour ce poste et conservons votre profil dans notre vivier.\n\nCordialement,\nService Recrutement ${entreprise}`;
    }
    return '';
  };

  const handleSelectStepStatus = (target: ApplicationStatus) => {
    setSelectedStatus(target);
    setCandidateFeedback(buildDefaultMessageForStatus(target));
  };

  const handleSaveDecision = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStatus(
      candidature.id,
      selectedStatus,
      candidateFeedback,
      selectedStatus === 'ENTRETIEN'
        ? {
            date: `${interviewDate} à ${interviewTime}`,
            type: interviewType,
            lien: interviewLink,
          }
        : undefined
    );
    setToastMessage(
      `Étape enregistrée avec succès : « ${selectedStatus} ». Le suivi séquentiel et les résultats du candidat sont immédiatement mis à jour.`
    );
    setTimeout(() => setToastMessage(''), 5000);
  };

  const handleTriggerAiRerun = () => {
    setAiRunning(true);
    setTimeout(() => {
      onRerunAi(candidature.id);
      setAiRunning(false);
    }, 600);
  };

  const handleAddInternalNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddNote(candidature.id, newNote.trim(), ['Note RH']);
    setNewNote('');
    setToastMessage('Note interne ajoutée.');
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Prochaine étape séquentielle recommandée selon l'état actuel du dossier
  const getNextRecommendedStep = (): {
    nextStatus: ApplicationStatus;
    nextLabel: string;
    canReject: boolean;
  } | null => {
    switch (candidature.statut) {
      case 'RECUE':
        return {
          nextStatus: 'EN_EXAMEN',
          nextLabel: 'Passer à l’Étape 2 : Mettre en examen',
          canReject: true,
        };
      case 'EN_EXAMEN':
        return {
          nextStatus: 'PRESELECTIONNEE',
          nextLabel: 'Valider l’examen → Étape 3 : Présélectionner',
          canReject: true,
        };
      case 'PRESELECTIONNEE':
        return {
          nextStatus: 'ENTRETIEN',
          nextLabel: 'Valider la présélection → Étape 4 : Convoquer en entretien',
          canReject: true,
        };
      case 'ENTRETIEN':
        return {
          nextStatus: 'ACCEPTEE',
          nextLabel: 'Valider l’entretien → Étape 5 : Retenir le candidat',
          canReject: true,
        };
      default:
        return null;
    }
  };

  const recommended = getNextRecommendedStep();

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 space-y-6">
      {/* Notification de confirmation */}
      {toastMessage && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[#a7f3d0] bg-[#ecfdf5] px-4 py-3 text-xs font-bold text-[#065f46]">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#10b981] shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="text-[#065f46] hover:opacity-75">
            <X size={14} />
          </button>
        </div>
      )}

      {/* BARRE SUPÉRIEURE ÉPURÉE AVEC BOUTON « VOIR L'ANALYSE IA » */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-2xs lg:flex-row lg:items-center">
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#cbd5e1] bg-white px-3.5 py-2 text-xs font-bold text-[#334155] hover:bg-[#f8fafc]"
          >
            <ChevronLeft size={15} /> Retour aux candidatures
          </button>

          <div className="flex items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#eef2ff] text-sm font-black text-[#4f46e5]">
              {prenom[0]}
              {nom[0] || ''}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-black text-[#0f172a]">
                  {prenom} {nom}
                </h1>
                <span className="rounded-md bg-[#f1f5f9] px-2.5 py-0.5 text-[11px] font-bold text-[#475569]">
                  Poste : {offre?.titre || 'Offre Talenta'}
                </span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-[#64748b]">
                <span className="flex items-center gap-1">
                  <Mail size={12} /> {user?.email || 'candidat@talenta.tn'}
                </span>
                {candidat?.telephone && (
                  <span className="flex items-center gap-1">
                    <Phone size={12} /> {candidat.telephone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <MapPin size={12} /> {candidat?.ville || 'Tunisie'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Boutons d'action : Voir l'analyse IA (calculée en arrière-plan) + Télécharger le CV */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowAiModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#eef2ff] border border-[#c7d2fe] px-4 py-2 text-xs font-extrabold text-[#4338ca] hover:bg-[#e0e7ff] transition"
          >
            <Sparkles size={14} className="text-[#4f46e5]" />
            <span>Voir l’analyse IA ({score}%)</span>
          </button>

          <button
            type="button"
            onClick={() => downloadCandidateCvFile(candidature)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#cbd5e1] bg-white px-3.5 py-2 text-xs font-bold text-[#0f172a] hover:bg-[#f8fafc]"
          >
            <Download size={14} className="text-[#4f46e5]" /> Télécharger le CV
          </button>
        </div>
      </div>

      {/* GRILLE PRINCIPALE : CV DÉPOSÉ (GAUCHE) + DÉCISION SÉQUENTIELLE PAR ÉTAPE (DROITE) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* COLONNE GAUCHE (7 cols) : CV EXACT TEL QUE DÉPOSÉ PAR LE CANDIDAT */}
        <div className="lg:col-span-7 overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e2e8f0] bg-[#f8fafc] px-5 py-3.5">
            <div className="flex items-center gap-2">
              {isDynamicCv ? (
                <FileCheck size={16} className="text-[#4f46e5]" />
              ) : (
                <FileText size={16} className="text-[#0284c7]" />
              )}
              <span className="text-xs font-extrabold text-[#0f172a]">
                {cv?.nom_fichier || `CV_${prenom}_${nom}.pdf`}
              </span>
              <span className="rounded-md bg-[#e2e8f0] px-2 py-0.5 text-[10px] font-bold text-[#334155]">
                {isRealPdf
                  ? 'Fichier PDF importé'
                  : isDynamicCv
                  ? `CV Dynamique (${cv?.template_style || 'moderne'})`
                  : 'CV Candidat'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {!isRealPdf && (
                <>
                  <button
                    type="button"
                    onClick={() => setPdfZoom((z) => Math.max(80, z - 10))}
                    className="rounded-lg border border-[#cbd5e1] bg-white p-1.5 text-[#475569] hover:bg-[#f1f5f9]"
                    title="Réduire"
                  >
                    <ZoomOut size={13} />
                  </button>
                  <span className="px-1.5 text-[11px] font-bold text-[#475569]">{pdfZoom}%</span>
                  <button
                    type="button"
                    onClick={() => setPdfZoom((z) => Math.min(115, z + 10))}
                    className="rounded-lg border border-[#cbd5e1] bg-white p-1.5 text-[#475569] hover:bg-[#f1f5f9]"
                    title="Agrandir"
                  >
                    <ZoomIn size={13} />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setShowFullscreenCv(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-[#cbd5e1] bg-white px-2.5 py-1.5 text-xs font-bold text-[#334155] hover:bg-[#f1f5f9]"
              >
                <Maximize2 size={12} /> Plein écran
              </button>
              <button
                type="button"
                onClick={() => downloadCandidateCvFile(candidature)}
                className="inline-flex items-center gap-1 rounded-lg bg-[#4f46e5] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#4338ca]"
              >
                <Download size={12} /> Télécharger
              </button>
            </div>
          </div>

          <div className="bg-[#f1f5f9] p-5 overflow-x-auto max-h-[820px] overflow-y-auto">
            <DepositedCvRenderer candidature={candidature} zoom={pdfZoom} />
          </div>
        </div>

        {/* COLONNE DROITE (5 cols) : SUIVI & PRISE DE DÉCISION SÉQUENTIELLE PAR ÉTAPE */}
        <div className="lg:col-span-5 space-y-5">
          <form
            onSubmit={handleSaveDecision}
            className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-2xs space-y-5"
          >
            <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3.5">
              <div>
                <h2 className="text-sm font-black text-[#0f172a]">
                  Processus de Décision Séquentiel
                </h2>
                <p className="text-[11px] text-[#64748b] mt-0.5">
                  Avancez étape par étape pour mettre à jour le suivi du candidat.
                </p>
              </div>
              <span className="rounded-full bg-[#f1f5f9] px-3 py-1 text-[11px] font-bold text-[#334155]">
                Étape {savedStepIdx + 1} / 5
              </span>
            </div>

            {/* 1. Frise séquentielle des 5 étapes */}
            <div className="space-y-2">
              {SEQUENTIAL_STEPS.map((st, idx) => {
                const isFinalStep = idx === 4;
                const isSavedCompleted =
                  candidature.statut === 'ACCEPTEE'
                    ? true
                    : candidature.statut === 'REFUSEE'
                    ? idx === 0 ||
                      idx === 1 ||
                      (candidature.etapes_validees || []).includes(st.key)
                    : idx < savedStepIdx;
                const isSavedCurrent = idx === savedStepIdx;
                const isSelectedTarget =
                  selectedStatus === st.key ||
                  (isFinalStep && (selectedStatus === 'ACCEPTEE' || selectedStatus === 'REFUSEE'));

                return (
                  <div
                    key={st.key}
                    onClick={() => {
                      if (isFinalStep) {
                        handleSelectStepStatus(
                          selectedStatus === 'REFUSEE' ? 'REFUSEE' : 'ACCEPTEE'
                        );
                      } else {
                        handleSelectStepStatus(st.key);
                      }
                    }}
                    className={`flex items-center justify-between gap-3 rounded-xl border p-3 cursor-pointer transition ${
                      isSelectedTarget
                        ? 'border-[#4f46e5] bg-[#eef2ff]/60'
                        : isSavedCompleted
                        ? 'border-[#bbf7d0] bg-[#f0fdf4]/60'
                        : 'border-[#e2e8f0] bg-[#f8fafc] hover:bg-[#f1f5f9]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                          isFinalStep && candidature.statut === 'REFUSEE'
                            ? 'bg-[#dc2626] text-white'
                            : isSavedCompleted || (isFinalStep && candidature.statut === 'ACCEPTEE')
                            ? 'bg-[#16a34a] text-white'
                            : isSelectedTarget || isSavedCurrent
                            ? 'bg-[#4f46e5] text-white'
                            : 'bg-[#e2e8f0] text-[#64748b]'
                        }`}
                      >
                        {isFinalStep && candidature.statut === 'REFUSEE'
                          ? '✕'
                          : isSavedCompleted || (isFinalStep && candidature.statut === 'ACCEPTEE')
                          ? '✓'
                          : st.num}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#0f172a]">
                          {isFinalStep
                            ? candidature.statut === 'ACCEPTEE'
                              ? '5. Décision finale : Candidature retenue'
                              : candidature.statut === 'REFUSEE'
                              ? '5. Décision finale : Non retenue'
                              : '5. Décision finale (Accepter / Refuser)'
                            : st.label}
                        </div>
                        <div className="text-[11px] text-[#64748b]">{st.description}</div>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        isSavedCurrent
                          ? 'bg-[#4f46e5] text-white'
                          : isSavedCompleted
                          ? 'bg-[#dcfce7] text-[#15803d]'
                          : 'bg-[#e2e8f0] text-[#64748b]'
                      }`}
                    >
                      {isSavedCurrent ? 'Actuelle' : isSavedCompleted ? 'Validée' : 'À suivre'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 2. Action séquentielle recommandée pour passer à l'étape suivante */}
            {recommended && (
              <div className="rounded-xl border border-[#e0e7ff] bg-[#f8fafc] p-3.5 space-y-2.5">
                <div className="text-[11px] font-bold text-[#475569]">
                  Progression séquentielle recommandée :
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => handleSelectStepStatus(recommended.nextStatus)}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                      selectedStatus === recommended.nextStatus
                        ? 'bg-[#4f46e5] text-white shadow-xs'
                        : 'border border-[#4f46e5] bg-white text-[#4f46e5] hover:bg-[#eef2ff]'
                    }`}
                  >
                    <span>{recommended.nextLabel}</span>
                    <ChevronRight size={14} />
                  </button>

                  {recommended.canReject && (
                    <button
                      type="button"
                      onClick={() => handleSelectStepStatus('REFUSEE')}
                      className={`inline-flex items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition ${
                        selectedStatus === 'REFUSEE'
                          ? 'bg-[#dc2626] text-white'
                          : 'border border-[#fecaca] bg-white text-[#dc2626] hover:bg-[#fef2f2]'
                      }`}
                    >
                      <XCircle size={13} /> Refuser
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Choix explicite Accepter / Refuser si on est sur l'étape 5 (Décision finale) */}
            {(selectedStatus === 'ACCEPTEE' ||
              selectedStatus === 'REFUSEE' ||
              candidature.statut === 'ENTRETIEN') && (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSelectStepStatus('ACCEPTEE')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold transition ${
                    selectedStatus === 'ACCEPTEE'
                      ? 'border-[#16a34a] bg-[#16a34a] text-white'
                      : 'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d] hover:bg-[#dcfce7]'
                  }`}
                >
                  <CheckCircle2 size={14} /> Retenir le candidat
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectStepStatus('REFUSEE')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold transition ${
                    selectedStatus === 'REFUSEE'
                      ? 'border-[#dc2626] bg-[#dc2626] text-white'
                      : 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c] hover:bg-[#fee2e2]'
                  }`}
                >
                  <XCircle size={14} /> Refuser le dossier
                </button>
              </div>
            )}

            {/* Indication claire sur l'affichage côté candidat en cas de validation directe */}
            {selectedStatus === 'ACCEPTEE' && savedStepIdx < 3 && (
              <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] p-3 text-[11px] font-medium text-[#166534]">
                <strong>Validation séquentielle automatique :</strong> En acceptant ce candidat maintenant, toutes les étapes préalables (Reçue → En examen → Présélectionnée → Entretien) seront automatiquement cochées comme validées (✓) dans le suivi du candidat.
              </div>
            )}

            {selectedStatus === 'REFUSEE' && savedStepIdx < 3 && (
              <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] p-3 text-[11px] font-medium text-[#991b1b]">
                <strong>Suivi côté candidat :</strong> Seules les étapes réellement franchies jusqu'ici seront cochées (✓) ; les étapes suivantes (ex. Entretien) apparaîtront comme « Non franchie (—) » avant la décision finale.
              </div>
            )}

            {/* Paramètres de convocation si Étape 4 (ENTRETIEN) sélectionnée */}
            {selectedStatus === 'ENTRETIEN' && (
              <div className="rounded-xl border border-[#fde68a] bg-[#fffbeb] p-3.5 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#b45309]">
                  <Video size={14} /> Planification de l'entretien (Étape 4)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-[#92400e] mb-1">Date</label>
                    <input
                      type="date"
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                      className="w-full rounded-lg border border-[#fcd34d] bg-white px-2.5 py-1.5 text-xs font-bold text-[#0f172a]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#92400e] mb-1">Heure</label>
                    <input
                      type="time"
                      value={interviewTime}
                      onChange={(e) => setInterviewTime(e.target.value)}
                      className="w-full rounded-lg border border-[#fcd34d] bg-white px-2.5 py-1.5 text-xs font-bold text-[#0f172a]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['VISIO', 'PRESENTIEL', 'TELEPHONE'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setInterviewType(t)}
                      className={`rounded-lg py-1.5 text-[11px] font-bold ${
                        interviewType === t
                          ? 'bg-[#d97706] text-white'
                          : 'bg-white text-[#92400e] border border-[#fcd34d]'
                      }`}
                    >
                      {t === 'VISIO' ? 'Visio' : t === 'PRESENTIEL' ? 'Présentiel' : 'Téléphone'}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#92400e] mb-1">
                    Lien visio ou adresse
                  </label>
                  <input
                    type="text"
                    value={interviewLink}
                    onChange={(e) => setInterviewLink(e.target.value)}
                    className="w-full rounded-lg border border-[#fcd34d] bg-white px-2.5 py-1.5 text-xs text-[#0f172a]"
                  />
                </div>
              </div>
            )}

            {/* Message officiel transmis au candidat */}
            <div>
              <label className="block text-[11px] font-bold text-[#475569] mb-1">
                Message officiel transmis au candidat (visible dans ses résultats et sa messagerie)
              </label>
              <textarea
                rows={4}
                value={candidateFeedback}
                onChange={(e) => setCandidateFeedback(e.target.value)}
                placeholder="Message ou motif transmis au candidat..."
                className="w-full rounded-xl border border-[#cbd5e1] bg-[#f8fafc] p-3 text-xs text-[#0f172a] outline-none focus:border-[#4f46e5] focus:bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#4f46e5] px-4 py-3 text-xs font-bold text-white shadow-xs hover:bg-[#4338ca] transition"
            >
              <Send size={14} /> Confirmer et enregistrer l’étape ({selectedStatus})
            </button>
          </form>

          {/* Notes internes RH */}
          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 border-b border-[#f1f5f9] pb-2.5">
              <MessageSquare size={15} className="text-[#4f46e5]" />
              <h2 className="text-sm font-black text-[#0f172a]">
                Notes internes ({candidature.notes_internes?.length || 0})
              </h2>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {(candidature.notes_internes || []).length === 0 ? (
                <p className="text-xs text-[#94a3b8] italic">Aucune note interne pour ce dossier.</p>
              ) : (
                (candidature.notes_internes || []).map((note) => (
                  <div
                    key={note.id}
                    className="rounded-xl border border-[#f1f5f9] bg-[#f8fafc] p-3 text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-[#0f172a]">
                      <span>
                        {note.auteur
                          ? `${note.auteur.prenom} ${note.auteur.nom}`
                          : 'Équipe Recrutement'}
                      </span>
                      <span className="text-[10px] text-[#64748b]">{note.created_at}</span>
                    </div>
                    <p className="mt-1 text-[#334155]">{note.contenu}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddInternalNote} className="flex gap-2 pt-1">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Ajouter une note interne d'équipe..."
                className="flex-1 rounded-xl border border-[#cbd5e1] bg-[#f8fafc] px-3 py-2 text-xs text-[#0f172a] outline-none focus:border-[#4f46e5]"
              />
              <button
                type="submit"
                className="rounded-xl bg-[#0f172a] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#1e293b]"
              >
                Ajouter
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* MODALE : RÉSULTAT DE L'ANALYSE IA (CALCULÉE EN ARRIÈRE-PLAN) */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-[#e2e8f0]">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] bg-[#0f172a] px-6 py-4 text-white">
              <div className="flex items-center gap-2.5">
                <Sparkles size={18} className="text-[#818cf8]" />
                <div>
                  <h3 className="text-sm font-black">Résultat de l’Analyse IA Automatique</h3>
                  <p className="text-[11px] text-white/70">
                    Candidat : {prenom} {nom} • Poste : {offre?.titre}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="rounded-lg bg-white/10 p-1.5 text-white hover:bg-white/20"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Score global */}
              <div className="flex items-center justify-between rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
                <div>
                  <div className="text-xs font-bold text-[#64748b] uppercase">
                    Taux d’adéquation avec l’offre
                  </div>
                  <div className="text-xs text-[#334155] mt-0.5">
                    Calculé automatiquement en arrière-plan à partir du CV déposé et des prérequis du poste.
                  </div>
                </div>
                <div
                  className={`rounded-xl px-4 py-2 text-xl font-black ${
                    score >= 80
                      ? 'bg-[#ecfdf5] text-[#059669]'
                      : score >= 65
                      ? 'bg-[#eff6ff] text-[#2563eb]'
                      : 'bg-[#fffbeb] text-[#d97706]'
                  }`}
                >
                  {score}%
                </div>
              </div>

              {/* Synthèse */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">
                  Synthèse du profil
                </h4>
                <p className="rounded-xl border border-[#e2e8f0] bg-white p-3.5 text-xs leading-relaxed text-[#334155]">
                  {analyse?.resume ||
                    `Le profil de ${prenom} ${nom} couvre ${matchedSkills.length} sur ${requiredSkills.length} compétences requises pour le poste de ${offre?.titre || 'Développeur'}.`}
                </p>
              </div>

              {/* Compétences validées vs manquantes */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] p-3.5">
                  <div className="text-xs font-bold text-[#166534] mb-2">
                    Compétences requises détectées ({matchedSkills.length}/{requiredSkills.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {matchedSkills.length > 0 ? (
                      matchedSkills.map((s, i) => (
                        <span
                          key={i}
                          className="rounded-md bg-white px-2.5 py-1 text-xs font-bold text-[#15803d] border border-[#bbf7d0]"
                        >
                          ✓ {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-[#64748b]">Aucune correspondance directe</span>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-[#fed7aa] bg-[#fff7ed] p-3.5">
                  <div className="text-xs font-bold text-[#9a3412] mb-2">
                    Compétences à vérifier en entretien ({missingSkills.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {missingSkills.length > 0 ? (
                      missingSkills.map((s, i) => (
                        <span
                          key={i}
                          className="rounded-md bg-white px-2.5 py-1 text-xs font-bold text-[#c2410c] border border-[#fed7aa]"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-semibold text-[#15803d]">
                        Tous les prérequis sont couverts
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Points forts */}
              {analyse?.points_forts && analyse.points_forts.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">
                    Points clés identifiés
                  </h4>
                  <ul className="space-y-1.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5 text-xs text-[#334155]">
                    {analyse.points_forts.map((pt, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-[#16a34a] shrink-0" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-[#e2e8f0] pt-4">
                <button
                  type="button"
                  onClick={handleTriggerAiRerun}
                  disabled={aiRunning}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#cbd5e1] bg-white px-3.5 py-2 text-xs font-bold text-[#334155] hover:bg-[#f8fafc] disabled:opacity-50"
                >
                  <RefreshCw size={13} className={aiRunning ? 'animate-spin' : ''} />
                  <span>{aiRunning ? 'Actualisation en cours...' : 'Relancer l’analyse'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="rounded-xl bg-[#4f46e5] px-5 py-2 text-xs font-bold text-white hover:bg-[#4338ca]"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALE PLEIN ÉCRAN DU CV DÉPOSÉ */}
      {showFullscreenCv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-[#f1f5f9] shadow-2xl">
            <div className="flex items-center justify-between bg-[#0f172a] px-6 py-4 text-white">
              <div className="flex items-center gap-2 text-sm font-bold">
                <FileText size={16} className="text-[#818cf8]" />
                <span>{cv?.nom_fichier || `CV_${prenom}_${nom}.pdf`}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadCandidateCvFile(candidature)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#4f46e5] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#4338ca]"
                >
                  <Download size={14} /> Télécharger
                </button>
                <button
                  type="button"
                  onClick={() => setShowFullscreenCv(false)}
                  className="rounded-lg bg-white/10 p-1.5 text-white hover:bg-white/20"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <DepositedCvRenderer candidature={candidature} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
