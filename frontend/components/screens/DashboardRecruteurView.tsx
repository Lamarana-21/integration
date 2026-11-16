'use client';

import React, { useMemo } from 'react';
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  MoreHorizontal,
  Plus,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Candidature, NotificationRecord, Offre, User } from '@/lib/types';

interface DashboardRecruteurViewProps {
  offres: Offre[];
  candidatures: Candidature[];
  currentUser?: User | null;
  notifications?: NotificationRecord[];
  onOpenNewJob: () => void;
  onOpenApplicationDetail: (candidature: Candidature) => void;
  onViewAllApplications: () => void;
  onEditJob: (offre: Offre) => void;
  onCloseJob: (id: string) => void;
}

export function DashboardRecruteurView({
  offres,
  candidatures,
  currentUser,
  notifications = [],
  onOpenNewJob,
  onOpenApplicationDetail,
  onViewAllApplications,
  onEditJob,
  onCloseJob,
}: DashboardRecruteurViewProps) {
  const currentEntId = currentUser?.entreprise_id || currentUser?.entreprise?.id;
  const currentEntNom = currentUser?.entreprise?.nom || 'Société partenaire';

  // Offres rattachées exclusivement au recruteur ou à son entreprise
  const companyJobs = useMemo(() => {
    return offres.filter((o: Offre) => {
      if (currentEntId && (o.entreprise_id === currentEntId || o.entreprise?.id === currentEntId)) return true;
      if (currentUser?.id && o.auteur_id === currentUser.id) return true;
      return false;
    });
  }, [offres, currentEntId, currentUser]);

  const companyJobIds = useMemo(() => new Set(companyJobs.map((j) => j.id)), [companyJobs]);

  const companyCandidatures = useMemo(() => {
    return candidatures.filter((c) => companyJobIds.has(c.offre_id));
  }, [candidatures, companyJobIds]);

  const activeJobs = companyJobs.filter((o: Offre) => o.statut === 'PUBLIEE' && !o.supprimee);

  const pendingApps = companyCandidatures.filter((c) => c.statut === 'RECUE');
  const interviewApps = companyCandidatures.filter((c) => c.statut === 'ENTRETIEN' || Boolean(c.date_entretien));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      {/* Top Header (E7) */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#eef1f7] pb-6 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#8a93a8] uppercase tracking-wider">
            <Building2 size={15} /> {currentEntNom} · Espace Recrutement
          </div>
          <h1 className="mt-1 text-2xl font-black text-[#171f33] sm:text-3xl">
            Tableau de bord Recruteur
          </h1>
          <p className="mt-1 text-xs text-[#7d869d]">
            Aperçu synthétique des statistiques et de l'activité de recrutement de votre entreprise.
          </p>
        </div>

        <button
          onClick={onOpenNewJob}
          className="flex items-center gap-2 rounded-2xl bg-[#594be0] px-5 py-3 text-xs font-extrabold text-white shadow-md shadow-[#594be0]/20 hover:bg-[#483ad3] transition w-fit"
        >
          <BriefcaseBusiness size={16} /> Mes offres
        </button>
      </div>

      {/* 4 Metric Cards (E7) */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-[#e8ebf3] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#594be0]">
            <div className="grid size-10 place-items-center rounded-2xl bg-[#f0efff]">
              <BriefcaseBusiness size={20} />
            </div>
            <span className="text-[11px] font-bold text-[#2e9c63]">↗ +2 ce mois</span>
          </div>
          <div className="mt-4 text-3xl font-black text-[#161e31]">
            {activeJobs.length}
          </div>
          <div className="text-xs font-medium text-[#7d869d]">Offres actives</div>
        </div>

        <div className="rounded-3xl border border-[#e8ebf3] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#4085e6]">
            <div className="grid size-10 place-items-center rounded-2xl bg-[#edf4ff]">
              <FileText size={20} />
            </div>
            <span className="text-[11px] font-bold text-[#2e9c63]">↗ +18% vs. M-1</span>
          </div>
          <div className="mt-4 text-3xl font-black text-[#161e31]">
            {companyCandidatures.length}
          </div>
          <div className="text-xs font-medium text-[#7d869d]">Candidatures reçues</div>
        </div>

        <div className="rounded-3xl border border-[#e8ebf3] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#c4871d]">
            <div className="grid size-10 place-items-center rounded-2xl bg-[#fff8eb]">
              <Clock size={20} />
            </div>
            <span className="rounded-full bg-[#fff1db] px-2 py-0.5 text-[10px] font-bold text-[#b87610]">
              Priorité
            </span>
          </div>
          <div className="mt-4 text-3xl font-black text-[#161e31]">
            {pendingApps.length}
          </div>
          <div className="text-xs font-medium text-[#7d869d]">À traiter (statut Reçue)</div>
        </div>

        <div className="rounded-3xl border border-[#e8ebf3] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#2e9c63]">
            <div className="grid size-10 place-items-center rounded-2xl bg-[#ebf9f1]">
              <Calendar size={20} />
            </div>
            <span className="text-[11px] font-bold text-[#594be0]">Planifiés</span>
          </div>
          <div className="mt-4 text-3xl font-black text-[#161e31]">
            {interviewApps.length}
          </div>
          <div className="text-xs font-medium text-[#7d869d]">Entretiens prévus</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        {/* Activity Chart avec design professionnel moderne */}
        <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-lg bg-[#eef2ff] text-[#594be0]">
                  <TrendingUp size={15} />
                </span>
                <h2 className="text-sm font-extrabold text-[#171f33]">
                  Dynamique des candidatures
                </h2>
              </div>
              <p className="text-[11px] text-[#8c94a9] mt-0.5">
                Évolution mensuelle des dossiers reçus pour votre entreprise
              </p>
            </div>
            <span className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1 text-xs font-black text-[#594be0]">
              6 derniers mois
            </span>
          </div>

          {/* Grille et barres modernisées avec jauges interactives */}
          <div className="mt-6 flex h-48 items-end justify-between gap-4 px-3 pb-2 pt-6 rounded-2xl bg-gradient-to-b from-[#fafbfc] to-white border border-[#edf0f7]">
            {[
              { month: 'Mai', val: '45%', count: 18, color: 'from-[#818cf8] to-[#4f46e5]' },
              { month: 'Juin', val: '65%', count: 26, color: 'from-[#818cf8] to-[#4f46e5]' },
              { month: 'Juil.', val: '52%', count: 20, color: 'from-[#818cf8] to-[#4f46e5]' },
              { month: 'Août', val: '78%', count: 32, color: 'from-[#818cf8] to-[#4f46e5]' },
              { month: 'Sept.', val: '70%', count: 29, color: 'from-[#818cf8] to-[#4f46e5]' },
              { month: 'Oct.', val: '92%', count: 48, active: true, color: 'from-[#6366f1] to-[#4338ca]' },
            ].map((bar) => (
              <div key={bar.month} className="group relative flex flex-1 flex-col items-center gap-2.5 h-full justify-end">
                {/* Infobulle élégante au survol */}
                <div className="text-[11px] font-black text-[#334155] group-hover:text-[#4f46e5] group-hover:scale-110 transition-transform">
                  {bar.count}
                </div>
                
                {/* Barre avec dégradé et bord arrondi */}
                <div className="w-full max-w-[42px] h-full flex items-end">
                  <div
                    className={`w-full rounded-t-xl transition-all duration-500 ease-out shadow-xs group-hover:brightness-110 ${
                      bar.active
                        ? 'bg-gradient-to-t from-[#4f46e5] via-[#6366f1] to-[#818cf8] shadow-md shadow-[#4f46e5]/30 ring-2 ring-[#4f46e5]/20'
                        : 'bg-gradient-to-t from-[#cbd5e1] to-[#94a3b8]'
                    }`}
                    style={{ height: bar.val }}
                  />
                </div>

                {/* Nom du mois */}
                <span className={`text-[11px] font-bold ${bar.active ? 'text-[#4f46e5] font-black' : 'text-[#64748b]'}`}>
                  {bar.month}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 shadow-xs">
          <h2 className="text-sm font-extrabold text-[#171f33]">
            Répartition des statuts
          </h2>
          <p className="text-[11px] text-[#8c94a9]">Sur l'ensemble des candidatures</p>

          <div className="mt-6 flex items-center justify-around gap-4">
            <div
              className="relative grid size-32 place-items-center rounded-full"
              style={{
                background:
                  'conic-gradient(#594be0 0 38%, #4085e6 38% 65%, #f5b041 65% 82%, #2ecc71 82% 92%, #e0e4ef 92% 100%)',
              }}
            >
              <div className="grid size-22 place-items-center rounded-full bg-white shadow-xs">
                <span className="text-2xl font-black text-[#171f33]">{companyCandidatures.length}</span>
                <span className="text-[10px] font-bold text-[#9aa3b6] uppercase">Total</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[#594be0]" />
                <span className="text-[#656e84]">Reçue / Examen</span>
                <strong className="text-[#192135]">
                  {companyCandidatures.filter((c) => c.statut === 'RECUE' || c.statut === 'EN_EXAMEN').length}
                </strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[#4085e6]" />
                <span className="text-[#656e84]">Présélectionnée</span>
                <strong className="text-[#192135]">
                  {companyCandidatures.filter((c) => c.statut === 'PRESELECTIONNEE').length}
                </strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[#f5b041]" />
                <span className="text-[#656e84]">Entretien</span>
                <strong className="text-[#192135]">
                  {companyCandidatures.filter((c) => c.statut === 'ENTRETIEN').length}
                </strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[#2ecc71]" />
                <span className="text-[#656e84]">Acceptée</span>
                <strong className="text-[#192135]">
                  {companyCandidatures.filter((c) => c.statut === 'ACCEPTEE').length}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom KPI Indicators (E7) */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#fafbfc] border border-[#e8ebf3] p-4 text-xs font-bold text-[#5c657a]">
        <div>
          Indicateurs clés : Taux de présélection :{' '}
          <span className="text-[#2b965f]">28 %</span> · Délai moyen de traitement :{' '}
          <span className="text-[#594be0]">4 jours</span>
        </div>
        <div className="text-[11px] text-[#8a93a8]">
          Conforme au Règlement Intérieur & RM8 (aucune décision automatique par l'IA)
        </div>
      </div>
    </div>
  );
}
