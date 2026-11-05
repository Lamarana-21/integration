'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Edit2,
  ExternalLink,
  Eye,
  Globe,
  Mail,
  MapPin,
  Plus,
  Shield,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { Entreprise, Offre, RoleName, User } from '@/lib/types';

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

  const companyJobs = offres.filter((o) => o.entreprise_id === entreprise.id);
  const activeJobs = companyJobs.filter((o) => o.statut === 'PUBLIEE');
  const closedJobs = companyJobs.filter((o) => o.statut === 'CLOTUREE');

  // Recruteurs qui ne sont pas encore rattachés à cette entreprise
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
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Barre supérieure : Retour & Sélecteur rapide d'entreprise */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#dde1ed] bg-white px-4 py-2.5 text-xs font-bold text-[#4e566c] shadow-xs hover:bg-[#f8f9fd] hover:text-[#594be0] transition"
            >
              <ArrowLeft size={15} /> Toutes les entreprises
            </button>
          )}

          {allEntreprises && allEntreprises.length > 1 && onSelectEntreprise && (
            <div className="flex items-center gap-2 rounded-2xl border border-[#e2e5ef] bg-white px-3 py-1.5 shadow-xs">
              <span className="text-xs font-semibold text-[#7c869c]">Autre entreprise :</span>
              <select
                value={entreprise.id}
                onChange={(e) => {
                  const found = allEntreprises.find((ent) => ent.id === e.target.value);
                  if (found) onSelectEntreprise(found);
                }}
                className="bg-transparent text-xs font-bold text-[#1f2638] outline-none cursor-pointer"
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
            <Shield size={14} /> Espace Administration Entreprise
          </div>
        )}
      </div>

      {/* Bannière de feedback notification */}
      {feedbackMessage && (
        <div
          className={`mb-6 flex items-center gap-2.5 rounded-2xl p-4 text-xs font-bold animate-in fade-in ${
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

      {/* Top Banner de présentation de l'entreprise */}
      <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-[#594be0] to-[#7f73f2] text-2xl font-black text-white shadow-md shadow-[#594be0]/20">
              {entreprise.nom[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-[#171f33]">{entreprise.nom}</h1>
                <span className="rounded-full bg-[#edf9f3] px-2.5 py-0.5 text-[10px] font-bold text-[#279257]">
                  {entreprise.statut}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#757e95]">
                <span>{entreprise.secteur}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <MapPin size={13} /> {entreprise.ville}, {entreprise.pays}
                </span>
                {entreprise.site_web && (
                  <>
                    <span>·</span>
                    <a
                      href={entreprise.site_web}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 font-bold text-[#594be0] hover:underline"
                    >
                      <Globe size={13} /> {entreprise.site_web} <ExternalLink size={11} />
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Bouton de modification réservé STRICTEMENT à l'administrateur */}
          {isAdmin && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1.5 rounded-xl border border-[#dde1ed] bg-white px-4 py-2.5 text-xs font-bold text-[#4e566c] shadow-xs hover:bg-[#fafbfc] transition"
            >
              <Edit2 size={14} /> {isEditing ? 'Annuler' : 'Modifier la fiche'}
            </button>
          )}
        </div>

        {/* Formulaire d'édition pour l'administrateur */}
        {isAdmin && isEditing ? (
          <div className="mt-6 space-y-4 border-t border-[#f0f2f7] pt-6 text-xs">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="font-bold text-[#232a3e]">Nom de l'entreprise</label>
                <input
                  type="text"
                  value={nom ?? ''}
                  onChange={(e) => setNom(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none focus:border-[#594be0]"
                />
              </div>
              <div>
                <label className="font-bold text-[#232a3e]">Secteur</label>
                <input
                  type="text"
                  value={secteur ?? ''}
                  onChange={(e) => setSecteur(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none focus:border-[#594be0]"
                />
              </div>
              <div>
                <label className="font-bold text-[#232a3e]">Ville</label>
                <input
                  type="text"
                  value={ville ?? ''}
                  onChange={(e) => setVille(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none focus:border-[#594be0]"
                />
              </div>
              <div>
                <label className="font-bold text-[#232a3e]">Site Web</label>
                <input
                  type="text"
                  value={siteWeb ?? ''}
                  onChange={(e) => setSiteWeb(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none focus:border-[#594be0]"
                />
              </div>
            </div>
            <div>
              <label className="font-bold text-[#232a3e]">Description de l'entreprise</label>
              <textarea
                rows={3}
                value={description ?? ''}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#e2e5ef] p-2.5 outline-none focus:border-[#594be0]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-xl border border-[#dde1ed] bg-white px-4 py-2 font-bold text-[#5c6579] hover:bg-[#f8f9fd]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-xl bg-[#594be0] px-5 py-2 font-bold text-white shadow-xs hover:bg-[#483ad3] transition"
              >
                Enregistrer les modifications
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 border-t border-[#f0f2f7] pt-6 text-xs leading-6 text-[#525a6f]">
            {description || entreprise.description || 'Aucune description fournie.'}
          </div>
        )}
      </div>

      {/* 
        Section Recruteurs Rattachés :
        Réservé STRICTEMENT à l'administrateur.
        Sur la page publique (visiteurs & candidats), cette section est TOTALEMENT MASQUÉE.
      */}
      {isAdmin && (
        <div className="mt-8 rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs">
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
              <p className="font-bold text-[#232b3f]">Aucun recruteur n'est actuellement rattaché à cette entreprise.</p>
              <p className="mt-1 text-[#868ea2]">
                Vous pouvez rattacher un recruteur existant à l'aide du bouton ci-dessus.
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
                        title="Retirer ce recruteur de l'entreprise"
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

      {/* Offres de l'entreprise (Accessible pour le public et l'admin) */}
      <div className="mt-8 rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#f0f2f7] pb-4">
          <div className="flex items-center gap-2">
            <BriefcaseBusiness size={17} className="text-[#594be0]" />
            <h2 className="text-sm font-extrabold text-[#171f33]">
              Offres d'emploi ({activeJobs.length} active(s){isAdmin ? ` · ${closedJobs.length} clôturée(s)` : ''})
            </h2>
          </div>
        </div>

        {companyJobs.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-[#dde1ed] p-8 text-center text-xs text-[#828ca1]">
            <BriefcaseBusiness className="mx-auto mb-2 text-[#9ea6bb]" size={28} />
            Aucune offre d'emploi disponible actuellement pour cette entreprise.
          </div>
        ) : (
          <div className="mt-4 divide-y divide-[#f2f4f9]">
            {companyJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between py-3.5 text-xs"
              >
                <div>
                  <div className="font-bold text-[#1f273b]">{job.titre}</div>
                  <div className="text-[11px] text-[#868fa4]">
                    {job.type_contrat} · {job.lieu} · Statut : {job.statut}
                  </div>
                </div>

                <button
                  onClick={() => onSelectOffre(job)}
                  className="rounded-xl bg-[#594be0] px-3.5 py-1.5 font-bold text-white shadow-xs hover:bg-[#483ad3] transition"
                >
                  Voir l'offre
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

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
                ({recruiterToRemove.email}) de l'entreprise{' '}
                <strong className="text-[#171f33]">{entreprise.nom}</strong> ?
              </p>
              <div className="rounded-2xl bg-[#fff8f8] border border-[#ffe0e0] p-3 text-[11px] text-[#b32b2b] leading-relaxed">
                Ce recruteur ne sera plus rattaché à l'entreprise et ne pourra plus gérer les offres ni les candidatures de {entreprise.nom}.
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRecruiterToRemove(null)}
                className="rounded-xl border border-[#dde1ed] bg-white px-4 py-2 text-xs font-bold text-[#4e566c] hover:bg-[#f8f9fd]"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isRemoving}
                onClick={handleConfirmRemove}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#cf3b3b] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#b52d2d] transition disabled:opacity-60"
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
              <p className="text-[#646e85]">
                Sélectionnez un recruteur parmi les comptes disponibles pour le rattacher directement à {entreprise.nom} :
              </p>

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
                      <span className="text-[11px] font-semibold text-[#8e97ac]">
                        {candRec.entreprise_id ? 'Autre entreprise' : 'Sans entreprise'}
                      </span>
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
                className="rounded-xl border border-[#dde1ed] bg-white px-4 py-2 text-xs font-bold text-[#4e566c] hover:bg-[#f8f9fd]"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={!selectedRecruiterToAttach || isAttaching}
                onClick={handleConfirmAttach}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#594be0] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#483ad3] transition disabled:opacity-50"
              >
                <UserCheck size={14} />
                {isAttaching ? 'Rattachement...' : 'Confirmer le rattachement'}
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
                  <div className="flex items-center gap-2 text-xs text-[#7e879d]">
                    <span>Responsable Recrutement</span>
                    <span>·</span>
                    <span className="font-bold text-[#594be0]">{entreprise.nom}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecruteur(null)}
                className="rounded-xl p-1.5 text-[#8892a7] hover:bg-[#f2f4f8] hover:text-[#171f33]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs">
              <div className="rounded-2xl bg-[#fafbfc] border border-[#eff1f6] p-4 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-[#7c869c] font-medium">Adresse Email :</span>
                  <span className="font-bold text-[#1f283d]">{selectedRecruteur.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7c869c] font-medium">Statut du compte :</span>
                  <span className="rounded-full bg-[#edf9f3] px-2.5 py-0.5 text-[11px] font-bold text-[#248e56]">
                    {selectedRecruteur.statut || 'Actif'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7c869c] font-medium">Entreprise :</span>
                  <span className="font-bold text-[#1f283d]">
                    {entreprise.nom} ({entreprise.ville})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7c869c] font-medium">Dernière activité :</span>
                  <span className="text-[#594be0] font-semibold">
                    {selectedRecruteur.derniere_connexion || 'Aujourd’hui'}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-[#edf0f7] p-4">
                <div className="font-bold text-[#1e2538] mb-2 flex items-center gap-1.5">
                  <BriefcaseBusiness size={14} className="text-[#594be0]" />
                  Offres actives sous sa responsabilité :
                </div>
                <div className="space-y-1.5 text-[#4e566d]">
                  {activeJobs.length > 0 ? (
                    activeJobs.map((j) => (
                      <div
                        key={j.id}
                        className="flex justify-between items-center bg-white p-2 rounded-xl border border-[#f0f2f8]"
                      >
                        <span className="font-semibold">{j.titre}</span>
                        <span className="text-[11px] text-[#8e97ac]">{j.type_contrat}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-[#9ea6bb] italic">Aucune offre active en cours</div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedRecruteur(null)}
                className="rounded-xl bg-[#594be0] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#483ad3] transition"
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
