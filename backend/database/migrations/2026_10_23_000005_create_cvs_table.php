<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cvs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('candidat_id');
            $table->string('nom_fichier');
            $table->string('type_mime')->default('application/pdf');
            $table->unsignedBigInteger('taille_octets')->default(0);
            $table->string('url_stockage');
            $table->timestamps();

            $table->foreign('candidat_id')->references('id')->on('candidats')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cvs');
    }
};
