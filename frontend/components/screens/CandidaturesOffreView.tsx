'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Globe,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Search,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react';
import { ApplicationStatus, CV, Candidature, Offre, formatFrenchDate } from '@/lib/types';

interface CandidaturesOffreViewProps {
  offres: Offre[];
  candidatures: Candidature[];
  onOpenDetail: (candidature: Candidature) => void;
  onBulkUpdateStatus: (ids: string[], newStatus: ApplicationStatus) => void;
}

/**
 * Récupère le CV exact déposé par le candidat (depuis la candidature ou le cache local)
 */
export function resolveDepositedCv(cand: Candidature): CV | undefined {
  let cv = cand.cv;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('talenta_deposited_cvs_v2');
      if (raw) {
        const map: Record<string, CV> = JSON.parse(raw);
        const userId = cand.candidat?.utilisateur_id || cand.candidat?.user?.id || '';
        const cached =
          map[cand.id] ||
          (cand.cv_id ? map[cand.cv_id] : undefined) ||
          (cv?.id ? map[cv.id] : undefined) ||
          map[`${cand.candidat_id}_${cand.offre_id}`] ||
          (userId ? map[`${userId}_${cand.offre_id}`] : undefined);
        if (cached) {
          cv = {
            ...(cv || {}),
            ...cached,
            contenu_base64: cached.contenu_base64 || cv?.contenu_base64,
            url_stockage: cached.url_stockage || cv?.url_stockage || '',
          };
        }
      }
    } catch {}
  }
  return cv;
}

/**
 * Vérifie si le CV déposé contient un vrai fichier PDF binaire téléversé par le candidat
 * (les CV factices de seed font 44 caractères en base64, un vrai PDF fait > 200 caractères)
 */
export function hasRealUploadedPdf(cv?: CV): boolean {
  if (!cv) return false;
  if (cv.contenu_base64 && cv.contenu_base64.length > 200) return true;
  if (
    cv.url_stockage &&
    (cv.url_stockage.startsWith('data:application/pdf') ||
      cv.url_stockage.startsWith('blob:') ||
      cv.url_stockage.startsWith('http'))
  ) {
    return true;
  }
  return false;
}

/**
 * Crée une URL Blob exploitable par un <iframe> ou un téléchargement direct à partir du CV déposé
 */
