'use client';

import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  Award,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Globe,
  Layers,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { Entreprise, Offre, RoleName, User } from '@/lib/types';

interface EntreprisesDirectoryViewProps {
  entreprises: Entreprise[];
  offres: Offre[];
  users: User[];
  currentRole: RoleName;
  onSelectEntreprise: (ent: Entreprise) => void;
  onOpenAddEntreprise?: () => void;
}

const BANNER_GRADIENTS = [
  'from-[#312e81] via-[#4f46e5] to-[#6366f1]',
  'from-[#0f172a] via-[#1e3a8a] to-[#2563eb]',
  'from-[#14532d] via-[#059669] to-[#10b981]',
  'from-[#4c1d95] via-[#6d28d9] to-[#8b5cf6]',
  'from-[#7c2d12] via-[#c2410c] to-[#ea580c]',
];

export function EntreprisesDirectoryView({
  entreprises,
  offres,
  users,
  currentRole,
  onSelectEntreprise,
  onOpenAddEntreprise,
}: EntreprisesDirectoryViewProps) {
  const [search, setSearch] = useState('');
  const [selectedVille, setSelectedVille] = useState('TOUTES');
  const [selectedSecteur, setSelectedSecteur] = useState('TOUS');
  const [onlyRecruiting, setOnlyRecruiting] = useState(false);

  const isAdmin = currentRole === 'ADMIN';

  // Extraire les villes et secteurs uniques
  const villes = useMemo(() => {
    const set = new Set<string>();
    entreprises.forEach((e) => {
      if (e.ville) set.add(e.ville.trim());
    });
    return Array.from(set);
  }, [entreprises]);

  const secteurs = useMemo(() => {
    const set = new Set<string>();
    entreprises.forEach((e) => {
      if (e.secteur) set.add(e.secteur.trim());
    });
    return Array.from(set);
  }, [entreprises]);

  const totalOpenJobs = useMemo(
    () => offres.filter((o) => o.statut === 'PUBLIEE').length,
    [offres]
  );

  const filteredEntreprises = useMemo(() => {
    return entreprises.filter((e) => {
      if (selectedVille !== 'TOUTES' && e.ville?.trim().toLowerCase() !== selectedVille.toLowerCase()) {
        return false;
      }
      if (selectedSecteur !== 'TOUS' && e.secteur?.trim().toLowerCase() !== selectedSecteur.toLowerCase()) {
        return false;
      }
      if (onlyRecruiting) {
        const activeCount = offres.filter(
          (o) => (o.entreprise_id === e.id || o.entreprise?.id === e.id) && o.statut === 'PUBLIEE'
        ).length;
        if (activeCount === 0) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchNom = e.nom.toLowerCase().includes(q);
        const matchSec = e.secteur?.toLowerCase().includes(q);
        const matchVille = e.ville?.toLowerCase().includes(q);
        const matchDesc = e.description?.toLowerCase().includes(q);
        const companySkills = offres
          .filter((o) => o.entreprise_id === e.id || o.entreprise?.id === e.id)
          .flatMap((o) => o.competences_requises || []);
        const matchSkill = companySkills.some((s) => s.toLowerCase().includes(q));
        return matchNom || matchSec || matchVille || matchDesc || matchSkill;
      }
      return true;
    });
  }, [entreprises, offres, search, selectedVille, selectedSecteur, onlyRecruiting]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* EN-TÊTE SIMPLE ET PROFESSIONNEL */}
      <div className="rounded-2xl border border-[#e5e8f2] bg-white p-6 shadow-2xs">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#eef2ff] px-3 py-1 text-[11px] font-bold text-[#4f46e5]">
              <ShieldCheck size={13} />
              <span>Annuaire Officiel des Entreprises</span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-[#0f172a]">
              Entreprises Partenaires
            </h1>
            <p className="mt-1 text-xs text-[#64748b]">
              Découvrez l'environnement de travail, les équipes et les offres d'emploi des entreprises partenaires.
            </p>
          </div>
          {isAdmin && onOpenAddEntreprise && (
            <button
              onClick={onOpenAddEntreprise}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#4f46e5] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#4338ca] transition"
            >
              <Plus size={15} /> Ajouter une entreprise
            </button>
          )}
        </div>

        {/* Barre de recherche et filtres intégrés */}
        <div className="mt-5 grid grid-cols-1 gap-2.5 rounded-xl bg-[#f8fafc] p-2 border border-[#e2e8f0] sm:grid-cols-12">
          <div className="relative sm:col-span-5 flex items-center rounded-xl bg-[#f6f8fc] px-3.5 py-2">
            <Search className="text-[#594be0] shrink-0 mr-2.5" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom d'entreprise, secteur, techno (React, Cloud...), ville..."
              className="w-full bg-transparent text-xs font-semibold text-[#1f2638] placeholder-[#9aa3b7] outline-none"
            />
          </div>

          <div className="sm:col-span-3 flex items-center rounded-xl bg-[#f6f8fc] px-3 py-2">
            <MapPin size={15} className="text-[#ef4444] shrink-0 mr-2" />
            <select
              value={selectedVille}
              onChange={(e) => setSelectedVille(e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-[#1f2638] outline-none cursor-pointer"
            >
              <option value="TOUTES">Toutes les villes</option>
              {villes.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 flex items-center rounded-xl bg-[#f6f8fc] px-3 py-2">
            <Layers size={15} className="text-[#594be0] shrink-0 mr-2" />
            <select
              value={selectedSecteur}
              onChange={(e) => setSelectedSecteur(e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-[#1f2638] outline-none cursor-pointer"
            >
              <option value="TOUS">Tous secteurs</option>
              {secteurs.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 flex items-center">
            <button
              type="button"
              onClick={() => setOnlyRecruiting((v) => !v)}
              className={`w-full h-full rounded-xl px-3 py-2.5 text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                onlyRecruiting
                  ? 'bg-[#16a34a] text-white shadow-sm'
                  : 'bg-[#f0efff] text-[#594be0] hover:bg-[#e4e0ff]'
              }`}
            >
              <Zap size={14} />
              <span>Recrutent ({totalOpenJobs})</span>
            </button>
          </div>
        </div>

        {/* Filtres rapides par secteur en pills */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-[#64748b]">Secteurs :</span>
          <button
            type="button"
            onClick={() => setSelectedSecteur('TOUS')}
            className={`rounded-full px-3 py-1 text-[11px] font-bold transition ${
              selectedSecteur === 'TOUS'
                ? 'bg-[#4f46e5] text-white'
                : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]'
            }`}
          >
            Tous ({entreprises.length})
          </button>
          {secteurs.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => setSelectedSecteur(selectedSecteur === sec ? 'TOUS' : sec)}
              className={`rounded-full px-3 py-1 text-[11px] font-bold transition ${
                selectedSecteur === sec
                  ? 'bg-[#4f46e5] text-white'
                  : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      </div>

      {/* GRILLE DES ENTREPRISES ULTRA DÉTAILLÉE */}
      {filteredEntreprises.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#d8dce8] bg-white p-14 text-center space-y-3">
          <Building2 size={42} className="mx-auto text-[#adb5cb]" />
          <h3 className="text-base font-black text-[#192135]">
            Aucune entreprise ne correspond à votre sélection
          </h3>
          <p className="text-xs text-[#7d869c]">
            Réinitialisez vos filtres pour afficher l'ensemble des entreprises partenaires.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedVille('TOUTES');
              setSelectedSecteur('TOUS');
              setOnlyRecruiting(false);
            }}
            className="rounded-xl bg-[#594be0] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#483ad3]"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEntreprises.map((entreprise, idx) => {
            const companyOffers = offres.filter(
              (o) => o.entreprise_id === entreprise.id || o.entreprise?.id === entreprise.id
            );
            const activeOffers = companyOffers.filter((o) => o.statut === 'PUBLIEE');
            const companySkills = Array.from(
              new Set(companyOffers.flatMap((o) => o.competences_requises || []))
            ).slice(0, 5);
            const contractTypes = Array.from(
              new Set(activeOffers.map((o) => o.type_contrat))
            );
            const bannerGrad = BANNER_GRADIENTS[idx % BANNER_GRADIENTS.length];

            return (
              <div
                key={entreprise.id}
                onClick={() => onSelectEntreprise(entreprise)}
                className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-[#e5e8f2] bg-white shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-[#b8aefb] hover:shadow-xl cursor-pointer"
              >
                <div>
                  {/* Couverture supérieure de la carte entreprise */}
                  <div className={`relative h-24 bg-gradient-to-r ${bannerGrad} p-4 flex items-start justify-between`}>
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/25 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                      <ShieldCheck size={11} className="text-[#34d399]" /> Partenaire Vérifié
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                        activeOffers.length > 0
                          ? 'bg-[#dcfce7] text-[#15803d]'
                          : 'bg-white/20 text-white'
                      }`}
                    >
                      {activeOffers.length > 0
                        ? `🔥 ${activeOffers.length} poste(s) ouvert(s)`
                        : 'Vivier de talents'}
                    </span>
                  </div>

                  {/* Corps de la carte */}
                  <div className="px-6 pt-0 pb-5">
                    <div className="-mt-8 flex items-end justify-between gap-3">
                      <div className="grid size-16 place-items-center rounded-2xl border-4 border-white bg-gradient-to-br from-[#594be0] to-[#3b2eb8] text-lg font-black text-white shadow-md group-hover:scale-105 transition">
                        {entreprise.nom.substring(0, 2).toUpperCase()}
                      </div>

                      {entreprise.site_web && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-[#f4f5fa] px-2.5 py-1 text-[10px] font-bold text-[#594be0]">
                          <Globe size={11} /> {entreprise.site_web.replace(/^https?:\/\//, '')}
                        </span>
                      )}
                    </div>

                    <div className="mt-3">
                      <h3 className="text-lg font-black text-[#151c2e] group-hover:text-[#594be0] transition">
                        {entreprise.nom}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#6e778f]">
                        <span className="inline-flex items-center gap-1 font-bold text-[#4338ca]">
                          <Layers size={12} /> {entreprise.secteur || 'Technologies & Innovation'}
                        </span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={12} className="text-[#ef4444]" />
                          {entreprise.ville || 'Tunis'}, {entreprise.pays || 'Tunisie'}
                        </span>
                      </div>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-[#555e75] line-clamp-3">
                      {entreprise.description ||
                        "Entreprise leader dans son domaine, offrant un cadre de travail collaboratif, des projets à fort impact technologique et un accompagnement continu de ses équipes."}
                    </p>

                    {/* Informations détaillées : Taille, Mode de travail, Contrats */}
                    <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-[#f8f9fd] border border-[#edf0f7] p-3 text-[11px]">
                      <div>
                        <span className="text-[#848ea4] block text-[10px] font-bold uppercase">
                          Cadre de travail
                        </span>
                        <span className="font-extrabold text-[#171f33]">Présentiel & Hybride</span>
                      </div>
                      <div>
                        <span className="text-[#848ea4] block text-[10px] font-bold uppercase">
                          Contrats proposés
                        </span>
                        <span className="font-extrabold text-[#594be0]">
                          {contractTypes.length > 0 ? contractTypes.join(', ') : 'CDI, Stage'}
                        </span>
                      </div>
                    </div>

                    {/* Compétences & Technologies recherchées par l'entreprise */}
                    {companySkills.length > 0 && (
                      <div className="mt-4">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#848ea4] mb-1.5">
                          Compétences recherchées :
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {companySkills.map((sk) => (
                            <span
                              key={sk}
                              className="rounded-lg border border-[#e4e7f1] bg-white px-2 py-0.5 text-[10px] font-bold text-[#495268]"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Aperçu des offres actives de l'entreprise */}
                    {activeOffers.length > 0 && (
                      <div className="mt-4 space-y-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#15803d]">
                          Postes ouverts actuellement :
                        </div>
                        {activeOffers.slice(0, 2).map((o) => (
                          <div
                            key={o.id}
                            className="flex items-center justify-between rounded-xl bg-[#f4f2ff]/70 border border-[#e3dfff] px-3 py-1.5 text-[11px]"
                          >
                            <span className="font-bold text-[#171f33] truncate pr-2">
                              {o.titre}
                            </span>
                            <span className="shrink-0 rounded-md bg-white px-1.5 py-0.5 text-[10px] font-extrabold text-[#594be0]">
                              {o.type_contrat}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Pied de carte */}
                <div className="border-t border-[#f0f2f8] bg-[#fafbfe] px-6 py-3.5 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-extrabold text-[#1f2638]">
                    <BriefcaseBusiness size={14} className="text-[#594be0]" />
                    {activeOffers.length} opportunité(s) active(s)
                  </span>

                  <span className="inline-flex items-center gap-1 font-black text-[#594be0] group-hover:translate-x-1 transition">
                    Explorer l'entreprise <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
