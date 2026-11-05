<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('tingkat_biaya', 'tarif_harian')) {
            Schema::table('tingkat_biaya', function (Blueprint $table) {
                $table->unsignedBigInteger('tarif_harian')->default(750000)->after('keterangan');
            });

            DB::table('tingkat_biaya')->where('kode', 'A')->update(['tarif_harian' => 1500000]);
            DB::table('tingkat_biaya')->where('kode', 'B')->update(['tarif_harian' => 1000000]);
            DB::table('tingkat_biaya')->where('kode', 'C')->update(['tarif_harian' => 750000]);
        }

        if (! Schema::hasColumn('surat_tugas_pegawai', 'biaya')) {
            Schema::table('surat_tugas_pegawai', function (Blueprint $table) {
                $table->unsignedBigInteger('biaya')->nullable()->after('urutan');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('surat_tugas_pegawai', 'biaya')) {
            Schema::table('surat_tugas_pegawai', function (Blueprint $table) {
                $table->dropColumn('biaya');
            });
        }

        if (Schema::hasColumn('tingkat_biaya', 'tarif_harian')) {
            Schema::table('tingkat_biaya', function (Blueprint $table) {
                $table->dropColumn('tarif_harian');
            });
        }
    }
};
