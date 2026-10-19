<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Satu pegawai hanya boleh memiliki satu akun. Nullable agar akun lama (seeder) tetap valid.
            $table->foreignId('pegawai_id')
                ->nullable()
                ->unique()
                ->after('role')
                ->constrained('pegawai')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('pegawai_id');
        });
    }
};