export function createPdfBlobUrlFromCv(cv?: CV): string | null {
  if (!cv) return null;
  try {
    if (cv.contenu_base64 && cv.contenu_base64.length > 200) {
      const cleanBase64 = cv.contenu_base64.includes(',')
        ? cv.contenu_base64.split(',')[1]
        : cv.contenu_base64;
      const byteCharacters = atob(cleanBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    }
    if (cv.url_stockage && cv.url_stockage.startsWith('data:application/pdf')) {
      const base64Part = cv.url_stockage.split(',')[1];
      if (base64Part) {
        const byteCharacters = atob(base64Part);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        return URL.createObjectURL(blob);
      }
    }
    if (
      cv.url_stockage &&
      (cv.url_stockage.startsWith('blob:') || cv.url_stockage.startsWith('http'))
    ) {
      return cv.url_stockage;
    }
  } catch (e) {
    console.warn('Erreur conversion PDF base64:', e);
  }
  return null;
}

/**
 * Télécharge le CV tel qu'il a été déposé par le candidat :
 * - Téléchargement direct du binaire .pdf si c'est un fichier importé
 * - Impression / Enregistrement PDF fidèle au modèle choisi si c'est un CV dynamique
 */
export function downloadCandidateCvFile(cand: Candidature) {
  const cv = resolveDepositedCv(cand);
  const candUser = cand.candidat?.user;
  const prenom = cand.candidat?.prenom || candUser?.prenom || 'Candidat';
  const nom = cand.candidat?.nom || candUser?.nom || 'Talenta';
  const fullName = `${prenom} ${nom}`.trim();
  const safeFileName = (cv?.nom_fichier || `CV_${prenom}_${nom}.pdf`).replace(/\s+/g, '_');

  // 1. Si le candidat a déposé un vrai fichier PDF, on télécharge exactement son fichier PDF
  const pdfBlobUrl = createPdfBlobUrlFromCv(cv);
  if (pdfBlobUrl) {
    const a = document.createElement('a');
    a.href = pdfBlobUrl;
    a.download = safeFileName.endsWith('.pdf') ? safeFileName : `${safeFileName}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // 2. Sinon (CV Dynamique ou CV profil), export PDF fidèle à la configuration déposée
  const cfg = cv?.cv_config;
  const accentColor = cfg?.accent_color || '#4f46e5';
  const titre = cfg?.titre_poste || cand.candidat?.titre || 'Candidat Professionnel';
  const resume =
    cfg?.resume ||
    cand.candidat?.resume ||
    'Professionnel qualifié disposant d’une solide maîtrise technique et méthodologique.';
  const competences = (
    cfg?.competences ||
    cand.candidat?.competences ||
    cand.analyse?.infos_extraites?.competences ||
    []
  ).join(' • ');
  const experiences = (cfg?.experiences || cand.candidat?.experiences || [])
    .map(
      (e) => `
      <div style="margin-bottom:14px;padding-left:12px;border-left:3px solid ${accentColor};">
        <div style="display:flex;justify-content:space-between;font-weight:700;color:#0f172a;font-size:13px;">
          <span>${e.poste} — ${e.employeur}</span>
          <span style="color:#64748b;font-size:12px;">${e.dates}</span>
        </div>
        <p style="margin:4px 0 0;color:#334155;font-size:12px;line-height:1.5;">${e.description || ''}</p>
      </div>`
    )
    .join('');

  const formations = (cand.candidat?.formations || [])
    .map(
      (f) => `
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:12.5px;">
        <div><strong>${f.diplome}</strong> · ${f.ecole}</div>
        <span style="color:#64748b;font-weight:600;">${f.annee}</span>
      </div>`
    )
    .join('');

  const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>${safeFileName} - ${fullName}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #0f172a; margin: 0; padding: 28px; background: #f8fafc; }
    .page { max-width: 780px; margin: 0 auto; background: #ffffff; padding: 40px 48px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .header { border-bottom: 3px solid ${accentColor}; padding-bottom: 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
    .name { font-size: 26px; font-weight: 800; color: #0f172a; margin: 0; }
    .title { font-size: 14px; font-weight: 700; color: ${accentColor}; margin-top: 4px; }
    .meta { font-size: 12px; color: #475569; margin-top: 8px; }
    .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: ${accentColor}; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin: 20px 0 12px; }
    @media print { body { background: #fff; padding: 0; } .page { border: none; padding: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="max-width:780px;margin:0 auto 16px;display:flex;justify-content:space-between;align-items:center;background:#0f172a;color:#fff;padding:12px 20px;border-radius:8px;">
    <span style="font-size:13px;font-weight:700;">CV déposé : ${safeFileName}</span>
    <button onclick="window.print()" style="background:${accentColor};color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:700;cursor:pointer;">Enregistrer en PDF / Imprimer</button>
  </div>
  <div class="page">
    <div class="header">
      <div>
        <h1 class="name">${fullName}</h1>
        <div class="title">${titre}</div>
        <div class="meta">
          ${candUser?.email || ''} ${cand.candidat?.telephone ? ` • ${cand.candidat.telephone}` : ''} • ${cand.candidat?.ville || 'Tunisie'}
        </div>
      </div>
    </div>
    <div class="section-title">Profil Professionnel</div>
    <p style="font-size:12.5px;line-height:1.6;color:#334155;margin:0;">${resume}</p>
    <div class="section-title">Compétences</div>
    <p style="font-size:12.5px;font-weight:700;color:#1e293b;margin:0;">${competences || 'React • Node.js • TypeScript • SQL'}</p>
    <div class="section-title">Expériences Professionnelles</div>
    ${experiences || '<p style="font-size:12px;color:#64748b;">Aucune expérience renseignée.</p>'}
    <div class="section-title">Formations & Diplômes</div>
    ${formations || '<p style="font-size:12px;color:#64748b;">Aucune formation renseignée.</p>'}
    <div class="section-title">Langues & Disponibilité</div>
    <p style="font-size:12px;color:#334155;margin:0;">
      <strong>Langues :</strong> ${(cand.candidat?.langues || ['Français', 'Anglais']).join(', ')} &nbsp;|&nbsp;
      <strong>Disponibilité :</strong> ${cand.candidat?.disponibilite || 'Immédiate'}
    </p>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

/**
 * Composant réutilisable qui affiche le CV EXACT tel qu'il a été déposé par le candidat :
 * - Soit le vrai fichier PDF téléversé dans un lecteur PDF intégré
 * - Soit le modèle exact du CV Dynamique (moderne, corporate, minimaliste, créatif) avec ses couleurs et sections
 */
export function DepositedCvRenderer({
  candidature,
  zoom = 100,
}: {
  candidature: Candidature;
  zoom?: number;
}) {
  const cv = resolveDepositedCv(candidature);
  const candidat = candidature.candidat;
  const user = candidat?.user;
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = createPdfBlobUrlFromCv(cv);
    setPdfBlobUrl(url);
    return () => {
      if (url && url.startsWith('blob:') && url !== cv?.url_stockage) {
        URL.revokeObjectURL(url);
      }
    };
  }, [cv?.id, cv?.contenu_base64, cv?.url_stockage]);

  // 1. Si le candidat a importé un vrai fichier PDF depuis son poste
  if (pdfBlobUrl) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#e2e8f0] bg-white px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2 font-bold text-[#0f172a]">
            <FileText size={15} className="text-[#4f46e5]" />
            <span>Fichier PDF original déposé par le candidat : {cv?.nom_fichier}</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={pdfBlobUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-[#cbd5e1] bg-white px-2.5 py-1 text-[11px] font-bold text-[#334155] hover:bg-[#f8fafc]"
            >
              <ExternalLink size={12} /> Ouvrir dans un onglet
            </a>
            <button
              type="button"
              onClick={() => downloadCandidateCvFile(candidature)}
              className="inline-flex items-center gap-1 rounded-lg bg-[#4f46e5] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#4338ca]"
            >
              <Download size={12} /> Télécharger le PDF
            </button>
          </div>
        </div>
        <iframe
          src={pdfBlobUrl}
          title={cv?.nom_fichier || 'CV PDF Candidat'}
          className="h-[740px] w-full rounded-xl border border-[#cbd5e1] bg-white shadow-sm"
        />
      </div>
    );
  }

  // 2. Sinon : Rendu fidèle du CV Dynamique (ou CV profil) tel que configuré et déposé par le candidat
  const prenom = candidat?.prenom || user?.prenom || 'Prénom';
  const nom = candidat?.nom || user?.nom || 'Nom';
  const style = cv?.template_style || 'moderne';
  const cfg = cv?.cv_config;
  const accentColor = cfg?.accent_color || '#4f46e5';
  const fontClass = 'font-sans';

  const displayTitle = cfg?.titre_poste || candidat?.titre || 'Ingénieur / Développeur Fullstack';
  const displayPitch =
    cfg?.resume ||
    candidat?.resume ||
    'Professionnel passionné avec une solide expérience dans la conception et le développement de solutions numériques performantes.';
  const showExp = true;
  const showForm = true;
  const showSkills = true;
  const showLangs = cfg?.show_disponibilite !== false;
  const showLinks = cfg?.show_links !== false;

  const skills =
    cfg?.competences ||
    candidat?.competences ||
    candidature.analyse?.infos_extraites?.competences ||
    [];
  const experiences = cfg?.experiences || candidat?.experiences || [];
  const formations = cfg?.formations || candidat?.formations || [];
  const langues = cfg?.langues || candidat?.langues || ['Français', 'Anglais'];

  return (
    <div
      className={`mx-auto max-w-[780px] rounded-xl border border-[#cbd5e1] bg-white shadow-sm transition-transform origin-top text-[#0f172a] overflow-hidden ${fontClass}`}
      style={{
        transform: `scale(${zoom / 100})`,
        marginBottom: zoom > 100 ? `${(zoom - 100) * 4}px` : '0px',
      }}
    >
      {/* En-tête selon le template choisi par le candidat */}
      {style === 'corporate' ? (
        <div className="border-b-4 px-8 py-7 bg-[#f8fafc]" style={{ borderColor: accentColor }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-wide text-[#0f172a]">
                {prenom} {nom}
              </h2>
              <div className="text-sm font-bold mt-1" style={{ color: accentColor }}>
                {displayTitle}
              </div>
            </div>
            <div className="text-xs text-[#475569] space-y-1 sm:text-right">
              <div>{user?.email}</div>
              {candidat?.telephone && <div>{candidat.telephone}</div>}
              <div>{candidat?.ville || 'Tunisie'}</div>
            </div>
          </div>
        </div>
      ) : style === 'minimaliste' ? (
        <div className="border-b border-[#e2e8f0] px-8 py-7 text-center">
          <h2 className="text-2xl font-black tracking-tight text-[#0f172a]">
            {prenom} {nom}
          </h2>
          <div className="text-sm font-semibold mt-1" style={{ color: accentColor }}>
            {displayTitle}
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-[#64748b]">
            <span>{user?.email}</span>
            {candidat?.telephone && <span>• {candidat.telephone}</span>}
            <span>• {candidat?.ville || 'Tunisie'}</span>
          </div>
        </div>
      ) : (
        <div
          className="px-8 py-7 text-white"
          style={{
            background: `linear-gradient(135deg, #0f172a 0%, ${accentColor} 100%)`,
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-white/15 border border-white/25 text-lg font-black text-white">
                {prenom[0]}
                {nom[0]}
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight">
                  {prenom} {nom}
                </h2>
                <div className="text-sm font-semibold text-white/90 mt-0.5">{displayTitle}</div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/80">
                  <span className="flex items-center gap-1">
                    <Mail size={12} /> {user?.email}
                  </span>
                  {candidat?.telephone && (
                    <span className="flex items-center gap-1">
                      <Phone size={12} /> {candidat.telephone}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {candidat?.ville || 'Tunisie'}
                  </span>
                </div>
              </div>
            </div>

            {showLinks && (
              <div className="flex flex-wrap gap-1.5 sm:flex-col sm:items-end text-[11px]">
                {candidat?.linkedin_url && (
                  <a
                    href={candidat.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2.5 py-1 text-white hover:bg-white/20"
                  >
                    <Globe size={11} /> LinkedIn
                  </a>
                )}
                {candidat?.github_url && (
                  <a
                    href={candidat.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2.5 py-1 text-white hover:bg-white/20"
                  >
                    <Globe size={11} /> GitHub
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Corps du CV */}
      <div className="p-8 space-y-6">
        {/* Profil / Résumé */}
        <div>
          <h3
            className="text-[11px] font-black uppercase tracking-wider border-b border-[#e2e8f0] pb-1.5 mb-2.5"
            style={{ color: accentColor }}
          >
            Profil Professionnel
          </h3>
          <p className="text-xs leading-relaxed text-[#334155]">{displayPitch}</p>
        </div>

        {/* Compétences */}
        {showSkills && (
          <div>
            <h3
              className="text-[11px] font-black uppercase tracking-wider border-b border-[#e2e8f0] pb-1.5 mb-3"
              style={{ color: accentColor }}
            >
              Compétences Techniques & Métier
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1 text-xs font-bold text-[#1e293b]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Expériences */}
        {showExp && (
          <div>
            <h3
              className="text-[11px] font-black uppercase tracking-wider border-b border-[#e2e8f0] pb-1.5 mb-3 flex items-center gap-1.5"
              style={{ color: accentColor }}
            >
              <Briefcase size={13} /> Expériences Professionnelles
            </h3>
            <div className="space-y-4">
              {experiences.length > 0 ? (
                experiences.map((exp, i) => (
                  <div
                    key={i}
                    className="relative pl-4 border-l-2"
                    style={{ borderColor: accentColor }}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="text-xs font-extrabold text-[#0f172a]">
                        {exp.poste} <span className="text-[#475569] font-semibold">— {exp.employeur}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-[#64748b]">{exp.dates}</span>
                    </div>
                    {exp.description && (
                      <p className="mt-1 text-xs text-[#475569] leading-relaxed">{exp.description}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#64748b] italic">Aucune expérience renseignée.</p>
              )}
            </div>
          </div>
        )}

        {/* Formations */}
        {showForm && (
          <div>
            <h3
              className="text-[11px] font-black uppercase tracking-wider border-b border-[#e2e8f0] pb-1.5 mb-3 flex items-center gap-1.5"
              style={{ color: accentColor }}
            >
              <GraduationCap size={13} /> Formations & Diplômes
            </h3>
            <div className="space-y-2.5">
              {formations.length > 0 ? (
                formations.map((form, i) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3.5 py-2.5"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#0f172a]">{form.diplome}</div>
                      <div className="text-[11px] text-[#64748b]">{form.ecole}</div>
                    </div>
                    <span className="text-xs font-bold" style={{ color: accentColor }}>
                      {form.annee}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#64748b] italic">Aucune formation renseignée.</p>
              )}
            </div>
          </div>
        )}

        {/* Langues & Disponibilité */}
        {showLangs && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 border-t border-[#e2e8f0]">
            <div>
              <span className="text-[10px] font-bold uppercase text-[#64748b]">Langues parlées</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {langues.map((l, i) => (
                  <span
                    key={i}
                    className="rounded-md bg-[#f1f5f9] px-2.5 py-0.5 text-xs font-semibold text-[#334155]"
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-[#64748b]">Disponibilité</span>
              <div className="mt-1 text-xs font-bold text-[#0f172a]">
                {candidat?.disponibilite || 'Immédiate'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function CandidaturesOffreView({
  offres,
  candidatures,
  onOpenDetail,
  onBulkUpdateStatus,
}: CandidaturesOffreViewProps) {
  const [selectedOffreId, setSelectedOffreId] = useState<string>('ALL');
  const [filterStatut, setFilterStatut] = useState<string>('TOUS');
  const [search, setSearch] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [quickViewCand, setQuickViewCand] = useState<Candidature | null>(null);
  const [aiModalCand, setAiModalCand] = useState<Candidature | null>(null);

  const scopedByOffre = useMemo(() => {
    if (selectedOffreId === 'ALL') return candidatures;
    return candidatures.filter((c) => c.offre_id === selectedOffreId);
  }, [candidatures, selectedOffreId]);

  const filteredCandidatures = useMemo(() => {
    const list = scopedByOffre.filter((c) => {
      if (filterStatut !== 'TOUS' && c.statut !== filterStatut) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const nom = (c.candidat?.nom || c.candidat?.user?.nom || '').toLowerCase();
        const prenom = (c.candidat?.prenom || c.candidat?.user?.prenom || '').toLowerCase();
        const email = (c.candidat?.user?.email || '').toLowerCase();
        const titreOffre = (c.offre?.titre || '').toLowerCase();
        if (!nom.includes(q) && !prenom.includes(q) && !email.includes(q) && !titreOffre.includes(q))
          return false;
      }
      return true;
    });

    return [...list].sort(
      (a, b) => (b.analyse?.score_correspondance || 0) - (a.analyse?.score_correspondance || 0)
    );
  }, [scopedByOffre, filterStatut, search]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCandidatures.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCandidatures.map((c) => c.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkAction = (status: ApplicationStatus) => {
    if (selectedIds.length === 0) return;
    onBulkUpdateStatus(selectedIds, status);
    setSelectedIds([]);
  };

  const getStatusBadge = (statut: ApplicationStatus) => {
    switch (statut) {
      case 'RECUE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#f1f5f9] px-2.5 py-1 text-[11px] font-bold text-[#475569]">
            <Clock size={12} /> Reçue
          </span>
        );
      case 'EN_EXAMEN':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#eff6ff] px-2.5 py-1 text-[11px] font-bold text-[#2563eb]">
            <Eye size={12} /> En examen
          </span>
        );
      case 'PRESELECTIONNEE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#eef2ff] px-2.5 py-1 text-[11px] font-bold text-[#4f46e5]">
            <Sparkles size={12} /> Présélectionnée
          </span>
        );
      case 'ENTRETIEN':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fffbeb] px-2.5 py-1 text-[11px] font-bold text-[#d97706]">
            <Calendar size={12} /> Entretien
          </span>
        );
      case 'ACCEPTEE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf5] px-2.5 py-1 text-[11px] font-bold text-[#059669]">
            <CheckCircle2 size={12} /> Retenue
          </span>
        );
      case 'REFUSEE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fef2f2] px-2.5 py-1 text-[11px] font-bold text-[#dc2626]">
            <XCircle size={12} /> Refusée
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      {/* EN-TÊTE SIMPLE ET ÉPURÉ (SANS STATISTIQUES) */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-2xs">
        <div>
          <h1 className="text-xl font-black text-[#0f172a] sm:text-2xl">
            Candidatures & Évaluation des Dossiers
          </h1>
          <p className="mt-1 text-xs text-[#64748b]">
            Consultez les CV tels qu'ils ont été déposés par les candidats, téléchargez-les et prenez vos décisions de recrutement.
          </p>
        </div>

        {/* Sélecteur d'offre sobre */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-[#475569] shrink-0">Offre :</label>
          <select
            value={selectedOffreId}
            onChange={(e) => setSelectedOffreId(e.target.value)}
            className="rounded-xl border border-[#cbd5e1] bg-[#f8fafc] px-3.5 py-2 text-xs font-bold text-[#0f172a] outline-none focus:border-[#4f46e5]"
          >
            <option value="ALL">Toutes les offres ({candidatures.length})</option>
            {offres.map((o) => {
              const count = candidatures.filter((c) => c.offre_id === o.id).length;
              return (
                <option key={o.id} value={o.id}>
                  {o.titre} ({count})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* BARRE DE RECHERCHE ET FILTRE PAR STATUT */}
      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-2xs sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un candidat par nom, e-mail ou poste..."
            className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] py-2 pl-9 pr-3 text-xs font-medium text-[#0f172a] outline-none focus:border-[#4f46e5] focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'TOUS', label: 'Tous' },
              { id: 'RECUE', label: 'Reçues' },
              { id: 'EN_EXAMEN', label: 'En examen' },
              { id: 'PRESELECTIONNEE', label: 'Présélection' },
              { id: 'ENTRETIEN', label: 'Entretien' },
              { id: 'ACCEPTEE', label: 'Retenues' },
              { id: 'REFUSEE', label: 'Refusées' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatut(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                filterStatut === tab.id
                  ? 'bg-[#4f46e5] text-white'
                  : 'bg-[#f8fafc] text-[#475569] hover:bg-[#f1f5f9]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* BARRE D'ACTIONS GROUPÉES */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#0f172a] px-5 py-3 text-white shadow-md">
          <span className="text-xs font-bold">
            {selectedIds.length} candidature(s) sélectionnée(s)
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleBulkAction('EN_EXAMEN')}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold hover:bg-white/20"
            >
              Passer en examen
            </button>
            <button
              type="button"
              onClick={() => handleBulkAction('ENTRETIEN')}
              className="rounded-lg bg-[#d97706] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#b45309]"
            >
              Convoquer en entretien
            </button>
            <button
              type="button"
              onClick={() => handleBulkAction('ACCEPTEE')}
              className="rounded-lg bg-[#16a34a] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#15803d]"
            >
              Accepter
            </button>
            <button
              type="button"
              onClick={() => handleBulkAction('REFUSEE')}
              className="rounded-lg bg-[#dc2626] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#b91c1c]"
            >
              Refuser
            </button>
          </div>
        </div>
      )}

      {/* TABLEAU PROPRE ET ÉPURÉ DES CANDIDATURES */}
      <div className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#e2e8f0] bg-[#f8fafc] text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
              <tr>
                <th className="py-3.5 pl-5 pr-2 w-9">
                  <input
                    type="checkbox"
                    checked={
                      filteredCandidatures.length > 0 &&
                      selectedIds.length === filteredCandidatures.length
                    }
                    onChange={toggleSelectAll}
                    className="size-4 rounded border-[#cbd5e1] accent-[#4f46e5] cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3.5">Candidat</th>
                <th className="px-4 py-3.5">Poste visé</th>
                <th className="px-4 py-3.5">CV déposé</th>
                <th className="px-4 py-3.5">Analyse IA</th>
                <th className="px-4 py-3.5">Statut</th>
                <th className="py-3.5 pl-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#f1f5f9]">
              {filteredCandidatures.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-sm font-semibold text-[#64748b]">
                    Aucune candidature ne correspond à vos critères.
                  </td>
                </tr>
              ) : (
                filteredCandidatures.map((c) => {
                  const candUser = c.candidat?.user;
                  const prenom = c.candidat?.prenom || candUser?.prenom || 'Candidat';
                  const nom = c.candidat?.nom || candUser?.nom || '';
                  const resolvedCv = resolveDepositedCv(c);
                  const isRealUploaded = hasRealUploadedPdf(resolvedCv);
                  const isDynamic =
                    !isRealUploaded &&
                    (resolvedCv?.source_type === 'DYNAMIQUE' ||
                      resolvedCv?.est_genere ||
                      resolvedCv?.nom_fichier?.includes('Dynamique'));
                  const score = c.analyse?.score_correspondance || 78;

                  return (
                    <tr key={c.id} className="hover:bg-[#f8fafc] transition">
                      <td className="py-4 pl-5 pr-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(c.id)}
                          onChange={() => toggleSelectOne(c.id)}
                          className="size-4 rounded border-[#cbd5e1] accent-[#4f46e5] cursor-pointer"
                        />
                      </td>

                      {/* Candidat */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#eef2ff] text-xs font-extrabold text-[#4f46e5]">
                            {prenom[0]}
                            {nom[0] || ''}
                          </div>
                          <div>
                            <div className="font-bold text-[#0f172a] text-sm">
                              {prenom} {nom}
                            </div>
                            <div className="text-[11px] text-[#64748b]">
                              {candUser?.email || 'candidat@talenta.tn'} •{' '}
                              {formatFrenchDate(c.created_at)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Poste */}
                      <td className="px-4 py-4">
                        <div className="font-bold text-[#1e293b]">
                          {c.offre?.titre || 'Offre Talenta'}
                        </div>
                        <div className="text-[11px] text-[#64748b]">
                          {c.offre?.type_contrat || 'CDI'} • {c.offre?.lieu || 'Tunis'}
                        </div>
                      </td>

                      {/* CV Déposé */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setQuickViewCand(c)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1.5 text-xs font-bold text-[#334155] hover:border-[#4f46e5] hover:text-[#4f46e5] transition"
                            title="Aperçu du CV tel que déposé"
                          >
                            {isDynamic ? (
                              <FileCheck size={14} className="text-[#4f46e5]" />
                            ) : (
                              <FileText size={14} className="text-[#0284c7]" />
                            )}
                            <span className="max-w-[150px] truncate">
                              {resolvedCv?.nom_fichier || `CV_${prenom}.pdf`}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadCandidateCvFile(c)}
                            className="grid size-7 place-items-center rounded-lg border border-[#e2e8f0] text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                            title="Télécharger le CV"
                          >
                            <Download size={13} />
                          </button>
                        </div>
                      </td>

                      {/* Analyse IA en arrière-plan */}
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => setAiModalCand(c)}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition ${
                            score >= 80
                              ? 'border-[#bbf7d0] bg-[#ecfdf5] text-[#059669] hover:bg-[#d1fae5]'
                              : score >= 65
                              ? 'border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb] hover:bg-[#dbeafe]'
                              : 'border-[#fde68a] bg-[#fffbeb] text-[#d97706] hover:bg-[#fef3c7]'
                          }`}
                        >
                          <Sparkles size={13} />
                          <span>Voir analyse IA ({score}%)</span>
                        </button>
                      </td>

                      {/* Statut */}
                      <td className="px-4 py-4">{getStatusBadge(c.statut)}</td>

                      {/* Actions */}
                      <td className="py-4 pl-4 pr-6 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setQuickViewCand(c)}
                            className="rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs font-bold text-[#334155] hover:bg-[#f8fafc]"
                          >
                            Voir CV
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenDetail(c)}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#4f46e5] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#4338ca] transition"
                          >
                            <span>Évaluer</span>
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALE D'APERÇU DIRECT DU CV TEL QUE DÉPOSÉ */}
      {quickViewCand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-[#f1f5f9] shadow-2xl border border-[#cbd5e1]">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0f172a] px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-[#818cf8]" />
                <div>
                  <div className="text-sm font-bold">
                    {resolveDepositedCv(quickViewCand)?.nom_fichier || 'CV du candidat'}
                  </div>
                  <div className="text-[11px] text-white/70">
                    Candidat : {quickViewCand.candidat?.prenom} {quickViewCand.candidat?.nom} • Poste :{' '}
                    {quickViewCand.offre?.titre}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadCandidateCvFile(quickViewCand)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20"
                >
                  <Download size={14} /> Télécharger
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = quickViewCand;
                    setQuickViewCand(null);
                    onOpenDetail(target);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#4f46e5] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#4338ca]"
                >
                  Passer à l'évaluation
                </button>
                <button
                  type="button"
                  onClick={() => setQuickViewCand(null)}
                  className="rounded-lg bg-white/10 p-1.5 text-white hover:bg-white/20"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <DepositedCvRenderer candidature={quickViewCand} />
            </div>
          </div>
        </div>
      )}

      {/* MODALE RÉSULTAT DE L'ANALYSE IA (CALCULÉE EN ARRIÈRE-PLAN) */}
      {aiModalCand && (() => {
        const score = aiModalCand.analyse?.score_correspondance || 78;
        const reqSkills = aiModalCand.offre?.competences_requises || ['React', 'Node.js', 'SQL'];
        const candSkills =
          aiModalCand.candidat?.competences ||
          aiModalCand.analyse?.infos_extraites?.competences ||
          [];
        const matched = reqSkills.filter((r) =>
          candSkills.some(
            (cs) =>
              cs.toLowerCase().includes(r.toLowerCase()) ||
              r.toLowerCase().includes(cs.toLowerCase())
          )
        );
        const missing = reqSkills.filter((r) => !matched.includes(r));

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-[#e2e8f0]">
              <div className="flex items-center justify-between bg-[#0f172a] px-6 py-4 text-white">
                <div className="flex items-center gap-2.5">
                  <Sparkles size={18} className="text-[#818cf8]" />
                  <div>
                    <h3 className="text-sm font-black">Résultat de l’Analyse IA Automatique</h3>
                    <p className="text-[11px] text-white/70">
                      Candidat : {aiModalCand.candidat?.prenom} {aiModalCand.candidat?.nom} • Poste :{' '}
                      {aiModalCand.offre?.titre}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAiModalCand(null)}
                  className="rounded-lg bg-white/10 p-1.5 text-white hover:bg-white/20"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
                  <div>
                    <div className="text-xs font-bold text-[#64748b] uppercase">
                      Adéquation globale avec le poste
                    </div>
                    <div className="text-xs text-[#334155] mt-0.5">
                      Analyse automatique effectuée en arrière-plan.
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#eef2ff] px-4 py-2 text-xl font-black text-[#4f46e5]">
                    {score}%
                  </div>
                </div>

                <p className="rounded-xl border border-[#e2e8f0] bg-white p-3.5 text-xs leading-relaxed text-[#334155]">
                  {aiModalCand.analyse?.resume ||
                    `Ce profil couvre ${matched.length} sur ${reqSkills.length} compétences requises pour le poste.`}
                </p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] p-3">
                    <div className="text-[11px] font-bold text-[#166534] mb-1.5">
                      Compétences validées ({matched.length}/{reqSkills.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {matched.length > 0 ? (
                        matched.map((s, i) => (
                          <span
                            key={i}
                            className="rounded bg-white px-2 py-0.5 text-[11px] font-bold text-[#15803d] border border-[#bbf7d0]"
                          >
                            ✓ {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-[#64748b]">Aucune correspondance</span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#fed7aa] bg-[#fff7ed] p-3">
                    <div className="text-[11px] font-bold text-[#9a3412] mb-1.5">
                      À vérifier en entretien ({missing.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {missing.length > 0 ? (
                        missing.map((s, i) => (
                          <span
                            key={i}
                            className="rounded bg-white px-2 py-0.5 text-[11px] font-bold text-[#c2410c] border border-[#fed7aa]"
                          >
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] font-semibold text-[#15803d]">
                          Tous les prérequis sont couverts
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-[#e2e8f0] pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      const target = aiModalCand;
                      setAiModalCand(null);
                      onOpenDetail(target);
                    }}
                    className="rounded-xl bg-[#4f46e5] px-4 py-2 text-xs font-bold text-white hover:bg-[#4338ca]"
                  >
                    Ouvrir le dossier & Décider
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiModalCand(null)}
                    className="rounded-xl border border-[#cbd5e1] bg-white px-4 py-2 text-xs font-bold text-[#334155] hover:bg-[#f8fafc]"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
