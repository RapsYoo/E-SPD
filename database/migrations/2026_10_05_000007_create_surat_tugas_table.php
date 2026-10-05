<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('surat_tugas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            
            // Step 1: Input Nota / Undangan
            $table->enum('kategori_perjalanan', ['DALAM_NEGERI', 'LUAR_NEGERI'])->default('DALAM_NEGERI');
            $table->enum('sumber_asal', ['INTERNAL', 'EKSTERNAL'])->default('EKSTERNAL');
            $table->string('nomor_nota');
            $table->string('pengirim_nota');
            $table->date('tanggal_nota');
            $table->text('perihal_nota');
            $table->string('file_undangan')->nullable();
            $table->string('file_izin_setneg')->nullable();
            
            // Workflow Status
            $table->enum('status', [
                'DRAFT',
                'MENUNGGU_DISPOSISI_KAPUS',
                'DISPOSISI_KAPUS_YA',
                'DISPOSISI_KAPUS_REVISI',
                'DISPOSISI_KAPUS_STOP',
                'DRAFT_SESPALU_SELESAI',
                'MENUNGGU_PENOMORAN_TU',
                'SELESAI_TERBIT'
            ])->default('MENUNGGU_DISPOSISI_KAPUS');

            // Step 2: Disposisi Kapus
            $table->enum('kapus_decision', ['YA', 'REVISI', 'STOP'])->nullable();
            $table->text('catatan_kapus')->nullable();
            
            // Step 3: Detail Rincian Perjalanan & PPK
            $table->foreignId('ppk_id')->nullable()->constrained('ppk')->nullOnDelete();
            $table->string('ppk_nama_snapshot')->nullable();
            $table->string('ppk_nip_snapshot')->nullable();
            
            $table->string('tingkat_biaya_kode')->default('C');
            $table->string('jenis_angkutan_nama')->default('Perjalanan Darat');
            $table->string('tempat_berangkat')->default('Jakarta');
            $table->string('tempat_tujuan')->nullable();
            $table->string('negara_tujuan')->nullable();
            $table->string('no_setneg')->nullable();
            $table->date('tanggal_berangkat')->nullable();
            $table->date('tanggal_kembali')->nullable();
            $table->integer('durasi_hari')->default(1);
            
            // Step 4: Penomoran Resmi TU
            $table->string('nomor_st')->nullable();
            $table->string('nomor_spd')->nullable();
            $table->date('tanggal_surat')->nullable();
            
            // Step 5: TTD & Validation PPK
            $table->boolean('is_ppk_signed')->default(false);
            $table->timestamp('signed_at')->nullable();
            
            $table->timestamps();
        });

        Schema::create('surat_tugas_pegawai', function (Blueprint $table) {
            $table->id();
            $table->foreignId('surat_tugas_id')->constrained('surat_tugas')->cascadeOnDelete();
            $table->foreignId('pegawai_id')->nullable()->constrained('pegawai')->nullOnDelete();
            
            // Snapshot Pegawai Protection
            $table->string('nama');
            $table->string('nip');
            $table->string('pangkat')->nullable();
            $table->string('golongan')->nullable();
            $table->string('jabatan')->nullable();
            $table->string('unit_kerja')->nullable();
            $table->integer('urutan')->default(1);
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('surat_tugas_pegawai');
        Schema::dropIfExists('surat_tugas');
    }
};
