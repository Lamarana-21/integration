'use client';

import React, { useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  FileCheck2,
  FileText,
  Heart,
  MapPin,
  MessageSquare,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Candidat, Candidature, Conversation, Offre, User, isJobFavorited } from '@/lib/types';

interface DashboardCandidatViewProps {
  currentUser: User | null;
  candidat: Candidat;
  candidatures: Candidature[];
  offres: Offre[];
  favorisOffresIds: string[];
  conversations: Conversation[];
  onNavigateScreen: (screen: string) => void;
  onSelectOffre: (offre: Offre) => void;
  onToggleFavori: (offreId: string) => void;
  onOpenPostuler: (offre: Offre) => void;
}

export function DashboardCandidatView({
  currentUser,
  candidat,
  candidatures,
  offres,
  favorisOffresIds,
  conversations,
  onNavigateScreen,
}: DashboardCandidatViewProps) {
  const dispoState = candidat.disponibilite || 'Immédiate';

  // ── Données filtrées strictement pour le candidat connecté ──────────────
  const myCandidatures = useMemo(() => {
    const curId = currentUser?.id;
    const curEmail = currentUser?.email?.toLowerCase().trim();
    const isAmina = curEmail === 'amina@mail.example' || curId === 'u-cand-amina';

    return candidatures.filter(
      (c) =>
        c.candidat_id === candidat.id ||
        c.candidat_id === curId ||
        c.candidat?.utilisateur_id === curId ||
        (isAmina && (c.candidat_id === 'cand-amina' || c.candidat_id === 'u-cand-amina'))
    );
  }, [candidatures, candidat, currentUser]);

  const myFavorisOffres = useMemo(() => {
    return offres.filter((o) => isJobFavorited(o.id, favorisOffresIds));
  }, [offres, favorisOffresIds]);

  const myConversations = useMemo(() => {
    if (!currentUser) return [];
    const curId = currentUser.id;
    const candId = candidat.id;
    return conversations.filter(
      (c) =>
        (c.candidat_id === curId || (candId && c.candidat_id === candId)) &&
        !['conv-1', 'conv-2', 'conv-3', 'conv-4', 'conv-5'].includes(c.id)
    );
  }, [conversations, currentUser, candidat]);

  // ── Métriques clés calculées ───────────────────────────────────────────
  const totalCandidatures = myCandidatures.length;
  const enExamenCount = myCandidatures.filter(
    (c) => c.statut === 'RECUE' || c.statut === 'EN_EXAMEN'
  ).length;
  const entretiensList = useMemo(() => {
    return myCandidatures.filter(
      (c) => c.statut === 'PRESELECTIONNEE' || c.statut === 'ENTRETIEN' || Boolean(c.date_entretien)
    );
  }, [myCandidatures]);
  const entretiensCount = entretiensList.length;
  const accepteesCount = myCandidatures.filter((c) => c.statut === 'ACCEPTEE').length;

  const publishedJobs = useMemo(() => {
    return offres.filter((o) => o.statut === 'PUBLIEE');
  }, [offres]);

  const unreadMessagesCount = myConversations.reduce((acc, c) => acc + (c.non_lus_candidat || 0), 0);

  // ── Période du diagramme interactif (7J, 30J, 6M) ──────────────────────
  const [chartTimeframe, setChartTimeframe] = useState<'7J' | '30J' | '6M'>('6M');

  // Données dynamiques selon la période sélectionnée
  const chartDatasets = useMemo(() => {
    const totalCount = myCandidatures.length;

    if (chartTimeframe === '7J') {
      const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
      const baseCand = [1, 2, 1, 3, 2, 1, 0];
      const baseInterviews = [0, 1, 0, 1, 2, 0, 0];
      return {
        subtitle: 'Candidatures transmises et retours RH / entretiens des 7 derniers jours',
        data: days.map((day, i) => ({
          label: day,
          candidatures: Math.max(0, Math.round(baseCand[i] * (totalCount > 0 ? (totalCount / 6) + 0.3 : 1))),
          reponses: Math.max(0, Math.round(baseInterviews[i] * (totalCount > 0 ? (totalCount / 8) + 0.3 : 1))),
          active: i === 3,
        })),
      };
    }

    if (chartTimeframe === '30J') {
      const weeks = ['Semaine 1', 'Semaine 2', 'Semaine 3', 'Semaine 4'];
      const baseCand = [2, 3, 1, 4];
      const baseInterviews = [1, 2, 0, 2];
      return {
        subtitle: 'Activité globale et avancée de vos dossiers sur les 4 dernières semaines',
        data: weeks.map((w, i) => ({
          label: w,
          candidatures: Math.max(1, Math.round(baseCand[i] * (totalCount > 0 ? (totalCount / 7) + 0.4 : 1))),
          reponses: Math.max(0, Math.round(baseInterviews[i] * (totalCount > 0 ? (totalCount / 9) + 0.3 : 1))),
          active: i === 3,
        })),
      };
    }

    // Par défaut '6M'
    const months = [
      { label: 'Mai', cand: 1, resp: 0 },
      { label: 'Juin', cand: 2, resp: 1 },
      { label: 'Juil.', cand: 1, resp: 1 },
      { label: 'Août', cand: 3, resp: 2 },
      { label: 'Sept.', cand: 2, resp: 1 },
      { label: 'Oct.', cand: 6, resp: 3, active: true },
    ];
    return {
      subtitle: 'Évolution mensuelle de vos candidatures déposées et retours des recruteurs',
      data: months.map((m) => ({
        label: m.label,
        candidatures: Math.max(1, Math.round(m.cand * (totalCount > 0 ? (totalCount / 6) + 0.4 : 1))),
        reponses: Math.max(0, Math.round(m.resp * (totalCount > 0 ? (totalCount / 8) + 0.3 : 1))),
        active: m.active,
      })),
    };
  }, [chartTimeframe, myCandidatures.length]);

  const maxVal = Math.max(...chartDatasets.data.map((d) => d.candidatures), 1);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 space-y-8 font-sans">
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 1. HERO BANNER CANDIDAT AVEC STATUT ET ACTION RAPIDE              */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-3xl border border-[#e8ebf3] bg-gradient-to-br from-white via-[#fafbfe] to-[#f2efff] p-6 sm:p-8 shadow-xs">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-[#6253e8]/5 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex items-start gap-4">
            {/* Avatar Candidat */}
            <div className="relative">
              {candidat.avatar_url ? (
                <img
                  src={candidat.avatar_url}
                  alt={`${candidat.prenom} ${candidat.nom}`}
                  className="size-16 rounded-2xl object-cover border-2 border-white shadow-md"
                />
              ) : (
                <div className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-[#6253e8] to-[#4838d2] text-xl font-black text-white shadow-md">
                  {candidat.prenom?.[0] || 'C'}
                  {candidat.nom?.[0] || ''}
                </div>
              )}
              <span
                className="absolute -bottom-1 -right-1 size-4 rounded-full border-2 border-white bg-[#10b981]"
                title="En recherche active"
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-[#171f33]">
                  Bonjour, {candidat.prenom || 'Candidat'} 👋
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf5] px-3 py-0.5 text-xs font-bold text-[#065f46] border border-[#a7f3d0]">
                  <span className="size-1.5 rounded-full bg-[#10b981] animate-pulse" />
                  En recherche active
                </span>
              </div>

              <p className="mt-1 text-sm font-semibold text-[#594be0]">
                {candidat.titre || 'Développeur Web Junior Full Stack'}
              </p>

              <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs text-[#717a92]">
                <span className="flex items-center gap-1 font-medium">
                  <MapPin size={13} className="text-[#9aa2b5]" />
                  {candidat.ville || 'Tunis'}, {candidat.pays || 'Tunisie'}
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <Clock size={13} className="text-[#9aa2b5]" />
                  Disponibilité : <strong className="text-[#1a2233]">{dispoState.replace(/T.*Z$/, '')}</strong>
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <Briefcase size={13} className="text-[#9aa2b5]" />
                  Mode : <strong className="text-[#1a2233]">{candidat.teletravail_souhaite || 'Hybride'}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Bouton d'accès direct aux offres (sans le bouton Mon CV Dynamique) */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onNavigateScreen('E1')}
              className="flex items-center gap-2 rounded-2xl bg-[#594be0] px-5 py-3 text-xs font-bold text-white shadow-md shadow-[#594be0]/25 hover:bg-[#4739d2] transition"
            >
              <Search size={15} />
              <span>Explorer les offres ({publishedJobs.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 2. CARTES D'INDICATEURS CLÉS (NAVIGATION DIRECTE)                 */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 : Candidatures envoyées */}
        <div
          onClick={() => onNavigateScreen('E5')}
          className="group cursor-pointer rounded-3xl border border-[#e8ebf3] bg-white p-5 shadow-xs hover:border-[#594be0] hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7d869e]">Candidatures envoyées</span>
            <div className="grid size-10 place-items-center rounded-2xl bg-[#f0efff] text-[#594be0] group-hover:bg-[#594be0] group-hover:text-white transition">
              <FileCheck2 size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#171f33]">{totalCandidatures}</span>
            <span className="text-xs font-semibold text-[#8690a6]">au total</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-[#594be0]">
            <span>Afficher les dossiers</span>
            <ArrowRight size={13} className="group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* KPI 2 : Entretiens décrochés */}
        <div
          onClick={() => onNavigateScreen('E_ENTRETIENS')}
          className="group cursor-pointer rounded-3xl border border-[#bbf7d0] bg-[#f7fdf9] p-5 shadow-xs hover:border-[#10b981] hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#166534]">Entretiens planifiés</span>
            <div className="grid size-10 place-items-center rounded-2xl bg-[#dcfce7] text-[#15803d] group-hover:bg-[#16a34a] group-hover:text-white transition">
              <Calendar size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#14532d]">{entretiensCount}</span>
            <span className="text-xs font-semibold text-[#15803d]">convocation(s)</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-[#15803d]">
            <span>Gérer les convocations</span>
            <ArrowRight size={13} className="group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* KPI 3 : Offres favorites */}
        <div
          onClick={() => onNavigateScreen('E_FAVORIS')}
          className="group cursor-pointer rounded-3xl border border-[#fecdd3] bg-[#fffbfb] p-5 shadow-xs hover:border-[#f43f5e] hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#9f1239]">Offres favorites</span>
            <div className="grid size-10 place-items-center rounded-2xl bg-[#ffe4e6] text-[#e11d48] group-hover:bg-[#e11d48] group-hover:text-white transition">
              <Heart size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#881337]">{myFavorisOffres.length}</span>
            <span className="text-xs font-semibold text-[#be123c]">enregistrées</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-[#e11d48]">
            <span>Consulter les favoris</span>
            <ArrowRight size={13} className="group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* KPI 4 : Messagerie Entreprises */}
        <div
          onClick={() => onNavigateScreen('E_MESSAGES')}
          className="group cursor-pointer rounded-3xl border border-[#e8ebf3] bg-white p-5 shadow-xs hover:border-[#594be0] hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7d869e]">Messagerie Entreprises</span>
            <div className="relative grid size-10 place-items-center rounded-2xl bg-[#f0efff] text-[#594be0] group-hover:bg-[#594be0] group-hover:text-white transition">
              <MessageSquare size={18} />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-[#ef4444] text-[9px] font-black text-white">
                  {unreadMessagesCount}
                </span>
              )}
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#171f33]">{myConversations.length}</span>
            <span className="text-xs font-semibold text-[#8690a6]">discussion(s)</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-[#594be0]">
            <span>Ouvrir la messagerie</span>
            <ArrowRight size={13} className="group-hover:translate-x-1 transition" />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 3. DIAGRAMME D'ACTIVITÉ DYNAMIQUE & FLUX (STYLE ADMIN MODERNE)     */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Colonne Gauche (2/3) : Diagramme interactif avec sélecteur */}
        <div className="lg:col-span-2 rounded-3xl border border-[#e8ebf3] bg-white p-6 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center border-b border-[#f1f5f9] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-lg bg-[#eef2ff] text-[#594be0]">
                  <Activity size={16} />
                </span>
                <h2 className="text-sm font-extrabold text-[#171f33]">
                  Dynamique de vos candidatures & retours
                </h2>
              </div>
              <p className="text-[11px] text-[#8c94a9] mt-0.5">
                {chartDatasets.subtitle}
              </p>
            </div>

            {/* Sélecteur de période dynamique comme l'Admin */}
            <div className="flex items-center gap-1 rounded-xl bg-[#f5f6fa] p-1 text-[11px] font-bold">
              {(['7J', '30J', '6M'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setChartTimeframe(t)}
                  className={`rounded-lg px-3 py-1 transition ${
                    chartTimeframe === t
                      ? 'bg-white text-[#594be0] shadow-xs font-black'
                      : 'text-[#6b758b] hover:text-[#171f33]'
                  }`}
                >
                  {t === '6M' ? '6 derniers mois' : t}
                </button>
              ))}
            </div>
          </div>

          {/* Histogramme interactif à double barres */}
          <div className="mt-6">
            <div className="flex h-48 items-end justify-between gap-2 sm:gap-4 px-2 pt-4 pb-2">
              {chartDatasets.data.map((item, idx) => {
                const heightCand = Math.max(14, Math.min(100, Math.round((item.candidatures / maxVal) * 100)));
                const heightResp = Math.max(8, Math.min(100, Math.round((item.reponses / maxVal) * 100)));

                return (
                  <div key={idx} className="group relative flex flex-1 flex-col items-center gap-2 h-full justify-end">
                    {/* Chiffre au survol */}
                    <div className="text-[11px] font-black text-[#334155] group-hover:text-[#594be0] group-hover:scale-110 transition-transform">
                      {item.candidatures}
                    </div>

                    {/* Double barre comme l'Admin */}
                    <div className="flex w-full items-end justify-center gap-1.5 h-36">
                      {/* Candidatures envoyées */}
                      <div
                        style={{ height: `${heightCand}%` }}
                        title={`Candidatures envoyées : ${item.candidatures}`}
                        className={`w-full max-w-[16px] rounded-t-lg transition-all duration-300 group-hover:brightness-110 ${
                          item.active
                            ? 'bg-gradient-to-t from-[#594be0] to-[#7f73f2] shadow-md shadow-[#594be0]/30 ring-2 ring-[#594be0]/20'
                            : 'bg-gradient-to-t from-[#594be0] to-[#7f73f2]'
                        }`}
                      />
                      {/* Retours RH & convocations */}
                      <div
                        style={{ height: `${heightResp}%` }}
                        title={`Retours RH / convocations : ${item.reponses}`}
                        className="w-full max-w-[16px] rounded-t-lg bg-[#b4adff] transition-all duration-300 group-hover:brightness-110"
                      />
                    </div>

                    <span className={`text-[11px] font-bold ${item.active ? 'text-[#594be0] font-black' : 'text-[#8690a6]'}`}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Légende */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-5 text-xs border-t border-[#f4f6fa] pt-3 text-[#647087]">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-sm bg-[#594be0]" /> Candidatures envoyées
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-sm bg-[#b4adff]" /> Retours RH & Entretiens
              </div>
            </div>
          </div>
        </div>

        {/* Colonne Droite (1/3) : Synthèse d'impact & Taux de qualification */}
        <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
              <h2 className="text-sm font-extrabold text-[#171f33] flex items-center gap-2">
                <Sparkles size={16} className="text-[#7c3aed]" /> Performance de profil
              </h2>
              <span className="rounded-full bg-[#f5f3ff] px-2.5 py-0.5 text-[10px] font-black text-[#7c3aed]">
                IA Talenta
              </span>
            </div>
            <p className="text-[11px] text-[#8c94a9] mt-1.5">
              Évaluation automatique de l'attractivité de votre profil face aux offres ciblées.
            </p>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-[#faf9fe] to-[#f3efff] p-4 border border-[#e9e3ff] text-center space-y-2">
            <div className="text-3xl font-black text-[#594be0]">88%</div>
            <div className="text-xs font-bold text-[#1e2538]">Taux de correspondance moyen</div>
            <p className="text-[11px] text-[#78829c]">
              Vos compétences techniques correspondent à {publishedJobs.length} opportunités actuellement actives.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigateScreen('E6_CV')}
              className="w-full flex items-center justify-between rounded-2xl border border-[#e2e5ee] bg-[#f8fafd] p-3 text-xs font-bold text-[#353e54] hover:border-[#594be0] hover:bg-white transition"
            >
              <span className="flex items-center gap-2">
                <FileText size={15} className="text-[#594be0]" /> Mes CV en ligne
              </span>
              <ArrowRight size={13} className="text-[#8690a6]" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateScreen('E1')}
              className="w-full flex items-center justify-between rounded-2xl border border-[#e2e5ee] bg-[#f8fafd] p-3 text-xs font-bold text-[#353e54] hover:border-[#594be0] hover:bg-white transition"
            >
              <span className="flex items-center gap-2">
                <Briefcase size={15} className="text-[#594be0]" /> Consulter les nouvelles offres
              </span>
              <ArrowRight size={13} className="text-[#8690a6]" />
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 4. PIPELINE D'AVANCEMENT GLOBAL DES DOSSIERS                      */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <section className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#f0f2f7] pb-4">
          <div>
            <h2 className="text-base font-extrabold text-[#171f33] flex items-center gap-2">
              <TrendingUp size={18} className="text-[#594be0]" /> Entonnoir & Pipeline de vos candidatures
            </h2>
            <p className="text-xs text-[#7d869e] mt-0.5">
              Suivez l'avancement global de vos candidatures à chaque étape du recrutement.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateScreen('E5')}
            className="text-xs font-bold text-[#594be0] hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Voir l'ensemble ({totalCandidatures})</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* 4 Étapes interactives */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Étape 1 : Dépôt */}
          <button
            type="button"
            onClick={() => onNavigateScreen('E5')}
            className="rounded-2xl border border-[#e2e5ee] bg-[#fafbfc] p-4 text-left sm:text-center space-y-1 transition hover:border-[#594be0] hover:bg-white"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#8b95a8]">
              Étape 1 · Dépôt
            </div>
            <div className="text-2xl font-black text-[#171f33]">{totalCandidatures}</div>
            <div className="text-[11px] font-medium text-[#6c768c]">Candidatures transmises</div>
          </button>

          {/* Étape 2 : En examen */}
          <button
            type="button"
            onClick={() => onNavigateScreen('E5')}
            className="rounded-2xl border border-[#dbeafe] bg-[#f8fbff] p-4 text-left sm:text-center space-y-1 transition hover:border-[#2563eb] hover:bg-white"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#2563eb]">
              Étape 2 · En examen
            </div>
            <div className="text-2xl font-black text-[#1e40af]">{enExamenCount}</div>
            <div className="text-[11px] font-medium text-[#2563eb]">En cours d'étude RH</div>
          </button>

          {/* Étape 3 : Entretiens */}
          <button
            type="button"
            onClick={() => onNavigateScreen('E_ENTRETIENS')}
            className="rounded-2xl border border-[#bbf7d0] bg-[#f7fdf9] p-4 text-left sm:text-center space-y-1 transition hover:border-[#16a34a] hover:bg-white"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#16a34a]">
              Étape 3 · Entretien
            </div>
            <div className="text-2xl font-black text-[#15803d]">{entretiensCount}</div>
            <div className="text-[11px] font-medium text-[#16a34a]">Convocations reçues</div>
          </button>

          {/* Étape 4 : Décision */}
          <button
            type="button"
            onClick={() => onNavigateScreen('E5')}
            className="rounded-2xl border border-[#fef08a] bg-[#fffdf0] p-4 text-left sm:text-center space-y-1 transition hover:border-[#ca8a04] hover:bg-white"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#ca8a04]">
              Étape 4 · Décision
            </div>
            <div className="text-2xl font-black text-[#854d0e]">{accepteesCount}</div>
            <div className="text-[11px] font-medium text-[#a16207]">Propositions retenues</div>
          </button>
        </div>
      </section>
    </div>
  );
}
