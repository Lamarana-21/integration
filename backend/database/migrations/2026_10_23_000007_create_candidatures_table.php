<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('candidatures', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('candidat_id');
            $table->uuid('offre_id');
            $table->uuid('cv_id');
            $table->text('lettre_motivation')->nullable();
            $table->text('message')->nullable();
            $table->enum('statut', [
                'RECUE',
                'EN_EXAMEN',
                'PRESELECTIONNEE',
                'ENTRETIEN',
                'ACCEPTEE',
                'REFUSEE',
                'RETIREE'
            ])->default('RECUE');
            $table->text('commentaire_recruteur')->nullable();
            $table->timestamps();

            $table->unique(['candidat_id', 'offre_id']);
            $table->foreign('candidat_id')->references('id')->on('candidats')->onDelete('cascade');
            $table->foreign('offre_id')->references('id')->on('offres')->onDelete('cascade');
            $table->foreign('cv_id')->references('id')->on('cvs')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('candidatures');
    }
};
