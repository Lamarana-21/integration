'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  AlertCircle,
  Briefcase,
  Check,
  CheckCircle2,
  Eye,
  FileCheck,
  FileText,
  Sparkles,
  Upload,
  User,
  X,
  Printer,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import {
  AnalyseCv,
  Candidat,
  CV,
  formatFrenchDate,
  isOfferExpired,
  Offre,
  User as UserType,
} from '@/lib/types';

interface PostulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  offre: Offre | null;
  currentUser: UserType | null;
  candidat?: Candidat | null;
  onApplicationSubmit: (data: {
    offreId: string;
    file?: File;
    cv?: CV;
    sourceType: 'DYNAMIQUE' | 'FICHIER_LOCAL' | 'ENREGISTRE';
  }) => Promise<{ analyse?: AnalyseCv; error?: string }>;
  hasAlreadyApplied: boolean;
  onGoToMyApplications: () => void;
  onNavigateToCvStudio?: () => void;
}

export function PostulerModal({
  isOpen,
  onClose,
  offre,
  currentUser,
  candidat,
  onApplicationSubmit,
  hasAlreadyApplied,
  onGoToMyApplications,
  onNavigateToCvStudio,
}: PostulerModalProps) {
  // Choix entre les 2 possibilités
  const [sourceType, setSourceType] = useState<'DYNAMIQUE' | 'FICHIER_LOCAL' | 'ENREGISTRE'>('DYNAMIQUE');

  // Possibilité 1: CV dynamique
  const dynamicCv = candidat?.cvs?.find((c) => c.est_genere);

  // Possibilité 2: Téléversement PC
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Possibilité 3: Autre CV déjà enregistré
  const [selectedRegisteredCvId, setSelectedRegisteredCvId] = useState<string>(
    candidat?.cvs?.find((c) => c.est_principal)?.id || candidat?.cvs?.[0]?.id || ''
  );

  const [confirmedAccuracy, setConfirmedAccuracy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyseCv | null>(null);
  const [submittedCvName, setSubmittedCvName] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialisation du type par défaut
  useEffect(() => {
    if (dynamicCv) {
      setSourceType('DYNAMIQUE');
    } else if (candidat?.cvs && candidat.cvs.length > 0) {
      setSourceType('ENREGISTRE');
    } else {
      setSourceType('FICHIER_LOCAL');
    }
  }, [isOpen, dynamicCv, candidat]);

  if (!isOpen || !offre) return null;

  const isExpired = isOfferExpired(offre.date_limite) || offre.statut === 'CLOTUREE';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isExpired) {
      setError(`La date limite de candidature (${formatFrenchDate(offre.date_limite)}) est dépassée. Les nouvelles candidatures sont closes.`);
      return;
    }

    if (hasAlreadyApplied) {
      setError('Vous avez déjà postulé à cette offre. Une seconde candidature n\'est pas autorisée.');
      return;
    }

    if (!confirmedAccuracy) {
      setError('Veuillez cocher la case confirmant l\'exactitude de vos informations.');
      return;
    }

    if (sourceType === 'FICHIER_LOCAL') {
      if (!selectedFile) {
        setError('Veuillez sélectionner un fichier CV (PDF ou DOCX) depuis votre ordinateur.');
        return;
      }
    }

    setSubmitting(true);

    let submitCv: CV | undefined;
    let cvName = '';

    if (sourceType === 'DYNAMIQUE') {
      submitCv = dynamicCv || {
        id: `cv-dyn-${Date.now()}`,
        candidat_id: candidat?.id || 'cand-current',
        nom_fichier: `CV_Dynamique_${candidat?.user?.prenom || 'Amina'}_${candidat?.user?.nom || 'Ben_Salem'}.pdf`,
        type_mime: 'application/pdf',
        taille_octets: 1250000,
        url_stockage: '#',
        created_at: new Date().toISOString().split('T')[0],
        est_principal: true,
        est_genere: true,
      };
      cvName = submitCv.nom_fichier;
    } else if (sourceType === 'ENREGISTRE') {
      submitCv = candidat?.cvs?.find((c) => c.id === selectedRegisteredCvId);
      cvName = submitCv?.nom_fichier || 'CV Enregistré';
    } else {
      cvName = selectedFile?.name || 'CV importé';
    }

    setSubmittedCvName(cvName);

    const result = await onApplicationSubmit({
      offreId: offre.id,
      file: selectedFile || undefined,
      cv: submitCv,
      sourceType,
    });

    setSubmitting(false);

    if (result.error || !result.analyse) {
      setError(result.error || 'Une erreur est survenue lors du traitement de la candidature.');
      return;
    }

    setAnalysis(result.analyse);
    setSubmittedSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative my-6 w-full max-w-xl rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 grid size-8 place-items-center rounded-full text-[#98a1b6] hover:bg-[#f5f6fa]"
        >
          <X size={18} />
        </button>

        {submittedSuccess ? (
          /* Confirmation Success Screen (E4) */
          <div className="py-6 text-center animate-in fade-in">
            <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-[#edf9f3] text-[#2b965f] border border-[#cbeedc]">
              <CheckCircle2 size={36} />
            </div>
            <span className="mt-4 inline-block rounded-full bg-[#eeeaff] px-3 py-1 text-xs font-bold text-[#5547d7]">
              Statut : Reçue
            </span>
            <h2 className="mt-2 text-2xl font-black text-[#171f33]">
              Candidature transmise avec succès !
            </h2>
            <p className="mt-2 text-xs leading-5 text-[#636b80]">
              Votre candidature pour le poste de <strong>{offre.titre}</strong> chez{' '}
              <strong>{offre.entreprise?.nom}</strong> a bien été enregistrée avec votre{' '}
              <strong>{submittedCvName}</strong>.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  onClose();
                  onGoToMyApplications();
                }}
                className="flex-1 rounded-2xl bg-[#594be0] py-3 text-xs font-bold text-white shadow-md hover:bg-[#483ad3]"
              >
                Suivre mes candidatures
              </button>
              <button
                onClick={onClose}
                className="rounded-2xl border border-[#e2e5ef] py-3 px-5 text-xs font-bold text-[#5e667c] hover:bg-[#fafbfc]"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          /* Formulaire de candidature E4 avec les 2 possibilités */
          <div>
            <div className="border-b border-[#f0f2f7] pb-4">
              <span className="rounded-md bg-[#eeeaff] px-2.5 py-0.5 text-[11px] font-bold text-[#5547d7]">
                Dépôt de candidature
              </span>
              <h2 className="mt-2 text-xl font-black text-[#161e31]">
                Postuler : {offre.titre}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#7f889e]">
                <span className="font-semibold text-[#594be0]">{offre.entreprise?.nom}</span>
                <span>•</span>
                <span>{offre.lieu}</span>
                <span>•</span>
                <span className="font-medium text-[#171f33]">{offre.type_contrat}</span>
                {offre.date_publication && (
                  <>
                    <span>•</span>
                    <span>Publiée le {formatFrenchDate(offre.date_publication)}</span>
                  </>
                )}
                {offre.date_limite && (
                  <>
                    <span>•</span>
                    <span className={isExpired ? 'font-bold text-[#dc2626]' : 'font-medium text-[#171f33]'}>
                      Date limite : {formatFrenchDate(offre.date_limite)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {isExpired && (
              <div className="mt-4 rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-4 text-xs text-[#991b1b] space-y-1">
                <div className="font-extrabold flex items-center gap-1.5 text-sm">
                  <AlertCircle size={16} />
                  <span>Candidatures clôturées</span>
                </div>
                <p>
                  La date limite de dépôt fixée par l'entreprise était le <strong>{formatFrenchDate(offre.date_limite)}</strong>. Les nouvelles candidatures sont closes pour cette offre.
                </p>
              </div>
            )}

            {hasAlreadyApplied && !isExpired && (
              <div className="mt-4 rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] p-4 text-xs text-[#166534] space-y-2">
                <div className="font-extrabold flex items-center gap-1.5 text-sm">
                  <CheckCircle2 size={16} />
                  <span>Candidature déjà transmise</span>
                </div>
                <p>
                  Vous avez déjà envoyé votre candidature pour ce poste. Le système interdit à un candidat de postuler deux fois à la même offre.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onGoToMyApplications();
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#15803d] underline hover:text-[#14532d]"
                >
                  <span>Voir le suivi de ma candidature dans « Mes Candidatures »</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-[#ffd2d2] bg-[#fff5f5] p-3 text-xs font-bold text-[#cf3b3b]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-5">
              {/* SÉLECTEUR DES 2 POSSIBILITÉS */}
              <div>
                <label className="text-xs font-extrabold text-[#1a2133] block mb-2">
                  Choisissez votre CV pour cette candidature :
                </label>

                <div className="space-y-3">
                  {/* POSSIBILITÉ 1 : CV DYNAMIQUE DE L'APPLICATION */}
                  <div
                    onClick={() => setSourceType('DYNAMIQUE')}
                    className={`rounded-2xl border-2 p-4 cursor-pointer transition ${
                      sourceType === 'DYNAMIQUE'
                        ? 'border-[#594be0] bg-[#f8f7ff] shadow-xs'
                        : 'border-[#e3e7f1] bg-white hover:border-[#cfd5e5]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 grid size-5 place-items-center rounded-full border border-[#594be0]">
                        {sourceType === 'DYNAMIQUE' && (
                          <div className="size-2.5 rounded-full bg-[#594be0]" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#192133]">
                            🚀 Utiliser mon CV dynamique de l'application
                          </span>
                          <span className="rounded-full bg-[#efedff] px-2 py-0.5 text-[9px] font-black text-[#5547d7]">
                            Synchronisé
                          </span>
                        </div>

                        <p className="mt-1 text-[11px] text-[#606980] leading-relaxed">
                          Généré en direct à partir de votre profil (
                          <strong>{candidat?.user?.prenom || 'Amina'} {candidat?.user?.nom || 'Ben Salem'}</strong> · {candidat?.titre || 'Développeuse Web'} · {candidat?.competences?.length || 0} compétences).
                        </p>

                        <div className="mt-2.5 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowPreviewModal(true);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#594be0] hover:underline"
                          >
                            <Eye size={12} /> Voir l'aperçu du CV
                          </button>

                          {onNavigateToCvStudio && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigateToCvStudio();
                              }}
                              className="text-[11px] font-medium text-[#7d869e] hover:text-[#594be0] hover:underline"
                            >
                              Modifier dans le Studio CV
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* POSSIBILITÉ 2 : IMPORTER DEPUIS MON PC */}
                  <div
                    onClick={() => setSourceType('FICHIER_LOCAL')}
                    className={`rounded-2xl border-2 p-4 cursor-pointer transition ${
                      sourceType === 'FICHIER_LOCAL'
                        ? 'border-[#594be0] bg-[#f8f7ff] shadow-xs'
                        : 'border-[#e3e7f1] bg-white hover:border-[#cfd5e5]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 grid size-5 place-items-center rounded-full border border-[#594be0]">
                        {sourceType === 'FICHIER_LOCAL' && (
                          <div className="size-2.5 rounded-full bg-[#594be0]" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="text-xs font-bold text-[#192133]">
                          💻 Importer un CV depuis mon ordinateur (PDF / DOCX)
                        </div>
                        <p className="mt-1 text-[11px] text-[#606980]">
                          Téléversez un fichier personnalisé que vous avez déjà conçu.
                        </p>

                        {/* Zone de sélection de fichier */}
                        {sourceType === 'FICHIER_LOCAL' && (
                          <div className="mt-3">
                            <div
                              onClick={() => fileInputRef.current?.click()}
                              className="flex items-center gap-3 rounded-xl border border-dashed border-[#594be0] bg-white p-3 text-xs hover:bg-[#faf9fe] transition"
                            >
                              <Upload size={16} className="text-[#594be0] shrink-0" />
                              <div className="truncate flex-1">
                                <span className="font-bold text-[#1e2539]">
                                  {selectedFile ? selectedFile.name : 'Cliquez pour sélectionner votre fichier'}
                                </span>
                                <div className="text-[10px] text-[#868fa3]">
                                  {selectedFile
                                    ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} Mo`
                                    : 'PDF ou Word DOCX (5 Mo maximum)'}
                                </div>
                              </div>
                            </div>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                              className="hidden"
                              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* POSSIBILITÉ 3 (OPTIONNELLE) : UN CV PRÉCÉDEMMENT ENREGISTRÉ */}
                  {candidat?.cvs && candidat.cvs.filter((c) => !c.est_genere).length > 0 && (
                    <div
                      onClick={() => setSourceType('ENREGISTRE')}
                      className={`rounded-2xl border-2 p-4 cursor-pointer transition ${
                        sourceType === 'ENREGISTRE'
                          ? 'border-[#594be0] bg-[#f8f7ff] shadow-xs'
                          : 'border-[#e3e7f1] bg-white hover:border-[#cfd5e5]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 grid size-5 place-items-center rounded-full border border-[#594be0]">
                          {sourceType === 'ENREGISTRE' && (
                            <div className="size-2.5 rounded-full bg-[#594be0]" />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="text-xs font-bold text-[#192133]">
                            📁 Choisir parmi mes autres CV enregistrés
                          </div>

                          {sourceType === 'ENREGISTRE' && (
                            <div className="mt-2.5 space-y-2">
                              {candidat.cvs
                                .filter((c) => !c.est_genere)
                                .map((c) => (
                                  <label
                                    key={c.id}
                                    className="flex items-center gap-2 text-xs p-2 rounded-xl bg-white border border-[#e2e5ef] cursor-pointer"
                                  >
                                    <input
                                      type="radio"
                                      name="registered_cv"
                                      value={c.id}
                                      checked={selectedRegisteredCvId === c.id}
                                      onChange={() => setSelectedRegisteredCvId(c.id)}
                                      className="accent-[#594be0]"
                                    />
                                    <span className="font-semibold truncate">{c.nom_fichier}</span>
                                  </label>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Confirmation RGPD et exactitude */}
              <label className="flex items-start gap-2.5 cursor-pointer pt-2 text-xs text-[#525a6f]">
                <input
                  type="checkbox"
                  checked={confirmedAccuracy}
                  onChange={(e) => setConfirmedAccuracy(e.target.checked)}
                  className="mt-0.5 size-4 rounded accent-[#594be0]"
                />
                <span className="font-semibold text-[11px] leading-relaxed">
                  Je confirme que mes informations sont exactes et autorise l'équipe de recrutement à examiner mon profil et mon CV.
                </span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#f0f2f7]">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-[#e2e5ef] px-4 py-2.5 text-xs font-bold text-[#626a80] hover:bg-[#fafbfc]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={hasAlreadyApplied || isExpired || submitting}
                  className="rounded-xl bg-[#594be0] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#483ad3] disabled:opacity-50 transition"
                >
                  {isExpired
                    ? 'Candidatures closes'
                    : hasAlreadyApplied
                    ? 'Candidature déjà envoyée'
                    : submitting
                    ? 'Traitement en cours...'
                    : sourceType === 'DYNAMIQUE'
                    ? 'Postuler avec mon CV dynamique'
                    : 'Postuler avec mon fichier importé'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* MODAL APERÇU RAPIDE DU CV DYNAMIQUE DANS LA CANDIDATURE */}
      {showPreviewModal && candidat && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative my-6 w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-sm font-extrabold text-[#171f33] flex items-center gap-2">
                <Sparkles size={16} className="text-[#594be0]" /> Aperçu du CV dynamique transmis
              </span>
              <button onClick={() => setShowPreviewModal(false)} className="text-[#8e98af] hover:text-[#171f33]">
                <X size={18} />
              </button>
            </div>

            <div className="rounded-2xl border border-[#edf0f7] p-6 space-y-4 text-xs bg-[#fafbfc]">
              <div className="flex items-center gap-3 border-b pb-3">
                <div className="size-12 rounded-xl bg-[#594be0] text-white font-black grid place-items-center text-base shrink-0 overflow-hidden">
                  {candidat.avatar_url || candidat.user?.avatar_url ? (
                    <img src={candidat.avatar_url || candidat.user?.avatar_url} alt="Photo" className="size-full object-cover" />
                  ) : (
                    <span>{candidat.user?.prenom?.[0]}{candidat.user?.nom?.[0]}</span>
                  )}
                </div>
                <div>
                  <div className="font-extrabold text-sm text-[#182033]">
                    {candidat.user?.prenom} {candidat.user?.nom}
                  </div>
                  <div className="text-[#594be0] font-semibold text-[11px]">{candidat.titre}</div>
                  <div className="text-[#848ea4] text-[10px]">{candidat.ville}, {candidat.pays} · {candidat.telephone}</div>
                </div>
              </div>

              {candidat.resume && (
                <div>
                  <div className="font-bold text-[#353d52] mb-1">Profil :</div>
                  <p className="text-[11px] text-[#555e73] leading-relaxed">{candidat.resume}</p>
                </div>
              )}

              <div>
                <div className="font-bold text-[#353d52] mb-1.5">Compétences ({candidat.competences?.length || 0}) :</div>
                <div className="flex flex-wrap gap-1">
                  {candidat.competences?.map((c) => (
                    <span key={c} className="rounded-lg bg-[#efedff] px-2 py-0.5 text-[10px] font-bold text-[#5547d7]">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="font-bold text-[#353d52] mb-1.5">Dernières expériences :</div>
                <div className="space-y-1.5">
                  {candidat.experiences?.slice(0, 2).map((exp, i) => (
                    <div key={i} className="text-[11px] bg-white p-2 rounded-xl border border-[#e8ebf3]">
                      <div className="font-bold text-[#1f273b]">{exp.poste} — {exp.employeur}</div>
                      <div className="text-[10px] text-[#868fa3]">{exp.dates}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="rounded-xl bg-[#594be0] px-5 py-2 text-xs font-bold text-white hover:bg-[#4739d2]"
              >
                Fermer l'aperçu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
