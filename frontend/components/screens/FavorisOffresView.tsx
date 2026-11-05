'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Bookmark,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Eye,
  Heart,
  MapPin,
  MessageSquare,
  Search,
  Send,
  Trash2,
  Wallet,
  Sparkles,
  ArrowRight,
  BriefcaseBusiness,
} from 'lucide-react';
import { Offre, isJobFavorited } from '@/lib/types';

interface FavorisOffresViewProps {
  favorisOffresIds: string[];
  allOffres: Offre[];
  onToggleFavori: (offreId: string) => void;
  onViewJobDetail: (offre: Offre) => void;
  onPostuler: (offre: Offre) => void;
  onContactRecruiter: (offre: Offre) => void;
  onNavigateScreen?: (screen: string) => void;
  appliedOffreIds?: string[];
}

export function FavorisOffresView({
  favorisOffresIds,
  allOffres,
  onToggleFavori,
  onViewJobDetail,
  onPostuler,
  onContactRecruiter,
  onNavigateScreen,
  appliedOffreIds = [],
}: FavorisOffresViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContrat, setSelectedContrat] = useState<string>('TOUS');

  // État local réactif pour affichage immédiat et synchronisé
  const [activeFavIds, setActiveFavIds] = useState<string[]>(() => {
    if (Array.isArray(favorisOffresIds) && favorisOffresIds.length > 0) {
      return favorisOffresIds;
    }
    try {
      const cached = sessionStorage.getItem('talenta_favoris');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return favorisOffresIds || [];
  });

  // Synchronisation stricte avec les favoris du parent
  useEffect(() => {
    if (Array.isArray(favorisOffresIds)) {
      setActiveFavIds(favorisOffresIds);
    }
  }, [favorisOffresIds]);

  // Filtrer uniquement les offres qui sont dans activeFavIds avec matching tolérant
  const favorisOffres = useMemo(() => {
    return allOffres.filter((o) => isJobFavorited(o.id, activeFavIds));
  }, [allOffres, activeFavIds]);

  // Filtrage selon recherche & contrat
  const filteredFavoris = useMemo(() => {
    return favorisOffres.filter((offre) => {
      if (selectedContrat !== 'TOUS' && offre.type_contrat !== selectedContrat) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitre = offre.titre.toLowerCase().includes(query);
        const matchEnt = offre.entreprise?.nom?.toLowerCase().includes(query);
        const matchLieu = offre.lieu?.toLowerCase().includes(query);
        const matchComp = offre.competences_requises?.some((c) => c.toLowerCase().includes(query));
        return matchTitre || matchEnt || matchLieu || matchComp;
      }
      return true;
    });
  }, [favorisOffres, searchQuery, selectedContrat]);

  const handleRemoveFavori = (offreId: string) => {
    setActiveFavIds((prev) => {
      const next = prev.filter((id) => String(id).trim().toLowerCase() !== String(offreId).trim().toLowerCase());
      try {
        sessionStorage.setItem('talenta_favoris', JSON.stringify(next));
      } catch {}
      return next;
    });
    onToggleFavori(offreId);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-6">
      {/* HEADER BANNER */}
      <div className="rounded-3xl border border-[#e8ebf3] bg-gradient-to-r from-white via-[#fafbfe] to-[#fff1f2] p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="grid size-12 place-items-center rounded-2xl bg-[#f43f5e] text-white shadow-md shadow-[#f43f5e]/25">
              <Heart size={22} className="fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#171f33]">
                  Mes Offres Favorites
                </h1>
                <span className="rounded-full bg-[#ffe4e6] px-2.5 py-0.5 text-xs font-black text-[#e11d48]">
                  {favorisOffres.length} {favorisOffres.length > 1 ? 'offres sauvegardées' : 'offre sauvegardée'}
                </span>
              </div>
              <p className="text-xs text-[#717a92] mt-0.5">
                Retrouvez vos offres coup de cœur, postulez avec votre CV ou contactez directement le recruteur.
              </p>
            </div>
          </div>

          {onNavigateScreen && (
            <button
              type="button"
              onClick={() => onNavigateScreen('E1')}
              className="self-start sm:self-auto flex items-center gap-2 rounded-2xl border border-[#d8dce8] bg-white px-4 py-2.5 text-xs font-bold text-[#424b61] shadow-xs hover:bg-[#f6f7fb] transition"
            >
              <span>Découvrir d'autres offres</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>

        {/* BARRE DE RECHERCHE ET FILTRES */}
        {favorisOffres.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 border-t border-[#edf0f7] pt-4">
            <div className="relative w-full sm:flex-1">
              <Search size={15} className="absolute left-3.5 top-3 text-[#9aa2b5]" />
              <input
                type="text"
                placeholder="Rechercher dans mes favoris par mot-clé, poste, compétence..."
                value={searchQuery ?? ''}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[#e2e5ef] bg-white pl-10 pr-3.5 py-2 text-xs text-[#1e2538] outline-none focus:border-[#594be0]"
              />
            </div>

            <select
              value={selectedContrat}
              onChange={(e) => setSelectedContrat(e.target.value)}
              className="w-full sm:w-auto rounded-xl border border-[#e2e5ef] bg-white px-3.5 py-2 text-xs text-[#1e2538] outline-none focus:border-[#594be0]"
            >
              <option value="TOUS">Tous les contrats</option>
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
              <option value="STAGE">Stage</option>
              <option value="ALTERNANCE">Alternance</option>
              <option value="FREELANCE">Freelance</option>
            </select>
          </div>
        )}
      </div>

      {/* LISTE DES OFFRES FAVORITES */}
      {favorisOffres.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#d8dce8] bg-white p-12 text-center shadow-xs space-y-4">
          <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-[#fff1f2] text-[#f43f5e]">
            <Heart size={28} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#171f33]">Vous n'avez aucune offre en favoris pour le moment</h3>
            <p className="mt-1 text-xs text-[#717a92] max-w-md mx-auto leading-relaxed">
              Pendant que vous explorez les offres sur la plateforme, cliquez sur le bouton cœur pour les ajouter à vos favoris et les retrouver ici en 1 clic.
            </p>
          </div>
          {onNavigateScreen && (
            <button
              type="button"
              onClick={() => onNavigateScreen('E1')}
              className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-[#594be0] px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-[#594be0]/20 hover:bg-[#4739d2] transition"
            >
              <span>Parcourir les offres disponibles</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      ) : filteredFavoris.length === 0 ? (
        <div className="rounded-3xl border border-[#e8ebf3] bg-white p-8 text-center text-xs text-[#717a92]">
          Aucune offre favorite ne correspond à vos filtres de recherche.
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredFavoris.map((offre) => {
            const hasApplied = appliedOffreIds.includes(offre.id);
            const compList = offre.competences_requises || [];

            return (
              <div
                key={offre.id}
                className="group rounded-3xl border border-[#e8ebf3] bg-white p-5 sm:p-6 shadow-xs hover:border-[#594be0]/40 hover:shadow-md transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Logo Entreprise */}
                    <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-[#594be0] to-[#7f73f2] text-xl font-black text-white shadow-md shadow-[#594be0]/20 shrink-0">
                      {offre.entreprise?.nom ? offre.entreprise.nom[0] : 'O'}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#f0efff] px-2.5 py-0.5 text-xs font-bold text-[#594be0]">
                          {offre.type_contrat}
                        </span>
                        {hasApplied && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#edf9f3] px-2.5 py-0.5 text-xs font-bold text-[#248e56]">
                            <CheckCircle2 size={12} /> Candidature déposée
                          </span>
                        )}
                        <span className="text-xs text-[#828ca1]">
                          Publiée le {offre.date_publication || 'Récemment'}
                        </span>
                      </div>

                      <h3
                        onClick={() => onViewJobDetail(offre)}
                        className="text-base sm:text-lg font-black text-[#171f33] hover:text-[#594be0] cursor-pointer transition"
                      >
                        {offre.titre}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#6e778f]">
                        <span className="flex items-center gap-1 font-semibold text-[#171f33]">
                          <Building2 size={13} className="text-[#594be0]" />
                          {offre.entreprise?.nom || 'Entreprise'}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <MapPin size={13} /> {offre.lieu}
                        </span>
                        {offre.salaire && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1 font-semibold text-[#16a34a]">
                              <Wallet size={13} /> {offre.salaire}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Rapides */}
                  <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRemoveFavori(offre.id)}
                      title="Retirer des favoris"
                      className="grid size-9 place-items-center rounded-xl border border-[#ffd8db] bg-[#fff1f2] text-[#e11d48] hover:bg-[#ffe4e6] transition"
                    >
                      <Heart size={16} className="fill-[#e11d48]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onViewJobDetail(offre)}
                      className="flex items-center gap-1.5 rounded-xl border border-[#dde0ec] bg-white px-3.5 py-2 text-xs font-bold text-[#454e63] hover:bg-[#f8f9fd] transition"
                    >
                      <Eye size={14} />
                      <span>Détails</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onPostuler(offre)}
                      disabled={hasApplied}
                      className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs transition ${
                        hasApplied
                          ? 'bg-[#b6bccb] cursor-not-allowed'
                          : 'bg-[#594be0] hover:bg-[#4739d2] shadow-[#594be0]/20'
                      }`}
                    >
                      <Send size={13} />
                      <span>{hasApplied ? 'Déjà postulé' : 'Postuler'}</span>
                    </button>
                  </div>
                </div>

                {/* Description courte */}
                <p className="mt-3.5 text-xs text-[#525b71] line-clamp-2 leading-relaxed">
                  {offre.description}
                </p>

                {/* Badges de compétences clés */}
                {compList.length > 0 && (
                  <div className="mt-3.5 flex flex-wrap items-center gap-1.5 border-t border-[#f2f4f8] pt-3">
                    <span className="text-[11px] font-semibold text-[#8690a5] mr-1">
                      Compétences requises :
                    </span>
                    {compList.slice(0, 6).map((c) => (
                      <span
                        key={c}
                        className="rounded-lg bg-[#f4f5f8] px-2 py-0.5 text-[11px] font-medium text-[#464e62]"
                      >
                        {c}
                      </span>
                    ))}
                    {compList.length > 6 && (
                      <span className="text-[11px] font-semibold text-[#8690a5]">
                        +{compList.length - 6} autres
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
