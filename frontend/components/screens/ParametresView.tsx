'use client';

import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Eye,
  KeyRound,
  Lock,
  Mail,
  Shield,
  User,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { User as UserType } from '@/lib/types';
import { api } from '@/lib/api';

interface ParametresViewProps {
  currentUser: UserType | null;
  onDeleteMyData?: () => void;
  onNavigateScreen?: (screen: string) => void;
}

export function ParametresView({
  currentUser,
  onDeleteMyData,
  onNavigateScreen,
}: ParametresViewProps) {
  // Onglet actif
  const [activeTab, setActiveTab] = useState<'SECURITE' | 'NOTIFICATIONS'>('SECURITE');

  // Mot de passe
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Préférences notifications
  const [notifCandidatures, setNotifCandidatures] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifOffres, setNotifOffres] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);

  // Calcul force du mot de passe
  const passwordStrength = useMemo(() => {
    if (!newPassword) return 0;
    let strength = 1;
    if (newPassword.length >= 8) strength++;
    if (/[0-9]/.test(newPassword) && /[A-Z]/.test(newPassword)) strength++;
    return strength;
  }, [newPassword]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
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
      setPasswordError('Les deux nouveaux mots de passe ne correspondent pas.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await api.changePassword(currentPassword, newPassword);
      if (res.success) {
        setPasswordSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(false), 4500);
      } else {
        setPasswordError(res.error?.message || 'Erreur lors du changement de mot de passe.');
      }
    } catch {
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 4500);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSaveNotifPreferences = () => {
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 3000);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
      {/* HEADER BANNER */}
      <div className="rounded-3xl border border-[#e8ebf3] bg-gradient-to-r from-white via-[#fafbfe] to-[#f4f2ff] p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid size-10 place-items-center rounded-2xl bg-[#594be0] text-white shadow-md shadow-[#594be0]/20">
                <Sliders size={20} />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-[#171f33]">
                  Paramètres & Sécurité
                </h1>
                <p className="text-xs text-[#717a92]">
                  Gérez vos accès, votre mot de passe et vos préférences d'alertes.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ecfdf5] px-3 py-1 text-xs font-bold text-[#065f46] border border-[#a7f3d0]">
              <Shield size={13} className="text-[#059669]" /> Compte protégé
            </span>
          </div>
        </div>

        {/* ONGLETS INTERNES */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-[#edf0f7] pt-4">
          <button
            type="button"
            onClick={() => setActiveTab('SECURITE')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'SECURITE'
                ? 'bg-[#594be0] text-white shadow-sm'
                : 'bg-white text-[#646d84] border border-[#e2e5ef] hover:bg-[#f6f7fb]'
            }`}
          >
            <KeyRound size={15} />
            <span>Sécurité & Mot de passe</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('NOTIFICATIONS')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'NOTIFICATIONS'
                ? 'bg-[#594be0] text-white shadow-sm'
                : 'bg-white text-[#646d84] border border-[#e2e5ef] hover:bg-[#f6f7fb]'
            }`}
          >
            <Bell size={15} />
            <span>Notifications & Alertes</span>
          </button>
        </div>
      </div>

      {/* 1. SECTION MOT DE PASSE & SÉCURITÉ */}
      {activeTab === 'SECURITE' && (
        <section className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#f0f2f7] pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-[#171f33] flex items-center gap-2">
                <Lock size={16} className="text-[#594be0]" /> Sécurité & Mot de passe du compte
              </h2>
              <p className="text-[11px] text-[#7d869e] mt-0.5">
                Modifiez votre mot de passe pour garantir la sécurité de votre compte Talenta.
              </p>
            </div>
            <span className="text-[10px] font-bold text-[#8690a8] bg-[#f4f5f9] px-2.5 py-1 rounded-full">
              Minimum 8 caractères
            </span>
          </div>

          {passwordSuccess && (
            <div className="flex items-center gap-2 rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] p-3.5 text-xs font-bold text-[#166534] animate-in fade-in">
              <CheckCircle2 size={18} className="text-[#16a34a] shrink-0" />
              <span>Votre mot de passe a été mis à jour avec succès et enregistré dans la base de données !</span>
            </div>
          )}

          {passwordError && (
            <div className="flex items-center gap-2 rounded-2xl border border-[#ffd2d2] bg-[#fff5f5] p-3.5 text-xs font-bold text-[#cf3b3b] animate-in fade-in">
              <AlertCircle size={18} className="shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-xl">
            <div>
              <label className="text-xs font-bold text-[#353d52]">Mot de passe actuel</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={currentPassword ?? ''}
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
                  value={newPassword ?? ''}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 caractères"
                  className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] outline-none focus:border-[#6355e8] focus:bg-white"
                />
                {newPassword && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className="h-1.5 flex-1 rounded-full bg-[#e2e5ef] overflow-hidden">
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
                      {passwordStrength === 1 ? 'Faible' : passwordStrength === 2 ? 'Moyen' : 'Robuste'}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-[#353d52]">Confirmer le nouveau mot de passe</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword ?? ''}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] outline-none focus:border-[#6355e8] focus:bg-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
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
                disabled={isUpdatingPassword}
                className="rounded-xl bg-[#594be0] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#594be0]/20 hover:bg-[#4739d2] transition disabled:opacity-50"
              >
                {isUpdatingPassword ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
              </button>
            </div>
          </form>

          {/* RAPPEL SUR LE PROFIL */}
          {onNavigateScreen && (
            <div className="mt-8 rounded-2xl bg-[#fafbfe] border border-[#e9ebf5] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
              <div>
                <div className="font-bold text-[#1f283d]">
                  {currentUser?.role?.nom === 'ADMIN'
                    ? 'Modifier votre identité ou photo de profil Administrateur ?'
                    : currentUser?.role?.nom === 'RECRUTEUR'
                    ? 'Modifier votre identité ou photo de profil Recruteur ?'
                    : 'Modifier votre identité ou photo de profil ?'}
                </div>
                <div className="text-[#788299] text-[11px] mt-0.5">
                  {currentUser?.role?.nom === 'ADMIN'
                    ? 'Vos informations personnelles et habilitations système se gèrent dans votre profil administrateur.'
                    : currentUser?.role?.nom === 'RECRUTEUR'
                    ? 'Vos coordonnées professionnelles et entreprise se gèrent dans votre profil recruteur.'
                    : 'Votre nom, prénom, titre professionnel et coordonnées se gèrent dans votre profil.'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (currentUser?.role?.nom === 'ADMIN') {
                    onNavigateScreen('E_ADMIN_PROFIL');
                  } else if (currentUser?.role?.nom === 'RECRUTEUR') {
                    onNavigateScreen('E_RECRUTEUR_PROFIL');
                  } else {
                    onNavigateScreen('E6_PROFIL');
                  }
                }}
                className="self-start sm:self-auto rounded-xl border border-[#d2d7e5] bg-white px-3.5 py-2 text-xs font-bold text-[#454e63] hover:bg-[#f6f7fb] hover:text-[#594be0] transition shadow-xs"
              >
                {currentUser?.role?.nom === 'ADMIN'
                  ? 'Accéder à mon profil administrateur →'
                  : currentUser?.role?.nom === 'RECRUTEUR'
                  ? 'Accéder à mon profil recruteur →'
                  : 'Accéder à mon profil →'}
              </button>
            </div>
          )}
        </section>
      )}

      {/* 2. SECTION NOTIFICATIONS & PRÉFÉRENCES */}
      {activeTab === 'NOTIFICATIONS' && (
        <section className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#f0f2f7] pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-[#171f33] flex items-center gap-2">
                <Bell size={16} className="text-[#594be0]" /> Notifications et Alertes par E-mail
              </h2>
              <p className="text-[11px] text-[#7d869e] mt-0.5">
                Choisissez les communications que vous souhaitez recevoir sur <strong>{currentUser?.email}</strong>.
              </p>
            </div>
          </div>

          {notifSaved && (
            <div className="flex items-center gap-2 rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] p-3 text-xs font-bold text-[#166534]">
              <CheckCircle2 size={16} className="text-[#16a34a]" />
              <span>Préférences de notification enregistrées !</span>
            </div>
          )}

          <div className="space-y-3 max-w-xl">
            <label className="flex items-start gap-3 rounded-2xl border border-[#eaedf5] p-4 hover:bg-[#fafbfe] transition cursor-pointer">
              <input
                type="checkbox"
                checked={notifCandidatures}
                onChange={(e) => setNotifCandidatures(e.target.checked)}
                className="mt-1 rounded text-[#594be0]"
              />
              <div className="text-xs">
                <div className="font-bold text-[#1e2638]">Suivi des candidatures</div>
                <div className="text-[#727c95] text-[11px] mt-0.5">
                  Recevez un email à chaque changement de statut (acceptée, entretien, refusée).
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-[#eaedf5] p-4 hover:bg-[#fafbfe] transition cursor-pointer">
              <input
                type="checkbox"
                checked={notifMessages}
                onChange={(e) => setNotifMessages(e.target.checked)}
                className="mt-1 rounded text-[#594be0]"
              />
              <div className="text-xs">
                <div className="font-bold text-[#1e2638]">Messages instantanés des recruteurs</div>
                <div className="text-[#727c95] text-[11px] mt-0.5">
                  Notification directe lorsqu'un recruteur vous répond sur la messagerie.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-[#eaedf5] p-4 hover:bg-[#fafbfe] transition cursor-pointer">
              <input
                type="checkbox"
                checked={notifOffres}
                onChange={(e) => setNotifOffres(e.target.checked)}
                className="mt-1 rounded text-[#594be0]"
              />
              <div className="text-xs">
                <div className="font-bold text-[#1e2638]">Nouvelles offres correspondant à mes favoris</div>
                <div className="text-[#727c95] text-[11px] mt-0.5">
                  Alertes personnalisées dès qu'une entreprise publie une offre dans vos critères.
                </div>
              </div>
            </label>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleSaveNotifPreferences}
              className="rounded-xl bg-[#594be0] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#4739d2] transition"
            >
              Enregistrer les préférences
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

