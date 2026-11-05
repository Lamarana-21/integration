'use client';

import React from 'react';
import {
  Bell,
  Building2,
  Check,
  CheckCheck,
  ChevronDown,
  FileText,
  Heart,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Shield,
  Sliders,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { RoleName, User, NotificationRecord } from '@/lib/types';

interface NavbarProps {
  currentRole: RoleName;
  onNavigate: (screen: string) => void;
  currentUser: User | null;
  onOpenAuth: (tab: 'login' | 'register') => void;
  onLogout: () => void;
  notifications?: NotificationRecord[];
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
}

export function Navbar({
  currentRole,
  onNavigate,
  currentUser,
  onOpenAuth,
  onLogout,
  notifications = [],
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
}: NavbarProps) {
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);

  // Clé de stockage persistant pour l'acteur connecté
  const storageKey = currentUser
    ? `talenta_read_notifications_${currentUser.id}`
    : 'talenta_read_notifications_guest';

  // Identifiants des notifications déjà consultées / lues
  const [readNotificationIds, setReadNotificationIds] = React.useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Recharger l'état de lecture quand le profil change
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(storageKey);
      setReadNotificationIds(saved ? JSON.parse(saved) : []);
    } catch {
      setReadNotificationIds([]);
    }
  }, [storageKey]);

  // Filtrage intelligent des notifications pour l'acteur connecté
  const relevantNotifications = React.useMemo(() => {
    if (!currentUser || !notifications) return [];
    if (currentRole === 'ADMIN') return notifications;
    if (currentRole === 'RECRUTEUR') {
      return notifications.filter(
        (n) =>
          n.type === 'NOUVELLE_CANDIDATURE' ||
          n.type === 'NOUVELLE_OFFRE' ||
          n.utilisateur_id === currentUser.id
      );
    }
    // Candidat
    return notifications.filter(
      (n) =>
        n.type === 'CONFIRMATION_DEPOT' ||
        n.type === 'CHANGEMENT_STATUT' ||
        n.utilisateur_id === currentUser.id
    );
  }, [notifications, currentRole, currentUser]);

  // Notifications encore non lues pour calculer le badge dynamique
  const unreadNotifications = React.useMemo(() => {
    return relevantNotifications.filter(
      (n) => !n.lu && !readNotificationIds.includes(n.id)
    );
  }, [relevantNotifications, readNotificationIds]);

  const unreadCount = unreadNotifications.length;

  // Marquer un message individuel comme lu (diminue le badge)
  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setReadNotificationIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    onMarkNotificationRead?.(id);
  };

  // Marquer toutes les notifications comme lues d'un coup
  const handleMarkAllAsRead = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const allIds = relevantNotifications.map((n) => n.id);
    setReadNotificationIds((prev) => {
      const merged = Array.from(new Set([...prev, ...allIds]));
      try {
        localStorage.setItem(storageKey, JSON.stringify(merged));
      } catch {}
      return merged;
    });
    onMarkAllNotificationsRead?.();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#e8ebf3] bg-white/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-8">
        <button
          onClick={() =>
            onNavigate(
              currentRole === 'CANDIDAT'
                ? 'E_CANDIDAT_DASHBOARD'
                : currentRole === 'RECRUTEUR'
                ? 'E7'
                : currentRole === 'ADMIN'
                ? 'E_ADMIN_DASHBOARD'
                : 'E1'
            )
          }
          className="flex items-center gap-2.5 text-left focus:outline-none cursor-pointer"
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
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Bouton Messagerie */}
            <button
              onClick={() => onNavigate('E_MESSAGES')}
              className="relative grid size-9 place-items-center rounded-xl border border-[#e4e7ef] text-[#6b7489] hover:bg-[#f8f9fc] hover:text-[#594be0] transition"
              title="Messagerie instantanée"
            >
              <MessageSquare size={16} />
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#594be0]" />
            </button>

            {/* Bouton Notifications avec Menu Déroulant Interactif & Badge Dynamique */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationsOpen((open) => !open);
                  setProfileOpen(false);
                }}
                className={`relative grid size-9 place-items-center rounded-xl border transition cursor-pointer ${
                  notificationsOpen
                    ? 'border-[#594be0] bg-[#f0efff] text-[#594be0]'
                    : 'border-[#e4e7ef] text-[#6b7489] hover:bg-[#f8f9fc]'
                }`}
                title={unreadCount > 0 ? `${unreadCount} notification(s) non lue(s)` : 'Notifications'}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e85a5a] px-1 text-[9px] font-black text-white shadow-xs animate-in zoom-in-75">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 z-50 mt-2 w-80 sm:w-96 rounded-3xl border border-[#e8ebf3] bg-white p-3 shadow-2xl animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-[#f0f2f7] px-3 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-[#171f33]">Notifications</span>
                      {unreadCount > 0 ? (
                        <span className="rounded-full bg-[#f0efff] px-2 py-0.5 text-[10px] font-extrabold text-[#594be0]">
                          {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#f4f5f8] px-2 py-0.5 text-[10px] font-semibold text-[#828c9f]">
                          Toutes lues
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllAsRead}
                          className="flex items-center gap-1 text-[10px] font-bold text-[#594be0] hover:underline cursor-pointer"
                          title="Marquer toutes les notifications comme lues"
                        >
                          <CheckCheck size={12} />
                          Tout marquer lu
                        </button>
                      )}
                      {currentRole === 'ADMIN' && (
                        <button
                          onClick={() => {
                            onNavigate('E15');
                            setNotificationsOpen(false);
                          }}
                          className="text-[11px] font-bold text-[#594be0] hover:underline cursor-pointer"
                        >
                          Journal →
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-[#f2f4f9] py-1 text-xs">
                    {relevantNotifications.length === 0 ? (
                      <div className="py-6 text-center text-[#8e97ac]">
                        <Bell size={24} className="mx-auto mb-2 text-[#cbd2e1]" />
                        <div className="font-bold text-xs text-[#20283c]">Aucune notification</div>
                        <div className="text-[11px] text-[#9aa3b7] mt-0.5">
                          Vos alertes et accusés de réception s'afficheront ici.
                        </div>
                      </div>
                    ) : (
                      relevantNotifications.slice(0, 8).map((n) => {
                        const isRead = n.lu === true || readNotificationIds.includes(n.id);
                        return (
                          <div
                            key={n.id}
                            className={`group relative p-3 rounded-2xl transition cursor-pointer ${
                              isRead
                                ? 'bg-transparent hover:bg-[#f8f9fc] opacity-75 hover:opacity-100'
                                : 'bg-[#f8f7fe] hover:bg-[#f2f0fe] border border-[#ece8ff]'
                            }`}
                            onClick={() => {
                              handleMarkAsRead(n.id);
                              if (currentRole === 'CANDIDAT') onNavigate('E5');
                              else if (currentRole === 'RECRUTEUR') onNavigate('E9');
                              else if (currentRole === 'ADMIN') onNavigate('E15');
                              setNotificationsOpen(false);
                            }}
                          >
                            <div className="flex items-start gap-2.5">
                              <span
                                className={`grid size-7 shrink-0 place-items-center rounded-xl transition mt-0.5 ${
                                  isRead
                                    ? 'bg-[#f0f2f7] text-[#8690a5]'
                                    : 'bg-[#594be0] text-white shadow-xs'
                                }`}
                              >
                                {n.type === 'CONFIRMATION_DEPOT' ? (
                                  <FileText size={13} />
                                ) : n.type === 'NOUVELLE_CANDIDATURE' ? (
                                  <Sparkles size={13} />
                                ) : (
                                  <Bell size={13} />
                                )}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1.5">
                                  <div
                                    className={`text-xs leading-snug truncate ${
                                      isRead ? 'font-semibold text-[#485267]' : 'font-extrabold text-[#151c2c]'
                                    }`}
                                  >
                                    {n.objet}
                                  </div>
                                  {!isRead && (
                                    <span
                                      className="size-2 shrink-0 rounded-full bg-[#594be0]"
                                      title="Non lue"
                                    />
                                  )}
                                </div>
                                <div
                                  className={`text-[11px] mt-0.5 line-clamp-2 leading-relaxed ${
                                    isRead ? 'text-[#7e879c]' : 'text-[#485267]'
                                  }`}
                                >
                                  {n.message}
                                </div>
                                <div className="flex items-center justify-between mt-1.5 text-[10px] text-[#9ca5b9] font-medium">
                                  <span>{n.created_at}</span>
                                  {!isRead && (
                                    <button
                                      type="button"
                                      onClick={(e) => handleMarkAsRead(n.id, e)}
                                      className="opacity-0 group-hover:opacity-100 transition text-[10px] font-bold text-[#594be0] hover:underline flex items-center gap-1 cursor-pointer"
                                      title="Marquer comme lu sans quitter"
                                    >
                                      <Check size={11} /> Lu
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {relevantNotifications.length > 0 && (
                    <div className="border-t border-[#f0f2f7] pt-2 mt-1">
                      <button
                        onClick={() => {
                          if (currentRole === 'CANDIDAT') onNavigate('E5');
                          else if (currentRole === 'RECRUTEUR') onNavigate('E9');
                          else if (currentRole === 'ADMIN') onNavigate('E15');
                          setNotificationsOpen(false);
                        }}
                        className="w-full text-center py-1.5 text-[11px] font-bold text-[#594be0] hover:bg-[#f6f5fe] rounded-xl transition cursor-pointer"
                      >
                        {currentRole === 'CANDIDAT'
                          ? 'Accéder à mes candidatures →'
                          : currentRole === 'RECRUTEUR'
                          ? 'Gérer les candidatures reçues →'
                          : 'Voir tout le journal des notifications →'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

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
                <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-[#e8ebf3] bg-white p-2 shadow-xl animate-in fade-in zoom-in-95">
                  <div className="border-b border-[#f0f2f7] px-3 py-2">
                    <div className="text-xs font-bold text-[#1a2233]">
                      {currentUser.prenom} {currentUser.nom}
                    </div>
                    <div className="truncate text-[11px] text-[#868fa4]">{currentUser.email}</div>
                  </div>
                  <div className="py-1">
                    {currentRole === 'CANDIDAT' && (
                      <>
                        <button
                          onClick={() => {
                            onNavigate('E_CANDIDAT_DASHBOARD');
                            setProfileOpen(false);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#515970] hover:bg-[#f6f7fc]"
                        >
                          <LayoutDashboard size={14} className="text-[#594be0]" />
                          Tableau de bord
                        </button>
                        <button
                          onClick={() => {
                            onNavigate('E6_PROFIL');
                            setProfileOpen(false);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#515970] hover:bg-[#f6f7fc]"
                        >
                          <UserCheck size={14} />
                          Mon profil
                        </button>
                      </>
                    )}
                    {currentRole === 'ADMIN' && (
                      <button
                        onClick={() => {
                          onNavigate('E_ADMIN_PROFIL');
                          setProfileOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#515970] hover:bg-[#f6f7fc]"
                      >
                        <Shield size={14} className="text-[#594be0]" />
                        Mon profil Admin
                      </button>
                    )}
                    {currentRole === 'RECRUTEUR' && (
                      <button
                        onClick={() => {
                          onNavigate('E_RECRUTEUR_PROFIL');
                          setProfileOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#515970] hover:bg-[#f6f7fc]"
                      >
                        <Building2 size={14} className="text-[#594be0]" />
                        Mon profil Recruteur
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onNavigate('E_SETTINGS');
                        setProfileOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#515970] hover:bg-[#f6f7fc]"
                    >
                      <Sliders size={14} />
                      Paramètres & Sécurité
                    </button>
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
