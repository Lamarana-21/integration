'use client';

import React, { useState } from 'react';
import { CheckCircle2, FileText, Sparkles, Upload, X } from 'lucide-react';
import { Candidature, CV, Offre, User } from '@/lib/types';

interface PostulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  offre: Offre | null;
  currentUser: User | null;
  savedCvs: CV[];
  onApplicationSubmit: (data: {
    offreId: string;
    cvId: string;
    lettre: string;
    message: string;
  }) => void;
  hasAlreadyApplied: boolean;
  onGoToMyApplications: () => void;
}

export function PostulerModal({
  isOpen,
  onClose,
  offre,
  currentUser,
  savedCvs,
  onApplicationSubmit,
  hasAlreadyApplied,
  onGoToMyApplications,
}: PostulerModalProps) {
  const [cvChoice, setCvChoice] = useState<'saved' | 'upload'>('saved');
  const [selectedCvId, setSelectedCvId] = useState(savedCvs[0]?.id || '');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [lettreMotivation, setLettreMotivation] = useState('');
  const [message, setMessage] = useState('');
  const [confirmedAccuracy, setConfirmedAccuracy] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !offre) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (hasAlreadyApplied) {
      setError('Vous avez déjà postulé à cette offre (RM2).');
      return;
    }

    if (!confirmedAccuracy) {
      setError('Veuillez confirmer l’exactitude de vos informations.');
      return;
    }

    const cvIdToUse = cvChoice === 'saved' ? selectedCvId : 'cv-uploaded';
    if (!cvIdToUse && savedCvs.length === 0 && !uploadedFileName) {
      setError('Veuillez sélectionner ou téléverser votre CV.');
      return;
    }

    onApplicationSubmit({
      offreId: offre.id,
      cvId: cvIdToUse || savedCvs[0]?.id || 'cv-default',
      lettre: lettreMotivation,
      message,
    });

    setSubmittedSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 grid size-8 place-items-center rounded-full text-[#98a1b6] hover:bg-[#f5f6fa]"
        >
          <X size={18} />
        </button>

        {submittedSuccess ? (
          /* Confirmation Success Screen (E4) */
          <div className="py-6 text-center">
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
              <strong>{offre.entreprise?.nom}</strong> a bien été enregistrée.
              Un e-mail de confirmation vous a été envoyé et l'analyse IA de votre CV a été initiée.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  onClose();
                  onGoToMyApplications();
                }}
                className="flex-1 rounded-2xl bg-[#594be0] py-3 text-xs font-bold text-white shadow-md hover:bg-[#483ad3]"
              >
                Suivre mes candidatures (E5)
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
          /* Main E4 Application Form */
          <div>
            <div className="border-b border-[#f0f2f7] pb-4">
              <span className="rounded-md bg-[#eeeaff] px-2.5 py-0.5 text-[11px] font-bold text-[#5547d7]">
                Dépôt de candidature
              </span>
              <h2 className="mt-2 text-xl font-black text-[#161e31]">
                Postuler : {offre.titre}
              </h2>
              <p className="text-xs text-[#7f889e]">
                {offre.entreprise?.nom} · {offre.lieu}
              </p>
            </div>

            {hasAlreadyApplied && (
              <div className="mt-4 rounded-xl border border-[#ffd2d2] bg-[#fff5f5] p-3 text-xs font-bold text-[#cf3b3b]">
                Vous avez déjà postulé à cette offre (RM2). Une seconde candidature n'est pas autorisée.
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-[#ffd2d2] bg-[#fff5f5] p-3 text-xs font-bold text-[#cf3b3b]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-5">
              {/* 1. CV Selection */}
              <div>
                <label className="text-xs font-extrabold text-[#1a2133]">
                  1. Votre Curriculum Vitae (CV) *
                </label>
                <div className="mt-2 space-y-2 text-xs">
                  {savedCvs.length > 0 && (
                    <label className="flex items-center gap-2.5 rounded-xl border border-[#e4e7f0] bg-[#fafbfc] p-3 cursor-pointer hover:border-[#b8aefb]">
                      <input
                        type="radio"
                        name="cv_choice"
                        checked={cvChoice === 'saved'}
                        onChange={() => setCvChoice('saved')}
                        className="accent-[#594be0]"
                      />
                      <FileText size={16} className="text-[#594be0]" />
                      <div className="flex-1">
                        <span className="font-bold text-[#1a2235]">
                          Utiliser mon CV enregistré :
                        </span>{' '}
                        <span className="text-[#594be0]">{savedCvs[0].nom_fichier}</span>
                      </div>
                    </label>
                  )}

                  <label className="flex items-center gap-2.5 rounded-xl border border-[#e4e7f0] bg-[#fafbfc] p-3 cursor-pointer hover:border-[#b8aefb]">
                    <input
                      type="radio"
                      name="cv_choice"
                      checked={cvChoice === 'upload'}
                      onChange={() => setCvChoice('upload')}
                      className="accent-[#594be0]"
                    />
                    <Upload size={16} className="text-[#656e84]" />
                    <div className="flex-1">
                      <span className="font-bold text-[#1a2235]">
                        Téléverser un nouveau CV
                      </span>
                      <span className="ml-1 text-[11px] text-[#868fa4]">
                        (PDF ou DOCX, 5 Mo max)
                      </span>
                    </div>
                  </label>

                  {cvChoice === 'upload' && (
                    <div className="mt-2 rounded-xl border border-dashed border-[#ccd1df] p-4 text-center">
                      <input
                        type="file"
                        accept=".pdf,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setUploadedFileName(file.name);
                        }}
                        className="text-xs"
                      />
                      {uploadedFileName && (
                        <div className="mt-1 text-xs font-bold text-[#2a945d]">
                          Fichier sélectionné : {uploadedFileName}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Lettre de motivation */}
              <div>
                <label className="text-xs font-extrabold text-[#1a2133]">
                  2. Lettre de motivation (facultatif)
                </label>
                <textarea
                  rows={3}
                  value={lettreMotivation}
                  onChange={(e) => setLettreMotivation(e.target.value)}
                  placeholder="Expliquez brièvement pourquoi ce poste correspond à votre projet professionnel..."
                  className="mt-1.5 w-full rounded-xl border border-[#e1e4ee] bg-[#fafbfc] p-3 text-xs text-[#1e2538] outline-none focus:border-[#6355e8]"
                />
              </div>

              {/* 3. Message au recruteur */}
              <div>
                <label className="text-xs font-extrabold text-[#1a2133]">
                  3. Message au recruteur (facultatif)
                </label>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Disponibilité immédiate, préavis, etc."
                  className="mt-1.5 w-full rounded-xl border border-[#e1e4ee] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1e2538] outline-none focus:border-[#6355e8]"
                />
              </div>

              {/* 4. Confirmation */}
              <label className="flex items-start gap-2.5 cursor-pointer pt-1 text-xs text-[#525a6f]">
                <input
                  type="checkbox"
                  checked={confirmedAccuracy}
                  onChange={(e) => setConfirmedAccuracy(e.target.checked)}
                  className="mt-0.5 size-4 rounded accent-[#594be0]"
                />
                <span className="font-semibold">
                  Je confirme que mes informations sont exactes et autorise l'équipe de recrutement à examiner mon CV.
                </span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-[#e2e5ef] px-4 py-2.5 text-xs font-bold text-[#626a80] hover:bg-[#fafbfc]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={hasAlreadyApplied}
                  className="rounded-xl bg-[#594be0] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#483ad3] disabled:opacity-50"
                >
                  Envoyer ma candidature
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
