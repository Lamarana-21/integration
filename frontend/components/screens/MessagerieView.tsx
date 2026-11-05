'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Briefcase,
  Building2,
  Check,
  CheckCheck,
  ChevronRight,
  Clock,
  Filter,
  MessageSquare,
  Plus,
  Search,
  Send,
  Sparkles,
  User,
  Users,
  X,
  FileText,
} from 'lucide-react';
import { ChatMessage, Conversation, RoleName, User as UserType } from '@/lib/types';

interface MessagerieViewProps {
  currentRole: RoleName;
  currentUser: UserType | null;
  conversations: Conversation[];
  messages: ChatMessage[];
  onSendMessage: (conversationId: string, contenu: string) => void;
  selectedConversationId?: string | null;
  onSelectConversation?: (id: string) => void;
  onNavigateScreen?: (screen: string) => void;
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
}: MessagerieViewProps) {
  // ── 1. Filtrage strict par Rôle et Utilisateur connecté ─────────────────────
  // Candidat : Voit UNIQUEMENT ses échanges avec les recruteurs
  // Recruteur : Voit TOUTES les conversations reçues des candidats pour son entreprise/poste
  const roleScopedConversations = useMemo(() => {
    if (!currentUser) return conversations;

    if (currentRole === 'CANDIDAT') {
      const curCandId = currentUser.id;
      const curName = `${currentUser.prenom} ${currentUser.nom}`.toLowerCase().trim();
      const curEmail = currentUser.email?.toLowerCase().trim() || '';

      return conversations.filter((c) => {
        // ID direct du candidat
        if (c.candidat_id === curCandId) return true;
        // Correspondance compte démo Amina
        if (
          (curEmail === 'amina@mail.example' || curCandId === 'u-cand-amina' || curCandId === 'cand-amina') &&
          (c.candidat_id === 'u-cand-amina' || c.candidat_id === 'cand-amina')
        ) {
          return true;
        }
        // Correspondance par nom complet
        if (c.candidat_nom.toLowerCase().trim() === curName) return true;
        return false;
      });
    }

    if (currentRole === 'RECRUTEUR') {
      const curRecId = currentUser.id;
      const curEntId = currentUser.entreprise_id;
      const curEmail = currentUser.email?.toLowerCase().trim() || '';

      return conversations.filter((c) => {
        // ID direct du recruteur
        if (c.recruteur_id === curRecId) return true;
        // ID de l'entreprise
        if (curEntId && c.entreprise_id === curEntId) return true;
        // Compte démo Rached Ben Ali / Société Alpha
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

    // Administrateur : vue de supervision complète
    return conversations;
  }, [conversations, currentUser, currentRole]);

  // Sélection active initiale
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(
    propSelectedId || (roleScopedConversations.length > 0 ? roleScopedConversations[0].id : null)
  );

  const activeConvId = propSelectedId || internalSelectedId;

  // Filtres recherche et non-lus
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);

  // Saisie du message
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Synchronisation si propSelectedId change ou si la liste change
  useEffect(() => {
    if (propSelectedId) {
      setInternalSelectedId(propSelectedId);
    } else if (roleScopedConversations.length > 0 && !roleScopedConversations.some((c) => c.id === internalSelectedId)) {
      setInternalSelectedId(roleScopedConversations[0].id);
    }
  }, [propSelectedId, roleScopedConversations, internalSelectedId]);

  // Défilement automatique vers le bas lors de l'arrivée d'un message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeConvId]);

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

  // Conversation actuellement ouverte à droite
  const activeConversation = useMemo(() => {
    return (
      roleScopedConversations.find((c) => c.id === activeConvId) ||
      roleScopedConversations[0] ||
      null
    );
  }, [roleScopedConversations, activeConvId]);

  // Messages spécifiques à la discussion active
  const activeMessages = useMemo(() => {
    if (!activeConversation) return [];
    return messages.filter((m) => m.conversation_id === activeConversation.id);
  }, [messages, activeConversation]);

  // Sélection d'une conversation
  const selectConversation = (id: string) => {
    setInternalSelectedId(id);
    if (onSelectConversation) onSelectConversation(id);
  };

  // Envoi d'un message
  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeConversation) return;

    onSendMessage(activeConversation.id, inputText.trim());
    setInputText('');
  };

  // Réponses rapides contextuelles selon le rôle
  const quickReplies = useMemo(() => {
    if (currentRole === 'CANDIDAT') {
      return [
        'Bonjour, j\'aimerais avoir plus de précisions sur ce poste.',
        'Bonjour, je suis disponible pour convenir d\'un entretien.',
        'Merci beaucoup pour votre retour rapide !',
      ];
    } else {
      return [
        'Bonjour, votre profil retient toute notre attention pour un échange.',
        'Seriez-vous disponible pour un entretien cette semaine ?',
        'Pourriez-vous nous préciser vos disponibilités pour un échange technique ?',
        'Merci pour votre démarche, notre équipe étudie attentivement votre CV.',
      ];
    }
  }, [currentRole]);

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
              <span className="rounded-full bg-[#ecfdf5] px-2.5 py-0.5 text-[10px] font-bold text-[#065f46] border border-[#a7f3d0]">
                En ligne (Direct)
              </span>
            </div>
            <p className="text-xs text-[#717a92] mt-0.5">
              {currentRole === 'CANDIDAT'
                ? 'Consultez uniquement vos échanges privés avec les recruteurs des offres postulées.'
                : 'Accédez à toutes les discussions envoyées par les candidats ayant postulé ou pris contact.'}
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
      <div className="grid gap-4 lg:grid-cols-[360px_1fr] min-h-[600px] rounded-3xl border border-[#e8ebf3] bg-white shadow-xs overflow-hidden">
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
                const unreadCount =
                  currentRole === 'CANDIDAT' ? conv.non_lus_candidat : conv.non_lus_recruteur;

                // Titre et sous-titre selon le point de vue
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
                    {/* Avatar avec badge non lu */}
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
                  <div className="grid size-11 place-items-center rounded-2xl bg-[#594be0] text-white font-black text-sm shadow-xs">
                    {(currentRole === 'CANDIDAT'
                      ? activeConversation.recruteur_nom
                      : activeConversation.candidat_nom)[0]}
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

                {/* Bouton vers l'offre associée */}
                {activeConversation.offre_id && onNavigateScreen && (
                  <button
                    type="button"
                    onClick={() => onNavigateScreen('E1')}
                    className="hidden sm:flex items-center gap-1.5 rounded-xl border border-[#e2e5ef] px-3.5 py-1.5 text-xs font-bold text-[#535c72] hover:bg-[#f6f7fb] hover:border-[#ccd2e0] transition"
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

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-md sm:max-w-lg rounded-2xl p-3.5 text-xs leading-relaxed shadow-2xs ${
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
                          <div className="text-[12px]">{msg.contenu}</div>
                          <div
                            className={`mt-1.5 flex items-center justify-end gap-1 text-[9px] ${
                              isMe ? 'text-white/80' : 'text-[#8e97ae]'
                            }`}
                          >
                            <span>{msg.created_at.split(' ')[1] || msg.created_at}</span>
                            {isMe && <CheckCheck size={12} />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions rapides de messages */}
              <div className="px-4 py-2 border-t border-[#f0f2f7] bg-white flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-[#919bb1] mr-1">
                  Suggestions rapides :
                </span>
                {quickReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setInputText(reply)}
                    className="rounded-full bg-[#f4f2ff] px-2.5 py-1 text-[11px] font-semibold text-[#5547d7] hover:bg-[#ebe7fe] transition"
                  >
                    {reply}
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
    </div>
  );
}
