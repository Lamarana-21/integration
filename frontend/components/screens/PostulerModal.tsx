'use client';

import React, { useState } from 'react';
import { CheckCircle2, Sparkles, Upload, X } from 'lucide-react';
import { AnalyseCv, Offre, User } from '@/lib/types';

interface PostulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  offre: Offre | null;
  currentUser: User | null;
  onApplicationSubmit: (data: {
    offreId: string;
    file: File;
  }) => Promise<{ analyse?: AnalyseCv; error?: string }>;
  hasAlreadyApplied: boolean;
  onGoToMyApplications: () => void;
}

export function PostulerModal({
  isOpen,
  onClose,
  offre,
  currentUser,
  onApplicationSubmit,
  hasAlreadyApplied,
  onGoToMyApplications,
}: PostulerModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [confirmedAccuracy, setConfirmedAccuracy] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyseCv | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !offre) return null;

  const handleSubmit = async (e: React.FormEvent) => {
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

    if (!selectedFile) {
      setError('Veuillez téléverser votre CV au format PDF ou DOCX.');
      return;
    }

    setSubmitting(true);
    const result = await onApplicationSubmit({ offreId: offre.id, file: selectedFile });
    setSubmitting(false);
    if (result.error || !result.analyse) {
      setError(result.error || 'Le CV n’a pas pu être analysé.');
      return;
    }
    setAnalysis(result.analyse);
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
              Votre CV a été analysé selon les règles ATS.
            </p>

            {analysis && (
              <div className="mt-5 rounded-2xl border border-[#cbeedc] bg-[#edf9f3] p-4 text-left">
                <div className="text-xs font-bold text-[#287e56]">Score ATS</div>
                <div className="mt-1 text-3xl font-black text-[#258957]">
                  {analysis.score_correspondance}/100
                </div>
                <p className="mt-1 text-[11px] text-[#4b7562]">{analysis.resume}</p>
              </div>
            )}

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
              {/* CV upload */}
              <div>
                <label className="text-xs font-extrabold text-[#1a2133]">
                  Votre Curriculum Vitae (CV) *
                </label>
                <label className="mt-2 flex cursor-pointer items-center gap-2.5 rounded-xl border border-dashed border-[#b8aefb] bg-[#fafbfc] p-5 text-xs hover:bg-[#f7f5ff]">
                  <Upload size={18} className="text-[#594be0]" />
                  <div className="flex-1">
                    <span className="font-bold text-[#1a2235]">
                      {selectedFile ? selectedFile.name : 'Télécharger mon CV'}
                    </span>
                    <div className="mt-1 text-[11px] text-[#868fa4]">
                      PDF ou DOCX, 5 Mo maximum · analyse ATS automatique
                    </div>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Confirmation */}
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
                  {submitting ? 'Analyse ATS en cours...' : 'Analyser et envoyer'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
