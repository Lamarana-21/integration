<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('candidats', function (Blueprint $table) {
            if (!Schema::hasColumn('candidats', 'nom')) {
                $table->string('nom')->nullable()->after('utilisateur_id');
            }
            if (!Schema::hasColumn('candidats', 'prenom')) {
                $table->string('prenom')->nullable()->after('nom');
            }
        });

        // Copier les noms existants depuis users vers candidats
        \DB::statement("UPDATE candidats c JOIN users u ON c.utilisateur_id = u.id SET c.nom = u.nom, c.prenom = u.prenom");
    }

    public function down(): void
    {
        Schema::table('candidats', function (Blueprint $table) {
            $table->dropColumn(['nom', 'prenom']);
        });
    }
};

