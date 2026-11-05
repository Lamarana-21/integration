'use client';

import React, { useState, useEffect } from 'react';
import {
  Camera,
  CheckCircle2,
  KeyRound,
  LayoutDashboard,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  ShieldCheck,
  Sliders,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import { User as UserType } from '@/lib/types';

interface ProfilAdminViewProps {
  currentUser: UserType | null;
  onUpdateProfile: (updated: Partial<UserType>) => void;
  onNavigateScreen: (screen: string) => void;
}

export function ProfilAdminView({
  currentUser,
  onUpdateProfile,
  onNavigateScreen,
}: ProfilAdminViewProps) {
  const [nom, setNom] = useState(currentUser?.nom || 'Moreau');
  const [prenom, setPrenom] = useState(currentUser?.prenom || 'Amélie');
  const [email, setEmail] = useState(currentUser?.email || 'admin@talenta.example');
  const [telephone, setTelephone] = useState('+216 71 234 567');
  const [fonction, setFonction] = useState('Superviseur Système & Responsable Sécurité RH');
  const [ville, setVille] = useState('Tunis');
  const [pays, setPays] = useState('Tunisie');
  const [bio, setBio] = useState('Administrateur principal en charge de la gouvernance des comptes, de la validation des entreprises et du contrôle de conformité des processus de recrutement.');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar_url || '');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setNom(currentUser.nom || '');
      setPrenom(currentUser.prenom || '');
      setEmail(currentUser.email || '');
      if (currentUser.avatar_url) {
        setAvatarUrl(currentUser.avatar_url);
      }
    }
  }, [currentUser]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    onUpdateProfile({
      nom,
      prenom,
      email,
      avatar_url: avatarUrl,
    });

    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    }, 400);
  };

  const AVATARS_PRESETS = [
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=256',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256',
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8 font-sans">
      {/* 1. HEADER DU PROFIL ADMINISTRATEUR */}
      <div className="rounded-3xl border border-[#e5e9f3] bg-gradient-to-br from-white via-[#fafbfe] to-[#f4f3ff] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            {/* Avatar interactif */}
            <div className="relative group">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`${prenom} ${nom}`}
                  className="size-20 sm:size-24 rounded-3xl object-cover border-2 border-white shadow-md shadow-[#594be0]/15"
                />
              ) : (
                <div className="grid size-20 sm:size-24 place-items-center rounded-3xl bg-gradient-to-br from-[#c93232] to-[#ff6b6b] text-3xl font-black text-white shadow-md shadow-[#c93232]/20">
                  {prenom?.[0] || 'A'}
                  {nom?.[0] || 'M'}
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                title="Modifier ma photo"
                className="absolute -bottom-2 -right-2 grid size-8 place-items-center rounded-xl bg-white text-[#594be0] border border-[#e2e6f2] shadow-sm hover:scale-105 transition"
              >
                <Camera size={15} />
              </button>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-black text-[#171f33]">
                  {prenom} {nom}
                </h1>
                <span className="rounded-full bg-[#ffe8e8] px-3 py-1 text-[11px] font-extrabold text-[#c93232] border border-[#ffd5d5] flex items-center gap-1">
                  <Shield size={12} /> Super Administrateur
                </span>
                <span className="rounded-full bg-[#edf9f3] px-2.5 py-0.5 text-[10px] font-bold text-[#248e56]">
                  Compte Vérifié
                </span>
              </div>
              <p className="mt-1 text-xs font-medium text-[#7a849b]">
                {fonction} · {email}
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[11px] text-[#8e97ac]">
                <span className="flex items-center gap-1">
                  <MapPin size={12} className="text-[#594be0]" /> {ville}, {pays}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Phone size={12} className="text-[#594be0]" /> {telephone}
                </span>
                <span>·</span>
                <span>Dernière connexion : Aujourd’hui</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center sm:justify-end gap-2.5">
            <button
              onClick={() => onNavigateScreen('E_ADMIN_DASHBOARD')}
              className="flex items-center gap-2 rounded-2xl bg-[#594be0] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#594be0]/20 hover:bg-[#483ad3] transition"
            >
              <LayoutDashboard size={15} />
              Tableau de bord
            </button>
            <button
              onClick={() => onNavigateScreen('E_SETTINGS')}
              className="flex items-center gap-2 rounded-2xl border border-[#dfe3ee] bg-white px-4 py-2.5 text-xs font-bold text-[#4c556b] shadow-xs hover:bg-[#f6f7fb] transition"
            >
              <Sliders size={15} className="text-[#594be0]" />
              Paramètres
            </button>
          </div>
        </div>

        {/* Sélecteur d'avatar rapide */}
        {showAvatarPicker && (
          <div className="mt-6 rounded-2xl bg-white border border-[#edf0f8] p-4 animate-in fade-in">
            <div className="text-xs font-bold text-[#1e2538] mb-2 flex items-center justify-between">
              <span>Choisir un avatar officiel ou réinitialiser :</span>
              <button
                type="button"
                onClick={() => setShowAvatarPicker(false)}
                className="text-[#9aa4b9] hover:text-[#171f33] text-[11px]"
              >
                Fermer ✕
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {AVATARS_PRESETS.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Preset ${idx}`}
                  onClick={() => {
                    setAvatarUrl(url);
                    setShowAvatarPicker(false);
                  }}
                  className={`size-12 rounded-2xl object-cover cursor-pointer border-2 transition hover:scale-105 ${
                    avatarUrl === url ? 'border-[#594be0] ring-2 ring-[#594be0]/30' : 'border-transparent'
                  }`}
                />
              ))}
              <button
                type="button"
                onClick={() => {
                  setAvatarUrl('');
                  setShowAvatarPicker(false);
                }}
                className="rounded-2xl border border-[#dde1ed] bg-[#f8f9fd] px-3 py-2.5 text-xs font-bold text-[#626c82] hover:bg-[#eff1f8]"
              >
                Utiliser mes initiales
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. FORMULAIRE D'ÉDITION DES COORDONNÉES ADMINISTRATEUR */}
      <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#f0f2f7] pb-4">
          <div>
            <h2 className="text-base font-extrabold text-[#171f33] flex items-center gap-2">
              <User size={18} className="text-[#594be0]" /> Coordonnées & Identité du compte Administrateur
            </h2>
            <p className="mt-0.5 text-xs text-[#7e879c]">
              Gérez votre identité officielle d'administrateur système sur la plateforme Talenta.
            </p>
          </div>
        </div>

        {saveSuccess && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[#edf9f3] p-4 text-xs font-bold text-[#248e56] border border-[#c6ecd5] animate-in fade-in">
            <CheckCircle2 size={17} />
            Vos informations de profil Administrateur ont été enregistrées avec succès !
          </div>
        )}

        <form onSubmit={handleSave} className="mt-6 space-y-5 text-xs">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-bold text-[#353e54] mb-1.5">Nom de famille *</label>
              <input
                type="text"
                value={nom ?? ''}
                onChange={(e) => setNom(e.target.value)}
                required
                className="w-full rounded-2xl border border-[#dde1ed] bg-white px-4 py-2.5 text-xs font-semibold text-[#1f283d] outline-none focus:border-[#594be0] focus:ring-2 focus:ring-[#594be0]/20"
              />
            </div>
            <div>
              <label className="block font-bold text-[#353e54] mb-1.5">Prénom *</label>
              <input
                type="text"
                value={prenom ?? ''}
                onChange={(e) => setPrenom(e.target.value)}
                required
                className="w-full rounded-2xl border border-[#dde1ed] bg-white px-4 py-2.5 text-xs font-semibold text-[#1f283d] outline-none focus:border-[#594be0] focus:ring-2 focus:ring-[#594be0]/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-bold text-[#353e54] mb-1.5">Adresse e-mail officielle *</label>
              <input
                type="email"
                value={email ?? ''}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-2xl border border-[#dde1ed] bg-white px-4 py-2.5 text-xs font-semibold text-[#1f283d] outline-none focus:border-[#594be0] focus:ring-2 focus:ring-[#594be0]/20"
              />
            </div>
            <div>
              <label className="block font-bold text-[#353e54] mb-1.5">Numéro de téléphone professionnel</label>
              <input
                type="text"
                value={telephone ?? ''}
                onChange={(e) => setTelephone(e.target.value)}
                className="w-full rounded-2xl border border-[#dde1ed] bg-white px-4 py-2.5 text-xs font-semibold text-[#1f283d] outline-none focus:border-[#594be0] focus:ring-2 focus:ring-[#594be0]/20"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#353e54] mb-1.5">Titre / Rôle officiel dans l'organisation</label>
            <input
              type="text"
              value={fonction ?? ''}
              onChange={(e) => setFonction(e.target.value)}
              className="w-full rounded-2xl border border-[#dde1ed] bg-white px-4 py-2.5 text-xs font-semibold text-[#1f283d] outline-none focus:border-[#594be0] focus:ring-2 focus:ring-[#594be0]/20"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-bold text-[#353e54] mb-1.5">Ville de rattachement</label>
              <input
                type="text"
                value={ville ?? ''}
                onChange={(e) => setVille(e.target.value)}
                className="w-full rounded-2xl border border-[#dde1ed] bg-white px-4 py-2.5 text-xs font-semibold text-[#1f283d] outline-none focus:border-[#594be0] focus:ring-2 focus:ring-[#594be0]/20"
              />
            </div>
            <div>
              <label className="block font-bold text-[#353e54] mb-1.5">Pays</label>
              <input
                type="text"
                value={pays ?? ''}
                onChange={(e) => setPays(e.target.value)}
                className="w-full rounded-2xl border border-[#dde1ed] bg-white px-4 py-2.5 text-xs font-semibold text-[#1f283d] outline-none focus:border-[#594be0] focus:ring-2 focus:ring-[#594be0]/20"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#353e54] mb-1.5">Note de mission / Biographie d'administrateur</label>
            <textarea
              rows={3}
              value={bio ?? ''}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-2xl border border-[#dde1ed] bg-white p-3.5 text-xs font-medium text-[#1f283d] outline-none focus:border-[#594be0] focus:ring-2 focus:ring-[#594be0]/20"
            />
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-2xl bg-[#594be0] px-6 py-3 text-xs font-bold text-white shadow-md shadow-[#594be0]/25 hover:bg-[#4739d2] transition disabled:opacity-50"
            >
              <Save size={15} />
              {isSaving ? 'Enregistrement...' : 'Enregistrer mon profil administrateur'}
            </button>
          </div>
        </form>
      </div>

      {/* 3. SÉCURITÉ DU COMPTE & HABILITATIONS SYSTÈME */}
      <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#f0f2f7] pb-4 gap-2">
          <div>
            <h3 className="text-base font-extrabold text-[#171f33] flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#248e56]" /> Sécurité & Privilèges Système
            </h3>
            <p className="mt-0.5 text-xs text-[#7d869e]">
              Ce compte dispose des privilèges de niveau 1 (Contrôle total sur l'ensemble de la plateforme Talenta).
            </p>
          </div>
          <button
            onClick={() => onNavigateScreen('E_SETTINGS')}
            className="flex items-center gap-1.5 text-xs font-bold text-[#594be0] hover:underline self-start sm:self-auto"
          >
            <KeyRound size={13} /> Gérer mot de passe et sécurité →
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
          <div className="rounded-2xl bg-[#fafbfe] border border-[#eff1f8] p-4 space-y-1">
            <div className="font-bold text-[#1f273b] flex items-center gap-1.5">
              <Users size={14} className="text-[#594be0]" /> Gestion Intégrale des Utilisateurs
            </div>
            <p className="text-[11px] text-[#788299] leading-relaxed">
              Créer, éditer, suspendre et modérer les comptes candidats, recruteurs et administrateurs.
            </p>
          </div>

          <div className="rounded-2xl bg-[#fafbfe] border border-[#eff1f8] p-4 space-y-1">
            <div className="font-bold text-[#1f273b] flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#248e56]" /> Supervision des Entreprises
            </div>
            <p className="text-[11px] text-[#788299] leading-relaxed">
              Validation des fiches d'entreprises partenaires, audit des offres d'emploi et modération.
            </p>
          </div>

          <div className="rounded-2xl bg-[#fafbfe] border border-[#eff1f8] p-4 space-y-1">
            <div className="font-bold text-[#1f273b] flex items-center gap-1.5">
              <KeyRound size={14} className="text-[#805ad5]" /> Droits RBAC & Permissions
            </div>
            <p className="text-[11px] text-[#788299] leading-relaxed">
              Configuration de la matrice des habilitations, attribution des rôles et contrôle d'accès.
            </p>
          </div>

          <div className="rounded-2xl bg-[#fafbfe] border border-[#eff1f8] p-4 space-y-1">
            <div className="font-bold text-[#1f273b] flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#d69e2e]" /> Moteur IA & Conformité RGPD
            </div>
            <p className="text-[11px] text-[#788299] leading-relaxed">
              Contrôle du traitement algorithmique des CV et respect strict des règles de confidentialité.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
