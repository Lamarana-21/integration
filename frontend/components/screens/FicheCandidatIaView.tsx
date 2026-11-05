'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Award,
  Briefcase,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Globe,
  GraduationCap,
  Mail,
  MapPin,
  Maximize2,
  MessageSquare,
  Phone,
  Plus,
  Printer,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tag,
  ThumbsDown,
  ThumbsUp,
  User,
  Video,
  X,
  XCircle,
} from 'lucide-react';
import { ApplicationStatus, Candidature, NoteInterne } from '@/lib/types';

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

export function FicheCandidatIaView({
  candidature,
  onBack,
  onUpdateStatus,
  onAddNote,
  onRerunAi,
}: FicheCandidatIaViewProps) {
  // Navigation d'onglets du lecteur de CV
  const [activeCvTab, setActiveCvTab] = useState<'DOCUMENT' | 'EXTRAITS' | 'MESSAGE'>('DOCUMENT');
  const [showFullscreenCv, setShowFullscreenCv] = useState(false);

  // Décision recruteur
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>(candidature.statut);
  const [candidateFeedback, setCandidateFeedback] = useState<string>(candidature.commentaire_recruteur || '');

  // Planification entretien
  const [interviewDate, setInterviewDate] = useState<string>(
    candidature.date_entretien || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
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
  const [newTag, setNewTag] = useState('À contacter');

  // État de l'analyse IA
  const [aiRunning, setAiRunning] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Données de la candidature
  const analyse = candidature.analyse;
  const candidat = candidature.candidat;
  const user = candidat?.user;
  const cv = candidature.cv;
  const offre = candidature.offre;

  // Détection du type de CV
  const isDynamicCv = cv?.source_type === 'DYNAMIQUE' || cv?.est_genere || cv?.nom_fichier?.includes('Dynamique');

  // Compétences requises par l'offre vs compétences du candidat
  const requiredSkills = offre?.competences_requises || ['React', 'Node.js', 'SQL'];
  const candidateSkills = candidat?.competences || analyse?.infos_extraites?.competences || [];

  const matchedSkills = requiredSkills.filter((req) =>
    candidateSkills.some(
      (cs) => cs.toLowerCase().includes(req.toLowerCase()) || req.toLowerCase().includes(cs.toLowerCase())
    )
  );
  const missingSkills = requiredSkills.filter((req) => !matchedSkills.includes(req));

  const score = analyse?.score_correspondance || 85;

  // Relancer l'analyse IA
  const handleTriggerAiRerun = () => {
    setAiRunning(true);
    setTimeout(() => {
      onRerunAi(candidature.id);
      setAiRunning(false);
      setToastMessage('✨ Analyse IA actualisée avec succès ! Le score et les correspondances ont été recalculés.');
      setTimeout(() => setToastMessage(''), 5000);
    }, 1200);
  };

  // Enregistrer la décision finale
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
    setToastMessage(`✅ Décision enregistrée : Statut passé à « ${selectedStatus} ». Le candidat a été notifié.`);
    setTimeout(() => setToastMessage(''), 5000);
  };

  // Modèles de messages prédéfinis
  const applyTemplate = (type: 'ENTRETIEN' | 'ACCEPTEE' | 'REFUSEE') => {
    const prenom = user?.prenom || 'Candidat(e)';
    const poste = offre?.titre || 'le poste';
    const entreprise = offre?.entreprise?.nom || 'notre entreprise';

    if (type === 'ENTRETIEN') {
      setSelectedStatus('ENTRETIEN');
      setCandidateFeedback(
        `Bonjour ${prenom},\n\nNous avons examiné votre CV avec grand intérêt. Vos compétences correspondent à nos besoins pour le poste de ${poste} chez ${entreprise}.\n\nNous serions ravis d'échanger avec vous lors d'un entretien le ${interviewDate} à ${interviewTime} (${interviewType === 'VISIO' ? 'en visio' : 'dans nos locaux'}).\n\nAu plaisir d'échanger prochainement,\nL'équipe de recrutement ${entreprise}`
      );
    } else if (type === 'ACCEPTEE') {
      setSelectedStatus('ACCEPTEE');
      setCandidateFeedback(
        `Bonjour ${prenom},\n\nNous avons le plaisir de vous informer que votre candidature au poste de ${poste} chez ${entreprise} a été retenue !\n\nVotre parcours et vos compétences ont particulièrement séduit notre équipe. Notre département RH prendra contact avec vous d'ici 24h pour finaliser votre proposition d'embauche.\n\nBienvenue parmi nous,\nL'équipe RH ${entreprise}`
      );
    } else if (type === 'REFUSEE') {
      setSelectedStatus('REFUSEE');
      setCandidateFeedback(
        `Bonjour ${prenom},\n\nNous vous remercions pour l'intérêt que vous portez à ${entreprise} et pour le temps accordé à votre candidature au poste de ${poste}.\n\nAprès examen attentif de votre profil, nous avons décidé de retenir un profil dont les compétences correspondent plus étroitement à nos critères actuels.\n\nNous conservons votre CV dans notre vivier de talents pour de futures opportunités et vous souhaitons une excellente continuation dans vos projets professionnels.`
      );
    }
  };

  // Ajouter une note interne
  const handleAddInternalNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddNote(candidature.id, newNote.trim(), [newTag]);
    setNewNote('');
    setToastMessage('📝 Note interne RH enregistrée.');
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Rendu du CV Complet Haute Définition
  const renderCompleteCvDocument = () => {
    return (
      <div className="rounded-2xl border border-[#e5e8f2] bg-white p-6 sm:p-8 shadow-xs text-[#1e2638] font-sans">
        {/* En-tête CV avec avatar, identité et coordonnées */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#f0f2f7] pb-6">
          <div className="flex items-start gap-4">
            <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#594be0] to-[#7b6ef6] text-xl font-black text-white shadow-md">
              {user?.prenom?.[0] || 'C'}{user?.nom?.[0] || 'D'}
            </div>
            <div>
              <h2 className="text-xl font-black text-[#151c2e]">
                {user?.prenom || 'Prénom'} {user?.nom || 'Nom'}
              </h2>
              <div className="text-xs font-bold text-[#594be0] mt-0.5">
                {candidat?.titre || 'Développeur / Professionnel du numérique'}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-y-1 gap-x-3 text-[11px] text-[#697288]">
                <span className="flex items-center gap-1">
                  <Mail size={12} className="text-[#98a1b6]" /> {user?.email}
                </span>
                {candidat?.telephone && (
                  <span className="flex items-center gap-1">
                    <Phone size={12} className="text-[#98a1b6]" /> {candidat.telephone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <MapPin size={12} className="text-[#98a1b6]" /> {candidat?.ville || 'Tunisie'}
                </span>
              </div>
            </div>
          </div>

          {/* Liens professionnels cliquables */}
          <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
            {candidat?.linkedin_url && (
              <a
                href={candidat.linkedin_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-[#f0f4ff] px-2.5 py-1 text-[11px] font-bold text-[#0a66c2] hover:bg-[#e4eeff]"
              >
                <Globe size={11} /> LinkedIn <ExternalLink size={10} />
              </a>
            )}
            {candidat?.github_url && (
              <a
                href={candidat.github_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-[#f5f6fa] px-2.5 py-1 text-[11px] font-bold text-[#24292f] hover:bg-[#e9ecf4]"
              >
                <Globe size={11} /> GitHub <ExternalLink size={10} />
              </a>
            )}
            {candidat?.portfolio_url && (
              <a
                href={candidat.portfolio_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-[#f7f5ff] px-2.5 py-1 text-[11px] font-bold text-[#594be0] hover:bg-[#eeeaff]"
              >
                <Globe size={11} /> Portfolio <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>

        {/* Résumé Professionnel / Pitch */}
        <div className="mt-5 border-b border-[#f0f2f7] pb-5">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#798399] mb-2 flex items-center gap-1.5">
            <User size={13} className="text-[#594be0]" /> Profil & Objectif professionnel
          </h3>
          <p className="text-xs leading-relaxed text-[#434b60]">
            {candidat?.resume ||
              'Professionnel motivé, disposant de bases solides et d\'une passion pour les technologies modernes, la rigueur logicielle et la collaboration au sein d\'équipes agiles.'}
          </p>
        </div>

        {/* Compétences avec indication de correspondance avec l'offre */}
        <div className="mt-5 border-b border-[#f0f2f7] pb-5">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#798399] mb-2.5 flex items-center gap-1.5">
            <Sparkles size={13} className="text-[#594be0]" /> Compétences & Technologies
          </h3>
          <div className="flex flex-wrap gap-2">
            {candidateSkills.map((skill) => {
              const matchesOffer = requiredSkills.some((r) =>
                r.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(r.toLowerCase())
              );
              return (
                <span
                  key={skill}
                  className={`inline-flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-bold transition ${
                    matchesOffer
                      ? 'bg-[#eefaf3] text-[#1c834a] border border-[#c1e9cf] shadow-2xs'
                      : 'bg-[#f4f5f9] text-[#4d566d] border border-[#e5e8f2]'
                  }`}
                >
                  {matchesOffer && <Check size={12} className="text-[#1c834a] stroke-[3]" />}
                  {skill}
                  {matchesOffer && (
                    <span className="ml-1 rounded-full bg-[#cbf0d8] px-1.5 py-0.2 text-[9px] font-black uppercase text-[#126b38]">
                      Requis
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </div>

        {/* Expériences professionnelles */}
        <div className="mt-5 border-b border-[#f0f2f7] pb-5">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#798399] mb-3 flex items-center gap-1.5">
            <Briefcase size={13} className="text-[#594be0]" /> Expériences professionnelles
          </h3>
          {candidat?.experiences && candidat.experiences.length > 0 ? (
            <div className="space-y-4">
              {candidat.experiences.map((exp, idx) => (
                <div key={idx} className="relative pl-5 before:absolute before:left-1 before:top-1.5 before:size-2 before:rounded-full before:bg-[#594be0] border-l-2 border-[#e9ebf4] pb-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                    <span className="text-xs font-black text-[#151c2e]">{exp.poste}</span>
                    <span className="text-[11px] font-bold text-[#8993a8]">{exp.dates}</span>
                  </div>
                  <div className="text-[11px] font-semibold text-[#594be0]">{exp.employeur}</div>
                  <p className="mt-1 text-xs text-[#50596e] leading-relaxed">{exp.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-[#8993a8] italic">Aucune expérience renseignée.</div>
          )}
        </div>

        {/* Formations & Diplômes */}
        <div className="mt-5 border-b border-[#f0f2f7] pb-5">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#798399] mb-3 flex items-center gap-1.5">
            <GraduationCap size={14} className="text-[#594be0]" /> Formations & Certifications
          </h3>
          {candidat?.formations && candidat.formations.length > 0 ? (
            <div className="space-y-3">
              {candidat.formations.map((form, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs">
                  <div>
                    <span className="font-extrabold text-[#171f33]">{form.diplome}</span>
                    <span className="text-[#7d869c]"> · {form.ecole}</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#8c95aa]">{form.annee}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-[#8993a8] italic">Aucune formation renseignée.</div>
          )}
        </div>

        {/* Langues & Préférences */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#798399] mb-2 flex items-center gap-1.5">
              <Globe size={13} className="text-[#594be0]" /> Langues
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {(candidat?.langues || ['Français', 'Anglais']).map((langue) => (
                <span key={langue} className="rounded-lg bg-[#f4f5fa] px-2.5 py-1 text-[11px] font-semibold text-[#485065]">
                  {langue}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#798399] mb-2 flex items-center gap-1.5">
              <Award size={13} className="text-[#594be0]" /> Préférences de travail
            </h3>
            <div className="space-y-1 text-[11px] text-[#555e73]">
              <div><strong>Disponibilité :</strong> {candidat?.disponibilite || 'Immédiate'}</div>
              <div><strong>Mode de travail :</strong> {candidat?.teletravail_souhaite || 'Hybride'}</div>
              {candidat?.pretention_salariale && (
                <div><strong>Prétentions :</strong> {candidat.pretention_salariale}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      {/* Toast de confirmation */}
      {toastMessage && (
        <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-[#c3edd4] bg-[#edf9f3] p-4 text-xs font-bold text-[#1e844b] shadow-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={18} className="shrink-0 text-[#1e844b]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Barre supérieure de navigation & informations (E10) */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#eef1f7] pb-5 lg:flex-row lg:items-center">
        <div className="flex items-center gap-3.5">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-2xl border border-[#dde1ee] bg-white px-3.5 py-2.5 text-xs font-extrabold text-[#5547d7] shadow-2xs hover:bg-[#fafbfc]"
          >
            <ChevronLeft size={16} /> Liste des candidatures
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black text-[#171f33]">
                {user?.prenom} {user?.nom}
              </h1>
              <span className="rounded-full bg-[#f0efff] px-2.5 py-0.5 text-[11px] font-black text-[#594be0]">
                {candidat?.titre || 'Candidat'}
              </span>
            </div>
            <div className="text-[11px] text-[#818a9e] mt-0.5">
              Poste visé : <strong>{offre?.titre || 'Offre'}</strong> · Reçu le {candidature.created_at} · {user?.email}
            </div>
          </div>
        </div>

        {/* Statut actuel avec badge coloré */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#6a7388]">État du dossier :</span>
          <span
            className={`rounded-2xl px-3.5 py-1.5 text-xs font-black shadow-2xs ${
              candidature.statut === 'RECUE'
                ? 'bg-[#f0efff] text-[#594be0] border border-[#e1ddff]'
                : candidature.statut === 'EN_EXAMEN'
                ? 'bg-[#e8f1ff] text-[#2b6bc5] border border-[#cde0ff]'
                : candidature.statut === 'PRESELECTIONNEE'
                ? 'bg-[#e7f7ef] text-[#218d53] border border-[#c1e8d3]'
                : candidature.statut === 'ENTRETIEN'
                ? 'bg-[#fff5e0] text-[#b87d15] border border-[#fae5be]'
                : candidature.statut === 'ACCEPTEE'
                ? 'bg-[#ddf8ea] text-[#147a40] border border-[#b2ecca]'
                : 'bg-[#ffebee] text-[#cf3838] border border-[#fccfcf]'
            }`}
          >
            {candidature.statut}
          </span>
        </div>
      </div>

      {/* Badge de provenance du CV (CV Dynamique vs Fichier importé) */}
      <div className="mt-6 rounded-2xl border border-[#e4e7f2] bg-[#fafbfc] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`grid size-10 place-items-center rounded-xl font-black ${
              isDynamicCv ? 'bg-[#594be0] text-white shadow-xs' : 'bg-[#e2e6f0] text-[#424a5e]'
            }`}
          >
            {isDynamicCv ? <Sparkles size={20} /> : <FileText size={20} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-[#171f33]">
                {isDynamicCv ? 'CV Dynamique de l\'application (Talenta CV Studio)' : 'Document CV importé depuis le poste du candidat'}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                  isDynamicCv ? 'bg-[#eeeaff] text-[#5547d7]' : 'bg-[#e8ebf4] text-[#555e73]'
                }`}
              >
                {isDynamicCv ? 'Standardisé ATS' : 'Fichier Téléversé'}
              </span>
            </div>
            <p className="text-[11px] text-[#717a90]">
              Fichier source : <strong>{cv?.nom_fichier || 'CV_Candidat.pdf'}</strong> ({Math.round((cv?.taille_octets || 1200000) / 1024)} Ko) · Format {cv?.type_mime || 'application/pdf'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFullscreenCv(true)}
            className="flex items-center gap-1.5 rounded-xl border border-[#dde1ed] bg-white px-3 py-1.5 text-xs font-bold text-[#4e566c] shadow-2xs hover:bg-[#f7f8fc]"
          >
            <Maximize2 size={13} /> Plein écran
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-xl border border-[#dde1ed] bg-white px-3 py-1.5 text-xs font-bold text-[#4e566c] shadow-2xs hover:bg-[#f7f8fc]"
          >
            <Printer size={13} /> Imprimer
          </button>
          <button
            onClick={() => alert(`Téléchargement sécurisé du CV : ${cv?.nom_fichier || 'CV.pdf'}`)}
            className="flex items-center gap-1.5 rounded-xl bg-[#594be0] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#483ad3]"
          >
            <Download size={13} /> Télécharger
          </button>
        </div>
      </div>

      {/* Disposition principale : Colonne Gauche (Lecteur CV & Message) | Colonne Droite (IA & Décision finale) */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        {/* COLONNE GAUCHE : LECTEUR DU CV ET MOTIVATION */}
        <div className="space-y-6">
          {/* Navigation d'onglets du lecteur */}
          <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#f0f2f7] pb-4">
              <div className="flex items-center gap-2">
                <FileCheck size={18} className="text-[#594be0]" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#171f33]">
                  Lecture intégrale du CV
                </h3>
              </div>

              {/* Onglets */}
              <div className="flex items-center gap-1 rounded-xl bg-[#f5f6fa] p-1 text-xs">
                <button
                  onClick={() => setActiveCvTab('DOCUMENT')}
                  className={`rounded-lg px-3 py-1 font-extrabold transition ${
                    activeCvTab === 'DOCUMENT'
                      ? 'bg-white text-[#594be0] shadow-xs'
                      : 'text-[#6b7489] hover:text-[#182035]'
                  }`}
                >
                  Document complet
                </button>
                <button
                  onClick={() => setActiveCvTab('EXTRAITS')}
                  className={`rounded-lg px-3 py-1 font-extrabold transition ${
                    activeCvTab === 'EXTRAITS'
                      ? 'bg-white text-[#594be0] shadow-xs'
                      : 'text-[#6b7489] hover:text-[#182035]'
                  }`}
                >
                  Données ATS
                </button>
                {candidature.lettre_motivation && (
                  <button
                    onClick={() => setActiveCvTab('MESSAGE')}
                    className={`rounded-lg px-3 py-1 font-extrabold transition ${
                      activeCvTab === 'MESSAGE'
                        ? 'bg-white text-[#594be0] shadow-xs'
                        : 'text-[#6b7489] hover:text-[#182035]'
                    }`}
                  >
                    Motivation
                  </button>
                )}
              </div>
            </div>

            {/* Contenu de l'onglet actif */}
            <div className="mt-4">
              {activeCvTab === 'DOCUMENT' && renderCompleteCvDocument()}

              {activeCvTab === 'EXTRAITS' && (
                <div className="space-y-4 rounded-2xl border border-[#eef1f7] bg-[#fafbfc] p-6 text-xs">
                  <div>
                    <span className="font-extrabold text-[#6d768c] uppercase tracking-wider text-[10px]">
                      Compétences détectées ({candidateSkills.length}) :
                    </span>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {candidateSkills.map((c) => (
                        <span key={c} className="rounded-lg bg-[#eeeaff] px-2.5 py-1 text-xs font-bold text-[#5547d7]">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#edf0f7]">
                    <span className="font-extrabold text-[#6d768c] uppercase tracking-wider text-[10px]">
                      Parcours & Expériences :
                    </span>
                    <div className="mt-2 space-y-2">
                      {candidat?.experiences?.map((exp, i) => (
                        <div key={i} className="rounded-xl border border-[#e5e8f2] bg-white p-3">
                          <div className="font-bold text-[#182035]">{exp.poste} — {exp.employeur}</div>
                          <div className="text-[11px] text-[#7b849a]">{exp.dates}</div>
                          <p className="mt-1 text-xs text-[#525a6f]">{exp.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#edf0f7]">
                    <span className="font-extrabold text-[#6d768c] uppercase tracking-wider text-[10px]">
                      Formations :
                    </span>
                    <div className="mt-2 space-y-1.5">
                      {candidat?.formations?.map((form, i) => (
                        <div key={i} className="rounded-xl border border-[#e5e8f2] bg-white p-2.5">
                          <strong>{form.diplome}</strong> ({form.annee}) · {form.ecole}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeCvTab === 'MESSAGE' && (
                <div className="rounded-2xl border border-[#e4dffd] bg-[#f9f8ff] p-6 text-xs">
                  <div className="flex items-center gap-2 font-black text-[#5547d7]">
                    <MessageSquare size={16} /> Lettre de motivation ou mot du candidat :
                  </div>
                  <blockquote className="mt-3 text-xs leading-relaxed text-[#3b4356] italic border-l-3 border-[#594be0] pl-4">
                    « {candidature.lettre_motivation || 'Aucun message particulier fourni.'} »
                  </blockquote>
                </div>
              )}
            </div>
          </div>

          {/* Notes Internes RH (Module 8.4) */}
          <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-[#f1f3f8] pb-3">
              <MessageSquare size={16} className="text-[#594be0]" />
              <h3 className="text-xs font-extrabold text-[#171f33] uppercase tracking-wider">
                Notes d'équipe internes RH
              </h3>
            </div>

            <div className="mt-4 space-y-3">
              {candidature.notes_internes && candidature.notes_internes.length > 0 ? (
                candidature.notes_internes.map((note) => (
                  <div key={note.id} className="rounded-2xl border border-[#edf0f7] bg-[#fafbfc] p-3.5 text-xs">
                    <div className="flex items-center justify-between font-bold text-[#1f2638]">
                      <span>{note.auteur?.prenom || 'Recruteur'} {note.auteur?.nom || ''}</span>
                      <span className="text-[#8892a7] font-normal">{note.created_at}</span>
                    </div>
                    <p className="mt-1 text-[#4a5266]">{note.contenu}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {note.etiquettes?.map((t) => (
                        <span key={t} className="rounded-md bg-[#eeeaff] px-2 py-0.5 text-[10px] font-bold text-[#5547d7]">
                          🏷️ {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-[#8d95ab] italic">
                  Aucune note interne pour ce profil. Vous pouvez consigner vos impressions ci-dessous.
                </div>
              )}
            </div>

            <form onSubmit={handleAddInternalNote} className="mt-4 pt-3 border-t border-[#f0f2f7]">
              <textarea
                rows={2}
                value={newNote ?? ''}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Ajouter une observation privée pour les recruteurs..."
                className="w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] p-2.5 text-xs outline-none focus:border-[#594be0]"
              />
              <div className="mt-2 flex items-center justify-between">
                <select
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="rounded-lg border border-[#e0e3ed] bg-white px-2 py-1 text-[11px] font-bold text-[#5c6479] outline-none"
                >
                  <option value="À contacter">À contacter</option>
                  <option value="Entretien tech">Entretien tech</option>
                  <option value="Salaire à négocier">Salaire à négocier</option>
                  <option value="Profil favori">Profil favori</option>
                </select>

                <button
                  type="submit"
                  className="rounded-xl bg-[#594be0] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#483ad3]"
                >
                  Enregistrer la note
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* COLONNE DROITE : ANALYSE IA & DÉCISION FINALE DU RECRUTEUR */}
        <div className="space-y-6">
          {/* CARTE D'ANALYSE IA & SCORING */}
          <div className="rounded-3xl border border-[#dcd8fd] bg-gradient-to-b from-[#f9f8ff] via-white to-white p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#ece8fc] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="grid size-9 place-items-center rounded-xl bg-[#594be0] text-white shadow-sm">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#171f33]">
                    Analyse & Scoring IA
                  </h3>
                  <div className="text-[10px] text-[#7d869d]">
                    Modèle {analyse?.version_modele || 'Talenta-AI-v2.1'} · Scan ATS
                  </div>
                </div>
              </div>

              <button
                onClick={handleTriggerAiRerun}
                disabled={aiRunning}
                className="flex items-center gap-1.5 rounded-xl border border-[#d6d0fa] bg-white px-3 py-1.5 text-xs font-bold text-[#5547d7] shadow-2xs hover:bg-[#f2f0ff] disabled:opacity-50"
              >
                <RefreshCw size={13} className={aiRunning ? 'animate-spin' : ''} />
                {aiRunning ? 'Calcul en cours...' : 'Relancer l\'IA'}
              </button>
            </div>

            {/* Score de correspondance & Confiance */}
            <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#f2f0ff] p-5">
              <div>
                <div className="text-[10px] font-black text-[#6d669e] uppercase tracking-wider">
                  Score de correspondance ATS
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span
                    className={`text-4xl font-black ${
                      score >= 80 ? 'text-[#1c844a]' : score >= 65 ? 'text-[#594be0]' : 'text-[#b87d15]'
                    }`}
                  >
                    {score}
                  </span>
                  <span className="text-sm font-semibold text-[#8b84bf]">/ 100</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] font-black text-[#6d669e] uppercase tracking-wider">
                  Niveau de confiance
                </div>
                <span className="inline-block mt-1.5 rounded-full bg-white px-3 py-1 text-xs font-black text-[#5547d7] shadow-2xs">
                  {analyse?.niveau_confiance || 'ELEVE'}
                </span>
              </div>
            </div>

            {/* Synthèse IA */}
            <div className="mt-5">
              <div className="text-xs font-extrabold text-[#1b2337]">
                Synthèse de matching générée par l'IA :
              </div>
              <p className="mt-1.5 text-xs leading-5 text-[#50596e]">
                {analyse?.resume ||
                  `Le profil démontre une excellente adéquation technique avec les critères requis pour le poste de ${offre?.titre || 'Développeur'}.`}
              </p>
            </div>

            {/* Compétences requises : Validées vs Manquantes */}
            <div className="mt-5 space-y-3 rounded-2xl border border-[#eaedf6] bg-[#fafbfc] p-4 text-xs">
              <div className="font-extrabold text-[#192134]">
                Adéquation des compétences requises par l'offre :
              </div>

              {/* Validées */}
              <div>
                <div className="text-[11px] font-bold text-[#1c844a] flex items-center gap-1">
                  <CheckCircle2 size={13} /> Compétences validées ({matchedSkills.length}/{requiredSkills.length}) :
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {matchedSkills.map((s) => (
                    <span key={s} className="rounded-lg bg-[#ddf6e6] px-2.5 py-0.5 text-[11px] font-bold text-[#147a40]">
                      ✓ {s}
                    </span>
                  ))}
                  {matchedSkills.length === 0 && (
                    <span className="text-[11px] text-[#8e97ac] italic">Aucune correspondance directe</span>
                  )}
                </div>
              </div>

              {/* Manquantes */}
              {missingSkills.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-[#c78216] flex items-center gap-1">
                    <AlertCircle size={13} /> Compétences non mentionnées ou à valider ({missingSkills.length}) :
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {missingSkills.map((s) => (
                      <span key={s} className="rounded-lg bg-[#fff4de] px-2.5 py-0.5 text-[11px] font-bold text-[#b0730d]">
                        ⚠ {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Points forts */}
            <div className="mt-5">
              <div className="text-xs font-extrabold text-[#1c844a] flex items-center gap-1">
                <ThumbsUp size={13} /> Points forts majeurs :
              </div>
              <ul className="mt-2 space-y-1.5 text-xs text-[#3b4356]">
                {(analyse?.points_forts || ['Compétences alignées avec le besoin', 'Expérience démontrée']).map((pf, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-bold text-[#1c844a]">+</span>
                    <span>{pf}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Points d'attention */}
            {analyse?.points_manquants && analyse.points_manquants.length > 0 && (
              <div className="mt-5">
                <div className="text-xs font-extrabold text-[#cf3838] flex items-center gap-1">
                  <ThumbsDown size={13} /> Points à explorer en entretien :
                </div>
                <ul className="mt-2 space-y-1.5 text-xs text-[#3b4356]">
                  {analyse.points_manquants.map((pm, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-bold text-[#cf3838]">-</span>
                      <span>{pm}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Avis consultatif & Éthique */}
            <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-[#f3e1b7] bg-[#fffbf2] p-3.5 text-[11px] leading-4 text-[#8a681d]">
              <ShieldAlert size={18} className="shrink-0 text-[#b5851b]" />
              <div>
                <strong>Aide consultative :</strong> L'analyse IA est fournie à titre indicatif pour accélérer votre tri. La décision finale d'embauche ou de refus revient souverainement à l'équipe de recrutement humaine.
              </div>
            </div>
          </div>

          {/* PANNEAU DE DÉCISION FINALE DU RECRUTEUR */}
          <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs">
            <h3 className="text-xs font-extrabold text-[#171f33] uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-[#594be0]" /> Décision finale de recrutement
            </h3>
            <p className="mt-1 text-xs text-[#7e879c]">
              Attribuez le statut du dossier. Le candidat recevra un message et une notification en direct.
            </p>

            {/* Sélecteur de statut interactif */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setSelectedStatus('EN_EXAMEN')}
                className={`rounded-xl py-2.5 px-2 text-center transition border ${
                  selectedStatus === 'EN_EXAMEN'
                    ? 'border-[#3572d4] bg-[#e8f1ff] text-[#2458a6] shadow-2xs font-black'
                    : 'border-[#e4e7f1] bg-white text-[#565e74] hover:bg-[#fafbfc]'
                }`}
              >
                En examen
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('PRESELECTIONNEE')}
                className={`rounded-xl py-2.5 px-2 text-center transition border ${
                  selectedStatus === 'PRESELECTIONNEE'
                    ? 'border-[#2da061] bg-[#e7f7ef] text-[#1c7845] shadow-2xs font-black'
                    : 'border-[#e4e7f1] bg-white text-[#565e74] hover:bg-[#fafbfc]'
                }`}
              >
                Présélectionner
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedStatus('ENTRETIEN');
                  if (!candidateFeedback) applyTemplate('ENTRETIEN');
                }}
                className={`rounded-xl py-2.5 px-2 text-center transition border ${
                  selectedStatus === 'ENTRETIEN'
                    ? 'border-[#b87d15] bg-[#fff4de] text-[#915e06] shadow-2xs font-black'
                    : 'border-[#e4e7f1] bg-white text-[#565e74] hover:bg-[#fafbfc]'
                }`}
              >
                📅 Entretien
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedStatus('ACCEPTEE');
                  if (!candidateFeedback) applyTemplate('ACCEPTEE');
                }}
                className={`rounded-xl py-2.5 px-2 text-center transition border ${
                  selectedStatus === 'ACCEPTEE'
                    ? 'border-[#1b8146] bg-[#dcfce7] text-[#156b38] shadow-2xs font-black'
                    : 'border-[#e4e7f1] bg-white text-[#565e74] hover:bg-[#fafbfc]'
                }`}
              >
                ✓ Accepter
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedStatus('REFUSEE');
                  if (!candidateFeedback) applyTemplate('REFUSEE');
                }}
                className={`rounded-xl py-2.5 px-2 text-center transition border ${
                  selectedStatus === 'REFUSEE'
                    ? 'border-[#cf3838] bg-[#fee2e2] text-[#b91c1c] shadow-2xs font-black'
                    : 'border-[#e4e7f1] bg-white text-[#565e74] hover:bg-[#fafbfc]'
                }`}
              >
                ✕ Refuser
              </button>
            </div>

            {/* Planificateur d'entretien si le statut ENTRETIEN est choisi */}
            {selectedStatus === 'ENTRETIEN' && (
              <div className="mt-4 rounded-2xl border border-[#fce4ba] bg-[#fffaf0] p-4 text-xs space-y-3 animate-in fade-in">
                <div className="flex items-center gap-1.5 font-extrabold text-[#966308]">
                  <Calendar size={14} /> Planifier l'entretien avec le candidat
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-[#677085] block mb-1">Date :</label>
                    <input
                      type="date"
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                      className="w-full rounded-xl border border-[#eed4a7] bg-white p-2 text-xs font-bold text-[#1a2133] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#677085] block mb-1">Heure :</label>
                    <input
                      type="time"
                      value={interviewTime}
                      onChange={(e) => setInterviewTime(e.target.value)}
                      className="w-full rounded-xl border border-[#eed4a7] bg-white p-2 text-xs font-bold text-[#1a2133] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#677085] block mb-1">Format de l'échange :</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setInterviewType('VISIO')}
                      className={`flex-1 rounded-lg py-1.5 text-[11px] font-bold border ${
                        interviewType === 'VISIO' ? 'bg-[#594be0] text-white border-[#594be0]' : 'bg-white border-[#e0e3ed] text-[#4d556c]'
                      }`}
                    >
                      Visio
                    </button>
                    <button
                      type="button"
                      onClick={() => setInterviewType('PRESENTIEL')}
                      className={`flex-1 rounded-lg py-1.5 text-[11px] font-bold border ${
                        interviewType === 'PRESENTIEL' ? 'bg-[#594be0] text-white border-[#594be0]' : 'bg-white border-[#e0e3ed] text-[#4d556c]'
                      }`}
                    >
                      Sur place
                    </button>
                    <button
                      type="button"
                      onClick={() => setInterviewType('TELEPHONE')}
                      className={`flex-1 rounded-lg py-1.5 text-[11px] font-bold border ${
                        interviewType === 'TELEPHONE' ? 'bg-[#594be0] text-white border-[#594be0]' : 'bg-white border-[#e0e3ed] text-[#4d556c]'
                      }`}
                    >
                      Téléphone
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#677085] block mb-1">
                    {interviewType === 'VISIO' ? 'Lien de la visioconférence (Google Meet / Teams) :' : 'Lieu du rendez-vous :'}
                  </label>
                  <input
                    type="text"
                    value={interviewLink}
                    onChange={(e) => setInterviewLink(e.target.value)}
                    placeholder={interviewType === 'VISIO' ? 'https://meet.google.com/...' : 'Bureaux de l\'entreprise'}
                    className="w-full rounded-xl border border-[#eed4a7] bg-white p-2 text-xs text-[#1a2133] outline-none"
                  />
                </div>
              </div>
            )}

            {/* Modèles de réponse rapide */}
            <div className="mt-4 pt-4 border-t border-[#f0f2f7]">
              <div className="text-[11px] font-bold text-[#6b7389] mb-2">
                Modèles de message instantané en 1 clic :
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => applyTemplate('ENTRETIEN')}
                  className="rounded-lg bg-[#f0efff] px-2.5 py-1 text-[11px] font-bold text-[#594be0] hover:bg-[#e4e0ff]"
                >
                  📅 Convoquer entretien
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('ACCEPTEE')}
                  className="rounded-lg bg-[#e7f7ef] px-2.5 py-1 text-[11px] font-bold text-[#1f844b] hover:bg-[#d6f2e2]"
                >
                  🎉 Retenir & Offre
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('REFUSEE')}
                  className="rounded-lg bg-[#feebe8] px-2.5 py-1 text-[11px] font-bold text-[#cf3838] hover:bg-[#fcd7d1]"
                >
                  🙏 Refus bienveillant
                </button>
              </div>
            </div>

            {/* Feedback / Commentaire envoyé au candidat */}
            <form onSubmit={handleSaveDecision} className="mt-3 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#5b6379] block mb-1">
                  Message personnalisé adressé au candidat :
                </label>
                <textarea
                  rows={4}
                  value={candidateFeedback ?? ''}
                  onChange={(e) => setCandidateFeedback(e.target.value)}
                  placeholder="Écrivez un retour personnalisé qui sera visible par le candidat dans son espace..."
                  className="w-full rounded-2xl border border-[#dfe3ee] bg-[#fafbfc] p-3 text-xs outline-none focus:border-[#594be0] focus:bg-white leading-relaxed"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-[#594be0] py-3 text-xs font-black text-white shadow-md hover:bg-[#483ad3] flex items-center justify-center gap-2"
              >
                <Send size={14} /> Enregistrer la décision & Notifier le candidat
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* MODALE PLEIN ÉCRAN POUR LECTURE IMMERSIVE DU CV */}
      {showFullscreenCv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative my-6 w-full max-w-4xl rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#f0f2f7] pb-4 mb-6">
              <div className="flex items-center gap-2">
                <FileCheck size={20} className="text-[#594be0]" />
                <h2 className="text-base font-black text-[#171f33]">
                  Aperçu Plein Écran : {user?.prenom} {user?.nom}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 rounded-xl border border-[#dde1ed] px-3 py-1.5 text-xs font-bold text-[#4c546b] hover:bg-[#f7f8fc]"
                >
                  <Printer size={13} /> Imprimer
                </button>
                <button
                  onClick={() => setShowFullscreenCv(false)}
                  className="grid size-8 place-items-center rounded-full text-[#8f97ad] hover:bg-[#f5f6fa]"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {renderCompleteCvDocument()}
          </div>
        </div>
      )}
    </div>
  );
}
