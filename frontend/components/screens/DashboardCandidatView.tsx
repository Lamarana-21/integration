'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Award,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  Heart,
  HelpCircle,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  Search,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck2,
  Video,
  X,
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

type TabType = 'CANDIDATURES' | 'ENTRETIENS' | 'MESSAGERIE' | 'ANALYSE';

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
  // ── 1. État dynamique du tableau de bord ──────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabType>('CANDIDATURES');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dispoState, setDispoState] = useState<string>(candidat.disponibilite || 'Immédiate');

  // État local de la messagerie interactive
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [localReplies, setLocalReplies] = useState<Record<string, { id: string; text: string; time: string }[]>>({});

  // ── 2. Données filtrées pour le candidat connecté ──────────────────────────
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

  // Initialisation de la conversation active si non sélectionnée
  const currentConversation = useMemo(() => {
    if (selectedConvId) {
      return myConversations.find((c) => c.id === selectedConvId) || myConversations[0];
    }
    return myConversations[0] || null;
  }, [myConversations, selectedConvId]);

  // ── 3. Métriques clés calculées ───────────────────────────────────────────
  const totalCandidatures = myCandidatures.length;
  const enExamenCount = myCandidatures.filter(
    (c) => c.statut === 'RECUE' || c.statut === 'EN_EXAMEN'
  ).length;
  const entretiensList = useMemo(() => {
    return myCandidatures.filter(
      (c) => c.statut === 'PRESELECTIONNEE' || c.statut === 'ENTRETIEN' || !!c.date_entretien
    );
  }, [myCandidatures]);
  const entretiensCount = entretiensList.length;
  const accepteesCount = myCandidatures.filter((c) => c.statut === 'ACCEPTEE').length;

  const publishedJobs = useMemo(() => {
    return offres.filter((o) => o.statut === 'PUBLIEE');
  }, [offres]);

  const unreadMessagesCount = myConversations.reduce((acc, c) => acc + (c.non_lus_candidat || 0), 0);

  // Filtrage dynamique des candidatures par texte et statut
  const filteredCandidatures = useMemo(() => {
    return myCandidatures.filter((cand) => {
      // Filtre statut
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'RECUE' && cand.statut !== 'RECUE') return false;
        if (statusFilter === 'EN_EXAMEN' && cand.statut !== 'EN_EXAMEN') return false;
        if (statusFilter === 'ENTRETIEN' && cand.statut !== 'PRESELECTIONNEE' && cand.statut !== 'ENTRETIEN') return false;
        if (statusFilter === 'ACCEPTEE' && cand.statut !== 'ACCEPTEE') return false;
      }
      // Filtre texte
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titre = cand.offre?.titre?.toLowerCase() || '';
        const ent = cand.offre?.entreprise?.nom?.toLowerCase() || '';
        const lieu = cand.offre?.lieu?.toLowerCase() || '';
        if (!titre.includes(q) && !ent.includes(q) && !lieu.includes(q)) return false;
      }
      return true;
    });
  }, [myCandidatures, statusFilter, searchQuery]);

  // Envoi de réponse dans le chat interactif
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim() || !currentConversation) return;

    const convId = currentConversation.id;
    const newMsg = {
      id: `local-msg-${Date.now()}`,
      text: replyInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setLocalReplies((prev) => ({
      ...prev,
      [convId]: [...(prev[convId] || []), newMsg],
    }));
    setReplyInput('');
  };

  // Helper pour badges de statut
  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'PRESELECTIONNEE':
      case 'ENTRETIEN':
        return {
          label: 'Entretien / Retenu(e)',
          badgeClass: 'bg-[#ecfdf5] text-[#065f46] border-[#a7f3d0]',
          dotClass: 'bg-[#10b981]',
        };
      case 'ACCEPTEE':
        return {
          label: 'Proposition acceptée',
          badgeClass: 'bg-[#fefce8] text-[#854d0e] border-[#fef08a]',
          dotClass: 'bg-[#eab308]',
        };
      case 'EN_EXAMEN':
        return {
          label: 'En cours d\'examen RH',
          badgeClass: 'bg-[#eff6ff] text-[#1e40af] border-[#bfdbfe]',
          dotClass: 'bg-[#3b82f6]',
        };
      case 'RECUE':
        return {
          label: 'Dossier transmis',
          badgeClass: 'bg-[#f8fafc] text-[#334155] border-[#cbd5e1]',
          dotClass: 'bg-[#64748b]',
        };
      case 'REFUSEE':
        return {
          label: 'Non retenue',
          badgeClass: 'bg-[#fef2f2] text-[#991b1b] border-[#fecaca]',
          dotClass: 'bg-[#ef4444]',
        };
      default:
        return {
          label: statut,
          badgeClass: 'bg-[#f8fafc] text-[#475569] border-[#e2e8f0]',
          dotClass: 'bg-[#94a3b8]',
        };
    }
  };

  // Helper pour déterminer l'étape actuelle du stepper de candidature
  const getStepState = (statut: string, stepIndex: number) => {
    // stepIndex: 1 = Dépôt, 2 = Examen, 3 = Entretien, 4 = Décision
    if (statut === 'RECUE') {
      if (stepIndex === 1) return 'CURRENT';
      return 'UPCOMING';
    }
    if (statut === 'EN_EXAMEN') {
      if (stepIndex === 1) return 'COMPLETED';
      if (stepIndex === 2) return 'CURRENT';
      return 'UPCOMING';
    }
    if (statut === 'PRESELECTIONNEE' || statut === 'ENTRETIEN') {
      if (stepIndex <= 2) return 'COMPLETED';
      if (stepIndex === 3) return 'CURRENT';
      return 'UPCOMING';
    }
    if (statut === 'ACCEPTEE') {
      return 'COMPLETED';
    }
    return stepIndex === 1 ? 'COMPLETED' : 'UPCOMING';
  };

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
                  Disponibilité : <strong className="text-[#1a2233]">{dispoState}</strong>
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
      {/* 2. CARTES D'INDICATEURS CLÉS (INTERACTION DIRECTE)                */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 : Candidatures envoyées */}
        <div
          onClick={() => {
            setActiveTab('CANDIDATURES');
            setStatusFilter('ALL');
          }}
          className={`group cursor-pointer rounded-3xl border p-5 shadow-xs transition ${
            activeTab === 'CANDIDATURES' && statusFilter === 'ALL'
              ? 'border-[#594be0] bg-[#f8f7ff] shadow-md'
              : 'border-[#e8ebf3] bg-white hover:border-[#594be0] hover:shadow-md'
          }`}
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
          onClick={() => setActiveTab('ENTRETIENS')}
          className={`group cursor-pointer rounded-3xl border p-5 shadow-xs transition ${
            activeTab === 'ENTRETIENS'
              ? 'border-[#16a34a] bg-[#f0fdf4] shadow-md'
              : 'border-[#bbf7d0] bg-[#f7fdf9] hover:border-[#10b981] hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#166534]">Entretiens planifiés</span>
            <div className="grid size-10 place-items-center rounded-2xl bg-[#dcfce7] text-[#15803d] group-hover:bg-[#16a34a] group-hover:text-white transition">
              <Calendar size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#14532d]">{entretiensCount}</span>
            <span className="text-xs font-semibold text-[#15803d]">convocation(s) RH</span>
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

        {/* KPI 4 : Messages & Réponses recruteurs */}
        <div
          onClick={() => setActiveTab('MESSAGERIE')}
          className={`group cursor-pointer rounded-3xl border p-5 shadow-xs transition ${
            activeTab === 'MESSAGERIE'
              ? 'border-[#594be0] bg-[#f8f7ff] shadow-md'
              : 'border-[#e8ebf3] bg-white hover:border-[#594be0] hover:shadow-md'
          }`}
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
            <span>Ouvrir le chat interactif</span>
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
              Cliquez sur une étape pour basculer instantanément l'affichage ci-dessous.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveTab('CANDIDATURES');
              setStatusFilter('ALL');
            }}
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
            onClick={() => {
              setActiveTab('CANDIDATURES');
              setStatusFilter('RECUE');
            }}
            className={`rounded-2xl border p-4 text-center space-y-1 transition text-left sm:text-center ${
              activeTab === 'CANDIDATURES' && statusFilter === 'RECUE'
                ? 'border-[#594be0] bg-[#f5f4fe] ring-2 ring-[#594be0]/20'
                : 'border-[#e2e5ee] bg-[#fafbfc] hover:border-[#ccd2e2] hover:bg-white'
            }`}
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
            onClick={() => {
              setActiveTab('CANDIDATURES');
              setStatusFilter('EN_EXAMEN');
            }}
            className={`rounded-2xl border p-4 text-center space-y-1 transition text-left sm:text-center ${
              activeTab === 'CANDIDATURES' && statusFilter === 'EN_EXAMEN'
                ? 'border-[#2563eb] bg-[#eff6ff] ring-2 ring-[#2563eb]/20'
                : 'border-[#dbeafe] bg-[#f8fbff] hover:border-[#bfdbfe] hover:bg-white'
            }`}
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
            onClick={() => setActiveTab('ENTRETIENS')}
            className={`rounded-2xl border p-4 text-center space-y-1 transition text-left sm:text-center ${
              activeTab === 'ENTRETIENS'
                ? 'border-[#16a34a] bg-[#ecfdf5] ring-2 ring-[#16a34a]/20'
                : 'border-[#bbf7d0] bg-[#f7fdf9] hover:border-[#86efac] hover:bg-white'
            }`}
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
            onClick={() => {
              setActiveTab('CANDIDATURES');
              setStatusFilter('ACCEPTEE');
            }}
            className={`rounded-2xl border p-4 text-center space-y-1 transition text-left sm:text-center ${
              activeTab === 'CANDIDATURES' && statusFilter === 'ACCEPTEE'
                ? 'border-[#ca8a04] bg-[#fefce8] ring-2 ring-[#ca8a04]/20'
                : 'border-[#fef08a] bg-[#fffdf0] hover:border-[#fde047] hover:bg-white'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#ca8a04]">
              Étape 4 · Décision
            </div>
            <div className="text-2xl font-black text-[#854d0e]">{accepteesCount}</div>
            <div className="text-[11px] font-medium text-[#a16207]">Propositions retenues</div>
          </button>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 4. ESPACE DE TRAVAIL DYNAMIQUE & INTERACTIF DU CANDIDAT           */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="rounded-3xl border border-[#e8ebf3] bg-white shadow-xs overflow-hidden">
        {/* BARRE D'ONGLETS DYNAMIQUES */}
        <div className="flex flex-wrap items-center justify-between border-b border-[#edf0f7] bg-[#fafbfc] px-4 sm:px-7 pt-4">
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('CANDIDATURES')}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-extrabold transition ${
                activeTab === 'CANDIDATURES'
                  ? 'border-[#594be0] text-[#594be0] bg-white rounded-t-xl'
                  : 'border-transparent text-[#6e778d] hover:text-[#171f33]'
              }`}
            >
              <FileCheck2 size={16} />
              <span>Mes Candidatures</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                activeTab === 'CANDIDATURES' ? 'bg-[#f0efff] text-[#594be0]' : 'bg-[#e9ecf2] text-[#697288]'
              }`}>
                {totalCandidatures}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ENTRETIENS')}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-extrabold transition ${
                activeTab === 'ENTRETIENS'
                  ? 'border-[#16a34a] text-[#16a34a] bg-white rounded-t-xl'
                  : 'border-transparent text-[#6e778d] hover:text-[#171f33]'
              }`}
            >
              <Calendar size={16} />
              <span>Entretiens & Convocations</span>
              {entretiensCount > 0 && (
                <span className="rounded-full bg-[#dcfce7] px-2 py-0.5 text-[10px] font-black text-[#15803d] animate-pulse">
                  {entretiensCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('MESSAGERIE')}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-extrabold transition ${
                activeTab === 'MESSAGERIE'
                  ? 'border-[#594be0] text-[#594be0] bg-white rounded-t-xl'
                  : 'border-transparent text-[#6e778d] hover:text-[#171f33]'
              }`}
            >
              <MessageSquare size={16} />
              <span>Messagerie en direct</span>
              {unreadMessagesCount > 0 && (
                <span className="rounded-full bg-[#ef4444] px-2 py-0.5 text-[10px] font-black text-white">
                  {unreadMessagesCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ANALYSE')}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-extrabold transition ${
                activeTab === 'ANALYSE'
                  ? 'border-[#594be0] text-[#594be0] bg-white rounded-t-xl'
                  : 'border-transparent text-[#6e778d] hover:text-[#171f33]'
              }`}
            >
              <Sparkles size={16} />
              <span>Analyse & Marché</span>
            </button>
          </div>

          <div className="py-2">
            <button
              type="button"
              onClick={() => onNavigateScreen('E5')}
              className="text-xs font-bold text-[#594be0] hover:underline flex items-center gap-1"
            >
              <span>Espace complet</span>
              <ExternalLink size={13} />
            </button>
          </div>
        </div>

        {/* CONTENU SELON L'ONGLET SÉLECTIONNÉ */}
        <div className="p-6 sm:p-8">
          {/* ────────────────────────────────────────────────────────────── */}
          {/* ONGLET 1 : SUIVI DYNAMIQUE DES CANDIDATURES                   */}
          {/* ────────────────────────────────────────────────────────────── */}
          {activeTab === 'CANDIDATURES' && (
            <div className="space-y-6">
              {/* Barre de filtres et de recherche instantanée */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ba4b5]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher par poste, entreprise ou ville..."
                    className="w-full rounded-2xl border border-[#dde1ee] bg-[#fafbfc] pl-10 pr-4 py-2 text-xs font-medium text-[#171f33] placeholder-[#9ba4b5] focus:border-[#594be0] focus:bg-white focus:outline-none transition"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ba4b5] hover:text-[#171f33]"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                  <span className="text-[#8690a6] text-[11px] mr-1">Filtrer :</span>
                  {[
                    { key: 'ALL', label: 'Toutes' },
                    { key: 'RECUE', label: 'Dépôt' },
                    { key: 'EN_EXAMEN', label: 'En examen' },
                    { key: 'ENTRETIEN', label: 'Entretiens' },
                    { key: 'ACCEPTEE', label: 'Retenues' },
                  ].map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setStatusFilter(f.key)}
                      className={`rounded-xl px-3 py-1.5 transition ${
                        statusFilter === f.key
                          ? 'bg-[#594be0] text-white shadow-xs'
                          : 'bg-[#f0f2f7] text-[#555f75] hover:bg-[#e4e8f1]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Liste des candidatures avec timeline dynamique */}
              <div className="space-y-4">
                {filteredCandidatures.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-[#dde1ee] p-10 text-center space-y-3">
                    <p className="text-xs text-[#7d869e]">
                      {searchQuery
                        ? `Aucun résultat pour « ${searchQuery} ».`
                        : "Aucune candidature dans cette catégorie pour le moment."}
                    </p>
                    <div className="flex justify-center gap-2">
                      {(searchQuery || statusFilter !== 'ALL') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('ALL');
                          }}
                          className="rounded-xl border border-[#dde1ee] bg-white px-4 py-2 text-xs font-bold text-[#444c60] hover:bg-[#f6f7fb]"
                        >
                          Réinitialiser les filtres
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onNavigateScreen('E1')}
                        className="rounded-xl bg-[#594be0] px-4 py-2 text-xs font-bold text-white hover:bg-[#483ad3] shadow-xs"
                      >
                        Explorer les offres disponibles
                      </button>
                    </div>
                  </div>
                ) : (
                  filteredCandidatures.map((cand) => {
                    const badge = getStatusBadge(cand.statut);
                    const isExpanded = expandedId === cand.id;

                    return (
                      <div
                        key={cand.id}
                        className="rounded-2xl border border-[#e8ebf3] bg-[#fafbfc] p-5 hover:border-[#594be0] hover:bg-white transition space-y-4"
                      >
                        {/* En-tête de la candidature */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-black text-[#171f33]">
                                {cand.offre?.titre || 'Développeur Web'}
                              </h3>
                              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${badge.badgeClass}`}>
                                <span className={`size-1.5 rounded-full ${badge.dotClass}`} />
                                {badge.label}
                              </span>
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#717a92]">
                              <span className="font-bold text-[#594be0]">
                                {cand.offre?.entreprise?.nom || 'Entreprise partenaire'}
                              </span>
                              <span>•</span>
                              <span>{cand.offre?.lieu || 'Tunis'}</span>
                              <span>•</span>
                              <span className="font-medium text-[#171f33]">{cand.offre?.type_contrat || 'CDI'}</span>
                              <span>•</span>
                              <span className="text-[#8c96ac]">
                                Envoyée le {cand.created_at?.split('T')?.[0] || cand.created_at}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab('MESSAGERIE');
                                const matchConv = myConversations.find(
                                  (cv) => cv.entreprise_nom === cand.offre?.entreprise?.nom
                                );
                                if (matchConv) setSelectedConvId(matchConv.id);
                              }}
                              className="rounded-xl border border-[#dde1ee] bg-white px-3 py-2 text-xs font-bold text-[#4c546b] hover:border-[#594be0] hover:text-[#594be0] transition shadow-2xs flex items-center gap-1.5"
                            >
                              <MessageSquare size={13} />
                              <span>Contacter</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : cand.id)}
                              className="rounded-xl bg-[#594be0] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#483ad3] transition shadow-xs flex items-center gap-1"
                            >
                              <span>{isExpanded ? 'Réduire' : 'Timeline & Détails'}</span>
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </div>
                        </div>

                        {/* STEPPER VISUEL HORIZONTAL ATS DE LA CANDIDATURE */}
                        <div className="pt-2 border-t border-[#f0f2f7]">
                          <div className="grid grid-cols-4 gap-2 text-center">
                            {[
                              { step: 1, label: 'Dépôt du dossier', sub: 'Transmis' },
                              { step: 2, label: 'Examen RH & ATS', sub: 'Étude en cours' },
                              { step: 3, label: 'Entretien RH', sub: 'Convocation' },
                              { step: 4, label: 'Décision finale', sub: 'Proposition' },
                            ].map((s) => {
                              const state = getStepState(cand.statut, s.step);
                              return (
                                <div key={s.step} className="space-y-1">
                                  <div className="flex items-center justify-center">
                                    <div
                                      className={`size-6 rounded-full flex items-center justify-center text-[10px] font-black transition ${
                                        state === 'COMPLETED'
                                          ? 'bg-[#10b981] text-white'
                                          : state === 'CURRENT'
                                          ? 'bg-[#594be0] text-white ring-4 ring-[#594be0]/20 animate-pulse'
                                          : 'bg-[#e5e8f0] text-[#8690a6]'
                                      }`}
                                    >
                                      {state === 'COMPLETED' ? <Check size={12} /> : s.step}
                                    </div>
                                  </div>
                                  <div className={`text-[11px] font-bold ${
                                    state === 'CURRENT'
                                      ? 'text-[#594be0]'
                                      : state === 'COMPLETED'
                                      ? 'text-[#10b981]'
                                      : 'text-[#8690a6]'
                                  }`}>
                                    {s.label}
                                  </div>
                                  <div className="text-[10px] text-[#9aa2b5] hidden sm:block">{s.sub}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* ACCORDÉON DÉPLIABLE : DÉTAILS ET RETOURS RECRUTEUR */}
                        {isExpanded && (
                          <div className="rounded-2xl border border-[#e2e6f0] bg-white p-4 space-y-3 animate-in fade-in duration-200">
                            {cand.commentaire_recruteur && (
                              <div className="rounded-xl border border-[#dbeafe] bg-[#f0f7ff] p-3 text-xs text-[#1e40af]">
                                <div className="font-extrabold flex items-center gap-1.5 mb-1">
                                  <MessageSquare size={13} />
                                  <span>Retour direct du recruteur :</span>
                                </div>
                                <p className="italic">« {cand.commentaire_recruteur} »</p>
                              </div>
                            )}

                            {cand.message && (
                              <div className="text-xs text-[#4b546a]">
                                <strong className="text-[#171f33]">Votre mot d'accompagnement :</strong>
                                <p className="mt-1 rounded-xl bg-[#fafbfc] border border-[#edf0f7] p-2.5 italic text-[#5f687e]">
                                  {cand.message}
                                </p>
                              </div>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#f0f2f7] text-xs">
                              <span className="text-[#7f889f]">
                                ID du dossier : <code className="text-[#594be0]">{cand.id}</code>
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => cand.offre && onSelectOffre(cand.offre)}
                                  className="text-xs font-bold text-[#594be0] hover:underline"
                                >
                                  Voir l'offre originale
                                </button>
                                <span className="text-[#d8dde8]">|</span>
                                <button
                                  type="button"
                                  onClick={() => onNavigateScreen('E5')}
                                  className="text-xs font-bold text-[#171f33] hover:text-[#594be0]"
                                >
                                  Historique complet →
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────────── */}
          {/* ONGLET 2 : ENTRETIENS & CONVOCATIONS                          */}
          {/* ────────────────────────────────────────────────────────────── */}
          {activeTab === 'ENTRETIENS' && (
            <div className="space-y-6">
              {entretiensList.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#bbf7d0] bg-[#f9fefb] p-10 text-center space-y-3">
                  <div className="grid size-14 place-items-center rounded-2xl bg-[#dcfce7] text-[#15803d] mx-auto">
                    <Calendar size={28} />
                  </div>
                  <h3 className="text-base font-black text-[#14532d]">
                    Aucun entretien programmé pour l'instant
                  </h3>
                  <p className="max-w-md mx-auto text-xs text-[#166534] leading-relaxed">
                    Vos candidatures sont actuellement en cours d'examen par les services RH. Dès qu'un recruteur valide votre profil, la date et le lien de convocation s'afficheront ici en direct.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('CANDIDATURES')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#16a34a] px-4 py-2 text-xs font-bold text-white hover:bg-[#15803d] transition shadow-xs"
                  >
                    <span>Vérifier le statut de mes candidatures</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-[#14532d] flex items-center gap-2">
                      <Calendar size={16} className="text-[#16a34a]" />
                      <span>{entretiensList.length} convocation(s) confirmée(s)</span>
                    </h3>
                    <span className="rounded-full bg-[#dcfce7] px-3 py-0.5 text-xs font-bold text-[#15803d]">
                      En cours de préparation
                    </span>
                  </div>

                  {entretiensList.map((ent) => (
                    <div
                      key={ent.id}
                      className="rounded-3xl border border-[#86efac] bg-gradient-to-br from-[#f0fdf4] via-white to-white p-6 shadow-sm space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="grid size-12 place-items-center rounded-2xl bg-[#16a34a] text-white shrink-0 shadow-sm">
                            <Video size={22} />
                          </div>
                          <div>
                            <span className="rounded-md bg-[#dcfce7] px-2 py-0.5 text-[10px] font-extrabold text-[#15803d]">
                              {ent.type_entretien || 'Entretien Visioconférence'}
                            </span>
                            <h4 className="mt-1 text-base font-black text-[#171f33]">
                              {ent.offre?.titre || 'Entretien technique'}
                            </h4>
                            <p className="text-xs font-semibold text-[#166534]">
                              {ent.offre?.entreprise?.nom || 'Société partenaire'} • {ent.offre?.lieu || 'Tunis'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('MESSAGERIE');
                              const matchConv = myConversations.find(
                                (cv) => cv.entreprise_nom === ent.offre?.entreprise?.nom
                              );
                              if (matchConv) setSelectedConvId(matchConv.id);
                            }}
                            className="rounded-xl border border-[#bbf7d0] bg-white px-4 py-2.5 text-xs font-bold text-[#15803d] hover:bg-[#f0fdf4] transition shadow-2xs"
                          >
                            Échanger avec le recruteur
                          </button>
                          <button
                            type="button"
                            onClick={() => onNavigateScreen('E5')}
                            className="rounded-xl bg-[#16a34a] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#15803d] transition"
                          >
                            Consulter le dossier RH
                          </button>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[#bbf7d0] bg-white p-4 space-y-2 text-xs text-[#285c3b]">
                        <div className="flex items-center gap-2 font-bold text-[#166534]">
                          <Clock size={14} />
                          <span>
                            Date de l'échange :{' '}
                            <strong>
                              {ent.date_entretien || 'À convenir avec le responsable RH'}
                            </strong>
                          </span>
                        </div>
                        <p className="text-[11px] text-[#4b6d58]">
                          Préparez vos réalisations récentes et questions sur les projets de l'entreprise.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ────────────────────────────────────────────────────────────── */}
          {/* ONGLET 3 : MESSAGERIE INTERACTIVE INTÉGRÉE                    */}
          {/* ────────────────────────────────────────────────────────────── */}
          {activeTab === 'MESSAGERIE' && (
            <div className="rounded-2xl border border-[#e8ebf3] bg-[#fafbfc] overflow-hidden grid lg:grid-cols-[1fr_1.8fr] min-h-[420px]">
              {/* Colonne gauche : liste des discussions */}
              <div className="border-r border-[#e8ebf3] bg-white p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#f0f2f7]">
                  <span className="text-xs font-black text-[#171f33] flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-[#594be0]" />
                    <span>Discussions actives</span>
                  </span>
                  <span className="rounded-full bg-[#f0efff] px-2 py-0.5 text-[10px] font-bold text-[#594be0]">
                    {myConversations.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {myConversations.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#8690a6]">
                      Aucune conversation pour le moment.
                    </div>
                  ) : (
                    myConversations.map((conv) => {
                      const isSelected = currentConversation?.id === conv.id;
                      return (
                        <div
                          key={conv.id}
                          onClick={() => setSelectedConvId(conv.id)}
                          className={`cursor-pointer rounded-2xl p-3 transition border ${
                            isSelected
                              ? 'border-[#594be0] bg-[#f8f7ff]'
                              : 'border-transparent bg-[#fafbfc] hover:bg-white hover:border-[#e2e5ee]'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="relative">
                              <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#6253e8] to-[#4838d2] text-xs font-bold text-white shrink-0">
                                {conv.recruteur_nom[0] || 'R'}
                              </div>
                              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white bg-[#10b981]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-[#171f33] truncate">
                                  {conv.recruteur_nom}
                                </span>
                                <span className="text-[10px] text-[#9aa2b5]">
                                  {conv.updated_at.split(' ')[1] || conv.updated_at}
                                </span>
                              </div>
                              <div className="text-[11px] font-semibold text-[#594be0] truncate">
                                {conv.entreprise_nom}
                              </div>
                              <p className="text-[11px] text-[#6a7389] truncate mt-0.5">
                                {conv.dernier_message}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Colonne droite : Fenêtre de discussion en direct */}
              <div className="flex flex-col justify-between bg-white p-4 sm:p-6">
                {currentConversation ? (
                  <>
                    {/* Header conversation */}
                    <div className="flex items-center justify-between pb-3 border-b border-[#f0f2f7]">
                      <div className="flex items-center gap-3">
                        <div className="grid size-10 place-items-center rounded-xl bg-[#594be0] text-xs font-bold text-white">
                          {currentConversation.recruteur_nom[0] || 'R'}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-[#171f33]">
                            {currentConversation.recruteur_nom}
                          </h4>
                          <p className="text-[11px] text-[#594be0] font-semibold">
                            {currentConversation.entreprise_nom} · Recruteur connecté
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onNavigateScreen('E_MESSAGES')}
                        className="text-xs font-bold text-[#594be0] hover:underline"
                      >
                        Agrandir en plein écran →
                      </button>
                    </div>

                    {/* Fil de discussion */}
                    <div className="py-4 space-y-3 flex-1 overflow-y-auto max-h-[260px]">
                      {/* Message reçu du recruteur */}
                      <div className="flex items-start gap-2.5 max-w-[85%]">
                        <div className="grid size-7 place-items-center rounded-lg bg-[#594be0] text-[10px] font-bold text-white shrink-0 mt-1">
                          {currentConversation.recruteur_nom[0]}
                        </div>
                        <div className="rounded-2xl rounded-tl-xs bg-[#f4f6fa] p-3.5 text-xs text-[#171f33] space-y-1">
                          <p>{currentConversation.dernier_message}</p>
                          <span className="block text-[10px] text-[#9098ac]">
                            Reçu à {currentConversation.updated_at.split(' ')[1] || currentConversation.updated_at}
                          </span>
                        </div>
                      </div>

                      {/* Messages locaux envoyés dans la session */}
                      {(localReplies[currentConversation.id] || []).map((msg) => (
                        <div key={msg.id} className="flex items-start justify-end gap-2.5">
                          <div className="rounded-2xl rounded-tr-xs bg-[#594be0] p-3.5 text-xs text-white space-y-1 max-w-[85%]">
                            <p>{msg.text}</p>
                            <span className="block text-[10px] text-[#c6c1fc] text-right flex items-center justify-end gap-1">
                              <span>Envoyé à {msg.time}</span>
                              <CheckCheck size={12} />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Zone de saisie et envoi direct */}
                    <form onSubmit={handleSendReply} className="pt-3 border-t border-[#f0f2f7] flex items-center gap-2">
                      <input
                        type="text"
                        value={replyInput}
                        onChange={(e) => setReplyInput(e.target.value)}
                        placeholder={`Répondre à ${currentConversation.recruteur_nom}...`}
                        className="flex-1 rounded-2xl border border-[#dde1ee] bg-[#fafbfc] px-4 py-2.5 text-xs font-medium text-[#171f33] focus:border-[#594be0] focus:bg-white focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!replyInput.trim()}
                        className="rounded-2xl bg-[#594be0] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#483ad3] disabled:opacity-40 transition flex items-center gap-1.5 shrink-0 shadow-xs"
                      >
                        <span>Envoyer</span>
                        <Send size={13} />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="grid place-items-center h-full text-xs text-[#8690a6]">
                    Sélectionnez une discussion à gauche pour afficher les messages.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────────── */}
          {/* ONGLET 4 : ANALYSE D'ACTIVITÉ & DU MARCHÉ                     */}
          {/* ────────────────────────────────────────────────────────────── */}
          {activeTab === 'ANALYSE' && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#e8ebf3] bg-[#fafbfc] p-4 text-center space-y-1">
                  <div className="text-[11px] font-bold text-[#717a92]">Taux de réponse estimé</div>
                  <div className="text-2xl font-black text-[#10b981]">85%</div>
                  <div className="text-[10px] text-[#8e98af]">Délai moyen de retour : 48h</div>
                </div>

                <div className="rounded-2xl border border-[#e8ebf3] bg-[#fafbfc] p-4 text-center space-y-1">
                  <div className="text-[11px] font-bold text-[#717a92]">Attractivité du profil</div>
                  <div className="text-2xl font-black text-[#594be0]">Élevée</div>
                  <div className="text-[10px] text-[#8e98af]">Indexé dans le top 15%</div>
                </div>

                <div className="rounded-2xl border border-[#e8ebf3] bg-[#fafbfc] p-4 text-center space-y-1">
                  <div className="text-[11px] font-bold text-[#717a92]">Marché de l'emploi</div>
                  <div className="text-2xl font-black text-[#171f33]">{publishedJobs.length} offres</div>
                  <div className="text-[10px] text-[#8e98af]">Actives sur la plateforme</div>
                </div>
              </div>

              {/* Compétences demandées comparées au profil */}
              <div className="rounded-2xl border border-[#e8ebf3] p-5 space-y-3">
                <h4 className="text-xs font-black text-[#171f33] flex items-center gap-1.5">
                  <Target size={15} className="text-[#594be0]" />
                  <span>Compétences les plus recherchées par les recruteurs du secteur</span>
                </h4>
                <div className="flex flex-wrap gap-2 pt-1">
                  {['React', 'Node.js', 'TypeScript', 'SQL', 'Docker', 'Tailwind CSS', 'API REST', 'Git'].map((sk) => {
                    const hasSkill = (candidat.competences || []).some(
                      (c) => c.toLowerCase() === sk.toLowerCase()
                    );
                    return (
                      <span
                        key={sk}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                          hasSkill
                            ? 'border-[#a7f3d0] bg-[#ecfdf5] text-[#065f46]'
                            : 'border-[#e2e5ee] bg-[#f8fafc] text-[#717a92]'
                        }`}
                      >
                        {hasSkill && <Check size={12} className="text-[#10b981]" />}
                        <span>{sk}</span>
                        {hasSkill ? (
                          <span className="text-[10px] opacity-75">(Acquis)</span>
                        ) : (
                          <span className="text-[10px] text-[#9aa2b5]">(Recommandé)</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Paramétrage dynamique de la disponibilité en 1 clic */}
              <div className="rounded-2xl border border-[#e0ddfc] bg-gradient-to-r from-[#f8f7ff] to-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-black text-[#171f33]">
                    Mettre à jour votre disponibilité en 1 clic
                  </h4>
                  <p className="text-[11px] text-[#717a92] mt-0.5">
                    Modifie immédiatement votre statut visible par les recruteurs sur la plateforme.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {['Immédiate', 'Sous 1 mois', 'À l\'écoute'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDispoState(d)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                        dispoState === d
                          ? 'bg-[#594be0] text-white shadow-xs'
                          : 'border border-[#dde1ee] bg-white text-[#525a71] hover:bg-[#fafbfc]'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
