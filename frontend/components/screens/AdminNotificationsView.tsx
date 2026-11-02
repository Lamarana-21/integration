'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Edit,
  Mail,
  RefreshCw,
  Send,
  X,
  XCircle,
} from 'lucide-react';
import { NotificationRecord, NotificationType } from '@/lib/types';

interface AdminNotificationsViewProps {
  notifications: NotificationRecord[];
  onResend: (id: string) => void;
}

export function AdminNotificationsView({
  notifications,
  onResend,
}: AdminNotificationsViewProps) {
  const [filterType, setFilterType] = useState<string>('TOUS');
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);

  const filtered = notifications.filter((n) => {
    if (filterType !== 'TOUS' && n.type !== filterType) return false;
    return true;
  });

  const templates = [
    {
      code: 'CONFIRMATION_DEPOT',
      titre: 'Confirmation de dépôt de candidature (11.1)',
      destinataire: 'Candidat',
      sujet: 'Confirmation de votre candidature : {offre_titre}',
      corps: 'Bonjour {candidat_prenom}, votre candidature pour le poste « {offre_titre} » a bien été enregistrée. L\'analyse IA a été initiée et le recruteur étudie votre dossier.',
    },
    {
      code: 'CHANGEMENT_STATUT',
      titre: 'Changement d’état de la candidature (11.2)',
      destinataire: 'Candidat',
      sujet: 'Mise à jour de votre candidature : {offre_titre}',
      corps: 'Bonjour {candidat_prenom}, le statut de votre candidature est passé à : {nouveau_statut}. Connectez-vous sur votre espace pour consulter le suivi.',
    },
    {
      code: 'NOUVELLE_CANDIDATURE',
      titre: 'Alerte nouvelle candidature reçue (11.3)',
      destinataire: 'Recruteur de l\'offre',
      sujet: 'Nouvelle candidature pour : {offre_titre}',
      corps: 'Bonjour {recruteur_prenom}, {candidat_nom} vient de postuler. Le résumé du profil et le score IA sont disponibles dans votre tableau de bord.',
    },
    {
      code: 'REINITIALISATION_MDP',
      titre: 'Réinitialisation du mot de passe (11.4)',
      destinataire: 'Utilisateur',
      sujet: 'Réinitialisation sécurisée de votre mot de passe Talenta',
      corps: 'Bonjour {prenom}, voici votre lien de réinitialisation temporaire (valable 60 minutes) : /reinitialiser?token={token}.',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      {/* Top Header (E15) */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#eef1f7] pb-5 sm:flex-row sm:items-center">
        <div>
          <span className="text-xs font-bold text-[#8c94a9] uppercase tracking-wider">
            Traçabilité & E-mails (E15)
          </span>
          <h1 className="mt-1 text-2xl font-black text-[#171f33]">
            Journal des notifications
          </h1>
          <p className="mt-1 text-xs text-[#7e879c]">
            Vérifiez l'état d'expédition des e-mails automatiques et renvoyez les messages en échec.
          </p>
        </div>

        <button
          onClick={() => setShowTemplatesModal(true)}
          className="flex items-center gap-2 rounded-2xl border border-[#dde0ec] bg-white px-5 py-2.5 text-xs font-bold text-[#444c60] shadow-xs hover:bg-[#fafbfc]"
        >
          <Edit size={14} /> Modifier les modèles d'e-mails (11.6)
        </button>
      </div>

      {/* Filter Row */}
      <div className="mt-6 flex items-center gap-2 rounded-2xl bg-[#fafbfc] border border-[#e8ebf3] p-3 text-xs">
        <span className="font-bold text-[#626a80]">Filtrer par type :</span>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-xl border border-[#dfe3ee] bg-white px-3 py-1.5 font-semibold text-[#1e2538] outline-none"
        >
          <option value="TOUS">Toutes les notifications</option>
          <option value="CONFIRMATION_DEPOT">Confirmation dépôt</option>
          <option value="CHANGEMENT_STATUT">Changement statut</option>
          <option value="NOUVELLE_CANDIDATURE">Nouvelle candidature</option>
          <option value="REINITIALISATION_MDP">Réinitialisation MDP</option>
        </select>
      </div>

      {/* Notifications Table (E15) */}
      <div className="mt-6 overflow-hidden rounded-3xl border border-[#e8ebf3] bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-[#eef1f7] bg-[#fafbfc] text-[11px] font-bold text-[#8d96ab] uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Date & Heure</th>
              <th className="px-6 py-4">Destinataire</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Objet de l'e-mail</th>
              <th className="px-6 py-4">Statut d'envoi</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2f4f9]">
            {filtered.map((notif) => (
              <tr key={notif.id} className="hover:bg-[#fafbfc] transition">
                <td className="px-6 py-4 font-mono text-[#6c758a]">
                  {notif.created_at}
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-[#1f2638]">
                    {notif.user?.email || 'amina@mail.example'}
                  </div>
                  <div className="text-[11px] text-[#848ea4]">
                    {notif.user?.prenom} {notif.user?.nom}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="rounded-md bg-[#eeeaff] px-2 py-0.5 text-[10px] font-bold text-[#5547d7]">
                    {notif.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-[#444c60] font-medium max-w-xs truncate">
                  {notif.objet}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      notif.statut_envoi === 'ENVOYE'
                        ? 'bg-[#edf9f3] text-[#248e56]'
                        : notif.statut_envoi === 'ECHEC'
                        ? 'bg-[#ffe8e8] text-[#cf3b3b]'
                        : 'bg-[#fff5df] text-[#b87c14]'
                    }`}
                  >
                    {notif.statut_envoi === 'ENVOYE' ? (
                      <>
                        <CheckCircle2 size={12} /> Envoyé
                      </>
                    ) : (
                      <>
                        <XCircle size={12} /> Échec
                      </>
                    )}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {notif.statut_envoi === 'ECHEC' ? (
                    <button
                      onClick={() => onResend(notif.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#594be0] px-3 py-1 text-xs font-bold text-white shadow-xs hover:bg-[#483ad3]"
                    >
                      <RefreshCw size={12} /> Renvoyer
                    </button>
                  ) : (
                    <span className="text-[#9ea6bb] text-[11px]">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Modèles d'e-mails (Module 11.6) */}
      {showTemplatesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-base font-extrabold text-[#171f33]">
                  Modèles d'e-mails transactionnels (Module 11.6)
                </h3>
                <p className="text-xs text-[#7e879c]">
                  Personnalisez le contenu des e-mails automatiques envoyés par la plateforme.
                </p>
              </div>
              <button onClick={() => setShowTemplatesModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-4 text-xs">
              {templates.map((tpl) => (
                <div
                  key={tpl.code}
                  className="rounded-2xl border border-[#e2e5f0] bg-[#fafbfc] p-4 space-y-2"
                >
                  <div className="flex items-center justify-between font-bold text-[#1f2638]">
                    <span className="text-sm font-extrabold text-[#594be0]">
                      {tpl.titre}
                    </span>
                    <span className="rounded-md bg-white px-2 py-0.5 text-[10px] text-[#717a90] border">
                      Destinataire : {tpl.destinataire}
                    </span>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#626a80]">Sujet :</label>
                    <input
                      type="text"
                      defaultValue={tpl.sujet}
                      className="mt-0.5 w-full rounded-lg border bg-white p-2 font-medium text-[#1e2538] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#626a80]">Corps :</label>
                    <textarea
                      rows={2}
                      defaultValue={tpl.corps}
                      className="mt-0.5 w-full rounded-lg border bg-white p-2 font-medium text-[#1e2538] outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowTemplatesModal(false)}
                className="rounded-xl bg-[#594be0] px-5 py-2 text-xs font-bold text-white shadow-xs"
              >
                Enregistrer les modèles
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
