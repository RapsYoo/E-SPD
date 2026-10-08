<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('surat_tugas', function (Blueprint $table) {
            $table->string('penandatangan_st_jabatan')->default('Kepala Pusat Pendidikan dan Pelatihan')->after('tanggal_surat');
            $table->string('penandatangan_st_nama')->default('Khasan Ashari')->after('penandatangan_st_jabatan');
            $table->string('penandatangan_st_nip')->default('19750617 200003 1 001')->after('penandatangan_st_nama');
            
            $table->foreignId('bendahara_id')->nullable()->after('ppk_nip_snapshot')->constrained('bendahara')->nullOnDelete();
            $table->string('bendahara_nama_snapshot')->nullable()->after('bendahara_id');
            $table->string('bendahara_nip_snapshot')->nullable()->after('bendahara_nama_snapshot');

            $table->string('akun_anggaran')->nullable()->after('durasi_hari');
            $table->date('tanggal_bayar')->nullable()->after('tanggal_surat');
        });

        Schema::table('surat_tugas_pegawai', function (Blueprint $table) {
            $table->string('nik')->nullable()->after('nip');
            $table->string('swift')->nullable()->after('unit_kerja');
            $table->string('nama_bank')->nullable()->after('swift');
            $table->string('no_rekening')->nullable()->after('nama_bank');
        });
    }

    public function down(): void
    {
        Schema::table('surat_tugas_pegawai', function (Blueprint $table) {
            $table->dropColumn(['nik', 'swift', 'nama_bank', 'no_rekening']);
        });

        Schema::table('surat_tugas', function (Blueprint $table) {
            $table->dropForeign(['bendahara_id']);
            $table->dropColumn([
                'penandatangan_st_jabatan',
                'penandatangan_st_nama',
                'penandatangan_st_nip',
                'bendahara_id',
                'bendahara_nama_snapshot',
                'bendahara_nip_snapshot',
                'akun_anggaran',
                'tanggal_bayar',
            ]);
        });
    }
};
