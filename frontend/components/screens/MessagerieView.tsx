'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Briefcase,
  Building2,
  Check,
  CheckCheck,
  ChevronRight,
  Clock,
  ExternalLink,
  Filter,
  Heart,
  Info,
  MapPin,
  MessageSquare,
  Paperclip,
  Plus,
  Search,
  Send,
  Smile,
  Sparkles,
  ThumbsUp,
  User,
  Users,
  X,
  Zap,
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
    if (!currentUser) return conversations;

    if (currentRole === 'CANDIDAT') {
      const curCandId = currentUser.id;
      const curName = `${currentUser.prenom} ${currentUser.nom}`.toLowerCase().trim();
      const curEmail = currentUser.email?.toLowerCase().trim() || '';

      return conversations.filter((c) => {
        if (c.candidat_id === curCandId) return true;
        if (
          (curEmail === 'amina@mail.example' || curCandId === 'u-cand-amina' || curCandId === 'cand-amina') &&
          (c.candidat_id === 'u-cand-amina' || c.candidat_id === 'cand-amina')
        ) {
          return true;
        }
        if (c.candidat_nom.toLowerCase().trim() === curName) return true;
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

  // Sélection active locale (dérivée de façon sécurisée sans boucle infinie)
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Indicateur dynamique "en train d'écrire..."
  const [isTyping, setIsTyping] = useState(false);

  // Modal détails de l'offre
  const [showOfferModal, setShowOfferModal] = useState(false);

  // Réactions émojis locales stockées par message
  const [reactions, setReactions] = useState<Record<string, Record<string, number>>>({});

  // Conversation actuellement ouverte à droite
  const activeConversation = useMemo(() => {
    return (
      roleScopedConversations.find((c) => c.id === activeConvId) ||
      roleScopedConversations[0] ||
      null
    );
  }, [roleScopedConversations, activeConvId]);

  // AUTO-LECTURE SÉCURISÉE : Ne s'exécute qu'une seule fois par conversation non lue
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

  // Effet sonore subtil lors de l'envoi / réception
  const playChime = (type: 'send' | 'receive') => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'send') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch {
      // AudioContext non autorisé par le navigateur
    }
  };

  // ── 2. Filtrage secondaire (Recherche + Non lues) ───────────────────────────
  const filteredConversations = useMemo(() => {
    return roleScopedConversations.filter((conv) => {
      const interlocutor =
        currentRole === 'CANDIDAT'
          ? `${conv.recruteur_nom} ${conv.entreprise_nom} ${conv.offre_titre || ''}`
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

  // Sélection d'une conversation
  const selectConversation = (id: string) => {
    setSelectedId(id);
    if (onSelectConversation) onSelectConversation(id);
  };

  // ── 3. Envoi d'un message avec Réponse Automatique Dynamique ──────────────────
  const sendMessageContent = (text: string) => {
    if (!text.trim() || !activeConversation) return;

    // 1. Envoyer le message de l'utilisateur
    playChime('send');
    onSendMessage(activeConversation.id, text.trim());
    setInputText('');

    // 2. Déclencher une réponse dynamique de l'interlocuteur
    const conv = activeConversation;
    const isCandidat = currentRole === 'CANDIDAT';
    const otherRole: RoleName = isCandidat ? 'RECRUTEUR' : 'CANDIDAT';
    const otherName = isCandidat ? conv.recruteur_nom : conv.candidat_nom;

    // Afficher l'indicateur "en train d'écrire..."
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);

      // Génération de la réponse contextuelle dynamique
      let autoReply = '';
      const lower = text.toLowerCase();

      if (isCandidat) {
        // Le candidat a envoyé un message -> Le recruteur répond
        if (lower.includes('disponible') || lower.includes('entretien') || lower.includes('vendredi') || lower.includes('14h') || lower.includes('créneau') || lower.includes('oui')) {
          autoReply = `Parfait Amina ! C'est bien noté pour vendredi à 14h en visioconférence. Notre équipe technique prépare l'entretien de 30 minutes. Le lien d'accès vous sera confirmé directement. À très bientôt !`;
        } else if (lower.includes('précision') || lower.includes('poste') || lower.includes('stack') || lower.includes('react') || lower.includes('node') || lower.includes('télétravail')) {
          autoReply = `Bonjour Amina ! Notre projet consiste à faire évoluer une plateforme SaaS RH sous React, TypeScript et Node.js en mode hybride (2 jours de télétravail). Vos compétences correspondent parfaitement à nos besoins !`;
        } else if (lower.includes('merci') || lower.includes('remercie')) {
          autoReply = `Avec grand plaisir ! C'est un réel plaisir d'échanger avec vous. Nous finalisons l'étude des dossiers d'ici la fin de semaine. N'hésitez pas si vous avez la moindre question d'ici là !`;
        } else if (lower.includes('salaire') || lower.includes('rémunération') || lower.includes('tnd')) {
          autoReply = `Concernant la rémunération, la grille pour ce poste est de 1 800 à 2 400 TND / mois selon l'expérience. Nous pourrons en parler ouvertement lors de notre échange technique !`;
        } else {
          autoReply = `Bien reçu ! Merci pour votre retour rapide. J'ai bien noté ces éléments dans votre dossier et je reviens vers vous dans la journée.`;
        }
      } else {
        // Le recruteur a envoyé un message -> Le candidat répond
        if (lower.includes('entretien') || lower.includes('disponible') || lower.includes('échange')) {
          autoReply = `Merci beaucoup M. Ben Ali ! Je serai ravie d'échanger avec vous. Le créneau proposé me convient parfaitement, je reste connectée et disponible.`;
        } else {
          autoReply = `Merci pour ces précisions, c'est bien noté de mon côté ! Je reste à votre entière disposition pour tout complément d'information.`;
        }
      }

      playChime('receive');
      onSendMessage(conv.id, autoReply, otherRole, otherName);
    }, 1600);
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    sendMessageContent(inputText);
  };

  // Réaction émoji
  const toggleReaction = (msgId: string, emoji: string) => {
    setReactions((prev) => {
      const msgReactions = prev[msgId] || {};
      const currentCount = msgReactions[emoji] || 0;
      return {
        ...prev,
        [msgId]: {
          ...msgReactions,
          [emoji]: currentCount > 0 ? 0 : 1,
        },
      };
    });
  };

  // Suggestions rapides adaptées au contexte
  const quickReplies = useMemo(() => {
    if (currentRole === 'CANDIDAT') {
      const lastRecruiterMsg = activeMessages
        .filter((m) => m.sender_role === 'RECRUTEUR')
        .slice(-1)[0]?.contenu.toLowerCase() || '';

      if (lastRecruiterMsg.includes('vendredi') || lastRecruiterMsg.includes('disponible')) {
        return [
          'Oui, je suis disponible vendredi à 14h !',
          'Serait-il possible de décaler à 15h ?',
          'Parfait, je me connecte pour l\'entretien.',
        ];
      }

      return [
        'Bonjour, j\'aimerais avoir plus de précisions sur ce poste.',
        'Bonjour, je suis disponible pour convenir d\'un entretien.',
        'Merci beaucoup pour votre retour rapide !',
      ];
    } else {
      return [
        'Bonjour, votre profil retient toute notre attention pour un échange.',
        'Seriez-vous disponible pour un entretien vendredi à 14h ?',
        'Merci pour votre démarche, notre équipe étudie attentivement votre CV.',
      ];
    }
  }, [currentRole, activeMessages]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-4">
      {/* HEADER BANNER */}
      <div className="rounded-3xl border border-[#e8ebf3] bg-gradient-to-r from-white via-[#fafbfe] to-[#f4f2ff] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="grid size-11 place-items-center rounded-2xl bg-[#594be0] text-white shadow-md shadow-[#594be0]/20">
            <MessageSquare size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#171f33]">
                {currentRole === 'CANDIDAT'
                  ? 'Messagerie Candidat & Échanges Recruteurs'
                  : 'Messagerie Recruteur & Gestion des Candidats'}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf5] px-2.5 py-0.5 text-[10px] font-bold text-[#065f46] border border-[#a7f3d0]">
                <span className="size-1.5 rounded-full bg-[#10b981] animate-pulse" />
                En direct
              </span>
            </div>
            <p className="text-xs text-[#717a92] mt-0.5">
              {currentRole === 'CANDIDAT'
                ? 'Échangez en direct avec les recruteurs des entreprises où vous avez postulé.'
                : 'Communiquez en temps réel avec vos candidats présélectionnés.'}
            </p>
          </div>
        </div>

        {/* Indication du profil connecté */}
        <div className="flex items-center gap-2 text-xs text-[#636c82]">
          <span className="rounded-xl bg-white border border-[#e2e5ef] px-3.5 py-1.5 font-bold shadow-2xs">
            Connecté en tant que :{' '}
            <strong className="text-[#594be0]">
              {currentUser ? `${currentUser.prenom} ${currentUser.nom}` : currentRole}
            </strong>{' '}
            <span className="text-[10px] text-[#9099ad]">
              ({currentRole === 'CANDIDAT' ? 'Candidat' : currentRole === 'RECRUTEUR' ? 'Recruteur' : 'Admin'})
            </span>
          </span>
        </div>
      </div>

      {/* BOÎTE DE MESSAGERIE EN 2 COLONNES */}
      <div className="grid gap-4 lg:grid-cols-[360px_1fr] min-h-[620px] rounded-3xl border border-[#e8ebf3] bg-white shadow-xs overflow-hidden">
        {/* COLONNE GAUCHE: LISTE DES CONVERSATIONS */}
        <aside className="border-r border-[#edf0f7] flex flex-col bg-[#fcfdfe]">
          {/* Barre de recherche et filtre non-lus */}
          <div className="p-3.5 border-b border-[#edf0f7] space-y-2.5">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-[#9ea6bb]" />
              <input
                type="text"
                placeholder={
                  currentRole === 'CANDIDAT'
                    ? 'Rechercher un recruteur ou entreprise...'
                    : 'Rechercher un candidat ou une offre...'
                }
                value={searchQuery ?? ''}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[#e2e5ef] bg-white pl-9 pr-3 py-2 text-xs text-[#1e2538] outline-none focus:border-[#594be0]"
              />
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="font-extrabold text-[#747e96] uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                {currentRole === 'RECRUTEUR' ? (
                  <>
                    <Users size={12} className="text-[#594be0]" /> Candidats ({filteredConversations.length})
                  </>
                ) : (
                  <>
                    <Building2 size={12} className="text-[#594be0]" /> Recruteurs ({filteredConversations.length})
                  </>
                )}
              </span>
              <button
                type="button"
                onClick={() => setFilterUnreadOnly(!filterUnreadOnly)}
                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition ${
                  filterUnreadOnly
                    ? 'bg-[#594be0] text-white shadow-2xs'
                    : 'text-[#636c82] hover:bg-[#f0f2f7]'
                }`}
              >
                Non lues
              </button>
            </div>
          </div>

          {/* Liste des fils de discussion */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#f2f4f8]">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8c96ac] space-y-2">
                <p className="font-bold text-[#626d85]">Aucune discussion trouvée.</p>
                <p className="text-[11px]">
                  {currentRole === 'CANDIDAT'
                    ? 'Vous n\'avez pas encore engagé de conversation avec un recruteur.'
                    : 'Aucun candidat ne vous a encore écrit ou postulé.'}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = activeConversation?.id === conv.id;
                // Si la conversation est activement sélectionnée à droite, le badge passe visuellement à 0
                const unreadCount = isSelected
                  ? 0
                  : currentRole === 'CANDIDAT'
                  ? conv.non_lus_candidat
                  : conv.non_lus_recruteur;

                const primaryTitle =
                  currentRole === 'CANDIDAT' ? conv.recruteur_nom : conv.candidat_nom;
                const secondarySubtitle =
                  currentRole === 'CANDIDAT'
                    ? `${conv.entreprise_nom} • ${conv.offre_titre || 'Offre'}`
                    : conv.offre_titre || 'Candidature spontanée';

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => selectConversation(conv.id)}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition ${
                      isSelected
                        ? 'bg-[#f4f2ff] border-l-4 border-[#594be0]'
                        : 'hover:bg-[#f8f9fc]'
                    }`}
                  >
                    {/* Avatar avec pastille verte En Ligne */}
                    <div className="relative shrink-0">
                      {currentRole === 'RECRUTEUR' && conv.candidat_avatar ? (
                        <img
                          src={conv.candidat_avatar}
                          alt={conv.candidat_nom}
                          className="size-10 rounded-2xl object-cover border border-[#e2e5ef]"
                        />
                      ) : (
                        <div className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-[#6355e8] to-[#4c3ec8] text-white font-black text-xs shadow-xs">
                          {primaryTitle[0]}
                        </div>
                      )}

                      <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white bg-[#10b981]" />

                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-[#ef4444] text-[9px] font-black text-white shadow-xs">
                          {unreadCount}
                        </span>
                      )}
                    </div>

                    {/* Détails du fil */}
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
                        <span className="truncate">{secondarySubtitle}</span>
                      </div>

                      <p className="mt-1 text-[11px] text-[#6e778f] truncate">
                        {conv.dernier_message || 'Nouvelle conversation'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* COLONNE DROITE: FIL DE DISCUSSION ACTIF */}
        <main className="flex flex-col bg-white">
          {activeConversation ? (
            <>
              {/* Entête de la discussion active */}
              <div className="p-4 border-b border-[#edf0f7] flex items-center justify-between bg-white/90 backdrop-blur-xs">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="grid size-11 place-items-center rounded-2xl bg-[#594be0] text-white font-black text-sm shadow-xs">
                      {(currentRole === 'CANDIDAT'
                        ? activeConversation.recruteur_nom
                        : activeConversation.candidat_nom)[0]}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-[#10b981]" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-sm text-[#171f33]">
                        {currentRole === 'CANDIDAT'
                          ? activeConversation.recruteur_nom
                          : activeConversation.candidat_nom}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                          currentRole === 'CANDIDAT'
                            ? 'bg-[#f0efff] text-[#594be0] border border-[#dcd7fe]'
                            : 'bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]'
                        }`}
                      >
                        {currentRole === 'CANDIDAT' ? 'Recruteur' : 'Candidat'}
                      </span>
                      <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-[#10b981]">
                        <span className="size-1.5 rounded-full bg-[#10b981]" />
                        En ligne
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-[#717a92] mt-0.5">
                      <span className="font-bold text-[#594be0]">
                        {activeConversation.entreprise_nom}
                      </span>
                      {activeConversation.offre_titre && (
                        <>
                          <span>•</span>
                          <span className="truncate text-[#525a70]">
                            {activeConversation.offre_titre}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bouton pour afficher les détails de l'offre dans un modal sans quitter le chat */}
                {activeConversation.offre_titre && (
                  <button
                    type="button"
                    onClick={() => setShowOfferModal(true)}
                    className="flex items-center gap-1.5 rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-1.5 text-xs font-bold text-[#535c72] hover:bg-white hover:border-[#594be0] hover:text-[#594be0] transition shadow-2xs"
                  >
                    <Briefcase size={13} className="text-[#594be0]" />
                    <span>Consulter l'offre</span>
                  </button>
                )}
              </div>

              {/* Zone des bulles de messages */}
              <div className="flex-1 p-5 overflow-y-auto space-y-3.5 bg-[#fafbfe]/60">
                {activeMessages.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#8e98af]">
                    Aucun message dans cette discussion. Démarrez l'échange ci-dessous !
                  </div>
                ) : (
                  activeMessages.map((msg) => {
                    const isMe =
                      (currentUser && msg.sender_id === currentUser.id) ||
                      msg.sender_role === currentRole;
                    const msgReactions = reactions[msg.id] || {};

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`relative max-w-md sm:max-w-lg rounded-2xl p-3.5 text-xs leading-relaxed shadow-2xs transition ${
                            isMe
                              ? 'bg-[#594be0] text-white rounded-br-xs'
                              : 'bg-white text-[#1f273b] border border-[#e8ebf3] rounded-bl-xs'
                          }`}
                        >
                          <div className="font-extrabold text-[10px] mb-1 opacity-80 flex items-center justify-between gap-3">
                            <span>{isMe ? 'Vous' : msg.sender_name}</span>
                            <span className="text-[9px] font-normal opacity-75">
                              {msg.sender_role === 'RECRUTEUR' ? 'Recruteur' : 'Candidat'}
                            </span>
                          </div>

                          <div className="text-[12px] whitespace-pre-wrap">{msg.contenu}</div>

                          <div
                            className={`mt-1.5 flex items-center justify-end gap-1 text-[9px] ${
                              isMe ? 'text-white/80' : 'text-[#8e97ae]'
                            }`}
                          >
                            <span>{msg.created_at.split(' ')[1] || msg.created_at}</span>
                            {isMe && <CheckCheck size={12} className="text-white/90" />}
                          </div>

                          {/* Barre d'émojis flottante au survol */}
                          <div className={`absolute -top-3 ${isMe ? 'right-2' : 'left-2'} hidden group-hover:flex items-center gap-0.5 rounded-full bg-white border border-[#dde1ee] px-1.5 py-0.5 shadow-sm text-xs z-10`}>
                            {['👍', '❤️', '👏', '🎉'].map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => toggleReaction(msg.id, emoji)}
                                className="hover:scale-125 transition p-0.5"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>

                          {/* Affichage des réactions enregistrées */}
                          {Object.entries(msgReactions).some(([, count]) => count > 0) && (
                            <div className="mt-1 flex items-center gap-1">
                              {Object.entries(msgReactions).map(([em, cnt]) =>
                                cnt > 0 ? (
                                  <span
                                    key={em}
                                    onClick={() => toggleReaction(msg.id, em)}
                                    className={`cursor-pointer rounded-full px-1.5 py-0.2 text-[10px] font-bold border ${
                                      isMe
                                        ? 'bg-white/20 border-white/30 text-white'
                                        : 'bg-[#f0f2f7] border-[#e2e5ef] text-[#171f33]'
                                    }`}
                                  >
                                    {em}
                                  </span>
                                ) : null
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Indicateur dynamique : En train d'écrire... */}
                {isTyping && (
                  <div className="flex items-center gap-2 text-xs text-[#717a92] animate-in fade-in duration-200">
                    <div className="grid size-7 place-items-center rounded-xl bg-[#594be0] text-white text-[10px] font-bold">
                      {(currentRole === 'CANDIDAT'
                        ? activeConversation.recruteur_nom
                        : activeConversation.candidat_nom)[0]}
                    </div>
                    <div className="rounded-2xl rounded-tl-xs bg-white border border-[#e8ebf3] px-3.5 py-2 text-xs flex items-center gap-2 shadow-2xs">
                      <span className="font-semibold text-[#171f33]">
                        {currentRole === 'CANDIDAT'
                          ? activeConversation.recruteur_nom
                          : activeConversation.candidat_nom}{' '}
                        est en train d'écrire
                      </span>
                      <span className="inline-flex gap-1 items-center">
                        <span className="size-1.5 rounded-full bg-[#594be0] animate-bounce [animation-delay:-0.3s]" />
                        <span className="size-1.5 rounded-full bg-[#594be0] animate-bounce [animation-delay:-0.15s]" />
                        <span className="size-1.5 rounded-full bg-[#594be0] animate-bounce" />
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions rapides de messages interactives */}
              <div className="px-4 py-2 border-t border-[#f0f2f7] bg-white flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-[#919bb1] mr-1 flex items-center gap-1">
                  <Zap size={11} className="text-[#594be0]" />
                  <span>Suggestions rapides :</span>
                </span>
                {quickReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => sendMessageContent(reply)}
                    className="group rounded-full bg-[#f4f2ff] px-3 py-1 text-[11px] font-semibold text-[#5547d7] hover:bg-[#594be0] hover:text-white transition flex items-center gap-1 shadow-2xs"
                    title="Cliquer pour envoyer directement ce message"
                  >
                    <span>{reply}</span>
                    <Send size={10} className="opacity-0 group-hover:opacity-100 transition" />
                  </button>
                ))}
              </div>

              {/* Barre de saisie et envoi */}
              <form onSubmit={handleSend} className="p-3.5 border-t border-[#edf0f7] bg-white flex items-center gap-2">
                <input
                  type="text"
                  placeholder={
                    currentRole === 'CANDIDAT'
                      ? 'Écrivez votre message au recruteur...'
                      : 'Répondez au candidat...'
                  }
                  value={inputText ?? ''}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 rounded-2xl border border-[#e2e5ef] bg-[#fafbfc] px-4 py-2.5 text-xs text-[#1e2538] outline-none focus:border-[#594be0] focus:bg-white transition"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="flex items-center gap-1.5 rounded-2xl bg-[#594be0] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#594be0]/20 hover:bg-[#4739d2] transition disabled:opacity-40"
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

      {/* MODAL EN CONTEXTE : CONSULTER L'OFFRE SANS QUITTER LE CHAT */}
      {showOfferModal && activeConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-3xl border border-[#e8ebf3] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#f0f2f7] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="grid size-9 place-items-center rounded-xl bg-[#594be0] text-white">
                  <Briefcase size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#171f33]">
                    {activeConversation.offre_titre || 'Offre d\'emploi'}
                  </h3>
                  <p className="text-xs text-[#594be0] font-bold">
                    {activeConversation.entreprise_nom}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOfferModal(false)}
                className="grid size-8 place-items-center rounded-xl bg-[#f0f2f7] text-[#697288] hover:bg-[#e4e8f1]"
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
                <span className="rounded-lg bg-[#fffbeb] px-2.5 py-1 font-bold text-[#b45309]">
                  Rémunération : {activeOffer?.salaire || '1 800 - 2 400 TND / mois'}
                </span>
              </div>

              <div>
                <strong className="text-[#171f33]">Description du poste :</strong>
                <p className="mt-1 leading-relaxed text-[#596378]">
                  {activeOffer?.description ||
                    'Nous recherchons un(e) Développeur(se) passionné(e) pour concevoir et faire évoluer nos plateformes SaaS métiers avec React, TypeScript et Node.js.'}
                </p>
              </div>

              {activeOffer?.competences_requises && (
                <div>
                  <strong className="text-[#171f33]">Compétences recherchées :</strong>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {activeOffer.competences_requises.map((c, i) => (
                      <span
                        key={i}
                        className="rounded-md border border-[#e2e5ef] bg-[#fafbfc] px-2 py-0.5 text-[10px] font-semibold text-[#50596e]"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#f0f2f7]">
              <button
                type="button"
                onClick={() => setShowOfferModal(false)}
                className="rounded-xl border border-[#dde1ee] px-4 py-2 text-xs font-bold text-[#444c60] hover:bg-[#f6f7fb]"
              >
                Fermer
              </button>
              {onNavigateScreen && (
                <button
                  type="button"
                  onClick={() => {
                    setShowOfferModal(false);
                    onNavigateScreen('E1');
                  }}
                  className="rounded-xl bg-[#594be0] px-4 py-2 text-xs font-bold text-white hover:bg-[#4739d2] transition shadow-xs flex items-center gap-1.5"
                >
                  <span>Ouvrir sur le catalogue complet</span>
                  <ExternalLink size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
