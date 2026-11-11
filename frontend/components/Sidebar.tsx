'use client';

import React from 'react';
import {
  BriefcaseBusiness,
  Building2,
  Calendar,
  FileText,
  Heart,
  LayoutDashboard,
  MessageSquare,
  Search,
  ShieldCheck,
  Sliders,
  UserCheck2,
  Users,
} from 'lucide-react';
import { RoleName } from '@/lib/types';

interface SidebarProps {
  currentRole: RoleName;
  activeScreen: string;
  onNavigate: (screen: string) => void;
  favorisCount?: number;
  unreadMessagesCount?: number;
  offresCount?: number;
  entretiensCount?: number;
}

const itemsByRole: Record<RoleName, { label: string; screen: string; icon: React.ElementType; badgeKey?: 'favoris' | 'messages' | 'offres' | 'entretiens' }[]> = {
  VISITEUR: [
    { label: 'Explorer les offres', screen: 'E1', icon: Search, badgeKey: 'offres' },
    { label: 'Entreprises', screen: 'E11', icon: Building2 },
  ],
  CANDIDAT: [
    { label: 'Tableau de bord', screen: 'E_CANDIDAT_DASHBOARD', icon: LayoutDashboard },
    { label: 'Explorer les offres', screen: 'E1', icon: Search, badgeKey: 'offres' },
    { label: 'Offres favorites', screen: 'E_FAVORIS', icon: Heart, badgeKey: 'favoris' },
    { label: 'Mes candidatures', screen: 'E5', icon: FileText },
    { label: 'Entretiens & Convocations', screen: 'E_ENTRETIENS', icon: Calendar, badgeKey: 'entretiens' },
    { label: 'Messagerie', screen: 'E_MESSAGES', icon: MessageSquare, badgeKey: 'messages' },
    { label: 'Mon profil', screen: 'E6_PROFIL', icon: UserCheck2 },
    { label: 'Mes CV', screen: 'E6_CV', icon: FileText },
    { label: 'Entreprises', screen: 'E11', icon: Building2 },
    { label: 'Paramètres', screen: 'E_SETTINGS', icon: Sliders },
  ],
  RECRUTEUR: [
    { label: 'Tableau de bord', screen: 'E7', icon: LayoutDashboard },
    { label: 'Mes offres', screen: 'E8', icon: BriefcaseBusiness, badgeKey: 'offres' },
    { label: 'Candidatures et analyse IA', screen: 'E9', icon: Users },
    { label: 'Mes entretiens', screen: 'E_RECRUTEUR_ENTRETIENS', icon: Calendar, badgeKey: 'entretiens' },
    { label: 'Messagerie', screen: 'E_MESSAGES', icon: MessageSquare, badgeKey: 'messages' },
    { label: 'Mon profil', screen: 'E_RECRUTEUR_PROFIL', icon: UserCheck2 },
    { label: 'Paramètres', screen: 'E_SETTINGS', icon: Sliders },
  ],
  ADMIN: [
    { label: 'Tableau de bord', screen: 'E_ADMIN_DASHBOARD', icon: LayoutDashboard },
    { label: 'Utilisateurs', screen: 'E12', icon: Users },
    { label: 'Rôles et permissions', screen: 'E13', icon: ShieldCheck },
    { label: 'Entreprises', screen: 'E14', icon: Building2 },
    { label: 'Notifications', screen: 'E15', icon: FileText },
    { label: 'Mon profil', screen: 'E_ADMIN_PROFIL', icon: UserCheck2 },
    { label: 'Paramètres', screen: 'E_SETTINGS', icon: Sliders },
  ],
};

export function Sidebar({
  currentRole,
  activeScreen,
  onNavigate,
  favorisCount = 0,
  unreadMessagesCount = 0,
  offresCount = 0,
  entretiensCount = 0,
}: SidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 top-16 z-30 hidden w-64 overflow-y-auto border-r border-[#e8ebf3] bg-white lg:block">
      <div className="flex min-h-full flex-col p-4">
        <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-[#9aa2b5]">
          Navigation
        </div>
        <nav className="space-y-1">
          {itemsByRole[currentRole].map(({ label, screen, icon: Icon, badgeKey }) => {
            const selected =
              activeScreen === screen ||
              (screen === 'E6_PROFIL' && (activeScreen === 'E6' || activeScreen === 'E6_PROFIL')) ||
              (screen === 'E1' && activeScreen === 'E3') ||
              (screen === 'E9' && activeScreen === 'E10');

            const badgeValue =
              badgeKey === 'favoris'
                ? favorisCount
                : badgeKey === 'messages'
                ? unreadMessagesCount
                : badgeKey === 'offres'
                ? offresCount
                : badgeKey === 'entretiens'
                ? entretiensCount
                : 0;

            return (
              <button
                key={screen}
                onClick={() => onNavigate(screen)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition ${
                  selected
                    ? 'bg-[#efedff] text-[#5547d7]'
                    : 'text-[#687188] hover:bg-[#f6f7fb] hover:text-[#242b3c]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} />
                  <span>{label}</span>
                </div>
                {badgeValue > 0 && (
                  <span
                    className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-black ${
                      badgeKey === 'favoris'
                        ? 'bg-[#ffe4e6] text-[#e11d48]'
                        : badgeKey === 'offres'
                        ? 'bg-[#edeaff] text-[#5547d7]'
                        : badgeKey === 'entretiens'
                        ? 'bg-[#dcfce7] text-[#15803d]'
                        : 'bg-[#594be0] text-white'
                    }`}
                  >
                    {badgeValue}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
