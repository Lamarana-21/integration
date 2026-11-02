'use client';

import React from 'react';
import {
  BriefcaseBusiness,
  Building2,
  FileText,
  LayoutDashboard,
  Search,
  ShieldCheck,
  UserCheck2,
  Users,
} from 'lucide-react';
import { RoleName } from '@/lib/types';

interface SidebarProps {
  currentRole: RoleName;
  activeScreen: string;
  onNavigate: (screen: string) => void;
}

const itemsByRole: Record<RoleName, { label: string; screen: string; icon: React.ElementType }[]> = {
  VISITEUR: [
    { label: 'Explorer les offres', screen: 'E1', icon: Search },
    { label: 'Entreprises', screen: 'E11', icon: Building2 },
  ],
  CANDIDAT: [
    { label: 'Explorer les offres', screen: 'E1', icon: Search },
    { label: 'Entreprises', screen: 'E11', icon: Building2 },
    { label: 'Mes candidatures', screen: 'E5', icon: FileText },
    { label: 'Mon profil', screen: 'E6_PROFIL', icon: UserCheck2 },
    { label: 'Mes CV', screen: 'E6_CV', icon: FileText },
  ],
  RECRUTEUR: [
    { label: 'Tableau de bord', screen: 'E7', icon: LayoutDashboard },
    { label: 'Nouvelle offre', screen: 'E8', icon: BriefcaseBusiness },
    { label: 'Candidatures et analyse IA', screen: 'E9', icon: Users },
    { label: 'Entreprise', screen: 'E11', icon: Building2 },
  ],
  ADMIN: [
    { label: 'Utilisateurs', screen: 'E12', icon: Users },
    { label: 'Rôles et permissions', screen: 'E13', icon: ShieldCheck },
    { label: 'Entreprises', screen: 'E14', icon: Building2 },
    { label: 'Notifications', screen: 'E15', icon: FileText },
  ],
};

export function Sidebar({ currentRole, activeScreen, onNavigate }: SidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 top-16 z-30 hidden w-64 overflow-y-auto border-r border-[#e8ebf3] bg-white lg:block">
      <div className="flex min-h-full flex-col p-4">
        <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-[#9aa2b5]">
          Navigation
        </div>
        <nav className="space-y-1">
          {itemsByRole[currentRole].map(({ label, screen, icon: Icon }) => {
            const selected =
              activeScreen === screen ||
              (screen === 'E6_PROFIL' && (activeScreen === 'E6' || activeScreen === 'E6_PROFIL')) ||
              (screen === 'E1' && activeScreen === 'E3') ||
              (screen === 'E9' && activeScreen === 'E10');
            return (
              <button
                key={screen}
                onClick={() => onNavigate(screen)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition ${
                  selected
                    ? 'bg-[#efedff] text-[#5547d7]'
                    : 'text-[#687188] hover:bg-[#f6f7fb] hover:text-[#242b3c]'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
