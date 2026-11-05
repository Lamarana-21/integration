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
        Schema::table('candidats', function (Blueprint $table) {
            if (!Schema::hasColumn('candidats', 'favoris_offres_ids')) {
                $table->json('favoris_offres_ids')->nullable()->after('disponibilite');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('candidats', function (Blueprint $table) {
            if (Schema::hasColumn('candidats', 'favoris_offres_ids')) {
                $table->dropColumn('favoris_offres_ids');
            }
        });
    }
};
