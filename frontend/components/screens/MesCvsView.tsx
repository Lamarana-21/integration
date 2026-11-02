'use client';

import React, { useState, useRef } from 'react';
import {
  AlertCircle,
  Award,
  Briefcase,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileCheck,
  FileText,
  GraduationCap,
  Languages,
  MapPin,
  Mail,
  Phone,
  Printer,
  Sparkles,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react';
import { Candidat, CV } from '@/lib/types';

interface MesCvsViewProps {
  candidat: Candidat;
  onUploadCv: (file: File) => Promise<{ cv?: CV; error?: string }>;
  onUpdateCvList: (cvs: CV[]) => void;
  onNavigateToProfile: () => void;
}

export function MesCvsView({
  candidat,
  onUploadCv,
  onUpdateCvList,
  onNavigateToProfile,
}: MesCvsViewProps) {
  const [cvList, setCvList] = useState<CV[]>(candidat.cvs || []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // CV Builder states
  const [cvTemplate, setCvTemplate] = useState<'moderne' | 'minimaliste' | 'corporate'>('moderne');
  const [cvAccentColor, setCvAccentColor] = useState<string>('#594be0');
  const [cvCustomTitle, setCvCustomTitle] = useState(
    `CV ${candidat.user?.prenom || 'Amina'} ${candidat.user?.nom || 'Ben Salem'} - ${candidat.titre || 'Développeuse Web'}`
  );
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedCvForPreview, setSelectedCvForPreview] = useState<CV | null>(null);
  const [generatedSuccess, setGeneratedSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gestion du téléversement de fichier
  const processUploadedFile = async (file: File) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Le fichier dépasse la taille maximale autorisée de 5 Mo.');
      return;
    }

    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
      setUploadError('Format de fichier non accepté. Veuillez choisir un document PDF ou DOCX.');
      return;
    }

    setUploadError('');
    setUploading(true);
    const result = await onUploadCv(file);
    setUploading(false);

    if (result.error || !result.cv) {
      setUploadError(result.error || 'Échec du téléversement du document.');
      return;
    }

    const updated = [result.cv, ...cvList];
    setCvList(updated);
    onUpdateCvList(updated);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) processUploadedFile(file);
  };

  // Drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processUploadedFile(file);
  };

  // Génération directe d'un CV en ligne et enregistrement
  const handleGenerateCv = () => {
    const newCv: CV = {
      id: `cv-gen-${Date.now()}`,
      candidat_id: candidat.id,
      nom_fichier: `${cvCustomTitle.trim().replace(/[^a-zA-Z0-9_\-]/g, '_')}.pdf`,
      type_mime: 'application/pdf',
      taille_octets: 1250000,
      url_stockage: '#',
      created_at: new Date().toISOString().split('T')[0],
      est_principal: true,
      est_genere: true,
      template_style: cvTemplate,
    };

    const updated = [newCv, ...cvList.map((c) => ({ ...c, est_principal: false }))];
    setCvList(updated);
    onUpdateCvList(updated);
    setGeneratedSuccess(true);
    setTimeout(() => setGeneratedSuccess(false), 4000);
  };

  // Définir un CV par défaut pour les candidatures
  const handleSetPrincipal = (cvId: string) => {
    const updated = cvList.map((c) => ({ ...c, est_principal: c.id === cvId }));
    setCvList(updated);
    onUpdateCvList(updated);
  };

  // Supprimer un CV
  const handleDeleteCv = (cvId: string) => {
    const updated = cvList.filter((c) => c.id !== cvId);
    setCvList(updated);
    onUpdateCvList(updated);
  };

  // Checklist Qualité ATS
  const atsChecks = [
    { label: 'Nom & Coordonnées de contact', valid: Boolean(candidat.user?.nom && (candidat.telephone || candidat.user?.email)) },
    { label: 'Résumé professionnel ou accroche', valid: Boolean(candidat.resume && candidat.resume.length > 20) },
    { label: 'Au moins 3 compétences clés', valid: (candidat.competences?.length || 0) >= 3 },
    { label: 'Au moins 1 expérience professionnelle', valid: (candidat.experiences?.length || 0) >= 1 },
    { label: 'Au moins 1 formation ou diplôme', valid: (candidat.formations?.length || 0) >= 1 },
  ];
  const atsScore = Math.round((atsChecks.filter((c) => c.valid).length / atsChecks.length) * 100);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      {/* Styles d'impression A4 */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-cv, #printable-cv * { visibility: visible; }
          #printable-cv {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 30px;
            background: white !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* HEADER PRINCIPAL */}
      <div className="rounded-3xl border border-[#e8ebf3] bg-gradient-to-r from-white via-[#fafbfe] to-[#f4f2ff] p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#efedff] px-3 py-0.5 text-[11px] font-extrabold text-[#5547d7]">
                Espace Candidat
              </span>
              <span className="text-xs text-[#828ca1]">
                {cvList.length} document(s) enregistré(s)
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black text-[#171f33]">
              Mes Curriculum Vitae (CV) & Créateur de CV
            </h1>
            <p className="mt-1 text-xs text-[#6e7790]">
              Déposez vos fichiers existants ou concevez un CV optimisé pour les recruteurs directement à partir de vos compétences et expériences.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onNavigateToProfile}
              className="rounded-2xl border border-[#d8dce8] bg-white px-4 py-2.5 text-xs font-bold text-[#424b61] shadow-xs hover:bg-[#f6f7fb] transition"
            >
              ← Voir mon profil
            </button>
            <button
              onClick={() => {
                setSelectedCvForPreview(null);
                setShowPreviewModal(true);
              }}
              className="flex items-center gap-1.5 rounded-2xl bg-[#594be0] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#594be0]/20 hover:bg-[#4739d2] transition"
            >
              <Sparkles size={15} /> Studio CV en direct
            </button>
          </div>
        </div>
      </div>

      {generatedSuccess && (
        <div className="flex items-center gap-3 rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] p-4 text-xs font-bold text-[#166534] shadow-xs">
          <CheckCircle2 size={18} className="text-[#16a34a]" />
          <span>Votre CV a été généré avec succès et défini comme votre CV principal pour vos candidatures !</span>
        </div>
      )}

      {/* GRILLE : 2 COLONNES (STUDIO + MES DOCUMENTS) */}
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* COLONNE GAUCHE: STUDIO & DÉPÔT */}
        <div className="space-y-6">
          {/* STUDIO DE CRÉATION DE CV EN LIGNE */}
          <section className="rounded-3xl border-2 border-[#594be0]/25 bg-white p-6 sm:p-7 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#f0f2f7] pb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#efedff] px-2.5 py-0.5 text-[10px] font-extrabold text-[#5547d7]">
                  <Sparkles size={12} /> Studio de Création ATS
                </span>
                <h2 className="mt-1 text-base font-black text-[#171f33]">
                  Générer un CV moderne à partir de votre profil
                </h2>
                <p className="text-[11px] text-[#717b92]">
                  Injecte instantanément vos coordonnées, compétences, expériences et formations.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCvForPreview(null);
                    setShowPreviewModal(true);
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-[#594be0] bg-white px-3.5 py-2 text-xs font-bold text-[#594be0] hover:bg-[#f6f5ff] transition"
                >
                  <Eye size={14} /> Prévisualiser A4
                </button>
                <button
                  type="button"
                  onClick={handleGenerateCv}
                  className="flex items-center gap-1.5 rounded-xl bg-[#594be0] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#4739d2] transition"
                >
                  <Download size={14} /> Générer & Enregistrer
                </button>
              </div>
            </div>

            {/* OPTIONS DE PERSONNALISATION */}
            <div className="mt-5 grid gap-5 sm:grid-cols-3">
              {/* Choix du Template */}
              <div className="sm:col-span-1">
                <label className="text-xs font-bold text-[#353d52] block mb-2">Modèle de présentation</label>
                <div className="space-y-2">
                  {[
                    { id: 'moderne', label: 'Moderne Tech', desc: 'Structure 2 colonnes avec accent visuel' },
                    { id: 'minimaliste', label: 'Minimaliste', desc: 'Typographie aérée et élégante' },
                    { id: 'corporate', label: 'Corporate', desc: 'Organisation formelle et classique' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setCvTemplate(t.id as any)}
                      className={`w-full rounded-xl border p-2.5 text-left text-xs transition ${
                        cvTemplate === t.id
                          ? 'border-[#594be0] bg-[#f7f5ff] text-[#594be0] font-bold shadow-xs'
                          : 'border-[#e5e8f0] bg-white text-[#474f65] hover:bg-[#fafbfe]'
                      }`}
                    >
                      <div>{t.label}</div>
                      <div className="text-[10px] text-[#868fa4] font-normal">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Couleur & Titre */}
              <div className="sm:col-span-2 space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#353d52] block mb-1.5">
                    Couleur d'accentuation du CV
                  </label>
                  <div className="flex items-center gap-3">
                    {[
                      { color: '#594be0', name: 'Violet Talenta' },
                      { color: '#2563eb', name: 'Bleu Océan' },
                      { color: '#059669', name: 'Vert Émeraude' },
                      { color: '#1e293b', name: 'Ardoise Pro' },
                      { color: '#be123c', name: 'Bordeaux Moderne' },
                    ].map((c) => (
                      <button
                        key={c.color}
                        type="button"
                        onClick={() => setCvAccentColor(c.color)}
                        style={{ backgroundColor: c.color }}
                        className={`size-8 rounded-full border-2 transition ${
                          cvAccentColor === c.color ? 'scale-115 border-white ring-2 ring-[#594be0]' : 'border-white'
                        }`}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#353d52] block mb-1.5">
                    Titre du document exporté
                  </label>
                  <input
                    type="text"
                    value={cvCustomTitle}
                    onChange={(e) => setCvCustomTitle(e.target.value)}
                    className="w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2 text-xs text-[#1e2538] outline-none focus:border-[#594be0] focus:bg-white"
                  />
                </div>

                <div className="rounded-2xl border border-[#edf0f7] bg-[#fafbfc] p-3.5 text-xs text-[#525a70]">
                  <span className="font-bold text-[#1a2133] block mb-1">Synchronisé avec votre profil :</span>
                  <div className="flex flex-wrap gap-2 text-[11px] text-[#636c84]">
                    <span>✓ {candidat.user?.prenom} {candidat.user?.nom}</span>
                    <span>·</span>
                    <span>✓ {candidat.competences?.length || 0} compétences</span>
                    <span>·</span>
                    <span>✓ {candidat.experiences?.length || 0} expériences</span>
                    <span>·</span>
                    <span>✓ {candidat.formations?.length || 0} formations</span>
                    <span>·</span>
                    <span>✓ {candidat.langues?.length || 0} langues</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ZONE DE DÉPÔT / TÉLÉVERSEMENT DE CV */}
          <section className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs">
            <h2 className="text-sm font-extrabold text-[#171f33] flex items-center gap-2 mb-2">
              <Upload size={16} className="text-[#594be0]" /> Déposer un CV existant (PDF ou DOCX)
            </h2>
            <p className="text-[11px] text-[#7d869c] mb-4">
              Glissez-déposez un fichier depuis votre ordinateur ou cliquez pour parcourir. Taille maximale de 5 Mo.
            </p>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition cursor-pointer ${
                dragActive
                  ? 'border-[#594be0] bg-[#f5f3ff]'
                  : 'border-[#d8dce8] bg-[#fafbfc] hover:border-[#594be0] hover:bg-[#faf9fe]'
              }`}
            >
              <div className="grid size-12 place-items-center rounded-2xl bg-white border border-[#e2e5ef] text-[#594be0] shadow-xs mb-3">
                <Upload size={22} className={uploading ? 'animate-bounce' : ''} />
              </div>
              <p className="text-xs font-bold text-[#1e263a]">
                {uploading ? 'Téléversement en cours...' : 'Glissez votre CV ici, ou cliquez pour sélectionner'}
              </p>
              <span className="mt-1 text-[11px] text-[#8690a6]">
                Formats autorisés : PDF ou Word DOCX (5 Mo maximum)
              </span>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={handleFileInputChange}
                disabled={uploading}
              />
            </div>

            {uploadError && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#ffd2d2] bg-[#fff5f5] p-3 text-xs font-bold text-[#cf3b3b]">
                <AlertCircle size={15} /> {uploadError}
              </div>
            )}
          </section>

          {/* LISTE DES CV ENREGISTRÉS */}
          <section className="rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-extrabold text-[#171f33] flex items-center gap-2">
                <FileCheck size={16} className="text-[#594be0]" /> Documents de CV enregistrés ({cvList.length})
              </h2>
              <span className="text-[11px] text-[#7d869e]">Le CV par défaut sera envoyé lors de vos candidatures</span>
            </div>

            <div className="space-y-3">
              {cvList.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#d8dce8] p-8 text-center text-xs text-[#7d869e]">
                  Aucun CV enregistré pour le moment. Utilisez le studio ci-dessus pour en créer un ou déposez votre fichier.
                </div>
              ) : (
                cvList.map((cv) => (
                  <div
                    key={cv.id}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border p-4 text-xs transition ${
                      cv.est_principal ? 'border-[#d7d2fa] bg-[#faf9ff]' : 'border-[#e2e5f0] bg-[#fafbfc]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="grid size-11 place-items-center rounded-xl bg-white border border-[#e2e5f0] text-[#594be0] shadow-xs shrink-0">
                        <FileText size={22} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 font-bold text-[#1f2638]">
                          <span className="truncate max-w-[280px] sm:max-w-[340px]">{cv.nom_fichier}</span>
                          {cv.est_principal && (
                            <span className="rounded-full bg-[#594be0] px-2.5 py-0.5 text-[9px] font-black text-white">
                              Principal
                            </span>
                          )}
                          {cv.est_genere && (
                            <span className="rounded-full bg-[#e0f2fe] px-2 py-0.5 text-[9px] font-extrabold text-[#0369a1]">
                              Généré en ligne
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#838ca0] mt-0.5">
                          {(cv.taille_octets / 1024 / 1024).toFixed(1)} Mo · Déposé le {cv.created_at || 'Aujourd’hui'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      {!cv.est_principal && (
                        <button
                          type="button"
                          onClick={() => handleSetPrincipal(cv.id)}
                          className="rounded-xl border border-[#dde1ee] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#525a6f] hover:border-[#594be0] hover:text-[#594be0] transition"
                        >
                          Définir par défaut
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCvForPreview(cv);
                          setShowPreviewModal(true);
                        }}
                        className="rounded-xl border border-[#dde1ee] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#525a6f] hover:bg-[#fafbfc] transition"
                      >
                        Aperçu
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCv(cv.id)}
                        className="rounded-xl border border-[#ffd5d5] bg-white p-2 text-[#d13a3a] hover:bg-[#fff5f5] transition"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* COLONNE DROITE: CHECKLIST ATS & INFORMATIONS */}
        <aside className="space-y-6">
          {/* Diagnostic & Score ATS */}
          <div className="rounded-3xl border border-[#e8ebf3] bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#636b80]">Score de Qualité ATS</span>
              <span className="text-base font-black text-[#594be0]">{atsScore} %</span>
            </div>

            <div className="h-2.5 w-full rounded-full bg-[#f0f2f7] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#594be0] to-[#10b981] transition-all duration-500 rounded-full"
                style={{ width: `${atsScore}%` }}
              />
            </div>

            <p className="text-[11px] text-[#757f96] leading-relaxed">
              Les recruteurs et les systèmes ATS analysent automatiquement la structure et le contenu textuel de votre CV.
            </p>

            <div className="space-y-2 border-t border-[#f0f2f7] pt-3">
              {atsChecks.map((check, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className={`text-[11px] ${check.valid ? 'text-[#30384d]' : 'text-[#8b95ac]'}`}>
                    {check.label}
                  </span>
                  {check.valid ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#16a34a]">
                      <Check size={12} /> Prêt
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-[#f59e0b]">À compléter</span>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={onNavigateToProfile}
              className="w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] py-2 text-center text-xs font-bold text-[#5547d7] hover:bg-[#f6f5ff] transition"
            >
              Modifier mes informations de profil →
            </button>
          </div>

          {/* Conseils pour un CV percutant */}
          <div className="rounded-3xl border border-[#e3dfff] bg-gradient-to-br from-[#faf9fe] to-[#f4f2ff] p-6 shadow-xs text-xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-[#5547d7]">
              <Sparkles size={16} /> Bonnes pratiques recrutement
            </div>
            <ul className="space-y-2 text-[11px] text-[#5e539d] leading-relaxed">
              <li>• Privilégiez des verbes d'action précis dans vos expériences.</li>
              <li>• Mettez en avant vos compétences techniques clés en tête de document.</li>
              <li>• Utilisez un format PDF épuré pour assurer une lecture fluide sans bugs d'affichage.</li>
              <li>• Conservez un CV à jour avant de postuler à de nouvelles offres.</li>
            </ul>
          </div>
        </aside>
      </div>

      {/* MODAL PRÉVISUALISATION A4 DU CV */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative my-6 w-full max-w-4xl rounded-3xl bg-[#f0f2f7] p-5 shadow-2xl">
            {/* Barre d'action supérieure */}
            <div className="mb-4 flex items-center justify-between rounded-2xl bg-white px-5 py-3 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="text-sm font-extrabold text-[#171f33]">
                  Aperçu du CV ({cvTemplate.toUpperCase()})
                </span>
                <span className="rounded-full bg-[#f0efff] px-2.5 py-0.5 text-[10px] font-bold text-[#5547d7]">
                  Format A4
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-xl bg-[#594be0] px-4 py-2 text-xs font-bold text-white hover:bg-[#4739d2] transition shadow-xs"
                >
                  <Printer size={14} /> Imprimer / Télécharger en PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="grid size-8 place-items-center rounded-xl text-[#828ba2] hover:bg-[#f2f4f8]"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* FEUILLE A4 INTERACTIVE */}
            <div
              id="printable-cv"
              className="mx-auto max-w-[800px] min-h-[920px] bg-white p-10 rounded-2xl shadow-xl text-[#1e2538] font-sans"
            >
              {/* EN-TÊTE DU CV SELON LE MODÈLE */}
              <div className="border-b-4 pb-6" style={{ borderColor: cvAccentColor }}>
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-black tracking-tight" style={{ color: cvAccentColor }}>
                      {candidat.user?.prenom || 'Amina'} {candidat.user?.nom || 'Ben Salem'}
                    </h1>
                    <div className="text-sm font-bold text-[#474f63] mt-1">
                      {candidat.titre || 'Développeuse Web Full Stack'}
                    </div>
                  </div>

                  <div className="text-right text-xs text-[#6e7790] space-y-0.5">
                    <div className="flex items-center justify-end gap-1.5 font-medium">
                      <Mail size={12} /> {candidat.user?.email || 'amina@mail.example'}
                    </div>
                    {candidat.telephone && (
                      <div className="flex items-center justify-end gap-1.5">
                        <Phone size={12} /> {candidat.telephone}
                      </div>
                    )}
                    <div className="flex items-center justify-end gap-1.5">
                      <MapPin size={12} /> {candidat.ville || 'Sfax'}, {candidat.pays || 'Tunisie'}
                    </div>
                  </div>
                </div>
              </div>

              {/* CORPS DU CV */}
              <div className="mt-6 grid grid-cols-3 gap-6 text-xs">
                {/* COLONNE GAUCHE (COMPÉTENCES, LANGUES, COORDONNÉES) */}
                <div className="col-span-1 border-r border-[#edf0f7] pr-4 space-y-5">
                  {/* Compétences */}
                  <div>
                    <h3
                      className="font-extrabold uppercase tracking-wider text-[11px] mb-2.5 flex items-center gap-1.5"
                      style={{ color: cvAccentColor }}
                    >
                      <Award size={13} /> Compétences
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {candidat.competences && candidat.competences.length > 0 ? (
                        candidat.competences.map((c) => (
                          <span
                            key={c}
                            className="rounded-lg bg-[#f4f5f9] px-2 py-1 text-[10px] font-bold text-[#333c52]"
                          >
                            {c}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-[#919bb1]">Aucune compétence renseignée.</span>
                      )}
                    </div>
                  </div>

                  {/* Langues */}
                  <div>
                    <h3
                      className="font-extrabold uppercase tracking-wider text-[11px] mb-2.5 flex items-center gap-1.5"
                      style={{ color: cvAccentColor }}
                    >
                      <Languages size={13} /> Langues
                    </h3>
                    <div className="space-y-1.5 text-[11px] text-[#4d556c]">
                      {candidat.langues && candidat.langues.length > 0 ? (
                        candidat.langues.map((l) => (
                          <div key={l} className="font-medium">
                            {l}
                          </div>
                        ))
                      ) : (
                        <div className="text-[10px] text-[#919bb1]">Français, Anglais</div>
                      )}
                    </div>
                  </div>

                  {/* Liens professionnels */}
                  {(candidat.linkedin_url || candidat.github_url || candidat.portfolio_url) && (
                    <div>
                      <h3
                        className="font-extrabold uppercase tracking-wider text-[11px] mb-2"
                        style={{ color: cvAccentColor }}
                      >
                        Liens
                      </h3>
                      <div className="space-y-1 text-[10px] text-[#555f77] break-all">
                        {candidat.linkedin_url && <div>LinkedIn: {candidat.linkedin_url}</div>}
                        {candidat.github_url && <div>GitHub: {candidat.github_url}</div>}
                        {candidat.portfolio_url && <div>Web: {candidat.portfolio_url}</div>}
                      </div>
                    </div>
                  )}
                </div>

                {/* COLONNE DROITE (RÉSUMÉ, EXPÉRIENCES, FORMATIONS) */}
                <div className="col-span-2 space-y-6">
                  {/* Résumé */}
                  {candidat.resume && (
                    <div>
                      <h3
                        className="font-extrabold uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-1.5"
                        style={{ color: cvAccentColor }}
                      >
                        <User size={13} /> Profil professionnel
                      </h3>
                      <p className="text-[11px] leading-relaxed text-[#4d556c]">{candidat.resume}</p>
                    </div>
                  )}

                  {/* Expériences */}
                  <div>
                    <h3
                      className="font-extrabold uppercase tracking-wider text-[11px] mb-3 flex items-center gap-1.5"
                      style={{ color: cvAccentColor }}
                    >
                      <Briefcase size={13} /> Expériences professionnelles
                    </h3>
                    <div className="space-y-3.5">
                      {candidat.experiences && candidat.experiences.length > 0 ? (
                        candidat.experiences.map((exp, i) => (
                          <div key={i} className="text-[11px]">
                            <div className="font-bold text-[#1a2133] flex justify-between">
                              <span>
                                {exp.poste} · <span className="font-semibold text-[#505971]">{exp.employeur}</span>
                              </span>
                              <span className="text-[#8993a8] font-normal">{exp.dates}</span>
                            </div>
                            {exp.description && (
                              <p className="text-[#596277] mt-1 leading-relaxed">{exp.description}</p>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-[10px] text-[#8fa0b5]">
                          Aucune expérience renseignée dans le profil.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Formations */}
                  <div>
                    <h3
                      className="font-extrabold uppercase tracking-wider text-[11px] mb-3 flex items-center gap-1.5"
                      style={{ color: cvAccentColor }}
                    >
                      <GraduationCap size={13} /> Formations & Diplômes
                    </h3>
                    <div className="space-y-2.5">
                      {candidat.formations && candidat.formations.length > 0 ? (
                        candidat.formations.map((f, i) => (
                          <div key={i} className="text-[11px]">
                            <div className="font-bold text-[#1a2133] flex justify-between">
                              <span>
                                {f.diplome} — <span className="font-semibold text-[#505971]">{f.ecole}</span>
                              </span>
                              <span className="text-[#8993a8] font-normal">{f.annee}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-[10px] text-[#8fa0b5]">
                          Aucune formation renseignée dans le profil.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
