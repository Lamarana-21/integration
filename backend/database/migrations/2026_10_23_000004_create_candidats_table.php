<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('candidats', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('utilisateur_id')->unique();
            $table->string('telephone')->nullable();
            $table->string('ville')->nullable();
            $table->text('resume')->nullable();
            $table->json('competences')->nullable();
            $table->json('experiences')->nullable();
            $table->json('formations')->nullable();
            $table->json('langues')->nullable();
            $table->date('disponibilite')->nullable();
            $table->timestamps();

            $table->foreign('utilisateur_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('candidats');
    }
};
