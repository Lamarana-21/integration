<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cvs', function (Blueprint $table) {
            // Stockage direct du fichier dans la base de données (MEDIUMTEXT ou LONGTEXT jusqu'à 4 Go)
            $table->longText('contenu_base64')->nullable()->after('url_stockage');
        });
    }

    public function down(): void
    {
        Schema::table('cvs', function (Blueprint $table) {
            $table->dropColumn('contenu_base64');
        });
    }
};
