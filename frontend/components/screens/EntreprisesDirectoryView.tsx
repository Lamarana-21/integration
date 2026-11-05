'use client';

import React, { useState, useMemo } from 'react';
import {
  Building2,
  BriefcaseBusiness,
  MapPin,
  Search,
  Users,
  ArrowRight,
  Plus,
  Shield,
  ExternalLink,
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

  const filteredEntreprises = useMemo(() => {
    return entreprises.filter((e) => {
      if (selectedVille !== 'TOUTES' && e.ville?.trim().toLowerCase() !== selectedVille.toLowerCase()) {
        return false;
      }
      if (selectedSecteur !== 'TOUS' && e.secteur?.trim().toLowerCase() !== selectedSecteur.toLowerCase()) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchNom = e.nom.toLowerCase().includes(q);
        const matchSec = e.secteur?.toLowerCase().includes(q);
        const matchVille = e.ville?.toLowerCase().includes(q);
        const matchDesc = e.description?.toLowerCase().includes(q);
        return matchNom || matchSec || matchVille || matchDesc;
      }
      return true;
    });
  }, [entreprises, search, selectedVille, selectedSecteur]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* HEADER BANNER */}
      <div className="rounded-3xl border border-[#e8ebf3] bg-gradient-to-r from-white via-[#fafbfe] to-[#f4f2ff] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-[#594be0] to-[#7f73f2] text-white shadow-md shadow-[#594be0]/20">
              <Building2 size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-[#171f33]">
                  Entreprises partenaires
                </h1>
                <span className="rounded-full bg-[#f0efff] px-3 py-1 text-xs font-black text-[#594be0]">
                  {entreprises.length} partenaire(s)
                </span>
              </div>
              <p className="mt-1 text-xs text-[#788299] max-w-xl">
                Découvrez les entreprises qui recrutent sur Talenta. Consultez leurs fiches de présentation, leurs équipes RH et toutes leurs opportunités d’emploi en direct.
              </p>
            </div>
          </div>

          {isAdmin && onOpenAddEntreprise && (
            <button
              onClick={onOpenAddEntreprise}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#594be0] px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-[#483ad3] transition shrink-0"
            >
              <Plus size={16} /> Ajouter une entreprise
            </button>
          )}
        </div>

        {/* SEARCH & FILTER ROW */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-12 pt-6 border-t border-[#f0f2f8]">
          <div className="relative sm:col-span-6">
            <Search className="absolute left-3.5 top-3 text-[#9aa3b7]" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une entreprise, un secteur, une compétence..."
              className="w-full rounded-2xl border border-[#e2e5ef] bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-[#1f2638] placeholder-[#9aa3b7] outline-none focus:border-[#594be0] focus:ring-2 focus:ring-[#594be0]/10 transition"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedVille}
              onChange={(e) => setSelectedVille(e.target.value)}
              className="w-full rounded-2xl border border-[#e2e5ef] bg-white px-3.5 py-2.5 text-xs font-bold text-[#1f2638] outline-none focus:border-[#594be0]"
            >
              <option value="TOUTES">Toutes les villes</option>
              {villes.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedSecteur}
              onChange={(e) => setSelectedSecteur(e.target.value)}
              className="w-full rounded-2xl border border-[#e2e5ef] bg-white px-3.5 py-2.5 text-xs font-bold text-[#1f2638] outline-none focus:border-[#594be0]"
            >
              <option value="TOUS">Tous les secteurs</option>
              {secteurs.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* GRID DES ENTREPRISES */}
      {filteredEntreprises.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#d8dce8] bg-white p-12 text-center">
          <Building2 size={42} className="mx-auto text-[#adb5cb]" />
          <h3 className="mt-4 text-base font-bold text-[#192135]">
            Aucune entreprise trouvée
          </h3>
          <p className="mt-1 text-xs text-[#7d869c]">
            Aucun résultat ne correspond à vos critères de recherche.
          </p>
          {(search || selectedVille !== 'TOUTES' || selectedSecteur !== 'TOUS') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedVille('TOUTES');
                setSelectedSecteur('TOUS');
              }}
              className="mt-4 rounded-xl border border-[#e2e5ef] px-4 py-2 text-xs font-bold text-[#594be0] hover:bg-[#f6f7fb]"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEntreprises.map((entreprise) => {
            const companyOffers = offres.filter(
              (o) => o.entreprise_id === entreprise.id || o.entreprise?.id === entreprise.id
            );
            const activeOffers = companyOffers.filter((o) => o.statut === 'PUBLIEE');
            const companyRecruiters = users.filter(
              (u) =>
                (u.role?.nom === 'RECRUTEUR' || !u.role) &&
                (u.entreprise_id === entreprise.id || u.entreprise?.id === entreprise.id)
            );

            return (
              <div
                key={entreprise.id}
                onClick={() => onSelectEntreprise(entreprise)}
                className="group relative flex flex-col justify-between rounded-3xl border border-[#e7eaf2] bg-white p-6 shadow-xs hover:border-[#b8aefb] hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                <div>
                  {/* Top card info */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#594be0] to-[#7e72f0] text-lg font-black text-white shadow-xs group-hover:scale-105 transition">
                        {entreprise.nom.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-base font-black text-[#171f33] group-hover:text-[#594be0] transition line-clamp-1">
                          {entreprise.nom}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-[#7b859b] mt-0.5">
                          <MapPin size={12} className="shrink-0 text-[#9aa3b7]" />
                          <span>
                            {entreprise.ville || 'Tunisie'}
                            {entreprise.pays ? `, ${entreprise.pays}` : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        entreprise.statut === 'ACTIVE'
                          ? 'bg-[#edf9f3] text-[#248e56] border border-[#c6eed5]'
                          : 'bg-[#fff5f5] text-[#cf3b3b] border border-[#ffcfcf]'
                      }`}
                    >
                      {entreprise.statut === 'ACTIVE' ? 'Active' : 'Inactif'}
                    </span>
                  </div>

                  {/* Secteur Badge */}
                  <div className="mt-4">
                    <span className="inline-block rounded-lg bg-[#f3f4f8] px-2.5 py-1 text-[11px] font-bold text-[#4c556b]">
                      {entreprise.secteur || 'Secteur d’activité non spécifié'}
                    </span>
                  </div>

                  {/* Description preview */}
                  <p className="mt-3 text-xs leading-5 text-[#5e677c] line-clamp-2">
                    {entreprise.description ||
                      "Entreprise partenaire dynamique recrutant des talents qualifiés sur l'ensemble du territoire."}
                  </p>

                  {/* Site web if available */}
                  {entreprise.site_web && (
                    <div className="mt-2 text-[11px] text-[#594be0] font-semibold flex items-center gap-1">
                      <span>{entreprise.site_web.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink size={11} />
                    </div>
                  )}
                </div>

                {/* Footer KPIs and CTA */}
                <div className="mt-6 pt-4 border-t border-[#f1f3f8] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-[#7b859b]">
                    <span className="flex items-center gap-1 font-bold text-[#1f2638]">
                      <BriefcaseBusiness size={14} className="text-[#594be0]" />
                      {activeOffers.length} offre(s)
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1 font-medium">
                      <Users size={14} className="text-[#8892a7]" />
                      {companyRecruiters.length} recruteur(s)
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 font-bold text-[#594be0] group-hover:translate-x-1 transition text-xs">
                    Voir la fiche <ArrowRight size={13} />
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

