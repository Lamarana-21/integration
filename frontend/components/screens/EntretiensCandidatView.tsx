'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  Video,
} from 'lucide-react';
import { Candidature, Offre } from '@/lib/types';

interface EntretiensCandidatViewProps {
  candidatures: Candidature[];
  onNavigateScreen: (screen: string) => void;
  onViewJobDetail: (offre: Offre) => void;
  onContactEntreprise?: (offre: Offre) => void;
}

export function EntretiensCandidatView({
  candidatures,
  onNavigateScreen,
  onViewJobDetail,
  onContactEntreprise,
}: EntretiensCandidatViewProps) {
  const [filterType, setFilterType] = useState<'TOUS' | 'VISIO' | 'PRESENTIEL' | 'TELEPHONE'>('TOUS');
  const [searchQuery, setSearchQuery] = useState('');

  // Candidatures retenues pour entretien ou présélectionnées
  const entretiensList = useMemo(() => {
    return candidatures.filter(
      (c) =>
        c.statut === 'PRESELECTIONNEE' ||
        c.statut === 'ENTRETIEN' ||
        c.statut === 'ACCEPTEE' ||
        Boolean(c.date_entretien)
    );
  }, [candidatures]);

  const filteredEntretiens = useMemo(() => {
    return entretiensList.filter((ent) => {
      if (filterType !== 'TOUS') {
        const modality = ent.type_entretien || 'VISIO';
        if (modality !== filterType) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titre = ent.offre?.titre?.toLowerCase() || '';
        const entreprise = ent.offre?.entreprise?.nom?.toLowerCase() || '';
        const lieu = ent.offre?.lieu?.toLowerCase() || '';
        if (!titre.includes(q) && !entreprise.includes(q) && !lieu.includes(q)) return false;
      }
      return true;
    });
  }, [entretiensList, filterType, searchQuery]);

  const confirmesCount = entretiensList.filter(
    (c) => c.statut === 'ENTRETIEN' || Boolean(c.date_entretien)
  ).length;
  const preselectionCount = entretiensList.filter((c) => c.statut === 'PRESELECTIONNEE').length;

  const getModalityInfo = (type?: 'VISIO' | 'PRESENTIEL' | 'TELEPHONE') => {
    switch (type) {
      case 'PRESENTIEL':
        return {
          label: 'Entretien en présentiel',
          icon: Building2,
          badgeClass: 'bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]',
        };
      case 'TELEPHONE':
        return {
          label: 'Entretien téléphonique',
          icon: Phone,
          badgeClass: 'bg-[#fefce8] text-[#a16207] border-[#fde047]',
        };
      default:
        return {
          label: 'Entretien Visioconférence',
          icon: Video,
          badgeClass: 'bg-[#dcfce7] text-[#15803d] border-[#86efac]',
        };
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-6 font-sans">
      {/* EN-TÊTE */}
      <div className="rounded-3xl border border-[#e8ebf3] bg-gradient-to-r from-white via-[#fafbfe] to-[#f0fdf4] p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="grid size-12 place-items-center rounded-2xl bg-[#16a34a] text-white shadow-md shadow-[#16a34a]/20 shrink-0">
              <Calendar size={22} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#171f33]">
                  Entretiens & Convocations
                </h1>
                <span className="rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-xs font-extrabold text-[#15803d]">
                  {entretiensList.length} dossier{entretiensList.length > 1 ? 's' : ''}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#6e778f]">
                Consultez vos convocations d'entretien, les créneaux proposés par les entreprises et préparez vos échanges.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => onNavigateScreen('E5')}
              className="rounded-2xl border border-[#d8dce8] bg-white px-4 py-2.5 text-xs font-bold text-[#424b61] shadow-2xs hover:bg-[#f6f7fb] transition"
            >
              Mes candidatures
            </button>
            <button
              type="button"
              onClick={() => onNavigateScreen('E_MESSAGES')}
              className="flex items-center gap-1.5 rounded-2xl bg-[#594be0] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#4739d2] transition"
            >
              <MessageSquare size={14} />
              <span>Messagerie Entreprises</span>
            </button>
          </div>
        </div>

        {/* CARTES DE SYNTHÈSE */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 border-t border-[#edf0f7]">
          <div className="rounded-2xl border border-[#bbf7d0] bg-[#f7fdf9] p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-[#166534]">Entretiens programmés</div>
              <div className="text-2xl font-black text-[#14532d] mt-0.5">{confirmesCount}</div>
            </div>
            <div className="grid size-10 place-items-center rounded-xl bg-[#dcfce7] text-[#15803d]">
              <Video size={18} />
            </div>
          </div>

          <div className="rounded-2xl border border-[#e2e5ef] bg-white p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-[#646e85]">Présélections RH</div>
              <div className="text-2xl font-black text-[#171f33] mt-0.5">{preselectionCount}</div>
            </div>
            <div className="grid size-10 place-items-center rounded-xl bg-[#f0efff] text-[#594be0]">
              <CheckCircle2 size={18} />
            </div>
          </div>

          <div className="rounded-2xl border border-[#e2e5ef] bg-white p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-[#646e85]">Total candidatures actives</div>
              <div className="text-2xl font-black text-[#171f33] mt-0.5">{candidatures.length}</div>
            </div>
            <div className="grid size-10 place-items-center rounded-xl bg-[#f4f5f9] text-[#4b5568]">
              <FileText size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* BARRE DE FILTRES */}
      {entretiensList.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#e8ebf3] bg-white p-4 shadow-2xs">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ba4b5]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par poste, entreprise ou ville..."
              className="w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] pl-10 pr-4 py-2 text-xs text-[#171f33] outline-none focus:border-[#594be0] focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            {[
              { key: 'TOUS', label: 'Tous les formats' },
              { key: 'VISIO', label: 'Visioconférence' },
              { key: 'PRESENTIEL', label: 'Présentiel' },
              { key: 'TELEPHONE', label: 'Téléphone' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilterType(item.key as any)}
                className={`rounded-xl px-3 py-1.5 transition ${
                  filterType === item.key
                    ? 'bg-[#16a34a] text-white shadow-2xs'
                    : 'bg-[#f2f4f8] text-[#555f75] hover:bg-[#e5e9f2]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* LISTE DES CONVOCATIONS */}
      {filteredEntretiens.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#bbf7d0] bg-white p-12 text-center space-y-4 shadow-2xs">
          <div className="grid size-16 place-items-center rounded-3xl bg-[#dcfce7] text-[#15803d] mx-auto">
            <Calendar size={30} />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-black text-[#14532d]">
              Aucun entretien programmé pour le moment
            </h3>
            <p className="text-xs text-[#55695b] leading-relaxed">
              Dès qu'une entreprise retient votre candidature pour un entretien ou vous propose un créneau de convocation, tous les détails apparaîtront ici.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigateScreen('E5')}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-[#d8dce8] bg-white px-4 py-2.5 text-xs font-bold text-[#3f485d] hover:bg-[#f6f7fb] transition"
            >
              <span>Suivre mes candidatures</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateScreen('E1')}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-[#16a34a] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#15803d] transition shadow-xs"
            >
              <span>Explorer les offres</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntretiens.map((ent) => {
            const modality = getModalityInfo(ent.type_entretien);
            const ModalityIcon = modality.icon;

            return (
              <div
                key={ent.id}
                className="rounded-3xl border border-[#86efac] bg-gradient-to-br from-[#f0fdf4]/70 via-white to-white p-6 shadow-xs space-y-4 transition hover:shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="grid size-12 place-items-center rounded-2xl bg-[#16a34a] text-white shrink-0 shadow-sm">
                      <ModalityIcon size={22} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${modality.badgeClass}`}
                        >
                          {modality.label}
                        </span>
                        <span className="rounded-full bg-[#f0efff] px-2.5 py-0.5 text-[10px] font-bold text-[#594be0]">
                          {ent.statut === 'ENTRETIEN'
                            ? 'Convocation confirmée'
                            : ent.statut === 'ACCEPTEE'
                            ? 'Candidature retenue'
                            : 'Profil présélectionné'}
                        </span>
                      </div>
                      <h3 className="mt-1.5 text-base font-black text-[#171f33]">
                        {ent.offre?.titre || 'Entretien de recrutement'}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#5f6980]">
                        <span className="font-bold text-[#15803d] flex items-center gap-1">
                          <Building2 size={13} />
                          {ent.offre?.entreprise?.nom || 'Entreprise partenaire'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin size={13} />
                          {ent.offre?.lieu || 'Tunisie'}
                        </span>
                        {ent.offre?.type_contrat && (
                          <>
                            <span>•</span>
                            <span className="font-semibold text-[#171f33]">{ent.offre.type_contrat}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {ent.offre && (
                      <button
                        type="button"
                        onClick={() => onViewJobDetail(ent.offre!)}
                        className="flex items-center gap-1.5 rounded-xl border border-[#dde1ed] bg-white px-3.5 py-2 text-xs font-bold text-[#444d62] hover:bg-[#fafbfc] transition"
                      >
                        <Eye size={14} />
                        <span>Voir l'offre</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (ent.offre && onContactEntreprise) {
                          onContactEntreprise(ent.offre);
                        } else {
                          onNavigateScreen('E_MESSAGES');
                        }
                      }}
                      className="flex items-center gap-1.5 rounded-xl bg-[#16a34a] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#15803d] transition"
                    >
                      <MessageSquare size={14} />
                      <span>Contacter l'entreprise</span>
                    </button>
                  </div>
                </div>

                {/* DÉTAILS PRATIQUES DE CONVOCATION */}
                <div className="grid gap-3 sm:grid-cols-2 rounded-2xl border border-[#bbf7d0] bg-white p-4 text-xs">
                  <div className="flex items-start gap-2.5">
                    <Clock size={15} className="text-[#16a34a] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[11px] font-bold text-[#64748b]">Créneau & Date d'entretien</div>
                      <div className="font-extrabold text-[#14532d] mt-0.5">
                        {ent.date_entretien || 'Créneau à convenir avec l’entreprise via la messagerie'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <ExternalLink size={15} className="text-[#16a34a] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[11px] font-bold text-[#64748b]">Lieu ou lien de connexion</div>
                      <div className="font-bold text-[#171f33] mt-0.5 break-all">
                        {ent.lien_ou_lieu_entretien || ent.offre?.lieu || 'Communiqué par l’entreprise avant l’entretien'}
                      </div>
                    </div>
                  </div>
                </div>

                {ent.commentaire_recruteur && (
                  <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5 text-xs text-[#334155]">
                    <span className="font-extrabold text-[#171f33]">
                      Message de {ent.offre?.entreprise?.nom || "l'entreprise"} :{' '}
                    </span>
                    <span className="italic">« {ent.commentaire_recruteur} »</span>
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

