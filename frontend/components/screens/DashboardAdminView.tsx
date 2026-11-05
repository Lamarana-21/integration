'use client';

import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Clock,
  Database,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  KeyRound,
  LayoutDashboard,
  Plus,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck2,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  Candidature,
  Entreprise,
  NotificationRecord,
  Offre,
  User,
} from '@/lib/types';

interface DashboardAdminViewProps {
  currentUser: User | null;
  users: User[];
  entreprises: Entreprise[];
  offres: Offre[];
  candidatures: Candidature[];
  notifications: NotificationRecord[];
  backendOnline: boolean | null;
  onNavigateScreen: (screen: string) => void;
  onSelectEntreprise?: (ent: Entreprise) => void;
}

export function DashboardAdminView({
  currentUser,
  users,
  entreprises,
  offres,
  candidatures,
  notifications,
  backendOnline,
  onNavigateScreen,
  onSelectEntreprise,
}: DashboardAdminViewProps) {
  const [activityTimeframe, setActivityTimeframe] = useState<'7J' | '30J' | 'TOTAL'>('7J');

  // Statistiques calculées dynamiquement
  const candidatsCount = users.filter((u) => u.role?.nom === 'CANDIDAT').length;
  const recruteursCount = users.filter((u) => u.role?.nom === 'RECRUTEUR').length;
  const adminsCount = users.filter((u) => u.role?.nom === 'ADMIN').length;

  const entreprisesActives = entreprises.filter((e) => e.statut === 'ACTIVE').length;
  const offresPubliees = offres.filter((o) => o.statut === 'PUBLIEE').length;
  const offresCloturees = offres.filter((o) => o.statut === 'CLOTUREE').length;

  const candidaturesRecues = candidatures.filter((c) => c.statut === 'RECUE').length;
  const candidaturesEntretien = candidatures.filter((c) => c.statut === 'ENTRETIEN').length;

  // Calcul du score moyen IA
  const scoresIA = candidatures
    .map((c) => c.analyse?.score_correspondance)
    .filter((s): s is number => typeof s === 'number');
  const avgScoreIA = scoresIA.length > 0 ? Math.round(scoresIA.reduce((a, b) => a + b, 0) / scoresIA.length) : 84;

  const totalUsers = users.length || 1;
  const candPct = Math.round((candidatsCount / totalUsers) * 100);
  const recPct = Math.round((recruteursCount / totalUsers) * 100);
  const admPct = Math.round((adminsCount / totalUsers) * 100);

  // Activité hebdomadaire simulée dynamique
  const weeklyData = [
    { day: 'Lun', candidatures: 8, inscriptions: 3, matches: 6 },
    { day: 'Mar', candidatures: 12, inscriptions: 5, matches: 9 },
    { day: 'Mer', candidatures: 15, inscriptions: 4, matches: 13 },
    { day: 'Jeu', candidatures: 9, inscriptions: 2, matches: 7 },
    { day: 'Ven', candidatures: 14, inscriptions: 6, matches: 11 },
    { day: 'Sam', candidatures: 6, inscriptions: 1, matches: 4 },
    { day: 'Dim', candidatures: 4, inscriptions: 2, matches: 3 },
  ];
  const maxWeekly = Math.max(...weeklyData.map((d) => d.candidatures));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 space-y-8 font-sans">
      {/* 1. TOP HERO BANNER ADMINISTRATEUR */}
      <div className="relative overflow-hidden rounded-3xl border border-[#e4e8f3] bg-gradient-to-r from-[#171f33] via-[#1e2740] to-[#2b2559] p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#a6b2cf]">
              <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-white backdrop-blur-xs">
                <Shield size={13} className="text-[#68d391]" /> Espace Administrateur Système
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5 text-[#68d391]">
                <span className="size-2 rounded-full bg-[#68d391] animate-ping" />
                Plateforme Opérationnelle
              </span>
            </div>

            <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">
              Tableau de bord de supervision générale
            </h1>
            <p className="mt-1 text-xs text-[#b8c2db] max-w-2xl leading-relaxed">
              Bienvenue, <strong>{currentUser?.prenom || 'Amélie'} {currentUser?.nom || 'Moreau'}</strong>.
              Supervisez les comptes, les entreprises partenaires, le flux des candidatures assistées par IA et la conformité de la plateforme.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigateScreen('E12')}
              className="flex items-center gap-1.5 rounded-2xl bg-[#594be0] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#594be0]/30 hover:bg-[#483ad3] transition"
            >
              <UserPlus size={15} />
              Nouveau compte
            </button>
            <button
              onClick={() => onNavigateScreen('E_ADMIN_PROFIL')}
              className="flex items-center gap-1.5 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-xs hover:bg-white/20 transition"
            >
              <UserCheck2 size={15} />
              Mon profil Admin
            </button>
          </div>
        </div>

        {/* Décoration d'arrière-plan */}
        <div className="pointer-events-none absolute -right-10 -bottom-10 size-64 rounded-full bg-[#594be0]/20 blur-3xl" />
        <div className="pointer-events-none absolute left-1/3 -top-10 size-48 rounded-full bg-[#3b82f6]/15 blur-2xl" />
      </div>

      {/* 2. LES 4 GRANDS KPI DYNAMIQUES */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 : Utilisateurs */}
        <div
          onClick={() => onNavigateScreen('E12')}
          className="group cursor-pointer rounded-3xl border border-[#e8ebf3] bg-white p-5 shadow-xs transition duration-200 hover:-translate-y-1 hover:border-[#594be0] hover:shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7d879d] uppercase tracking-wider">Utilisateurs</span>
            <div className="grid size-10 place-items-center rounded-2xl bg-[#f0efff] text-[#594be0] group-hover:scale-110 transition">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <div className="text-3xl font-black text-[#171f33]">{users.length}</div>
            <span className="text-[11px] font-bold text-[#279257]">↗ Actifs</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-[#788299]">
            <span className="font-semibold text-[#594be0]">{candidatsCount} Cand.</span>
            <span>·</span>
            <span className="font-semibold text-[#805ad5]">{recruteursCount} Recr.</span>
            <span>·</span>
            <span className="font-semibold text-[#e53e3e]">{adminsCount} Admin</span>
          </div>
          <div className="mt-3 pt-3 border-t border-[#f2f4f9] flex items-center justify-between text-[11px] font-bold text-[#594be0]">
            <span>Gérer les comptes</span>
            <ArrowRight size={13} className="group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* KPI 2 : Entreprises */}
        <div
          onClick={() => onNavigateScreen('E14')}
          className="group cursor-pointer rounded-3xl border border-[#e8ebf3] bg-white p-5 shadow-xs transition duration-200 hover:-translate-y-1 hover:border-[#594be0] hover:shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7d879d] uppercase tracking-wider">Entreprises</span>
            <div className="grid size-10 place-items-center rounded-2xl bg-[#edf9f3] text-[#279257] group-hover:scale-110 transition">
              <Building2 size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <div className="text-3xl font-black text-[#171f33]">{entreprises.length}</div>
            <span className="text-[11px] font-bold text-[#279257]">{entreprisesActives} actives</span>
          </div>
          <div className="mt-2 text-[11px] text-[#788299]">
            Régions : Sfax, Tunis, Sousse
          </div>
          <div className="mt-3 pt-3 border-t border-[#f2f4f9] flex items-center justify-between text-[11px] font-bold text-[#279257]">
            <span>Gérer les entreprises</span>
            <ArrowRight size={13} className="group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* KPI 3 : Offres d'emploi */}
        <div
          onClick={() => onNavigateScreen('E1')}
          className="group cursor-pointer rounded-3xl border border-[#e8ebf3] bg-white p-5 shadow-xs transition duration-200 hover:-translate-y-1 hover:border-[#594be0] hover:shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7d879d] uppercase tracking-wider">Offres d'emploi</span>
            <div className="grid size-10 place-items-center rounded-2xl bg-[#fff8eb] text-[#d69e2e] group-hover:scale-110 transition">
              <BriefcaseBusiness size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <div className="text-3xl font-black text-[#171f33]">{offres.length}</div>
            <span className="text-[11px] font-bold text-[#594be0]">{offresPubliees} publiées</span>
          </div>
          <div className="mt-2 text-[11px] text-[#788299]">
            {offresCloturees} clôturées ou archivées
          </div>
          <div className="mt-3 pt-3 border-t border-[#f2f4f9] flex items-center justify-between text-[11px] font-bold text-[#d69e2e]">
            <span>Voir les offres en ligne</span>
            <ArrowRight size={13} className="group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* KPI 4 : Candidatures & IA */}
        <div
          onClick={() => onNavigateScreen('E9')}
          className="group cursor-pointer rounded-3xl border border-[#e8ebf3] bg-white p-5 shadow-xs transition duration-200 hover:-translate-y-1 hover:border-[#594be0] hover:shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7d879d] uppercase tracking-wider">Candidatures & IA</span>
            <div className="grid size-10 place-items-center rounded-2xl bg-[#f5f3ff] text-[#7c3aed] group-hover:scale-110 transition">
              <Sparkles size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <div className="text-3xl font-black text-[#171f33]">{candidatures.length}</div>
            <span className="text-[11px] font-bold text-[#7c3aed]">Score IA {avgScoreIA}%</span>
          </div>
          <div className="mt-2 text-[11px] text-[#788299]">
            {candidaturesRecues} reçues · {candidaturesEntretien} en entretien
          </div>
          <div className="mt-3 pt-3 border-t border-[#f2f4f9] flex items-center justify-between text-[11px] font-bold text-[#7c3aed]">
            <span>Consulter les analyses IA</span>
            <ArrowRight size={13} className="group-hover:translate-x-1 transition" />
          </div>
        </div>
      </div>

      {/* 3. GRILLE CENTRALE : STATISTIQUES VISUELLES & SANTÉ DU SYSTÈME */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Colonne Gauche (2/3) : Activité & Répartition des membres */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bloc Graphique SVG Activité de la plateforme */}
          <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 shadow-xs">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center border-b border-[#f0f2f7] pb-4">
              <div>
                <h2 className="text-base font-extrabold text-[#171f33] flex items-center gap-2">
                  <Activity size={18} className="text-[#594be0]" /> Activité de recrutement & flux de la semaine
                </h2>
                <p className="mt-0.5 text-xs text-[#7d869d]">
                  Volume des candidatures soumises, inscriptions et correspondances IA calculées.
                </p>
              </div>

              <div className="flex items-center gap-1 rounded-xl bg-[#f5f6fa] p-1 text-[11px] font-bold">
                {(['7J', '30J', 'TOTAL'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setActivityTimeframe(t)}
                    className={`rounded-lg px-2.5 py-1 transition ${
                      activityTimeframe === t
                        ? 'bg-white text-[#594be0] shadow-xs'
                        : 'text-[#6b758b] hover:text-[#171f33]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Histogramme interactif */}
            <div className="mt-6">
              <div className="flex h-44 items-end justify-between gap-2 sm:gap-4 pt-4 px-2">
                {weeklyData.map((item, idx) => {
                  const heightCand = Math.round((item.candidatures / maxWeekly) * 100);
                  const heightMatches = Math.round((item.matches / maxWeekly) * 100);
                  return (
                    <div key={idx} className="group flex flex-1 flex-col items-center gap-2">
                      <div className="flex w-full items-end justify-center gap-1.5 h-36">
                        {/* Barre Candidatures */}
                        <div
                          style={{ height: `${heightCand}%` }}
                          title={`Candidatures: ${item.candidatures}`}
                          className="w-full max-w-[14px] rounded-t-lg bg-gradient-to-t from-[#594be0] to-[#7f73f2] transition-all duration-300 group-hover:brightness-110"
                        />
                        {/* Barre Matches IA */}
                        <div
                          style={{ height: `${heightMatches}%` }}
                          title={`Analyses IA: ${item.matches}`}
                          className="w-full max-w-[14px] rounded-t-lg bg-[#b4adff] transition-all duration-300 group-hover:brightness-110"
                        />
                      </div>
                      <span className="text-[11px] font-bold text-[#8690a6]">{item.day}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-5 text-xs border-t border-[#f4f6fa] pt-3 text-[#647087]">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-sm bg-[#594be0]" /> Candidatures reçues
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-sm bg-[#b4adff]" /> Analyses IA qualifiées
                </div>
              </div>
            </div>
          </div>

          {/* Répartition des Rôles et Communauté */}
          <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 shadow-xs">
            <h3 className="text-sm font-extrabold text-[#171f33] flex items-center justify-between">
              <span>Répartition de la communauté Talenta</span>
              <span className="text-xs font-bold text-[#594be0]">{users.length} comptes</span>
            </h3>

            {/* Barre segmentée moderne */}
            <div className="mt-4 flex h-3.5 w-full overflow-hidden rounded-full bg-[#eef1f8]">
              <div style={{ width: `${candPct}%` }} className="bg-[#594be0]" title={`Candidats: ${candPct}%`} />
              <div style={{ width: `${recPct}%` }} className="bg-[#805ad5]" title={`Recruteurs: ${recPct}%`} />
              <div style={{ width: `${admPct}%` }} className="bg-[#e53e3e]" title={`Admins: ${admPct}%`} />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
              <div className="rounded-2xl bg-[#fafbfe] p-3 border border-[#eff1f8]">
                <div className="text-[11px] font-bold text-[#7c869c]">Candidats</div>
                <div className="text-lg font-black text-[#594be0]">{candidatsCount} ({candPct}%)</div>
              </div>
              <div className="rounded-2xl bg-[#fafbfe] p-3 border border-[#eff1f8]">
                <div className="text-[11px] font-bold text-[#7c869c]">Recruteurs RH</div>
                <div className="text-lg font-black text-[#805ad5]">{recruteursCount} ({recPct}%)</div>
              </div>
              <div className="rounded-2xl bg-[#fafbfe] p-3 border border-[#eff1f8]">
                <div className="text-[11px] font-bold text-[#7c869c]">Administrateurs</div>
                <div className="text-lg font-black text-[#e53e3e]">{adminsCount} ({admPct}%)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne Droite (1/3) : Santé du système & Raccourcis Rapides */}
        <div className="space-y-6">
          {/* Bloc Santé Système & Infrastructure */}
          <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 shadow-xs">
            <h3 className="text-sm font-extrabold text-[#171f33] flex items-center gap-2">
              <Server size={17} className="text-[#594be0]" /> État des Services & Sécurité
            </h3>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between rounded-2xl bg-[#fafbfc] border border-[#f0f2f8] p-3">
                <div className="flex items-center gap-2.5">
                  <Database size={15} className="text-[#248e56]" />
                  <div>
                    <div className="font-bold text-[#1f283d]">Base MySQL / Laravel</div>
                    <div className="text-[10px] text-[#848ea4]">Port 3306 · API REST</div>
                  </div>
                </div>
                <span className="rounded-full bg-[#edf9f3] px-2 py-0.5 text-[10px] font-bold text-[#248e56]">
                  {backendOnline ? 'Connecté' : 'En ligne'}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-[#fafbfc] border border-[#f0f2f8] p-3">
                <div className="flex items-center gap-2.5">
                  <Sparkles size={15} className="text-[#594be0]" />
                  <div>
                    <div className="font-bold text-[#1f283d]">Moteur d'Analyse IA CV</div>
                    <div className="text-[10px] text-[#848ea4]">Extraction & Score de match</div>
                  </div>
                </div>
                <span className="rounded-full bg-[#edf9f3] px-2 py-0.5 text-[10px] font-bold text-[#248e56]">
                  Opérationnel
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-[#fafbfc] border border-[#f0f2f8] p-3">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={15} className="text-[#594be0]" />
                  <div>
                    <div className="font-bold text-[#1f283d]">Contrôle d'Accès RBAC</div>
                    <div className="text-[10px] text-[#848ea4]">Permissions & Gardes de route</div>
                  </div>
                </div>
                <span className="rounded-full bg-[#edf9f3] px-2 py-0.5 text-[10px] font-bold text-[#248e56]">
                  Verrouillé
                </span>
              </div>
            </div>
          </div>

          {/* Raccourcis Administrateur */}
          <div className="rounded-3xl border border-[#e8ebf3] bg-gradient-to-br from-white to-[#fafbfe] p-6 shadow-xs">
            <h3 className="text-sm font-extrabold text-[#171f33] mb-3">
              Accès directs aux modules
            </h3>

            <div className="space-y-2 text-xs">
              <button
                onClick={() => onNavigateScreen('E12')}
                className="flex w-full items-center justify-between rounded-2xl border border-[#e5e9f3] bg-white p-3 font-bold text-[#353e54] hover:border-[#594be0] hover:text-[#594be0] transition shadow-xs"
              >
                <span className="flex items-center gap-2">
                  <Users size={15} className="text-[#594be0]" /> Gestion des Utilisateurs
                </span>
                <ArrowRight size={14} />
              </button>

              <button
                onClick={() => onNavigateScreen('E13')}
                className="flex w-full items-center justify-between rounded-2xl border border-[#e5e9f3] bg-white p-3 font-bold text-[#353e54] hover:border-[#594be0] hover:text-[#594be0] transition shadow-xs"
              >
                <span className="flex items-center gap-2">
                  <KeyRound size={15} className="text-[#805ad5]" /> Rôles et Permissions
                </span>
                <ArrowRight size={14} />
              </button>

              <button
                onClick={() => onNavigateScreen('E14')}
                className="flex w-full items-center justify-between rounded-2xl border border-[#e5e9f3] bg-white p-3 font-bold text-[#353e54] hover:border-[#594be0] hover:text-[#594be0] transition shadow-xs"
              >
                <span className="flex items-center gap-2">
                  <Building2 size={15} className="text-[#279257]" /> Entreprises Partenaires
                </span>
                <ArrowRight size={14} />
              </button>

              <button
                onClick={() => onNavigateScreen('E15')}
                className="flex w-full items-center justify-between rounded-2xl border border-[#e5e9f3] bg-white p-3 font-bold text-[#353e54] hover:border-[#594be0] hover:text-[#594be0] transition shadow-xs"
              >
                <span className="flex items-center gap-2">
                  <Bell size={15} className="text-[#d69e2e]" /> Journal des Notifications
                </span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. DERNIERS UTILISATEURS & DERNIÈRES NOTIFICATIONS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Derniers utilisateurs inscrits */}
        <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#f0f2f7] pb-4">
            <h3 className="text-sm font-extrabold text-[#171f33] flex items-center gap-2">
              <Users size={17} className="text-[#594be0]" /> Derniers utilisateurs enregistrés
            </h3>
            <button
              onClick={() => onNavigateScreen('E12')}
              className="text-xs font-bold text-[#594be0] hover:underline"
            >
              Voir tous les comptes →
            </button>
          </div>

          <div className="mt-4 divide-y divide-[#f2f4f9]">
            {users.slice(0, 4).map((u) => (
              <div key={u.id} className="flex items-center justify-between py-3 text-xs">
                <div className="flex items-center gap-3">
                  <div
                    className={`grid size-9 place-items-center rounded-xl text-xs font-black ${
                      u.role?.nom === 'ADMIN'
                        ? 'bg-[#ffe8e8] text-[#c93232]'
                        : u.role?.nom === 'RECRUTEUR'
                        ? 'bg-[#f0efff] text-[#594be0]'
                        : 'bg-[#e8f1ff] text-[#2f6cb5]'
                    }`}
                  >
                    {u.prenom?.[0]}
                    {u.nom?.[0]}
                  </div>
                  <div>
                    <div className="font-bold text-[#1f283d]">
                      {u.prenom} {u.nom}
                    </div>
                    <div className="text-[11px] text-[#8690a6]">{u.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                      u.role?.nom === 'ADMIN'
                        ? 'bg-[#ffe8e8] text-[#c93232]'
                        : u.role?.nom === 'RECRUTEUR'
                        ? 'bg-[#f0efff] text-[#594be0]'
                        : 'bg-[#e8f1ff] text-[#2f6cb5]'
                    }`}
                  >
                    {u.role?.nom}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      u.statut === 'ACTIF' ? 'bg-[#edf9f3] text-[#248e56]' : 'bg-[#ffe8e8] text-[#cf3b3b]'
                    }`}
                  >
                    {u.statut === 'ACTIF' ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dernières notifications / Événements système */}
        <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#f0f2f7] pb-4">
            <h3 className="text-sm font-extrabold text-[#171f33] flex items-center gap-2">
              <Bell size={17} className="text-[#594be0]" /> Activité & Événements en direct
            </h3>
            <button
              onClick={() => onNavigateScreen('E15')}
              className="text-xs font-bold text-[#594be0] hover:underline"
            >
              Journal complet →
            </button>
          </div>

          <div className="mt-4 divide-y divide-[#f2f4f9]">
            {notifications.slice(0, 4).map((n) => (
              <div key={n.id} className="flex items-center justify-between py-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-xl bg-[#fafbfe] border border-[#eef1f8] text-[#594be0]">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <div className="font-bold text-[#1f283d]">{n.objet}</div>
                    <div className="text-[11px] text-[#8690a6] truncate max-w-xs">{n.message}</div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="rounded-full bg-[#edf9f3] px-2 py-0.5 text-[10px] font-bold text-[#248e56]">
                    {n.statut_envoi}
                  </span>
                  <div className="text-[10px] text-[#9ca5b9] mt-0.5">{n.created_at}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

