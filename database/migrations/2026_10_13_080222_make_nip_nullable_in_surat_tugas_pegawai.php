<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Jadikan kolom nip, pangkat, golongan, jabatan nullable di surat_tugas_pegawai
     * agar pegawai yang belum lengkap datanya tidak menyebabkan error constraint.
     */
    public function up(): void
    {
        Schema::table('surat_tugas_pegawai', function (Blueprint $table) {
            $table->string('nip')->nullable()->change();
            $table->string('pangkat')->nullable()->change();
            $table->string('golongan')->nullable()->change();
            $table->string('jabatan')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('surat_tugas_pegawai', function (Blueprint $table) {
            $table->string('nip')->nullable(false)->change();
            $table->string('pangkat')->nullable(false)->change();
            $table->string('golongan')->nullable(false)->change();
            $table->string('jabatan')->nullable(false)->change();
        });
    }
};
