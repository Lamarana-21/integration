'use client';

import React, { useState } from 'react';
import {
  BriefcaseBusiness,
  Building2,
  Calendar,
  Download,
  FileText,
  Heart,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Search,
  ShieldCheck,
  Sliders,
  Smartphone,
  UserCheck2,
  Users,
  X,
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

const itemsByRole: Record<
  RoleName,
  {
    label: string;
    shortLabel: string;
    screen: string;
    icon: React.ElementType;
    badgeKey?: 'favoris' | 'messages' | 'offres' | 'entretiens';
    showInBottomBar?: boolean;
  }[]
> = {
  VISITEUR: [
    { label: 'Explorer les offres', shortLabel: 'Offres', screen: 'E1', icon: Search, badgeKey: 'offres', showInBottomBar: true },
    { label: 'Entreprises', shortLabel: 'Entreprises', screen: 'E11', icon: Building2, showInBottomBar: true },
  ],
  CANDIDAT: [
    { label: 'Tableau de bord', shortLabel: 'Accueil', screen: 'E_CANDIDAT_DASHBOARD', icon: LayoutDashboard, showInBottomBar: true },
    { label: 'Explorer les offres', shortLabel: 'Offres', screen: 'E1', icon: Search, badgeKey: 'offres', showInBottomBar: true },
    { label: 'Offres favorites', shortLabel: 'Favoris', screen: 'E_FAVORIS', icon: Heart, badgeKey: 'favoris' },
    { label: 'Mes candidatures', shortLabel: 'Dossiers', screen: 'E5', icon: FileText, showInBottomBar: true },
    { label: 'Entretiens & Convocations', shortLabel: 'Entretiens', screen: 'E_ENTRETIENS', icon: Calendar, badgeKey: 'entretiens' },
    { label: 'Messagerie', shortLabel: 'Messages', screen: 'E_MESSAGES', icon: MessageSquare, badgeKey: 'messages', showInBottomBar: true },
    { label: 'Mon profil', shortLabel: 'Profil', screen: 'E6_PROFIL', icon: UserCheck2 },
    { label: 'Mes CV', shortLabel: 'Mes CV', screen: 'E6_CV', icon: FileText },
    { label: 'Entreprises', shortLabel: 'Entreprises', screen: 'E11', icon: Building2 },
    { label: 'Paramètres', shortLabel: 'Réglages', screen: 'E_SETTINGS', icon: Sliders },
  ],
  RECRUTEUR: [
    { label: 'Tableau de bord', shortLabel: 'Accueil', screen: 'E7', icon: LayoutDashboard, showInBottomBar: true },
    { label: 'Mes offres', shortLabel: 'Mes offres', screen: 'E8', icon: BriefcaseBusiness, badgeKey: 'offres', showInBottomBar: true },
    { label: 'Candidatures et analyse IA', shortLabel: 'Candidats', screen: 'E9', icon: Users, showInBottomBar: true },
    { label: 'Mes entretiens', shortLabel: 'Entretiens', screen: 'E_RECRUTEUR_ENTRETIENS', icon: Calendar, badgeKey: 'entretiens' },
    { label: 'Messagerie', shortLabel: 'Messages', screen: 'E_MESSAGES', icon: MessageSquare, badgeKey: 'messages', showInBottomBar: true },
    { label: 'Mon profil', shortLabel: 'Profil', screen: 'E_RECRUTEUR_PROFIL', icon: UserCheck2 },
    { label: 'Paramètres', shortLabel: 'Réglages', screen: 'E_SETTINGS', icon: Sliders },
  ],
  ADMIN: [
    { label: 'Tableau de bord', shortLabel: 'Accueil', screen: 'E_ADMIN_DASHBOARD', icon: LayoutDashboard, showInBottomBar: true },
    { label: 'Utilisateurs', shortLabel: 'Comptes', screen: 'E12', icon: Users, showInBottomBar: true },
    { label: 'Rôles et permissions', shortLabel: 'Rôles', screen: 'E13', icon: ShieldCheck },
    { label: 'Entreprises', shortLabel: 'Entreprises', screen: 'E14', icon: Building2, showInBottomBar: true },
    { label: 'Notifications', shortLabel: 'Alertes', screen: 'E15', icon: FileText, showInBottomBar: true },
    { label: 'Mon profil', shortLabel: 'Profil', screen: 'E_ADMIN_PROFIL', icon: UserCheck2 },
    { label: 'Paramètres', shortLabel: 'Réglages', screen: 'E_SETTINGS', icon: Sliders },
  ],
};

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function Sidebar({
  currentRole,
  activeScreen,
  onNavigate,
  favorisCount = 0,
  unreadMessagesCount = 0,
  offresCount = 0,
  entretiensCount = 0,
}: SidebarProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  // Enregistrement automatique du Service Worker PWA + écoute de l'événement d'installation mobile
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      setDeferredPrompt(null);
    } else {
      setShowInstallHelp(true);
    }
  };

  const getBadgeValue = (badgeKey?: 'favoris' | 'messages' | 'offres' | 'entretiens') => {
    if (badgeKey === 'favoris') return favorisCount;
    if (badgeKey === 'messages') return unreadMessagesCount;
    if (badgeKey === 'offres') return offresCount;
    if (badgeKey === 'entretiens') return entretiensCount;
    return 0;
  };

  const isItemSelected = (screen: string) =>
    activeScreen === screen ||
    (screen === 'E6_PROFIL' && (activeScreen === 'E6' || activeScreen === 'E6_PROFIL')) ||
    (screen === 'E1' && activeScreen === 'E3') ||
    (screen === 'E9' && activeScreen === 'E10');

  const roleItems = itemsByRole[currentRole] || [];
  const bottomBarItems = roleItems.filter((item) => item.showInBottomBar).slice(0, 4);

  return (
    <>
      {/* 1. SIDEBAR DESKTOP (Grand écran lg+) */}
      <aside className="fixed inset-y-0 left-0 top-16 z-30 hidden w-64 overflow-y-auto border-r border-[#e8ebf3] bg-white lg:block">
        <div className="flex min-h-full flex-col justify-between p-4">
          <div>
            <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-[#9aa2b5]">
              Navigation
            </div>
            <nav className="space-y-1">
              {roleItems.map(({ label, screen, icon: Icon, badgeKey }) => {
                const selected = isItemSelected(screen);
                const badgeValue = getBadgeValue(badgeKey);

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

          {/* Carte d'installation mobile PWA */}
          <div className="mt-6 rounded-2xl border border-[#e2e8f0] bg-gradient-to-br from-[#eef2ff] to-[#f8fafc] p-3.5">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#1e293b]">
              <Smartphone size={15} className="text-[#594be0]" />
              <span>Application Mobile</span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-[#64748b]">
              Installez Talenta sur votre téléphone ou PC en 1 clic. Les mises à jour sont automatiques.
            </p>
            <button
              type="button"
              onClick={handleInstallClick}
              className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#594be0] px-3 py-2 text-xs font-bold text-white hover:bg-[#483ad3] transition cursor-pointer shadow-2xs"
            >
              <Download size={13} />
              <span>Installer l&apos;application</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 2. BARRE DE NAVIGATION MOBILE EN BAS (Écrans < lg) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-[#e2e8f0] bg-white/95 px-2 backdrop-blur-md lg:hidden shadow-lg">
        {bottomBarItems.map(({ shortLabel, screen, icon: Icon, badgeKey }) => {
          const selected = isItemSelected(screen);
          const badgeValue = getBadgeValue(badgeKey);

          return (
            <button
              key={screen}
              type="button"
              onClick={() => {
                setMobileDrawerOpen(false);
                onNavigate(screen);
              }}
              className={`relative flex flex-1 flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-bold transition ${
                selected ? 'text-[#594be0]' : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={selected ? 2.4 : 2} />
                {badgeValue > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#e11d48] px-1 text-[9px] font-black text-white">
                    {badgeValue}
                  </span>
                )}
              </div>
              <span className="truncate max-w-[72px]">{shortLabel}</span>
            </button>
          );
        })}

        {/* Bouton Menu complet sur mobile */}
        <button
          type="button"
          onClick={() => setMobileDrawerOpen((prev) => !prev)}
          className={`flex flex-1 flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-bold transition ${
            mobileDrawerOpen ? 'text-[#594be0]' : 'text-[#64748b]'
          }`}
        >
          <Menu size={20} />
          <span>Menu</span>
        </button>
      </nav>

      {/* 3. TIROIR MOBILE (Toutes les rubriques + bouton Installer sur téléphone) */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs lg:hidden">
          <div className="max-h-[82vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 pb-20 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-[#f1f5f9] pb-3">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-xl bg-[#594be0] text-xs font-black text-white">
                  T
                </span>
                <div>
                  <div className="text-sm font-black text-[#0f172a]">Menu Talenta Mobile</div>
                  <div className="text-[11px] text-[#64748b]">Navigation rapide & installation</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="rounded-xl bg-[#f1f5f9] p-2 text-[#475569]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {roleItems.map(({ label, screen, icon: Icon, badgeKey }) => {
                const selected = isItemSelected(screen);
                const badgeValue = getBadgeValue(badgeKey);
                return (
                  <button
                    key={screen}
                    type="button"
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      onNavigate(screen);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-xs font-bold transition ${
                      selected
                        ? 'bg-[#efedff] text-[#5547d7]'
                        : 'text-[#334155] hover:bg-[#f8fafc]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={17} />
                      <span>{label}</span>
                    </div>
                    {badgeValue > 0 && (
                      <span className="rounded-full bg-[#594be0] px-2 py-0.5 text-[10px] font-black text-white">
                        {badgeValue}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 border-t border-[#f1f5f9] pt-4">
              <button
                type="button"
                onClick={() => {
                  setMobileDrawerOpen(false);
                  handleInstallClick();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#594be0] py-3 text-xs font-black text-white shadow-sm"
              >
                <Smartphone size={15} />
                <span>Installer Talenta sur mon téléphone</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODALE D'AIDE À L'INSTALLATION MOBILE (Android / iPhone / PC) */}
      {showInstallHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="grid size-10 place-items-center rounded-xl bg-[#eef2ff] text-[#594be0]">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#0f172a]">
                    Installer l&apos;application Talenta
                  </h3>
                  <p className="text-[11px] text-[#64748b]">
                    Mode Application Mobile PWA (Mises à jour en direct)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallHelp(false)}
                className="rounded-lg bg-[#f1f5f9] p-1.5 text-[#475569]"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#334155]">
              <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
                <div className="font-extrabold text-[#0f172a] mb-1">📱 Sur Android (Chrome)</div>
                <p className="text-[11px] leading-relaxed text-[#475569]">
                  Appuyez sur le menu <strong>⋮</strong> en haut à droite de Chrome puis choisissez{' '}
                  <strong>« Installer l&apos;application »</strong> ou{' '}
                  <strong>« Ajouter à l&apos;écran d&apos;accueil »</strong>.
                </p>
              </div>

              <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
                <div className="font-extrabold text-[#0f172a] mb-1">🍏 Sur iPhone / iPad (Safari)</div>
                <p className="text-[11px] leading-relaxed text-[#475569]">
                  Appuyez sur le bouton <strong>Partager</strong> en bas de Safari puis sélectionnez{' '}
                  <strong>« Sur l&apos;écran d&apos;accueil »</strong>.
                </p>
              </div>

              <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
                <div className="font-extrabold text-[#0f172a] mb-1">💻 Sur PC (Chrome / Edge)</div>
                <p className="text-[11px] leading-relaxed text-[#475569]">
                  Cliquez sur l&apos;icône <strong>Installer</strong> à droite dans la barre d&apos;adresse du navigateur.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowInstallHelp(false)}
                className="rounded-xl bg-[#594be0] px-4 py-2 text-xs font-bold text-white hover:bg-[#483ad3]"
              >
                J&apos;ai compris
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
