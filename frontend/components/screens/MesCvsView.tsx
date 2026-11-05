'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  AlertCircle,
  Award,
  Briefcase,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  GraduationCap,
  Languages,
  MapPin,
  Mail,
  Phone,
  Plus,
  Printer,
  Sparkles,
  Trash2,
  Upload,
  User,
  X,
  Layers,
  Globe,
} from 'lucide-react';
import { Candidat, CV, Experience, Formation } from '@/lib/types';

interface MesCvsViewProps {
  candidat: Candidat;
  onUploadCv: (file: File) => Promise<{ cv?: CV; error?: string }>;
  onUpdateCvList: (cvs: CV[]) => void;
  onUpdateCandidatProfile?: (updated: Partial<Candidat>) => void;
  onNavigateToProfile: () => void;
}

const POPULAR_SKILLS = [
  'React',
  'TypeScript',
  'Node.js',
  'Next.js',
  'TailwindCSS',
  'Python',
  'Docker',
  'PostgreSQL',
  'Git',
  'REST API',
  'PHP / Laravel',
  'UI/UX Design',
];

const LANGUAGE_LEVELS = [
  'Natif / Bilingue',
  'C2 - Maîtrise parfaite',
  'C1 - Courant professionnel',
  'B2 - Intermédiaire avancé',
  'B1 - Intermédiaire technique',
  'A2 - Notions de base',
];

