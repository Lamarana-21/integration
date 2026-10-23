<?php

namespace App\Services;

use App\Models\Candidature;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Module 11.1 : E-mail de confirmation de dépôt de candidature au candidat
     */
    public function notifierConfirmationDepot(Candidature $candidature): Notification
    {
        $candidatUser = $candidature->candidat->user;
        $offreTitre = $candidature->offre->titre;

        $notif = Notification::create([
            'utilisateur_id' => $candidatUser->id,
            'type' => 'CONFIRMATION_DEPOT',
            'objet' => "Confirmation de votre candidature : {$offreTitre}",
            'message' => "Bonjour {$candidatUser->prenom}, votre candidature pour le poste « {$offreTitre} » a bien été reçue. Vous pouvez suivre l’évolution de son statut dans votre espace « Mes candidatures ».",
            'statut_envoi' => 'ENVOYE',
        ]);

        Log::info("Notification CONFIRMATION_DEPOT envoyée à {$candidatUser->email}");
        return $notif;
    }

    /**
     * Module 11.2 : E-mail au candidat lors d'un changement de statut
     */
    public function notifierChangementStatut(Candidature $candidature): Notification
    {
        $candidatUser = $candidature->candidat->user;
        $offreTitre = $candidature->offre->titre;
        $statut = $candidature->statut;

        $notif = Notification::create([
            'utilisateur_id' => $candidatUser->id,
            'type' => 'CHANGEMENT_STATUT',
            'objet' => "Mise à jour de votre candidature : {$offreTitre}",
            'message' => "Bonjour {$candidatUser->prenom}, le statut de votre candidature pour le poste « {$offreTitre} » est passé à : {$statut}.",
            'statut_envoi' => 'ENVOYE',
        ]);

        Log::info("Notification CHANGEMENT_STATUT envoyée à {$candidatUser->email}");
        return $notif;
    }

    /**
     * Module 11.3 : E-mail au recruteur lors d'une nouvelle candidature
     */
    public function notifierNouvelleCandidature(Candidature $candidature): Notification
    {
        $recruteur = $candidature->offre->auteur;
        $candidatUser = $candidature->candidat->user;
        $offreTitre = $candidature->offre->titre;

        $notif = Notification::create([
            'utilisateur_id' => $recruteur->id,
            'type' => 'NOUVELLE_CANDIDATURE',
            'objet' => "Nouvelle candidature reçue pour : {$offreTitre}",
            'message' => "Bonjour {$recruteur->prenom}, {$candidatUser->prenom} {$candidatUser->nom} vient de postuler à votre offre « {$offreTitre} ». L'analyse de CV par IA a été initiée.",
            'statut_envoi' => 'ENVOYE',
        ]);

        Log::info("Notification NOUVELLE_CANDIDATURE envoyée au recruteur {$recruteur->email}");
        return $notif;
    }

    /**
     * Module 11.4 : E-mail de réinitialisation du mot de passe
     */
    public function notifierReinitialisationMdp(User $user, string $token): Notification
    {
        $notif = Notification::create([
            'utilisateur_id' => $user->id,
            'type' => 'REINITIALISATION_MDP',
            'objet' => "Réinitialisation de votre mot de passe Talenta",
            'message' => "Bonjour {$user->prenom}, utilisez ce lien sécurisé pour réinitialiser votre mot de passe (valable 60 minutes) : /reinitialiser-mot-de-passe?token={$token}",
            'statut_envoi' => 'ENVOYE',
        ]);

        Log::info("Notification REINITIALISATION_MDP envoyée à {$user->email}");
        return $notif;
    }
}
