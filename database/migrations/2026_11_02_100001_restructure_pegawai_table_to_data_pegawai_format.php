<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Menyesuaikan tabel `pegawai` dengan struktur "Data Pegawai_Update 2026"
 * (lihat Downloads/DB/New/pegawai.sql). Id tetap dipertahankan sehingga relasi
 * users.pegawai_id & surat_tugas_pegawai.pegawai_id tidak terputus.
 *
 * Kolom lama `unit_kerja` disalin ke `upt_bidang` sebelum dihapus.
 * Data kolom yang dihapus (unit_kerja, email, no_telepon, is_active) dicadangkan dulu
 * ke tabel `pegawai_legacy_backup`.
 *
 * Data baru dari Excel diselaraskan ke baris yang sudah ada lewat `php artisan pegawai:impor`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('pegawai_legacy_backup');
        Schema::create('pegawai_legacy_backup', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->primary();
            $table->string('nama');
            $table->string('nip')->nullable();
            $table->string('unit_kerja')->nullable();
            $table->string('email')->nullable();
            $table->string('no_telepon')->nullable();
            $table->boolean('is_active')->default(true);
        });
        DB::table('pegawai_legacy_backup')->insertUsing(
            ['id', 'nama', 'nip', 'unit_kerja', 'email', 'no_telepon', 'is_active'],
            DB::table('pegawai')->select(['id', 'nama', 'nip', 'unit_kerja', 'email', 'no_telepon', 'is_active'])
        );

        Schema::table('pegawai', function (Blueprint $table) {
            $table->dropUnique(['nip']);
        });

        Schema::table('pegawai', function (Blueprint $table) {
            $table->string('nip')->nullable()->change();
            $table->string('pangkat')->nullable()->change();
            $table->string('golongan')->nullable()->change();
            $table->string('jabatan')->nullable()->change();

            $table->string('masuk_kemlu')->nullable();
            $table->string('tanggal_lahir')->nullable();
            $table->string('zodiac')->nullable();
            $table->string('shio')->nullable();
            $table->string('jenis_kelamin')->nullable();
            $table->string('agama')->nullable();
            $table->string('upt_bidang')->nullable();
            $table->string('status_kepegawaian')->nullable();
            $table->string('pddn_pdln')->nullable();
            $table->string('masuk_pusdiklat')->nullable();
            $table->string('waktu_di_pusdiklat')->nullable();
            $table->string('ceksk_spmt')->nullable();
            $table->string('kelas_jabatan')->nullable();
            $table->string('tmt')->nullable();
            $table->string('struktural_lainnya')->nullable();
            $table->string('fungsional')->nullable();
            $table->string('jenjang')->nullable();
            $table->string('gelar')->nullable();
            $table->string('tmt_2')->nullable();
            $table->string('usia')->nullable();
            $table->string('usia_pensiun')->nullable();
            $table->string('tahun_pensiun')->nullable();
            $table->text('keterangan')->nullable();
            $table->string('kode_bank')->nullable();
            $table->string('no_rekening')->nullable();
            $table->string('nama_rekening')->nullable();
            $table->string('bank')->nullable();

            $table->index('nip');
            $table->index('nama');
        });

        DB::table('pegawai')->update(['upt_bidang' => DB::raw('unit_kerja')]);

        Schema::table('pegawai', function (Blueprint $table) {
            $table->dropColumn(['unit_kerja', 'email', 'no_telepon']);
        });
    }

    public function down(): void
    {
        Schema::table('pegawai', function (Blueprint $table) {
            $table->string('unit_kerja')->nullable();
            $table->string('email')->nullable();
            $table->string('no_telepon')->nullable();
        });

        DB::table('pegawai')->update(['unit_kerja' => DB::raw('upt_bidang')]);

        foreach (DB::table('pegawai_legacy_backup')->get() as $backup) {
            DB::table('pegawai')->where('id', $backup->id)->update([
                'unit_kerja' => $backup->unit_kerja,
                'email' => $backup->email,
                'no_telepon' => $backup->no_telepon,
                'is_active' => $backup->is_active,
            ]);
        }

        Schema::dropIfExists('pegawai_legacy_backup');

        Schema::table('pegawai', function (Blueprint $table) {
            $table->dropIndex(['nip']);
            $table->dropIndex(['nama']);

            $table->dropColumn([
                'masuk_kemlu', 'tanggal_lahir', 'zodiac', 'shio', 'jenis_kelamin', 'agama', 'upt_bidang',
                'status_kepegawaian', 'pddn_pdln', 'masuk_pusdiklat', 'waktu_di_pusdiklat', 'ceksk_spmt',
                'kelas_jabatan', 'tmt', 'struktural_lainnya', 'fungsional', 'jenjang', 'gelar', 'tmt_2',
                'usia', 'usia_pensiun', 'tahun_pensiun', 'keterangan', 'kode_bank', 'no_rekening',
                'nama_rekening', 'bank',
            ]);
        });
    }
};
