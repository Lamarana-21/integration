'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCheck,
  Check,
  FileText,
  MessageSquare,
  Search,
  Send,
  Sparkles,
  Users,
  X,
  Clock,
  HelpCircle,
  Paperclip,
  Smile,
  ShieldCheck,
  Calendar,
  MapPin,
  ChevronRight,
  Info,
} from 'lucide-react';
import { ChatMessage, Conversation, Offre, RoleName, User as UserType } from '@/lib/types';

interface MessagerieViewProps {
  currentRole: RoleName;
  currentUser: UserType | null;
  conversations: Conversation[];
  messages: ChatMessage[];
  onSendMessage: (
    conversationId: string,
    contenu: string,
    overrideSenderRole?: RoleName,
    overrideSenderName?: string
  ) => void;
  selectedConversationId?: string | null;
  onSelectConversation?: (id: string) => void;
  onNavigateScreen?: (screen: string) => void;
  offres?: Offre[];
}

const STATIC_MOCK_CONV_IDS = new Set(['conv-1', 'conv-2', 'conv-3', 'conv-4', 'conv-5']);

// Modèles professionnels rapides pour candidats
const CANDIDATE_TEMPLATES = [
  {
    label: '📅 Délais de traitement',
    icon: Clock,
    text: 'Bonjour, je me permets de vous contacter pour connaître les délais habituels de traitement des candidatures pour ce poste. Merci d\'avance pour votre retour.',
  },
  {
    label: '🏢 Organisation du travail',
    icon: Building2,
    text: 'Bonjour, pourriez-vous préciser si le poste offre une flexibilité en formule hybride ou télétravail partiel ? Bien cordialement.',
  },
  {
    label: '📋 Étapes du processus',
    icon: FileText,
    text: 'Bonjour, pouvez-vous me préciser les grandes étapes du processus de recrutement (entretiens techniques, RH, tests) ? Merci beaucoup.',
  },
  {
    label: '✨ Précisions sur les missions',
    icon: Sparkles,
    text: 'Bonjour, très intéressé par vos projets, j\'aimerais en savoir plus sur l\'équipe technique et les missions prioritaires au quotidien. Merci.',
  },
];

// Modèles professionnels rapides pour recruteurs
const RECRUITER_TEMPLATES = [
  {
    label: '🎯 Convoquer en entretien',
    icon: Calendar,
    text: 'Bonjour,\n\nVotre profil a retenu toute notre attention. Seriez-vous disponible pour un échange d\'une trentaine de minutes cette semaine (en visio ou dans nos locaux) ?\n\nMerci de nous indiquer vos créneaux préférés.',
  },
  {
    label: '📄 Demande d\'informations',
    icon: HelpCircle,
    text: 'Bonjour,\n\nNous étudions actuellement votre dossier avec intérêt. Pourriez-vous nous préciser vos disponibilités actuelles ainsi que vos prétentions salariales pour cette opportunité ?\n\nCordialement,',
  },
  {
    label: '⏳ En cours d\'examen',
    icon: Clock,
    text: 'Bonjour,\n\nNous vous confirmons que votre dossier est actuellement en cours d\'examen auprès de nos équipes opérationnelles. Nous reviendrons vers vous d\'ici la fin de semaine avec un retour détaillé.\n\nBien cordialement,',
  },
];

