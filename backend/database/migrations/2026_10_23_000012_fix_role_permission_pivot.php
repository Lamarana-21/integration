<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('role_permission', 'id')) {
            Schema::table('role_permission', function (Blueprint $table): void {
                $table->dropColumn('id');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasColumn('role_permission', 'id')) {
            Schema::table('role_permission', function (Blueprint $table): void {
                $table->uuid('id')->nullable();
            });
        }
    }
};
