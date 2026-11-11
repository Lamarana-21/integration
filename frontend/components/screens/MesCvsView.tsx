'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Award,
  Briefcase,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileCheck,
  FilePlus2,
  FileText,
  FolderGit2,
  Globe,
  GraduationCap,
  Languages,
  LayoutTemplate,
  Mail,
  MapPin,
  Palette,
  Phone,
  Plus,
  Printer,
  Save,
  Star,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react';
import {
  Candidat,
  CertificationCv,
  CV,
  CvConfig,
  CvTemplateStyle,
  Experience,
  Formation,
  ProjetCv,
} from '@/lib/types';

interface MesCvsViewProps {
  candidat: Candidat;
  onUploadCv: (file: File) => Promise<{ cv?: CV; error?: string }>;
  onUpdateCvList: (cvs: CV[]) => void;
  onUpdateCandidatProfile?: (updated: Partial<Candidat>) => void;
  onNavigateToProfile: () => void;
}

const SKILL_CATEGORIES: Record<string, string[]> = {
  'Frontend & UI': ['React', 'Next.js', 'TypeScript', 'TailwindCSS', 'Vue.js', 'HTML5 / CSS3', 'UI/UX Design'],
  'Backend & API': ['Node.js', 'PHP / Laravel', 'Python', 'Java / Spring', 'REST API', 'GraphQL'],
  'Données & Cloud': ['SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Docker', 'Git', 'Linux', 'CI/CD'],
  'Gestion & Méthodes': ['Agile / Scrum', 'Gestion de projet', 'Communication', 'Analyse fonctionnelle'],
};

const LANGUAGE_LEVELS = [
  'Natif / Bilingue',
  'C2 - Maîtrise parfaite',
  'C1 - Courant professionnel',
  'B2 - Intermédiaire avancé',
  'B1 - Intermédiaire technique',
  'A2 - Notions de base',
];

const TEMPLATE_OPTIONS: {
  id: CvTemplateStyle;
  label: string;
  badge: string;
  desc: string;
}[] = [
  {
    id: 'moderne',
    label: 'Moderne Tech',
    badge: '2 Colonnes',
    desc: 'Colonne latérale structurée avec compétences, langues et contacts mis en valeur.',
  },
  {
    id: 'corporate',
    label: 'Exécutif Corporate',
    badge: 'Classique',
    desc: 'Mise en page linéaire formelle idéale pour les grands groupes et cabinets.',
  },
  {
    id: 'minimaliste',
    label: 'Minimaliste Épuré',
    badge: 'Éditorial',
    desc: 'Design aéré à haute lisibilité avec chronologie alignée à gauche.',
  },
  {
    id: 'creatif',
    label: 'Studio Créatif',
    badge: 'Bandeau Couleur',
    desc: 'En-tête immersif coloré et sections modernes en cartes structurées.',
  },
];

const ACCENT_COLORS = [
  { color: '#594be0', name: 'Indigo Talenta' },
  { color: '#0f172a', name: 'Ardoise Exécutif' },
  { color: '#0284c7', name: 'Bleu Océan' },
  { color: '#059669', name: 'Émeraude Pro' },
  { color: '#be123c', name: 'Bordeaux Élégant' },
  { color: '#7c3aed', name: 'Violet Créatif' },
];

