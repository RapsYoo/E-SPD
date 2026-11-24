<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('surat_tugas', function (Blueprint $table) {
            if (! Schema::hasColumn('surat_tugas', 'bendahara_id')) {
                $table->foreignId('bendahara_id')
                    ->nullable()
                    ->after('ppk_nip_snapshot')
                    ->constrained('users')
                    ->nullOnDelete();
            }
            if (! Schema::hasColumn('surat_tugas', 'bendahara_nama_snapshot')) {
                $table->string('bendahara_nama_snapshot')->nullable()->after('bendahara_id');
            }
            if (! Schema::hasColumn('surat_tugas', 'bendahara_nip_snapshot')) {
                $table->string('bendahara_nip_snapshot')->nullable()->after('bendahara_nama_snapshot');
            }
            if (! Schema::hasColumn('surat_tugas', 'tanggal_rpd')) {
                $table->date('tanggal_rpd')->nullable()->after('tanggal_surat');
            }
            if (! Schema::hasColumn('surat_tugas', 'pembiayaan_status')) {
                $table->string('pembiayaan_status', 32)->default('BELUM_DIISI')->after('is_ppk_signed')->index();
            }
            if (! Schema::hasColumn('surat_tugas', 'pembiayaan_approved_at')) {
                $table->timestamp('pembiayaan_approved_at')->nullable()->after('pembiayaan_status');
            }
            if (! Schema::hasColumn('surat_tugas', 'pembiayaan_approved_by')) {
                $table->foreignId('pembiayaan_approved_by')
                    ->nullable()
                    ->after('pembiayaan_approved_at')
                    ->constrained('users')
                    ->nullOnDelete();
            }
            if (! Schema::hasColumn('surat_tugas', 'catatan_bendahara')) {
                $table->text('catatan_bendahara')->nullable()->after('pembiayaan_approved_by');
            }
        });

        Schema::table('surat_tugas_pegawai', function (Blueprint $table) {
            if (! Schema::hasColumn('surat_tugas_pegawai', 'rpd_items')) {
                $table->json('rpd_items')->nullable()->after('biaya');
            }
            if (! Schema::hasColumn('surat_tugas_pegawai', 'rpd_total')) {
                $table->unsignedBigInteger('rpd_total')->default(0)->after('rpd_items');
            }
            if (! Schema::hasColumn('surat_tugas_pegawai', 'rpd_telah_dibayar')) {
                $table->unsignedBigInteger('rpd_telah_dibayar')->nullable()->after('rpd_total');
            }
            if (! Schema::hasColumn('surat_tugas_pegawai', 'nama_rekening')) {
                $table->string('nama_rekening')->nullable()->after('rpd_telah_dibayar');
            }
            if (! Schema::hasColumn('surat_tugas_pegawai', 'no_rekening')) {
                $table->string('no_rekening')->nullable()->after('nama_rekening');
            }
            if (! Schema::hasColumn('surat_tugas_pegawai', 'kode_bank')) {
                $table->string('kode_bank')->nullable()->after('no_rekening');
            }
        });
    }

    public function down(): void
    {
        Schema::table('surat_tugas_pegawai', function (Blueprint $table) {
            $cols = array_filter(
                ['rpd_items', 'rpd_total', 'rpd_telah_dibayar', 'nama_rekening', 'no_rekening', 'kode_bank'],
                fn (string $col) => Schema::hasColumn('surat_tugas_pegawai', $col)
            );
            if ($cols !== []) {
                $table->dropColumn($cols);
            }
        });

        Schema::table('surat_tugas', function (Blueprint $table) {
            if (Schema::hasColumn('surat_tugas', 'pembiayaan_approved_by')) {
                $table->dropConstrainedForeignId('pembiayaan_approved_by');
            }
            if (Schema::hasColumn('surat_tugas', 'bendahara_id')) {
                $table->dropConstrainedForeignId('bendahara_id');
            }
            $cols = array_filter(
                ['bendahara_nama_snapshot', 'bendahara_nip_snapshot', 'tanggal_rpd', 'pembiayaan_status', 'pembiayaan_approved_at', 'catatan_bendahara'],
                fn (string $col) => Schema::hasColumn('surat_tugas', $col)
            );
            if ($cols !== []) {
                $table->dropColumn($cols);
            }
        });
    }
};
