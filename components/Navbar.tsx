'use client';

import React from 'react';
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  FileText,
  LayoutDashboard,
  LogOut,
  Mail,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserCheck2,
  Users,
} from 'lucide-react';
import { RoleName, User } from '@/lib/types';

interface NavbarProps {
  currentRole: RoleName;
  onRoleChange: (role: RoleName) => void;
  activeScreen: string;
  onNavigate: (screen: string) => void;
  currentUser: User | null;
  onOpenAuth: (tab: 'login' | 'register') => void;
  onLogout: () => void;
  backendOnline: boolean | null;
}

export function Navbar({
  currentRole,
  onRoleChange,
  activeScreen,
  onNavigate,
  currentUser,
  onOpenAuth,
  onLogout,
  backendOnline,
}: NavbarProps) {
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#e8ebf3] bg-white/90 backdrop-blur-md">
      {/* Top Banner : Rôles Switcher & Backend Health */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#f1f3f8] bg-[#fafbfc] px-4 py-2 text-xs sm:px-8">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#6a7387]">Rôle actif :</span>
          <div className="inline-flex rounded-lg bg-[#eeeff6] p-0.5">
            {(['VISITEUR', 'CANDIDAT', 'RECRUTEUR', 'ADMIN'] as RoleName[]).map((r) => (
              <button
                key={r}
                onClick={() => onRoleChange(r)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                  currentRole === r
                    ? 'bg-white text-[#5547d7] shadow-sm'
                    : 'text-[#6f788e] hover:text-[#212738]'
                }`}
              >
                {r === 'VISITEUR' && 'Visiteur'}
                {r === 'CANDIDAT' && 'Candidat (Amina)'}
                {r === 'RECRUTEUR' && 'Recruteur (Alpha)'}
                {r === 'ADMIN' && 'Admin (Amélie)'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 shadow-xs border border-[#e8ecf4]">
            <span
              className={`size-2 rounded-full ${
                backendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-400'
              }`}
            />
            <span className="text-[11px] font-medium text-[#5c6479]">
              Backend Laravel (API REST & IA)
            </span>
          </div>

          <span className="hidden text-[11px] text-[#97a0b5] md:inline">
            Compte rendu complet · Modules 1–11
          </span>
        </div>
      </div>

      {/* Main Bar */}
      <div className="flex h-16 items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-8">
          <button
            onClick={() => onNavigate('E1')}
            className="flex items-center gap-2.5 text-left focus:outline-none"
          >
            <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#6253e8] to-[#4838d2] text-white shadow-md shadow-[#6253e8]/25">
              <Sparkles size={19} />
            </div>
            <div>
              <div className="text-[17px] font-extrabold tracking-tight text-[#161d2d]">
                Talenta
              </div>
              <div className="text-[9px] font-bold tracking-widest text-[#949cb0] uppercase">
                Recruitment OS
              </div>
            </div>
          </button>

          {/* Nav Links according to Plan de navigation Section 5.4 */}
          <nav className="hidden items-center gap-1 lg:flex">
            {/* Visiteur & Candidat */}
            {(currentRole === 'VISITEUR' || currentRole === 'CANDIDAT') && (
              <>
                <button
                  onClick={() => onNavigate('E1')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeScreen === 'E1' || activeScreen === 'E3'
                      ? 'bg-[#efedff] text-[#5547d7]'
                      : 'text-[#666f85] hover:bg-[#f6f7fb]'
                  }`}
                >
                  Explorer les offres
                </button>
                <button
                  onClick={() => onNavigate('E11')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeScreen === 'E11'
                      ? 'bg-[#efedff] text-[#5547d7]'
                      : 'text-[#666f85] hover:bg-[#f6f7fb]'
                  }`}
                >
                  Entreprises
                </button>
              </>
            )}

            {/* Candidat */}
            {currentRole === 'CANDIDAT' && (
              <>
                <button
                  onClick={() => onNavigate('E5')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeScreen === 'E5'
                      ? 'bg-[#efedff] text-[#5547d7]'
                      : 'text-[#666f85] hover:bg-[#f6f7fb]'
                  }`}
                >
                  <FileText size={14} />
                  Mes candidatures (E5)
                </button>
                <button
                  onClick={() => onNavigate('E6')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeScreen === 'E6'
                      ? 'bg-[#efedff] text-[#5547d7]'
                      : 'text-[#666f85] hover:bg-[#f6f7fb]'
                  }`}
                >
                  <UserCheck2 size={14} />
                  Mon profil & CV (E6)
                </button>
              </>
            )}

            {/* Recruteur */}
            {currentRole === 'RECRUTEUR' && (
              <>
                <button
                  onClick={() => onNavigate('E7')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeScreen === 'E7'
                      ? 'bg-[#efedff] text-[#5547d7]'
                      : 'text-[#666f85] hover:bg-[#f6f7fb]'
                  }`}
                >
                  <LayoutDashboard size={14} />
                  Tableau de bord (E7)
                </button>
                <button
                  onClick={() => onNavigate('E8')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeScreen === 'E8'
                      ? 'bg-[#efedff] text-[#5547d7]'
                      : 'text-[#666f85] hover:bg-[#f6f7fb]'
                  }`}
                >
                  <BriefcaseBusiness size={14} />
                  Nouvelle offre (E8)
                </button>
                <button
                  onClick={() => onNavigate('E9')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeScreen === 'E9' || activeScreen === 'E10'
                      ? 'bg-[#efedff] text-[#5547d7]'
                      : 'text-[#666f85] hover:bg-[#f6f7fb]'
                  }`}
                >
                  <Users size={14} />
                  Candidatures & IA (E9/E10)
                </button>
                <button
                  onClick={() => onNavigate('E11')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeScreen === 'E11'
                      ? 'bg-[#efedff] text-[#5547d7]'
                      : 'text-[#666f85] hover:bg-[#f6f7fb]'
                  }`}
                >
                  <Building2 size={14} />
                  Entreprise (E11)
                </button>
              </>
            )}

            {/* Administrateur */}
            {currentRole === 'ADMIN' && (
              <>
                <button
                  onClick={() => onNavigate('E12')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeScreen === 'E12'
                      ? 'bg-[#efedff] text-[#5547d7]'
                      : 'text-[#666f85] hover:bg-[#f6f7fb]'
                  }`}
                >
                  <Users size={14} />
                  Utilisateurs (E12)
                </button>
                <button
                  onClick={() => onNavigate('E13')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeScreen === 'E13'
                      ? 'bg-[#efedff] text-[#5547d7]'
                      : 'text-[#666f85] hover:bg-[#f6f7fb]'
                  }`}
                >
                  <ShieldCheck size={14} />
                  Rôles & Droits (E13)
                </button>
                <button
                  onClick={() => onNavigate('E14')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeScreen === 'E14'
                      ? 'bg-[#efedff] text-[#5547d7]'
                      : 'text-[#666f85] hover:bg-[#f6f7fb]'
                  }`}
                >
                  <Building2 size={14} />
                  Entreprises & Offres (E14)
                </button>
                <button
                  onClick={() => onNavigate('E15')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeScreen === 'E15'
                      ? 'bg-[#efedff] text-[#5547d7]'
                      : 'text-[#666f85] hover:bg-[#f6f7fb]'
                  }`}
                >
                  <Mail size={14} />
                  Journal E-mails (E15)
                </button>
                <button
                  onClick={() => onNavigate('E7')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeScreen === 'E7'
                      ? 'bg-[#efedff] text-[#5547d7]'
                      : 'text-[#666f85] hover:bg-[#f6f7fb]'
                  }`}
                >
                  <LayoutDashboard size={14} />
                  Stats
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {currentRole === 'VISITEUR' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="rounded-xl border border-[#dfe3ec] px-3.5 py-2 text-xs font-bold text-[#444c60] hover:bg-[#fafbfc]"
              >
                Se connecter
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="rounded-xl bg-[#5d4ee3] px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#4f3fd3]"
              >
                S'inscrire
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate(currentRole === 'ADMIN' ? 'E15' : 'E5')}
                className="relative grid size-9 place-items-center rounded-xl border border-[#e4e7ef] text-[#6b7489] hover:bg-[#f8f9fc]"
                title="Notifications"
              >
                <Bell size={16} />
                <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-[#e85a5a]" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-[#f6f7fb]"
                >
                  <div className="grid size-8 place-items-center rounded-full bg-[#e9e6fd] text-xs font-extrabold text-[#5547d7]">
                    {currentUser?.prenom?.[0] ?? 'U'}
                    {currentUser?.nom?.[0] ?? ''}
                  </div>
                  <div className="hidden text-left sm:block">
                    <div className="text-xs font-bold text-[#1f2638]">
                      {currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Utilisateur'}
                    </div>
                    <div className="text-[10px] font-semibold text-[#8e97ac]">
                      {currentRole}
                    </div>
                  </div>
                  <ChevronDown size={14} className="text-[#9ea6bb]" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[#e8ebf3] bg-white p-2 shadow-xl z-50">
                    <div className="border-b border-[#f0f2f7] px-3 py-2">
                      <div className="text-xs font-bold text-[#1a2133]">
                        {currentUser?.prenom} {currentUser?.nom}
                      </div>
                      <div className="text-[11px] text-[#868fa4] truncate">
                        {currentUser?.email}
                      </div>
                    </div>
                    <div className="py-1">
                      {currentRole === 'CANDIDAT' && (
                        <button
                          onClick={() => {
                            onNavigate('E6');
                            setProfileOpen(false);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#515970] hover:bg-[#f6f7fc]"
                        >
                          <UserCheck size={14} />
                          Mon profil complet
                        </button>
                      )}
                      {currentRole === 'RECRUTEUR' && (
                        <button
                          onClick={() => {
                            onNavigate('E11');
                            setProfileOpen(false);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#515970] hover:bg-[#f6f7fc]"
                        >
                          <Building2 size={14} />
                          Fiche Entreprise
                        </button>
                      )}
                      <button
                        onClick={() => {
                          onLogout();
                          setProfileOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#d44848] hover:bg-[#fff5f5]"
                      >
                        <LogOut size={14} />
                        Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