export function MesCvsView({
  candidat,
  onUploadCv,
  onUpdateCvList,
  onUpdateCandidatProfile,
  onNavigateToProfile,
}: MesCvsViewProps) {
  // Navigation principale : Studio de création en direct vs Bibliothèque de CV
  const [mainView, setMainView] = useState<'STUDIO' | 'BIBLIOTHEQUE'>('STUDIO');
  const [studioStep, setStudioStep] = useState<'DESIGN' | 'PROFIL' | 'PARCOURS' | 'COMPETENCES'>('PROFIL');

  // Liste des CVs du candidat
  const [cvList, setCvList] = useState<CV[]>(candidat.cvs || []);
  const [activeEditingCvId, setActiveEditingCvId] = useState<string | null>(() => {
    const dyn = (candidat.cvs || []).find((c) => c.est_genere);
    return dyn ? dyn.id : null;
  });

  // Upload fichier local
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Paramètres visuels du CV Dynamique
  const [cvTemplate, setCvTemplate] = useState<CvTemplateStyle>('moderne');
  const [cvAccentColor, setCvAccentColor] = useState<string>('#594be0');
  const [showPhotoOnCv, setShowPhotoOnCv] = useState(true);
  const [showLinksOnCv, setShowLinksOnCv] = useState(true);
  const [showDispoOnCv, setShowDispoOnCv] = useState(true);
  const [cvCustomTitle, setCvCustomTitle] = useState(
    `CV_${candidat.prenom || candidat.user?.prenom || 'Candidat'}_${candidat.nom || candidat.user?.nom || ''}`
      .replace(/\s+/g, '_')
  );

  // Contenu éditable du CV dynamique
  const [titrePoste, setTitrePoste] = useState(candidat.titre || 'Développeur Web Full Stack');
  const [resume, setResume] = useState(candidat.resume || '');
  const [linkedinUrl, setLinkedinUrl] = useState(candidat.linkedin_url || '');
  const [githubUrl, setGithubUrl] = useState(candidat.github_url || '');
  const [portfolioUrl, setPortfolioUrl] = useState(candidat.portfolio_url || '');

  const [competences, setCompetences] = useState<string[]>(
    candidat.competences && candidat.competences.length > 0
      ? candidat.competences
      : ['React', 'TypeScript', 'Node.js', 'SQL', 'Git']
  );
  const [newSkill, setNewSkill] = useState('');
  const [selectedSkillCategory, setSelectedSkillCategory] = useState<string>('Frontend & UI');

  const [experiences, setExperiences] = useState<Experience[]>(candidat.experiences || []);
  const [formations, setFormations] = useState<Formation[]>(candidat.formations || []);
  const [langues, setLangues] = useState<string[]>(
    candidat.langues && candidat.langues.length > 0
      ? candidat.langues
      : ['Français (Bilingue)', 'Anglais (Professionnel)']
  );
  const [projets, setProjets] = useState<ProjetCv[]>([
    {
      id: 'proj-1',
      nom: 'Plateforme SaaS & Tableau de Bord Métier',
      description: 'Architecture modulaire, interface réactive et API REST sécurisée.',
      technologies: ['React', 'TypeScript', 'Node.js'],
    },
  ]);
  const [certifications, setCertifications] = useState<CertificationCv[]>([]);

  // Préférences
  const [disponibilite, setDisponibilite] = useState<string>(candidat.disponibilite || 'Immédiate');
  const [teletravailSouhaite, setTeletravailSouhaite] = useState<'TOTAL' | 'HYBRIDE' | 'SUR_SITE' | 'INDIFFERENT'>(
    candidat.teletravail_souhaite || 'HYBRIDE'
  );
  const [pretentionSalariale, setPretentionSalariale] = useState<string>(
    candidat.pretention_salariale || ''
  );

  // Langues form
  const [newLangNom, setNewLangNom] = useState('');
  const [newLangNiveau, setNewLangNiveau] = useState('C1 - Courant professionnel');

  // Modals Expérience / Formation / Projet / Certification / Aperçu plein écran
  const [showExpModal, setShowExpModal] = useState(false);
  const [editingExpIndex, setEditingExpIndex] = useState<number | null>(null);
  const [expPoste, setExpPoste] = useState('');
  const [expEmployeur, setExpEmployeur] = useState('');
  const [expLieu, setExpLieu] = useState('');
  const [expDates, setExpDates] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expTechs, setExpTechs] = useState('');

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingFormIndex, setEditingFormIndex] = useState<number | null>(null);
  const [formDiplome, setFormDiplome] = useState('');
  const [formEcole, setFormEcole] = useState('');
  const [formAnnee, setFormAnnee] = useState('');
  const [formDesc, setFormDesc] = useState('');

  const [showProjModal, setShowProjModal] = useState(false);
  const [editingProjIndex, setEditingProjIndex] = useState<number | null>(null);
  const [projNom, setProjNom] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projTechs, setProjTechs] = useState('');
  const [projLien, setProjLien] = useState('');

  const [showCertModal, setShowCertModal] = useState(false);
  const [certNom, setCertNom] = useState('');
  const [certOrganisme, setCertOrganisme] = useState('');
  const [certAnnee, setCertAnnee] = useState('2026');

  const [showFullscreenPreview, setShowFullscreenPreview] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Synchronisation initiale avec le profil candidat
  useEffect(() => {
    if (candidat) {
      if (candidat.cvs) setCvList(candidat.cvs);
      if (candidat.titre) setTitrePoste(candidat.titre);
      if (candidat.competences && candidat.competences.length > 0) setCompetences(candidat.competences);
      if (candidat.experiences) setExperiences(candidat.experiences);
      if (candidat.formations) setFormations(candidat.formations);
      if (candidat.langues && candidat.langues.length > 0) setLangues(candidat.langues);
      if (candidat.resume !== undefined) setResume(candidat.resume || '');
      if (candidat.linkedin_url !== undefined) setLinkedinUrl(candidat.linkedin_url || '');
      if (candidat.github_url !== undefined) setGithubUrl(candidat.github_url || '');
      if (candidat.portfolio_url !== undefined) setPortfolioUrl(candidat.portfolio_url || '');
      if (candidat.disponibilite) setDisponibilite(candidat.disponibilite);
      if (candidat.teletravail_souhaite) setTeletravailSouhaite(candidat.teletravail_souhaite);
      if (candidat.pretention_salariale !== undefined) setPretentionSalariale(candidat.pretention_salariale || '');
    }
  }, [candidat.id]);

  // Calcul de complétude du CV (100% basé sur la structure, sans score IA)
  const cvCompleteness = useMemo(() => {
    const checks = [
      { label: 'Titre & Accroche', ok: Boolean(titrePoste.trim() && resume.trim().length >= 20) },
      { label: 'Expériences', ok: experiences.length > 0 },
      { label: 'Formations', ok: formations.length > 0 },
      { label: 'Compétences (min. 3)', ok: competences.length >= 3 },
      { label: 'Langues', ok: langues.length > 0 },
      { label: 'Liens ou Projets', ok: Boolean(linkedinUrl || githubUrl || portfolioUrl || projets.length > 0) },
    ];
    const done = checks.filter((c) => c.ok).length;
    return {
      percent: Math.round((done / checks.length) * 100),
      checks,
    };
  }, [titrePoste, resume, experiences, formations, competences, langues, linkedinUrl, githubUrl, portfolioUrl, projets]);

  // Synchronisation vers le profil parent (et MySQL)
  const syncContentToParent = (overrides?: Partial<Candidat>) => {
    if (onUpdateCandidatProfile) {
      onUpdateCandidatProfile({
        titre: titrePoste,
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

  // Charger la configuration d'un CV dynamique spécifique dans le Studio
  const handleLoadCvInStudio = (cv: CV) => {
    setActiveEditingCvId(cv.id);
    if (cv.template_style) setCvTemplate(cv.template_style);
    if (cv.titre_personnalise) {
      setCvCustomTitle(cv.titre_personnalise);
    } else {
      setCvCustomTitle(cv.nom_fichier.replace(/\.pdf$/i, ''));
    }

    if (cv.cv_config) {
      const cfg = cv.cv_config;
      if (cfg.titre_poste !== undefined) setTitrePoste(cfg.titre_poste);
      if (cfg.resume !== undefined) setResume(cfg.resume);
      if (cfg.accent_color) setCvAccentColor(cfg.accent_color);
      if (cfg.show_photo !== undefined) setShowPhotoOnCv(cfg.show_photo);
      if (cfg.show_links !== undefined) setShowLinksOnCv(cfg.show_links);
      if (cfg.show_disponibilite !== undefined) setShowDispoOnCv(cfg.show_disponibilite);
      if (cfg.competences) setCompetences(cfg.competences);
      if (cfg.experiences) setExperiences(cfg.experiences);
      if (cfg.formations) setFormations(cfg.formations);
      if (cfg.langues) setLangues(cfg.langues);
      if (cfg.projets) setProjets(cfg.projets);
      if (cfg.certifications) setCertifications(cfg.certifications);
    }
    setMainView('STUDIO');
    triggerToast(`CV « ${cv.nom_fichier} » chargé dans le Studio.`);
  };

  // Créer une nouvelle variante de CV dynamique
  const handleCreateNewDynamicCv = () => {
    const currentSnapshot: CvConfig = {
      titre_poste: titrePoste,
      resume,
      accent_color: cvAccentColor,
      show_photo: showPhotoOnCv,
      show_links: showLinksOnCv,
      show_disponibilite: showDispoOnCv,
      competences: [...competences],
      experiences: [...experiences],
      formations: [...formations],
      langues: [...langues],
      projets: [...projets],
      certifications: [...certifications],
    };

    const variantNumber = cvList.filter((c) => c.est_genere).length + 1;
    const cleanTitle = `CV_${candidat.prenom || 'Candidat'}_${titrePoste.replace(/[^a-zA-Z0-9]/g, '_')}_v${variantNumber}`;
    const newCv: CV = {
      id: `cv-dyn-${Date.now()}`,
      candidat_id: candidat.id,
      nom_fichier: `${cleanTitle}.pdf`,
      titre_personnalise: cleanTitle,
      type_mime: 'application/pdf',
      taille_octets: 1280000,
      url_stockage: '#',
      created_at: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString().split('T')[0],
      est_principal: cvList.length === 0,
      est_genere: true,
      source_type: 'DYNAMIQUE',
      template_style: cvTemplate,
      cv_config: currentSnapshot,
    };

    const updated = [newCv, ...cvList];
    setCvList(updated);
    onUpdateCvList(updated);
    setActiveEditingCvId(newCv.id);
    setCvCustomTitle(cleanTitle);
    setMainView('STUDIO');
    triggerToast('Nouvelle version de CV dynamique créée !');
  };

  // Enregistrer / Mettre à jour le CV dynamique actif
  const handleSaveDynamicCv = () => {
    syncContentToParent();

    const currentSnapshot: CvConfig = {
      titre_poste: titrePoste,
      resume,
      accent_color: cvAccentColor,
      show_photo: showPhotoOnCv,
      show_links: showLinksOnCv,
      show_disponibilite: showDispoOnCv,
      competences: [...competences],
      experiences: [...experiences],
      formations: [...formations],
      langues: [...langues],
      projets: [...projets],
      certifications: [...certifications],
    };

    const sanitizedFileName = `${(cvCustomTitle || 'CV_Dynamique').trim().replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9_\-]/g, '_')}.pdf`;

    const targetIndex = activeEditingCvId
      ? cvList.findIndex((c) => c.id === activeEditingCvId)
      : cvList.findIndex((c) => c.est_genere);

    let updated: CV[];
    if (targetIndex >= 0) {
      const existing = cvList[targetIndex];
      const updatedCv: CV = {
        ...existing,
        nom_fichier: sanitizedFileName,
        titre_personnalise: cvCustomTitle.trim(),
        updated_at: new Date().toISOString().split('T')[0],
        est_genere: true,
        source_type: 'DYNAMIQUE',
        template_style: cvTemplate,
        cv_config: currentSnapshot,
      };
      updated = cvList.map((c, idx) => (idx === targetIndex ? updatedCv : c));
      setActiveEditingCvId(updatedCv.id);
    } else {
      const newDynamicCv: CV = {
        id: `cv-dyn-${Date.now()}`,
        candidat_id: candidat.id,
        nom_fichier: sanitizedFileName,
        titre_personnalise: cvCustomTitle.trim(),
        type_mime: 'application/pdf',
        taille_octets: 1250000,
        url_stockage: '#',
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
        est_principal: true,
        est_genere: true,
        source_type: 'DYNAMIQUE',
        template_style: cvTemplate,
        cv_config: currentSnapshot,
      };
      updated = [newDynamicCv, ...cvList.map((c) => ({ ...c, est_principal: false }))];
      setActiveEditingCvId(newDynamicCv.id);
    }

    setCvList(updated);
    onUpdateCvList(updated);
    triggerToast('Votre CV dynamique a été enregistré et synchronisé avec succès !');
  };

  // Dupliquer un CV dynamique
  const handleDuplicateCv = (cv: CV) => {
    const baseName = cv.nom_fichier.replace(/\.pdf$/i, '');
    const copyCv: CV = {
      ...cv,
      id: `cv-dyn-${Date.now()}`,
      nom_fichier: `${baseName}_Copie.pdf`,
      titre_personnalise: `${baseName}_Copie`,
      created_at: new Date().toISOString().split('T')[0],
      est_principal: false,
      est_genere: true,
    };
    const updated = [copyCv, ...cvList];
    setCvList(updated);
    onUpdateCvList(updated);
    triggerToast(`Copie de « ${cv.nom_fichier} » créée.`);
  };

  // Modèles d'accroches professionnelles prêts à l'emploi (sans IA)
  const applySummaryTemplate = (preset: 'JUNIOR' | 'CONFIRME' | 'STAGE' | 'POLYVALENT') => {
    const topSkills = competences.slice(0, 4).join(', ') || 'technologies web modernes';
    const role = titrePoste || 'Développeur';
    let text = '';
    if (preset === 'JUNIOR') {
      text = `${role} dynamique et rigoureux(se), doté(e) d'une solide maîtrise de ${topSkills}. Passionné(e) par la conception d'applications fiables et centrées utilisateur, je souhaite m'investir pleinement au sein d'une équipe technique ambitieuse.`;
    } else if (preset === 'CONFIRME') {
      text = `${role} expérimenté(e) spécialisé(e) en ${topSkills}, avec une expérience concrète dans le cycle complet de développement logiciel. Orienté(e) qualité, performance et collaboration agile.`;
    } else if (preset === 'STAGE') {
      text = `En formation supérieure et passionné(e) par le métier de ${role}, je maîtrise ${topSkills} à travers plusieurs réalisations concrètes. Disponible (${disponibilite.toLowerCase()}) pour contribuer activement à vos projets.`;
    } else {
      text = `Profil polyvalent en ${role} combinant compétences techniques (${topSkills}), sens de l'organisation et capacité d'adaptation rapide aux environnements métiers exigeants.`;
    }
    setResume(text);
    syncContentToParent({ resume: text });
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

  // Expériences + Réorganisation Haut/Bas
  const handleSaveExperience = () => {
    if (!expPoste.trim() || !expEmployeur.trim()) return;
    const techList = expTechs
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const newExp: Experience = {
      id: editingExpIndex !== null ? experiences[editingExpIndex].id || `exp-${Date.now()}` : `exp-${Date.now()}`,
      poste: expPoste.trim(),
      employeur: expEmployeur.trim(),
      lieu: expLieu.trim() || candidat.ville || 'Tunis',
      dates: expDates.trim() || '2025 - Présent',
      description: expDesc.trim(),
      technologies: techList.length > 0 ? techList : undefined,
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

  const handleMoveExperience = (idx: number, direction: -1 | 1) => {
    const target = idx + direction;
    if (target < 0 || target >= experiences.length) return;
    const updated = [...experiences];
    const temp = updated[idx];
    updated[idx] = updated[target];
    updated[target] = temp;
    setExperiences(updated);
    syncContentToParent({ experiences: updated });
  };

  const handleDeleteExperience = (idx: number) => {
    const updated = experiences.filter((_, i) => i !== idx);
    setExperiences(updated);
    syncContentToParent({ experiences: updated });
  };

  // Formations + Réorganisation
  const handleSaveFormation = () => {
    if (!formDiplome.trim() || !formEcole.trim()) return;
    const newForm: Formation = {
      id: editingFormIndex !== null ? formations[editingFormIndex].id || `form-${Date.now()}` : `form-${Date.now()}`,
      diplome: formDiplome.trim(),
      ecole: formEcole.trim(),
      annee: formAnnee.trim() || '2025',
      description: formDesc.trim() || undefined,
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

  const handleMoveFormation = (idx: number, direction: -1 | 1) => {
    const target = idx + direction;
    if (target < 0 || target >= formations.length) return;
    const updated = [...formations];
    const temp = updated[idx];
    updated[idx] = updated[target];
    updated[target] = temp;
    setFormations(updated);
    syncContentToParent({ formations: updated });
  };

  const handleDeleteFormation = (idx: number) => {
    const updated = formations.filter((_, i) => i !== idx);
    setFormations(updated);
    syncContentToParent({ formations: updated });
  };

  // Projets
  const handleSaveProjet = () => {
    if (!projNom.trim()) return;
    const techList = projTechs
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const newProj: ProjetCv = {
      id: editingProjIndex !== null ? projets[editingProjIndex].id || `proj-${Date.now()}` : `proj-${Date.now()}`,
      nom: projNom.trim(),
      description: projDesc.trim(),
      technologies: techList.length > 0 ? techList : undefined,
      lien: projLien.trim() || undefined,
    };
    if (editingProjIndex !== null) {
      const updated = [...projets];
      updated[editingProjIndex] = newProj;
      setProjets(updated);
    } else {
      setProjets([newProj, ...projets]);
    }
    setShowProjModal(false);
  };

  // Certifications
  const handleSaveCertification = () => {
    if (!certNom.trim()) return;
    setCertifications([
      ...certifications,
      {
        id: `cert-${Date.now()}`,
        nom: certNom.trim(),
        organisme: certOrganisme.trim() || 'Organisme certifié',
        annee: certAnnee.trim() || '2026',
      },
    ]);
    setCertNom('');
    setCertOrganisme('');
    setShowCertModal(false);
  };

  // Téléversement de fichier depuis le PC
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
      setUploadError('Format non accepté. Veuillez choisir un document PDF ou DOCX.');
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
      source_type: 'FICHIER_LOCAL',
    };

    const updated = [newCvItem, ...cvList];
    setCvList(updated);
    onUpdateCvList(updated);
    triggerToast(`Fichier « ${file.name} » importé avec succès !`);
  };

  const handleSetPrincipal = (cvId: string) => {
    const updated = cvList.map((c) => ({ ...c, est_principal: c.id === cvId }));
    setCvList(updated);
    onUpdateCvList(updated);
    triggerToast('CV défini par défaut pour vos prochaines candidatures.');
  };

  const handleDeleteCv = (cvId: string) => {
    const remaining = cvList.filter((c) => c.id !== cvId);
    if (remaining.length > 0 && !remaining.some((c) => c.est_principal)) {
      remaining[0].est_principal = true;
    }
    setCvList(remaining);
    onUpdateCvList(remaining);
    if (activeEditingCvId === cvId) {
      setActiveEditingCvId(remaining.find((c) => c.est_genere)?.id || null);
    }
    triggerToast('Document supprimé.');
  };

  // Données d'identité résolues
  const fullName = `${candidat.prenom || candidat.user?.prenom || 'Amina'} ${candidat.nom || candidat.user?.nom || 'Ben Salem'}`.trim();
  const initials = `${(candidat.prenom || candidat.user?.prenom || 'A')[0]}${(candidat.nom || candidat.user?.nom || 'B')[0]}`.toUpperCase();
  const emailAddr = candidat.user?.email || 'amina@mail.example';
  const phoneStr = candidat.telephone || '+216 98 123 456';
  const locationStr = `${candidat.ville || 'Sfax'}, ${candidat.pays || 'Tunisie'}`;
  const avatarSrc = candidat.avatar_url || candidat.user?.avatar_url;

  // ── RENDU DYNAMIQUE DE LA FEUILLE A4 SELON LE MODÈLE CHOISI ───────────────
  const renderCvSheet = (isPrintContainer = false) => {
    return (
      <div
        id={isPrintContainer ? 'printable-cv' : undefined}
        className="w-full bg-white text-[#1e2538] shadow-lg rounded-2xl overflow-hidden border border-[#e5e8f0] font-sans transition-all"
        style={{ minHeight: '780px' }}
      >
        {/* ════════════════════════════════════════════════════════════════ */}
        {/* MODÈLE 1 : MODERNE TECH (2 COLONNES AVEC SIDEBAR TEINTÉE)       */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {cvTemplate === 'moderne' && (
          <div className="grid grid-cols-12 min-h-[780px]">
            {/* Colonne Gauche (Sidebar 4/12) */}
            <div
              className="col-span-4 p-6 space-y-5 border-r border-[#edf0f7]"
              style={{ backgroundColor: `${cvAccentColor}08` }}
            >
              {/* Photo & Identité */}
              <div className="space-y-3">
                {showPhotoOnCv && (
                  <div
                    className="size-20 rounded-2xl overflow-hidden border-2 border-white shadow-md grid place-items-center text-white font-black text-xl"
                    style={{ backgroundColor: cvAccentColor }}
                  >
                    {avatarSrc ? (
                      <img src={avatarSrc} alt={fullName} className="size-full object-cover" />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-black leading-tight text-[#171f33]">{fullName}</h2>
                  <p className="text-xs font-extrabold mt-0.5" style={{ color: cvAccentColor }}>
                    {titrePoste}
                  </p>
                </div>
              </div>

              {/* Coordonnées */}
              <div className="space-y-1.5 text-[11px] text-[#4b5568] pt-2 border-t border-[#e5e8f0]">
                <div className="font-extrabold uppercase tracking-wider text-[10px]" style={{ color: cvAccentColor }}>
                  Contact
                </div>
                <div className="flex items-center gap-1.5 break-all">
                  <Mail size={11} className="shrink-0" style={{ color: cvAccentColor }} />
                  <span>{emailAddr}</span>
                </div>
                {phoneStr && (
                  <div className="flex items-center gap-1.5">
                    <Phone size={11} className="shrink-0" style={{ color: cvAccentColor }} />
                    <span>{phoneStr}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <MapPin size={11} className="shrink-0" style={{ color: cvAccentColor }} />
                  <span>{locationStr}</span>
                </div>
                {showDispoOnCv && (
                  <div className="flex items-center gap-1.5 pt-1 font-semibold text-[#171f33]">
                    <Clock size={11} className="shrink-0" style={{ color: cvAccentColor }} />
                    <span>Dispo : {disponibilite} ({teletravailSouhaite})</span>
                  </div>
                )}
              </div>

              {/* Compétences */}
              <div className="space-y-2 pt-2 border-t border-[#e5e8f0]">
                <div className="font-extrabold uppercase tracking-wider text-[10px]" style={{ color: cvAccentColor }}>
                  Compétences Clés
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {competences.map((c) => (
                    <span
                      key={c}
                      className="rounded-lg px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs"
                      style={{ backgroundColor: cvAccentColor }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Langues */}
              {langues.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-[#e5e8f0]">
                  <div className="font-extrabold uppercase tracking-wider text-[10px]" style={{ color: cvAccentColor }}>
                    Langues
                  </div>
                  <div className="space-y-1 text-[11px] text-[#3b4356]">
                    {langues.map((l) => (
                      <div key={l} className="font-medium">• {l}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Liens */}
              {showLinksOnCv && (linkedinUrl || githubUrl || portfolioUrl) && (
                <div className="space-y-1 pt-2 border-t border-[#e5e8f0] text-[10px] text-[#4b5568] break-all">
                  <div className="font-extrabold uppercase tracking-wider text-[10px]" style={{ color: cvAccentColor }}>
                    Liens & Réseaux
                  </div>
                  {githubUrl && <div>GitHub : {githubUrl.replace(/^https?:\/\//, '')}</div>}
                  {linkedinUrl && <div>LinkedIn : {linkedinUrl.replace(/^https?:\/\//, '')}</div>}
                  {portfolioUrl && <div>Web : {portfolioUrl.replace(/^https?:\/\//, '')}</div>}
                </div>
              )}

              {/* Certifications */}
              {certifications.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-[#e5e8f0]">
                  <div className="font-extrabold uppercase tracking-wider text-[10px]" style={{ color: cvAccentColor }}>
                    Certifications
                  </div>
                  {certifications.map((cert, i) => (
                    <div key={i} className="text-[10px]">
                      <div className="font-bold text-[#171f33]">{cert.nom}</div>
                      <div className="text-[#6e778f]">{cert.organisme} ({cert.annee})</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Colonne Droite (Contenu Principal 8/12) */}
            <div className="col-span-8 p-7 space-y-5">
              {/* Accroche */}
              {resume && (
                <div className="rounded-xl bg-[#f8fafc] p-3.5 border-l-4" style={{ borderColor: cvAccentColor }}>
                  <div className="font-extrabold uppercase tracking-wider text-[10px] mb-1" style={{ color: cvAccentColor }}>
                    Profil Professionnel
                  </div>
                  <p className="text-[11px] leading-relaxed text-[#334155]">{resume}</p>
                </div>
              )}

              {/* Expériences */}
              <div className="space-y-3">
                <div
                  className="font-extrabold uppercase tracking-wider text-[11px] pb-1 border-b-2 flex items-center gap-1.5"
                  style={{ color: cvAccentColor, borderColor: `${cvAccentColor}30` }}
                >
                  <Briefcase size={13} /> Expériences Professionnelles
                </div>
                <div className="space-y-3.5">
                  {experiences.map((exp, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="text-xs font-black text-[#171f33]">
                          {exp.poste} <span className="font-semibold text-[#555f75]">— {exp.employeur}</span>
                        </div>
                        <span className="text-[10px] font-bold text-[#64748b] shrink-0">{exp.dates}</span>
                      </div>
                      {exp.description && (
                        <p className="text-[11px] leading-relaxed text-[#475569]">{exp.description}</p>
                      )}
                      {exp.technologies && exp.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {exp.technologies.map((t) => (
                            <span key={t} className="rounded bg-[#f1f5f9] px-1.5 py-0.5 text-[9px] font-bold text-[#475569]">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Projets */}
              {projets.length > 0 && (
                <div className="space-y-2.5">
                  <div
                    className="font-extrabold uppercase tracking-wider text-[11px] pb-1 border-b-2 flex items-center gap-1.5"
                    style={{ color: cvAccentColor, borderColor: `${cvAccentColor}30` }}
                  >
                    <FolderGit2 size={13} /> Projets & Réalisations
                  </div>
                  <div className="space-y-2.5">
                    {projets.map((p, i) => (
                      <div key={i} className="text-[11px]">
                        <div className="font-bold text-[#171f33] flex items-center justify-between">
                          <span>{p.nom}</span>
                          {p.technologies && (
                            <span className="text-[9px] font-semibold text-[#64748b]">
                              {p.technologies.join(' · ')}
                            </span>
                          )}
                        </div>
                        <p className="text-[#475569] text-[10.5px] leading-relaxed">{p.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formations */}
              <div className="space-y-2.5">
                <div
                  className="font-extrabold uppercase tracking-wider text-[11px] pb-1 border-b-2 flex items-center gap-1.5"
                  style={{ color: cvAccentColor, borderColor: `${cvAccentColor}30` }}
                >
                  <GraduationCap size={13} /> Formations & Diplômes
                </div>
                <div className="space-y-2.5">
                  {formations.map((f, i) => (
                    <div key={i} className="text-[11px]">
                      <div className="flex items-baseline justify-between">
                        <span className="font-bold text-[#171f33]">
                          {f.diplome} <span className="font-normal text-[#555f75]">— {f.ecole}</span>
                        </span>
                        <span className="text-[10px] font-bold text-[#64748b]">{f.annee}</span>
                      </div>
                      {f.description && <p className="text-[10px] text-[#64748b] mt-0.5">{f.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* MODÈLE 2 : EXÉCUTIF CORPORATE (CLASSIQUE 1 COLONNE STRUCTURÉE)  */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {cvTemplate === 'corporate' && (
          <div className="p-8 space-y-5">
            <div className="border-b-2 pb-5 flex items-center justify-between gap-4" style={{ borderColor: cvAccentColor }}>
              <div className="flex items-center gap-4">
                {showPhotoOnCv && (
                  <div
                    className="size-16 rounded-xl overflow-hidden grid place-items-center text-white font-black text-lg shrink-0"
                    style={{ backgroundColor: cvAccentColor }}
                  >
                    {avatarSrc ? <img src={avatarSrc} alt={fullName} className="size-full object-cover" /> : initials}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-black uppercase tracking-tight text-[#0f172a]">{fullName}</h1>
                  <div className="text-sm font-bold mt-0.5" style={{ color: cvAccentColor }}>
                    {titrePoste}
                  </div>
                  <div className="text-[11px] text-[#64748b] mt-1 flex flex-wrap gap-3">
                    <span>{emailAddr}</span>
                    <span>•</span>
                    <span>{phoneStr}</span>
                    <span>•</span>
                    <span>{locationStr}</span>
                  </div>
                </div>
              </div>
              {showDispoOnCv && (
                <div className="text-right text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-[#e2e8f0] bg-[#f8fafc]">
                  Disponibilité : {disponibilite}
                </div>
              )}
            </div>

            {resume && (
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-widest mb-1.5" style={{ color: cvAccentColor }}>
                  Synthèse Professionnelle
                </h3>
                <p className="text-xs leading-relaxed text-[#334155]">{resume}</p>
              </div>
            )}

            <div>
              <h3 className="text-[11px] font-black uppercase tracking-widest mb-2.5 border-b pb-1" style={{ color: cvAccentColor }}>
                Expériences Professionnelles
              </h3>
              <div className="space-y-3">
                {experiences.map((exp, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs font-bold text-[#0f172a]">
                      <span>{exp.poste} — {exp.employeur} ({exp.lieu || 'Tunisie'})</span>
                      <span className="text-[#64748b]">{exp.dates}</span>
                    </div>
                    {exp.description && <p className="text-[11px] text-[#475569] mt-1">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[11px] font-black uppercase tracking-widest mb-2.5 border-b pb-1" style={{ color: cvAccentColor }}>
                Formations Académiques
              </h3>
              <div className="space-y-2">
                {formations.map((f, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="font-bold text-[#0f172a]">{f.diplome} — <span className="font-normal text-[#475569]">{f.ecole}</span></span>
                    <span className="text-[#64748b] font-semibold">{f.annee}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-2 border-t border-[#e2e8f0]">
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: cvAccentColor }}>
                  Compétences Techniques
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {competences.map((c) => (
                    <span key={c} className="rounded border border-[#cbd5e1] bg-[#f8fafc] px-2 py-0.5 text-[10px] font-bold text-[#1e293b]">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: cvAccentColor }}>
                  Langues & Informations
                </h3>
                <div className="text-[11px] text-[#334155] space-y-1">
                  {langues.map((l) => (
                    <div key={l}>• {l}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* MODÈLE 3 : MINIMALISTE ÉPURÉ (STYLE ÉDITORIAL CHRONOLOGIQUE)    */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {cvTemplate === 'minimaliste' && (
          <div className="p-9 space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-light tracking-tight text-[#0f172a]">
                <strong className="font-black">{fullName}</strong>
              </h1>
              <div className="text-xs font-bold uppercase tracking-widest" style={{ color: cvAccentColor }}>
                {titrePoste}
              </div>
              <div className="text-[11px] text-[#64748b] flex flex-wrap gap-x-4 gap-y-1 pt-1">
                <span>{emailAddr}</span>
                <span>{phoneStr}</span>
                <span>{locationStr}</span>
                {showLinksOnCv && githubUrl && <span>{githubUrl.replace(/^https?:\/\//, '')}</span>}
              </div>
            </div>

            {resume && (
              <p className="text-xs leading-relaxed text-[#475569] border-l-2 pl-4" style={{ borderColor: cvAccentColor }}>
                {resume}
              </p>
            )}

            <div className="space-y-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8]">Expériences</div>
              {experiences.map((exp, i) => (
                <div key={i} className="grid grid-cols-[110px_1fr] gap-4 text-xs">
                  <div className="text-[10px] font-bold text-[#64748b] pt-0.5">{exp.dates}</div>
                  <div>
                    <div className="font-extrabold text-[#0f172a]">{exp.poste} · <span className="font-medium text-[#475569]">{exp.employeur}</span></div>
                    {exp.description && <p className="text-[11px] text-[#475569] mt-1 leading-relaxed">{exp.description}</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8]">Formations</div>
              {formations.map((f, i) => (
                <div key={i} className="grid grid-cols-[110px_1fr] gap-4 text-xs">
                  <div className="text-[10px] font-bold text-[#64748b]">{f.annee}</div>
                  <div className="font-bold text-[#0f172a]">{f.diplome} — <span className="font-normal text-[#475569]">{f.ecole}</span></div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-[110px_1fr] gap-4 pt-3 border-t border-[#f1f5f9] text-xs">
              <div className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8]">Expertise</div>
              <div className="flex flex-wrap gap-1.5">
                {competences.map((c) => (
                  <span key={c} className="text-[11px] font-bold text-[#0f172a] after:content-['·'] last:after:content-none after:ml-1.5 after:text-[#cbd5e1]">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* MODÈLE 4 : STUDIO CRÉATIF (BANDEAU COULEUR PLEINE LARGEUR)      */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {cvTemplate === 'creatif' && (
          <div>
            <div className="p-7 text-white flex items-center justify-between gap-4" style={{ backgroundColor: cvAccentColor }}>
              <div className="flex items-center gap-4">
                {showPhotoOnCv && (
                  <div className="size-20 rounded-2xl overflow-hidden border-2 border-white/80 bg-white/20 grid place-items-center text-white font-black text-xl shrink-0">
                    {avatarSrc ? <img src={avatarSrc} alt={fullName} className="size-full object-cover" /> : initials}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-black tracking-tight">{fullName}</h1>
                  <p className="text-xs font-bold text-white/90 mt-0.5">{titrePoste}</p>
                  {resume && <p className="text-[11px] text-white/80 mt-2 max-w-xl leading-relaxed">{resume}</p>}
                </div>
              </div>
            </div>

            <div className="bg-[#f8fafc] px-7 py-2.5 border-b border-[#e2e8f0] flex flex-wrap items-center justify-between gap-3 text-[11px] font-semibold text-[#475569]">
              <span>{emailAddr}</span>
              <span>{phoneStr}</span>
              <span>{locationStr}</span>
              {showDispoOnCv && <span style={{ color: cvAccentColor }}>Disponibilité : {disponibilite}</span>}
            </div>

            <div className="p-7 grid grid-cols-12 gap-6">
              <div className="col-span-7 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: cvAccentColor }}>
                  Parcours Professionnel
                </h3>
                <div className="space-y-3">
                  {experiences.map((exp, i) => (
                    <div key={i} className="rounded-xl border border-[#e2e8f0] p-3.5 bg-[#fafbfc]">
                      <div className="flex justify-between items-baseline">
                        <span className="font-black text-xs text-[#0f172a]">{exp.poste}</span>
                        <span className="text-[10px] font-bold" style={{ color: cvAccentColor }}>{exp.dates}</span>
                      </div>
                      <div className="text-[11px] font-semibold text-[#64748b]">{exp.employeur}</div>
                      {exp.description && <p className="text-[11px] text-[#475569] mt-1.5 leading-relaxed">{exp.description}</p>}
                    </div>
                  ))}
                </div>

                {projets.length > 0 && (
                  <>
                    <h3 className="text-xs font-black uppercase tracking-wider pt-2" style={{ color: cvAccentColor }}>
                      Projets Phares
                    </h3>
                    <div className="space-y-2">
                      {projets.map((p, i) => (
                        <div key={i} className="rounded-xl border border-[#e2e8f0] p-3 text-[11px]">
                          <div className="font-bold text-[#0f172a]">{p.nom}</div>
                          <div className="text-[#475569] mt-0.5">{p.description}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="col-span-5 space-y-5">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider mb-2" style={{ color: cvAccentColor }}>
                    Compétences
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {competences.map((c) => (
                      <span
                        key={c}
                        className="rounded-lg px-2.5 py-1 text-[10px] font-bold border"
                        style={{ borderColor: `${cvAccentColor}40`, color: cvAccentColor, backgroundColor: `${cvAccentColor}08` }}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider mb-2" style={{ color: cvAccentColor }}>
                    Formations
                  </h3>
                  <div className="space-y-2">
                    {formations.map((f, i) => (
                      <div key={i} className="rounded-xl bg-[#f8fafc] p-2.5 border border-[#e2e8f0] text-[11px]">
                        <div className="font-bold text-[#0f172a]">{f.diplome}</div>
                        <div className="text-[#64748b] text-[10px]">{f.ecole} · {f.annee}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider mb-2" style={{ color: cvAccentColor }}>
                    Langues
                  </h3>
                  <div className="space-y-1 text-[11px] font-medium text-[#334155]">
                    {langues.map((l) => (
                      <div key={l}>• {l}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6 font-sans">
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
            padding: 0;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] px-5 py-3 text-xs font-bold text-[#166534] shadow-xl animate-in slide-in-from-top-4">
          <CheckCircle2 size={18} className="text-[#16a34a] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* EN-TÊTE DU STUDIO CV & JAUGE DE COMPLÉTUDE                        */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="rounded-3xl border border-[#e8ebf3] bg-gradient-to-r from-white via-[#fafbfe] to-[#f4f2ff] p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#efedff] px-3 py-0.5 text-[11px] font-extrabold text-[#5547d7]">
                Studio CV Dynamique & Documents
              </span>
              <span className="rounded-full bg-[#ecfdf5] border border-[#a7f3d0] px-2.5 py-0.5 text-[11px] font-bold text-[#065f46]">
                Complétude : {cvCompleteness.percent}%
              </span>
              <span className="text-xs text-[#7d869e]">
                {cvList.length} CV enregistré{cvList.length > 1 ? 's' : ''}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black text-[#171f33]">
              Mes CV & Créateur de CV Dynamique en Direct
            </h1>
            <p className="mt-1 text-xs text-[#6e7790] max-w-2xl">
              Concevez un ou plusieurs CV dynamiques adaptés aux postes visés avec aperçu A4 en temps réel, ou importez vos propres fichiers PDF/DOCX.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleCreateNewDynamicCv}
              className="flex items-center gap-1.5 rounded-2xl border border-[#d8d4fa] bg-white px-4 py-2.5 text-xs font-bold text-[#5547d7] hover:bg-[#f4f2ff] transition shadow-2xs"
            >
              <FilePlus2 size={15} />
              <span>Nouvelle variante de CV</span>
            </button>
            <button
              type="button"
              onClick={() => setShowFullscreenPreview(true)}
              className="flex items-center gap-1.5 rounded-2xl border border-[#dde1ee] bg-white px-4 py-2.5 text-xs font-bold text-[#424b61] hover:bg-[#f6f7fb] transition shadow-2xs"
            >
              <Eye size={15} className="text-[#594be0]" />
              <span>Aperçu Plein Écran / PDF</span>
            </button>
            <button
              type="button"
              onClick={handleSaveDynamicCv}
              className="flex items-center gap-1.5 rounded-2xl bg-[#594be0] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#594be0]/20 hover:bg-[#4739d2] transition"
            >
              <Save size={15} />
              <span>Enregistrer mon CV dynamique</span>
            </button>
          </div>
        </div>

        {/* Barre de progression et critères de complétude */}
        <div className="pt-4 border-t border-[#edf0f7] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {cvCompleteness.checks.map((item) => (
              <span
                key={item.label}
                className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold border ${
                  item.ok
                    ? 'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]'
                    : 'border-[#e2e5ef] bg-white text-[#7d869e]'
                }`}
              >
                {item.ok ? <Check size={12} className="text-[#16a34a]" /> : <Clock size={11} />}
                <span>{item.label}</span>
              </span>
            ))}
          </div>

          {/* Sélecteur de vue principale */}
          <div className="inline-flex rounded-2xl bg-[#eef0f7] p-1 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setMainView('STUDIO')}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold transition ${
                mainView === 'STUDIO'
                  ? 'bg-white text-[#594be0] shadow-xs'
                  : 'text-[#646e85] hover:text-[#171f33]'
              }`}
            >
              <LayoutTemplate size={14} />
              <span>Studio CV Dynamique</span>
            </button>
            <button
              type="button"
              onClick={() => setMainView('BIBLIOTHEQUE')}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold transition ${
                mainView === 'BIBLIOTHEQUE'
                  ? 'bg-white text-[#594be0] shadow-xs'
                  : 'text-[#646e85] hover:text-[#171f33]'
              }`}
            >
              <FileCheck size={14} />
              <span>Mes CV & Import PC ({cvList.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* VUE 1 : STUDIO DE CRÉATION DYNAMIQUE (ÉDITEUR + APERÇU A4 LIVE)   */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {mainView === 'STUDIO' && (
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* COLONNE GAUCHE (5/12) : ÉDITEUR STRUCTURÉ PAR ÉTAPES */}
          <div className="lg:col-span-5 space-y-5">
            {/* Sous-navigation des 4 étapes du Studio */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 rounded-2xl border border-[#e8ebf3] bg-white p-1.5 shadow-2xs">
              {[
                { id: 'DESIGN', label: '1. Modèle', icon: Palette },
                { id: 'PROFIL', label: '2. Profil', icon: User },
                { id: 'PARCOURS', label: '3. Parcours', icon: Briefcase },
                { id: 'COMPETENCES', label: '4. Skills', icon: Award },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setStudioStep(id as any)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-2 text-[11px] font-extrabold transition ${
                    studioStep === id
                      ? 'bg-[#594be0] text-white shadow-xs'
                      : 'text-[#646e85] hover:bg-[#f6f7fb] hover:text-[#171f33]'
                  }`}
                >
                  <Icon size={13} />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* ÉTAPE 1 : MODÈLE, COULEURS & OPTIONS D'AFFICHAGE */}
            {studioStep === 'DESIGN' && (
              <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 shadow-xs space-y-5">
                <div>
                  <h2 className="text-sm font-black text-[#171f33] flex items-center gap-2">
                    <LayoutTemplate size={16} className="text-[#594be0]" />
                    <span>Choisir le modèle de mise en page A4</span>
                  </h2>
                  <p className="text-[11px] text-[#788299] mt-0.5">
                    L'aperçu à droite change instantanément selon le modèle sélectionné.
                  </p>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2">
                  {TEMPLATE_OPTIONS.map((tpl) => {
                    const active = cvTemplate === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setCvTemplate(tpl.id)}
                        className={`rounded-2xl border-2 p-3.5 text-left transition ${
                          active
                            ? 'border-[#594be0] bg-[#f8f7ff] shadow-2xs'
                            : 'border-[#e8ebf3] bg-white hover:border-[#cfd5e6]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-[#171f33]">{tpl.label}</span>
                          <span className="rounded-full bg-[#efedff] px-2 py-0.5 text-[9px] font-bold text-[#5547d7]">
                            {tpl.badge}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-[#6e778f] mt-1 leading-snug">{tpl.desc}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Palette de couleurs */}
                <div className="pt-3 border-t border-[#f0f2f7]">
                  <label className="text-xs font-bold text-[#353d52] block mb-2.5">
                    Couleur principale du CV
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    {ACCENT_COLORS.map((c) => (
                      <button
                        key={c.color}
                        type="button"
                        onClick={() => setCvAccentColor(c.color)}
                        className={`group flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[11px] font-bold transition ${
                          cvAccentColor === c.color
                            ? 'border-[#171f33] bg-[#f8fafc] shadow-2xs'
                            : 'border-[#e5e8f0] bg-white hover:bg-[#fafbfc]'
                        }`}
                      >
                        <span
                          className="size-4 rounded-full shrink-0"
                          style={{ backgroundColor: c.color }}
                        />
                        <span className="text-[#334155]">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nom du fichier & Options d'affichage */}
                <div className="pt-3 border-t border-[#f0f2f7] space-y-3">
                  <div>
                    <label className="text-xs font-bold text-[#353d52] block mb-1">
                      Nom de cette version de CV
                    </label>
                    <input
                      type="text"
                      value={cvCustomTitle}
                      onChange={(e) => setCvCustomTitle(e.target.value)}
                      className="w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2 text-xs font-semibold text-[#1e2538] outline-none focus:border-[#594be0] focus:bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    {[
                      {
                        label: 'Afficher ma photo de profil sur le CV',
                        checked: showPhotoOnCv,
                        onChange: setShowPhotoOnCv,
                      },
                      {
                        label: 'Afficher mes liens (GitHub, LinkedIn, Portfolio)',
                        checked: showLinksOnCv,
                        onChange: setShowLinksOnCv,
                      },
                      {
                        label: 'Afficher ma disponibilité et mon mode de travail',
                        checked: showDispoOnCv,
                        onChange: setShowDispoOnCv,
                      },
                    ].map((opt) => (
                      <label
                        key={opt.label}
                        className="flex items-center justify-between rounded-xl border border-[#edf0f7] bg-[#fafbfc] px-3.5 py-2.5 text-xs font-semibold text-[#353d52] cursor-pointer"
                      >
                        <span>{opt.label}</span>
                        <input
                          type="checkbox"
                          checked={opt.checked}
                          onChange={(e) => opt.onChange(e.target.checked)}
                          className="size-4 rounded accent-[#594be0]"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ÉTAPE 2 : PROFIL, TITRE VISÉ, ACCROCHE & LIENS */}
            {studioStep === 'PROFIL' && (
              <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#f0f2f7] pb-3">
                  <h2 className="text-sm font-black text-[#171f33] flex items-center gap-2">
                    <User size={16} className="text-[#594be0]" />
                    <span>En-tête, Accroche & Disponibilité</span>
                  </h2>
                  <button
                    type="button"
                    onClick={onNavigateToProfile}
                    className="text-[11px] font-bold text-[#594be0] hover:underline"
                  >
                    Modifier mes coordonnées →
                  </button>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#353d52] block mb-1">
                    Titre du poste visé sur ce CV
                  </label>
                  <input
                    type="text"
                    value={titrePoste}
                    onChange={(e) => {
                      setTitrePoste(e.target.value);
                      syncContentToParent({ titre: e.target.value });
                    }}
                    placeholder="Ex: Développeur Full Stack React / Node.js"
                    className="w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2 text-xs font-semibold text-[#1e2538] outline-none focus:border-[#594be0] focus:bg-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#353d52]">
                      Résumé / Accroche professionnelle
                    </label>
                  </div>
                  {/* Modèles d'accroches rapides */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <span className="text-[10px] font-bold text-[#8690a6] self-center mr-1">
                      Modèles rapides :
                    </span>
                    {[
                      { id: 'JUNIOR', label: 'Profil Junior' },
                      { id: 'CONFIRME', label: 'Confirmé' },
                      { id: 'STAGE', label: 'Stage / PFE' },
                      { id: 'POLYVALENT', label: 'Polyvalent' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => applySummaryTemplate(p.id as any)}
                        className="rounded-lg border border-[#dcd7fe] bg-[#f6f5ff] px-2 py-0.5 text-[10px] font-bold text-[#5547d7] hover:bg-[#594be0] hover:text-white transition"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={4}
                    value={resume}
                    onChange={(e) => {
                      setResume(e.target.value);
                      syncContentToParent({ resume: e.target.value });
                    }}
                    placeholder="Décrivez votre profil, votre spécialité et votre valeur ajoutée..."
                    className="w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] p-3 text-xs text-[#1e2538] outline-none focus:border-[#594be0] focus:bg-white leading-relaxed"
                  />
                </div>

                {/* Disponibilité et mode de travail */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#f0f2f7]">
                  <div>
                    <label className="text-xs font-bold text-[#353d52] block mb-1">Disponibilité</label>
                    <select
                      value={disponibilite}
                      onChange={(e) => {
                        setDisponibilite(e.target.value);
                        syncContentToParent({ disponibilite: e.target.value });
                      }}
                      className="w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3 py-2 text-xs font-semibold text-[#1e2538] outline-none"
                    >
                      <option value="Immédiate">Immédiate</option>
                      <option value="Sous 1 mois">Sous 1 mois</option>
                      <option value="Sous 3 mois">Sous 3 mois</option>
                      <option value="À convenir">À convenir</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#353d52] block mb-1">Mode souhaité</label>
                    <select
                      value={teletravailSouhaite}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setTeletravailSouhaite(val);
                        syncContentToParent({ teletravail_souhaite: val });
                      }}
                      className="w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3 py-2 text-xs font-semibold text-[#1e2538] outline-none"
                    >
                      <option value="HYBRIDE">Hybride</option>
                      <option value="TOTAL">100% Télétravail</option>
                      <option value="SUR_SITE">Présentiel</option>
                      <option value="INDIFFERENT">Indifférent</option>
                    </select>
                  </div>
                </div>

                {/* Liens professionnels */}
                <div className="space-y-2.5 pt-2 border-t border-[#f0f2f7]">
                  <div className="text-xs font-bold text-[#353d52] flex items-center gap-1.5">
                    <Globe size={13} className="text-[#594be0]" />
                    <span>Liens professionnels</span>
                  </div>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => {
                      setGithubUrl(e.target.value);
                      syncContentToParent({ github_url: e.target.value });
                    }}
                    placeholder="GitHub : https://github.com/..."
                    className="w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3 py-2 text-xs text-[#1e2538] outline-none focus:border-[#594be0]"
                  />
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => {
                      setLinkedinUrl(e.target.value);
                      syncContentToParent({ linkedin_url: e.target.value });
                    }}
                    placeholder="LinkedIn : https://linkedin.com/in/..."
                    className="w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3 py-2 text-xs text-[#1e2538] outline-none focus:border-[#594be0]"
                  />
                  <input
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => {
                      setPortfolioUrl(e.target.value);
                      syncContentToParent({ portfolio_url: e.target.value });
                    }}
                    placeholder="Portfolio : https://mon-portfolio.tn"
                    className="w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3 py-2 text-xs text-[#1e2538] outline-none focus:border-[#594be0]"
                  />
                </div>
              </div>
            )}

            {/* ÉTAPE 3 : EXPÉRIENCES, FORMATIONS & PROJETS */}
            {studioStep === 'PARCOURS' && (
              <div className="space-y-4">
                {/* Expériences */}
                <div className="rounded-3xl border border-[#e8ebf3] bg-white p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-[#171f33] flex items-center gap-1.5">
                      <Briefcase size={15} className="text-[#594be0]" />
                      <span>Expériences professionnelles ({experiences.length})</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingExpIndex(null);
                        setExpPoste('');
                        setExpEmployeur('');
                        setExpDates('');
                        setExpLieu('');
                        setExpDesc('');
                        setExpTechs('');
                        setShowExpModal(true);
                      }}
                      className="rounded-xl bg-[#f0efff] px-3 py-1.5 text-[11px] font-bold text-[#594be0] hover:bg-[#594be0] hover:text-white transition flex items-center gap-1"
                    >
                      <Plus size={13} /> Ajouter
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {experiences.map((exp, idx) => (
                      <div key={idx} className="rounded-2xl border border-[#edf0f7] bg-[#fafbfc] p-3.5 text-xs space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-[#171f33]">{exp.poste}</div>
                            <div className="text-[11px] text-[#594be0] font-semibold">
                              {exp.employeur} · <span className="text-[#7d869e] font-normal">{exp.dates}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveExperience(idx, -1)}
                              disabled={idx === 0}
                              className="p-1 text-[#7d869e] hover:text-[#171f33] disabled:opacity-30"
                              title="Monter"
                            >
                              <ArrowUp size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveExperience(idx, 1)}
                              disabled={idx === experiences.length - 1}
                              className="p-1 text-[#7d869e] hover:text-[#171f33] disabled:opacity-30"
                              title="Descendre"
                            >
                              <ArrowDown size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingExpIndex(idx);
                                setExpPoste(exp.poste);
                                setExpEmployeur(exp.employeur);
                                setExpDates(exp.dates);
                                setExpLieu(exp.lieu || '');
                                setExpDesc(exp.description || '');
                                setExpTechs((exp.technologies || []).join(', '));
                                setShowExpModal(true);
                              }}
                              className="p-1 text-[#594be0] hover:bg-[#efedff] rounded"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteExperience(idx)}
                              className="p-1 text-[#cf3b3b] hover:bg-[#fff0f0] rounded"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Formations */}
                <div className="rounded-3xl border border-[#e8ebf3] bg-white p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-[#171f33] flex items-center gap-1.5">
                      <GraduationCap size={15} className="text-[#594be0]" />
                      <span>Formations & Diplômes ({formations.length})</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingFormIndex(null);
                        setFormDiplome('');
                        setFormEcole('');
                        setFormAnnee('2025');
                        setFormDesc('');
                        setShowFormModal(true);
                      }}
                      className="rounded-xl bg-[#f0efff] px-3 py-1.5 text-[11px] font-bold text-[#594be0] hover:bg-[#594be0] hover:text-white transition flex items-center gap-1"
                    >
                      <Plus size={13} /> Ajouter
                    </button>
                  </div>

                  <div className="space-y-2">
                    {formations.map((f, idx) => (
                      <div key={idx} className="rounded-2xl border border-[#edf0f7] bg-[#fafbfc] p-3 text-xs flex items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-[#171f33]">{f.diplome}</div>
                          <div className="text-[11px] text-[#64748b]">{f.ecole} ({f.annee})</div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveFormation(idx, -1)}
                            disabled={idx === 0}
                            className="p-1 text-[#7d869e] hover:text-[#171f33] disabled:opacity-30"
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingFormIndex(idx);
                              setFormDiplome(f.diplome);
                              setFormEcole(f.ecole);
                              setFormAnnee(f.annee);
                              setFormDesc(f.description || '');
                              setShowFormModal(true);
                            }}
                            className="p-1 text-[#594be0] hover:bg-[#efedff] rounded"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFormation(idx)}
                            className="p-1 text-[#cf3b3b] hover:bg-[#fff0f0] rounded"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Projets & Certifications */}
                <div className="rounded-3xl border border-[#e8ebf3] bg-white p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-[#171f33] flex items-center gap-1.5">
                      <FolderGit2 size={15} className="text-[#594be0]" />
                      <span>Projets clés ({projets.length}) & Certifications ({certifications.length})</span>
                    </h3>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProjIndex(null);
                          setProjNom('');
                          setProjDesc('');
                          setProjTechs('');
                          setProjLien('');
                          setShowProjModal(true);
                        }}
                        className="rounded-xl bg-[#f0efff] px-2.5 py-1 text-[10px] font-bold text-[#594be0] hover:bg-[#594be0] hover:text-white transition"
                      >
                        + Projet
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCertModal(true)}
                        className="rounded-xl border border-[#dde1ee] bg-white px-2.5 py-1 text-[10px] font-bold text-[#475569] hover:bg-[#f8fafc] transition"
                      >
                        + Certif
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {projets.map((p, idx) => (
                      <div key={idx} className="rounded-xl border border-[#edf0f7] bg-[#fafbfc] p-3 text-xs flex items-center justify-between">
                        <div>
                          <div className="font-bold text-[#171f33]">{p.nom}</div>
                          <div className="text-[10.5px] text-[#64748b] line-clamp-1">{p.description}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setProjets(projets.filter((_, i) => i !== idx))}
                          className="p-1 text-[#cf3b3b] hover:bg-[#fff0f0] rounded shrink-0"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ÉTAPE 4 : COMPÉTENCES PAR DOMAINE & LANGUES */}
            {studioStep === 'COMPETENCES' && (
              <div className="space-y-4">
                <div className="rounded-3xl border border-[#e8ebf3] bg-white p-5 shadow-xs space-y-4">
                  <h3 className="text-xs font-black text-[#171f33] flex items-center gap-1.5">
                    <Award size={15} className="text-[#594be0]" />
                    <span>Compétences sélectionnées sur le CV ({competences.length})</span>
                  </h3>

                  <div className="flex flex-wrap gap-1.5">
                    {competences.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#d8d2fb] bg-[#f7f5ff] px-3 py-1 text-xs font-bold text-[#5547d7]"
                      >
                        <span>{s}</span>
                        <button type="button" onClick={() => handleRemoveSkill(s)} className="hover:text-[#cf3b3b]">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Ajouter une compétence personnalisée..."
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                      className="flex-1 rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3 py-2 text-xs outline-none focus:border-[#594be0]"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddSkill()}
                      className="rounded-xl bg-[#594be0] px-4 py-2 text-xs font-bold text-white hover:bg-[#4739d2]"
                    >
                      Ajouter
                    </button>
                  </div>

                  {/* Catalogue de compétences par catégorie */}
                  <div className="pt-3 border-t border-[#f0f2f7] space-y-2.5">
                    <div className="flex flex-wrap gap-1">
                      {Object.keys(SKILL_CATEGORIES).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedSkillCategory(cat)}
                          className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
                            selectedSkillCategory === cat
                              ? 'bg-[#171f33] text-white'
                              : 'bg-[#f1f5f9] text-[#64748b] hover:text-[#171f33]'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(SKILL_CATEGORIES[selectedSkillCategory] || []).map((sk) => {
                        const already = competences.includes(sk);
                        return (
                          <button
                            key={sk}
                            type="button"
                            disabled={already}
                            onClick={() => handleAddSkill(sk)}
                            className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                              already
                                ? 'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d] opacity-60 cursor-default'
                                : 'border-[#e2e5f0] bg-white text-[#475569] hover:border-[#594be0] hover:text-[#594be0]'
                            }`}
                          >
                            {already ? `✓ ${sk}` : `+ ${sk}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Langues */}
                <div className="rounded-3xl border border-[#e8ebf3] bg-white p-5 shadow-xs space-y-3">
                  <h3 className="text-xs font-black text-[#171f33] flex items-center gap-1.5">
                    <Languages size={15} className="text-[#594be0]" />
                    <span>Langues ({langues.length})</span>
                  </h3>

                  <div className="flex flex-wrap gap-1.5">
                    {langues.map((l) => (
                      <span
                        key={l}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#e2e5ef] bg-[#f8fafc] px-3 py-1 text-xs font-bold text-[#334155]"
                      >
                        <span>{l}</span>
                        <button type="button" onClick={() => handleRemoveLanguage(l)} className="text-[#94a3b8] hover:text-[#cf3b3b]">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
                    <input
                      type="text"
                      placeholder="Langue (ex: Anglais)"
                      value={newLangNom}
                      onChange={(e) => setNewLangNom(e.target.value)}
                      className="rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3 py-2 text-xs outline-none focus:border-[#594be0]"
                    />
                    <select
                      value={newLangNiveau}
                      onChange={(e) => setNewLangNiveau(e.target.value)}
                      className="rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-2.5 py-2 text-xs font-semibold outline-none"
                    >
                      {LANGUAGE_LEVELS.map((lvl) => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddLanguage}
                      className="rounded-xl bg-[#594be0] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#4739d2]"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* COLONNE DROITE (7/12) : APERÇU A4 EN DIRECT */}
          <div className="lg:col-span-7 lg:sticky lg:top-20 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#e8ebf3] bg-white px-4 py-2.5 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#10b981] animate-pulse" />
                <span className="text-xs font-extrabold text-[#171f33]">
                  Aperçu A4 en temps réel — Modèle {TEMPLATE_OPTIONS.find((t) => t.id === cvTemplate)?.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1 rounded-xl bg-[#f4f2ff] px-3 py-1.5 text-[11px] font-bold text-[#594be0] hover:bg-[#594be0] hover:text-white transition"
                >
                  <Printer size={13} />
                  <span>Exporter PDF</span>
                </button>
              </div>
            </div>

            {renderCvSheet(true)}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* VUE 2 : BIBLIOTHÈQUE DE MES CV & IMPORT DEPUIS LE PC              */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {mainView === 'BIBLIOTHEQUE' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Liste des CVs */}
          <div className="space-y-4">
            <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f0f2f7] pb-4">
                <div>
                  <h2 className="text-base font-black text-[#171f33]">
                    Mes CV enregistrés ({cvList.length})
                  </h2>
                  <p className="text-xs text-[#717a92]">
                    Gérez vos versions de CV dynamiques et vos fichiers PDF/DOCX importés.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCreateNewDynamicCv}
                  className="flex items-center gap-1.5 rounded-2xl bg-[#594be0] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#4739d2] transition self-start sm:self-auto"
                >
                  <Plus size={14} />
                  <span>Créer un CV dynamique</span>
                </button>
              </div>

              {cvList.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#d8dce8] p-10 text-center space-y-3">
                  <FileText size={32} className="mx-auto text-[#9aa3b8]" />
                  <p className="text-xs font-bold text-[#171f33]">Aucun CV enregistré pour le moment</p>
                  <button
                    type="button"
                    onClick={handleCreateNewDynamicCv}
                    className="rounded-xl bg-[#594be0] px-4 py-2 text-xs font-bold text-white"
                  >
                    Générer mon premier CV dynamique
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cvList.map((cv) => (
                    <div
                      key={cv.id}
                      className={`rounded-2xl border p-4 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        cv.est_principal
                          ? 'border-[#594be0] bg-[#faf9ff] shadow-2xs'
                          : 'border-[#e8ebf3] bg-white hover:border-[#cfd5e6]'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`grid size-11 place-items-center rounded-2xl shrink-0 ${
                            cv.est_genere
                              ? 'bg-[#efedff] text-[#594be0]'
                              : 'bg-[#eff6ff] text-[#2563eb]'
                          }`}
                        >
                          <FileText size={20} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-black text-[#171f33]">{cv.nom_fichier}</span>
                            {cv.est_principal && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#594be0] px-2.5 py-0.5 text-[9px] font-black text-white">
                                <Star size={9} className="fill-white" /> Par défaut
                              </span>
                            )}
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                cv.est_genere
                                  ? 'bg-[#f0efff] text-[#5547d7]'
                                  : 'bg-[#eff6ff] text-[#1d4ed8]'
                              }`}
                            >
                              {cv.est_genere
                                ? `CV Dynamique (${(cv.template_style || 'moderne').toUpperCase()})`
                                : 'Fichier importé'}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#788299]">
                            {cv.cv_config?.titre_poste ? `${cv.cv_config.titre_poste} · ` : ''}
                            Mis à jour le {cv.updated_at || cv.created_at || "Aujourd'hui"}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {!cv.est_principal && (
                          <button
                            type="button"
                            onClick={() => handleSetPrincipal(cv.id)}
                            className="rounded-xl border border-[#dde1ee] bg-white px-3 py-1.5 text-[11px] font-bold text-[#475569] hover:border-[#594be0] hover:text-[#594be0] transition"
                          >
                            Par défaut
                          </button>
                        )}
                        {cv.est_genere && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleLoadCvInStudio(cv)}
                              className="rounded-xl bg-[#f0efff] px-3 py-1.5 text-[11px] font-bold text-[#594be0] hover:bg-[#594be0] hover:text-white transition flex items-center gap-1"
                            >
                              <Edit3 size={12} /> Éditer
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicateCv(cv)}
                              className="rounded-xl border border-[#dde1ee] bg-white p-1.5 text-[#475569] hover:text-[#594be0] transition"
                              title="Dupliquer cette version"
                            >
                              <Copy size={13} />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (cv.est_genere) handleLoadCvInStudio(cv);
                            setShowFullscreenPreview(true);
                          }}
                          className="rounded-xl border border-[#dde1ee] bg-white p-1.5 text-[#475569] hover:text-[#171f33] transition"
                          title="Aperçu"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCv(cv.id)}
                          className="rounded-xl border border-[#ffd5d5] bg-white p-1.5 text-[#cf3b3b] hover:bg-[#fff5f5] transition"
                          title="Supprimer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Zone d'importation depuis le PC */}
          <div className="space-y-4">
            <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-[#171f33] flex items-center gap-2">
                <Upload size={16} className="text-[#594be0]" />
                <span>Importer un CV depuis mon PC</span>
              </h3>
              <p className="text-xs text-[#6e778f]">
                Téléversez un document PDF ou Word (DOCX) déjà mis en page sur votre ordinateur.
              </p>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) processUploadedFile(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition ${
                  dragActive
                    ? 'border-[#594be0] bg-[#f4f2ff]'
                    : 'border-[#d8dce8] bg-[#fafbfc] hover:border-[#594be0] hover:bg-[#faf9fe]'
                }`}
              >
                <div className="grid size-12 place-items-center rounded-2xl bg-white border border-[#e2e5ef] text-[#594be0] shadow-2xs mb-3">
                  <Upload size={20} className={uploading ? 'animate-bounce' : ''} />
                </div>
                <div className="text-xs font-bold text-[#171f33]">
                  {uploading ? 'Importation en cours...' : 'Cliquez ou glissez votre fichier ici'}
                </div>
                <div className="text-[10px] text-[#8690a6] mt-1">PDF ou DOCX (max 5 Mo)</div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (f) processUploadedFile(f);
                  }}
                />
              </div>

              {uploadError && (
                <div className="flex items-center gap-2 rounded-xl border border-[#ffd2d2] bg-[#fff5f5] p-3 text-xs font-bold text-[#cf3b3b]">
                  <AlertCircle size={15} />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL EXPÉRIENCE */}
      {showExpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h4 className="text-sm font-black text-[#171f33]">
              {editingExpIndex !== null ? "Modifier l'expérience" : 'Ajouter une expérience'}
            </h4>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#333b4e]">Intitulé du poste *</label>
                <input
                  type="text"
                  value={expPoste}
                  onChange={(e) => setExpPoste(e.target.value)}
                  placeholder="Ex: Développeur Full Stack"
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none focus:border-[#594be0]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-[#333b4e]">Entreprise *</label>
                  <input
                    type="text"
                    value={expEmployeur}
                    onChange={(e) => setExpEmployeur(e.target.value)}
                    placeholder="Ex: Société Alpha"
                    className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none focus:border-[#594be0]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#333b4e]">Période</label>
                  <input
                    type="text"
                    value={expDates}
                    onChange={(e) => setExpDates(e.target.value)}
                    placeholder="2025 - 2026"
                    className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none focus:border-[#594be0]"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-[#333b4e]">Technologies utilisées (séparées par des virgules)</label>
                <input
                  type="text"
                  value={expTechs}
                  onChange={(e) => setExpTechs(e.target.value)}
                  placeholder="React, TypeScript, Node.js, PostgreSQL"
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none focus:border-[#594be0]"
                />
              </div>
              <div>
                <label className="font-bold text-[#333b4e]">Réalisations & Missions</label>
                <textarea
                  rows={3}
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  placeholder="Décrivez vos réalisations principales..."
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none focus:border-[#594be0]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowExpModal(false)}
                className="rounded-xl border border-[#dde0ec] px-4 py-2 text-xs font-bold text-[#626c83]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveExperience}
                className="rounded-xl bg-[#594be0] px-5 py-2 text-xs font-bold text-white hover:bg-[#4739d2]"
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FORMATION */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h4 className="text-sm font-black text-[#171f33]">
              {editingFormIndex !== null ? 'Modifier la formation' : 'Ajouter une formation'}
            </h4>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#333b4e]">Diplôme / Titre *</label>
                <input
                  type="text"
                  value={formDiplome}
                  onChange={(e) => setFormDiplome(e.target.value)}
                  placeholder="Licence / Master en Informatique"
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none focus:border-[#594be0]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-[#333b4e]">Établissement *</label>
                  <input
                    type="text"
                    value={formEcole}
                    onChange={(e) => setFormEcole(e.target.value)}
                    placeholder="Université / École"
                    className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none focus:border-[#594be0]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#333b4e]">Année</label>
                  <input
                    type="text"
                    value={formAnnee}
                    onChange={(e) => setFormAnnee(e.target.value)}
                    placeholder="2025"
                    className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none focus:border-[#594be0]"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-[#333b4e]">Spécialité / Mention (optionnel)</label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Génie Logiciel — Mention Bien"
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none focus:border-[#594be0]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="rounded-xl border border-[#dde0ec] px-4 py-2 text-xs font-bold text-[#626c83]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveFormation}
                className="rounded-xl bg-[#594be0] px-5 py-2 text-xs font-bold text-white hover:bg-[#4739d2]"
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PROJET */}
      {showProjModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h4 className="text-sm font-black text-[#171f33]">Ajouter un projet réalisable</h4>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#333b4e]">Nom du projet *</label>
                <input
                  type="text"
                  value={projNom}
                  onChange={(e) => setProjNom(e.target.value)}
                  placeholder="Ex: Application E-commerce Full Stack"
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none focus:border-[#594be0]"
                />
              </div>
              <div>
                <label className="font-bold text-[#333b4e]">Technologies (séparées par des virgules)</label>
                <input
                  type="text"
                  value={projTechs}
                  onChange={(e) => setProjTechs(e.target.value)}
                  placeholder="Next.js, TailwindCSS, Stripe"
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none focus:border-[#594be0]"
                />
              </div>
              <div>
                <label className="font-bold text-[#333b4e]">Description courte</label>
                <textarea
                  rows={3}
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  placeholder="Fonctionnalités développées et résultats..."
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none focus:border-[#594be0]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowProjModal(false)}
                className="rounded-xl border border-[#dde0ec] px-4 py-2 text-xs font-bold text-[#626c83]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveProjet}
                className="rounded-xl bg-[#594be0] px-5 py-2 text-xs font-bold text-white hover:bg-[#4739d2]"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CERTIFICATION */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h4 className="text-sm font-black text-[#171f33]">Ajouter une certification</h4>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#333b4e]">Intitulé de la certification *</label>
                <input
                  type="text"
                  value={certNom}
                  onChange={(e) => setCertNom(e.target.value)}
                  placeholder="Ex: AWS Certified Cloud Practitioner"
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none focus:border-[#594be0]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-[#333b4e]">Organisme</label>
                  <input
                    type="text"
                    value={certOrganisme}
                    onChange={(e) => setCertOrganisme(e.target.value)}
                    placeholder="Amazon Web Services"
                    className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none focus:border-[#594be0]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#333b4e]">Année</label>
                  <input
                    type="text"
                    value={certAnnee}
                    onChange={(e) => setCertAnnee(e.target.value)}
                    placeholder="2026"
                    className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none focus:border-[#594be0]"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCertModal(false)}
                className="rounded-xl border border-[#dde0ec] px-4 py-2 text-xs font-bold text-[#626c83]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveCertification}
                className="rounded-xl bg-[#594be0] px-5 py-2 text-xs font-bold text-white hover:bg-[#4739d2]"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL APERÇU PLEIN ÉCRAN A4 */}
      {showFullscreenPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative my-6 w-full max-w-4xl rounded-3xl bg-[#f0f2f7] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-white px-5 py-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-black text-[#171f33]">
                  Aperçu A4 — {cvCustomTitle}
                </span>
                <span className="rounded-full bg-[#efedff] px-2.5 py-0.5 text-[10px] font-bold text-[#594be0]">
                  {TEMPLATE_OPTIONS.find((t) => t.id === cvTemplate)?.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-xl bg-[#594be0] px-4 py-2 text-xs font-bold text-white hover:bg-[#4739d2]"
                >
                  <Printer size={14} /> Imprimer / Télécharger PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowFullscreenPreview(false)}
                  className="grid size-8 place-items-center rounded-xl text-[#64748b] hover:bg-[#f1f5f9]"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="mx-auto max-w-[820px]">
              {renderCvSheet(false)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
