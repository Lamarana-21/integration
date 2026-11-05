<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('candidats', function (Blueprint $table) {
            if (!Schema::hasColumn('candidats', 'titre')) {
                $table->string('titre')->nullable()->after('ville');
            }
            if (!Schema::hasColumn('candidats', 'pays')) {
                $table->string('pays')->nullable()->default('Tunisie')->after('ville');
            }
            if (!Schema::hasColumn('candidats', 'avatar_url')) {
                $table->longText('avatar_url')->nullable()->after('pays');
            }
            if (!Schema::hasColumn('candidats', 'linkedin_url')) {
                $table->string('linkedin_url')->nullable()->after('resume');
            }
            if (!Schema::hasColumn('candidats', 'github_url')) {
                $table->string('github_url')->nullable()->after('linkedin_url');
            }
            if (!Schema::hasColumn('candidats', 'portfolio_url')) {
                $table->string('portfolio_url')->nullable()->after('github_url');
            }
        });

        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'avatar_url')) {
                $table->longText('avatar_url')->nullable()->after('email');
            }
        });
    }

    public function down(): void
    {
        Schema::table('candidats', function (Blueprint $table) {
            $table->dropColumn(['titre', 'pays', 'avatar_url', 'linkedin_url', 'github_url', 'portfolio_url']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['avatar_url']);
        });
    }
};

