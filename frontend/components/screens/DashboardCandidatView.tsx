'use client';

import React, { useMemo } from 'react';
import {
  ArrowRight,
  Briefcase,
  Calendar,
  ChevronRight,
  Clock,
  FileCheck2,
  Heart,
  MapPin,
  MessageSquare,
  Search,
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
                  Disponibilité : <strong className="text-[#1a2233]">{dispoState}</strong>
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
      {/* 3. PIPELINE D'AVANCEMENT GLOBAL DES DOSSIERS                      */}
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
