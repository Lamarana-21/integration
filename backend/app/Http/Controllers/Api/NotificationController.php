<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Module 11.5 : Journal des notifications envoyées (E15)
     */
    public function index(Request $request): JsonResponse
    {
        $query = Notification::with('user');

        if ($request->filled('type') && $request->type !== 'TOUS') {
            $query->where('type', $request->type);
        }

        if ($request->filled('statut_envoi')) {
            $query->where('statut_envoi', $request->statut_envoi);
        }

        $notifications = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 20));

        return response()->json($notifications);
    }

    /**
     * Renvoyer une notification en échec
     */
    public function resend(string $id): JsonResponse
    {
        $notif = Notification::findOrFail($id);
        $notif->update([
            'statut_envoi' => 'ENVOYE',
            'updated_at' => Carbon::now(),
        ]);

        return response()->json([
            'message' => 'Notification renvoyée avec succès',
            'notification' => $notif,
        ]);
    }

    /**
     * Module 11.6 : Modèles d'e-mails modifiables
     */
    public function getTemplates(): JsonResponse
    {
        $templates = [
            [
                'code' => 'CONFIRMATION_DEPOT',
                'titre' => 'Confirmation de dépôt de candidature',
                'destinataire' => 'Candidat',
                'sujet_modele' => 'Confirmation de votre candidature : {offre_titre}',
                'corps_modele' => 'Bonjour {candidat_prenom}, votre candidature pour le poste « {offre_titre} » a bien été enregistrée. Notre équipe étudie votre profil.',
            ],
            [
                'code' => 'CHANGEMENT_STATUT',
                'titre' => 'Changement d’état de la candidature',
                'destinataire' => 'Candidat',
                'sujet_modele' => 'Mise à jour : {offre_titre}',
                'corps_modele' => 'Bonjour {candidat_prenom}, le statut de votre candidature est passé à : {nouveau_statut}.',
            ],
            [
                'code' => 'NOUVELLE_CANDIDATURE',
                'titre' => 'Alerte nouvelle candidature reçue',
                'destinataire' => 'Recruteur',
                'sujet_modele' => 'Nouvelle candidature pour {offre_titre}',
                'corps_modele' => 'Bonjour {recruteur_prenom}, {candidat_nom} a postulé. L’analyse IA est disponible sur votre tableau de bord.',
            ],
            [
                'code' => 'REINITIALISATION_MDP',
                'titre' => 'Réinitialisation du mot de passe',
                'destinataire' => 'Utilisateur',
                'sujet_modele' => 'Réinitialisation de votre mot de passe Talenta',
                'corps_modele' => 'Bonjour {prenom}, voici votre lien de réinitialisation sécurisé : {lien_reset}. Ce lien expire dans 60 minutes.',
            ],
        ];

        return response()->json(['templates' => $templates]);
    }
}
