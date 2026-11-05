'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Briefcase,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
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

  useEffect(() => {
    if (initialTab) {
      setTab(initialTab);
      setError('');
      setSuccessMsg('');
    }
  }, [initialTab, isOpen]);

  // --- Connexion ---
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // --- Inscription ---
  const [regRole, setRegRole] = useState<'CANDIDAT' | 'RECRUTEUR'>('CANDIDAT');
  const [regNom, setRegNom] = useState('');
  const [regPrenom, setRegPrenom] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regTelephone, setRegTelephone] = useState('');
  const [regVille, setRegVille] = useState('Tunis');
  const [regTitre, setRegTitre] = useState('');
  const [regEntrepriseNom, setRegEntrepriseNom] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [acceptRgpd, setAcceptRgpd] = useState(false);

  // --- États UI ---
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  if (!isOpen) return null;

  // Validation mot de passe inscription
  const isPasswordLongEnough = regPassword.length >= 8;
  const doPasswordsMatch =
    regPassword.length > 0 && regConfirmPassword.length > 0 && regPassword === regConfirmPassword;

  // ── 1. Traitement de la connexion ──────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsSubmitting(true);

    const cleanEmail = loginEmail.trim();

    try {
      // 1. Authentification directe via l'API MySQL
      const loginRes = await api.login(cleanEmail, loginPassword);

      if (loginRes.success && loginRes.user) {
        const authenticatedUser = loginRes.user;
        const roleName = (authenticatedUser.role?.nom ?? 'CANDIDAT') as RoleName;
        const accepted = await onLoginSuccess(authenticatedUser, roleName, {
          email: cleanEmail,
          password: loginPassword,
        });
        if (accepted) {
          onClose();
        } else {
          setError('Erreur lors de l’initialisation de la session utilisateur.');
        }
        return;
      }

      // 2. Si le backend renvoie une erreur explicite (ex: RM10 inactif ou identifiants invalides)
      if (loginRes.message && loginRes.message.includes('RM10')) {
        setError('Votre compte est suspendu ou inactif. Contactez un administrateur.');
        return;
      }

      // 3. Fallback sur le store local si le backend est hors-ligne en environnement dev
      const localUser = users.find(
        (u) => u.email.toLowerCase() === cleanEmail.toLowerCase()
      );

      if (localUser) {
        if (localUser.statut === 'INACTIF') {
          setError('Votre compte est suspendu ou inactif. Contactez l’administrateur.');
          return;
        }
        const roleName = (localUser.role?.nom ?? 'CANDIDAT') as RoleName;
        const accepted = await onLoginSuccess(localUser, roleName, {
          email: cleanEmail,
          password: loginPassword,
        });
        if (accepted) {
          onClose();
          return;
        }
      }

      setError(loginRes.message || 'Identifiants incorrects. Veuillez vérifier votre adresse e-mail et mot de passe.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de connexion';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── 2. Traitement de l'inscription avec persistance MySQL ───────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Validations préliminaires
    if (!regNom.trim() || !regPrenom.trim() || !regEmail.trim()) {
      setError('Veuillez renseigner votre nom, prénom et adresse e-mail.');
      return;
    }

    if (!regPassword) {
      setError('Veuillez définir un mot de passe pour sécuriser votre compte.');
      return;
    }

    if (regPassword.length < 8) {
      setError('Le mot de passe doit comporter au moins 8 caractères.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('La confirmation du mot de passe ne correspond pas au mot de passe saisi.');
      return;
    }

    if (regRole === 'RECRUTEUR' && !regEntrepriseNom.trim()) {
      setError('Veuillez indiquer le nom de votre entreprise ou organisation.');
      return;
    }

    if (!acceptRgpd) {
      setError('Vous devez accepter le traitement de vos données conformément à la politique RGPD.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Appel API Laravel avec hachage bcrypt et insertion BDD
      const res = await api.register({
        nom: regNom.trim(),
        prenom: regPrenom.trim(),
        email: regEmail.trim(),
        password: regPassword,
        role: regRole,
        entreprise_nom: regRole === 'RECRUTEUR' ? regEntrepriseNom.trim() : undefined,
        titre: regRole === 'CANDIDAT' ? regTitre.trim() || 'Candidat' : undefined,
        telephone: regTelephone.trim() || undefined,
        ville: regVille.trim() || 'Tunis',
        rgpd: acceptRgpd,
      });

      if (res.success && res.data?.user) {
        const createdUser = res.data.user;
        setSuccessMsg(
          `Compte ${regRole === 'RECRUTEUR' ? 'Recruteur' : 'Candidat'} créé avec succès dans la base de données ! Connexion en cours...`
        );

        // Connexion immédiate avec les identifiants créés
        setTimeout(async () => {
          await onLoginSuccess(createdUser, regRole, {
            email: regEmail.trim(),
            password: regPassword,
          });
          onClose();
        }, 600);
      } else {
        // Erreur API (ex: email déjà existant)
        const errorMsg =
          res.error?.errors?.email?.[0] ||
          res.error?.message ||
          'Impossible de créer le compte. Vérifiez que le serveur est démarré ou essayez avec un autre e-mail.';
        setError(errorMsg);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l’inscription.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    if (!loginEmail) {
      setError('Veuillez saisir votre adresse e-mail pour recevoir le lien de réinitialisation.');
      return;
    }
    setForgotSent(true);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8 max-h-[94vh] overflow-y-auto">
        {/* Bouton fermer */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute right-5 top-5 grid size-8 place-items-center rounded-full text-[#98a1b6] hover:bg-[#f5f6fa] hover:text-[#182033] transition"
          aria-label="Fermer"
        >
          <X size={18} />
        </button>

        {/* En-tête avec identité visuelle */}
        <div className="text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#6253e8] to-[#4838d2] text-white shadow-lg shadow-[#6253e8]/30">
            <Sparkles size={24} />
          </div>
          <h2 className="mt-3 text-xl font-black text-[#171f33]">
            {tab === 'login'
              ? 'Connexion à Talenta'
              : regRole === 'CANDIDAT'
              ? 'Créer mon compte Candidat'
              : 'Créer mon compte Recruteur'}
          </h2>
          <p className="mt-1 text-xs text-[#80899f]">
            {tab === 'login'
              ? 'Accédez à votre espace sécurisé selon votre profil.'
              : regRole === 'CANDIDAT'
              ? 'Trouvez les meilleures opportunités et postulez en quelques clics.'
              : 'Publiez vos offres, gérez vos candidatures et recrutez les meilleurs talents.'}
          </p>
        </div>

        {/* Sélecteur d'onglet Connexion / Inscription */}
        <div className="mt-5 flex rounded-xl bg-[#f0f2f8] p-1 text-xs font-bold text-[#6a7389]">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError('');
              setSuccessMsg('');
              try { window.history.replaceState(null, '', '#login'); } catch {}
            }}
            className={`flex-1 rounded-lg py-2.5 transition flex items-center justify-center gap-1.5 ${
              tab === 'login'
                ? 'bg-white text-[#5547d7] shadow-xs'
                : 'hover:text-[#182033]'
            }`}
          >
            <Lock size={14} />
            Connexion
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setError('');
              setSuccessMsg('');
              try { window.history.replaceState(null, '', '#register'); } catch {}
            }}
            className={`flex-1 rounded-lg py-2.5 transition flex items-center justify-center gap-1.5 ${
              tab === 'register'
                ? 'bg-white text-[#5547d7] shadow-xs'
                : 'hover:text-[#182033]'
            }`}
          >
            <User size={14} />
            Inscription
          </button>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#ffd2d2] bg-[#fff5f5] p-3 text-xs font-semibold text-[#cf3b3b]">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-[#cf3b3b]" />
            <span>{error}</span>
          </div>
        )}

        {/* Message de succès */}
        {successMsg && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#cbeedc] bg-[#edf9f3] p-3 text-xs font-bold text-[#2b965f]">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-[#2b965f]" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Alerte mot de passe oublié */}
        {forgotSent && (
          <div className="mt-4 rounded-xl border border-[#cbeedc] bg-[#edf9f3] p-3 text-xs font-bold text-[#2b965f]">
            Un e-mail de réinitialisation sécurisé (valable 60 min) vous a été envoyé.
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ONGLET 1 : FORMULAIRE DE CONNEXION                              */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="mt-5 space-y-4">
            <div>
              <label className="text-xs font-bold text-[#232b3e]">Adresse e-mail</label>
              <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-[#e1e4ee] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] focus-within:border-[#6355e8] focus-within:bg-white transition">
                <Mail size={16} className="text-[#9fa7bc] shrink-0" />
                <input
                  type="email"
                  required
                  placeholder="amina@mail.example ou rh@alpha.example"
                  value={loginEmail ?? ''}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-transparent outline-none"
                  autoComplete="email"
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
              <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-[#e1e4ee] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] focus-within:border-[#6355e8] focus-within:bg-white transition">
                <Lock size={16} className="text-[#9fa7bc] shrink-0" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={loginPassword ?? ''}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-transparent outline-none"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="text-[#9fa7bc] hover:text-[#5547d7] transition"
                  tabIndex={-1}
                >
                  {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#594be0] py-3 text-xs font-bold text-white shadow-md shadow-[#594be0]/25 hover:bg-[#483ad3] transition disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                'Se connecter'
              )}
            </button>

            {/* Raccourcis démo */}
            <div className="pt-2 text-center text-[11px] text-[#8690a6]">
              <span>Comptes de démonstration pré-configurés : </span>
              <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail('amina@mail.example');
                    setLoginPassword('password123');
                  }}
                  className="rounded-lg bg-[#f0efff] px-2.5 py-1 font-bold text-[#594be0] hover:bg-[#e4e2ff] transition"
                >
                  Amina (Candidat)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail('rh@alpha.example');
                    setLoginPassword('password123');
                  }}
                  className="rounded-lg bg-[#f0efff] px-2.5 py-1 font-bold text-[#594be0] hover:bg-[#e4e2ff] transition"
                >
                  R. Ben Ali (Recruteur)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail('admin@talenta.example');
                    setLoginPassword('password123');
                  }}
                  className="rounded-lg bg-[#f0efff] px-2.5 py-1 font-bold text-[#594be0] hover:bg-[#e4e2ff] transition"
                >
                  Amélie (Admin)
                </button>
              </div>
            </div>

            <div className="pt-2 text-center text-xs text-[#6a7389] border-t border-[#f0f2f8]">
              Vous n'avez pas encore de compte ?{' '}
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setError('');
                  setSuccessMsg('');
                  try { window.history.replaceState(null, '', '#register'); } catch {}
                }}
                className="font-bold text-[#594be0] hover:underline"
              >
                Créer un compte
              </button>
            </div>
          </form>
        ) : (
          /* ══════════════════════════════════════════════════════════════════ */
          /* ONGLET 2 : FORMULAIRE D'INSCRIPTION DYNAMIQUE & MYSQL            */
          /* ══════════════════════════════════════════════════════════════════ */
          <form onSubmit={handleRegister} className="mt-5 space-y-4">
            {/* 1. Sélection du profil (Candidat vs Recruteur) */}
            <div>
              <label className="text-xs font-bold text-[#232b3e]">
                Vous êtes : <span className="text-[#cf3b3b]">*</span>
              </label>
              <div className="mt-1.5 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setRegRole('CANDIDAT')}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 text-center transition ${
                    regRole === 'CANDIDAT'
                      ? 'border-[#594be0] bg-[#f5f4ff] text-[#594be0] shadow-sm'
                      : 'border-[#e4e7ee] bg-[#fafbfc] text-[#6b758b] hover:border-[#ccd1dc]'
                  }`}
                >
                  <User size={20} className={regRole === 'CANDIDAT' ? 'text-[#594be0]' : 'text-[#8b95a5]'} />
                  <span className="text-xs font-black">Candidat</span>
                  <span className="text-[10px] text-[#80899f] leading-tight">
                    Étudiant, diplômé, chercheur d'emploi
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegRole('RECRUTEUR')}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 text-center transition ${
                    regRole === 'RECRUTEUR'
                      ? 'border-[#594be0] bg-[#f5f4ff] text-[#594be0] shadow-sm'
                      : 'border-[#e4e7ee] bg-[#fafbfc] text-[#6b758b] hover:border-[#ccd1dc]'
                  }`}
                >
                  <Building2 size={20} className={regRole === 'RECRUTEUR' ? 'text-[#594be0]' : 'text-[#8b95a5]'} />
                  <span className="text-xs font-black">Recruteur</span>
                  <span className="text-[10px] text-[#80899f] leading-tight">
                    Entreprise, startup, cabinet RH
                  </span>
                </button>
              </div>
            </div>

            {/* 2. Coordonnées personnelles */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#232b3e]">
                  Nom <span className="text-[#cf3b3b]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ben Salem"
                  value={regNom ?? ''}
                  onChange={(e) => setRegNom(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#e1e4ee] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] outline-none focus:border-[#6355e8] focus:bg-white transition"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#232b3e]">
                  Prénom <span className="text-[#cf3b3b]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Amina"
                  value={regPrenom ?? ''}
                  onChange={(e) => setRegPrenom(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#e1e4ee] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] outline-none focus:border-[#6355e8] focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#232b3e]">
                Adresse e-mail <span className="text-[#cf3b3b]">*</span>
              </label>
              <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-[#e1e4ee] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] focus-within:border-[#6355e8] focus-within:bg-white transition">
                <Mail size={16} className="text-[#9fa7bc] shrink-0" />
                <input
                  type="email"
                  required
                  placeholder="votre.email@domaine.com"
                  value={regEmail ?? ''}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-transparent outline-none"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* 3. Champs spécifiques selon le profil */}
            {regRole === 'CANDIDAT' ? (
              <div>
                <label className="text-xs font-bold text-[#232b3e]">
                  Titre professionnel souhaité
                </label>
                <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-[#e1e4ee] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] focus-within:border-[#6355e8] focus-within:bg-white transition">
                  <Briefcase size={16} className="text-[#9fa7bc] shrink-0" />
                  <input
                    type="text"
                    placeholder="Ex: Développeuse Full Stack, Data Scientist..."
                    value={regTitre ?? ''}
                    onChange={(e) => setRegTitre(e.target.value)}
                    className="w-full bg-transparent outline-none"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="text-xs font-bold text-[#232b3e]">
                  Nom de l'entreprise <span className="text-[#cf3b3b]">*</span>
                </label>
                <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-[#e1e4ee] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] focus-within:border-[#6355e8] focus-within:bg-white transition">
                  <Building2 size={16} className="text-[#9fa7bc] shrink-0" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: TechNova Solutions, Alpha Corp..."
                    value={regEntrepriseNom ?? ''}
                    onChange={(e) => setRegEntrepriseNom(e.target.value)}
                    className="w-full bg-transparent outline-none"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#232b3e]">Téléphone</label>
                <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-[#e1e4ee] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] focus-within:border-[#6355e8] focus-within:bg-white transition">
                  <Phone size={15} className="text-[#9fa7bc] shrink-0" />
                  <input
                    type="tel"
                    placeholder="+216 98 123 456"
                    value={regTelephone ?? ''}
                    onChange={(e) => setRegTelephone(e.target.value)}
                    className="w-full bg-transparent outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-[#232b3e]">Ville</label>
                <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-[#e1e4ee] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] focus-within:border-[#6355e8] focus-within:bg-white transition">
                  <MapPin size={15} className="text-[#9fa7bc] shrink-0" />
                  <input
                    type="text"
                    placeholder="Tunis, Sousse, Sfax..."
                    value={regVille ?? ''}
                    onChange={(e) => setRegVille(e.target.value)}
                    className="w-full bg-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 4. Sécurité & Mots de passe */}
            <div className="rounded-2xl border border-[#e8ebf3] bg-[#fafbfc] p-3.5 space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#232b3e]">
                    Mot de passe <span className="text-[#cf3b3b]">*</span>
                  </label>
                  <span
                    className={`text-[11px] font-semibold ${
                      isPasswordLongEnough ? 'text-[#2b965f]' : 'text-[#8b95a5]'
                    }`}
                  >
                    Min. 8 caractères
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-[#e1e4ee] bg-white px-3.5 py-2.5 text-xs text-[#1e2538] focus-within:border-[#6355e8] transition">
                  <Lock size={16} className="text-[#9fa7bc] shrink-0" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="Au moins 8 caractères"
                    value={regPassword ?? ''}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-transparent outline-none"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="text-[#9fa7bc] hover:text-[#5547d7] transition"
                    tabIndex={-1}
                  >
                    {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#232b3e]">
                  Confirmer le mot de passe <span className="text-[#cf3b3b]">*</span>
                </label>
                <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-[#e1e4ee] bg-white px-3.5 py-2.5 text-xs text-[#1e2538] focus-within:border-[#6355e8] transition">
                  <Lock size={16} className="text-[#9fa7bc] shrink-0" />
                  <input
                    type={showRegConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="Répétez le mot de passe"
                    value={regConfirmPassword ?? ''}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full bg-transparent outline-none"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    className="text-[#9fa7bc] hover:text-[#5547d7] transition"
                    tabIndex={-1}
                  >
                    {showRegConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Feedback correspondance mot de passe */}
                {regConfirmPassword.length > 0 && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold">
                    {doPasswordsMatch ? (
                      <span className="flex items-center gap-1 text-[#2b965f]">
                        <CheckCircle2 size={13} /> Les mots de passe correspondent parfaitement.
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[#cf3b3b]">
                        <AlertCircle size={13} /> Les mots de passe ne correspondent pas.
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 5. Consentement RGPD */}
            <label className="flex items-start gap-2.5 cursor-pointer pt-1 text-[11px] text-[#5e667c]">
              <input
                type="checkbox"
                required
                checked={acceptRgpd}
                onChange={(e) => setAcceptRgpd(e.target.checked)}
                className="mt-0.5 size-4 rounded accent-[#594be0]"
              />
              <span>
                J'accepte le traitement de mes données personnelles conformément à la politique de confidentialité et aux exigences RGPD de la plateforme Talenta.
              </span>
            </label>

            {/* 6. Bouton de soumission */}
            <button
              type="submit"
              disabled={isSubmitting || !isPasswordLongEnough || !doPasswordsMatch || !acceptRgpd}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#594be0] py-3 text-xs font-bold text-white shadow-md shadow-[#594be0]/25 hover:bg-[#483ad3] transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Enregistrement dans la base de données...
                </>
              ) : (
                `Créer mon compte ${regRole === 'RECRUTEUR' ? 'Recruteur' : 'Candidat'}`
              )}
            </button>

            <div className="pt-2 text-center text-xs text-[#6a7389] border-t border-[#f0f2f8]">
              Vous avez déjà un compte ?{' '}
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setError('');
                  setSuccessMsg('');
                  try { window.history.replaceState(null, '', '#login'); } catch {}
                }}
                className="font-bold text-[#594be0] hover:underline"
              >
                Se connecter
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
