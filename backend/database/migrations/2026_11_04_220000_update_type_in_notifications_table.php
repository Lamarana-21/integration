<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (\DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE notifications MODIFY COLUMN type VARCHAR(100) NOT NULL");
        }
    }

    public function down(): void
    {
        if (\DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE notifications MODIFY COLUMN type ENUM('CONFIRMATION_DEPOT', 'CHANGEMENT_STATUT', 'NOUVELLE_CANDIDATURE', 'REINITIALISATION_MDP') NOT NULL");
        }
    }
};