export function MesCvsView({
  candidat,
  onUploadCv,
  onUpdateCvList,
  onUpdateCandidatProfile,
  onNavigateToProfile,
}: MesCvsViewProps) {
  // Onglet actif : Studio & CVs ou Édition du contenu du CV
  const [activeTab, setActiveTab] = useState<'STUDIO' | 'CONTENU'>('CONTENU');

  // Documents de CV
  const [cvList, setCvList] = useState<CV[]>(candidat.cvs || []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // CV Builder states
  const [cvTemplate, setCvTemplate] = useState<'moderne' | 'minimaliste' | 'corporate'>('moderne');
  const [cvAccentColor, setCvAccentColor] = useState<string>('#594be0');
  const [showPhotoOnCv, setShowPhotoOnCv] = useState(true);
  const [cvCustomTitle, setCvCustomTitle] = useState(
    `CV Dynamique ${candidat.user?.prenom || 'Amina'} ${candidat.user?.nom || 'Ben Salem'} - ${candidat.titre || 'Développeuse Web'}`
  );
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [generatedSuccess, setGeneratedSuccess] = useState(false);

  // Contenu du CV (déplacé du profil vers l'espace CV)
  const [linkedinUrl, setLinkedinUrl] = useState(candidat.linkedin_url || 'https://linkedin.com/in/amina-bensalem');
  const [githubUrl, setGithubUrl] = useState(candidat.github_url || 'https://github.com/aminabs');
  const [portfolioUrl, setPortfolioUrl] = useState(candidat.portfolio_url || 'https://amina-dev.portfolio.tn');
  const [resume, setResume] = useState(candidat.resume || '');
  const [aiGenerating, setAiGenerating] = useState(false);

  // Compétences
  const [competences, setCompetences] = useState<string[]>(
    candidat.competences && candidat.competences.length > 0
      ? candidat.competences
      : ['React', 'Node.js', 'SQL', 'Git', 'TypeScript', 'TailwindCSS']
  );
  const [newSkill, setNewSkill] = useState('');

  // Expériences
  const [experiences, setExperiences] = useState<Experience[]>(candidat.experiences || []);
  const [showExpModal, setShowExpModal] = useState(false);
  const [editingExpIndex, setEditingExpIndex] = useState<number | null>(null);
  const [expPoste, setExpPoste] = useState('');
  const [expEmployeur, setExpEmployeur] = useState('');
  const [expLieu, setExpLieu] = useState('');
  const [expDates, setExpDates] = useState('');
  const [expDesc, setExpDesc] = useState('');

  // Formations
  const [formations, setFormations] = useState<Formation[]>(candidat.formations || []);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingFormIndex, setEditingFormIndex] = useState<number | null>(null);
  const [formDiplome, setFormDiplome] = useState('');
  const [formEcole, setFormEcole] = useState('');
  const [formAnnee, setFormAnnee] = useState('');

  // Langues
  const [langues, setLangues] = useState<string[]>(
    candidat.langues || ['Français (Bilingue)', 'Anglais (Technique)', 'Arabe (Natif)']
  );
  const [newLangNom, setNewLangNom] = useState('');
  const [newLangNiveau, setNewLangNiveau] = useState('B2 - Intermédiaire avancé');

  // Disponibilité & Préférences du CV
  const [disponibilite, setDisponibilite] = useState<string>(candidat.disponibilite || 'Immédiate');
  const [teletravailSouhaite, setTeletravailSouhaite] = useState<'TOTAL' | 'HYBRIDE' | 'SUR_SITE' | 'INDIFFERENT'>(
    candidat.teletravail_souhaite || 'HYBRIDE'
  );
  const [pretentionSalariale, setPretentionSalariale] = useState<string>(
    candidat.pretention_salariale || '30 000 - 36 000 DT / an'
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restauration de l'onglet actif et synchronisation avec les données candidat
  useEffect(() => {
    try {
      const savedTab = sessionStorage.getItem('talenta_cv_active_tab');
      if (savedTab === 'STUDIO' || savedTab === 'CONTENU') {
        setActiveTab(savedTab);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (candidat) {
      if (candidat.cvs) setCvList(candidat.cvs);
      if (candidat.competences && candidat.competences.length > 0) {
        setCompetences(candidat.competences);
      }
      if (candidat.experiences) setExperiences(candidat.experiences);
      if (candidat.formations) setFormations(candidat.formations);
      if (candidat.langues) setLangues(candidat.langues);
      if (candidat.resume !== undefined) setResume(candidat.resume || '');
      if (candidat.linkedin_url !== undefined) setLinkedinUrl(candidat.linkedin_url || '');
      if (candidat.github_url !== undefined) setGithubUrl(candidat.github_url || '');
      if (candidat.portfolio_url !== undefined) setPortfolioUrl(candidat.portfolio_url || '');
      if (candidat.disponibilite) setDisponibilite(candidat.disponibilite || 'Immédiate');
      if (candidat.teletravail_souhaite) setTeletravailSouhaite(candidat.teletravail_souhaite || 'HYBRIDE');
      if (candidat.pretention_salariale) setPretentionSalariale(candidat.pretention_salariale || '');
    }
  }, [candidat]);

  const handleTabChange = (tab: 'STUDIO' | 'CONTENU') => {
    setActiveTab(tab);
    try {
      sessionStorage.setItem('talenta_cv_active_tab', tab);
    } catch (e) {}
  };

  // Synchronisation des modifications de contenu vers le profil parent
  const syncContentToParent = (overrides?: Partial<Candidat>) => {
    if (onUpdateCandidatProfile) {
      onUpdateCandidatProfile({
        linkedin_url: linkedinUrl,
        github_url: githubUrl,
        portfolio_url: portfolioUrl,
        resume,
        competences,
        experiences,
        formations,
        langues,
        disponibilite,
        teletravail_souhaite: teletravailSouhaite,
        pretention_salariale: pretentionSalariale,
        ...overrides,
      });
    }
  };

  // Compétences
  const handleAddSkill = (skillToAdd?: string) => {
    const val = (skillToAdd || newSkill).trim();
    if (val && !competences.includes(val)) {
      const updated = [...competences, val];
      setCompetences(updated);
      syncContentToParent({ competences: updated });
      if (!skillToAdd) setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    const updated = competences.filter((s) => s !== skill);
    setCompetences(updated);
    syncContentToParent({ competences: updated });
  };

  // Langues
  const handleAddLanguage = () => {
    if (!newLangNom.trim()) return;
    const item = `${newLangNom.trim()} (${newLangNiveau})`;
    if (!langues.includes(item)) {
      const updated = [...langues, item];
      setLangues(updated);
      syncContentToParent({ langues: updated });
      setNewLangNom('');
    }
  };

  const handleRemoveLanguage = (l: string) => {
    const updated = langues.filter((item) => item !== l);
    setLangues(updated);
    syncContentToParent({ langues: updated });
  };

  // Expériences
  const handleSaveExperience = () => {
    if (!expPoste.trim() || !expEmployeur.trim()) return;
    const newExp: Experience = {
      id: editingExpIndex !== null ? experiences[editingExpIndex].id || `exp-${Date.now()}` : `exp-${Date.now()}`,
      poste: expPoste.trim(),
      employeur: expEmployeur.trim(),
      lieu: expLieu.trim() || candidat.ville || 'Tunis',
      dates: expDates.trim() || '2025 - Actuel',
      description: expDesc.trim(),
    };
    let updated: Experience[];
    if (editingExpIndex !== null) {
      updated = [...experiences];
      updated[editingExpIndex] = newExp;
    } else {
      updated = [newExp, ...experiences];
    }
    setExperiences(updated);
    syncContentToParent({ experiences: updated });
    setShowExpModal(false);
  };

  const handleDeleteExperience = (idx: number) => {
    const updated = experiences.filter((_, i) => i !== idx);
    setExperiences(updated);
    syncContentToParent({ experiences: updated });
  };

  // Formations
  const handleSaveFormation = () => {
    if (!formDiplome.trim() || !formEcole.trim()) return;
    const newForm: Formation = {
      id: editingFormIndex !== null ? formations[editingFormIndex].id || `form-${Date.now()}` : `form-${Date.now()}`,
      diplome: formDiplome.trim(),
      ecole: formEcole.trim(),
      annee: formAnnee.trim() || '2025',
    };
    let updated: Formation[];
    if (editingFormIndex !== null) {
      updated = [...formations];
      updated[editingFormIndex] = newForm;
    } else {
      updated = [newForm, ...formations];
    }
    setFormations(updated);
    syncContentToParent({ formations: updated });
    setShowFormModal(false);
  };

  const handleDeleteFormation = (idx: number) => {
    const updated = formations.filter((_, i) => i !== idx);
    setFormations(updated);
    syncContentToParent({ formations: updated });
  };

  // Optimisation IA du résumé
  const handleGenerateAiPitch = () => {
    setAiGenerating(true);
    setTimeout(() => {
      const generated = `${candidat.titre || 'Développeuse Web'} diplômée, passionnée par le développement d'interfaces modernes et performantes. Solide expertise en ${competences.slice(0, 4).join(', ')}. Motivée, rigoureuse et prête à s'intégrer rapidement dans une équipe produit innovante.`;
      setResume(generated);
      syncContentToParent({ resume: generated });
      setAiGenerating(false);
    }, 600);
  };

  // Gestion du téléversement de fichier depuis le PC
  const processUploadedFile = async (file: File) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Le fichier dépasse la taille maximale autorisée de 5 Mo.');
      return;
    }

    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
      setUploadError('Format de fichier non accepté. Veuillez choisir un document PDF ou DOCX.');
      return;
    }

    setUploadError('');
    setUploading(true);
    const result = await onUploadCv(file);
    setUploading(false);

    if (result.error || !result.cv) {
      setUploadError(result.error || 'Échec du téléversement du document.');
      return;
    }

    const newCvItem: CV = {
      ...result.cv,
      est_genere: false,
    };

    const updated = [newCvItem, ...cvList];
    setCvList(updated);
    onUpdateCvList(updated);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) processUploadedFile(file);
  };

  // Drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processUploadedFile(file);
  };

  // Génération / Sauvegarde du CV Dynamique de l'application
  const handleSaveDynamicCv = () => {
    syncContentToParent();

    const existingDynamicIndex = cvList.findIndex((c) => c.est_genere);

    const dynamicCv: CV = {
      id: existingDynamicIndex >= 0 ? cvList[existingDynamicIndex].id : `cv-dyn-${Date.now()}`,
      candidat_id: candidat.id,
      nom_fichier: `${cvCustomTitle.trim().replace(/[^a-zA-Z0-9_\-]/g, '_')}.pdf`,
      type_mime: 'application/pdf',
      taille_octets: 1250000,
      url_stockage: '#',
      created_at: new Date().toISOString().split('T')[0],
      est_principal: true,
      est_genere: true,
      template_style: cvTemplate,
    };

    let updated: CV[];
    if (existingDynamicIndex >= 0) {
      updated = cvList.map((c, i) =>
        i === existingDynamicIndex ? dynamicCv : { ...c, est_principal: false }
      );
    } else {
      updated = [dynamicCv, ...cvList.map((c) => ({ ...c, est_principal: false }))];
    }

    setCvList(updated);
    onUpdateCvList(updated);
    setGeneratedSuccess(true);
    setTimeout(() => setGeneratedSuccess(false), 4000);
  };

  const handleSetPrincipal = (cvId: string) => {
    const updated = cvList.map((c) => ({ ...c, est_principal: c.id === cvId }));
    setCvList(updated);
    onUpdateCvList(updated);
  };

  const handleDeleteCv = (cvId: string) => {
    const updated = cvList.filter((c) => c.id !== cvId);
    setCvList(updated);
    onUpdateCvList(updated);
  };

  const dynamicCvCount = cvList.filter((c) => c.est_genere).length;
  const importedCvCount = cvList.filter((c) => !c.est_genere).length;
  const principalCv = cvList.find((c) => c.est_principal);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      {/* Styles d'impression A4 */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-cv, #printable-cv * { visibility: visible; }
          #printable-cv {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 30px;
            background: white !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* BANNIÈRE SUPÉRIEURE */}
      <div className="rounded-3xl border border-[#e8ebf3] bg-gradient-to-r from-white via-[#fafbfe] to-[#f4f2ff] p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#efedff] px-3 py-0.5 text-[11px] font-extrabold text-[#5547d7]">
                Gestion Complète du CV
              </span>
              <span className="text-xs text-[#828ca1]">
                {cvList.length} CV enregistré(s) · {competences.length} compétences · {experiences.length} expériences
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black text-[#171f33]">
              Mon Curriculum Vitae & Studio de Création
            </h1>
            <p className="mt-1 text-xs text-[#6e7790] max-w-2xl">
              Gérez l'ensemble du contenu de votre CV (résumé, compétences, expériences, formations, langues, liens) et choisissez comment postuler.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onNavigateToProfile}
              className="rounded-2xl border border-[#d8dce8] bg-white px-4 py-2.5 text-xs font-bold text-[#424b61] shadow-xs hover:bg-[#f6f7fb] transition"
            >
              ← Voir mes coordonnées
            </button>
            <button
              onClick={() => setShowPreviewModal(true)}
              className="flex items-center gap-1.5 rounded-2xl bg-[#594be0] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#594be0]/20 hover:bg-[#4739d2] transition"
            >
              <Eye size={15} /> Voir mon CV A4
            </button>
          </div>
        </div>

        {/* ONGLETS DE NAVIGATION DANS L'ESPACE CV */}
        <div className="mt-6 flex border-b border-[#e8ebf3] gap-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => handleTabChange('CONTENU')}
            className={`pb-3 transition flex items-center gap-2 border-b-2 ${
              activeTab === 'CONTENU'
                ? 'border-[#594be0] text-[#594be0]'
                : 'border-transparent text-[#6e778f] hover:text-[#182133]'
            }`}
          >
            <FileText size={16} />
            <span>1. Contenu du CV (Compétences, Expériences, Liens...)</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('STUDIO')}
            className={`pb-3 transition flex items-center gap-2 border-b-2 ${
              activeTab === 'STUDIO'
                ? 'border-[#594be0] text-[#594be0]'
                : 'border-transparent text-[#6e778f] hover:text-[#182133]'
            }`}
          >
            <Sparkles size={16} />
            <span>2. Studio CV, Mise en page & Mes Fichiers</span>
          </button>
        </div>
      </div>

      {generatedSuccess && (
        <div className="flex items-center gap-3 rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] p-4 text-xs font-bold text-[#166534] shadow-xs animate-in slide-in-from-top-4">
          <CheckCircle2 size={20} className="text-[#16a34a] shrink-0" />
          <div>
            <div>Votre CV dynamique a été enregistré et mis à jour avec succès !</div>
            <div className="font-normal text-[11px] text-[#227142] mt-0.5">
              Il est défini comme votre CV par défaut pour postuler en 1 clic aux offres.
            </div>
          </div>
        </div>
      )}

      {/* VUE 1 : CONTENU DU CV (TOUT CE QUI A ÉTÉ DÉPLACÉ DEPUIS LE PROFIL) */}
      {activeTab === 'CONTENU' && (
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* COLONNE GAUCHE: FORMULAIRES DE CONTENU */}
          <div className="space-y-6">
            {/* 1. LIENS PROFESSIONNELS & GITHUB */}
            <section className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#f0f2f7] pb-3 mb-4">
                <h2 className="text-sm font-extrabold text-[#171f33] flex items-center gap-2">
                  <Globe size={16} className="text-[#594be0]" /> Liens professionnels & Profils en ligne
                </h2>
                <span className="text-[11px] text-[#7d869e]">Affichés sur votre CV</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-bold text-[#353d52] flex items-center justify-between mb-1">
                    <span>GitHub</span>
                    {githubUrl && (
                      <a href={githubUrl} target="_blank" rel="noreferrer" className="text-[#594be0] hover:underline flex items-center gap-0.5">
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </label>
                  <input
                    type="url"
                    value={githubUrl ?? ''}
                    onChange={(e) => {
                      setGithubUrl(e.target.value);
                      syncContentToParent({ github_url: e.target.value });
                    }}
                    placeholder="https://github.com/..."
                    className="w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2 text-xs text-[#1e2538] outline-none focus:border-[#594be0] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#353d52] flex items-center justify-between mb-1">
                    <span>LinkedIn</span>
                    {linkedinUrl && (
                      <a href={linkedinUrl} target="_blank" rel="noreferrer" className="text-[#594be0] hover:underline flex items-center gap-0.5">
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </label>
                  <input
                    type="url"
                    value={linkedinUrl ?? ''}
                    onChange={(e) => {
                      setLinkedinUrl(e.target.value);
                      syncContentToParent({ linkedin_url: e.target.value });
                    }}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2 text-xs text-[#1e2538] outline-none focus:border-[#594be0] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#353d52] flex items-center justify-between mb-1">
                    <span>Portfolio / Site web</span>
                    {portfolioUrl && (
                      <a href={portfolioUrl} target="_blank" rel="noreferrer" className="text-[#594be0] hover:underline flex items-center gap-0.5">
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </label>
                  <input
                    type="url"
                    value={portfolioUrl ?? ''}
                    onChange={(e) => {
                      setPortfolioUrl(e.target.value);
                      syncContentToParent({ portfolio_url: e.target.value });
                    }}
                    placeholder="https://mon-site.tn"
                    className="w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2 text-xs text-[#1e2538] outline-none focus:border-[#594be0] focus:bg-white"
                  />
                </div>
              </div>
            </section>

            {/* 2. RÉSUMÉ DU CV / ACCROCHE */}
            <section className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-extrabold text-[#171f33] flex items-center gap-2">
                  <FileText size={16} className="text-[#594be0]" /> Résumé professionnel du CV
                </h2>
                <button
                  type="button"
                  onClick={handleGenerateAiPitch}
                  disabled={aiGenerating}
                  className="text-xs font-bold text-[#594be0] hover:underline flex items-center gap-1"
                >
                  <Sparkles size={13} className={aiGenerating ? 'animate-spin' : ''} />
                  {aiGenerating ? 'Génération...' : '✨ Optimiser avec l’IA'}
                </button>
              </div>
              <textarea
                rows={3}
                value={resume ?? ''}
                onChange={(e) => {
                  setResume(e.target.value);
                  syncContentToParent({ resume: e.target.value });
                }}
                placeholder="Présentez vos points forts, votre spécialité et vos objectifs pour le CV..."
                className="w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] p-3 text-xs text-[#1e2538] outline-none focus:border-[#6355e8] focus:bg-white"
              />
            </section>

            {/* 3. COMPÉTENCES CLÉS */}
            <section className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs">
              <h2 className="text-sm font-extrabold text-[#171f33] mb-3 flex items-center gap-2">
                <Award size={16} className="text-[#594be0]" /> Compétences clés ({competences.length})
              </h2>

              <div className="flex flex-wrap gap-2 mb-3">
                {competences.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#d8d2fb] bg-[#f7f5ff] px-3 py-1.5 text-xs font-bold text-[#5547d7]"
                  >
                    {s}
                    <button onClick={() => handleRemoveSkill(s)} className="text-[#8e85d9] hover:text-[#5547d7]">
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 max-w-sm mb-4">
                <input
                  type="text"
                  placeholder="Ex: React, Node.js, SQL..."
                  value={newSkill ?? ''}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  className="w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3 py-2 text-xs outline-none focus:border-[#6355e8]"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill()}
                  className="rounded-xl bg-[#594be0] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#4739d2]"
                >
                  + Ajouter
                </button>
              </div>

              {/* Suggestions */}
              <div className="border-t border-[#f0f2f7] pt-3">
                <span className="text-[11px] font-bold text-[#7d869e]">Suggestions en 1 clic :</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {POPULAR_SKILLS.filter((s) => !competences.includes(s)).slice(0, 6).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleAddSkill(s)}
                      className="rounded-lg border border-[#e2e5f0] bg-[#fafbfc] px-2.5 py-1 text-[11px] font-semibold text-[#525a71] hover:border-[#594be0] hover:text-[#594be0]"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* 4. EXPÉRIENCES PROFESSIONNELLES */}
            <section className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-extrabold text-[#171f33] flex items-center gap-2">
                  <Briefcase size={16} className="text-[#594be0]" /> Expériences professionnelles ({experiences.length})
                </h2>
                <button
                  onClick={() => {
                    setEditingExpIndex(null);
                    setExpPoste('');
                    setExpEmployeur('');
                    setExpDates('');
                    setExpLieu('');
                    setExpDesc('');
                    setShowExpModal(true);
                  }}
                  className="text-xs font-bold text-[#594be0] hover:underline flex items-center gap-1"
                >
                  <Plus size={14} /> Ajouter une expérience
                </button>
              </div>

              <div className="space-y-3">
                {experiences.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#d8dce8] p-5 text-center text-xs text-[#828ca1]">
                    Aucune expérience renseignée. Cliquez sur « Ajouter une expérience ».
                  </div>
                ) : (
                  experiences.map((exp, idx) => (
                    <div key={idx} className="group rounded-2xl border border-[#edf0f7] bg-[#fafbfc] p-4 text-xs">
                      <div className="flex justify-between items-start font-bold text-[#1a2133]">
                        <div>
                          <span>{exp.poste}</span> · <span className="text-[#505a72]">{exp.employeur}</span>
                          <span className="text-[10px] text-[#8e98af] font-normal block sm:inline sm:ml-2">
                            ({exp.lieu || 'Tunisie'})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#8891a6] font-medium">{exp.dates}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingExpIndex(idx);
                              setExpPoste(exp.poste);
                              setExpEmployeur(exp.employeur);
                              setExpDates(exp.dates);
                              setExpLieu(exp.lieu || '');
                              setExpDesc(exp.description || '');
                              setShowExpModal(true);
                            }}
                            className="text-[#594be0] hover:bg-[#efedff] p-1 rounded-md"
                            title="Modifier"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExperience(idx)}
                            className="text-[#cf3b3b] hover:bg-[#fff0f0] p-1 rounded-md"
                            title="Supprimer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      {exp.description && (
                        <p className="mt-1.5 text-[#5b6378] text-[11px] leading-relaxed">{exp.description}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* 5. FORMATIONS & DIPLÔMES */}
            <section className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-extrabold text-[#171f33] flex items-center gap-2">
                  <GraduationCap size={16} className="text-[#594be0]" /> Formations & Diplômes ({formations.length})
                </h2>
                <button
                  onClick={() => {
                    setEditingFormIndex(null);
                    setFormDiplome('');
                    setFormEcole('');
                    setFormAnnee('2025');
                    setShowFormModal(true);
                  }}
                  className="text-xs font-bold text-[#594be0] hover:underline flex items-center gap-1"
                >
                  <Plus size={14} /> Ajouter une formation
                </button>
              </div>

              <div className="space-y-3">
                {formations.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#d8dce8] p-5 text-center text-xs text-[#828ca1]">
                    Aucune formation renseignée.
                  </div>
                ) : (
                  formations.map((f, idx) => (
                    <div key={idx} className="rounded-2xl border border-[#edf0f7] bg-[#fafbfc] p-4 text-xs font-bold text-[#1a2133] flex justify-between items-center">
                      <div>
                        <span>{f.diplome}</span>
                        <span className="text-[#646e85] font-normal block sm:inline sm:ml-2">— {f.ecole}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[#8891a6] font-medium">{f.annee}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFormIndex(idx);
                            setFormDiplome(f.diplome);
                            setFormEcole(f.ecole);
                            setFormAnnee(f.annee);
                            setShowFormModal(true);
                          }}
                          className="text-[#594be0] hover:bg-[#efedff] p-1 rounded-md"
                          title="Modifier"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFormation(idx)}
                          className="text-[#cf3b3b] hover:bg-[#fff0f0] p-1 rounded-md"
                          title="Supprimer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* 6. LANGUES */}
            <section className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs">
              <h2 className="text-sm font-extrabold text-[#171f33] flex items-center gap-2 mb-3">
                <Languages size={16} className="text-[#594be0]" /> Langues ({langues.length})
              </h2>

              <div className="flex flex-wrap gap-2 mb-3">
                {langues.map((l) => (
                  <span
                    key={l}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#e1e4ef] bg-[#f8f9fc] px-3 py-1.5 text-xs font-bold text-[#444c60]"
                  >
                    {l}
                    <button onClick={() => handleRemoveLanguage(l)} className="text-[#9ea6bb] hover:text-[#20273a]">
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Ex: Anglais, Français, Allemand..."
                  value={newLangNom ?? ''}
                  onChange={(e) => setNewLangNom(e.target.value)}
                  className="rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3 py-2 text-xs text-[#1e2538] outline-none focus:border-[#6355e8]"
                />
                <select
                  value={newLangNiveau}
                  onChange={(e) => setNewLangNiveau(e.target.value)}
                  className="rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3 py-2 text-xs font-semibold text-[#1e2538] outline-none"
                >
                  {LANGUAGE_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddLanguage}
                  className="rounded-xl bg-[#594be0] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#4739d2]"
                >
                  + Ajouter
                </button>
              </div>
            </section>

            {/* 7. DISPONIBILITÉ & PRÉFÉRENCES DU CV */}
            <section className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#f0f2f7] pb-3 mb-4">
                <h3 className="text-sm font-extrabold text-[#171f33] flex items-center gap-2">
                  <Clock size={16} className="text-[#594be0]" /> Préférences professionnelles & Disponibilité
                </h3>
                <span className="text-[11px] text-[#788299]">Visibles par les recruteurs</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-[#353d52]">Disponibilité</label>
                  <select
                    value={disponibilite}
                    onChange={(e) => {
                      setDisponibilite(e.target.value);
                      syncContentToParent({ disponibilite: e.target.value });
                    }}
                    className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] outline-none focus:border-[#6355e8] focus:bg-white"
                  >
                    <option value="Immédiate">Immédiate</option>
                    <option value="Sous 1 mois">Sous 1 mois</option>
                    <option value="Sous 3 mois (préavis)">Sous 3 mois (préavis)</option>
                    <option value="À convenir">À convenir</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#353d52]">Mode de travail souhaité</label>
                  <select
                    value={teletravailSouhaite}
                    onChange={(e) => {
                      const val = e.target.value as 'TOTAL' | 'HYBRIDE' | 'SUR_SITE' | 'INDIFFERENT';
                      setTeletravailSouhaite(val);
                      syncContentToParent({ teletravail_souhaite: val });
                    }}
                    className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] outline-none focus:border-[#6355e8] focus:bg-white"
                  >
                    <option value="HYBRIDE">Hybride (Présentiel + Télétravail)</option>
                    <option value="TOTAL">Télétravail complet (100% Remote)</option>
                    <option value="SUR_SITE">Sur site (Présentiel exclusif)</option>
                    <option value="INDIFFERENT">Indifférent</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-[#353d52]">Prétention salariale indicative</label>
                  <input
                    type="text"
                    value={pretentionSalariale ?? ''}
                    onChange={(e) => {
                      setPretentionSalariale(e.target.value);
                      syncContentToParent({ pretention_salariale: e.target.value });
                    }}
                    placeholder="Ex: 30 000 - 36 000 DT / an ou 35k€ - 42k€"
                    className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] outline-none focus:border-[#6355e8] focus:bg-white"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* COLONNE DROITE: ACTIONS RAPIDES & APERÇU */}
          <aside className="space-y-6">
            <div className="rounded-3xl border border-[#d7d2fa] bg-gradient-to-br from-[#faf9fe] to-[#f2efff] p-6 shadow-xs space-y-4">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#5547d7]">
                Actions Rapides
              </span>
              <p className="text-xs text-[#5d549c] leading-relaxed">
                Toutes les modifications de contenu apportées ici se répercutent en direct dans votre CV dynamique.
              </p>

              <button
                type="button"
                onClick={handleSaveDynamicCv}
                className="w-full rounded-2xl bg-[#594be0] py-3 text-xs font-bold text-white shadow-md shadow-[#594be0]/25 hover:bg-[#4739d2] transition flex items-center justify-center gap-2"
              >
                <Sparkles size={16} /> Mettre à jour mon CV dynamique
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('STUDIO')}
                className="w-full rounded-2xl border border-[#594be0] bg-white py-3 text-xs font-bold text-[#594be0] hover:bg-[#f6f5ff] transition"
              >
                Passer au Studio & Modèles →
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* VUE 2 : STUDIO CV, MISE EN PAGE & GESTION DES FICHIERS */}
      {activeTab === 'STUDIO' && (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* COLONNE GAUCHE: STUDIO & DÉPÔT PC */}
          <div className="space-y-6">
            {/* STUDIO DE CRÉATION DE CV DYNAMIQUE */}
            <section className="rounded-3xl border-2 border-[#594be0]/25 bg-white p-6 sm:p-7 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#f0f2f7] pb-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#efedff] px-2.5 py-0.5 text-[10px] font-extrabold text-[#5547d7]">
                    <Sparkles size={12} /> Studio Interactif
                  </span>
                  <h2 className="mt-1 text-base font-black text-[#171f33]">
                    Personnaliser la mise en page de mon CV
                  </h2>
                  <p className="text-[11px] text-[#717b92]">
                    Choisissez le modèle, les couleurs d'accent et les éléments visuels.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPreviewModal(true)}
                    className="flex items-center gap-1.5 rounded-xl border border-[#594be0] bg-white px-3.5 py-2 text-xs font-bold text-[#594be0] hover:bg-[#f6f5ff] transition"
                  >
                    <Eye size={14} /> Prévisualiser A4
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDynamicCv}
                    className="flex items-center gap-1.5 rounded-xl bg-[#594be0] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#4739d2] transition"
                  >
                    <Download size={14} /> Enregistrer ce CV
                  </button>
                </div>
              </div>

              {/* OPTIONS DE PERSONNALISATION */}
              <div className="mt-5 grid gap-5 sm:grid-cols-3">
                {/* Choix du Template */}
                <div className="sm:col-span-1">
                  <label className="text-xs font-bold text-[#353d52] block mb-2">Modèle de présentation</label>
                  <div className="space-y-2">
                    {[
                      { id: 'moderne', label: 'Moderne Tech', desc: 'Structure 2 colonnes avec accent visuel' },
                      { id: 'minimaliste', label: 'Minimaliste', desc: 'Typographie aérée et sobre' },
                      { id: 'corporate', label: 'Corporate', desc: 'Organisation formelle et classique' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setCvTemplate(t.id as any)}
                        className={`w-full rounded-xl border p-2.5 text-left text-xs transition ${
                          cvTemplate === t.id
                            ? 'border-[#594be0] bg-[#f7f5ff] text-[#594be0] font-bold shadow-xs'
                            : 'border-[#e5e8f0] bg-white text-[#474f65] hover:bg-[#fafbfe]'
                        }`}
                      >
                        <div>{t.label}</div>
                        <div className="text-[10px] text-[#868fa4] font-normal">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Couleur, Titre & Photo */}
                <div className="sm:col-span-2 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-[#353d52] block mb-1.5">
                      Couleur d'accentuation du CV
                    </label>
                    <div className="flex items-center gap-3">
                      {[
                        { color: '#594be0', name: 'Violet Talenta' },
                        { color: '#2563eb', name: 'Bleu Océan' },
                        { color: '#059669', name: 'Vert Émeraude' },
                        { color: '#1e293b', name: 'Ardoise Pro' },
                        { color: '#be123c', name: 'Bordeaux Moderne' },
                      ].map((c) => (
                        <button
                          key={c.color}
                          type="button"
                          onClick={() => setCvAccentColor(c.color)}
                          style={{ backgroundColor: c.color }}
                          className={`size-8 rounded-full border-2 transition ${
                            cvAccentColor === c.color ? 'scale-115 border-white ring-2 ring-[#594be0]' : 'border-white'
                          }`}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#353d52] block mb-1.5">
                      Titre du document exporté
                    </label>
                    <input
                      type="text"
                      value={cvCustomTitle ?? ''}
                      onChange={(e) => setCvCustomTitle(e.target.value)}
                      className="w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2 text-xs text-[#1e2538] outline-none focus:border-[#594be0] focus:bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-[#edf0f7] bg-[#fafbfc] p-3 text-xs">
                    <div className="flex items-center gap-2">
                      <User size={15} className="text-[#594be0]" />
                      <span className="font-bold text-[#353d52]">Afficher ma photo de profil sur le CV</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showPhotoOnCv}
                        onChange={(e) => setShowPhotoOnCv(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-[#d8dce8] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#c5cbd9] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#594be0]"></div>
                    </label>
                  </div>
                </div>
              </div>
            </section>

            {/* IMPORTER UN CV DEPUIS SON PC */}
            <section className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs">
              <h2 className="text-sm font-extrabold text-[#171f33] flex items-center gap-2 mb-2">
                <Upload size={16} className="text-[#594be0]" /> Importer un CV depuis mon PC (PDF ou DOCX)
              </h2>
              <p className="text-[11px] text-[#7d869c] mb-4">
                Si vous avez déjà rédigé un fichier sur votre ordinateur, glissez-le simplement ci-dessous.
              </p>

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition cursor-pointer ${
                  dragActive
                    ? 'border-[#594be0] bg-[#f5f3ff]'
                    : 'border-[#d8dce8] bg-[#fafbfc] hover:border-[#594be0] hover:bg-[#faf9fe]'
                }`}
              >
                <div className="grid size-12 place-items-center rounded-2xl bg-white border border-[#e2e5ef] text-[#594be0] shadow-xs mb-3">
                  <Upload size={22} className={uploading ? 'animate-bounce' : ''} />
                </div>
                <p className="text-xs font-bold text-[#1e263a]">
                  {uploading ? 'Téléversement en cours...' : 'Glissez votre CV ici, ou cliquez pour parcourir'}
                </p>
                <span className="mt-1 text-[11px] text-[#8690a6]">
                  PDF ou Word DOCX (5 Mo maximum)
                </span>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={handleFileInputChange}
                  disabled={uploading}
                />
              </div>

              {uploadError && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#ffd2d2] bg-[#fff5f5] p-3 text-xs font-bold text-[#cf3b3b]">
                  <AlertCircle size={15} /> {uploadError}
                </div>
              )}
            </section>

            {/* MES DOCUMENTS DE CV ENREGISTRÉS */}
            <section className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs">
              <h2 className="text-sm font-extrabold text-[#171f33] flex items-center gap-2 mb-4">
                <FileCheck size={16} className="text-[#594be0]" /> Documents de CV enregistrés ({cvList.length})
              </h2>

              <div className="space-y-3">
                {cvList.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#d8dce8] p-8 text-center text-xs text-[#7d869e]">
                    Aucun CV enregistré.
                  </div>
                ) : (
                  cvList.map((cv) => (
                    <div
                      key={cv.id}
                      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border p-4 text-xs transition ${
                        cv.est_principal ? 'border-[#d7d2fa] bg-[#faf9ff]' : 'border-[#e2e5f0] bg-[#fafbfc]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`grid size-11 place-items-center rounded-xl border shadow-xs shrink-0 ${
                            cv.est_genere
                              ? 'bg-[#efedff] border-[#d8d2fb] text-[#5547d7]'
                              : 'bg-white border-[#e2e5f0] text-[#2563eb]'
                          }`}
                        >
                          <FileText size={22} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 font-bold text-[#1f2638]">
                            <span className="truncate max-w-[260px] sm:max-w-[320px]">{cv.nom_fichier}</span>
                            {cv.est_principal && (
                              <span className="rounded-full bg-[#594be0] px-2.5 py-0.5 text-[9px] font-black text-white">
                                Par défaut
                              </span>
                            )}
                            {cv.est_genere ? (
                              <span className="rounded-full bg-[#efedff] px-2 py-0.5 text-[9px] font-black text-[#5547d7] border border-[#d8d2fb]">
                                🟣 CV Dynamique
                              </span>
                            ) : (
                              <span className="rounded-full bg-[#f0f4fa] px-2 py-0.5 text-[9px] font-bold text-[#355280] border border-[#d3dded]">
                                🔵 Importé du PC
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#838ca0] mt-0.5">
                            {(cv.taille_octets / 1024 / 1024).toFixed(1)} Mo · Déposé le {cv.created_at || 'Aujourd’hui'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        {!cv.est_principal && (
                          <button
                            type="button"
                            onClick={() => handleSetPrincipal(cv.id)}
                            className="rounded-xl border border-[#dde1ee] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#525a6f] hover:border-[#594be0] hover:text-[#594be0] transition"
                          >
                            Définir par défaut
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowPreviewModal(true)}
                          className="rounded-xl border border-[#dde1ee] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#525a6f] hover:bg-[#fafbfc] transition"
                        >
                          Aperçu
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCv(cv.id)}
                          className="rounded-xl border border-[#ffd5d5] bg-white p-2 text-[#d13a3a] hover:bg-[#fff5f5] transition"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* COLONNE DROITE : RÉSUMÉ & STATUT */}
          <aside className="space-y-6">
            <div className="rounded-3xl border border-[#d7d2fa] bg-gradient-to-br from-[#faf9fe] to-[#f2efff] p-6 shadow-xs space-y-4">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#5547d7]">
                CV Actif pour postuler
              </span>
              <div>
                {principalCv ? (
                  <div className="rounded-2xl bg-white p-3.5 border border-[#e3dfff] shadow-xs">
                    <div className="flex items-center gap-2 font-bold text-xs text-[#1a2133]">
                      <FileText size={16} className="text-[#594be0]" />
                      <span className="truncate">{principalCv.nom_fichier}</span>
                    </div>
                    <div className="mt-1 text-[10px] text-[#788299]">
                      {principalCv.est_genere ? 'CV Dynamique généré' : 'Fichier importé'}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-[#788299]">Aucun CV principal sélectionné.</div>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleTabChange('CONTENU')}
                className="w-full rounded-2xl bg-white border border-[#594be0] py-2.5 text-xs font-bold text-[#594be0] hover:bg-[#f6f5ff] transition"
              >
                Éditer le contenu du CV →
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* MODAL AJOUT / ÉDITION EXPÉRIENCE */}
      {showExpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h4 className="text-sm font-extrabold text-[#1a2133]">
              {editingExpIndex !== null ? 'Modifier l’expérience' : 'Nouvelle expérience'}
            </h4>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#333b4e]">Poste *</label>
                <input
                  type="text"
                  value={expPoste ?? ''}
                  onChange={(e) => setExpPoste(e.target.value)}
                  placeholder="Développeur Web Junior"
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none focus:border-[#594be0]"
                />
              </div>
              <div>
                <label className="font-bold text-[#333b4e]">Employeur / Entreprise *</label>
                <input
                  type="text"
                  value={expEmployeur ?? ''}
                  onChange={(e) => setExpEmployeur(e.target.value)}
                  placeholder="WebLabs Tunisie"
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none focus:border-[#594be0]"
                />
              </div>
              <div>
                <label className="font-bold text-[#333b4e]">Dates</label>
                <input
                  type="text"
                  value={expDates ?? ''}
                  onChange={(e) => setExpDates(e.target.value)}
                  placeholder="2025 - 2026"
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none focus:border-[#594be0]"
                />
              </div>
              <div>
                <label className="font-bold text-[#333b4e]">Lieu</label>
                <input
                  type="text"
                  value={expLieu ?? ''}
                  onChange={(e) => setExpLieu(e.target.value)}
                  placeholder="Sfax, Tunisie"
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none focus:border-[#594be0]"
                />
              </div>
              <div>
                <label className="font-bold text-[#333b4e]">Description des missions</label>
                <textarea
                  rows={3}
                  value={expDesc ?? ''}
                  onChange={(e) => setExpDesc(e.target.value)}
                  placeholder="Développement frontend React, intégration d’API REST..."
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none focus:border-[#594be0]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setShowExpModal(false)}
                className="rounded-xl border border-[#dde0ec] px-4 py-2 font-bold text-[#626c83]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveExperience}
                className="rounded-xl bg-[#594be0] px-5 py-2 font-bold text-white hover:bg-[#4739d2]"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AJOUT / ÉDITION FORMATION */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h4 className="text-sm font-extrabold text-[#1a2133]">
              {editingFormIndex !== null ? 'Modifier la formation' : 'Nouvelle formation'}
            </h4>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#333b4e]">Diplôme / Intitulé *</label>
                <input
                  type="text"
                  value={formDiplome ?? ''}
                  onChange={(e) => setFormDiplome(e.target.value)}
                  placeholder="Licence en Informatique de Gestion"
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none focus:border-[#594be0]"
                />
              </div>
              <div>
                <label className="font-bold text-[#333b4e]">École / Université *</label>
                <input
                  type="text"
                  value={formEcole ?? ''}
                  onChange={(e) => setFormEcole(e.target.value)}
                  placeholder="Faculté des Sciences de Sfax"
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none focus:border-[#594be0]"
                />
              </div>
              <div>
                <label className="font-bold text-[#333b4e]">Année</label>
                <input
                  type="text"
                  value={formAnnee ?? ''}
                  onChange={(e) => setFormAnnee(e.target.value)}
                  placeholder="2025"
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none focus:border-[#594be0]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="rounded-xl border border-[#dde0ec] px-4 py-2 font-bold text-[#626c83]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveFormation}
                className="rounded-xl bg-[#594be0] px-5 py-2 font-bold text-white hover:bg-[#4739d2]"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRÉVISUALISATION A4 DU CV */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative my-6 w-full max-w-4xl rounded-3xl bg-[#f0f2f7] p-5 shadow-2xl animate-in fade-in zoom-in-95">
            {/* Barre supérieure */}
            <div className="mb-4 flex items-center justify-between rounded-2xl bg-white px-5 py-3 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="text-sm font-extrabold text-[#171f33]">
                  Aperçu du CV ({cvTemplate.toUpperCase()})
                </span>
                <span className="rounded-full bg-[#f0efff] px-2.5 py-0.5 text-[10px] font-bold text-[#5547d7]">
                  Format A4
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-xl bg-[#594be0] px-4 py-2 text-xs font-bold text-white hover:bg-[#4739d2] transition shadow-xs"
                >
                  <Printer size={14} /> Imprimer / Télécharger en PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="grid size-8 place-items-center rounded-xl text-[#828ba2] hover:bg-[#f2f4f8]"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* FEUILLE A4 INTERACTIVE */}
            <div
              id="printable-cv"
              className="mx-auto max-w-[800px] min-h-[920px] bg-white p-10 rounded-2xl shadow-xl text-[#1e2538] font-sans"
            >
              {/* EN-TÊTE DU CV */}
              <div className="border-b-4 pb-6" style={{ borderColor: cvAccentColor }}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    {showPhotoOnCv && (
                      <div className="size-20 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-[#594be0] shrink-0">
                        {candidat.avatar_url || candidat.user?.avatar_url ? (
                          <img
                            src={candidat.avatar_url || candidat.user?.avatar_url}
                            alt={`${candidat.user?.prenom} ${candidat.user?.nom}`}
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="grid size-full place-items-center text-white font-black text-2xl">
                            {candidat.user?.prenom?.[0] || 'A'}
                            {candidat.user?.nom?.[0] || 'B'}
                          </div>
                        )}
                      </div>
                    )}
                    <div>
                      <h1 className="text-3xl font-black tracking-tight" style={{ color: cvAccentColor }}>
                        {candidat.user?.prenom || 'Amina'} {candidat.user?.nom || 'Ben Salem'}
                      </h1>
                      <div className="text-sm font-bold text-[#474f63] mt-1">
                        {candidat.titre || 'Développeuse Web Full Stack'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-xs text-[#6e7790] space-y-0.5">
                    <div className="flex items-center justify-end gap-1.5 font-medium">
                      <Mail size={12} /> {candidat.user?.email || 'amina@mail.example'}
                    </div>
                    {candidat.telephone && (
                      <div className="flex items-center justify-end gap-1.5">
                        <Phone size={12} /> {candidat.telephone}
                      </div>
                    )}
                    <div className="flex items-center justify-end gap-1.5">
                      <MapPin size={12} /> {candidat.ville || 'Sfax'}, {candidat.pays || 'Tunisie'}
                    </div>
                  </div>
                </div>
              </div>

              {/* CORPS DU CV */}
              <div className="mt-6 grid grid-cols-3 gap-6 text-xs">
                {/* COLONNE GAUCHE (COMPÉTENCES, LANGUES, COORDONNÉES) */}
                <div className="col-span-1 border-r border-[#edf0f7] pr-4 space-y-5">
                  {/* Compétences */}
                  <div>
                    <h3
                      className="font-extrabold uppercase tracking-wider text-[11px] mb-2.5 flex items-center gap-1.5"
                      style={{ color: cvAccentColor }}
                    >
                      <Award size={13} /> Compétences
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {competences.length > 0 ? (
                        competences.map((c) => (
                          <span
                            key={c}
                            className="rounded-lg bg-[#f4f5f9] px-2 py-1 text-[10px] font-bold text-[#333c52]"
                          >
                            {c}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-[#919bb1]">Aucune compétence renseignée.</span>
                      )}
                    </div>
                  </div>

                  {/* Langues */}
                  <div>
                    <h3
                      className="font-extrabold uppercase tracking-wider text-[11px] mb-2.5 flex items-center gap-1.5"
                      style={{ color: cvAccentColor }}
                    >
                      <Languages size={13} /> Langues
                    </h3>
                    <div className="space-y-1.5 text-[11px] text-[#4d556c]">
                      {langues.length > 0 ? (
                        langues.map((l) => (
                          <div key={l} className="font-medium">
                            {l}
                          </div>
                        ))
                      ) : (
                        <div className="text-[10px] text-[#919bb1]">Français, Anglais</div>
                      )}
                    </div>
                  </div>

                  {/* Liens professionnels */}
                  {(linkedinUrl || githubUrl || portfolioUrl) && (
                    <div>
                      <h3
                        className="font-extrabold uppercase tracking-wider text-[11px] mb-2"
                        style={{ color: cvAccentColor }}
                      >
                        Liens
                      </h3>
                      <div className="space-y-1 text-[10px] text-[#555f77] break-all">
                        {linkedinUrl && <div>LinkedIn: {linkedinUrl}</div>}
                        {githubUrl && <div>GitHub: {githubUrl}</div>}
                        {portfolioUrl && <div>Web: {portfolioUrl}</div>}
                      </div>
                    </div>
                  )}
                </div>

                {/* COLONNE DROITE (RÉSUMÉ, EXPÉRIENCES, FORMATIONS) */}
                <div className="col-span-2 space-y-6">
                  {/* Résumé */}
                  {resume && (
                    <div>
                      <h3
                        className="font-extrabold uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-1.5"
                        style={{ color: cvAccentColor }}
                      >
                        <User size={13} /> Profil professionnel
                      </h3>
                      <p className="text-[11px] leading-relaxed text-[#4d556c]">{resume}</p>
                    </div>
                  )}

                  {/* Expériences */}
                  <div>
                    <h3
                      className="font-extrabold uppercase tracking-wider text-[11px] mb-3 flex items-center gap-1.5"
                      style={{ color: cvAccentColor }}
                    >
                      <Briefcase size={13} /> Expériences professionnelles
                    </h3>
                    <div className="space-y-3.5">
                      {experiences.length > 0 ? (
                        experiences.map((exp, i) => (
                          <div key={i} className="text-[11px]">
                            <div className="font-bold text-[#1a2133] flex justify-between">
                              <span>
                                {exp.poste} · <span className="font-semibold text-[#505971]">{exp.employeur}</span>
                              </span>
                              <span className="text-[#8993a8] font-normal">{exp.dates}</span>
                            </div>
                            {exp.description && (
                              <p className="text-[#596277] mt-1 leading-relaxed">{exp.description}</p>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-[10px] text-[#8fa0b5]">
                          Aucune expérience renseignée.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Formations */}
                  <div>
                    <h3
                      className="font-extrabold uppercase tracking-wider text-[11px] mb-3 flex items-center gap-1.5"
                      style={{ color: cvAccentColor }}
                    >
                      <GraduationCap size={13} /> Formations & Diplômes
                    </h3>
                    <div className="space-y-2.5">
                      {formations.length > 0 ? (
                        formations.map((f, i) => (
                          <div key={i} className="text-[11px]">
                            <div className="font-bold text-[#1a2133] flex justify-between">
                              <span>
                                {f.diplome} — <span className="font-semibold text-[#505971]">{f.ecole}</span>
                              </span>
                              <span className="text-[#8993a8] font-normal">{f.annee}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-[10px] text-[#8fa0b5]">
                          Aucune formation renseignée.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
