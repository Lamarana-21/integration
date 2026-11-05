'use client';

import React, { useState } from 'react';
import {
  BriefcaseBusiness,
  Building2,
  Calendar,
  Eye,
  MapPin,
  Save,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { ContractType, Entreprise, JobStatus, Offre, User } from '@/lib/types';

interface NouvelleOffreViewProps {
  initialOffre?: Offre | null;
  entreprises?: Entreprise[];
  currentUser?: User | null;
  onSave: (offreData: Partial<Offre>, publishImmediately: boolean) => void;
  onCancel: () => void;
}

export function NouvelleOffreView({
  initialOffre,
  entreprises = [],
  currentUser,
  onSave,
  onCancel,
}: NouvelleOffreViewProps) {
  const [titre, setTitre] = useState(initialOffre?.titre || '');
  const [entrepriseId, setEntrepriseId] = useState<string>(
    initialOffre?.entreprise_id ||
    currentUser?.entreprise_id ||
    entreprises[0]?.id ||
    '01a16a74-f27b-738f-a948-0fb179d8aed4'
  );
  const [typeContrat, setTypeContrat] = useState<ContractType>(
    initialOffre?.type_contrat || 'CDI'
  );
  const [lieu, setLieu] = useState(initialOffre?.lieu || 'Sfax (Hybride)');
  const [salaire, setSalaire] = useState(initialOffre?.salaire || '');
  const [description, setDescription] = useState(initialOffre?.description || '');
  const [missions, setMissions] = useState(initialOffre?.missions || '');
  const [competences, setCompetences] = useState<string[]>(
    initialOffre?.competences_requises || ['React', 'Node.js', 'SQL']
  );
  const [newComp, setNewComp] = useState('');
  const [dateLimite, setDateLimite] = useState(
    initialOffre?.date_limite || '2026-11-30'
  );
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');

  const handleAddSkill = () => {
    if (newComp.trim() && !competences.includes(newComp.trim())) {
      setCompetences([...competences, newComp.trim()]);
      setNewComp('');
    }
  };

  const handleRemoveSkill = (c: string) => {
    setCompetences(competences.filter((item) => item !== c));
  };

  const validate = () => {
    if (!titre.trim()) return 'Le titre de l’offre est obligatoire.';
    if (!lieu.trim()) return 'Le lieu est obligatoire.';
    if (!description.trim()) return 'La description du poste est obligatoire.';
    if (!dateLimite) return 'La date limite de candidature est obligatoire.';
    return null;
  };

  const handleSubmit = (publishImmediately: boolean) => {
    setError('');
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    onSave(
      {
        titre,
        type_contrat: typeContrat,
        lieu,
        salaire,
        description,
        missions,
        competences_requises: competences,
        date_limite: dateLimite,
        entreprise_id: entrepriseId,
        statut: publishImmediately ? 'PUBLIEE' : 'BROUILLON',
      },
      publishImmediately
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Top Header (E8) */}
      <div className="flex items-center justify-between border-b border-[#eef1f7] pb-5">
        <div>
          <span className="rounded-md bg-[#eeeaff] px-2.5 py-0.5 text-xs font-bold text-[#5547d7]">
            {initialOffre ? 'Modification' : 'Création d’offre'}
          </span>
          <h1 className="mt-2 text-2xl font-black text-[#171f33]">
            {initialOffre ? `Modifier : ${initialOffre.titre}` : 'Nouvelle offre d’emploi'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#fff5df] px-3 py-1 text-xs font-bold text-[#b07817]">
            {initialOffre?.statut || 'Brouillon'}
          </span>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-[#ffcfcf] bg-[#fff5f5] p-4 text-xs font-bold text-[#cf3b3b]">
          {error}
        </div>
      )}

      {/* Main E8 Form */}
      <div className="mt-6 space-y-6 rounded-3xl border border-[#e8ebf3] bg-white p-6 sm:p-8 shadow-xs">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-bold text-[#20283c]">
              Titre de l'offre *
            </label>
            <input
              type="text"
              required
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex: Développeur Web Junior, Responsable Marketing..."
              className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-4 py-3 text-xs text-[#1a2133] outline-none focus:border-[#6355e8]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#20283c] flex items-center gap-1.5">
              <Building2 size={13} className="text-[#594be0]" /> Entreprise affiliée *
            </label>
            <select
              value={entrepriseId}
              onChange={(e) => setEntrepriseId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-3 text-xs font-bold text-[#1a2133] outline-none focus:border-[#6355e8]"
            >
              {entreprises && entreprises.length > 0 ? (
                entreprises.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nom} — {e.secteur} ({e.ville})
                  </option>
                ))
              ) : (
                <option value="01a16a74-f27b-738f-a948-0fb179d8aed4">Société Alpha (Sfax)</option>
              )}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs font-bold text-[#20283c]">
              Type de contrat *
            </label>
            <select
              value={typeContrat}
              onChange={(e) => setTypeContrat(e.target.value as ContractType)}
              className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1a2133] outline-none"
            >
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
              <option value="STAGE">Stage</option>
              <option value="ALTERNANCE">Alternance</option>
              <option value="FREELANCE">Freelance</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#20283c]">Lieu *</label>
            <input
              type="text"
              required
              value={lieu}
              onChange={(e) => setLieu(e.target.value)}
              placeholder="Sfax, Tunis, Télétravail..."
              className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1a2133] outline-none focus:border-[#6355e8]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#20283c]">
              Fourchette de salaire (optionnel)
            </label>
            <input
              type="text"
              value={salaire}
              onChange={(e) => setSalaire(e.target.value)}
              placeholder="Ex: 1 800 - 2 400 TND"
              className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1a2133] outline-none focus:border-[#6355e8]"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-[#20283c]">
            Description du poste *
          </label>
          <textarea
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Présentez le cadre du poste, les enjeux de votre entreprise..."
            className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] p-3 text-xs text-[#1a2133] outline-none focus:border-[#6355e8]"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-[#20283c]">
            Missions principales
          </label>
          <textarea
            rows={3}
            value={missions}
            onChange={(e) => setMissions(e.target.value)}
            placeholder="• Développer de nouvelles fonctionnalités&#10;• Participer aux revues de code&#10;• Rédiger la documentation technique"
            className="mt-1.5 w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] p-3 text-xs text-[#1a2133] outline-none focus:border-[#6355e8]"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-[#20283c]">
            Compétences requises (utilisées pour le scoring IA)
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {competences.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#dcd7fb] bg-[#f7f6ff] px-3 py-1 text-xs font-bold text-[#5547d7]"
              >
                {c}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(c)}
                  className="text-[#887fd3] hover:text-[#5547d7]"
                >
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>

          <div className="mt-2.5 flex items-center gap-2 max-w-sm">
            <input
              type="text"
              placeholder="Ex: React, TypeScript, SQL..."
              value={newComp}
              onChange={(e) => setNewComp(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
              className="w-full rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3 py-2 text-xs text-[#1a2133] outline-none"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="rounded-xl bg-[#594be0] px-3.5 py-2 text-xs font-bold text-white"
            >
              + Ajouter
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-[#20283c]">
            Date limite de candidature * (doit être future)
          </label>
          <input
            type="date"
            required
            value={dateLimite}
            onChange={(e) => setDateLimite(e.target.value)}
            className="mt-1.5 w-full max-w-xs rounded-xl border border-[#e2e5ef] bg-[#fafbfc] px-3.5 py-2.5 text-xs text-[#1a2133] outline-none"
          />
        </div>

        {/* Buttons (E8) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#f0f2f7] pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[#dde0ec] px-4 py-2.5 text-xs font-bold text-[#646c82] hover:bg-[#fafbfc]"
          >
            Annuler
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-1.5 rounded-xl border border-[#dde0ec] px-4 py-2.5 text-xs font-bold text-[#4c546a] hover:bg-[#fafbfc]"
            >
              <Eye size={15} /> Aperçu de l'offre
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="flex items-center gap-1.5 rounded-xl border border-[#d8d2fb] bg-[#f7f6ff] px-4 py-2.5 text-xs font-bold text-[#5547d7] hover:bg-[#efedff]"
            >
              <Save size={15} /> Enregistrer en brouillon
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="flex items-center gap-1.5 rounded-xl bg-[#594be0] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#483ad3] transition"
            >
              <Send size={15} /> Publier l'offre
            </button>
          </div>
        </div>
      </div>

      {/* Modal Aperçu (E8) */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <span className="text-xs font-bold text-[#8f98ad] uppercase">
                Aperçu candidat
              </span>
              <button onClick={() => setShowPreview(false)}>
                <X size={18} />
              </button>
            </div>
            <h3 className="mt-4 text-2xl font-black text-[#171f33]">{titre || 'Titre du poste'}</h3>
            <div className="mt-1 flex items-center gap-3 text-xs text-[#717a90]">
              <span className="font-bold text-[#594be0]">{typeContrat}</span>
              <span>· {lieu}</span>
              {salaire && <span>· {salaire}</span>}
              <span>· Limite : {dateLimite}</span>
            </div>
            <p className="mt-4 text-xs leading-5 text-[#525a6e] whitespace-pre-line">
              {description}
            </p>
            {missions && (
              <div className="mt-4 text-xs leading-5 text-[#525a6e] whitespace-pre-line">
                <strong>Missions :</strong>
                <div>{missions}</div>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {competences.map((c) => (
                <span key={c} className="rounded-lg bg-[#eeeaff] px-2.5 py-1 text-xs font-bold text-[#5547d7]">
                  {c}
                </span>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowPreview(false)}
                className="rounded-xl bg-[#594be0] px-5 py-2 text-xs font-bold text-white"
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
