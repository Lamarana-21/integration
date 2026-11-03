'use client';

import React from 'react';
import { Bell, Building2, ChevronDown, LogOut, Sparkles, UserCheck } from 'lucide-react';
import { RoleName, User } from '@/lib/types';

interface NavbarProps {
  currentRole: RoleName;
  onNavigate: (screen: string) => void;
  currentUser: User | null;
  onOpenAuth: (tab: 'login' | 'register') => void;
  onLogout: () => void;
}

export function Navbar({
  currentRole,
  onNavigate,
  currentUser,
  onOpenAuth,
  onLogout,
}: NavbarProps) {
  const [profileOpen, setProfileOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#e8ebf3] bg-white/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-8">
        <button
          onClick={() => onNavigate('E1')}
          className="flex items-center gap-2.5 text-left focus:outline-none"
        >
          <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#6253e8] to-[#4838d2] text-white shadow-md shadow-[#6253e8]/25">
            <Sparkles size={19} />
          </div>
          <div>
            <div className="text-[17px] font-extrabold tracking-tight text-[#161d2d]">Talenta</div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-[#949cb0]">
              Recruitment OS
            </div>
          </div>
        </button>

        {!currentUser ? (
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
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#e85a5a]" />
            </button>
            <div className="relative">
              <button
                onClick={() => setProfileOpen((open) => !open)}
                className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-[#f6f7fb]"
              >
                {currentUser.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt={`${currentUser.prenom} ${currentUser.nom}`}
                    className="size-8 rounded-full object-cover border border-[#e2e5ef]"
                  />
                ) : (
                  <div className="grid size-8 place-items-center rounded-full bg-[#e9e6fd] text-xs font-extrabold text-[#5547d7]">
                    {currentUser.prenom?.[0] ?? 'U'}
                    {currentUser.nom?.[0] ?? ''}
                  </div>
                )}
                <div className="hidden text-left sm:block">
                  <div className="text-xs font-bold text-[#1f2638]">
                    {currentUser.prenom} {currentUser.nom}
                  </div>
                  <div className="text-[10px] font-semibold text-[#8e97ac]">{currentRole}</div>
                </div>
                <ChevronDown size={14} className="text-[#9ea6bb]" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-[#e8ebf3] bg-white p-2 shadow-xl">
                  <div className="border-b border-[#f0f2f7] px-3 py-2">
                    <div className="text-xs font-bold text-[#1a2133]">
                      {currentUser.prenom} {currentUser.nom}
                    </div>
                    <div className="truncate text-[11px] text-[#868fa4]">{currentUser.email}</div>
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
                        Fiche entreprise
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
    </header>
  );
}
