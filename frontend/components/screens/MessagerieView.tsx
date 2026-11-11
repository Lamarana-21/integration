'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCheck,
  FileText,
  MessageSquare,
  Search,
  Send,
  Users,
  X,
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
  }, [messages, activeConvId]);

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

  // Sélection d'une conversation
  const selectConversation = (id: string) => {
    setSelectedId(id);
    if (onSelectConversation) onSelectConversation(id);
  };

  // ── 3. Envoi d'un message (avec réponse automatique d'accueil informative au 1er message, sans aucune décision) ──
  const sendCandidateMessageWithFirstAutoReply = (textToSend: string) => {
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

    // Vérifier s'il s'agit du premier échange avec cette entreprise (aucune réponse existante de l'entreprise)
    const hasEnterpriseRepliedBefore = activeMessages.some(
      (m) => m.sender_role === 'RECRUTEUR'
    );

    onSendMessage(activeConversation.id, trimmed);

    if (!hasEnterpriseRepliedBefore) {
      const entName = activeConversation.entreprise_nom || "L'entreprise";
      const offerTitle = activeConversation.offre_titre
        ? ` pour le poste « ${activeConversation.offre_titre} »`
        : '';
      const lower = trimmed.toLowerCase();

      let autoReplyText = `Bonjour,\n\nMerci d'avoir contacté le service recrutement de ${entName}${offerTitle}. Votre message a bien été enregistré et transmis à nos recruteurs.\n\nℹ️ Information automatique : Ce message est un accusé de réception qui ne constitue pas une décision de recrutement. Notre équipe étudie chaque dossier manuellement et vous répondra ici dès que possible.`;

      if (lower.includes('délai') || lower.includes('delai') || lower.includes('quand')) {
        autoReplyText = `Bonjour,\n\nMerci pour votre message auprès de ${entName}${offerTitle}.\n\n📅 Délai habituel d'étude : Nos équipes RH examinent les candidatures sous 48h à 72h ouvrées. Ce message automatique est purement informatif et n'engage aucune décision sur votre dossier : un recruteur vous répondra personnellement après étude de votre profil.`;
      } else if (lower.includes('télétravail') || lower.includes('teletravail') || lower.includes('hybride')) {
        autoReplyText = `Bonjour,\n\nMerci pour votre intérêt envers ${entName}${offerTitle}.\n\n🏢 Modalités d'organisation : Selon les équipes, nos postes fonctionnent en mode présentiel ou hybride. Un recruteur de ${entName} reviendra vers vous pour préciser les modalités exactes liées à ce poste (réponse automatique d'information, sans décision sur votre candidature).`;
      } else if (lower.includes('étape') || lower.includes('etape') || lower.includes('processus') || lower.includes('entretien')) {
        autoReplyText = `Bonjour,\n\nMerci d'avoir écrit à ${entName}${offerTitle}.\n\n📋 Processus habituel : 1) Réception du dossier, 2) Examen par l'équipe RH, 3) Entretien (visio ou présentiel), 4) Décision finale officielle dans votre espace candidat. Votre message a été transmis à nos recruteurs.`;
      }

      const convId = activeConversation.id;
      setTimeout(() => {
        onSendMessage(convId, autoReplyText, 'RECRUTEUR', entName);
      }, 900);
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeConversation) return;
    sendCandidateMessageWithFirstAutoReply(inputText);
    setInputText('');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-5 font-sans">
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
                  ? 'Messagerie & Échanges Entreprises'
                  : 'Messagerie Recruteur & Gestion des Candidats'}
              </h1>
            </div>
            <p className="text-xs text-[#717a92] mt-0.5">
              {currentRole === 'CANDIDAT'
                ? 'Retrouvez ici les réponses et messages envoyés par les entreprises où vous avez postulé.'
                : 'Communiquez avec vos candidats au nom de votre entreprise.'}
            </p>
          </div>
        </div>

        {/* Indication du profil connecté */}
        <div className="flex items-center gap-2 text-xs text-[#636c82]">
          <span className="rounded-xl bg-white border border-[#e2e5ef] px-3.5 py-1.5 font-bold shadow-2xs">
            Espace de{' '}
            <strong className="text-[#594be0]">
              {currentUser ? `${currentUser.prenom} ${currentUser.nom}` : currentRole}
            </strong>
          </span>
        </div>
      </div>

      {/* ÉTAT VIDE PROPRE SI LE CANDIDAT N'A AUCUNE DISCUSSION */}
      {currentRole === 'CANDIDAT' && roleScopedConversations.length === 0 ? (
        <div className="rounded-3xl border border-[#e8ebf3] bg-white p-12 sm:p-16 text-center shadow-xs space-y-5">
          <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-[#f4f2ff] text-[#594be0] border border-[#e3dfff]">
            <Building2 size={30} />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-lg font-black text-[#171f33]">
              Aucun message pour le moment
            </h2>
            <p className="text-xs text-[#6e778f] leading-relaxed">
              Votre boîte de réception est vide. Lorsqu'une entreprise répond à l'une de vos candidatures ou lorsque vous contactez une entreprise depuis une offre, la discussion s'affichera ici.
            </p>
          </div>
          {onNavigateScreen && (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigateScreen('E5')}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#dde1ee] bg-white px-4 py-2.5 text-xs font-bold text-[#424b61] hover:bg-[#f6f7fb] transition"
              >
                <FileText size={14} />
                <span>Voir mes candidatures</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateScreen('E1')}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#594be0] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#594be0]/20 hover:bg-[#4739d2] transition"
              >
                <span>Explorer les offres</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* BOÎTE DE MESSAGERIE EN 2 COLONNES */
        <div className="grid gap-0 lg:grid-cols-[340px_1fr] min-h-[580px] rounded-3xl border border-[#e8ebf3] bg-white shadow-xs overflow-hidden">
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
                      ? 'Rechercher une entreprise ou offre...'
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
                      <Building2 size={12} className="text-[#594be0]" /> Entreprises ({filteredConversations.length})
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

                  // Côté candidat : afficher uniquement l'entreprise (jamais le nom personnel du recruteur)
                  const primaryTitle =
                    currentRole === 'CANDIDAT'
                      ? conv.entreprise_nom || 'Entreprise'
                      : conv.candidat_nom;
                  const secondarySubtitle =
                    currentRole === 'CANDIDAT'
                      ? conv.offre_titre || 'Service Recrutement'
                      : conv.offre_titre || 'Candidature';

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
                      {/* Avatar Entreprise ou Candidat */}
                      <div className="relative shrink-0">
                        {currentRole === 'RECRUTEUR' && conv.candidat_avatar ? (
                          <img
                            src={conv.candidat_avatar}
                            alt={conv.candidat_nom}
                            className="size-10 rounded-2xl object-cover border border-[#e2e5ef]"
                          />
                        ) : (
                          <div className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-[#6355e8] to-[#4c3ec8] text-white font-black text-xs shadow-xs">
                            {primaryTitle?.[0] || 'E'}
                          </div>
                        )}

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
                          {conv.dernier_message || 'Aucun message'}
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
                    <div className="grid size-11 place-items-center rounded-2xl bg-[#594be0] text-white font-black text-sm shadow-xs">
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
                          {currentRole === 'CANDIDAT' ? 'Entreprise' : 'Candidat'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-[#717a92] mt-0.5">
                        {currentRole === 'CANDIDAT' ? (
                          <span>
                            {activeConversation.offre_titre
                              ? `Offre : ${activeConversation.offre_titre}`
                              : 'Équipe Recrutement'}
                          </span>
                        ) : (
                          <>
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
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bouton pour afficher les détails de l'offre */}
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
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center space-y-2">
                      <div className="grid size-12 place-items-center rounded-2xl bg-[#f4f2ff] text-[#594be0]">
                        <MessageSquare size={20} />
                      </div>
                      <p className="text-xs font-bold text-[#171f33]">
                        Aucun message dans cette discussion
                      </p>
                      <p className="text-[11px] text-[#7d869e] max-w-xs">
                        {currentRole === 'CANDIDAT'
                          ? `Envoyez un message à ${activeConversation.entreprise_nom}. Leurs recruteurs vous répondront directement ici.`
                          : `Écrivez un message à ${activeConversation.candidat_nom}.`}
                      </p>
                    </div>
                  ) : (
                    activeMessages.map((msg) => {
                      const isMe =
                        (currentUser && msg.sender_id === currentUser.id) ||
                        msg.sender_role === currentRole;

                      // Côté candidat, tout message envoyé par un recruteur affiche le nom de l'entreprise
                      const displayedSenderName = isMe
                        ? 'Vous'
                        : currentRole === 'CANDIDAT' && msg.sender_role === 'RECRUTEUR'
                        ? activeConversation.entreprise_nom
                        : msg.sender_name;

                      const displayedRoleLabel =
                        msg.sender_role === 'RECRUTEUR' ? 'Entreprise' : 'Candidat';

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`relative max-w-md sm:max-w-lg rounded-2xl p-3.5 text-xs leading-relaxed shadow-2xs transition ${
                              isMe
                                ? 'bg-[#594be0] text-white rounded-br-xs'
                                : 'bg-white text-[#1f273b] border border-[#e8ebf3] rounded-bl-xs'
                            }`}
                          >
                            <div className="font-extrabold text-[10px] mb-1 opacity-85 flex items-center justify-between gap-3">
                              <span>{displayedSenderName}</span>
                              <span className="text-[9px] font-normal opacity-75">
                                {displayedRoleLabel}
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
                          </div>
                        </div>
                      );
                    })
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Suggestions rapides pour un premier contact côté candidat */}
                {currentRole === 'CANDIDAT' && activeMessages.length === 0 && (
                  <div className="px-4 py-2.5 border-t border-[#edf0f7] bg-[#f8f9fd] flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#7c859c] mr-1">
                      Questions fréquentes :
                    </span>
                    {[
                      'Quels sont les délais de traitement des candidatures ?',
                      'Quelles sont les étapes du processus de recrutement ?',
                      'Le poste est-il ouvert au mode hybride / télétravail ?',
                    ].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => sendCandidateMessageWithFirstAutoReply(q)}
                        className="rounded-xl border border-[#dcd7fe] bg-white px-2.5 py-1 text-[11px] font-bold text-[#594be0] hover:bg-[#f0efff] transition"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                {/* Barre de saisie et envoi */}
                <form onSubmit={handleSend} className="p-3.5 border-t border-[#edf0f7] bg-white flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={
                      currentRole === 'CANDIDAT'
                        ? `Écrivez votre message à ${activeConversation.entreprise_nom}...`
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
      )}

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
                    {activeConversation.offre_titre || "Offre d'emploi"}
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
                    `Rejoignez l'équipe de ${activeConversation.entreprise_nom} dans le cadre du poste « ${activeConversation.offre_titre} ».`}
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
                  className="rounded-xl border border-[#dde1ee] bg-white px-4 py-2 text-xs font-bold text-[#495269] hover:bg-[#f6f7fb]"
                >
                  Toutes les offres
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowOfferModal(false)}
                className="rounded-xl bg-[#594be0] px-5 py-2 text-xs font-bold text-white hover:bg-[#483ad3]"
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
