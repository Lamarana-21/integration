<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('analyses_cv', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('cv_id');
            $table->uuid('candidature_id')->nullable();
            $table->json('infos_extraites')->nullable(); // competences, experiences, formations, langues
            $table->text('resume')->nullable();
            $table->unsignedTinyInteger('score_correspondance')->nullable(); // 0..100
            $table->json('points_forts')->nullable();
            $table->json('points_manquants')->nullable();
            $table->enum('niveau_confiance', ['FAIBLE', 'MOYEN', 'ELEVE'])->default('MOYEN');
            $table->string('version_modele')->default('Talenta-AI-v2.1');
            $table->boolean('valide_par_recruteur')->default(false);
            $table->timestamps();

            $table->foreign('cv_id')->references('id')->on('cvs')->onDelete('cascade');
            $table->foreign('candidature_id')->references('id')->on('candidatures')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analyses_cv');
    }
};
