<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // P0: dedupe nomor ganda (seed lama) sebelum pasang unique.
        // Pertahankan id terkecil per nomor, sisanya di-null-kan agar TU bisa penomoran ulang.
        $dupSt = DB::table('surat_tugas')
            ->select('nomor_st', DB::raw('MIN(id) as keep_id'))
            ->whereNotNull('nomor_st')
            ->groupBy('nomor_st')
            ->havingRaw('COUNT(*) > 1')
            ->get();
        foreach ($dupSt as $row) {
            DB::table('surat_tugas')
                ->where('nomor_st', $row->nomor_st)
                ->where('id', '<>', $row->keep_id)
                ->update(['nomor_st' => null]);
        }

        $dupSpd = DB::table('surat_tugas')
            ->select('nomor_spd', DB::raw('MIN(id) as keep_id'))
            ->whereNotNull('nomor_spd')
            ->groupBy('nomor_spd')
            ->havingRaw('COUNT(*) > 1')
            ->get();
        foreach ($dupSpd as $row) {
            DB::table('surat_tugas')
                ->where('nomor_spd', $row->nomor_spd)
                ->where('id', '<>', $row->keep_id)
                ->update(['nomor_spd' => null]);
        }

        // P0: cegah nomor ganda saat penomoran TU bersamaan.
        if (! Schema::hasIndex('surat_tugas', 'surat_tugas_nomor_st_unique')) {
            Schema::table('surat_tugas', function (Blueprint $table) {
                $table->unique('nomor_st', 'surat_tugas_nomor_st_unique');
            });
        }
        if (! Schema::hasIndex('surat_tugas', 'surat_tugas_nomor_spd_unique')) {
            Schema::table('surat_tugas', function (Blueprint $table) {
                $table->unique('nomor_spd', 'surat_tugas_nomor_spd_unique');
            });
        }

        // P0: default role 'user' tidak dikenal di otorisasi -> samakan ke pemohon.
        DB::table('users')->where('role', 'user')->update(['role' => 'pemohon']);
        // Ubah default kolom tanpa doctrine/dbal (portable MySQL).
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE `users` MODIFY `role` VARCHAR(255) NOT NULL DEFAULT 'pemohon'");
        }
    }

    public function down(): void
    {
        Schema::table('surat_tugas', function (Blueprint $table) {
            $table->dropUnique('surat_tugas_nomor_st_unique');
            $table->dropUnique('surat_tugas_nomor_spd_unique');
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE `users` MODIFY `role` VARCHAR(255) NOT NULL DEFAULT 'user'");
        }
    }
};
