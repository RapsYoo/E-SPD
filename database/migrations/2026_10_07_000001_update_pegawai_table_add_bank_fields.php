<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pegawai', function (Blueprint $table) {
            $table->dropUnique('pegawai_nip_unique');
            $table->string('nip')->nullable()->change();
            $table->string('nik')->nullable()->after('nip');
            $table->string('swift')->nullable()->after('jabatan');
            $table->string('nama_bank')->nullable()->after('swift');
            $table->string('no_rekening')->nullable()->after('nama_bank');
            $table->string('no_rekening_lain')->nullable()->after('no_rekening');
        });
    }

    public function down(): void
    {
        Schema::table('pegawai', function (Blueprint $table) {
            $table->dropColumn(['nik', 'swift', 'nama_bank', 'no_rekening', 'no_rekening_lain']);
            $table->unique('nip');
        });
    }
};
