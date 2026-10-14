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
        Schema::table('surat_tugas_pegawai', function (Blueprint $table) {
            $table->date('tanggal_berangkat')->nullable()->after('urutan');
            $table->date('tanggal_kembali')->nullable()->after('tanggal_berangkat');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('surat_tugas_pegawai', function (Blueprint $table) {
            $table->dropColumn(['tanggal_berangkat', 'tanggal_kembali']);
        });
    }
};
