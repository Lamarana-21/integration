'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  AlertCircle,
  Award,
  Briefcase,
  Building2,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  GraduationCap,
  Image as ImageIcon,
  Languages,
  Lock,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Shield,
  ShieldCheck,
  Sliders,
  Sparkles,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react';
import { Candidat, Experience, Formation } from '@/lib/types';

interface ProfilCandidatViewProps {
  candidat: Candidat;
  onUpdateProfile: (updated: Partial<Candidat>) => void;
  onDeleteMyData: () => void;
  onNavigateScreen?: (screen: string) => void;
}

const PRESET_AVATARS = [
  {
    name: 'Tech Féminin',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
  },
  {
    name: 'Pro Moderne',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=256',
  },
  {
    name: 'Tech Masculin',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
  },
  {
    name: 'Ingénieur Studio',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
  },
];

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

export function ProfilCandidatView({
  candidat,
  onUpdateProfile,
  onDeleteMyData,
  onNavigateScreen,
}: ProfilCandidatViewProps) {
  // Photo de profil
  const [avatarUrl, setAvatarUrl] = useState<string>(
    candidat.avatar_url || candidat.user?.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256'
  );
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Nom & Prénom synchronisés immédiatement avec le parent et la Navbar
  const [nom, setNom] = useState(candidat.user?.nom || 'Ben Salem');
  const [prenom, setPrenom] = useState(candidat.user?.prenom || 'Amina');
  const [titre, setTitre] = useState(candidat.titre || 'Développeuse Web Junior Full Stack');
  const [telephone, setTelephone] = useState(candidat.telephone || '+216 98 123 456');
  const [ville, setVille] = useState(candidat.ville || 'Sfax');
  const [pays, setPays] = useState(candidat.pays || 'Tunisie');
  const [email] = useState(candidat.user?.email || 'amina@mail.example');
  const [linkedinUrl, setLinkedinUrl] = useState(candidat.linkedin_url || 'https://linkedin.com/in/amina-bensalem');
  const [githubUrl, setGithubUrl] = useState(candidat.github_url || 'https://github.com/aminabs');
  const [portfolioUrl, setPortfolioUrl] = useState(candidat.portfolio_url || 'https://amina-dev.portfolio.tn');
  const [resume, setResume] = useState(candidat.resume || '');

  // Statut de recherche & préférences
  const [statutRecherche, setStatutRecherche] = useState<'EN_RECHERCHE' | 'A_LECOUTE' | 'NON_DISPONIBLE'>(
    candidat.statut_recherche || 'EN_RECHERCHE'
  );
  const [disponibilite, setDisponibilite] = useState(candidat.disponibilite || 'Immédiate');
  const [typeContratSouhaite, setTypeContratSouhaite] = useState<string[]>(
    candidat.type_contrat_souhaite || ['CDI', 'ALTERNANCE']
  );
  const [pretentionSalariale, setPretentionSalariale] = useState(
    candidat.pretention_salariale || '30 000 - 36 000 DT / an'
  );
  const [teletravailSouhaite, setTeletravailSouhaite] = useState<'TOTAL' | 'HYBRIDE' | 'SUR_SITE' | 'INDIFFERENT'>(
    candidat.teletravail_souhaite || 'HYBRIDE'
  );

  // Mot de passe
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Compétences
  const [competences, setCompetences] = useState<string[]>(
    candidat.competences && candidat.competences.length > 0
      ? candidat.competences
      : ['React', 'Node.js', 'SQL', 'Git', 'TypeScript', 'TailwindCSS']
  );
  const [newSkill, setNewSkill] = useState('');

  // Expériences & Formations
  const [experiences, setExperiences] = useState<Experience[]>(candidat.experiences || []);
  const [formations, setFormations] = useState<Formation[]>(candidat.formations || []);
  const [langues, setLangues] = useState<string[]>(
    candidat.langues || ['Français (Bilingue)', 'Anglais (Technique)', 'Arabe (Natif)']
  );
  const [newLangNom, setNewLangNom] = useState('');
  const [newLangNiveau, setNewLangNiveau] = useState('B2 - Intermédiaire avancé');

  // Modals Expériences & Formations
  const [showExpModal, setShowExpModal] = useState(false);
  const [editingExpIndex, setEditingExpIndex] = useState<number | null>(null);
  const [expPoste, setExpPoste] = useState('');
  const [expEmployeur, setExpEmployeur] = useState('');
  const [expLieu, setExpLieu] = useState('');
  const [expDates, setExpDates] = useState('');
  const [expDesc, setExpDesc] = useState('');

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingFormIndex, setEditingFormIndex] = useState<number | null>(null);
  const [formDiplome, setFormDiplome] = useState('');
  const [formEcole, setFormEcole] = useState('');
  const [formAnnee, setFormAnnee] = useState('');

  // Modals UI
  const [showPublicPreview, setShowPublicPreview] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Gestion dynamique de la photo de profil
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('La photo ne doit pas dépasser 3 Mo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setAvatarUrl(dataUrl);
        onUpdateProfile({
          avatar_url: dataUrl,
          user: {
            ...(candidat.user || {
              id: candidat.utilisateur_id,
              email,
              statut: 'ACTIF',
            }),
            nom,
            prenom,
            avatar_url: dataUrl,
          },
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPresetAvatar = (url: string) => {
    setAvatarUrl(url);
    setShowAvatarPicker(false);
    onUpdateProfile({
      avatar_url: url,
      user: {
        ...(candidat.user || {
          id: candidat.utilisateur_id,
          email,
          statut: 'ACTIF',
        }),
        nom,
        prenom,
        avatar_url: url,
      },
    });
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('');
    setShowAvatarPicker(false);
    onUpdateProfile({
      avatar_url: '',
      user: {
        ...(candidat.user || {
          id: candidat.utilisateur_id,
          email,
          statut: 'ACTIF',
        }),
        nom,
        prenom,
        avatar_url: '',
      },
    });
  };

  // Synchronisation dynamique du Nom & Prénom en temps réel vers le parent et la Navbar
  const handleNomChange = (newVal: string) => {
    setNom(newVal);
    onUpdateProfile({
      user: {
        ...(candidat.user || {
          id: candidat.utilisateur_id,
          email,
          statut: 'ACTIF',
        }),
        nom: newVal,
        prenom,
        avatar_url: avatarUrl,
      },
    });
  };

  const handlePrenomChange = (newVal: string) => {
    setPrenom(newVal);
    onUpdateProfile({
      user: {
        ...(candidat.user || {
          id: candidat.utilisateur_id,
          email,
          statut: 'ACTIF',
        }),
        nom,
        prenom: newVal,
        avatar_url: avatarUrl,
      },
    });
  };

  // Calcul dynamique de la complétude du profil basé uniquement sur les informations du profil
  const completenessScore = useMemo(() => {
    let score = 0;
    if (avatarUrl) score += 10;
    if (nom.trim() && prenom.trim()) score += 15;
    if (titre.trim()) score += 10;
    if (telephone.trim() && ville.trim()) score += 15;
    if (resume.trim() && resume.trim().length > 20) score += 15;
    if (competences.length >= 3) score += 15;
    if (experiences.length > 0) score += 15;
    if (formations.length > 0) score += 10;
    return Math.min(100, score);
  }, [avatarUrl, nom, prenom, titre, telephone, ville, resume, competences, experiences, formations]);

  // Indicateur de force du mot de passe
  const passwordStrength = useMemo(() => {
    if (!newPassword) return 0;
    let strength = 1;
    if (newPassword.length >= 8) strength++;
    if (/[0-9]/.test(newPassword) && /[A-Z]/.test(newPassword)) strength++;
    return strength;
  }, [newPassword]);

  // Compétences
  const handleAddSkill = (skillToAdd?: string) => {
    const val = (skillToAdd || newSkill).trim();
    if (val && !competences.includes(val)) {
      setCompetences([...competences, val]);
      if (!skillToAdd) setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setCompetences(competences.filter((s) => s !== skill));
  };

  // Langues
  const handleAddLanguage = () => {
    if (!newLangNom.trim()) return;
    const item = `${newLangNom.trim()} (${newLangNiveau})`;
    if (!langues.includes(item)) {
      setLangues([...langues, item]);
      setNewLangNom('');
    }
  };

  const handleRemoveLanguage = (l: string) => {
    setLangues(langues.filter((item) => item !== l));
  };

  // Expériences
  const handleSaveExperience = () => {
    if (!expPoste.trim() || !expEmployeur.trim()) return;
    const newExp: Experience = {
      id: editingExpIndex !== null ? experiences[editingExpIndex].id || `exp-${Date.now()}` : `exp-${Date.now()}`,
      poste: expPoste.trim(),
      employeur: expEmployeur.trim(),
      lieu: expLieu.trim() || ville,
      dates: expDates.trim() || '2025 - Actuel',
      description: expDesc.trim(),
    };
    if (editingExpIndex !== null) {
      const updated = [...experiences];
      updated[editingExpIndex] = newExp;
      setExperiences(updated);
    } else {
      setExperiences([newExp, ...experiences]);
    }
    setShowExpModal(false);
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
    if (editingFormIndex !== null) {
      const updated = [...formations];
      updated[editingFormIndex] = newForm;
      setFormations(updated);
    } else {
      setFormations([newForm, ...formations]);
    }
    setShowFormModal(false);
  };

  // Génération IA du pitch professionnel
  const handleGenerateAiPitch = () => {
    setAiGenerating(true);
    setTimeout(() => {
      const generated = `${titre} diplômée, passionnée par le développement d'interfaces modernes et performantes. Solide expertise en ${competences.slice(0, 4).join(', ')}. Motivée, rigoureuse et prête à s'intégrer rapidement dans une équipe produit innovante.`;
      setResume(generated);
      setAiGenerating(false);
    }, 600);
  };

  // Sauvegarde globale du profil
  const handleSaveProfile = () => {
    onUpdateProfile({
      avatar_url: avatarUrl,
      titre,
      telephone,
      ville,
      pays,
      linkedin_url: linkedinUrl,
      github_url: githubUrl,
      portfolio_url: portfolioUrl,
      resume,
      statut_recherche: statutRecherche,
      disponibilite,
      type_contrat_souhaite: typeContratSouhaite,
      pretention_salariale: pretentionSalariale,
      teletravail_souhaite: teletravailSouhaite,
      competences,
      experiences,
      formations,
      langues,
      user: {
        ...(candidat.user || {
          id: candidat.utilisateur_id,
          email,
          statut: 'ACTIF',
        }),
        nom,
        prenom,
        avatar_url: avatarUrl,
      },
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Changement de mot de passe
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (!currentPassword) {
      setPasswordError('Veuillez renseigner votre mot de passe actuel.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Le nouveau mot de passe doit comporter au moins 8 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setPasswordSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(false), 4000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      {saveSuccess && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] px-5 py-3 text-xs font-bold text-[#166534] shadow-xl animate-in slide-in-from-top-4">
          <CheckCircle2 size={18} className="text-[#16a34a]" />
          <span>Profil candidat et informations du compte enregistrés avec succès !</span>
        </div>
      )}

      {/* TOP CANDIDATE HERO BANNER DYNAMIQUE AVEC PHOTO */}
      <div className="rounded-3xl border border-[#e8ebf3] bg-gradient-to-r from-white via-[#fafbfe] to-[#f4f2ff] p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            {/* PHOTO DE PROFIL INTERACTIVE */}
            <div className="relative group shrink-0">
              <div className="size-24 rounded-3xl overflow-hidden border-2 border-white shadow-xl shadow-[#594be0]/15 bg-[#594be0] relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={`${prenom} ${nom}`}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="grid size-full place-items-center text-3xl font-black text-white">
                    {prenom[0] || 'A'}
                    {nom[0] || 'B'}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(true)}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition duration-200 text-[10px] font-bold gap-1"
                >
                  <Camera size={18} />
                  <span>Modifier</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowAvatarPicker(true)}
                className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full bg-[#594be0] text-white shadow-md hover:bg-[#4739d2] transition"
                title="Changer la photo de profil"
              >
                <Camera size={13} />
              </button>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <h1 className="text-2xl font-black text-[#171f33]">
                  {prenom} {nom}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[11px] font-bold ${
                    statutRecherche === 'EN_RECHERCHE'
                      ? 'bg-[#dcfce7] text-[#15803d]'
                      : statutRecherche === 'A_LECOUTE'
                      ? 'bg-[#fef3c7] text-[#b45309]'
                      : 'bg-[#f1f5f9] text-[#475569]'
                  }`}
                >
                  <span className="size-2 rounded-full bg-current" />
                  {statutRecherche === 'EN_RECHERCHE'
                    ? 'En recherche active'
                    : statutRecherche === 'A_LECOUTE'
                    ? 'À l’écoute d\'opportunités'
                    : 'Non disponible'}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#eef2ff] px-2.5 py-0.5 text-[10px] font-bold text-[#4338ca]">
                  <ShieldCheck size={12} /> Compte actif
                </span>
              </div>

              <p className="mt-1 text-sm font-semibold text-[#594be0]">{titre}</p>

              <div className="mt-2.5 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-[#6e7790]">
                <span className="flex items-center gap-1.5">
                  <Mail size={13} className="text-[#594be0]" /> {email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone size={13} className="text-[#594be0]" /> {telephone}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-[#594be0]" /> {ville}, {pays}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={13} className="text-[#594be0]" /> Dispo : <strong className="text-[#1e2538]">{disponibilite}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2.5">
            <button
              onClick={() => setShowPublicPreview(true)}
              className="flex items-center gap-1.5 rounded-2xl border border-[#d8dce8] bg-white px-4 py-2.5 text-xs font-bold text-[#424b61] shadow-xs hover:bg-[#f6f7fb] transition"
            >
              <Eye size={15} className="text-[#594be0]" /> Aperçu Public
            </button>
            <button
              onClick={handleSaveProfile}
              className="flex items-center gap-1.5 rounded-2xl bg-[#594be0] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#594be0]/20 hover:bg-[#4739d2] transition"
            >
              <Save size={15} /> Enregistrer mon profil
            </button>
          </div>
        </div>
      </div>

      {/* 2 COLUMNS GRID */}
      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        {/* LEFT COLUMN: WIDGETS & STATUT */}
        <aside className="space-y-6">
          {/* Complétude du profil */}
          <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#636b80]">Complétude du profil</span>
              <span className="text-base font-black text-[#594be0]">{completenessScore} %</span>
            </div>
            <div className="mt-3 h-2.5 w-full rounded-full bg-[#f0f2f7] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#594be0] to-[#10b981] transition-all duration-500 rounded-full"
                style={{ width: `${completenessScore}%` }}
              />
            </div>
            <p className="mt-2.5 text-[11px] text-[#788299] leading-relaxed">
              Un profil renseigné à plus de 80% multiplie considérablement vos opportunités d'entretien auprès des recruteurs.
            </p>
          </div>

          {/* Statut d'écoute */}
          <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#636b80] mb-3 flex items-center gap-1.5">
              <Sliders size={14} className="text-[#594be0]" /> Mon statut d'écoute
            </h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setStatutRecherche('EN_RECHERCHE')}
                className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left border transition ${
                  statutRecherche === 'EN_RECHERCHE'
                    ? 'border-[#22c55e] bg-[#f0fdf4] text-[#15803d]'
                    : 'border-[#edf0f7] text-[#485167]'
                }`}
              >
                <div className="size-3 rounded-full bg-[#22c55e]" />
                <div className="text-xs font-bold">En recherche active</div>
              </button>
              <button
                type="button"
                onClick={() => setStatutRecherche('A_LECOUTE')}
                className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left border transition ${
                  statutRecherche === 'A_LECOUTE'
                    ? 'border-[#f59e0b] bg-[#fffbeb] text-[#b45309]'
                    : 'border-[#edf0f7] text-[#485167]'
                }`}
              >
                <div className="size-3 rounded-full bg-[#f59e0b]" />
                <div className="text-xs font-bold">À l'écoute d'opportunités</div>
              </button>
              <button
                type="button"
                onClick={() => setStatutRecherche('NON_DISPONIBLE')}
                className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left border transition ${
                  statutRecherche === 'NON_DISPONIBLE'
                    ? 'border-[#94a3b8] bg-[#f8fafc] text-[#475569]'
                    : 'border-[#edf0f7] text-[#485167]'
                }`}
              >
                <div className="size-3 rounded-full bg-[#94a3b8]" />
                <div className="text-xs font-bold">Non disponible actuellement</div>
              </button>
            </div>
          </div>

          {/* Préférences & Critères */}
          <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#636b80] flex items-center gap-1.5">
              <Compass size={14} className="text-[#594be0]" /> Préférences de recherche
            </h3>

            <div>
              <label className="text-[11px] font-bold text-[#444d62] block mb-1">Disponibilité</label>
              <select
                value={disponibilite}
                onChange={(e) => setDisponibilite(e.target.value)}
                className="w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3 py-2 text-xs font-semibold text-[#1e2538] outline-none"
              >
                <option value="Immédiate">Immédiate</option>
                <option value="Préavis 1 mois">Préavis 1 mois</option>
                <option value="Préavis 2 mois">Préavis 2 mois</option>
                <option value="Préavis 3 mois">Préavis 3 mois</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#444d62] block mb-1">Mode de travail souhaité</label>
              <select
                value={teletravailSouhaite}
                onChange={(e) => setTeletravailSouhaite(e.target.value as any)}
                className="w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3 py-2 text-xs font-semibold text-[#1e2538] outline-none"
              >
                <option value="HYBRIDE">Hybride (Présentiel + Télétravail)</option>
                <option value="TOTAL">100% Télétravail (Full Remote)</option>
                <option value="SUR_SITE">Sur site (Présentiel)</option>
                <option value="INDIFFERENT">Indifférent</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#444d62] block mb-1">Prétention salariale</label>
              <input
                type="text"
                value={pretentionSalariale}
                onChange={(e) => setPretentionSalariale(e.target.value)}
                className="w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3 py-2 text-xs text-[#1e2538] outline-none focus:border-[#594be0]"
              />
            </div>
          </div>
        </aside>

        {/* RIGHT COLUMN: COORDONNÉES DU COMPTE & FORMULAIRES */}
        <div className="space-y-6">
          {/* 1. COORDONNÉES DU COMPTE & IDENTITÉ */}
          <section className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#f0f2f7] pb-3 mb-4">
              <h2 className="text-sm font-extrabold text-[#171f33] flex items-center gap-2">
                <User size={16} className="text-[#594be0]" /> Coordonnées du compte & Identité
              </h2>
              <span className="text-[11px] font-bold text-[#16a34a] bg-[#f0fdf4] border border-[#bbf7d0] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck size={12} /> Compte actif
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-[#353d52]">Nom (synchronisé en temps réel)</label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => handleNomChange(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] outline-none focus:border-[#6355e8] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#353d52]">Prénom (synchronisé en temps réel)</label>
                <input
                  type="text"
                  value={prenom}
                  onChange={(e) => handlePrenomChange(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] outline-none focus:border-[#6355e8] focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-[#353d52]">Titre professionnel affiché</label>
                <input
                  type="text"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] outline-none focus:border-[#6355e8] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#353d52]">Adresse Email du compte</label>
                <div className="relative mt-1.5">
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full rounded-xl border border-[#e2e5ef] bg-[#f5f6fa] px-3.5 py-2.5 text-xs text-[#626c83] outline-none cursor-not-allowed"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] font-bold text-[#16a34a]">
                    Vérifié
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#353d52]">Téléphone</label>
                <input
                  type="text"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] outline-none focus:border-[#6355e8] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#353d52]">Ville</label>
                <input
                  type="text"
                  value={ville}
                  onChange={(e) => setVille(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] outline-none focus:border-[#6355e8] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#353d52]">Pays</label>
                <input
                  type="text"
                  value={pays}
                  onChange={(e) => setPays(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] outline-none focus:border-[#6355e8] focus:bg-white"
                />
              </div>

              {/* Liens Réseaux */}
              <div className="sm:col-span-2 pt-2 border-t border-[#f0f2f7]">
                <span className="text-xs font-bold text-[#353d52] block mb-2">Réseaux & Liens professionnels</span>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#667087] flex items-center justify-between">
                      <span>LinkedIn</span>
                      {linkedinUrl && (
                        <a href={linkedinUrl} target="_blank" rel="noreferrer" className="text-[#594be0] hover:underline flex items-center gap-0.5">
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </label>
                    <input
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                      className="mt-1 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3 py-2 text-xs outline-none focus:border-[#594be0]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#667087] flex items-center justify-between">
                      <span>GitHub</span>
                      {githubUrl && (
                        <a href={githubUrl} target="_blank" rel="noreferrer" className="text-[#594be0] hover:underline flex items-center gap-0.5">
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </label>
                    <input
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/..."
                      className="mt-1 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3 py-2 text-xs outline-none focus:border-[#594be0]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#667087] flex items-center justify-between">
                      <span>Portfolio personnel</span>
                      {portfolioUrl && (
                        <a href={portfolioUrl} target="_blank" rel="noreferrer" className="text-[#594be0] hover:underline flex items-center gap-0.5">
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </label>
                    <input
                      type="url"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="https://mon-portfolio.tn"
                      className="mt-1 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3 py-2 text-xs outline-none focus:border-[#594be0]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. SÉCURITÉ & MODIFICATION DU MOT DE PASSE DU COMPTE */}
          <section className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#f0f2f7] pb-3 mb-4">
              <h2 className="text-sm font-extrabold text-[#171f33] flex items-center gap-2">
                <Lock size={16} className="text-[#594be0]" /> Sécurité & Mot de passe du compte
              </h2>
              <span className="text-[11px] text-[#7d869e]">Minimum 8 caractères</span>
            </div>

            {passwordSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] p-3 text-xs font-bold text-[#166534]">
                <CheckCircle2 size={16} /> Mot de passe mis à jour avec succès !
              </div>
            )}

            {passwordError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#ffd2d2] bg-[#fff5f5] p-3 text-xs font-bold text-[#cf3b3b]">
                <AlertCircle size={16} /> {passwordError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
              <div>
                <label className="text-xs font-bold text-[#353d52]">Mot de passe actuel</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] outline-none focus:border-[#6355e8] focus:bg-white"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-[#353d52]">Nouveau mot de passe</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 caractères"
                    className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] outline-none focus:border-[#6355e8] focus:bg-white"
                  />
                  {/* Jauge de force */}
                  {newPassword && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <div className="h-1 flex-1 rounded-full bg-[#e2e5ef] overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            passwordStrength === 1
                              ? 'w-1/3 bg-[#ef4444]'
                              : passwordStrength === 2
                              ? 'w-2/3 bg-[#f59e0b]'
                              : 'w-full bg-[#10b981]'
                          }`}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-[#626c83]">
                        {passwordStrength === 1 ? 'Court' : passwordStrength === 2 ? 'Moyen' : 'Robuste'}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-[#353d52]">Confirmer le mot de passe</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Répétez le mot de passe"
                    className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] outline-none focus:border-[#6355e8] focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-[#5c657e] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="rounded text-[#594be0]"
                  />
                  Afficher les caractères
                </label>

                <button
                  type="submit"
                  className="rounded-xl bg-[#594be0] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#4739d2] transition"
                >
                  Mettre à jour le mot de passe
                </button>
              </div>
            </form>
          </section>

          {/* 3. RÉSUMÉ PROFESSIONNEL */}
          <section className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-extrabold text-[#171f33] flex items-center gap-2">
                <FileText size={16} className="text-[#594be0]" /> Résumé professionnel
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
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="Présentez vos points forts, votre spécialité et vos objectifs..."
              className="w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] p-3 text-xs text-[#1e2538] outline-none focus:border-[#6355e8] focus:bg-white"
            />
          </section>

          {/* 4. COMPÉTENCES CLÉS */}
          <section className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs">
            <h2 className="text-sm font-extrabold text-[#171f33] mb-3 flex items-center gap-2">
              <Award size={16} className="text-[#594be0]" /> Compétences clés
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
                value={newSkill}
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

          {/* 5. EXPÉRIENCES PROFESSIONNELLES */}
          <section className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-extrabold text-[#171f33] flex items-center gap-2">
                <Briefcase size={16} className="text-[#594be0]" /> Expériences professionnelles
              </h2>
              <button
                onClick={() => {
                  setEditingExpIndex(null);
                  setExpPoste('');
                  setExpEmployeur('');
                  setExpDates('');
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
                  Aucune expérience renseignée pour le moment.
                </div>
              ) : (
                experiences.map((exp, idx) => (
                  <div key={idx} className="rounded-2xl border border-[#edf0f7] bg-[#fafbfc] p-4 text-xs">
                    <div className="flex justify-between items-start font-bold text-[#1a2133]">
                      <span>{exp.poste} · {exp.employeur}</span>
                      <span className="text-[#8891a6] font-medium">{exp.dates}</span>
                    </div>
                    {exp.description && <p className="mt-1 text-[#5b6378] text-[11px] leading-relaxed">{exp.description}</p>}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* 6. FORMATIONS & DIPLÔMES */}
          <section className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-extrabold text-[#171f33] flex items-center gap-2">
                <GraduationCap size={16} className="text-[#594be0]" /> Formations & Diplômes
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
                  Aucune formation renseignée pour le moment.
                </div>
              ) : (
                formations.map((f, idx) => (
                  <div key={idx} className="rounded-2xl border border-[#edf0f7] bg-[#fafbfc] p-4 text-xs font-bold text-[#1a2133] flex justify-between">
                    <span>{f.diplome} — {f.ecole}</span>
                    <span className="text-[#8891a6] font-medium">{f.annee}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* 7. LANGUES */}
          <section className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs">
            <h2 className="text-sm font-extrabold text-[#171f33] flex items-center gap-2 mb-3">
              <Languages size={16} className="text-[#594be0]" /> Langues
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
                value={newLangNom}
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

          {/* ENREGISTRER & SUPPRIMER MON COMPTE */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="text-xs font-semibold text-[#8b94a8] hover:text-[#d13a3a] transition"
            >
              Supprimer mon compte et mes données (RGPD)
            </button>

            <button
              onClick={handleSaveProfile}
              className="rounded-2xl bg-[#594be0] px-8 py-3 text-xs font-bold text-white shadow-md shadow-[#594be0]/20 hover:bg-[#4739d2] transition flex items-center gap-2"
            >
              <Save size={16} /> Enregistrer mon profil
            </button>
          </div>
        </div>
      </div>

      {/* MODAL GESTION PHOTO DE PROFIL & AVATARS */}
      {showAvatarPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-base font-black text-[#171f33] flex items-center gap-2">
                <Camera size={18} className="text-[#594be0]" /> Photo de profil & Avatar
              </h4>
              <button onClick={() => setShowAvatarPicker(false)} className="text-[#8e98af] hover:text-[#171f33]">
                <X size={18} />
              </button>
            </div>

            {/* Aperçu actuel */}
            <div className="flex items-center gap-4 bg-[#fafbfc] p-4 rounded-2xl border border-[#edf0f7]">
              <div className="size-16 rounded-2xl overflow-hidden bg-[#594be0] grid place-items-center text-white font-black text-xl shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Aperçu" className="size-full object-cover" />
                ) : (
                  <span>{prenom[0]}{nom[0]}</span>
                )}
              </div>
              <div className="text-xs">
                <div className="font-bold text-[#1a2233]">Photo actuellement affichée</div>
                <div className="text-[#7d869e] text-[11px] mt-0.5">Visible sur votre profil et votre CV dynamique</div>
              </div>
            </div>

            {/* Option 1: Téléverser depuis le PC */}
            <div>
              <label className="font-bold text-xs text-[#353d52] block mb-2">Importer une photo depuis votre PC</label>
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#594be0] bg-[#f8f7ff] p-3 text-xs font-bold text-[#594be0] hover:bg-[#f0edff] transition"
              >
                <Upload size={16} /> Choisir un fichier (PNG, JPG, max 3 Mo)
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  handlePhotoUpload(e);
                  setShowAvatarPicker(false);
                }}
              />
            </div>

            {/* Option 2: Avatars prédéfinis */}
            <div>
              <label className="font-bold text-xs text-[#353d52] block mb-2">Ou choisir un avatar stylisé</label>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_AVATARS.map((av, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPresetAvatar(av.url)}
                    className="group relative rounded-xl overflow-hidden border-2 border-transparent hover:border-[#594be0] transition aspect-square"
                  >
                    <img src={av.url} alt={av.name} className="size-full object-cover" />
                    <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold transition">
                      Choisir
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Option 3: Supprimer */}
            {avatarUrl && (
              <div className="pt-2 border-t border-[#f0f2f7]">
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="w-full text-center text-xs font-bold text-[#cf3b3b] hover:underline"
                >
                  Supprimer la photo (utiliser les initiales)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL AJOUT / ÉDITION EXPÉRIENCE */}
      {showExpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h4 className="text-sm font-extrabold text-[#1a2133]">
              {editingExpIndex !== null ? 'Modifier l’expérience' : 'Nouvelle expérience'}
            </h4>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#333b4e]">Poste *</label>
                <input
                  type="text"
                  value={expPoste}
                  onChange={(e) => setExpPoste(e.target.value)}
                  placeholder="Développeur Web Junior"
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none focus:border-[#594be0]"
                />
              </div>
              <div>
                <label className="font-bold text-[#333b4e]">Employeur / Entreprise *</label>
                <input
                  type="text"
                  value={expEmployeur}
                  onChange={(e) => setExpEmployeur(e.target.value)}
                  placeholder="Tech Solutions"
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none focus:border-[#594be0]"
                />
              </div>
              <div>
                <label className="font-bold text-[#333b4e]">Dates</label>
                <input
                  type="text"
                  value={expDates}
                  onChange={(e) => setExpDates(e.target.value)}
                  placeholder="2025 - 2026"
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none focus:border-[#594be0]"
                />
              </div>
              <div>
                <label className="font-bold text-[#333b4e]">Lieu</label>
                <input
                  type="text"
                  value={expLieu}
                  onChange={(e) => setExpLieu(e.target.value)}
                  placeholder="Sfax, Tunisie"
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none focus:border-[#594be0]"
                />
              </div>
              <div>
                <label className="font-bold text-[#333b4e]">Description des missions</label>
                <textarea
                  rows={3}
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  placeholder="Développement frontend React, intégration d’API REST..."
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none focus:border-[#594be0]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowExpModal(false)}
                className="rounded-xl border border-[#dde0ec] px-4 py-2 font-bold text-[#626c83]"
              >
                Annuler
              </button>
              <button
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
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h4 className="text-sm font-extrabold text-[#1a2133]">
              {editingFormIndex !== null ? 'Modifier la formation' : 'Nouvelle formation'}
            </h4>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#333b4e]">Diplôme / Intitulé *</label>
                <input
                  type="text"
                  value={formDiplome}
                  onChange={(e) => setFormDiplome(e.target.value)}
                  placeholder="Licence en Informatique de Gestion"
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none focus:border-[#594be0]"
                />
              </div>
              <div>
                <label className="font-bold text-[#333b4e]">École / Université *</label>
                <input
                  type="text"
                  value={formEcole}
                  onChange={(e) => setFormEcole(e.target.value)}
                  placeholder="Faculté des Sciences de Sfax"
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
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowFormModal(false)}
                className="rounded-xl border border-[#dde0ec] px-4 py-2 font-bold text-[#626c83]"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveFormation}
                className="rounded-xl bg-[#594be0] px-5 py-2 font-bold text-white hover:bg-[#4739d2]"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL APERÇU PUBLIC DU PROFIL */}
      {showPublicPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-7 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="font-extrabold text-[#171f33] text-sm">Aperçu public de votre fiche candidat</span>
              <button onClick={() => setShowPublicPreview(false)} className="text-[#8e98af] hover:text-[#171f33]">
                <X size={18} />
              </button>
            </div>
            <div className="flex items-center gap-3.5 bg-[#fafbfc] p-4 rounded-2xl border border-[#edf0f7]">
              <div className="size-14 rounded-2xl overflow-hidden bg-[#594be0] grid place-items-center text-white font-black text-lg shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={`${prenom} ${nom}`} className="size-full object-cover" />
                ) : (
                  <span>{prenom[0]}{nom[0]}</span>
                )}
              </div>
              <div>
                <div className="font-extrabold text-[#171f33] text-sm">{prenom} {nom}</div>
                <div className="text-[11px] text-[#594be0] font-semibold">{titre}</div>
                <div className="text-[10px] text-[#7d869e]">{ville}, {pays} · {disponibilite}</div>
              </div>
            </div>
            <p className="text-[11px] text-[#555d72] bg-[#fafbfc] p-3 rounded-xl border border-[#edf0f7] leading-relaxed">
              {resume || 'Aucun résumé professionnel rédigé.'}
            </p>
            <div>
              <div className="font-bold text-[#353d52] mb-1.5">Compétences affichées :</div>
              <div className="flex flex-wrap gap-1">
                {competences.map((c) => (
                  <span key={c} className="rounded-lg bg-[#efedff] px-2 py-0.5 text-[10px] font-bold text-[#5547d7]">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUPPRESSION RGPD */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center gap-2 text-[#cf3b3b] font-bold">
              <Shield size={18} /> Suppression définitive de votre compte
            </div>
            <p className="text-[#5d657a]">
              Conformément au RGPD, cette action effacera vos données, CVs et candidatures de manière irréversible.
            </p>
            <div>
              <label className="font-bold text-[#353d52] block mb-1">
                Tapez <strong>SUPPRIMER</strong> pour confirmer :
              </label>
              <input
                type="text"
                value={confirmDeleteText}
                onChange={(e) => setConfirmDeleteText(e.target.value)}
                placeholder="SUPPRIMER"
                className="w-full rounded-xl border border-[#fca5a5] p-2.5 font-bold text-[#cf3b3b] outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-xl border border-[#dde1ee] px-4 py-2 font-bold text-[#646d84]"
              >
                Annuler
              </button>
              <button
                disabled={confirmDeleteText !== 'SUPPRIMER'}
                onClick={() => {
                  setShowDeleteModal(false);
                  onDeleteMyData();
                }}
                className="rounded-xl bg-[#cf3b3b] px-4 py-2 font-bold text-white disabled:opacity-40"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
