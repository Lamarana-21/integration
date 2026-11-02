'use client';

import React, { useState } from 'react';
import { Lock, Mail, Sparkles, User, X } from 'lucide-react';
import { RoleName, User as UserType } from '@/lib/types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
  onLoginSuccess: (
    user: UserType,
    role: RoleName,
    credentials?: { email: string; password: string }
  ) => boolean | Promise<boolean>;
  users: UserType[];
}

export function AuthModal({
  isOpen,
  onClose,
  initialTab = 'login',
  onLoginSuccess,
  users,
}: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [acceptRgpd, setAcceptRgpd] = useState(false);
  const [error, setError] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const targetUser = users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (!targetUser) {
      setError('Identifiants incorrects. Veuillez vérifier votre adresse e-mail.');
      return;
    }

    // RM10 : Compte INACTIF bloqué
    if (targetUser.statut === 'INACTIF') {
      setError('Votre compte est suspendu ou inactif (RM10). Contactez l’administrateur.');
      return;
    }

    const roleName = targetUser.role?.nom ?? 'CANDIDAT';
    const accepted = await onLoginSuccess(targetUser, roleName, {
      email: email.trim(),
      password,
    });
    if (accepted) {
      onClose();
    } else {
      setError('Connexion au serveur impossible. Vérifiez que Laravel est démarré.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nom || !prenom || !email || !password) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit comporter au moins 8 caractères.');
      return;
    }

    if (!acceptRgpd) {
      setError('Vous devez accepter le traitement de vos données personnelles.');
      return;
    }

    const newUser: UserType = {
      id: `u-${Date.now()}`,
      nom,
      prenom,
      email,
      statut: 'ACTIF',
      role: { id: 'r-cand', nom: 'CANDIDAT', description: 'Candidat' },
    };

    void onLoginSuccess(newUser, 'CANDIDAT');
    onClose();
  };

  const handleForgotPassword = () => {
    if (!email) {
      setError('Veuillez saisir votre adresse e-mail pour recevoir le lien de réinitialisation.');
      return;
    }
    setForgotSent(true);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 grid size-8 place-items-center rounded-full text-[#98a1b6] hover:bg-[#f5f6fa]"
        >
          <X size={18} />
        </button>

        {/* Brand */}
        <div className="text-center">
          <div className="mx-auto grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#6253e8] to-[#4838d2] text-white shadow-md shadow-[#6253e8]/25">
            <Sparkles size={22} />
          </div>
          <h2 className="mt-3 text-xl font-black text-[#171f33]">
            {tab === 'login' ? 'Connexion à Talenta' : 'Créer mon compte Candidat'}
          </h2>
          <p className="mt-1 text-xs text-[#80899f]">
            {tab === 'login'
              ? 'Accédez à votre espace sécurisé selon votre profil.'
              : 'Postulez en un clic et suivez le statut de vos candidatures.'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="mt-6 flex rounded-xl bg-[#f0f2f8] p-1 text-xs font-bold text-[#6a7389]">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError('');
            }}
            className={`flex-1 rounded-lg py-2 transition ${
              tab === 'login' ? 'bg-white text-[#5547d7] shadow-xs' : 'hover:text-[#182033]'
            }`}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setError('');
            }}
            className={`flex-1 rounded-lg py-2 transition ${
              tab === 'register' ? 'bg-white text-[#5547d7] shadow-xs' : 'hover:text-[#182033]'
            }`}
          >
            Inscription
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-[#ffd2d2] bg-[#fff5f5] p-3 text-xs font-bold text-[#cf3b3b]">
            {error}
          </div>
        )}

        {forgotSent && (
          <div className="mt-4 rounded-xl border border-[#cbeedc] bg-[#edf9f3] p-3 text-xs font-bold text-[#2b965f]">
            Un e-mail de réinitialisation sécurisé (valable 60 min) vous a été envoyé.
          </div>
        )}

        {/* Connexion Form */}
        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-[#232b3e]">E-mail</label>
              <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-[#e1e4ee] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] focus-within:border-[#6355e8]">
                <Mail size={16} className="text-[#9fa7bc]" />
                <input
                  type="email"
                  required
                  placeholder="amina@mail.example ou rh@alpha.example"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#232b3e]">Mot de passe</label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] font-bold text-[#5c4ce0] hover:underline"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-[#e1e4ee] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] focus-within:border-[#6355e8]">
                <Lock size={16} className="text-[#9fa7bc]" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-2xl bg-[#594be0] py-3 text-xs font-bold text-white shadow-md hover:bg-[#483ad3] transition"
            >
              Se connecter
            </button>

            {/* Quick Demo Shortcuts */}
            <div className="pt-2 text-center text-[11px] text-[#8690a6]">
              <span>Comptes de démonstration : </span>
              <div className="mt-1.5 flex flex-wrap justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('amina@mail.example');
                    setPassword('password123');
                  }}
                  className="rounded-md bg-[#f0efff] px-2 py-0.5 font-bold text-[#594be0]"
                >
                  Amina (Candidat)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('rh@alpha.example');
                    setPassword('password123');
                  }}
                  className="rounded-md bg-[#f0efff] px-2 py-0.5 font-bold text-[#594be0]"
                >
                  R. Ben Ali (Recruteur)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@talenta.example');
                    setPassword('password123');
                  }}
                  className="rounded-md bg-[#f0efff] px-2 py-0.5 font-bold text-[#594be0]"
                >
                  Amélie (Admin)
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Inscription Form */
          <form onSubmit={handleRegister} className="mt-6 space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#232b3e]">Nom</label>
                <input
                  type="text"
                  required
                  placeholder="Ben Salem"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#e1e4ee] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] outline-none focus:border-[#6355e8]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#232b3e]">Prénom</label>
                <input
                  type="text"
                  required
                  placeholder="Amina"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#e1e4ee] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] outline-none focus:border-[#6355e8]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#232b3e]">E-mail</label>
              <input
                type="email"
                required
                placeholder="votre.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#e1e4ee] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] outline-none focus:border-[#6355e8]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#232b3e]">
                Mot de passe (8 caractères min.)
              </label>
              <input
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#e1e4ee] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] outline-none focus:border-[#6355e8]"
              />
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer pt-1 text-[11px] text-[#5e667c]">
              <input
                type="checkbox"
                checked={acceptRgpd}
                onChange={(e) => setAcceptRgpd(e.target.checked)}
                className="mt-0.5 size-4 rounded accent-[#594be0]"
              />
              <span>
                J'accepte le traitement de mes données personnelles conformément à la politique de confidentialité de Talenta.
              </span>
            </label>

            <button
              type="submit"
              className="mt-2 w-full rounded-2xl bg-[#594be0] py-3 text-xs font-bold text-white shadow-md hover:bg-[#483ad3] transition"
            >
              Créer mon compte Candidat
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
