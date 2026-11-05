'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  AlertCircle,
  Building2,
  Camera,
  CheckCircle2,
  Clock,
  Database,
  Eye,
  FileText,
  Lock,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  Upload,
  User,
  X,
  ArrowRight,
} from 'lucide-react';
import { Candidat } from '@/lib/types';

interface ProfilCandidatViewProps {
  candidat: Candidat;
  currentUser?: import('@/lib/types').User | null;
  onUpdateProfile: (updated: Partial<Candidat>) => void | Promise<void>;
  onDeleteMyData: () => void;
  onNavigateScreen?: (screen: string) => void;
  onRefreshFromDb?: () => Promise<void>;
  backendOnline?: boolean | null;
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

export function ProfilCandidatView({
  candidat,
  currentUser,
  onUpdateProfile,
  onDeleteMyData,
  onNavigateScreen,
  onRefreshFromDb,
  backendOnline,
}: ProfilCandidatViewProps) {
  // Photo de profil
  const [avatarUrl, setAvatarUrl] = useState<string>(
    candidat.avatar_url ||
    candidat.user?.avatar_url ||
    currentUser?.avatar_url ||
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256'
  );
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Coordonnées du compte (chargées depuis la BDD ou le compte utilisateur connecté)
  const [nom, setNom] = useState(
    candidat.nom || candidat.user?.nom || currentUser?.nom || 'Ben Salem'
  );
  const [prenom, setPrenom] = useState(
    candidat.prenom || candidat.user?.prenom || currentUser?.prenom || 'Amina'
  );
  const [titre, setTitre] = useState(candidat.titre || 'Développeuse Web Junior Full Stack');
  const [telephone, setTelephone] = useState(candidat.telephone || '+216 98 123 456');
  const [ville, setVille] = useState(candidat.ville || 'Sfax');
  const [pays, setPays] = useState(candidat.pays || 'Tunisie');
  const [email, setEmail] = useState(candidat.user?.email || currentUser?.email || 'amina@mail.example');

  // Sécurité & Mot de passe
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Modals & Notifications
  const [showPublicPreview, setShowPublicPreview] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Synchronisation dynamique si le candidat ou l'utilisateur connecté est restauré depuis la BDD
  useEffect(() => {
    const activeNom = candidat.nom || candidat.user?.nom || currentUser?.nom;
    if (activeNom) setNom(activeNom || '');

    const activePrenom = candidat.prenom || candidat.user?.prenom || currentUser?.prenom;
    if (activePrenom) setPrenom(activePrenom || '');

    const restoredAvatar = candidat.avatar_url || candidat.user?.avatar_url || currentUser?.avatar_url;
    if (restoredAvatar) setAvatarUrl(restoredAvatar || '');

    if (candidat.titre !== undefined && candidat.titre !== null) setTitre(candidat.titre || '');
    if (candidat.telephone !== undefined && candidat.telephone !== null) setTelephone(candidat.telephone || '');
    if (candidat.ville !== undefined && candidat.ville !== null) setVille(candidat.ville || '');
    if (candidat.pays !== undefined && candidat.pays !== null) setPays(candidat.pays || '');

    const activeEmail = candidat.user?.email || currentUser?.email;
    if (activeEmail) setEmail(activeEmail || '');
  }, [candidat, currentUser]);

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
    nom: newVal,
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
    prenom: newVal,
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

// Calcul dynamique de la complétude du compte & coordonnées
const completenessScore = useMemo(() => {
  let score = 0;
  if (avatarUrl) score += 20;
  if (nom.trim() && prenom.trim()) score += 25;
  if (titre.trim()) score += 20;
  if (telephone.trim()) score += 15;
  if (ville.trim() && pays.trim()) score += 20;
  return Math.min(100, score);
}, [avatarUrl, nom, prenom, titre, telephone, ville, pays]);

// Indicateur de force du mot de passe
const passwordStrength = useMemo(() => {
  if (!newPassword) return 0;
  let strength = 1;
  if (newPassword.length >= 8) strength++;
  if (/[0-9]/.test(newPassword) && /[A-Z]/.test(newPassword)) strength++;
  return strength;
}, [newPassword]);

// Sauvegarde globale des coordonnées du profil avec persistance en BDD
const handleSaveProfile = async () => {
  setIsSaving(true);
  try {
    await onUpdateProfile({
      nom,
      prenom,
      avatar_url: avatarUrl,
      titre,
      telephone,
      ville,
      pays,
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
    setTimeout(() => setSaveSuccess(false), 3500);
  } finally {
    setIsSaving(false);
  }
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
  <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-6">
    {saveSuccess && (
      <div className="fixed top-20 right-6 z-50 flex items-center gap-3 rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] px-5 py-3 text-xs font-bold text-[#166534] shadow-xl animate-in slide-in-from-top-4">
        <CheckCircle2 size={18} className="text-[#16a34a]" />
        <span>Modifications enregistrées avec succès dans la base de données (MySQL) !</span>
      </div>
    )}

    {/* TOP CANDIDATE HERO BANNER AVEC PHOTO */}
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
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl font-black text-[#171f33]">
                {prenom} {nom}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#eef2ff] px-2.5 py-0.5 text-[10px] font-bold text-[#4338ca] border border-[#dce3f9]">
                <ShieldCheck size={12} /> Compte actif
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf5] px-2.5 py-0.5 text-[10px] font-bold text-[#065f46] border border-[#a7f3d0]">
                <Database size={11} className="text-[#059669]" /> Base de données connectée (MySQL)
              </span>
              <span className="rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-[10px] font-bold text-[#475569]">
                Candidat
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
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {onRefreshFromDb && (
            <button
              type="button"
              onClick={async () => {
                setSyncing(true);
                await onRefreshFromDb();
                setSyncing(false);
              }}
              disabled={syncing}
              className="flex items-center gap-1.5 rounded-2xl border border-[#d8dce8] bg-white px-3.5 py-2.5 text-xs font-bold text-[#424b61] shadow-xs hover:bg-[#f6f7fb] transition"
              title="Recharger les modifications directement depuis la base de données MySQL"
            >
              <RefreshCw size={14} className={`text-[#594be0] ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Synchronisation...' : 'Recharger depuis la BDD'}</span>
            </button>
          )}
          <button
            onClick={() => setShowPublicPreview(true)}
            className="flex items-center gap-1.5 rounded-2xl border border-[#d8dce8] bg-white px-4 py-2.5 text-xs font-bold text-[#424b61] shadow-xs hover:bg-[#f6f7fb] transition"
          >
            <Eye size={15} className="text-[#594be0]" /> Aperçu Public
          </button>
          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-2xl bg-[#594be0] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#594be0]/20 hover:bg-[#4739d2] transition disabled:opacity-50"
          >
            <Save size={15} /> {isSaving ? 'Enregistrement...' : 'Enregistrer en BDD'}
          </button>
        </div>
      </div>
    </div>

    {/* DISPOSITION EN 2 COLONNES */}
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      {/* COLONNE GAUCHE: COMPLÉTUDE & RACCOURCI VERS CV */}
      <aside className="space-y-6">
        {/* Complétude du compte */}
        <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#636b80]">
              Coordonnées du compte
            </span>
            <span className="text-base font-black text-[#594be0]">{completenessScore} %</span>
          </div>
          <div className="mt-3 h-2.5 w-full rounded-full bg-[#f0f2f7] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#594be0] to-[#10b981] transition-all duration-500 rounded-full"
              style={{ width: `${completenessScore}%` }}
            />
          </div>
          <p className="mt-2.5 text-[11px] text-[#788299] leading-relaxed">
            Vos coordonnées sont automatiquement rattachées à vos candidatures et à votre CV.
          </p>
        </div>

        {/* Raccourci vers l'espace CV */}
        {onNavigateScreen && (
          <div className="rounded-3xl border border-[#dcd8fb] bg-gradient-to-br from-[#faf9fe] to-[#f2efff] p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 font-black text-xs text-[#5547d7]">
              <FileText size={16} /> Espace CV dédié
            </div>
            <p className="text-[11px] text-[#6055a8] leading-relaxed">
              Vos compétences, expériences, formations, langues, liens professionnels et modèles de CV sont gérés dans l'onglet <strong>Mes CV</strong>.
            </p>
            <button
              type="button"
              onClick={() => onNavigateScreen('E6_CV')}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#594be0] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#4739d2] transition"
            >
              <span>Accéder à mes CV</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </aside>

      {/* COLONNE DROITE: IDENTITÉ & MOT DE PASSE DU COMPTE */}
      <div className="space-y-6">
        {/* 1. IDENTITÉ & COORDONNÉES PERSONNELLES */}
        <section className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#f0f2f7] pb-3 mb-4">
            <h2 className="text-sm font-extrabold text-[#171f33] flex items-center gap-2">
              <User size={16} className="text-[#594be0]" /> Identité & Coordonnées du compte
            </h2>
            <span className="text-[11px] text-[#788299]">Informations de votre compte candidat</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-[#353d52]">Nom (synchronisé en temps réel)</label>
              <input
                type="text"
                value={nom ?? ''}
                onChange={(e) => handleNomChange(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] outline-none focus:border-[#6355e8] focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#353d52]">Prénom (synchronisé en temps réel)</label>
              <input
                type="text"
                value={prenom ?? ''}
                onChange={(e) => handlePrenomChange(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] outline-none focus:border-[#6355e8] focus:bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-[#353d52]">Titre professionnel</label>
              <input
                type="text"
                value={titre ?? ''}
                onChange={(e) => setTitre(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] outline-none focus:border-[#6355e8] focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#353d52]">Adresse Email du compte</label>
              <div className="relative mt-1.5">
                <input
                  type="email"
                  value={email ?? ''}
                  disabled
                  className="w-full rounded-xl border border-[#e2e5ef] bg-[#f5f6fa] px-3.5 py-2.5 text-xs text-[#626c83] outline-none cursor-not-allowed"
                />
                <span className="absolute right-3 top-2.5 text-[10px] font-bold text-[#16a34a]">
                  Vérifié
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#353d52]">Numéro de téléphone</label>
              <input
                type="text"
                value={telephone ?? ''}
                onChange={(e) => setTelephone(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] outline-none focus:border-[#6355e8] focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#353d52]">Ville de résidence</label>
              <input
                type="text"
                value={ville ?? ''}
                onChange={(e) => setVille(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] outline-none focus:border-[#6355e8] focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#353d52]">Pays</label>
              <input
                type="text"
                value={pays ?? ''}
                onChange={(e) => setPays(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] outline-none focus:border-[#6355e8] focus:bg-white"
              />
            </div>
          </div>
        </section>



          {/* 3. RACCOURCI VERS PARAMÈTRES & MOT DE PASSE */}
          {onNavigateScreen && (
            <div className="rounded-3xl border border-[#e5e8f3] bg-gradient-to-r from-[#fafbfe] to-[#f4f3ff] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="grid size-10 place-items-center rounded-2xl bg-[#594be0] text-white shrink-0 shadow-sm">
                  <Settings size={18} />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-[#171f33]">Sécurité, Mot de passe & RGPD</h4>
                  <p className="text-[11px] text-[#6b758d] mt-0.5">
                    Le changement de mot de passe, les alertes e-mail et la gestion de vos données se trouvent désormais dans l'espace <strong>Paramètres</strong>.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigateScreen('E_SETTINGS')}
                className="self-start sm:self-auto shrink-0 flex items-center gap-2 rounded-xl border border-[#594be0] bg-white px-4 py-2.5 text-xs font-bold text-[#594be0] hover:bg-[#594be0] hover:text-white transition shadow-xs"
              >
                <span>Accéder aux Paramètres</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* ACTIONS GLOBALES */}
          <div className="flex items-center justify-end pt-2">
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

    {/* MODAL APERÇU PUBLIC DU PROFIL */}
    {showPublicPreview && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl space-y-4 text-xs">
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
              <div className="text-[10px] text-[#7d869e]">{ville}, {pays}</div>
            </div>
          </div>
          <div className="bg-[#fafbfc] p-3 rounded-2xl border border-[#edf0f7] space-y-1 text-[#555d72]">
            <div><strong>Email :</strong> {email}</div>
            <div><strong>Téléphone :</strong> {telephone}</div>
            <div><strong>Localisation :</strong> {ville}, {pays}</div>
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
              value={confirmDeleteText ?? ''}
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
