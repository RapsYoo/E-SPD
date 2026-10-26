<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('surat_tugas', function (Blueprint $table) {
            $table->string('kapus_nama_snapshot')->nullable()->after('ppk_nip_snapshot');
            $table->string('kapus_nip_snapshot')->nullable()->after('kapus_nama_snapshot');
        });

        // Surat yang sudah terbit sebelumnya dicetak dengan nama penandatangan statis ini; pertahankan.
        DB::table('surat_tugas')
            ->where('status', 'SELESAI_TERBIT')
            ->update([
                'kapus_nama_snapshot' => 'Khasan Ashari',
                'kapus_nip_snapshot' => '19750617 200003 1 001',
            ]);
    }

    public function down(): void
    {
        Schema::table('surat_tugas', function (Blueprint $table) {
            $table->dropColumn(['kapus_nama_snapshot', 'kapus_nip_snapshot']);
        });
    }
};
