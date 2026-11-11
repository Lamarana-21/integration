'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  BriefcaseBusiness,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  ExternalLink,
  Eye,
  Globe,
  Layers,
  MapPin,
  Plus,
  Shield,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { Entreprise, Offre, RoleName, User, formatFrenchDate } from '@/lib/types';

interface FicheEntrepriseViewProps {
  entreprise: Entreprise;
  allEntreprises?: Entreprise[];
  onSelectEntreprise?: (ent: Entreprise) => void;
  offres: Offre[];
  recruteurs: User[];
  currentRole?: RoleName;
  currentUser?: User | null;
  allRecruteurs?: User[];
  onUpdateEntreprise: (updated: Partial<Entreprise>) => void;
  onSelectOffre: (offre: Offre) => void;
  onRemoveRecruteur?: (recruiterId: string) => Promise<void> | void;
  onAttachRecruteur?: (recruiterId: string) => Promise<void> | void;
  onBack?: () => void;
}

export function FicheEntrepriseView({
  entreprise,
  allEntreprises = [],
  onSelectEntreprise,
  offres,
  recruteurs,
  currentRole,
  currentUser,
  allRecruteurs = [],
  onUpdateEntreprise,
  onSelectOffre,
  onRemoveRecruteur,
  onAttachRecruteur,
  onBack,
}: FicheEntrepriseViewProps) {
  const isAdmin = currentRole === 'ADMIN';

  const [isEditing, setIsEditing] = useState(false);
  const [nom, setNom] = useState(entreprise.nom);
  const [secteur, setSecteur] = useState(entreprise.secteur);
  const [ville, setVille] = useState(entreprise.ville);
  const [siteWeb, setSiteWeb] = useState(entreprise.site_web || '');
  const [description, setDescription] = useState(entreprise.description || '');
  const [activeTab, setActiveTab] = useState<'PRESENTATION' | 'OFFRES' | 'CULTURE'>('PRESENTATION');

  // Modales d'administration
  const [selectedRecruteur, setSelectedRecruteur] = useState<User | null>(null);
  const [recruiterToRemove, setRecruiterToRemove] = useState<User | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isAttachingModalOpen, setIsAttachingModalOpen] = useState(false);
  const [selectedRecruiterToAttach, setSelectedRecruiterToAttach] = useState<string>('');
  const [isAttaching, setIsAttaching] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    setNom(entreprise.nom);
    setSecteur(entreprise.secteur);
    setVille(entreprise.ville);
    setSiteWeb(entreprise.site_web || '');
    setDescription(entreprise.description || '');
  }, [entreprise]);

  const companyJobs = useMemo(
    () =>
      offres.filter(
        (o) => o.entreprise_id === entreprise.id || o.entreprise?.id === entreprise.id
      ),
    [offres, entreprise.id]
  );
  const activeJobs = useMemo(
    () => companyJobs.filter((o) => o.statut === 'PUBLIEE'),
    [companyJobs]
  );
  const closedJobs = useMemo(
    () => companyJobs.filter((o) => o.statut === 'CLOTUREE'),
    [companyJobs]
  );

  const companySkills = useMemo(() => {
    const all = companyJobs.flatMap((o) => o.competences_requises || []);
    return Array.from(new Set(all));
  }, [companyJobs]);

  const availableRecruitersToAttach = allRecruteurs.filter(
    (u) =>
      u.id &&
      u.entreprise_id !== entreprise.id &&
      !recruteurs.some((r) => r.id === u.id)
  );

  const handleSave = () => {
    onUpdateEntreprise({
      nom,
      secteur,
      ville,
      site_web: siteWeb,
      description,
    });
    setIsEditing(false);
    setFeedbackMessage({
      type: 'success',
      text: 'Informations de l’entreprise enregistrées avec succès.',
    });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleConfirmRemove = async () => {
    if (!recruiterToRemove || !onRemoveRecruteur) return;
    setIsRemoving(true);
    try {
      await onRemoveRecruteur(recruiterToRemove.id);
      setFeedbackMessage({
        type: 'success',
        text: `Le recruteur ${recruiterToRemove.prenom} ${recruiterToRemove.nom} a été retiré de l'entreprise avec succès.`,
      });
      setRecruiterToRemove(null);
    } catch {
      setFeedbackMessage({
        type: 'error',
        text: 'Une erreur est survenue lors du retrait du recruteur.',
      });
    } finally {
      setIsRemoving(false);
      setTimeout(() => setFeedbackMessage(null), 4500);
    }
  };

  const handleConfirmAttach = async () => {
    if (!selectedRecruiterToAttach || !onAttachRecruteur) return;
    setIsAttaching(true);
    try {
      await onAttachRecruteur(selectedRecruiterToAttach);
      const attached = allRecruteurs.find((u) => u.id === selectedRecruiterToAttach);
      setFeedbackMessage({
        type: 'success',
        text: `Le recruteur ${attached?.prenom ?? ''} ${attached?.nom ?? ''} a été rattaché à ${entreprise.nom} avec succès.`,
      });
      setIsAttachingModalOpen(false);
      setSelectedRecruiterToAttach('');
    } catch {
      setFeedbackMessage({
        type: 'error',
        text: 'Une erreur est survenue lors du rattachement du recruteur.',
      });
    } finally {
      setIsAttaching(false);
      setTimeout(() => setFeedbackMessage(null), 4500);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-6">
      {/* Barre supérieure : Retour & Sélecteur rapide */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#dde1ed] bg-white px-4 py-2.5 text-xs font-extrabold text-[#374151] shadow-2xs hover:border-[#594be0] hover:text-[#594be0] transition"
            >
              <ArrowLeft size={15} /> Retour à l'annuaire des entreprises
            </button>
          )}

          {allEntreprises && allEntreprises.length > 1 && onSelectEntreprise && (
            <div className="flex items-center gap-2 rounded-2xl border border-[#e2e5ef] bg-white px-3.5 py-2 shadow-2xs">
              <span className="text-xs font-semibold text-[#7c869c]">Explorer :</span>
              <select
                value={entreprise.id}
                onChange={(e) => {
                  const found = allEntreprises.find((ent) => ent.id === e.target.value);
                  if (found) onSelectEntreprise(found);
                }}
                className="bg-transparent text-xs font-extrabold text-[#1f2638] outline-none cursor-pointer"
              >
                {allEntreprises.map((ent) => (
                  <option key={ent.id} value={ent.id}>
                    {ent.nom} ({ent.ville})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="inline-flex items-center gap-2 rounded-2xl bg-[#594be0]/10 px-3.5 py-1.5 text-xs font-bold text-[#594be0] border border-[#594be0]/20">
            <Shield size={14} /> Mode Administration Entreprise
          </div>
        )}
      </div>

      {/* Bannière de feedback notification */}
      {feedbackMessage && (
        <div
          className={`flex items-center gap-2.5 rounded-2xl p-4 text-xs font-bold animate-in fade-in ${
            feedbackMessage.type === 'success'
              ? 'border border-[#bde9ce] bg-[#edf9f3] text-[#1a8145]'
              : 'border border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertTriangle size={16} />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* HERO CARTE D'IDENTITÉ DE L'ENTREPRISE */}
      <div className="overflow-hidden rounded-3xl border border-[#e5e8f2] bg-white shadow-sm">
        {/* Couverture visuelle */}
        <div className="h-32 sm:h-40 bg-gradient-to-r from-[#1e1b4b] via-[#3730a3] to-[#6d28d9] relative overflow-hidden">
          <div className="absolute -right-12 -top-12 size-56 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute left-1/3 -bottom-16 size-48 rounded-full bg-[#38bdf8]/20 blur-xl" />
          <div className="absolute inset-0 flex items-start justify-between p-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1 text-xs font-bold text-white backdrop-blur-md border border-white/20">
              <ShieldCheck size={14} className="text-[#34d399]" /> Entreprise Partenaire Certifiée
            </span>
            <span className="rounded-full bg-[#dcfce7] px-3 py-1 text-xs font-black text-[#15803d] shadow-xs">
              {activeJobs.length} poste(s) à pourvoir
            </span>
          </div>
        </div>

        {/* Informations principales */}
        <div className="px-6 pb-7 sm:px-8">
          <div className="-mt-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="grid size-24 shrink-0 place-items-center rounded-3xl border-4 border-white bg-gradient-to-br from-[#594be0] to-[#3b2eb8] text-3xl font-black text-white shadow-lg">
                {entreprise.nom.substring(0, 2).toUpperCase()}
              </div>
              <div className="pt-2 sm:pt-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-[#141b2d]">
                    {entreprise.nom}
                  </h1>
                  <span className="rounded-full bg-[#ecfdf5] border border-[#a7f3d0] px-2.5 py-0.5 text-[11px] font-extrabold text-[#059669]">
                    {entreprise.statut || 'ACTIVE'}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#646d84]">
                  <span className="flex items-center gap-1.5 font-extrabold text-[#4338ca]">
                    <Layers size={14} /> {entreprise.secteur || 'Technologies & Services'}
                  </span>
                  <span className="flex items-center gap-1 font-semibold">
                    <MapPin size={14} className="text-[#ef4444]" /> {entreprise.ville},{' '}
                    {entreprise.pays || 'Tunisie'}
                  </span>
                  {entreprise.site_web && (
                    <a
                      href={entreprise.site_web}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 font-extrabold text-[#594be0] hover:underline"
                    >
                      <Globe size={14} /> {entreprise.site_web.replace(/^https?:\/\//, '')}{' '}
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {isAdmin && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-[#dde1ed] bg-white px-4 py-2.5 text-xs font-extrabold text-[#4e566c] shadow-2xs hover:bg-[#fafbfc] transition"
              >
                <Edit2 size={14} /> {isEditing ? 'Annuler' : 'Modifier la fiche'}
              </button>
            )}
          </div>

          {/* Formulaire d'édition Admin */}
          {isAdmin && isEditing && (
            <div className="mt-6 space-y-4 rounded-2xl border border-[#e7eaf2] bg-[#fafbfe] p-5 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="font-bold text-[#232a3e]">Nom de l'entreprise</label>
                  <input
                    type="text"
                    value={nom ?? ''}
                    onChange={(e) => setNom(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#e2e5ef] bg-white p-2.5 outline-none focus:border-[#594be0]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#232a3e]">Secteur</label>
                  <input
                    type="text"
                    value={secteur ?? ''}
                    onChange={(e) => setSecteur(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#e2e5ef] bg-white p-2.5 outline-none focus:border-[#594be0]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#232a3e]">Ville</label>
                  <input
                    type="text"
                    value={ville ?? ''}
                    onChange={(e) => setVille(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#e2e5ef] bg-white p-2.5 outline-none focus:border-[#594be0]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#232a3e]">Site Web</label>
                  <input
                    type="text"
                    value={siteWeb ?? ''}
                    onChange={(e) => setSiteWeb(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#e2e5ef] bg-white p-2.5 outline-none focus:border-[#594be0]"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-[#232a3e]">Description de l'entreprise</label>
                <textarea
                  rows={3}
                  value={description ?? ''}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] bg-white p-2.5 outline-none focus:border-[#594be0]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-xl border border-[#dde1ed] bg-white px-4 py-2 font-bold text-[#5c6579]"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-xl bg-[#594be0] px-5 py-2 font-bold text-white shadow-xs hover:bg-[#483ad3]"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          )}

          {/* Chiffres & Repères clés de l'entreprise */}
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-2xl bg-[#f8f9fd] border border-[#ebedf5] p-4">
            <div className="flex items-center gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#594be0] shadow-2xs border border-[#e7eaf3]">
                <BriefcaseBusiness size={18} />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#848ea4]">
                  Offres publiées
                </div>
                <div className="text-xs font-black text-[#171f33]">
                  {activeJobs.length} poste(s) actif(s)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#16a34a] shadow-2xs border border-[#e7eaf3]">
                <Users size={18} />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#848ea4]">
                  Taille & Équipe
                </div>
                <div className="text-xs font-black text-[#171f33]">50 – 200 collaborateurs</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#2563eb] shadow-2xs border border-[#e7eaf3]">
                <Globe size={18} />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#848ea4]">
                  Organisation
                </div>
                <div className="text-xs font-black text-[#171f33]">Présentiel & Hybride</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#d97706] shadow-2xs border border-[#e7eaf3]">
                <Clock size={18} />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#848ea4]">
                  Réactivité RH
                </div>
                <div className="text-xs font-black text-[#15803d]">Retour sous 48h</div>
              </div>
            </div>
          </div>

          {/* Onglets de navigation de la fiche entreprise */}
          <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-[#edf0f7] pb-3">
            {[
              { id: 'PRESENTATION', label: 'Présentation & Technologies' },
              { id: 'OFFRES', label: `Offres d'emploi (${activeJobs.length})` },
              { id: 'CULTURE', label: 'Culture, Valeurs & Processus RH' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as any)}
                className={`rounded-xl px-4 py-2 text-xs font-extrabold transition ${
                  activeTab === t.id
                    ? 'bg-[#594be0] text-white shadow-xs'
                    : 'bg-[#f4f6fb] text-[#5c657d] hover:bg-[#e9ecf5]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENU DÉTAILLÉ SELON L'ONGLET */}
      {activeTab === 'PRESENTATION' && (
        <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <h2 className="text-base font-black text-[#171f33]">
                À propos de {entreprise.nom}
              </h2>
              <p className="text-xs sm:text-[13px] leading-7 text-[#4c556b] whitespace-pre-line">
                {description ||
                  entreprise.description ||
                  `${entreprise.nom} est un acteur de référence dans le secteur ${entreprise.secteur || 'numérique'}, basé à ${entreprise.ville || 'Tunis'}. Nous accompagnons nos clients sur des projets d'envergure tout en cultivant un environnement propice à l'évolution de carrière, à l'innovation et à la montée en compétences continue.`}
              </p>

              <div className="grid gap-3 sm:grid-cols-3 pt-2">
                <div className="rounded-2xl border border-[#eef1f8] bg-[#fafbfe] p-4">
                  <div className="text-xs font-black text-[#594be0]">Innovation continue</div>
                  <p className="mt-1 text-[11px] text-[#5e677e] leading-relaxed">
                    Projets modernes utilisant les dernières architectures logicielles et méthodologies agiles.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#eef1f8] bg-[#fafbfe] p-4">
                  <div className="text-xs font-black text-[#059669]">Évolution & Mentorat</div>
                  <p className="mt-1 text-[11px] text-[#5e677e] leading-relaxed">
                    Suivi personnalisé de carrière, formations certifiantes et accompagnement par des seniors.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#eef1f8] bg-[#fafbfe] p-4">
                  <div className="text-xs font-black text-[#d97706]">Équilibre & Flexibilité</div>
                  <p className="mt-1 text-[11px] text-[#5e677e] leading-relaxed">
                    Organisation hybride souple, espaces collaboratifs modernes et culture bienveillante.
                  </p>
                </div>
              </div>
            </div>

            {/* Compétences et Stack technique recherchées */}
            {companySkills.length > 0 && (
              <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-black text-[#171f33] flex items-center gap-2">
                    <Zap size={17} className="text-[#594be0]" /> Technologies & Compétences clés chez {entreprise.nom}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {companySkills.map((sk) => (
                    <span
                      key={sk}
                      className="rounded-xl border border-[#dcd7fb] bg-[#f7f6ff] px-3.5 py-1.5 text-xs font-extrabold text-[#5547d7]"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Encadré latéral : Dernières offres ouvertes */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#171f33]">
                  Postes ouverts ({activeJobs.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('OFFRES')}
                  className="text-xs font-bold text-[#594be0] hover:underline"
                >
                  Tout voir →
                </button>
              </div>

              {activeJobs.length === 0 ? (
                <p className="text-xs text-[#7d869c]">
                  Aucune offre active pour le moment.
                </p>
              ) : (
                <div className="space-y-3">
                  {activeJobs.slice(0, 3).map((job) => (
                    <div
                      key={job.id}
                      onClick={() => onSelectOffre(job)}
                      className="cursor-pointer rounded-2xl border border-[#e9ecf5] bg-[#fafbfe] p-4 hover:border-[#594be0] transition space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="rounded-md bg-[#eeeaff] px-2 py-0.5 text-[10px] font-extrabold text-[#594be0]">
                          {job.type_contrat}
                        </span>
                        <span className="text-[11px] text-[#7c859c]">{job.lieu}</span>
                      </div>
                      <div className="text-xs font-black text-[#171f33]">{job.titre}</div>
                      {job.salaire && (
                        <div className="text-[11px] font-bold text-[#15803d]">{job.salaire}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'CULTURE' && (
        <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <h2 className="text-base font-black text-[#171f33]">
            Processus d'intégration & Engagements RH de {entreprise.nom}
          </h2>
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              {
                step: '01',
                title: 'Candidature transparente',
                desc: 'Dépôt rapide de votre CV dynamique ou PDF sans formulaire redondant.',
              },
              {
                step: '02',
                title: 'Qualification RH',
                desc: 'Étude attentive de votre parcours et premier retour rapide sous 48h.',
              },
              {
                step: '03',
                title: 'Entretien métier',
                desc: 'Échange constructif en visio ou dans nos locaux avec votre futur manager.',
              },
              {
                step: '04',
                title: 'Proposition & Onboarding',
                desc: 'Décision officielle communiquée sur votre portail et parcours d’intégration dédié.',
              },
            ].map((s) => (
              <div key={s.step} className="rounded-2xl border border-[#eaedf5] bg-[#fafbfe] p-4 space-y-2">
                <span className="inline-block rounded-lg bg-[#594be0] px-2.5 py-0.5 text-[11px] font-black text-white">
                  Étape {s.step}
                </span>
                <div className="text-xs font-black text-[#171f33]">{s.title}</div>
                <p className="text-[11px] text-[#5e677e] leading-5">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LISTE COMPLÈTE DES OFFRES DE L'ENTREPRISE */}
      <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0f2f7] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-[#f0efff] text-[#594be0]">
              <BriefcaseBusiness size={18} />
            </div>
            <div>
              <h2 className="text-base font-black text-[#171f33]">
                Opportunités de carrière chez {entreprise.nom}
              </h2>
              <p className="text-xs text-[#7c859c]">
                {activeJobs.length} offre(s) active(s)
                {isAdmin ? ` · ${closedJobs.length} clôturée(s)` : ''}
              </p>
            </div>
          </div>
        </div>

        {companyJobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#dde1ed] p-10 text-center text-xs text-[#828ca1]">
            <BriefcaseBusiness className="mx-auto mb-2 text-[#9ea6bb]" size={30} />
            Aucune offre d'emploi disponible actuellement pour cette entreprise.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {companyJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => onSelectOffre(job)}
                className="group cursor-pointer rounded-2xl border border-[#e7eaf2] bg-[#fafbfe] p-5 hover:bg-white hover:border-[#594be0] hover:shadow-md transition flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-lg bg-[#eeeaff] px-2.5 py-0.5 text-[11px] font-extrabold text-[#594be0]">
                      {job.type_contrat}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        job.statut === 'PUBLIEE'
                          ? 'bg-[#dcfce7] text-[#15803d]'
                          : 'bg-[#f1f3f8] text-[#6e778f]'
                      }`}
                    >
                      {job.statut === 'PUBLIEE' ? 'Recrutement actif' : job.statut}
                    </span>
                  </div>

                  <h3 className="mt-2.5 text-sm font-black text-[#171f33] group-hover:text-[#594be0] transition">
                    {job.titre}
                  </h3>

                  <p className="mt-1 text-xs text-[#5e677e] line-clamp-2">
                    {job.description}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(job.competences_requises || []).slice(0, 4).map((c) => (
                      <span
                        key={c}
                        className="rounded-md bg-white border border-[#e5e8f0] px-2 py-0.5 text-[10px] font-bold text-[#4b5368]"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[#edf0f7] pt-3 text-xs">
                  <div className="flex items-center gap-2 text-[#6e778f]">
                    <span className="flex items-center gap-1 font-semibold">
                      <MapPin size={12} className="text-[#ef4444]" /> {job.lieu}
                    </span>
                    {job.salaire && (
                      <span className="font-extrabold text-[#15803d]">· {job.salaire}</span>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1 font-black text-[#594be0]">
                    Voir l'offre <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION RECRUTEURS RATTACHÉS (RÉSERVÉ STRICTEMENT À L'ADMIN) */}
      {isAdmin && (
        <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f0f2f7] pb-4">
            <div className="flex items-center gap-2">
              <Users size={17} className="text-[#594be0]" />
              <h2 className="text-sm font-extrabold text-[#171f33]">
                Recruteurs rattachés à {entreprise.nom}
              </h2>
              <span className="rounded-full bg-[#f0efff] px-2.5 py-0.5 text-xs font-bold text-[#594be0]">
                {recruteurs.length} recruteur(s)
              </span>
            </div>

            {onAttachRecruteur && availableRecruitersToAttach.length > 0 && (
              <button
                onClick={() => setIsAttachingModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#594be0] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#483ad3] transition"
              >
                <Plus size={14} /> Rattacher un recruteur
              </button>
            )}
          </div>

          {recruteurs.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[#dde1ed] p-8 text-center text-xs text-[#7d879d]">
              <Building2 className="mx-auto mb-2 text-[#9ea6bb]" size={28} />
              <p className="font-bold text-[#232b3f]">
                Aucun recruteur n'est actuellement rattaché à cette entreprise.
              </p>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-[#f2f4f9]">
              {recruteurs.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between py-3.5 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-9 place-items-center rounded-full bg-[#eef0f7] text-xs font-bold text-[#4a5266]">
                      {r.prenom[0]}
                      {r.nom[0]}
                    </div>
                    <div>
                      <div className="font-bold text-[#1f273b]">
                        {r.prenom} {r.nom}{' '}
                        <span className="text-[#8790a4] font-normal">(Responsable RH)</span>
                      </div>
                      <div className="text-[11px] text-[#8790a4]">{r.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedRecruteur(r)}
                      className="flex items-center gap-1 rounded-lg border border-[#dde0ec] bg-[#f8f9fd] px-3 py-1 font-bold text-[#594be0] hover:bg-[#eeeaff] transition"
                    >
                      <Eye size={13} /> Profil
                    </button>
                    {onRemoveRecruteur && (
                      <button
                        onClick={() => setRecruiterToRemove(r)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#ffd5d5] bg-white px-3 py-1 font-bold text-[#cf3b3b] hover:bg-[#fff5f5] transition"
                      >
                        <UserMinus size={13} /> Retirer
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Confirmation de Retrait d'un Recruteur (Admin uniquement) */}
      {recruiterToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-[#e6e9f2] bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-[#f0f2f7] pb-3">
              <div className="flex items-center gap-2 text-sm font-extrabold text-[#171f33]">
                <div className="grid size-9 place-items-center rounded-xl bg-[#fff2f2] text-[#cf3b3b]">
                  <AlertTriangle size={18} />
                </div>
                <span>Retirer le recruteur</span>
              </div>
              <button
                onClick={() => setRecruiterToRemove(null)}
                className="rounded-xl p-1 text-[#8892a7] hover:bg-[#f2f4f8]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 text-xs text-[#525a6f] space-y-3">
              <p>
                Êtes-vous sûr de vouloir retirer{' '}
                <strong className="text-[#171f33]">
                  {recruiterToRemove.prenom} {recruiterToRemove.nom}
                </strong>{' '}
                de l'entreprise <strong className="text-[#171f33]">{entreprise.nom}</strong> ?
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRecruiterToRemove(null)}
                className="rounded-xl border border-[#dde1ed] bg-white px-4 py-2 text-xs font-bold text-[#4e566c]"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isRemoving}
                onClick={handleConfirmRemove}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#cf3b3b] px-4 py-2 text-xs font-bold text-white"
              >
                <UserMinus size={14} />
                {isRemoving ? 'Retrait en cours...' : 'Confirmer le retrait'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rattacher un Recruteur (Admin uniquement) */}
      {isAttachingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-[#e6e9f2] bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-[#f0f2f7] pb-3">
              <div className="flex items-center gap-2 text-sm font-extrabold text-[#171f33]">
                <div className="grid size-9 place-items-center rounded-xl bg-[#eeeaff] text-[#594be0]">
                  <UserPlus size={18} />
                </div>
                <span>Rattacher un recruteur à {entreprise.nom}</span>
              </div>
              <button
                onClick={() => {
                  setIsAttachingModalOpen(false);
                  setSelectedRecruiterToAttach('');
                }}
                className="rounded-xl p-1 text-[#8892a7] hover:bg-[#f2f4f8]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              {availableRecruitersToAttach.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#dde1ed] p-6 text-center text-[#8e97ac]">
                  Aucun autre recruteur disponible à rattacher.
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {availableRecruitersToAttach.map((candRec) => (
                    <div
                      key={candRec.id}
                      onClick={() => setSelectedRecruiterToAttach(candRec.id)}
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                        selectedRecruiterToAttach === candRec.id
                          ? 'border-[#594be0] bg-[#f8f7ff] shadow-xs'
                          : 'border-[#edf0f7] hover:border-[#dde1ed] bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid size-8 place-items-center rounded-full bg-[#f0efff] text-xs font-bold text-[#594be0]">
                          {candRec.prenom[0]}
                          {candRec.nom[0]}
                        </div>
                        <div>
                          <div className="font-bold text-[#1f283d]">
                            {candRec.prenom} {candRec.nom}
                          </div>
                          <div className="text-[11px] text-[#828ba0]">{candRec.email}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsAttachingModalOpen(false);
                  setSelectedRecruiterToAttach('');
                }}
                className="rounded-xl border border-[#dde1ed] bg-white px-4 py-2 text-xs font-bold text-[#4e566c]"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={!selectedRecruiterToAttach || isAttaching}
                onClick={handleConfirmAttach}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#594be0] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                <UserCheck size={14} />
                {isAttaching ? 'Rattachement...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Détails Profil Recruteur */}
      {selectedRecruteur && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-[#e6e9f2] bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-[#eef1f7] pb-4">
              <div className="flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-2xl bg-[#eeeaff] text-base font-black text-[#594be0]">
                  {selectedRecruteur.prenom[0]}
                  {selectedRecruteur.nom[0]}
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#171f33]">
                    {selectedRecruteur.prenom} {selectedRecruteur.nom}
                  </h3>
                  <div className="text-xs text-[#7e879d]">{selectedRecruteur.email}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecruteur(null)}
                className="rounded-xl p-1.5 text-[#8892a7] hover:bg-[#f2f4f8]"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedRecruteur(null)}
                className="rounded-xl bg-[#594be0] px-5 py-2.5 text-xs font-bold text-white"
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
