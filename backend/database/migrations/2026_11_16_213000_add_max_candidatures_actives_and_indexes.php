<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('entreprises', function (Blueprint $table) {
            if (!Schema::hasColumn('entreprises', 'max_candidatures_actives_par_candidat')) {
                $table->unsignedInteger('max_candidatures_actives_par_candidat')
                    ->nullable()
                    ->after('statut')
                    ->comment('Limite optionnelle de candidatures actives par candidat (NULL = illimité)');
            }
        });

        Schema::table('candidatures', function (Blueprint $table) {
            // Index simples et composés pour accélérer le comptage et le filtrage des candidatures actives
            $table->index('statut', 'candidatures_statut_idx');
            $table->index(['candidat_id', 'statut'], 'candidatures_candidat_statut_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('candidatures', function (Blueprint $table) {
            $table->dropIndex('candidatures_statut_idx');
            $table->dropIndex('candidatures_candidat_statut_idx');
        });

        Schema::table('entreprises', function (Blueprint $table) {
            if (Schema::hasColumn('entreprises', 'max_candidatures_actives_par_candidat')) {
                $table->dropColumn('max_candidatures_actives_par_candidat');
            }
        });
    }
};
