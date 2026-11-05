'use client';

import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  BriefcaseBusiness,
  Building2,
  Camera,
  CheckCircle2,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Save,
  Sliders,
  User,
  Users,
} from 'lucide-react';
import { Entreprise, Offre, User as UserType } from '@/lib/types';

interface ProfilRecruteurViewProps {
  currentUser: UserType | null;
  entreprise: Entreprise;
  offres: Offre[];
  onUpdateProfile: (updated: Partial<UserType>) => void;
  onNavigateScreen: (screen: string) => void;
}

export function ProfilRecruteurView({
  currentUser,
  entreprise,
  offres,
  onUpdateProfile,
  onNavigateScreen,
}: ProfilRecruteurViewProps) {
  const [nom, setNom] = useState(currentUser?.nom || 'Ben Ali');
  const [prenom, setPrenom] = useState(currentUser?.prenom || 'Rached');
  const [email, setEmail] = useState(currentUser?.email || 'rh@alpha.example');
  const [telephone, setTelephone] = useState('+216 74 123 456');
  const [titre, setTitre] = useState('Responsable du Recrutement & Talents');
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

  const myCompanyOffers = offres.filter(
    (o) => o.entreprise_id === entreprise.id || o.entreprise?.id === entreprise.id
  );
  const activeJobs = myCompanyOffers.filter((o) => o.statut === 'PUBLIEE');

  const AVATARS_PRESETS = [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8 font-sans">
      {/* 1. HEADER DU PROFIL RECRUTEUR */}
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
                <div className="grid size-20 sm:size-24 place-items-center rounded-3xl bg-gradient-to-br from-[#594be0] to-[#7b6ef0] text-3xl font-black text-white shadow-md shadow-[#594be0]/20">
                  {prenom?.[0] || 'R'}
                  {nom?.[0] || 'B'}
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
                <span className="rounded-full bg-[#f0efff] px-3 py-1 text-[11px] font-extrabold text-[#594be0] border border-[#e3dfff] flex items-center gap-1">
                  <Briefcase size={12} /> Recruteur Certifié
                </span>
                <span className="rounded-full bg-[#edf9f3] px-2.5 py-0.5 text-[10px] font-bold text-[#248e56]">
                  Actif
                </span>
              </div>
              <p className="mt-1 text-xs font-semibold text-[#594be0]">
                {titre} chez {entreprise.nom}
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[11px] text-[#8e97ac]">
                <span className="flex items-center gap-1">
                  <Building2 size={12} className="text-[#594be0]" /> {entreprise.nom} ({entreprise.ville})
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Mail size={12} className="text-[#594be0]" /> {email}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Phone size={12} className="text-[#594be0]" /> {telephone}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center sm:justify-end gap-2">
            <button
              onClick={() => onNavigateScreen('E11')}
              className="flex items-center gap-2 rounded-2xl border border-[#dfe3ee] bg-white px-4 py-2.5 text-xs font-bold text-[#4c556b] shadow-xs hover:bg-[#f6f7fb] transition"
            >
              <Building2 size={15} className="text-[#594be0]" />
              Fiche entreprise
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
              <span>Choisir un avatar ou réinitialiser :</span>
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

      {/* 2. LIEN VERS L'ENTREPRISE & RECRUTEMENT */}
      <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#f0f2f7] pb-4">
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-[#594be0]" />
            <h2 className="text-sm font-extrabold text-[#171f33]">
              Votre Entreprise Rattachée : {entreprise.nom}
            </h2>
          </div>
          <button
            onClick={() => onNavigateScreen('E11')}
            className="flex items-center gap-1 text-xs font-bold text-[#594be0] hover:underline"
          >
            Voir la fiche publique <ExternalLink size={12} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
          <div className="rounded-2xl bg-[#fafbfe] border border-[#eff1f8] p-4">
            <span className="text-[#7c869c] block font-medium">Secteur :</span>
            <span className="font-bold text-[#1e2538] text-sm mt-0.5 block">{entreprise.secteur}</span>
          </div>
          <div className="rounded-2xl bg-[#fafbfe] border border-[#eff1f8] p-4">
            <span className="text-[#7c869c] block font-medium">Localisation du siège :</span>
            <span className="font-bold text-[#1e2538] text-sm mt-0.5 block">{entreprise.ville}, {entreprise.pays}</span>
          </div>
          <div className="rounded-2xl bg-[#fafbfe] border border-[#eff1f8] p-4">
            <span className="text-[#7c869c] block font-medium">Offres actives actuellement :</span>
            <span className="font-bold text-[#594be0] text-sm mt-0.5 block">{activeJobs.length} offre(s)</span>
          </div>
        </div>
      </div>

      {/* 3. FORMULAIRE DE MODIFICATION */}
      <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#f0f2f7] pb-4">
          <div>
            <h2 className="text-base font-extrabold text-[#171f33] flex items-center gap-2">
              <User size={18} className="text-[#594be0]" /> Modifier vos informations professionnelles
            </h2>
            <p className="mt-0.5 text-xs text-[#7e879c]">
              Ces informations sont visibles par les candidats lors des échanges et sur les offres.
            </p>
          </div>
        </div>

        {saveSuccess && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[#edf9f3] p-4 text-xs font-bold text-[#248e56] border border-[#c6ecd5] animate-in fade-in">
            <CheckCircle2 size={17} />
            Vos informations de profil Recruteur ont été enregistrées avec succès !
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
              <label className="block font-bold text-[#353e54] mb-1.5">Adresse e-mail professionnelle *</label>
              <input
                type="email"
                value={email ?? ''}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-2xl border border-[#dde1ed] bg-white px-4 py-2.5 text-xs font-semibold text-[#1f283d] outline-none focus:border-[#594be0] focus:ring-2 focus:ring-[#594be0]/20"
              />
            </div>
            <div>
              <label className="block font-bold text-[#353e54] mb-1.5">Téléphone direct</label>
              <input
                type="text"
                value={telephone ?? ''}
                onChange={(e) => setTelephone(e.target.value)}
                className="w-full rounded-2xl border border-[#dde1ed] bg-white px-4 py-2.5 text-xs font-semibold text-[#1f283d] outline-none focus:border-[#594be0] focus:ring-2 focus:ring-[#594be0]/20"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#353e54] mb-1.5">Titre professionnel / Fonction RH</label>
            <input
              type="text"
              value={titre ?? ''}
              onChange={(e) => setTitre(e.target.value)}
              className="w-full rounded-2xl border border-[#dde1ed] bg-white px-4 py-2.5 text-xs font-semibold text-[#1f283d] outline-none focus:border-[#594be0] focus:ring-2 focus:ring-[#594be0]/20"
            />
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-2xl bg-[#594be0] px-6 py-3 text-xs font-bold text-white shadow-md shadow-[#594be0]/25 hover:bg-[#4739d2] transition disabled:opacity-50"
            >
              <Save size={15} />
              {isSaving ? 'Enregistrement...' : 'Enregistrer mon profil recruteur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

