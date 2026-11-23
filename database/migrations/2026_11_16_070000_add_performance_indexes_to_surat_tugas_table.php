<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tambah index performa pada kolom filter berfrekuensi tinggi (dashboard, notifikasi, rekapitulasi).
     */
    public function up(): void
    {
        if (Schema::hasTable('surat_tugas')) {
            Schema::table('surat_tugas', function (Blueprint $table) {
                if (! Schema::hasIndex('surat_tugas', 'surat_tugas_status_berangkat_index')) {
                    $table->index(['status', 'tanggal_berangkat'], 'surat_tugas_status_berangkat_index');
                }
                if (! Schema::hasIndex('surat_tugas', 'surat_tugas_status_kembali_index')) {
                    $table->index(['status', 'tanggal_kembali'], 'surat_tugas_status_kembali_index');
                }
                if (! Schema::hasIndex('surat_tugas', 'surat_tugas_kategori_index')) {
                    $table->index('kategori_perjalanan', 'surat_tugas_kategori_index');
                }
                if (! Schema::hasIndex('surat_tugas', 'surat_tugas_ppk_status_index')) {
                    $table->index(['ppk_id', 'status', 'is_ppk_signed'], 'surat_tugas_ppk_status_index');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('surat_tugas')) {
            Schema::table('surat_tugas', function (Blueprint $table) {
                if (Schema::hasIndex('surat_tugas', 'surat_tugas_status_berangkat_index')) {
                    $table->dropIndex('surat_tugas_status_berangkat_index');
                }
                if (Schema::hasIndex('surat_tugas', 'surat_tugas_status_kembali_index')) {
                    $table->dropIndex('surat_tugas_status_kembali_index');
                }
                if (Schema::hasIndex('surat_tugas', 'surat_tugas_kategori_index')) {
                    $table->dropIndex('surat_tugas_kategori_index');
                }
                if (Schema::hasIndex('surat_tugas', 'surat_tugas_ppk_status_index')) {
                    $table->dropIndex('surat_tugas_ppk_status_index');
                }
            });
        }
    }
};
