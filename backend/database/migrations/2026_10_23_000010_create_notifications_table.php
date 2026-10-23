<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('utilisateur_id');
            $table->enum('type', [
                'CONFIRMATION_DEPOT',
                'CHANGEMENT_STATUT',
                'NOUVELLE_CANDIDATURE',
                'REINITIALISATION_MDP'
            ]);
            $table->string('objet');
            $table->text('message');
            $table->enum('statut_envoi', ['EN_ATTENTE', 'ENVOYE', 'ECHEC'])->default('ENVOYE');
            $table->timestamps();

            $table->foreign('utilisateur_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
