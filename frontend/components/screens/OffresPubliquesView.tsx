'use client';

import React, { useState, useMemo } from 'react';
import {
  BriefcaseBusiness,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  MapPin,
  RotateCcw,
  Search,
  Sparkles,
} from 'lucide-react';
import { ContractType, Offre, RoleName, User } from '@/lib/types';

interface OffresPubliquesViewProps {
  offres: Offre[];
  onSelectOffre: (offre: Offre) => void;
  onPostuler: (offre: Offre) => void;
  currentRole: RoleName;
  currentUser: User | null;
  candidatureOffreIds: string[];
}

export function OffresPubliquesView({
  offres,
  onSelectOffre,
  onPostuler,
  currentRole,
  currentUser,
  candidatureOffreIds,
}: OffresPubliquesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [villeFilter, setVilleFilter] = useState('');
  const [contratsSelected, setContratsSelected] = useState<ContractType[]>([]);
  const [dateFilter, setDateFilter] = useState<'all' | '24h' | '7j'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'titre'>('recent');
  const [selectedJob, setSelectedJob] = useState<Offre | null>(null);

  // Filtrage selon RM1 (Visible uniquement si PUBLIEE et date_limite non dépassée)
  const filteredOffres = useMemo(() => {
    return offres.filter((offre) => {
      // RM1
      if (currentRole === 'VISITEUR' || currentRole === 'CANDIDAT') {
        if (offre.statut !== 'PUBLIEE') return false;
        if (offre.date_limite && new Date(offre.date_limite) < new Date('2026-10-23')) {
          return false;
        }
      }

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchTitle = offre.titre.toLowerCase().includes(q);
        const matchCompany = offre.entreprise?.nom.toLowerCase().includes(q);
        const matchDesc = offre.description.toLowerCase().includes(q);
        const matchSkills = offre.competences_requises.some((c) =>
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
  }, [offres, currentRole, searchTerm, villeFilter, contratsSelected]);

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

  // If a job is selected for detail view (E3)
  if (selectedJob) {
    const hasApplied = candidatureOffreIds.includes(selectedJob.id);
    const isClosed = selectedJob.statut === 'CLOTUREE';

    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <button
          onClick={() => setSelectedJob(null)}
          className="mb-6 flex items-center gap-2 text-xs font-bold text-[#5c4ce0] hover:underline"
        >
          <ChevronLeft size={16} /> Retour aux offres
        </button>

        {/* E3 Header */}
        <div className="rounded-3xl border border-[#e7eaf2] bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="rounded-md bg-[#eeeaff] px-2.5 py-0.5 text-xs font-extrabold text-[#594be0]">
                  {selectedJob.type_contrat}
                </span>
                <span className="rounded-md bg-[#eef8f2] px-2.5 py-0.5 text-xs font-bold text-[#2d9a62]">
                  {selectedJob.statut}
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-black tracking-tight text-[#171f33] sm:text-3xl">
                {selectedJob.titre}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-[#727a90]">
                <span className="flex items-center gap-1 font-semibold text-[#1e2538]">
                  <Building2 size={15} className="text-[#6458e8]" />
                  {selectedJob.entreprise?.nom}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={15} /> {selectedJob.lieu}
                </span>
                {selectedJob.date_publication && (
                  <span className="flex items-center gap-1">
                    <Calendar size={15} /> Publiée le {selectedJob.date_publication}
                  </span>
                )}
                {selectedJob.date_limite && (
                  <span className="flex items-center gap-1 text-[#b54b4b] font-bold">
                    <Clock size={15} /> Limite : {selectedJob.date_limite}
                  </span>
                )}
              </div>
            </div>

            {/* Action button states */}
            <div>
              {currentRole === 'VISITEUR' ? (
                <button
                  onClick={() => onPostuler(selectedJob)}
                  className="rounded-2xl bg-[#594be0] px-6 py-3.5 text-xs font-bold text-white shadow-md hover:bg-[#483ad3]"
                >
                  Se connecter pour postuler
                </button>
              ) : hasApplied ? (
                <div className="flex items-center gap-2 rounded-2xl bg-[#edf9f3] px-5 py-3 text-xs font-bold text-[#2b965f] border border-[#cbeedc]">
                  <CheckCircle2 size={17} />
                  Candidature envoyée {'{Reçue}'}
                </div>
              ) : isClosed ? (
                <button
                  disabled
                  className="cursor-not-allowed rounded-2xl bg-[#e3e6ee] px-6 py-3.5 text-xs font-bold text-[#8890a4]"
                >
                  Offre clôturée
                </button>
              ) : (
                <button
                  onClick={() => onPostuler(selectedJob)}
                  className="rounded-2xl bg-[#594be0] px-7 py-3.5 text-xs font-extrabold text-white shadow-md shadow-[#594be0]/20 hover:bg-[#4739d2] transition"
                >
                  Postuler à cette offre
                </button>
              )}
            </div>
          </div>
        </div>

        {/* E3 Body Content */}
        <div className="mt-6 grid gap-6 md:grid-cols-[2fr_1fr]">
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
                <h2 className="text-base font-extrabold text-[#192033]">Missions</h2>
                <div className="mt-3 text-xs leading-6 text-[#5a6277] whitespace-pre-line">
                  {selectedJob.missions}
                </div>
              </section>
            )}

            <section className="rounded-3xl border border-[#e7eaf2] bg-white p-6 sm:p-7 shadow-xs">
              <h2 className="text-base font-extrabold text-[#192033]">
                Compétences requises
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

          {/* Right Sidebar: About Company */}
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

              <p className="mt-4 text-xs leading-5 text-[#5e667c]">
                {selectedJob.entreprise?.description}
              </p>

              <div className="mt-4 border-t border-[#f0f2f7] pt-4 text-xs">
                <div className="text-[#848ea4]">Localisation</div>
                <div className="font-bold text-[#1f2639]">
                  {selectedJob.entreprise?.ville}, {selectedJob.entreprise?.pays}
                </div>
              </div>

              {selectedJob.entreprise?.site_web && (
                <a
                  href={selectedJob.entreprise.site_web}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block text-xs font-bold text-[#594be0] hover:underline"
                >
                  Visiter le site web →
                </a>
              )}
            </div>

            <div className="rounded-3xl border border-[#dcd8fd] bg-gradient-to-br from-[#f4f2ff] to-[#ece9ff] p-6">
              <div className="flex items-center gap-2 text-xs font-black text-[#5648d7]">
                <Sparkles size={16} /> Analyse IA Talenta
              </div>
              <p className="mt-2 text-[11px] leading-5 text-[#6c698c]">
                Dès l'envoi de votre candidature, notre IA extrait automatiquement vos compétences clés pour aider le recruteur à pré-qualifier votre profil.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // E1 : Main Search View
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#5a4ce2] via-[#6557e9] to-[#4837cb] p-6 sm:p-10 text-white shadow-xl">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur-md">
            <Sparkles size={14} /> Plateforme Intelligente de Recrutement
          </div>
          <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-4xl">
            Trouvez le poste qui correspond à votre talent
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-white/80">
            Offres d'emploi vérifiées, suivi transparent de candidature et analyse de CV assistée par intelligence artificielle.
          </p>
        </div>

        {/* Search Bar Inputs (E1) */}
        <div className="mt-8 grid gap-2 rounded-2xl bg-white p-2.5 shadow-xl sm:grid-cols-[1.5fr_1fr_1fr_auto]">
          <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-[#20273a] bg-[#f8f9fc]">
            <Search size={16} className="text-[#9ea6bb]" />
            <input
              type="text"
              placeholder="Poste, mot-clé, compétence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent outline-none placeholder:text-[#9ea6bb]"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-[#20273a] bg-[#f8f9fc]">
            <MapPin size={16} className="text-[#9ea6bb]" />
            <input
              type="text"
              placeholder="Ville (ex: Sfax, Tunis)"
              value={villeFilter}
              onChange={(e) => setVilleFilter(e.target.value)}
              className="w-full bg-transparent outline-none placeholder:text-[#9ea6bb]"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-[#20273a] bg-[#f8f9fc]">
            <BriefcaseBusiness size={16} className="text-[#9ea6bb]" />
            <select
              onChange={(e) => {
                const val = e.target.value as ContractType;
                if (val && !contratsSelected.includes(val)) {
                  setContratsSelected([...contratsSelected, val]);
                }
              }}
              defaultValue=""
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
            onClick={() => {}}
            className="rounded-xl bg-[#594be0] px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-[#483ad3] transition"
          >
            Rechercher
          </button>
        </div>
      </div>

      {/* Main Grid: Left Filters + Right List (E1) */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* Left Filters Sidebar */}
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

          {/* Contrats */}
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

          {/* Date de publication */}
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

        {/* Right Job Cards List */}
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-bold text-[#717a91]">
              <span className="text-[#192135] font-black text-sm">
                {filteredOffres.length}
              </span>{' '}
              offre(s) correspondante(s)
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

          {/* Empty state */}
          {filteredOffres.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#d8dce8] bg-white p-12 text-center">
              <BriefcaseBusiness size={40} className="mx-auto text-[#adb6cb]" />
              <h3 className="mt-3 text-base font-bold text-[#1f273b]">
                Aucune offre ne correspond à vos critères
              </h3>
              <p className="mt-1 text-xs text-[#7d869d]">
                Essayez d'élargir vos filtres ou de modifier vos mots-clés de recherche.
              </p>
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
                const hasApplied = candidatureOffreIds.includes(offre.id);

                return (
                  <div
                    key={offre.id}
                    className="group rounded-3xl border border-[#e6e9f2] bg-white p-6 shadow-xs transition hover:border-[#b8aefb] hover:shadow-md"
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
                          {offre.date_publication && (
                            <span className="text-[11px] text-[#9aa3b7]">
                              · {offre.date_publication}
                            </span>
                          )}
                          {hasApplied && (
                            <span className="rounded-full bg-[#e8f7ee] px-2 py-0.5 text-[10px] font-extrabold text-[#2a955e]">
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
                              className="rounded-lg bg-[#f4f5f9] px-2 py-0.5 text-[11px] font-medium text-[#4f566c]"
                            >
                              {comp}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex sm:flex-col gap-2 shrink-0 items-end">
                        {offre.salaire && (
                          <div className="text-right text-xs font-extrabold text-[#192237]">
                            {offre.salaire}
                          </div>
                        )}
                        <button
                          onClick={() => setSelectedJob(offre)}
                          className="rounded-xl bg-[#594be0] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#483ad3] transition"
                        >
                          Voir l'offre
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          <div className="mt-8 flex items-center justify-center gap-2 text-xs font-bold text-[#626c82]">
            <button className="grid size-8 place-items-center rounded-lg border border-[#e2e5ee] bg-white hover:bg-[#f6f7fb]">
              <ChevronLeft size={16} />
            </button>
            <button className="grid size-8 place-items-center rounded-lg bg-[#594be0] text-white">
              1
            </button>
            <button className="grid size-8 place-items-center rounded-lg border border-[#e2e5ee] bg-white hover:bg-[#f6f7fb]">
              2
            </button>
            <button className="grid size-8 place-items-center rounded-lg border border-[#e2e5ee] bg-white hover:bg-[#f6f7fb]">
              3
            </button>
            <button className="grid size-8 place-items-center rounded-lg border border-[#e2e5ee] bg-white hover:bg-[#f6f7fb]">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