export function MessagerieView({
  currentRole,
  currentUser,
  conversations,
  messages,
  onSendMessage,
  selectedConversationId: propSelectedId,
  onSelectConversation,
  onNavigateScreen,
  offres = [],
}: MessagerieViewProps) {
  // ── 1. Filtrage strict par Rôle et Utilisateur connecté ─────────────────────
  const roleScopedConversations = useMemo(() => {
    if (!currentUser) return [];

    if (currentRole === 'CANDIDAT') {
      const curUserId = String(currentUser.id || '').trim();
      const curCandidatId = String(currentUser.candidat?.id || '').trim();

      return conversations.filter((c) => {
        // Exclure les discussions fictives initiales pour que le candidat ne voie que ses vrais échanges
        if (STATIC_MOCK_CONV_IDS.has(c.id)) {
          return false;
        }
        if (curUserId && c.candidat_id === curUserId) return true;
        if (curCandidatId && c.candidat_id === curCandidatId) return true;
        return false;
      });
    }

    if (currentRole === 'RECRUTEUR') {
      const curRecId = currentUser.id;
      const curEntId = currentUser.entreprise_id;
      const curEmail = currentUser.email?.toLowerCase().trim() || '';

      return conversations.filter((c) => {
        if (c.recruteur_id === curRecId) return true;
        if (curEntId && c.entreprise_id === curEntId) return true;
        if (
          curEmail === 'rh@alpha.example' ||
          curRecId === 'u-rec-alpha' ||
          !curEntId
        ) {
          if (
            c.recruteur_id === 'u-rec-alpha' ||
            c.entreprise_id === 'c-alpha' ||
            c.entreprise_nom?.toLowerCase().includes('alpha')
          ) {
            return true;
          }
        }
        return false;
      });
    }

    return conversations;
  }, [conversations, currentUser, currentRole]);

  // Sélection active locale
  const [selectedId, setSelectedId] = useState<string | null>(propSelectedId || null);

  const activeConvId = useMemo(() => {
    if (selectedId && roleScopedConversations.some((c) => c.id === selectedId)) {
      return selectedId;
    }
    if (propSelectedId && roleScopedConversations.some((c) => c.id === propSelectedId)) {
      return propSelectedId;
    }
    return roleScopedConversations[0]?.id || null;
  }, [selectedId, propSelectedId, roleScopedConversations]);

  // Filtres recherche et non-lus
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);

  // Saisie du message
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Modal détails de l'offre
  const [showOfferModal, setShowOfferModal] = useState(false);

  // Conversation actuellement ouverte à droite
  const activeConversation = useMemo(() => {
    return (
      roleScopedConversations.find((c) => c.id === activeConvId) ||
      roleScopedConversations[0] ||
      null
    );
  }, [roleScopedConversations, activeConvId]);

  // AUTO-LECTURE SÉCURISÉE
  const markedReadRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!activeConversation || !onSelectConversation) return;

    const unread =
      currentRole === 'CANDIDAT'
        ? activeConversation.non_lus_candidat
        : activeConversation.non_lus_recruteur;

    if (unread > 0 && !markedReadRef.current.has(activeConversation.id)) {
      markedReadRef.current.add(activeConversation.id);
      onSelectConversation(activeConversation.id);
    }
  }, [
    activeConversation?.id,
    activeConversation?.non_lus_candidat,
    activeConversation?.non_lus_recruteur,
    currentRole,
    onSelectConversation,
  ]);

  // Défilement automatique vers le bas lors de l'arrivée d'un message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeConvId, isTyping]);

  // ── 2. Filtrage secondaire (Recherche + Non lues) ───────────────────────────
  const filteredConversations = useMemo(() => {
    return roleScopedConversations.filter((conv) => {
      const interlocutor =
        currentRole === 'CANDIDAT'
          ? `${conv.entreprise_nom} ${conv.offre_titre || ''}`
          : `${conv.candidat_nom} ${conv.offre_titre || ''}`;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = interlocutor.toLowerCase().includes(q);
        const matchLast = conv.dernier_message?.toLowerCase().includes(q);
        if (!matchName && !matchLast) return false;
      }

      if (filterUnreadOnly) {
        const unreadCount = currentRole === 'CANDIDAT' ? conv.non_lus_candidat : conv.non_lus_recruteur;
        if (unreadCount <= 0) return false;
      }

      return true;
    });
  }, [roleScopedConversations, searchQuery, filterUnreadOnly, currentRole]);

  // Messages spécifiques à la discussion active
  const activeMessages = useMemo(() => {
    if (!activeConversation) return [];
    return messages.filter((m) => m.conversation_id === activeConversation.id);
  }, [messages, activeConversation]);

  // Offre rattachée à la conversation active
  const activeOffer = useMemo(() => {
    if (!activeConversation) return null;
    return (
      offres.find(
        (o) =>
          o.id === activeConversation.offre_id ||
          o.titre?.toLowerCase() === activeConversation.offre_titre?.toLowerCase()
      ) || null
    );
  }, [offres, activeConversation]);

  // Titre d'offre propre (supprime les faux identifiants techniques accidentels)
  const displayJobTitle = useMemo(() => {
    if (!activeConversation) return 'Échange professionnel';
    const raw = (activeConversation.offre_titre || '').trim();
    if (activeOffer?.titre) return activeOffer.titre;
    // Si c'est un identifiant aléatoire comme "iokvjfsiok"
    if (!raw || raw.length < 3 || (/^[a-z0-9_-]+$/i.test(raw) && !raw.includes(' '))) {
      return `Opportunité chez ${activeConversation.entreprise_nom}`;
    }
    return raw;
  }, [activeConversation, activeOffer]);

  // Sélection d'une conversation
  const selectConversation = (id: string) => {
    setSelectedId(id);
    if (onSelectConversation) onSelectConversation(id);
  };

  // ── 3. Envoi d'un message avec interaction dynamique ──────────────────────────
  const sendCandidateMessageWithSmartReply = (textToSend: string) => {
    if (!textToSend.trim() || !activeConversation) return;
    const trimmed = textToSend.trim();

    if (currentRole === 'RECRUTEUR') {
      onSendMessage(
        activeConversation.id,
        trimmed,
        'RECRUTEUR',
        activeConversation.entreprise_nom
      );
      return;
    }

    // Envoi du message du candidat
    onSendMessage(activeConversation.id, trimmed);

    // Déclencher une réponse dynamique professionnelle de l'entreprise après un court délai avec indicateur de frappe
    const entName = activeConversation.entreprise_nom || "L'entreprise";
    const offerTitle = displayJobTitle ? ` pour le poste « ${displayJobTitle} »` : '';
    const lower = trimmed.toLowerCase();

    let autoReplyText = `Bonjour,\n\nMerci d'avoir contacté l'équipe recrutement de ${entName}${offerTitle}.\n\nVotre message a bien été pris en compte et transmis au chargé de recrutement dédié. Nos équipes étudient chaque candidature et reviendront vers vous avec une réponse personnalisée dans les meilleurs délais.`;

    if (lower.includes('délai') || lower.includes('delai') || lower.includes('quand')) {
      autoReplyText = `Bonjour,\n\nMerci pour votre intérêt envers ${entName}${offerTitle}.\n\n⏱️ Délais d'examen : Nos équipes RH analysent les candidatures sous 48h à 72h ouvrées. Un recruteur vous contactera directement ici dès que votre profil aura été validé par le manager opérationnel.`;
    } else if (lower.includes('télétravail') || lower.includes('teletravail') || lower.includes('hybride')) {
      autoReplyText = `Bonjour,\n\nMerci pour votre question.\n\n🏢 Organisation du travail : Selon l'équipe et le type de mission pour « ${displayJobTitle} », ${entName} propose généralement une formule hybride équilibrée (2 à 3 jours de télétravail par semaine). Le responsable RH pourra vous préciser ces détails lors du premier entretien.`;
    } else if (lower.includes('étape') || lower.includes('etape') || lower.includes('processus') || lower.includes('entretien')) {
      autoReplyText = `Bonjour,\n\nMerci pour votre démarche proactive.\n\n📋 Étapes du recrutement chez ${entName} :\n1. Présélection et qualification téléphonique / visio (20-30 min)\n2. Entretien technique avec le manager métier\n3. Échange final de validation RH\n4. Proposition officielle et intégration.\n\nVotre dossier suit son cours avec attention !`;
    } else if (lower.includes('salaire') || lower.includes('rémunération') || lower.includes('remuneration') || lower.includes('tnd')) {
      autoReplyText = `Bonjour,\n\nMerci pour votre question. La grille salariale pour le poste de « ${displayJobTitle} » est définie selon votre niveau d'expérience et les compétences validées. Ce point sera abordé en toute transparence lors de notre premier échange.`;
    }

    const convId = activeConversation.id;
    // Animation d'indicateur de frappe
    setTimeout(() => {
      setIsTyping(true);
    }, 500);

    setTimeout(() => {
      setIsTyping(false);
      onSendMessage(convId, autoReplyText, 'RECRUTEUR', entName);
    }, 1800);
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeConversation) return;
    sendCandidateMessageWithSmartReply(inputText);
    setInputText('');
  };

  const handleApplyTemplate = (text: string) => {
    setInputText(text);
    setShowTemplates(false);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 space-y-4 font-sans">
      {/* HEADER BANNER PROFESSIONNEL */}
      <div className="rounded-3xl border border-[#e8ebf3] bg-gradient-to-r from-white via-[#fafbfe] to-[#f4f2ff] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="grid size-11 place-items-center rounded-2xl bg-[#594be0] text-white shadow-md shadow-[#594be0]/20">
            <MessageSquare size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#171f33]">
                {currentRole === 'CANDIDAT'
                  ? 'Messagerie & Relations Entreprises'
                  : 'Messagerie Recruteur & Gestion des Talents'}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] px-2.5 py-0.5 text-[10px] font-extrabold text-[#065f46]">
                <span className="size-1.5 rounded-full bg-[#10b981] animate-pulse"></span>
                Direct
              </span>
            </div>
            <p className="text-xs text-[#717a92] mt-0.5">
              {currentRole === 'CANDIDAT'
                ? 'Échangez directement avec les équipes de recrutement de vos entreprises cibles en toute fluidité.'
                : 'Communiquez avec les candidats et pilotez vos échanges au nom de votre entreprise.'}
            </p>
          </div>
        </div>

        {/* Indication du profil connecté */}
        <div className="flex items-center gap-2 text-xs text-[#636c82]">
          <span className="rounded-2xl bg-white border border-[#e2e5ef] px-3.5 py-1.5 font-bold shadow-2xs flex items-center gap-2">
            <ShieldCheck size={14} className="text-[#594be0]" />
            <span>Connecté en tant que</span>
            <strong className="text-[#594be0]">
              {currentUser ? `${currentUser.prenom} ${currentUser.nom}` : currentRole}
            </strong>
          </span>
        </div>
      </div>

      {/* ÉTAT VIDE SI LE CANDIDAT N'A AUCUNE DISCUSSION */}
      {currentRole === 'CANDIDAT' && roleScopedConversations.length === 0 ? (
        <div className="rounded-3xl border border-[#e8ebf3] bg-white p-12 sm:p-16 text-center shadow-xs space-y-5">
          <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-[#f4f2ff] text-[#594be0] border border-[#e3dfff]">
            <Building2 size={30} />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-lg font-black text-[#171f33]">
              Aucune discussion active
            </h2>
            <p className="text-xs text-[#6e778f] leading-relaxed">
              Votre boîte de réception est vide. Dès que vous contactez une entreprise depuis une offre ou qu'un recruteur vous répond, la discussion apparaîtra ici.
            </p>
          </div>
          {onNavigateScreen && (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigateScreen('E5')}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#dde1ee] bg-white px-4 py-2.5 text-xs font-bold text-[#424b61] hover:bg-[#f6f7fb] transition cursor-pointer"
              >
                <FileText size={14} />
                <span>Voir mes candidatures</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateScreen('E1')}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#594be0] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#594be0]/20 hover:bg-[#4739d2] transition cursor-pointer"
              >
                <span>Explorer les offres</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* INTERFACE MESSAGERIE 2 COLONNES ULTRA FLUIDE */
        <div className="grid gap-0 lg:grid-cols-[340px_1fr] h-[calc(100vh-8.5rem)] min-h-[580px] max-h-[800px] rounded-3xl border border-[#e2e8f0] bg-white shadow-xs overflow-hidden">
          {/* COLONNE GAUCHE: LISTE DES CONVERSATIONS */}
          <aside className="border-r border-[#edf0f7] flex flex-col bg-[#fcfdfe] h-full overflow-hidden">
            {/* Barre de recherche et filtre non-lus */}
            <div className="p-3.5 border-b border-[#edf0f7] space-y-2.5 shrink-0 bg-white">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-[#9ea6bb]" />
                <input
                  type="text"
                  placeholder={
                    currentRole === 'CANDIDAT'
                      ? 'Rechercher une entreprise ou offre...'
                      : 'Rechercher un candidat ou une offre...'
                  }
                  value={searchQuery ?? ''}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-[#e2e5ef] bg-[#f8fafc] pl-9 pr-3 py-2 text-xs text-[#1e2538] outline-none focus:border-[#594be0] focus:bg-white transition"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] px-1">
                <span className="font-extrabold text-[#747e96] uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  {currentRole === 'RECRUTEUR' ? (
                    <>
                      <Users size={13} className="text-[#594be0]" /> Candidats ({filteredConversations.length})
                    </>
                  ) : (
                    <>
                      <Building2 size={13} className="text-[#594be0]" /> Entreprises ({filteredConversations.length})
                    </>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setFilterUnreadOnly(!filterUnreadOnly)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition cursor-pointer ${
                    filterUnreadOnly
                      ? 'bg-[#594be0] text-white shadow-2xs'
                      : 'text-[#636c82] hover:bg-[#f0f2f7]'
                  }`}
                >
                  Non lues
                </button>
              </div>
            </div>

            {/* Liste des discussions */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#f2f4f8]">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#8c96ac] space-y-1.5">
                  <p className="font-bold text-[#626d85]">Aucune discussion trouvée.</p>
                  <p className="text-[11px]">
                    Aucun échange ne correspond à votre filtre actuel.
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = activeConversation?.id === conv.id;
                  const unreadCount = isSelected
                    ? 0
                    : currentRole === 'CANDIDAT'
                    ? conv.non_lus_candidat
                    : conv.non_lus_recruteur;

                  const primaryTitle =
                    currentRole === 'CANDIDAT'
                      ? conv.entreprise_nom || 'Entreprise'
                      : conv.candidat_nom;

                  // Nettoyage de sous-titre si titre aléatoire
                  const rawJob = (conv.offre_titre || '').trim();
                  const cleanJob =
                    !rawJob || rawJob.length < 3 || (/^[a-z0-9_-]+$/i.test(rawJob) && !rawJob.includes(' '))
                      ? 'Service Recrutement'
                      : rawJob;

                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => selectConversation(conv.id)}
                      className={`w-full text-left p-3.5 flex items-start gap-3 transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#f4f2ff] border-l-4 border-[#594be0]'
                          : 'hover:bg-[#f8f9fc]'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {currentRole === 'RECRUTEUR' && conv.candidat_avatar ? (
                          <img
                            src={conv.candidat_avatar}
                            alt={conv.candidat_nom}
                            className="size-10 rounded-2xl object-cover border border-[#e2e5ef]"
                          />
                        ) : (
                          <div className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-[#6355e8] to-[#4c3ec8] text-white font-black text-sm shadow-xs">
                            {primaryTitle?.[0] || 'E'}
                          </div>
                        )}

                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-[#ef4444] text-[9px] font-black text-white shadow-xs">
                            {unreadCount}
                          </span>
                        )}
                      </div>

                      {/* Détails fil */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-black text-xs text-[#171f33] truncate">
                            {primaryTitle}
                          </span>
                          <span className="text-[10px] text-[#939cb0] shrink-0 font-medium">
                            {conv.updated_at.split(' ')[1] || conv.updated_at}
                          </span>
                        </div>

                        <div className="text-[11px] font-semibold text-[#594be0] truncate flex items-center gap-1 mt-0.5">
                          <Briefcase size={11} className="shrink-0 text-[#594be0]" />
                          <span className="truncate">{cleanJob}</span>
                        </div>

                        <p className="mt-1 text-[11px] text-[#6e778f] truncate leading-tight">
                          {conv.dernier_message || 'Échange ouvert'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* COLONNE DROITE: FIL DE DISCUSSION ACTIF */}
          <main className="flex flex-col bg-white h-full overflow-hidden">
            {activeConversation ? (
              <>
                {/* Entête active */}
                <div className="p-3.5 px-5 border-b border-[#edf0f7] flex items-center justify-between bg-white shrink-0 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-2xl bg-[#594be0] text-white font-black text-sm shadow-xs">
                      {(currentRole === 'CANDIDAT'
                        ? activeConversation.entreprise_nom
                        : activeConversation.candidat_nom)?.[0] || 'E'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-sm text-[#171f33]">
                          {currentRole === 'CANDIDAT'
                            ? activeConversation.entreprise_nom
                            : activeConversation.candidat_nom}
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                            currentRole === 'CANDIDAT'
                              ? 'bg-[#f0efff] text-[#594be0] border border-[#dcd7fe]'
                              : 'bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]'
                          }`}
                        >
                          {currentRole === 'CANDIDAT' ? 'Équipe Recrutement' : 'Candidat qualifié'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[#717a92] mt-0.5">
                        <span className="font-bold text-[#594be0] flex items-center gap-1">
                          <Briefcase size={12} />
                          {displayJobTitle}
                        </span>
                        {activeOffer?.lieu && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-[#525a70]">
                              <MapPin size={11} /> {activeOffer.lieu}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bouton pour afficher les détails de l'offre */}
                  {activeOffer && (
                    <button
                      type="button"
                      onClick={() => setShowOfferModal(true)}
                      className="flex items-center gap-1.5 rounded-2xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2 text-xs font-bold text-[#535c72] hover:bg-white hover:border-[#594be0] hover:text-[#594be0] transition shadow-2xs cursor-pointer"
                    >
                      <Briefcase size={13} className="text-[#594be0]" />
                      <span>Fiche du poste</span>
                    </button>
                  )}
                </div>

                {/* Zone des bulles de messages */}
                <div className="flex-1 p-5 overflow-y-auto space-y-3.5 bg-[#f8fafc]">
                  {/* Carte d'accueil professionnelle si aucun message */}
                  {activeMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-10 text-center space-y-3">
                      <div className="grid size-14 place-items-center rounded-3xl bg-[#f4f2ff] text-[#594be0] border border-[#e3dfff] shadow-xs">
                        <MessageSquare size={24} />
                      </div>
                      <div className="max-w-md space-y-1">
                        <p className="text-sm font-black text-[#171f33]">
                          Discussion ouverte avec {currentRole === 'CANDIDAT' ? activeConversation.entreprise_nom : activeConversation.candidat_nom}
                        </p>
                        <p className="text-xs text-[#7d869e] leading-relaxed">
                          {currentRole === 'CANDIDAT'
                            ? `Vous pouvez poser vos questions sur l'opportunité « ${displayJobTitle} ». Le recruteur vous répondra directement.`
                            : `Prenez contact avec ${activeConversation.candidat_nom} pour planifier un entretien ou demander des précisions.`}
                        </p>
                      </div>

                      {/* Suggestions initiales intégrées au centre */}
                      {currentRole === 'CANDIDAT' && (
                        <div className="pt-2 flex flex-col gap-2 max-w-md w-full">
                          <span className="text-[11px] font-bold text-[#626d85]">Suggestions rapides pour démarrer :</span>
                          {CANDIDATE_TEMPLATES.slice(0, 3).map((tpl) => (
                            <button
                              key={tpl.label}
                              type="button"
                              onClick={() => sendCandidateMessageWithSmartReply(tpl.text)}
                              className="text-left rounded-2xl border border-[#e2e5ef] bg-white p-2.5 px-3.5 text-xs text-[#2b3347] hover:border-[#594be0] hover:bg-[#f4f2ff] transition flex items-center justify-between cursor-pointer"
                            >
                              <span className="font-semibold">{tpl.label}</span>
                              <ChevronRight size={14} className="text-[#9ea6bb]" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    activeMessages.map((msg) => {
                      const isMe =
                        (currentUser && msg.sender_id === currentUser.id) ||
                        msg.sender_role === currentRole;

                      const displayedSenderName = isMe
                        ? 'Vous'
                        : currentRole === 'CANDIDAT' && msg.sender_role === 'RECRUTEUR'
                        ? activeConversation.entreprise_nom
                        : msg.sender_name;

                      const displayedRoleLabel =
                        msg.sender_role === 'RECRUTEUR' ? 'Recruteur' : 'Candidat';

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-2xs transition ${
                              isMe
                                ? 'bg-gradient-to-br from-[#594be0] to-[#4c3ec8] text-white rounded-br-xs'
                                : 'bg-white text-[#1f273b] border border-[#e8ebf3] rounded-bl-xs'
                            }`}
                          >
                            <div className="font-extrabold text-[10px] mb-1 opacity-90 flex items-center justify-between gap-4">
                              <span>{displayedSenderName}</span>
                              <span className="text-[9px] font-medium opacity-75">
                                {displayedRoleLabel}
                              </span>
                            </div>

                            <div className="text-[12px] whitespace-pre-wrap leading-relaxed">{msg.contenu}</div>

                            <div
                              className={`mt-1.5 flex items-center justify-end gap-1 text-[9px] ${
                                isMe ? 'text-white/80' : 'text-[#8e97ae]'
                              }`}
                            >
                              <span>{msg.created_at.split(' ')[1] || msg.created_at}</span>
                              {isMe && <CheckCheck size={12} className="text-white/90" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Indicateur de frappe dynamique */}
                  {isTyping && (
                    <div className="flex items-center gap-2 text-xs text-[#717a92] animate-in fade-in">
                      <div className="grid size-7 place-items-center rounded-xl bg-white border border-[#e2e5ef]">
                        <Building2 size={13} className="text-[#594be0]" />
                      </div>
                      <div className="flex items-center gap-1 bg-white border border-[#e2e5ef] rounded-2xl px-3 py-1.5 shadow-2xs">
                        <span className="size-1.5 rounded-full bg-[#594be0] animate-bounce"></span>
                        <span className="size-1.5 rounded-full bg-[#594be0] animate-bounce [animation-delay:0.2s]"></span>
                        <span className="size-1.5 rounded-full bg-[#594be0] animate-bounce [animation-delay:0.4s]"></span>
                        <span className="text-[10px] text-[#717a92] ml-1 font-semibold">{activeConversation.entreprise_nom} est en train d'écrire...</span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* BARRE D'OUTILS MODÈLES DE RÉPONSE RAPIDE */}
                <div className="px-4 py-2 border-t border-[#edf0f7] bg-[#fcfdfe] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowTemplates(!showTemplates)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                        showTemplates
                          ? 'bg-[#594be0] text-white shadow-2xs'
                          : 'bg-white border border-[#dde1ee] text-[#4b556b] hover:border-[#594be0] hover:text-[#594be0]'
                      }`}
                    >
                      <Sparkles size={12} />
                      <span>Modèles professionnels</span>
                    </button>
                    <span className="text-[10px] text-[#8e97ae] hidden sm:inline">
                      {currentRole === 'CANDIDAT' ? 'Questions clés sur le poste' : 'Gabarits RH certifiés'}
                    </span>
                  </div>

                  <span className="text-[10px] text-[#8e97ae] flex items-center gap-1">
                    <Info size={11} /> Entrée pour envoyer
                  </span>
                </div>

                {/* PANNEAU DE MODÈLES RAPIDES DÉPLOYABLE */}
                {showTemplates && (
                  <div className="p-3.5 border-t border-[#edf0f7] bg-[#fafbfc] grid gap-2 sm:grid-cols-2 animate-in fade-in duration-150">
                    {(currentRole === 'CANDIDAT' ? CANDIDATE_TEMPLATES : RECRUITER_TEMPLATES).map((tpl) => (
                      <button
                        key={tpl.label}
                        type="button"
                        onClick={() => handleApplyTemplate(tpl.text)}
                        className="text-left rounded-2xl border border-[#e2e5ef] bg-white p-2.5 px-3 text-xs text-[#293245] hover:border-[#594be0] hover:bg-[#f4f2ff] transition flex items-start gap-2 cursor-pointer shadow-2xs"
                      >
                        <tpl.icon size={14} className="text-[#594be0] shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="font-bold text-[11px] text-[#171f33]">{tpl.label}</div>
                          <div className="text-[10px] text-[#6e778f] line-clamp-1 mt-0.5">{tpl.text}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* BARRE DE SAISIE ET ENVOI */}
                <form onSubmit={handleSend} className="p-3.5 border-t border-[#edf0f7] bg-white flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={
                      currentRole === 'CANDIDAT'
                        ? `Écrivez votre message à ${activeConversation.entreprise_nom}...`
                        : `Répondez à ${activeConversation.candidat_nom}...`
                    }
                    value={inputText ?? ''}
                    onChange={(e) => setInputText(e.target.value)}
                    className="flex-1 rounded-2xl border border-[#e2e5ef] bg-[#fafbfc] px-4 py-2.5 text-xs text-[#1e2538] outline-none focus:border-[#594be0] focus:bg-white transition"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="flex items-center gap-1.5 rounded-2xl bg-[#594be0] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#594be0]/20 hover:bg-[#4739d2] transition disabled:opacity-40 cursor-pointer"
                  >
                    <Send size={14} />
                    <span>Envoyer</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="m-auto p-8 text-center text-xs text-[#8c96ac]">
                Sélectionnez une discussion à gauche pour afficher les messages.
              </div>
            )}
          </main>
        </div>
      )}

      {/* MODAL EN CONTEXTE : CONSULTER L'OFFRE SANS QUITTER LE CHAT */}
      {showOfferModal && activeConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-3xl border border-[#e8ebf3] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#f0f2f7] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="grid size-10 place-items-center rounded-2xl bg-[#594be0] text-white">
                  <Briefcase size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#171f33]">
                    {displayJobTitle}
                  </h3>
                  <p className="text-xs text-[#594be0] font-bold">
                    {activeConversation.entreprise_nom}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOfferModal(false)}
                className="grid size-8 place-items-center rounded-xl bg-[#f0f2f7] text-[#697288] hover:bg-[#e4e8f1] cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#444d62]">
              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className="rounded-lg bg-[#f0efff] px-2.5 py-1 font-bold text-[#594be0]">
                  Type : {activeOffer?.type_contrat || 'CDI'}
                </span>
                <span className="rounded-lg bg-[#f0fdf4] px-2.5 py-1 font-bold text-[#15803d]">
                  Lieu : {activeOffer?.lieu || 'Tunis (Hybride)'}
                </span>
                {activeOffer?.salaire && (
                  <span className="rounded-lg bg-[#fffbeb] px-2.5 py-1 font-bold text-[#b45309]">
                    Rémunération : {activeOffer.salaire}
                  </span>
                )}
              </div>

              <div className="rounded-2xl bg-[#fafbfc] border border-[#edf0f7] p-4 space-y-2 leading-relaxed">
                <div className="font-extrabold text-[#171f33]">Description du poste :</div>
                <p>
                  {activeOffer?.description ||
                    `Rejoignez l'équipe de ${activeConversation.entreprise_nom} dans le cadre du poste « ${displayJobTitle} ».`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f0f2f7]">
              {onNavigateScreen && (
                <button
                  type="button"
                  onClick={() => {
                    setShowOfferModal(false);
                    onNavigateScreen('E1');
                  }}
                  className="rounded-xl border border-[#dde1ee] bg-white px-4 py-2 text-xs font-bold text-[#495269] hover:bg-[#f6f7fb] cursor-pointer"
                >
                  Toutes les offres
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowOfferModal(false)}
                className="rounded-xl bg-[#594be0] px-5 py-2 text-xs font-bold text-white hover:bg-[#483ad3] cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
