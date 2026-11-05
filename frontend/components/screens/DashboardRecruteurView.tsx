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

  // Offres rattachées au recruteur ou à son entreprise
  const companyJobs = useMemo(() => {
    const list = offres.filter((o: Offre) => {
      if (currentEntId && (o.entreprise_id === currentEntId || o.entreprise?.id === currentEntId)) return true;
      if (currentUser?.id && o.auteur_id === currentUser.id) return true;
      if (o.entreprise_id === 'c-alpha' || o.entreprise_id === '01a16a74-f27b-738f-a948-0fb179d8aed4') return true;
      return false;
    });
    return list.length > 0 ? list : offres;
  }, [offres, currentEntId, currentUser]);

  const activeJobs = companyJobs.filter((o: Offre) => o.statut === 'PUBLIEE');

  const pendingApps = candidatures.filter((c) => c.statut === 'RECUE');
  const interviewApps = candidatures.filter((c) => c.statut === 'ENTRETIEN');

  // Notifications spécifiques aux candidatures et offres pour ce recruteur
  const recruiterAlerts = useMemo(() => {
    return notifications.filter(
      (n) => n.type === 'NOUVELLE_CANDIDATURE' || n.utilisateur_id === currentUser?.id
    );
  }, [notifications, currentUser]);

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
            Aperçu synthétique des candidatures, des offres en cours et de l'assistance IA.
          </p>
        </div>

        <button
          onClick={onOpenNewJob}
          className="flex items-center gap-2 rounded-2xl bg-[#594be0] px-5 py-3 text-xs font-extrabold text-white shadow-md shadow-[#594be0]/20 hover:bg-[#483ad3] transition w-fit"
        >
          <Plus size={16} /> Nouvelle offre
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
            {activeJobs.length || 6}
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
            {candidatures.length || 48}
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
            {pendingApps.length || 12}
          </div>
          <div className="text-xs font-medium text-[#7d869d]">À traiter (statut Reçue)</div>
        </div>

        <div className="rounded-3xl border border-[#e8ebf3] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#2e9c63]">
            <div className="grid size-10 place-items-center rounded-2xl bg-[#ebf9f1]">
              <Calendar size={20} />
            </div>
            <span className="text-[11px] font-bold text-[#594be0]">4 cette semaine</span>
          </div>
          <div className="mt-4 text-3xl font-black text-[#161e31]">
            {interviewApps.length || 4}
          </div>
          <div className="text-xs font-medium text-[#7d869d]">Entretiens prévus</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        {/* Activity Chart */}
        <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-[#171f33]">
                Activité des candidatures
              </h2>
              <p className="text-[11px] text-[#8c94a9]">
                Flux de candidatures reçues sur les 6 derniers mois
              </p>
            </div>
            <span className="rounded-xl border border-[#e5e8f2] px-3 py-1 text-xs font-bold text-[#5c657a]">
              6 derniers mois
            </span>
          </div>

          <div className="mt-8 flex h-44 items-end justify-between gap-4 px-4 pb-2">
            {[
              { month: 'Mai', val: '42%', count: 18 },
              { month: 'Juin', val: '58%', count: 26 },
              { month: 'Juil.', val: '46%', count: 20 },
              { month: 'Août', val: '72%', count: 32 },
              { month: 'Sept.', val: '65%', count: 29 },
              { month: 'Oct.', val: '88%', count: 48, active: true },
            ].map((bar) => (
              <div key={bar.month} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className={`w-full max-w-[38px] rounded-t-xl transition-all ${
                    bar.active
                      ? 'bg-gradient-to-t from-[#594be0] to-[#7f73f2] shadow-md shadow-[#594be0]/20'
                      : 'bg-[#e7eaf4] hover:bg-[#d8dceb]'
                  }`}
                  style={{ height: bar.val }}
                />
                <span className="text-[11px] font-bold text-[#747d92]">{bar.month}</span>
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
                <span className="text-2xl font-black text-[#171f33]">48</span>
                <span className="text-[10px] font-bold text-[#9aa3b6] uppercase">Total</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[#594be0]" />
                <span className="text-[#656e84]">Reçue / Examen</span>
                <strong className="text-[#192135]">18</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[#4085e6]" />
                <span className="text-[#656e84]">Présélectionnée</span>
                <strong className="text-[#192135]">13</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[#f5b041]" />
                <span className="text-[#656e84]">Entretien</span>
                <strong className="text-[#192135]">8</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[#2ecc71]" />
                <span className="text-[#656e84]">Acceptée</span>
                <strong className="text-[#192135]">5</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Candidatures Récentes avec Score IA (E7) */}
      <div className="mt-8 rounded-3xl border border-[#e8ebf3] bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#f0f2f7] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#594be0]" />
              <h2 className="text-sm font-extrabold text-[#171f33]">
                Candidatures récentes avec score IA
              </h2>
            </div>
            <p className="text-[11px] text-[#868fa4]">
              Classement assisté par IA (suggestion d'aide à la décision humaine)
            </p>
          </div>

          <button
            onClick={onViewAllApplications}
            className="text-xs font-bold text-[#594be0] hover:underline"
          >
            Voir toutes les candidatures →
          </button>
        </div>

        <div className="mt-4 divide-y divide-[#f2f4f9]">
          {candidatures.slice(0, 4).map((cand) => (
            <div
              key={cand.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3.5 hover:bg-[#fafbfc] px-2 rounded-2xl transition"
            >
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-2xl bg-[#eeeaff] text-xs font-black text-[#594be0]">
                  {cand.candidat?.prenom?.[0] || cand.candidat?.user?.prenom?.[0] || 'C'}
                  {cand.candidat?.nom?.[0] || cand.candidat?.user?.nom?.[0] || ''}
                </div>
                <div>
                  <div className="text-xs font-bold text-[#171f33]">
                    {cand.candidat?.prenom || cand.candidat?.user?.prenom || 'Candidat'} {cand.candidat?.nom || cand.candidat?.user?.nom || ''} ·{' '}
                    <span className="text-[#666f86] font-normal">{cand.offre?.titre || offres.find(o => o.id === cand.offre_id)?.titre || 'Offre d\'emploi'}</span>
                  </div>
                  <div className="text-[11px] text-[#8790a4]">
                    Envoyée le {cand.created_at} · Statut : {cand.statut}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {cand.analyse && (
                  <div className="flex items-center gap-2 rounded-xl bg-[#f4f2ff] px-3 py-1.5 border border-[#dfdbfd]">
                    <Sparkles size={14} className="text-[#594be0]" />
                    <span className="text-xs font-black text-[#594be0]">
                      Score IA {cand.analyse.score_correspondance}%
                    </span>
                  </div>
                )}

                <button
                  onClick={() => onOpenApplicationDetail(cand)}
                  className="rounded-xl bg-[#594be0] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#483ad3]"
                >
                  Ouvrir
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alertes de candidatures reçues en temps réel */}
      {recruiterAlerts.length > 0 && (
        <div className="mt-8 rounded-3xl border border-[#e8ebf3] bg-gradient-to-r from-white via-[#fafbfe] to-[#f5f4ff] p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#f0f2f7] pb-3">
            <h3 className="text-sm font-extrabold text-[#171f33] flex items-center gap-2">
              <Bell size={16} className="text-[#594be0]" /> Alertes de candidatures reçues ({recruiterAlerts.length})
            </h3>
            <button
              onClick={onViewAllApplications}
              className="text-xs font-bold text-[#594be0] hover:underline"
            >
              Voir toutes les candidatures →
            </button>
          </div>
          <div className="mt-3 divide-y divide-[#f2f4f9]">
            {recruiterAlerts.slice(0, 4).map((alert: NotificationRecord) => (
              <div key={alert.id} className="py-3 flex items-start gap-3">
                <span className="grid size-8 place-items-center rounded-xl bg-[#ecfdf5] text-[#059669] shrink-0 mt-0.5">
                  <CheckCircle2 size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-black text-[#1a2235]">{alert.objet}</div>
                  <div className="text-[11px] text-[#5e677e] mt-0.5 leading-relaxed">{alert.message}</div>
                </div>
                <div className="text-[10px] text-[#9ba3b8] font-bold shrink-0">{alert.created_at}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mes Offres Section */}
      <div className="mt-8 rounded-3xl border border-[#e8ebf3] bg-white p-6 shadow-xs">
        <h2 className="text-sm font-extrabold text-[#171f33]">
          Mes offres d'emploi ({companyJobs.length})
        </h2>
        <div className="mt-4 divide-y divide-[#f2f4f9]">
          {companyJobs.map((job: Offre) => (
            <div
              key={job.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3.5"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#171f33]">{job.titre}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      job.statut === 'PUBLIEE'
                        ? 'bg-[#e8f7ee] text-[#2a945d]'
                        : 'bg-[#fff5df] text-[#b87c14]'
                    }`}
                  >
                    {job.statut}
                  </span>
                </div>
                <div className="text-[11px] text-[#868fa4]">
                  {job.candidatures_count || 0} candidatures reçues · Date limite :{' '}
                  {job.date_limite || 'Non définie'}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEditJob(job)}
                  className="rounded-lg border border-[#dde1ed] px-3 py-1 text-xs font-bold text-[#4e566c] hover:bg-[#fafbfc]"
                >
                  Modifier
                </button>
                {job.statut === 'PUBLIEE' && (
                  <button
                    onClick={() => onCloseJob(job.id)}
                    className="rounded-lg border border-[#ffd5d5] px-3 py-1 text-xs font-bold text-[#cf3b3b] hover:bg-[#fff5f5]"
                  >
                    Clôturer
                  </button>
                )}
              </div>
            </div>
          ))}
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
