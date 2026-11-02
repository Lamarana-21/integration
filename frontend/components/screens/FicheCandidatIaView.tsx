'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronLeft,
  Download,
  Edit3,
  FileText,
  GraduationCap,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  ShieldAlert,
  Sparkles,
  Tag,
  User,
  XCircle,
} from 'lucide-react';
import { ApplicationStatus, Candidature, NoteInterne } from '@/lib/types';

interface FicheCandidatIaViewProps {
  candidature: Candidature;
  onBack: () => void;
  onUpdateStatus: (id: string, newStatus: ApplicationStatus, commentaire?: string) => void;
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
  const [newNote, setNewNote] = useState('');
  const [newTag, setNewTag] = useState('À contacter');
  const [isEditingExtracted, setIsEditingExtracted] = useState(false);
  const [editedSkills, setEditedSkills] = useState<string[]>(
    candidature.analyse?.infos_extraites?.competences || ['React', 'Node.js', 'SQL']
  );
  const [aiRunning, setAiRunning] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const analyse = candidature.analyse;
  const candidat = candidature.candidat;
  const user = candidat?.user;
  const cv = candidature.cv;

  const handleAddInternalNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddNote(candidature.id, newNote.trim(), [newTag]);
    setNewNote('');
  };

  const handleRerun = () => {
    setAiRunning(true);
    setTimeout(() => {
      onRerunAi(candidature.id);
      setAiRunning(false);
      setStatusMessage('Analyse IA relancée et actualisée avec succès !');
      setTimeout(() => setStatusMessage(''), 4000);
    }, 1200);
  };

  const score = analyse?.score_correspondance || 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      {/* Top Header (E10) */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#eef1f7] pb-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-xl border border-[#dde1ee] bg-white px-3.5 py-2 text-xs font-bold text-[#5547d7] hover:bg-[#fafbfc]"
          >
            <ChevronLeft size={16} /> Retour aux candidatures
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-[#171f33]">
                {user?.prenom} {user?.nom}
              </h1>
              <span className="text-[#8992a7]">·</span>
              <span className="text-xs font-bold text-[#5b6379]">
                {candidature.offre?.titre}
              </span>
            </div>
            <div className="text-[11px] text-[#838ca0]">
              Candidature déposée le {candidature.created_at} · {user?.email} ·{' '}
              {candidat?.ville || 'Sfax'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#717a91]">Statut actuel :</span>
          <span className="rounded-full bg-[#eeeaff] px-3 py-1 text-xs font-black text-[#5547d7]">
            {candidature.statut}
          </span>
        </div>
      </div>

      {statusMessage && (
        <div className="mt-4 rounded-2xl border border-[#cbeedc] bg-[#edf9f3] p-4 text-xs font-bold text-[#2a945d] shadow-xs">
          {statusMessage}
        </div>
      )}

      {/* Main Grid: Left Column (CV preview, Extracted, Notes) & Right Column (AI Suggestion, Decision) (E10) */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left Column */}
        <div className="space-y-6">
          {/* CV Visualizer / Preview Card */}
          <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#f1f3f8] pb-3">
              <div className="flex items-center gap-2">
                <FileText size={17} className="text-[#594be0]" />
                <h3 className="text-xs font-extrabold text-[#171f33] uppercase tracking-wider">
                  CV du candidat : {cv?.nom_fichier || 'cv_candidat.pdf'}
                </h3>
              </div>

              <button
                onClick={() => alert(`Téléchargement sécurisé (RM7) de : ${cv?.nom_fichier}`)}
                className="flex items-center gap-1.5 rounded-xl border border-[#dde1ed] px-3 py-1 text-xs font-bold text-[#51596e] hover:bg-[#fafbfc]"
              >
                <Download size={14} /> Télécharger
              </button>
            </div>

            {/* Document preview simulation */}
            <div className="mt-4 rounded-2xl border border-[#eaedf5] bg-[#fafbfc] p-6 text-xs text-[#3b4356] space-y-3 font-mono leading-5 shadow-inner">
              <div className="border-b border-[#e9ebf4] pb-2 font-sans font-black text-sm text-[#182035]">
                {user?.prenom} {user?.nom} — {candidat?.ville || 'Sfax, Tunisie'}
              </div>
              <p className="font-sans text-[11px] text-[#555d72]">
                {candidat?.resume ||
                  'Développeuse Web passionnée par l’écosystème React, TypeScript et Node.js. 1 an d\'expérience en conception d\'interfaces réactives.'}
              </p>
              <div className="text-[11px] text-[#697288] pt-1">
                <strong>COMPÉTENCES :</strong> React, Node.js, SQL, TypeScript, Git, Tailwind
              </div>
              <div className="text-[11px] text-[#697288]">
                <strong>EXPÉRIENCE :</strong> WebLabs Tunisie (2025 - 2026) · Développement front-end et APIs
              </div>
              <div className="text-[11px] text-[#697288]">
                <strong>FORMATION :</strong> Licence en Informatique de Gestion (2025)
              </div>
            </div>

            {/* Lettre de motivation si fournie */}
            {candidature.lettre_motivation && (
              <div className="mt-4 rounded-2xl bg-[#f7f6ff] border border-[#e5e1fc] p-4 text-xs">
                <span className="font-bold text-[#5547d7]">
                  Lettre de motivation :
                </span>
                <p className="mt-1 text-[#4f586f] italic">
                  "{candidature.lettre_motivation}"
                </p>
              </div>
            )}
          </div>

          {/* Informations extraites par l'IA */}
          <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#f1f3f8] pb-3">
              <h3 className="text-xs font-extrabold text-[#171f33] uppercase tracking-wider">
                Informations extraites du document
              </h3>
              <button
                onClick={() => setIsEditingExtracted(!isEditingExtracted)}
                className="flex items-center gap-1 text-xs font-bold text-[#594be0] hover:underline"
              >
                <Edit3 size={13} /> {isEditingExtracted ? 'Fermer' : 'Corriger les infos'}
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <span className="font-bold text-[#6a7388]">Compétences :</span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {editedSkills.map((c) => (
                    <span
                      key={c}
                      className="rounded-lg bg-[#eeeaff] px-2.5 py-1 text-xs font-bold text-[#5547d7]"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-bold text-[#6a7388]">Expérience principale :</span>
                <div className="mt-1 font-semibold text-[#1f2639]">
                  WebLabs Tunisie (2025 - 2026) · Développeuse Web Junior
                </div>
              </div>

              <div>
                <span className="font-bold text-[#6a7388]">Formation :</span>
                <div className="mt-1 font-semibold text-[#1f2639]">
                  Licence en Informatique de Gestion (2025)
                </div>
              </div>
            </div>

            {isEditingExtracted && (
              <div className="mt-4 rounded-2xl border border-[#d9d4fb] bg-[#f8f7ff] p-4 text-xs">
                <div className="font-bold text-[#5547d7]">
                  Modifier les compétences extraites :
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    defaultValue={editedSkills.join(', ')}
                    id="editedSkillsInput"
                    className="flex-1 rounded-xl border border-[#d1ccfa] bg-white p-2 text-xs outline-none"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById(
                        'editedSkillsInput'
                      ) as HTMLInputElement;
                      if (input) {
                        setEditedSkills(
                          input.value.split(',').map((s) => s.trim()).filter(Boolean)
                        );
                        setIsEditingExtracted(false);
                      }
                    }}
                    className="rounded-xl bg-[#594be0] px-3.5 py-1.5 font-bold text-white"
                  >
                    Valider
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notes Internes (Module 8.4 & Section 3.11) */}
          <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-[#f1f3f8] pb-3">
              <MessageSquare size={16} className="text-[#594be0]" />
              <h3 className="text-xs font-extrabold text-[#171f33] uppercase tracking-wider">
                Notes internes & commentaires recruteur
              </h3>
            </div>

            {/* Existing notes */}
            <div className="mt-4 space-y-3">
              {candidature.notes_internes && candidature.notes_internes.length > 0 ? (
                candidature.notes_internes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-2xl border border-[#edf0f7] bg-[#fafbfc] p-3.5 text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-[#1f2638]">
                      <span>{note.auteur?.prenom || 'R.'} {note.auteur?.nom || 'Ben Ali'}</span>
                      <span className="text-[#8892a7] font-normal">{note.created_at}</span>
                    </div>
                    <p className="mt-1 text-[#4a5266]">{note.contenu}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {note.etiquettes?.map((t) => (
                        <span
                          key={t}
                          className="rounded-md bg-[#eeeaff] px-2 py-0.5 text-[10px] font-bold text-[#5547d7]"
                        >
                          🏷️ {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-[#8d95ab] italic">
                  Aucune note interne pour l'instant.
                </div>
              )}
            </div>

            {/* Add note form */}
            <form onSubmit={handleAddInternalNote} className="mt-4 pt-3 border-t border-[#f0f2f7]">
              <textarea
                rows={2}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Ajouter une observation privée sur ce candidat..."
                className="w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] p-2.5 text-xs outline-none focus:border-[#6355e8]"
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

        {/* Right Column: AI Suggestion & Human Decision (E10) */}
        <div className="space-y-6">
          {/* AI Suggestion Card */}
          <div className="rounded-3xl border border-[#dcd8fd] bg-gradient-to-b from-[#f9f8ff] via-white to-white p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#ece8fc] pb-4">
              <div className="flex items-center gap-2">
                <div className="grid size-8 place-items-center rounded-xl bg-[#6253e8] text-white shadow-sm">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#171f33]">
                    Analyse IA (Suggestion)
                  </h3>
                  <div className="text-[10px] text-[#7d869d]">
                    Modèle {analyse?.version_modele || 'Talenta-AI-v2.1'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleRerun}
                  disabled={aiRunning}
                  className="flex items-center gap-1 rounded-xl border border-[#d6d0fa] px-3 py-1 text-xs font-bold text-[#5547d7] hover:bg-[#f2f0ff] disabled:opacity-50"
                >
                  <RefreshCw size={13} className={aiRunning ? 'animate-spin' : ''} />
                  {aiRunning ? 'Analyse...' : 'Relancer (9.7)'}
                </button>
              </div>
            </div>

            {/* Score & Confidence Level (E10) */}
            <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#f2f0ff] p-4">
              <div>
                <div className="text-[11px] font-bold text-[#726ba6] uppercase">
                  Score de correspondance
                </div>
                <div className="text-3xl font-black text-[#5547d7]">
                  {score} <span className="text-sm font-semibold text-[#8b84bf]">/ 100</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] font-bold text-[#726ba6] uppercase">
                  Niveau de confiance
                </div>
                <span className="inline-block mt-1 rounded-full bg-white px-3 py-0.5 text-xs font-extrabold text-[#5547d7] shadow-xs">
                  {analyse?.niveau_confiance || 'MOYEN'}
                </span>
              </div>
            </div>

            {/* Résumé du profil (Module 9.3) */}
            <div className="mt-5">
              <div className="text-xs font-extrabold text-[#1b2337]">
                Résumé synthétique du profil :
              </div>
              <p className="mt-1.5 text-xs leading-5 text-[#555d72]">
                {analyse?.resume ||
                  'Développeuse web, 1 an d\'expérience. Solide adéquation sur la stack principale (React, Node.js, SQL).'}
              </p>
            </div>

            {/* Points forts */}
            <div className="mt-5">
              <div className="text-xs font-extrabold text-[#248d56]">Points forts :</div>
              <ul className="mt-1.5 space-y-1.5 text-xs text-[#3b4356]">
                {analyse?.points_forts?.map((pf, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-bold text-[#248d56]">+</span>
                    <span>{pf}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Points manquants */}
            <div className="mt-5">
              <div className="text-xs font-extrabold text-[#ba4545]">
                Points manquants / À vérifier :
              </div>
              <ul className="mt-1.5 space-y-1.5 text-xs text-[#3b4356]">
                {analyse?.points_manquants?.map((pm, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-bold text-[#ba4545]">-</span>
                    <span>{pm}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mandatory Ethics / Suggestion Notice (Section 7 & Module 9.5) */}
            <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-[#f3e1b7] bg-[#fffbf2] p-3.5 text-[11px] leading-4 text-[#8a681d]">
              <ShieldAlert size={18} className="shrink-0 text-[#b5851b]" />
              <div>
                <strong>Aide à la décision :</strong> Cette analyse est fournie comme suggestion indicative. Elle n'accepte ni ne refuse jamais automatiquement une candidature. La sélection finale appartient exclusivement à l'équipe de recrutement (RM8).
              </div>
            </div>
          </div>

          {/* Recruiter Decision Panel (E10) */}
          <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 shadow-xs">
            <h3 className="text-xs font-extrabold text-[#171f33] uppercase tracking-wider">
              Décision de recrutement (Recruteur)
            </h3>
            <p className="mt-1 text-xs text-[#7e879c]">
              Changez l'état du dossier. Le candidat recevra un e-mail de notification automatique.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2.5 text-xs font-bold">
              <button
                onClick={() => onUpdateStatus(candidature.id, 'EN_EXAMEN')}
                className="rounded-xl border border-[#d8e4f7] bg-[#f4f8fe] py-2.5 text-[#2f6cb5] hover:bg-[#eaf1fd]"
              >
                Passer en examen
              </button>

              <button
                onClick={() => onUpdateStatus(candidature.id, 'PRESELECTIONNEE')}
                className="rounded-xl border border-[#cbeedc] bg-[#edf9f3] py-2.5 text-[#248d56] hover:bg-[#e2f5ec]"
              >
                Présélectionner
              </button>

              <button
                onClick={() => onUpdateStatus(candidature.id, 'ENTRETIEN')}
                className="rounded-xl border border-[#fbe5bd] bg-[#fffaf0] py-2.5 text-[#b07b19] hover:bg-[#fff4de]"
              >
                Convoquer en entretien
              </button>

              <button
                onClick={() => onUpdateStatus(candidature.id, 'ACCEPTEE')}
                className="rounded-xl bg-[#28925a] py-2.5 text-white shadow-xs hover:bg-[#207a4a]"
              >
                Accepter le candidat
              </button>
            </div>

            <button
              onClick={() => onUpdateStatus(candidature.id, 'REFUSEE')}
              className="mt-2.5 w-full rounded-xl border border-[#ffd2d2] py-2.5 text-xs font-bold text-[#cf3b3b] hover:bg-[#fff5f5]"
            >
              Refuser la candidature
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
