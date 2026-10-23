<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notes_internes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('auteur_id');
            $table->uuid('candidature_id');
            $table->text('contenu');
            $table->json('etiquettes')->nullable();
            $table->timestamps();

            $table->foreign('auteur_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('candidature_id')->references('id')->on('candidatures')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notes_internes');
    }
};
