<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('offres', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('titre');
            $table->text('description')->nullable();
            $table->text('missions')->nullable();
            $table->json('competences_requises')->nullable();
            $table->enum('type_contrat', ['CDI', 'CDD', 'STAGE', 'ALTERNANCE', 'FREELANCE'])->default('CDI');
            $table->string('lieu')->nullable();
            $table->string('salaire')->nullable();
            $table->date('date_publication')->nullable();
            $table->date('date_limite')->nullable();
            $table->enum('statut', ['BROUILLON', 'PUBLIEE', 'CLOTUREE', 'ARCHIVEE'])->default('BROUILLON');
            $table->uuid('entreprise_id');
            $table->uuid('auteur_id');
            $table->timestamps();

            $table->foreign('entreprise_id')->references('id')->on('entreprises')->onDelete('cascade');
            $table->foreign('auteur_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('offres');
    }
};
