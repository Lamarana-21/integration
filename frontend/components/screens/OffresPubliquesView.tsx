'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Clock,
  ExternalLink,
  Filter,
  Globe,
  Heart,
  MapPin,
  MessageSquare,
  RotateCcw,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  ContractType,
  Offre,
  RoleName,
  User,
  isJobFavorited,
  isOfferExpired,
  hasCandidateAppliedToJob,
  formatFrenchDate,
} from '@/lib/types';

interface OffresPubliquesViewProps {
  offres: Offre[];
  onSelectOffre: (offre: Offre) => void;
  onPostuler: (offre: Offre) => void;
  currentRole: RoleName;
  currentUser: User | null;
  candidatureOffreIds: string[];
  favorisOffresIds?: string[];
  onToggleFavori?: (offreId: string) => void;
  onContactRecruiter?: (offre: Offre) => void;
  initialSelectedOffre?: Offre | null;
  onClearSelectedOffre?: () => void;
}

export function OffresPubliquesView({
  offres,
  onSelectOffre,
  onPostuler,
  currentRole,
  currentUser,
  candidatureOffreIds,
  favorisOffresIds = [],
  onToggleFavori,
  onContactRecruiter,
  initialSelectedOffre = null,
  onClearSelectedOffre,
}: OffresPubliquesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [villeFilter, setVilleFilter] = useState('');
  const [contratsSelected, setContratsSelected] = useState<ContractType[]>([]);
  const [dateFilter, setDateFilter] = useState<'all' | '24h' | '7j'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'titre'>('recent');
  const [selectedJob, setSelectedJob] = useState<Offre | null>(initialSelectedOffre);

  useEffect(() => {
    if (initialSelectedOffre) {
      setSelectedJob(initialSelectedOffre);
    }
  }, [initialSelectedOffre]);

  const publishedOffres = useMemo(() => {
    return offres.filter(
      (o) =>
        o.statut === 'PUBLIEE' &&
        !o.supprimee &&
        !isOfferExpired(o.date_limite)
    );
  }, [offres]);

  const filteredOffres = useMemo(() => {
    const list = offres.filter((offre) => {
      if (offre.supprimee || offre.statut === 'ARCHIVEE') return false;

      if (currentRole === 'VISITEUR' || currentRole === 'CANDIDAT') {
        if (offre.statut !== 'PUBLIEE') return false;
      }

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchTitle = offre.titre.toLowerCase().includes(q);
        const matchCompany = offre.entreprise?.nom?.toLowerCase().includes(q);
        const matchDesc = offre.description?.toLowerCase().includes(q);
        const matchSkills = offre.competences_requises?.some((c) =>
          c.toLowerCase().includes(q)
        );
        if (!matchTitle && !matchCompany && !matchDesc && !matchSkills) return false;
      }

      if (villeFilter && !offre.lieu.toLowerCase().includes(villeFilter.toLowerCase())) {
        return false;
      }

      if (contratsSelected.length > 0 && !contratsSelected.includes(offre.type_contrat)) {
        return false;
      }

      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'titre') return a.titre.localeCompare(b.titre);
      return (b.date_publication || '').localeCompare(a.date_publication || '');
    });
  }, [offres, currentRole, searchTerm, villeFilter, contratsSelected, sortBy]);

  const toggleContract = (type: ContractType) => {
    setContratsSelected((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const resetFilters = () => {
    setSearchTerm('');
    setVilleFilter('');
    setContratsSelected([]);
    setDateFilter('all');
  };

  const openJobDetail = (offre: Offre) => {
    setSelectedJob(offre);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeJobDetail = () => {
    setSelectedJob(null);
    if (onClearSelectedOffre) onClearSelectedOffre();
  };

  // ============================================================================
  // DÉTAILS D'UNE OFFRE (E3) — PROPRE, STRUCTURÉ ET PROFESSIONNEL
  // ============================================================================
  if (selectedJob) {
    const isDeleted = Boolean(
      selectedJob.supprimee || selectedJob.statut === 'ARCHIVEE'
    );
    const hasApplied = hasCandidateAppliedToJob(selectedJob.id, candidatureOffreIds);
    const isClosed = selectedJob.statut === 'CLOTUREE' || isOfferExpired(selectedJob.date_limite);
    const isFav = isJobFavorited(selectedJob.id, favorisOffresIds);

    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
        <button
          onClick={closeJobDetail}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#594be0] hover:underline cursor-pointer"
        >
          <ChevronLeft size={16} /> Retour aux offres
        </button>

        {/* ALERTE MAJEURE SI OFFRE SUPPRIMÉE PAR L'ENTREPRISE */}
        {isDeleted && (
          <div className="rounded-2xl border-2 border-[#ef4444] bg-[#fef2f2] p-5 text-[#991b1b] shadow-md">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h2 className="text-base font-black tracking-wide uppercase text-[#b91c1c]">
                  Cette offre d'emploi a été supprimée par l'entreprise
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-[#7f1d1d]">
                  Le recruteur a retiré cette annonce du recrutement. Si vous aviez déjà postulé, votre candidature reste archivée dans votre tableau de suivi mais aucun nouveau dépôt n'est possible.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* En-tête de l'offre */}
        <div className="rounded-3xl border border-[#e7eaf2] bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="flex items-start gap-4">
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#f0efff] text-lg font-black text-[#594be0]">
                {selectedJob.entreprise?.nom?.substring(0, 2).toUpperCase() || 'EN'}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-[#eeeaff] px-2.5 py-0.5 text-xs font-extrabold text-[#594be0]">
                    {selectedJob.type_contrat}
                  </span>
                  <span
                    className={`rounded-md px-2.5 py-0.5 text-xs font-bold ${
                      isDeleted
                        ? 'bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]'
                        : isClosed
                        ? 'bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]'
                        : 'bg-[#eef8f2] text-[#2d9a62]'
                    }`}
                  >
                    {isDeleted ? 'SUPPRIMÉE' : isClosed ? 'CLÔTURÉE' : 'ACTIVE'}
                  </span>
                  {selectedJob.salaire && (
                    <span className="rounded-md bg-[#f8f9fc] border border-[#e5e8f0] px-2.5 py-0.5 text-xs font-bold text-[#171f33]">
                      {selectedJob.salaire}
                    </span>
                  )}
                  {hasApplied && (
                    <span className="rounded-md bg-[#e8f7ee] border border-[#a7f3d0] px-2.5 py-0.5 text-xs font-extrabold text-[#2a955e]">
                      ✓ Candidature envoyée
                    </span>
                  )}
                </div>

                <h1 className="mt-2.5 text-2xl font-black tracking-tight text-[#171f33] sm:text-3xl">
                  {selectedJob.titre}
                </h1>

                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-[#727a90]">
                  <span className="flex items-center gap-1.5 font-bold text-[#1e2538]">
                    <Building2 size={14} className="text-[#594be0]" />
                    {selectedJob.entreprise?.nom}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={14} /> {selectedJob.lieu}
                  </span>
                  {selectedJob.date_publication && (
                    <span className="flex items-center gap-1">
                      <Calendar size={14} className="text-[#594be0]" /> Publiée le{' '}
                      <strong className="text-[#171f33]">
                        {formatFrenchDate(selectedJob.date_publication)}
                      </strong>
                    </span>
                  )}
                  {selectedJob.date_limite && (
                    <span
                      className={`flex items-center gap-1 ${
                        isClosed || isDeleted ? 'text-[#dc2626] font-bold' : ''
                      }`}
                    >
                      <Clock
                        size={14}
                        className={isClosed || isDeleted ? 'text-[#dc2626]' : 'text-[#594be0]'}
                      />{' '}
                      Date limite :{' '}
                      <strong className={isClosed || isDeleted ? 'text-[#dc2626]' : 'text-[#171f33]'}>
                        {formatFrenchDate(selectedJob.date_limite)}
                      </strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              {onToggleFavori && (
                <button
                  type="button"
                  onClick={() => onToggleFavori(selectedJob.id)}
                  className={`grid size-11 place-items-center rounded-2xl border transition cursor-pointer ${
                    isFav
                      ? 'border-[#fecdd3] bg-[#fff1f2] text-[#e11d48]'
                      : 'border-[#e2e5ef] bg-white text-[#788299] hover:text-[#e11d48] hover:bg-[#fff1f2]'
                  }`}
                >
                  <Heart size={18} className={isFav ? 'fill-[#e11d48]' : ''} />
                </button>
              )}

              {onContactRecruiter && currentRole !== 'VISITEUR' && (
                <button
                  type="button"
                  onClick={() => onContactRecruiter(selectedJob)}
                  className="flex items-center gap-2 rounded-2xl border border-[#d8d4fa] bg-[#faf9fe] px-4 py-3 text-xs font-bold text-[#5547d7] hover:bg-[#f1edfe] transition cursor-pointer"
                >
                  <MessageSquare size={15} />
                  <span>Contacter l'entreprise</span>
                </button>
              )}

              {isDeleted ? (
                <div className="flex items-center gap-2 rounded-2xl bg-[#fef2f2] px-4 py-3 text-xs font-bold text-[#991b1b] border border-[#fecaca]">
                  <span>Offre supprimée</span>
                </div>
              ) : currentRole === 'VISITEUR' ? (
                isClosed ? (
                  <button
                    disabled
                    className="cursor-not-allowed rounded-2xl bg-[#e3e6ee] px-6 py-3 text-xs font-bold text-[#8890a4]"
                  >
                    Candidatures closes
                  </button>
                ) : (
                  <button
                    onClick={() => onPostuler(selectedJob)}
                    className="rounded-2xl bg-[#594be0] px-6 py-3 text-xs font-bold text-white shadow-sm hover:bg-[#483ad3] cursor-pointer"
                  >
                    Se connecter pour postuler
                  </button>
                )
              ) : isClosed ? (
                <div className="flex items-center gap-2 rounded-2xl bg-[#fef2f2] px-4 py-3 text-xs font-bold text-[#991b1b] border border-[#fecaca]">
                  <Clock size={15} />
                  <span>Candidatures closes</span>
                </div>
              ) : hasApplied ? (
                <div className="flex items-center gap-2 rounded-2xl bg-[#edf9f3] px-4 py-3 text-xs font-bold text-[#2b965f] border border-[#cbeedc]">
                  <CheckCircle2 size={16} />
                  <span>Candidature déjà envoyée</span>
                </div>
              ) : (
                <button
                  onClick={() => onPostuler(selectedJob)}
                  className="rounded-2xl bg-[#594be0] px-6 py-3 text-xs font-extrabold text-white shadow-sm hover:bg-[#4739d2] transition cursor-pointer"
                >
                  Postuler à cette offre
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Contenu principal en 2 colonnes bien aligné */}
        <div className="grid gap-6 md:grid-cols-[2fr_1fr] items-start">
          <div className="space-y-6">
            <section className="rounded-3xl border border-[#e7eaf2] bg-white p-6 sm:p-7 shadow-xs">
              <h2 className="text-base font-extrabold text-[#192033]">
                Description du poste
              </h2>
              <p className="mt-3 text-xs leading-6 text-[#5a6277] whitespace-pre-line">
                {selectedJob.description}
              </p>
            </section>

            {selectedJob.missions && (
              <section className="rounded-3xl border border-[#e7eaf2] bg-white p-6 sm:p-7 shadow-xs">
                <h2 className="text-base font-extrabold text-[#192033]">
                  Missions principales
                </h2>
                <div className="mt-3 text-xs leading-6 text-[#5a6277] whitespace-pre-line">
                  {selectedJob.missions}
                </div>
              </section>
            )}

            <section className="rounded-3xl border border-[#e7eaf2] bg-white p-6 sm:p-7 shadow-xs">
              <h2 className="text-base font-extrabold text-[#192033]">
                Compétences attendues
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedJob.competences_requises.map((c) => (
                  <span
                    key={c}
                    className="rounded-xl border border-[#dcd7fb] bg-[#f7f6ff] px-3 py-1.5 text-xs font-bold text-[#5547d7]"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </section>
          </div>

          {/* À propos de l'entreprise */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-[#e7eaf2] bg-white p-6 shadow-xs">
              <h3 className="text-xs font-bold tracking-wider text-[#9ba3b8] uppercase">
                À propos de l'entreprise
              </h3>
              <div className="mt-4 flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-2xl bg-[#efeefd] text-base font-black text-[#594be0]">
                  {selectedJob.entreprise?.nom?.[0] ?? 'E'}
                </div>
                <div>
                  <div className="text-sm font-extrabold text-[#161e31]">
                    {selectedJob.entreprise?.nom}
                  </div>
                  <div className="text-[11px] text-[#788198]">
                    {selectedJob.entreprise?.secteur}
                  </div>
                </div>
              </div>

              {selectedJob.entreprise?.description && (
                <p className="mt-4 text-xs leading-5 text-[#5e667c]">
                  {selectedJob.entreprise.description}
                </p>
              )}

              <div className="mt-4 border-t border-[#f0f2f7] pt-4 text-xs space-y-2">
                <div>
                  <div className="text-[#848ea4]">Localisation</div>
                  <div className="font-bold text-[#1f2639]">
                    {selectedJob.entreprise?.ville || selectedJob.lieu},{' '}
                    {selectedJob.entreprise?.pays || 'Tunisie'}
                  </div>
                </div>
              </div>

              {selectedJob.entreprise?.site_web && (
                <a
                  href={selectedJob.entreprise.site_web}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#594be0] hover:underline"
                >
                  <Globe size={13} /> Visiter le site web <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // PAGE PRINCIPALE DES OFFRES (E1) — SIMPLE, PROPRE ET SANS ENCOMBREMENT
  // ============================================================================
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      {/* Barre défilante sobre et propre des nouvelles offres */}
      {publishedOffres.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-[#e4e7f2] bg-white shadow-2xs">
          <div className="flex items-center">
            <div className="flex shrink-0 items-center gap-2 bg-[#f4f2ff] border-r border-[#e4e0ff] px-4 py-2.5 text-xs font-bold text-[#594be0]">
              <span className="size-2 rounded-full bg-[#10b981] animate-pulse" />
              <span>Nouvelles offres</span>
            </div>

            <div className="flex-1 overflow-hidden py-2 px-4">
              <div
                className="flex items-center gap-8 whitespace-nowrap"
                style={{ animation: 'simpleMarquee 34s linear infinite' }}
              >
                {[...publishedOffres, ...publishedOffres].map((offre, i) => (
                  <button
                    key={`${offre.id}-${i}`}
                    type="button"
                    onClick={() => openJobDetail(offre)}
                    className="inline-flex items-center gap-2 text-xs text-[#3b4356] hover:text-[#594be0] transition cursor-pointer"
                  >
                    <span className="rounded bg-[#f0efff] px-2 py-0.5 text-[10px] font-bold text-[#594be0]">
                      {offre.type_contrat}
                    </span>
                    <span className="font-bold text-[#171f33]">{offre.titre}</span>
                    <span className="text-[#7c859c]">
                      — {offre.entreprise?.nom} ({offre.lieu})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <style jsx>{`
            @keyframes simpleMarquee {
              0% {
                transform: translateX(0%);
              }
              100% {
                transform: translateX(-50%);
              }
            }
          `}</style>
        </div>
      )}

      {/* Bannière de recherche épurée (sans statistiques) */}
      <div className="rounded-3xl bg-gradient-to-r from-[#5a4ce2] via-[#6557e9] to-[#4837cb] p-6 sm:p-8 text-white shadow-md">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            Offres d'emploi disponibles
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-white/85">
            Recherchez un poste par métier, compétence ou ville et postulez directement en ligne.
          </p>
        </div>

        {/* Barre de recherche */}
        <div className="mt-6 grid gap-2 rounded-2xl bg-white p-2 shadow-lg sm:grid-cols-[1.5fr_1fr_1fr_auto]">
          <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-[#20273a] bg-[#f8f9fc]">
            <Search size={16} className="text-[#9ea6bb]" />
            <input
              type="text"
              placeholder="Poste, mot-clé, compétence..."
              value={searchTerm ?? ''}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent outline-none placeholder:text-[#9ea6bb]"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-[#20273a] bg-[#f8f9fc]">
            <MapPin size={16} className="text-[#9ea6bb]" />
            <input
              type="text"
              placeholder="Ville (ex: Tunis, Sfax)"
              value={villeFilter ?? ''}
              onChange={(e) => setVilleFilter(e.target.value)}
              className="w-full bg-transparent outline-none placeholder:text-[#9ea6bb]"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-[#20273a] bg-[#f8f9fc]">
            <BriefcaseBusiness size={16} className="text-[#9ea6bb]" />
            <select
              value={contratsSelected[0] || ''}
              onChange={(e) => {
                const val = e.target.value as ContractType;
                if (!val) setContratsSelected([]);
                else setContratsSelected([val]);
              }}
              className="w-full bg-transparent outline-none text-[#5e667d]"
            >
              <option value="">Tous types de contrat</option>
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
              <option value="STAGE">Stage</option>
              <option value="ALTERNANCE">Alternance</option>
              <option value="FREELANCE">Freelance</option>
            </select>
          </div>

          <button
            type="button"
            className="rounded-xl bg-[#594be0] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#483ad3] transition"
          >
            Rechercher
          </button>
        </div>
      </div>

      {/* Grille : Filtres à gauche + Liste épurée à droite */}
      <div className="grid gap-7 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-6 rounded-3xl border border-[#e8ebf3] bg-white p-6 shadow-xs h-fit">
          <div className="flex items-center justify-between border-b border-[#f0f2f7] pb-3">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#1a2235]">
              <Filter size={15} /> Filtres
            </div>
            {(contratsSelected.length > 0 || villeFilter || searchTerm) && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-[11px] font-bold text-[#5b4ce0] hover:underline"
              >
                <RotateCcw size={12} /> Réinitialiser
              </button>
            )}
          </div>

          <div>
            <div className="text-xs font-bold text-[#1f273b]">Type de contrat</div>
            <div className="mt-2.5 space-y-2">
              {(['CDI', 'CDD', 'STAGE', 'ALTERNANCE', 'FREELANCE'] as ContractType[]).map(
                (c) => (
                  <label
                    key={c}
                    className="flex cursor-pointer items-center gap-2.5 text-xs text-[#525a70] hover:text-[#182033]"
                  >
                    <input
                      type="checkbox"
                      checked={contratsSelected.includes(c)}
                      onChange={() => toggleContract(c)}
                      className="size-4 rounded accent-[#594be0]"
                    />
                    <span className="font-semibold">{c}</span>
                  </label>
                )
              )}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-[#1f273b]">Date de publication</div>
            <div className="mt-2.5 space-y-2 text-xs text-[#525a70]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="date_pub"
                  checked={dateFilter === 'all'}
                  onChange={() => setDateFilter('all')}
                  className="accent-[#594be0]"
                />
                Toutes les offres
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="date_pub"
                  checked={dateFilter === '24h'}
                  onChange={() => setDateFilter('24h')}
                  className="accent-[#594be0]"
                />
                Dernières 24 heures
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="date_pub"
                  checked={dateFilter === '7j'}
                  onChange={() => setDateFilter('7j')}
                  className="accent-[#594be0]"
                />
                7 derniers jours
              </label>
            </div>
          </div>
        </aside>

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-bold text-[#717a91]">
              <span className="text-[#192135] font-black text-sm">
                {filteredOffres.length}
              </span>{' '}
              offre(s) disponible(s)
            </div>

            <div className="flex items-center gap-2 text-xs text-[#6e778d]">
              <span>Trier par :</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recent' | 'titre')}
                className="rounded-lg border border-[#e2e5ee] bg-white px-2.5 py-1 text-xs font-bold text-[#20273a] outline-none"
              >
                <option value="recent">Date de publication</option>
                <option value="titre">Titre du poste</option>
              </select>
            </div>
          </div>

          {filteredOffres.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#d8dce8] bg-white p-12 text-center">
              <BriefcaseBusiness size={40} className="mx-auto text-[#adb6cb]" />
              <h3 className="mt-3 text-base font-bold text-[#1f273b]">
                Aucune offre ne correspond à vos critères
              </h3>
              <button
                onClick={resetFilters}
                className="mt-4 rounded-xl bg-[#efedff] px-4 py-2 text-xs font-bold text-[#5748de] hover:bg-[#e4e0ff]"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOffres.map((offre) => {
                const hasApplied = hasCandidateAppliedToJob(offre.id, candidatureOffreIds);
                const isExpired = isOfferExpired(offre.date_limite) || offre.statut === 'CLOTUREE';

                return (
                  <div
                    key={offre.id}
                    onClick={() => openJobDetail(offre)}
                    className="group cursor-pointer rounded-3xl border border-[#e6e9f2] bg-white p-6 shadow-xs transition hover:border-[#b8aefb] hover:shadow-md"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-[#eeeaff] px-2.5 py-0.5 text-[11px] font-bold text-[#5547d7]">
                            {offre.type_contrat}
                          </span>
                          <span className="text-xs font-bold text-[#1a2236]">
                            {offre.entreprise?.nom}
                          </span>
                          <span className="text-xs text-[#8790a6]">· {offre.lieu}</span>
                          {offre.date_limite && (
                            <span
                              className={`flex items-center gap-1 text-[11px] ${isExpired ? 'font-bold text-[#dc2626]' : 'text-[#717a90]'
                                }`}
                            >
                              · Date limite : {formatFrenchDate(offre.date_limite)}
                            </span>
                          )}
                          {hasApplied && (
                            <span className="rounded-full bg-[#e8f7ee] border border-[#a7f3d0] px-2 py-0.5 text-[10px] font-extrabold text-[#2a955e]">
                              ✓ Déjà postulé
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-black text-[#161e31] group-hover:text-[#5547d7] transition">
                          {offre.titre}
                        </h3>

                        <p className="line-clamp-2 text-xs leading-5 text-[#5e667c]">
                          {offre.description}
                        </p>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {offre.competences_requises.slice(0, 4).map((comp) => (
                            <span
                              key={comp}
                              className="rounded-lg bg-[#f4f5f9] px-2.5 py-0.5 text-[11px] font-medium text-[#4f566c]"
                            >
                              {comp}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div
                        className="flex sm:flex-col gap-2.5 shrink-0 items-end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2">
                          {offre.salaire && (
                            <div className="text-right text-xs font-extrabold text-[#192237]">
                              {offre.salaire}
                            </div>
                          )}
                          {onToggleFavori && (
                            <button
                              type="button"
                              onClick={() => onToggleFavori(offre.id)}
                              className={`grid size-8 place-items-center rounded-xl border transition ${isJobFavorited(offre.id, favorisOffresIds)
                                ? 'border-[#fecdd3] bg-[#fff1f2] text-[#e11d48]'
                                : 'border-[#e5e8f0] bg-white text-[#949eb5] hover:text-[#e11d48] hover:bg-[#fff1f2]'
                                }`}
                            >
                              <Heart
                                size={14}
                                className={
                                  isJobFavorited(offre.id, favorisOffresIds) ? 'fill-[#e11d48]' : ''
                                }
                              />
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openJobDetail(offre)}
                            className="rounded-xl border border-[#e2e5ee] bg-white px-3.5 py-2 text-xs font-bold text-[#374151] hover:bg-[#f6f7fb] transition"
                          >
                            Détails
                          </button>
                          {isExpired ? (
                            <span className="inline-flex items-center gap-1 rounded-xl bg-[#fef2f2] px-3 py-2 text-xs font-bold text-[#b91c1c] border border-[#fecaca]">
                              <Clock size={12} /> Clôturée
                            </span>
                          ) : hasApplied ? (
                            <span className="inline-flex items-center gap-1 rounded-xl bg-[#ecfdf5] px-3 py-2 text-xs font-bold text-[#059669] border border-[#a7f3d0]">
                              <CheckCircle2 size={12} /> Postulé
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onPostuler(offre)}
                              className="rounded-xl bg-[#594be0] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#483ad3] transition"
                            >
                              Postuler
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
