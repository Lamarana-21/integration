'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Calendar,
  Check,
  FileText,
  GraduationCap,
  Languages,
  Plus,
  Save,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react';
import { Candidat, CV, Experience, Formation } from '@/lib/types';

interface ProfilCandidatViewProps {
  candidat: Candidat;
  onUpdateProfile: (updated: Partial<Candidat>) => void;
  onDeleteMyData: () => void;
}

export function ProfilCandidatView({
  candidat,
  onUpdateProfile,
  onDeleteMyData,
}: ProfilCandidatViewProps) {
  const [nom, setNom] = useState(candidat.user?.nom || '');
  const [prenom, setPrenom] = useState(candidat.user?.prenom || '');
  const [telephone, setTelephone] = useState(candidat.telephone || '');
  const [ville, setVille] = useState(candidat.ville || '');
  const [resume, setResume] = useState(candidat.resume || '');
  const [competences, setCompetences] = useState<string[]>(candidat.competences || []);
  const [newSkill, setNewSkill] = useState('');
  const [experiences, setExperiences] = useState<Experience[]>(candidat.experiences || []);
  const [formations, setFormations] = useState<Formation[]>(candidat.formations || []);
  const [langues, setLangues] = useState<string[]>(
    candidat.langues || ['Français (Bilingue)', 'Anglais (Technique)']
  );
  const [newLang, setNewLang] = useState('');
  const [cvList, setCvList] = useState<CV[]>(candidat.cvs || []);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Experience modal inputs
  const [showExpModal, setShowExpModal] = useState(false);
  const [expPoste, setExpPoste] = useState('');
  const [expEmployeur, setExpEmployeur] = useState('');
  const [expDates, setExpDates] = useState('');
  const [expDesc, setExpDesc] = useState('');

  // Formation modal inputs
  const [showFormModal, setShowFormModal] = useState(false);
  const [formDiplome, setFormDiplome] = useState('');
  const [formEcole, setFormEcole] = useState('');
  const [formAnnee, setFormAnnee] = useState('');

  // Calculate profile completeness %
  const calculateCompleteness = () => {
    let score = 0;
    if (nom && prenom) score += 20;
    if (telephone && ville) score += 20;
    if (resume) score += 15;
    if (competences.length >= 3) score += 15;
    if (experiences.length >= 1) score += 15;
    if (formations.length >= 1) score += 10;
    if (cvList.length >= 1) score += 5;
    return Math.min(100, score);
  };

  const completeness = calculateCompleteness();

  const handleAddSkill = () => {
    if (newSkill.trim() && !competences.includes(newSkill.trim())) {
      setCompetences([...competences, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setCompetences(competences.filter((s) => s !== skill));
  };

  const handleAddLangue = () => {
    if (newLang.trim() && !langues.includes(newLang.trim())) {
      setLangues([...langues, newLang.trim()]);
      setNewLang('');
    }
  };

  const handleRemoveLangue = (l: string) => {
    setLangues(langues.filter((item) => item !== l));
  };

  const handleAddExperience = () => {
    if (expPoste && expEmployeur) {
      setExperiences([
        ...experiences,
        {
          poste: expPoste,
          employeur: expEmployeur,
          dates: expDates,
          description: expDesc,
        },
      ]);
      setExpPoste('');
      setExpEmployeur('');
      setExpDates('');
      setExpDesc('');
      setShowExpModal(false);
    }
  };

  const handleAddFormation = () => {
    if (formDiplome && formEcole) {
      setFormations([
        ...formations,
        {
          diplome: formDiplome,
          ecole: formEcole,
          annee: formAnnee,
        },
      ]);
      setFormDiplome('');
      setFormEcole('');
      setFormAnnee('');
      setShowFormModal(false);
    }
  };

  const handleSave = () => {
    onUpdateProfile({
      telephone,
      ville,
      resume,
      competences,
      experiences,
      formations,
      langues,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        {/* Left Column (E6) */}
        <aside className="space-y-6">
          <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 shadow-xs text-center">
            <div className="mx-auto grid size-20 place-items-center rounded-full bg-gradient-to-tr from-[#6353e8] to-[#978eff] text-2xl font-black text-white shadow-lg shadow-[#6353e8]/20">
              {prenom[0]}
              {nom[0]}
            </div>

            <h2 className="mt-3 text-lg font-black text-[#171f33]">
              {prenom} {nom}
            </h2>
            <div className="text-xs text-[#7e879e] truncate">{candidat.user?.email}</div>

            {/* Completeness Bar */}
            <div className="mt-6 text-left">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#3c4458]">Complétude du profil</span>
                <span className="text-[#594be0]">{completeness} %</span>
              </div>
              <div className="mt-2 h-2.5 w-full rounded-full bg-[#f0f2f7] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#594be0] to-[#7f73f2] transition-all duration-500 rounded-full"
                  style={{ width: `${completeness}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-[#8e97ac]">
                Un profil complet à plus de 80% multiplie par 3 vos chances d'entretien.
              </p>
            </div>
          </div>

          {/* RGPD Zone Sensible (Module 6.7) */}
          <div className="rounded-3xl border border-[#ffdada] bg-[#fff8f8] p-6 text-xs">
            <div className="flex items-center gap-2 font-bold text-[#cf3b3b]">
              <AlertTriangle size={16} /> Zone sensible (RGPD)
            </div>
            <p className="mt-2 text-[11px] text-[#825353] leading-4">
              Conformément à la protection des données personnelles, vous pouvez supprimer l'intégralité de votre compte, CV et candidatures à tout moment.
            </p>

            {confirmDelete ? (
              <div className="mt-3 space-y-2">
                <p className="font-bold text-[#b52a2a] text-[11px]">
                  Êtes-vous absolument sûr ? Cette action est irréversible.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={onDeleteMyData}
                    className="flex-1 rounded-xl bg-[#cf3b3b] py-2 font-bold text-white hover:bg-[#ba2a2a]"
                  >
                    Confirmer la suppression
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-xl border border-[#d6adad] px-3 py-2 font-semibold text-[#664b4b]"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="mt-3 w-full rounded-xl border border-[#ffc2c2] py-2 font-bold text-[#cf3b3b] hover:bg-[#ffebeb]"
              >
                Supprimer mon compte et mes données
              </button>
            )}
          </div>
        </aside>

        {/* Right Form Sections (E6) */}
        <div className="space-y-6">
          {saveSuccess && (
            <div className="flex items-center gap-2 rounded-2xl border border-[#cbeedc] bg-[#edf9f3] p-4 text-xs font-bold text-[#2b965f] shadow-xs">
              <Check size={18} /> Profil candidat enregistré avec succès !
            </div>
          )}

          {/* 1. Identité */}
          <section className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs">
            <h3 className="text-sm font-extrabold text-[#171f33] flex items-center gap-2">
              <User size={16} className="text-[#594be0]" /> Identité & Coordonnées
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-[#353d52]">Nom</label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] outline-none focus:border-[#6355e8]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#353d52]">Prénom</label>
                <input
                  type="text"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] outline-none focus:border-[#6355e8]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#353d52]">Téléphone</label>
                <input
                  type="text"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  placeholder="+216 98 123 456"
                  className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] outline-none focus:border-[#6355e8]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#353d52]">Ville</label>
                <input
                  type="text"
                  value={ville}
                  onChange={(e) => setVille(e.target.value)}
                  placeholder="Sfax, Tunis, etc."
                  className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] outline-none focus:border-[#6355e8]"
                />
              </div>
            </div>
          </section>

          {/* 2. Résumé professionnel */}
          <section className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs">
            <h3 className="text-sm font-extrabold text-[#171f33] flex items-center gap-2">
              <FileText size={16} className="text-[#594be0]" /> Résumé professionnel
            </h3>
            <textarea
              rows={3}
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="Présentez vos objectifs, votre parcours et vos points forts..."
              className="mt-3 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] p-3 text-xs text-[#1e2538] outline-none focus:border-[#6355e8]"
            />
          </section>

          {/* 3. Compétences */}
          <section className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs">
            <h3 className="text-sm font-extrabold text-[#171f33]">Compétences clés</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {competences.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#d8d2fb] bg-[#f7f5ff] px-3 py-1.5 text-xs font-bold text-[#5547d7]"
                >
                  {skill}
                  <button
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-[#8e85d9] hover:text-[#5547d7]"
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-2 max-w-sm">
              <input
                type="text"
                placeholder="Ex: React, SQL, Docker..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                className="w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3 py-2 text-xs text-[#1e2538] outline-none focus:border-[#6355e8]"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="rounded-xl bg-[#594be0] px-3.5 py-2 text-xs font-bold text-white shadow-xs"
              >
                + Ajouter
              </button>
            </div>
          </section>

          {/* 4. Expériences */}
          <section className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#171f33] flex items-center gap-2">
                <Building2 size={16} className="text-[#594be0]" /> Expériences professionnelles
              </h3>
              <button
                onClick={() => setShowExpModal(true)}
                className="flex items-center gap-1 text-xs font-bold text-[#594be0] hover:underline"
              >
                <Plus size={14} /> Ajouter une expérience
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {experiences.map((exp, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-[#edf0f7] bg-[#fafbfc] p-4 text-xs"
                >
                  <div className="flex items-center justify-between font-bold text-[#1a2133]">
                    <span>
                      {exp.poste} · {exp.employeur}
                    </span>
                    <span className="text-[#8891a6] font-medium">{exp.dates}</span>
                  </div>
                  <p className="mt-1 text-[#5b6378] text-[11px]">{exp.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 5. Formations */}
          <section className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#171f33] flex items-center gap-2">
                <GraduationCap size={16} className="text-[#594be0]" /> Formations & Diplômes
              </h3>
              <button
                onClick={() => setShowFormModal(true)}
                className="flex items-center gap-1 text-xs font-bold text-[#594be0] hover:underline"
              >
                <Plus size={14} /> Ajouter une formation
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {formations.map((f, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-[#edf0f7] bg-[#fafbfc] p-4 text-xs"
                >
                  <div className="flex items-center justify-between font-bold text-[#1a2133]">
                    <span>
                      {f.diplome} — {f.ecole}
                    </span>
                    <span className="text-[#8891a6] font-medium">{f.annee}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 6. Langues */}
          <section className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs">
            <h3 className="text-sm font-extrabold text-[#171f33] flex items-center gap-2">
              <Languages size={16} className="text-[#594be0]" /> Langues
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {langues.map((l) => (
                <span
                  key={l}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#e1e4ef] bg-[#f8f9fc] px-3 py-1.5 text-xs font-bold text-[#444c60]"
                >
                  {l}
                  <button onClick={() => handleRemoveLangue(l)} className="text-[#9ea6bb] hover:text-[#20273a]">
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 max-w-sm">
              <input
                type="text"
                placeholder="Ex: Anglais (B2)..."
                value={newLang}
                onChange={(e) => setNewLang(e.target.value)}
                className="w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3 py-2 text-xs text-[#1e2538] outline-none focus:border-[#6355e8]"
              />
              <button
                type="button"
                onClick={handleAddLangue}
                className="rounded-xl bg-[#594be0] px-3.5 py-2 text-xs font-bold text-white shadow-xs"
              >
                + Ajouter
              </button>
            </div>
          </section>

          {/* 7. Mes CVs enregistrés */}
          <section className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs">
            <h3 className="text-sm font-extrabold text-[#171f33]">Mes Curriculum Vitae (CV)</h3>
            <div className="mt-3 space-y-2">
              {cvList.map((cv) => (
                <div
                  key={cv.id}
                  className="flex items-center justify-between rounded-2xl border border-[#e2e5f0] bg-[#fafbfc] p-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-[#594be0]" />
                    <div>
                      <div className="font-bold text-[#1f2638]">{cv.nom_fichier}</div>
                      <div className="text-[10px] text-[#838ca0]">
                        {(cv.taille_octets / 1024 / 1024).toFixed(1)} Mo · Déposé le {cv.created_at || '2026-10-02'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => alert(`Remplacement du CV ${cv.nom_fichier}`)}
                      className="rounded-lg border border-[#dde1ee] px-2.5 py-1 font-bold text-[#525a6f] hover:bg-white"
                    >
                      Remplacer
                    </button>
                    <button
                      onClick={() => setCvList(cvList.filter((c) => c.id !== cv.id))}
                      className="rounded-lg border border-[#ffd5d5] px-2.5 py-1 font-bold text-[#d13a3a] hover:bg-[#fff5f5]"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Enregistrer Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 rounded-2xl bg-[#594be0] px-8 py-3.5 text-xs font-bold text-white shadow-lg shadow-[#594be0]/20 hover:bg-[#4739d2] transition"
            >
              <Save size={16} /> Enregistrer mon profil
            </button>
          </div>
        </div>
      </div>

      {/* Modal Ajout Expérience */}
      {showExpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h4 className="text-sm font-extrabold text-[#1a2133]">Nouvelle expérience</h4>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold">Poste</label>
                <input
                  type="text"
                  value={expPoste}
                  onChange={(e) => setExpPoste(e.target.value)}
                  placeholder="Développeur Web Junior"
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5"
                />
              </div>
              <div>
                <label className="font-bold">Employeur</label>
                <input
                  type="text"
                  value={expEmployeur}
                  onChange={(e) => setExpEmployeur(e.target.value)}
                  placeholder="Tech Solutions"
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5"
                />
              </div>
              <div>
                <label className="font-bold">Dates</label>
                <input
                  type="text"
                  value={expDates}
                  onChange={(e) => setExpDates(e.target.value)}
                  placeholder="2024 - 2026"
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5"
                />
              </div>
              <div>
                <label className="font-bold">Description des missions</label>
                <textarea
                  rows={2}
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  placeholder="Conception d'APIs et interfaces..."
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2 text-xs font-bold">
              <button
                onClick={() => setShowExpModal(false)}
                className="rounded-xl border border-[#dde0ec] px-4 py-2 text-[#60687d]"
              >
                Annuler
              </button>
              <button
                onClick={handleAddExperience}
                className="rounded-xl bg-[#594be0] px-4 py-2 text-white"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajout Formation */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h4 className="text-sm font-extrabold text-[#1a2133]">Nouvelle formation</h4>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold">Diplôme</label>
                <input
                  type="text"
                  value={formDiplome}
                  onChange={(e) => setFormDiplome(e.target.value)}
                  placeholder="Licence Informatique"
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5"
                />
              </div>
              <div>
                <label className="font-bold">École / Université</label>
                <input
                  type="text"
                  value={formEcole}
                  onChange={(e) => setFormEcole(e.target.value)}
                  placeholder="Faculté des Sciences"
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5"
                />
              </div>
              <div>
                <label className="font-bold">Année d'obtention</label>
                <input
                  type="text"
                  value={formAnnee}
                  onChange={(e) => setFormAnnee(e.target.value)}
                  placeholder="2025"
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2 text-xs font-bold">
              <button
                onClick={() => setShowFormModal(false)}
                className="rounded-xl border border-[#dde0ec] px-4 py-2 text-[#60687d]"
              >
                Annuler
              </button>
              <button
                onClick={handleAddFormation}
                className="rounded-xl bg-[#594be0] px-4 py-2 text-white"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
