'use client';

import React, { useMemo } from 'react';
import {
  ArrowRight,
  Award,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  Heart,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  Search,
  Sparkles,
  TrendingUp,
  UserCheck2,
  Zap,
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
  onSelectOffre,
  onToggleFavori,
  onOpenPostuler,
}: DashboardCandidatViewProps) {
  // ── 1. Données filtrées pour le candidat connecté ──────────────────────────
  const myCandidatures = useMemo(() => {
    const curId = currentUser?.id;
    return candidatures.filter(
      (c) =>
        c.candidat_id === candidat.id ||
        c.candidat_id === curId ||
        c.candidat?.utilisateur_id === curId ||
        (curId === 'u-cand-amina' && (c.candidat_id === 'cand-amina' || c.candidat_id === 'u-cand-amina'))
    );
  }, [candidatures, candidat, currentUser]);

  const myFavorisOffres = useMemo(() => {
    return offres.filter((o) => isJobFavorited(o.id, favorisOffresIds));
  }, [offres, favorisOffresIds]);

  const myConversations = useMemo(() => {
    const curId = currentUser?.id;
    const curName = `${candidat.prenom} ${candidat.nom}`.toLowerCase().trim();
    return conversations.filter(
      (c) =>
        c.candidat_id === curId ||
        c.candidat_id === 'u-cand-amina' ||
        c.candidat_nom.toLowerCase().trim() === curName
    );
  }, [conversations, currentUser, candidat]);

  // ── 2. Métriques clés calculées ───────────────────────────────────────────
  const totalCandidatures = myCandidatures.length;
  const enExamenCount = myCandidatures.filter(
    (c) => c.statut === 'RECUE' || c.statut === 'EN_EXAMEN'
  ).length;
  const entretiensCount = myCandidatures.filter(
    (c) => c.statut === 'PRESELECTIONNEE'
  ).length;
  const accepteesCount = myCandidatures.filter((c) => c.statut === 'ACCEPTEE').length;

  // Calcul du taux de complétion du profil
  const profileCompletion = useMemo(() => {
    let score = 20; // Nom et prénom de base
    if (candidat.titre) score += 15;
    if (candidat.telephone) score += 10;
    if (candidat.ville) score += 10;
    if (candidat.competences && candidat.competences.length > 0) score += 15;
    if (candidat.experiences && candidat.experiences.length > 0) score += 15;
    if (candidat.formations && candidat.formations.length > 0) score += 15;
    return Math.min(score, 100);
  }, [candidat]);

  // ── 3. Offres disponibles et calcul du matching IA ───────────────────────────
  const publishedJobs = useMemo(() => {
    return offres.filter((o) => o.statut === 'PUBLIEE');
  }, [offres]);

  const recommendedJobs = useMemo(() => {
    const candidateSkills = (candidat.competences || []).map((s) => s.toLowerCase());

    return publishedJobs
      .map((o) => {
        const requiredSkills = o.competences_requises || [];
        const matched = requiredSkills.filter((req) =>
          candidateSkills.some((cand) => cand.includes(req.toLowerCase()) || req.toLowerCase().includes(cand))
        );

        let matchRate = 75;
        if (requiredSkills.length > 0) {
          matchRate = Math.min(
            98,
            Math.max(70, Math.round((matched.length / requiredSkills.length) * 100))
          );
        }

        return {
          ...o,
          matchRate,
          matchedSkills: matched,
        };
      })
      .sort((a, b) => b.matchRate - a.matchRate);
  }, [publishedJobs, candidat]);

  const unreadMessagesCount = myConversations.reduce((acc, c) => acc + (c.non_lus_candidat || 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 space-y-8 font-sans">
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 1. HERO BANNER CANDIDAT AVEC STATUT ET ACTIONS RAPIDES            */}
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
                  Disponibilité : <strong className="text-[#1a2233]">{candidat.disponibilite || 'Immédiate'}</strong>
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <Briefcase size={13} className="text-[#9aa2b5]" />
                  Mode : <strong className="text-[#1a2233]">{candidat.teletravail_souhaite || 'Hybride'}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Boutons d'accès directs */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onNavigateScreen('E1')}
              className="flex items-center gap-2 rounded-2xl bg-[#594be0] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#594be0]/25 hover:bg-[#4739d2] transition"
            >
              <Search size={15} />
              <span>Explorer les offres ({publishedJobs.length})</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateScreen('E6_CV')}
              className="flex items-center gap-2 rounded-2xl border border-[#dde1ee] bg-white px-4 py-2.5 text-xs font-bold text-[#454e66] hover:bg-[#f6f7fb] hover:border-[#ccd2e2] transition shadow-2xs"
            >
              <FileText size={15} className="text-[#594be0]" />
              <span>Mon CV Dynamique</span>
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 2. CARTES D'INDICATEURS CLÉS (KPIS CANDIDAT)                      */}
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
            <span>Suivre mes dossiers</span>
            <ArrowRight size={13} className="group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* KPI 2 : Entretiens décrochés */}
        <div
          onClick={() => onNavigateScreen('E5')}
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
            <span className="text-xs font-semibold text-[#15803d]">sélection(s) RH</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-[#15803d]">
            <span>Voir les convocations</span>
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

        {/* KPI 4 : Messages & Réponses recruteurs */}
        <div
          onClick={() => onNavigateScreen('E_MESSAGES')}
          className="group cursor-pointer rounded-3xl border border-[#e8ebf3] bg-white p-5 shadow-xs hover:border-[#594be0] hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7d869e]">Messagerie Recruteurs</span>
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
            <span className="text-xs font-semibold text-[#8690a6]">fil(s) de discussion</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-[#594be0]">
            <span>Ouvrir les échanges</span>
            <ArrowRight size={13} className="group-hover:translate-x-1 transition" />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 3. PIPELINE VISUEL D'AVANCEMENT DES CANDIDATURES                  */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <section className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#f0f2f7] pb-4">
          <div>
            <h2 className="text-base font-extrabold text-[#171f33] flex items-center gap-2">
              <TrendingUp size={18} className="text-[#594be0]" /> Entonnoir & Pipeline de vos candidatures
            </h2>
            <p className="text-xs text-[#7d869e] mt-0.5">
              Suivez l'avancée de vos dossiers depuis l'envoi jusqu'aux entretiens avec les recruteurs.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateScreen('E5')}
            className="text-xs font-bold text-[#594be0] hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Voir le détail des {totalCandidatures} candidatures</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Étapes du pipeline */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Étape 1 : Envoyée */}
          <div className="rounded-2xl border border-[#e2e5ee] bg-[#fafbfc] p-4 text-center space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#8b95a8]">
              Étape 1 · Dépôt
            </div>
            <div className="text-2xl font-black text-[#171f33]">{totalCandidatures}</div>
            <div className="text-[11px] font-medium text-[#6c768c]">Candidatures transmises</div>
          </div>

          {/* Étape 2 : En examen ATS & IA */}
          <div className="rounded-2xl border border-[#dbeafe] bg-[#f0f7ff] p-4 text-center space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#2563eb]">
              Étape 2 · En examen
            </div>
            <div className="text-2xl font-black text-[#1e40af]">{enExamenCount}</div>
            <div className="text-[11px] font-medium text-[#2563eb]">En cours d'étude RH</div>
          </div>

          {/* Étape 3 : Entretiens */}
          <div className="rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] p-4 text-center space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#16a34a]">
              Étape 3 · Entretien
            </div>
            <div className="text-2xl font-black text-[#15803d]">{entretiensCount}</div>
            <div className="text-[11px] font-medium text-[#16a34a]">Convocations reçues</div>
          </div>

          {/* Étape 4 : Proposition / Finalisée */}
          <div className="rounded-2xl border border-[#fef08a] bg-[#fefce8] p-4 text-center space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#ca8a04]">
              Étape 4 · Décision
            </div>
            <div className="text-2xl font-black text-[#854d0e]">{accepteesCount}</div>
            <div className="text-[11px] font-medium text-[#a16207]">Propositions retenues</div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 4. GRILLE 2 COLONNES : RECOMMANDATIONS IA & COMPLÉTION DU PROFIL   */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* COLONNE GAUCHE : OFFRES RECOMMANDÉES PAR L'IA */}
        <section className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#f0f2f7] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-[#6355e8] to-[#483ad3] text-white">
                  <Sparkles size={14} />
                </span>
                <h2 className="text-base font-extrabold text-[#171f33]">
                  Offres d’emploi disponibles
                </h2>
                <span className="rounded-full bg-[#f0efff] px-2.5 py-0.5 text-xs font-black text-[#594be0]">
                  {publishedJobs.length} disponible(s)
                </span>
              </div>
              <p className="text-xs text-[#7d869e] mt-1">
                Toutes les offres d'emploi actives sur la plateforme avec calcul de correspondance IA pour votre profil.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateScreen('E1')}
              className="text-xs font-bold text-[#594be0] hover:underline shrink-0"
            >
              Explorer les {publishedJobs.length} offres →
            </button>
          </div>

          <div className="space-y-3.5">
            {recommendedJobs.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8d96ab]">
                Aucune offre publiée pour le moment.
              </div>
            ) : (
              recommendedJobs.map((offre) => {
                const isFav = isJobFavorited(offre.id, favorisOffresIds);

                return (
                  <div
                    key={offre.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#e9ecf4] bg-[#fafbfc] p-4 hover:border-[#594be0] hover:bg-white transition"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-[#eef2ff] px-2 py-0.5 text-[10px] font-extrabold text-[#4f46e5]">
                          {offre.matchRate}% Match IA
                        </span>
                        <span className="text-xs font-extrabold text-[#1a2233] truncate">
                          {offre.titre}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#717a92]">
                        <span className="font-semibold text-[#594be0]">
                          {offre.entreprise?.nom || 'Entreprise partenaire'}
                        </span>
                        <span>•</span>
                        <span>{offre.lieu || offre.entreprise?.ville || 'Tunis'}</span>
                        <span>•</span>
                        <span className="font-medium text-[#171f33]">{offre.type_contrat || 'CDI'}</span>
                      </div>

                      {/* Badges de compétences correspondantes */}
                      {offre.competences_requises && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {offre.competences_requises.slice(0, 3).map((comp, idx) => (
                            <span
                              key={idx}
                              className="rounded-md bg-white border border-[#e2e5ee] px-2 py-0.5 text-[10px] font-medium text-[#5c657a]"
                            >
                              {comp}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions d'interaction directe */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => onToggleFavori(offre.id)}
                        className={`grid size-9 place-items-center rounded-xl border transition ${
                          isFav
                            ? 'border-[#fecdd3] bg-[#fff1f2] text-[#e11d48]'
                            : 'border-[#dfe3ec] bg-white text-[#868fa3] hover:text-[#e11d48]'
                        }`}
                        title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                      >
                        <Heart size={15} className={isFav ? 'fill-current' : ''} />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectOffre(offre);
                        }}
                        className="rounded-xl border border-[#dfe3ec] bg-white px-3 py-2 text-xs font-bold text-[#444c60] hover:bg-[#f6f7fb] transition"
                      >
                        Détails
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenPostuler(offre)}
                        className="rounded-xl bg-[#594be0] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#4739d2] transition"
                      >
                        Postuler
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* COLONNE DROITE : COMPLÉTION DU PROFIL & CV DYNAMIQUE */}
        <section className="space-y-6">
          {/* Carte Complétion Profil */}
          <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#171f33] flex items-center gap-2">
                <Award size={16} className="text-[#594be0]" /> Complétion du profil
              </h3>
              <span className="rounded-full bg-[#f0efff] px-2.5 py-0.5 text-xs font-black text-[#594be0]">
                {profileCompletion}%
              </span>
            </div>

            <p className="text-xs text-[#717a92]">
              Un profil complet augmente de <strong>+70%</strong> la probabilité d'être contacté directement par les recruteurs.
            </p>

            {/* Barre de progression */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#f0f2f7]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#594be0] to-[#7f73ff] transition-all duration-500"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>

            <div className="space-y-2 pt-1 text-xs">
              <div className="flex items-center justify-between text-[#4d556c]">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 size={14} className="text-[#10b981]" /> Identité & Coordonnées
                </span>
                <span className="font-bold text-[#10b981]">100%</span>
              </div>
              <div className="flex items-center justify-between text-[#4d556c]">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 size={14} className="text-[#10b981]" /> Compétences techniques
                </span>
                <span className="font-bold text-[#10b981]">Validé</span>
              </div>
              <div className="flex items-center justify-between text-[#4d556c]">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 size={14} className="text-[#10b981]" /> CV Dynamique & ATS
                </span>
                <span className="font-bold text-[#10b981]">Actif</span>
              </div>
              <div className="flex items-center justify-between text-[#4d556c]">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 size={14} className="text-[#10b981]" /> Préférences de salaire
                </span>
                <span className="font-bold text-[#10b981]">Renseigné</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateScreen('E6_PROFIL')}
              className="mt-2 w-full rounded-2xl border border-[#dde1ee] bg-[#fafbfc] py-2.5 text-xs font-bold text-[#4c546b] hover:bg-white hover:border-[#594be0] hover:text-[#594be0] transition shadow-2xs"
            >
              Modifier mon profil
            </button>
          </div>

          {/* Carte Raccourci CV Dynamique */}
          <div className="rounded-3xl border border-[#e0ddfc] bg-gradient-to-br from-[#f8f7ff] to-white p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-xl bg-[#594be0] text-white">
                <FileText size={17} />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-[#171f33]">Votre CV Dynamique</h4>
                <p className="text-[11px] text-[#788198]">Généré en temps réel pour l'analyse IA</p>
              </div>
            </div>

            <p className="text-xs text-[#525a70] leading-relaxed">
              Votre CV dynamique est mis à jour en continu à partir des compétences et expériences de votre profil.
            </p>

            <button
              type="button"
              onClick={() => onNavigateScreen('E6_CV')}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#594be0] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#4739d2] transition"
            >
              <span>Consulter / Exporter mon CV</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </section>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 5. DERNIÈRES CANDIDATURES ET DERNIERS MESSAGES EN 2 BLOCS         */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* BLOC 1 : MES CANDIDATURES RÉCENTES */}
        <section className="rounded-3xl border border-[#e8ebf3] bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#f0f2f7] pb-3">
            <h3 className="text-sm font-extrabold text-[#171f33] flex items-center gap-2">
              <FileCheck2 size={16} className="text-[#594be0]" /> Candidatures récentes
            </h3>
            <button
              type="button"
              onClick={() => onNavigateScreen('E5')}
              className="text-xs font-bold text-[#594be0] hover:underline"
            >
              Voir tout ({totalCandidatures}) →
            </button>
          </div>

          <div className="space-y-2.5">
            {myCandidatures.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#8c96ac]">
                Vous n'avez pas encore envoyé de candidature.{' '}
                <button
                  type="button"
                  onClick={() => onNavigateScreen('E1')}
                  className="font-bold text-[#594be0] underline"
                >
                  Découvrir les offres
                </button>
              </div>
            ) : (
              myCandidatures.slice(0, 3).map((cand) => (
                <div
                  key={cand.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[#edf0f7] bg-[#fafbfc] p-3.5 hover:bg-white transition"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-black text-[#1a2233] truncate">
                      {cand.offre?.titre || 'Développeur Web Junior'}
                    </div>
                    <div className="text-[11px] text-[#717a92] mt-0.5">
                      {cand.offre?.entreprise?.nom || 'Entreprise partenaire'} • Déposée le {cand.created_at}
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
                      cand.statut === 'PRESELECTIONNEE'
                        ? 'bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]'
                        : cand.statut === 'ACCEPTEE'
                        ? 'bg-[#fefce8] text-[#854d0e] border border-[#fef08a]'
                        : 'bg-[#eff6ff] text-[#1e40af] border border-[#bfdbfe]'
                    }`}
                  >
                    {cand.statut === 'PRESELECTIONNEE'
                      ? 'Présélectionnée / Entretien'
                      : cand.statut === 'RECUE'
                      ? 'Reçue / En examen'
                      : cand.statut}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* BLOC 2 : DERNIERS ÉCHANGES RECRUTEURS */}
        <section className="rounded-3xl border border-[#e8ebf3] bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#f0f2f7] pb-3">
            <h3 className="text-sm font-extrabold text-[#171f33] flex items-center gap-2">
              <MessageSquare size={16} className="text-[#594be0]" /> Messages & Échanges recruteurs
            </h3>
            <button
              type="button"
              onClick={() => onNavigateScreen('E_MESSAGES')}
              className="text-xs font-bold text-[#594be0] hover:underline"
            >
              Ouvrir la messagerie →
            </button>
          </div>

          <div className="space-y-2.5">
            {myConversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#8c96ac]">
                Aucune conversation active pour le moment.
              </div>
            ) : (
              myConversations.slice(0, 3).map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => onNavigateScreen('E_MESSAGES')}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-[#edf0f7] bg-[#fafbfc] p-3.5 hover:bg-white hover:border-[#594be0] cursor-pointer transition"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#6253e8] to-[#4838d2] text-xs font-bold text-white shrink-0">
                      {conv.recruteur_nom[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-[#1a2233] truncate">
                        {conv.recruteur_nom}{' '}
                        <span className="text-[11px] font-semibold text-[#594be0]">
                          ({conv.entreprise_nom})
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-[#697288] truncate">
                        {conv.dernier_message}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] text-[#9aa2b5] shrink-0 font-medium mt-0.5">
                    {conv.updated_at.split(' ')[1] || conv.updated_at}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
