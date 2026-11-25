<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('peta_jabatan_positions')) {
            Schema::create('peta_jabatan_positions', function (Blueprint $table) {
                $table->id();
                $table->string('kode', 80)->unique();
                $table->string('section', 50)->index();
                $table->string('tipe', 30)->default('fungsional'); // pimpinan, struktural, fungsional, pelaksana, alih_daya
                $table->string('nama_jabatan');
                $table->unsignedTinyInteger('kelas')->nullable();
                $table->unsignedSmallInteger('kebutuhan')->default(1);
                $table->unsignedSmallInteger('urutan')->default(0);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('peta_jabatan_assignments')) {
            Schema::create('peta_jabatan_assignments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('position_id')->constrained('peta_jabatan_positions')->cascadeOnDelete();
                $table->foreignId('pegawai_id')->constrained('pegawai')->cascadeOnDelete();
                $table->string('catatan', 120)->nullable();
                $table->unsignedSmallInteger('urutan')->default(0);
                $table->timestamps();

                $table->unique(['position_id', 'pegawai_id']);
            });
        }

        $now = now();
        $positions = [
            // Pimpinan Utama
            ['kode' => 'kapus', 'section' => 'pimpinan', 'tipe' => 'pimpinan', 'nama_jabatan' => 'KEPALA PUSAT PENDIDIKAN DAN PELATIHAN', 'kelas' => 15, 'kebutuhan' => 1, 'urutan' => 1],

            // Direktur UPT (Kelas 14)
            ['kode' => 'dir_sesparlu', 'section' => 'direktur_upt', 'tipe' => 'pimpinan', 'nama_jabatan' => 'DIREKTUR UNIT PELAKSANA TEKNIS SESPARLU', 'kelas' => 14, 'kebutuhan' => 1, 'urutan' => 1],
            ['kode' => 'dir_sesdilu', 'section' => 'direktur_upt', 'tipe' => 'pimpinan', 'nama_jabatan' => 'DIREKTUR UNIT PELAKSANA TEKNIS SESDILU', 'kelas' => 14, 'kebutuhan' => 1, 'urutan' => 2],
            ['kode' => 'dir_sekdilu', 'section' => 'direktur_upt', 'tipe' => 'pimpinan', 'nama_jabatan' => 'DIREKTUR UNIT PELAKSANA TEKNIS SEKDILU', 'kelas' => 14, 'kebutuhan' => 1, 'urutan' => 3],

            // Kolom 1: Bidang Analisis, Pengembangan, Evaluasi Pendidikan dan Pelatihan dan Layanan Perpustakaan
            ['kode' => 'b1_head', 'section' => 'bidang_1_head', 'tipe' => 'struktural', 'nama_jabatan' => 'KEPALA BIDANG ANALISIS, PENGEMBANGAN, EVALUASI PENDIDIKAN DAN PELATIHAN DAN LAYANAN PERPUSTAKAAN', 'kelas' => 13, 'kebutuhan' => 1, 'urutan' => 1],
            ['kode' => 'b1_diplomat_muda', 'section' => 'bidang_1', 'tipe' => 'fungsional', 'nama_jabatan' => 'Diplomat Ahli Muda', 'kelas' => 10, 'kebutuhan' => 2, 'urutan' => 1],
            ['kode' => 'b1_ptp_muda', 'section' => 'bidang_1', 'tipe' => 'fungsional', 'nama_jabatan' => 'Pengembang Teknologi Pembelajaran Ahli Muda', 'kelas' => 10, 'kebutuhan' => 2, 'urutan' => 2],
            ['kode' => 'b1_bangkom_muda', 'section' => 'bidang_1', 'tipe' => 'fungsional', 'nama_jabatan' => 'Analis Bangkom ASN Ahli Muda', 'kelas' => 10, 'kebutuhan' => 5, 'urutan' => 3],
            ['kode' => 'b1_pid_muda', 'section' => 'bidang_1', 'tipe' => 'fungsional', 'nama_jabatan' => 'Pranata Informasi Diplomatik Ahli Muda', 'kelas' => 9, 'kebutuhan' => 1, 'urutan' => 4],
            ['kode' => 'b1_pustakawan_muda', 'section' => 'bidang_1', 'tipe' => 'fungsional', 'nama_jabatan' => 'Pustakawan Ahli Muda', 'kelas' => 9, 'kebutuhan' => 2, 'urutan' => 5],
            ['kode' => 'b1_diplomat_pertama', 'section' => 'bidang_1', 'tipe' => 'fungsional', 'nama_jabatan' => 'Diplomat Ahli Pertama', 'kelas' => 8, 'kebutuhan' => 2, 'urutan' => 6],
            ['kode' => 'b1_perencana_pertama', 'section' => 'bidang_1', 'tipe' => 'fungsional', 'nama_jabatan' => 'Perencana Ahli Pertama', 'kelas' => 8, 'kebutuhan' => 1, 'urutan' => 7],
            ['kode' => 'b1_ptp_pertama', 'section' => 'bidang_1', 'tipe' => 'fungsional', 'nama_jabatan' => 'Pengembang Teknologi Pembelajaran Ahli Pertama', 'kelas' => 8, 'kebutuhan' => 2, 'urutan' => 8],
            ['kode' => 'b1_pustakawan_pertama', 'section' => 'bidang_1', 'tipe' => 'fungsional', 'nama_jabatan' => 'Pustakawan Ahli Pertama', 'kelas' => 8, 'kebutuhan' => 2, 'urutan' => 9],
            ['kode' => 'b1_bangkom_pertama', 'section' => 'bidang_1', 'tipe' => 'fungsional', 'nama_jabatan' => 'Analis Bangkom ASN Ahli Pertama', 'kelas' => 8, 'kebutuhan' => 5, 'urutan' => 10],
            ['kode' => 'b1_ptk', 'section' => 'bidang_1', 'tipe' => 'pelaksana', 'nama_jabatan' => 'Penelaah Teknis Kebijakan', 'kelas' => 7, 'kebutuhan' => 6, 'urutan' => 11],
            ['kode' => 'b1_pdi', 'section' => 'bidang_1', 'tipe' => 'pelaksana', 'nama_jabatan' => 'Pengolah Data dan Informasi', 'kelas' => 6, 'kebutuhan' => 1, 'urutan' => 12],

            // Kolom 2: Bidang Pendidikan dan Pelatihan Kekanseleraian
            ['kode' => 'b2_head', 'section' => 'bidang_2_head', 'tipe' => 'struktural', 'nama_jabatan' => 'KEPALA BIDANG PENDIDIKAN DAN PELATIHAN KEKANSELERAIAN', 'kelas' => 13, 'kebutuhan' => 1, 'urutan' => 1],
            ['kode' => 'b2_diplomat_muda', 'section' => 'bidang_2', 'tipe' => 'fungsional', 'nama_jabatan' => 'Diplomat Ahli Muda', 'kelas' => 10, 'kebutuhan' => 1, 'urutan' => 1],
            ['kode' => 'b2_bangkom_muda', 'section' => 'bidang_2', 'tipe' => 'fungsional', 'nama_jabatan' => 'Analis Pengembangan Kompetensi ASN Ahli Muda', 'kelas' => 10, 'kebutuhan' => 3, 'urutan' => 2],
            ['kode' => 'b2_pk_muda', 'section' => 'bidang_2', 'tipe' => 'fungsional', 'nama_jabatan' => 'Penata Kanselerai Ahli Muda', 'kelas' => 9, 'kebutuhan' => 1, 'urutan' => 3],
            ['kode' => 'b2_pk_pertama', 'section' => 'bidang_2', 'tipe' => 'fungsional', 'nama_jabatan' => 'Penata Kanselerai Ahli Pertama', 'kelas' => 8, 'kebutuhan' => 1, 'urutan' => 4],
            ['kode' => 'b2_bangkom_pertama', 'section' => 'bidang_2', 'tipe' => 'fungsional', 'nama_jabatan' => 'Analis Pengembangan Kompetensi ASN Ahli Pertama', 'kelas' => 8, 'kebutuhan' => 3, 'urutan' => 5],
            ['kode' => 'b2_plo', 'section' => 'bidang_2', 'tipe' => 'pelaksana', 'nama_jabatan' => 'Penata Layanan Operasional', 'kelas' => 7, 'kebutuhan' => 2, 'urutan' => 6],
            ['kode' => 'b2_ptk', 'section' => 'bidang_2', 'tipe' => 'pelaksana', 'nama_jabatan' => 'Penelaah Teknis Kebijakan', 'kelas' => 7, 'kebutuhan' => 5, 'urutan' => 7],
            ['kode' => 'b2_pdi', 'section' => 'bidang_2', 'tipe' => 'pelaksana', 'nama_jabatan' => 'Pengolah Data dan Informasi', 'kelas' => 6, 'kebutuhan' => 1, 'urutan' => 8],
            ['kode' => 'b2_olo', 'section' => 'bidang_2', 'tipe' => 'pelaksana', 'nama_jabatan' => 'Operator Layanan Operasional', 'kelas' => 5, 'kebutuhan' => 1, 'urutan' => 9],
            ['kode' => 'b2_alih_daya', 'section' => 'bidang_2_alih_daya', 'tipe' => 'alih_daya', 'nama_jabatan' => 'Tenaga Alih Daya', 'kelas' => null, 'kebutuhan' => 1, 'urutan' => 1],

            // Kolom 3: Bidang Pendidikan dan Pelatihan Pengelolaan Informasi Diplomatik
            ['kode' => 'b3_head', 'section' => 'bidang_3_head', 'tipe' => 'struktural', 'nama_jabatan' => 'KEPALA BIDANG PENDIDIKAN DAN PELATIHAN PENGELOLAAN INFORMASI DIPLOMATIK', 'kelas' => 13, 'kebutuhan' => 1, 'urutan' => 1],
            ['kode' => 'b3_diplomat_muda', 'section' => 'bidang_3', 'tipe' => 'fungsional', 'nama_jabatan' => 'Diplomat Ahli Muda', 'kelas' => 10, 'kebutuhan' => 1, 'urutan' => 1],
            ['kode' => 'b3_bangkom_muda', 'section' => 'bidang_3', 'tipe' => 'fungsional', 'nama_jabatan' => 'Analis Bangkom ASN Ahli Muda', 'kelas' => 10, 'kebutuhan' => 3, 'urutan' => 2],
            ['kode' => 'b3_pid_muda', 'section' => 'bidang_3', 'tipe' => 'fungsional', 'nama_jabatan' => 'Pranata Informasi Diplomatik Ahli Muda', 'kelas' => 9, 'kebutuhan' => 1, 'urutan' => 3],
            ['kode' => 'b3_pid_pertama', 'section' => 'bidang_3', 'tipe' => 'fungsional', 'nama_jabatan' => 'Pranata Informasi Diplomatik Ahli Pertama', 'kelas' => 8, 'kebutuhan' => 1, 'urutan' => 4],
            ['kode' => 'b3_bangkom_pertama', 'section' => 'bidang_3', 'tipe' => 'fungsional', 'nama_jabatan' => 'Analis Bangkom ASN Ahli Pertama', 'kelas' => 8, 'kebutuhan' => 3, 'urutan' => 5],
            ['kode' => 'b3_plo', 'section' => 'bidang_3', 'tipe' => 'pelaksana', 'nama_jabatan' => 'Penata Layanan Operasional', 'kelas' => 7, 'kebutuhan' => 1, 'urutan' => 6],
            ['kode' => 'b3_ptk', 'section' => 'bidang_3', 'tipe' => 'pelaksana', 'nama_jabatan' => 'Penelaah Teknis Kebijakan', 'kelas' => 7, 'kebutuhan' => 5, 'urutan' => 7],
            ['kode' => 'b3_pdi', 'section' => 'bidang_3', 'tipe' => 'pelaksana', 'nama_jabatan' => 'Pengolah Data dan Informasi', 'kelas' => 6, 'kebutuhan' => 1, 'urutan' => 8],
            ['kode' => 'b3_olo', 'section' => 'bidang_3', 'tipe' => 'pelaksana', 'nama_jabatan' => 'Operator Layanan Operasional', 'kelas' => 5, 'kebutuhan' => 1, 'urutan' => 9],

            // Kelompok Jabatan Fungsional Madya & Widyaiswara (di bawah Kolom 3)
            ['kode' => 'jf_diplomat_madya', 'section' => 'bidang_3_jf_madya', 'tipe' => 'fungsional', 'nama_jabatan' => 'Diplomat Ahli Madya', 'kelas' => 12, 'kebutuhan' => 5, 'urutan' => 1],
            ['kode' => 'jf_widyaiswara_madya', 'section' => 'bidang_3_jf_madya', 'tipe' => 'fungsional', 'nama_jabatan' => 'Widyaiswara Ahli Madya', 'kelas' => 12, 'kebutuhan' => 3, 'urutan' => 2],
            ['kode' => 'jf_pk_madya', 'section' => 'bidang_3_jf_madya', 'tipe' => 'fungsional', 'nama_jabatan' => 'Penata Kanselerai Ahli Madya', 'kelas' => 11, 'kebutuhan' => 1, 'urutan' => 3],
            ['kode' => 'jf_pid_madya', 'section' => 'bidang_3_jf_madya', 'tipe' => 'fungsional', 'nama_jabatan' => 'Pranata Informasi Diplomatik Ahli Madya', 'kelas' => 11, 'kebutuhan' => 1, 'urutan' => 4],
            ['kode' => 'jf_arsiparis_madya', 'section' => 'bidang_3_jf_madya', 'tipe' => 'fungsional', 'nama_jabatan' => 'Arsiparis Ahli Madya', 'kelas' => 11, 'kebutuhan' => 1, 'urutan' => 5],
            ['kode' => 'jf_pustakawan_madya', 'section' => 'bidang_3_jf_madya', 'tipe' => 'fungsional', 'nama_jabatan' => 'Pustakawan Ahli Madya', 'kelas' => 11, 'kebutuhan' => 2, 'urutan' => 6],
            ['kode' => 'jf_widyaiswara_muda', 'section' => 'bidang_3_jf_madya', 'tipe' => 'fungsional', 'nama_jabatan' => 'Widyaiswara Ahli Muda', 'kelas' => 10, 'kebutuhan' => 3, 'urutan' => 7],
            ['kode' => 'jf_widyaiswara_pertama', 'section' => 'bidang_3_jf_madya', 'tipe' => 'fungsional', 'nama_jabatan' => 'Widyaiswara Ahli Pertama', 'kelas' => 8, 'kebutuhan' => 3, 'urutan' => 8],

            // Kolom 4: Bidang Kerja Sama dan Fasilitasi Pendidikan dan Pelatihan
            ['kode' => 'b4_head', 'section' => 'bidang_4_head', 'tipe' => 'struktural', 'nama_jabatan' => 'KEPALA BIDANG KERJA SAMA DAN FASILITASI PENDIDIKAN DAN PELATIHAN', 'kelas' => 13, 'kebutuhan' => 1, 'urutan' => 1],
            ['kode' => 'b4_diplomat_muda', 'section' => 'bidang_4', 'tipe' => 'fungsional', 'nama_jabatan' => 'Diplomat Ahli Muda', 'kelas' => 10, 'kebutuhan' => 2, 'urutan' => 1],
            ['kode' => 'b4_bangkom_muda', 'section' => 'bidang_4', 'tipe' => 'fungsional', 'nama_jabatan' => 'Analis Bangkom ASN Ahli Muda', 'kelas' => 10, 'kebutuhan' => 3, 'urutan' => 2],
            ['kode' => 'b4_diplomat_pertama', 'section' => 'bidang_4', 'tipe' => 'fungsional', 'nama_jabatan' => 'Diplomat Ahli Pertama', 'kelas' => 8, 'kebutuhan' => 1, 'urutan' => 3],
            ['kode' => 'b4_bangkom_pertama', 'section' => 'bidang_4', 'tipe' => 'fungsional', 'nama_jabatan' => 'Analis Bangkom ASN Ahli Pertama', 'kelas' => 8, 'kebutuhan' => 3, 'urutan' => 4],
            ['kode' => 'b4_plo', 'section' => 'bidang_4', 'tipe' => 'pelaksana', 'nama_jabatan' => 'Penata Layanan Operasional', 'kelas' => 7, 'kebutuhan' => 2, 'urutan' => 5],
            ['kode' => 'b4_ptk', 'section' => 'bidang_4', 'tipe' => 'pelaksana', 'nama_jabatan' => 'Penelaah Teknis Kebijakan', 'kelas' => 7, 'kebutuhan' => 5, 'urutan' => 6],
            ['kode' => 'b4_pdi', 'section' => 'bidang_4', 'tipe' => 'pelaksana', 'nama_jabatan' => 'Pengolah Data dan Informasi', 'kelas' => 6, 'kebutuhan' => 1, 'urutan' => 7],
            ['kode' => 'b4_olo', 'section' => 'bidang_4', 'tipe' => 'pelaksana', 'nama_jabatan' => 'Operator Layanan Operasional', 'kelas' => 5, 'kebutuhan' => 1, 'urutan' => 8],

            // Kolom 5: Kepala Bagian Tata Usaha
            ['kode' => 'tu_head', 'section' => 'bagian_tu_head', 'tipe' => 'struktural', 'nama_jabatan' => 'KEPALA BAGIAN TATA USAHA', 'kelas' => 13, 'kebutuhan' => 1, 'urutan' => 1],

            // Subbagian Perencanaan Kinerja dan Keuangan
            ['kode' => 'tu_keu_head', 'section' => 'tu_subbag_keuangan_head', 'tipe' => 'struktural', 'nama_jabatan' => 'Kepala Subbagian Perencanaan Kinerja dan Keuangan', 'kelas' => 10, 'kebutuhan' => 1, 'urutan' => 1],
            ['kode' => 'tu_keu_pk_muda', 'section' => 'tu_subbag_keuangan', 'tipe' => 'fungsional', 'nama_jabatan' => 'Penata Kanselerai Ahli Muda', 'kelas' => 9, 'kebutuhan' => 1, 'urutan' => 1],
            ['kode' => 'tu_keu_arsiparis_muda', 'section' => 'tu_subbag_keuangan', 'tipe' => 'fungsional', 'nama_jabatan' => 'Arsiparis Ahli Muda', 'kelas' => 9, 'kebutuhan' => 1, 'urutan' => 2],
            ['kode' => 'tu_keu_pk_pertama', 'section' => 'tu_subbag_keuangan', 'tipe' => 'fungsional', 'nama_jabatan' => 'Penata Kanselerai Ahli Pertama', 'kelas' => 8, 'kebutuhan' => 1, 'urutan' => 3],
            ['kode' => 'tu_keu_pid_pertama', 'section' => 'tu_subbag_keuangan', 'tipe' => 'fungsional', 'nama_jabatan' => 'Pranata Informasi Diplomatik Ahli Pertama', 'kelas' => 8, 'kebutuhan' => 1, 'urutan' => 4],
            ['kode' => 'tu_keu_arsiparis_pertama', 'section' => 'tu_subbag_keuangan', 'tipe' => 'fungsional', 'nama_jabatan' => 'Arsiparis Ahli Pertama', 'kelas' => 8, 'kebutuhan' => 1, 'urutan' => 5],
            ['kode' => 'tu_keu_perencana_pertama', 'section' => 'tu_subbag_keuangan', 'tipe' => 'fungsional', 'nama_jabatan' => 'Perencana Ahli Pertama', 'kelas' => 8, 'kebutuhan' => 2, 'urutan' => 6],
            ['kode' => 'tu_keu_plo', 'section' => 'tu_subbag_keuangan', 'tipe' => 'pelaksana', 'nama_jabatan' => 'Penata Layanan Operasional', 'kelas' => 7, 'kebutuhan' => 2, 'urutan' => 7],
            ['kode' => 'tu_keu_ptk', 'section' => 'tu_subbag_keuangan', 'tipe' => 'pelaksana', 'nama_jabatan' => 'Penelaah Teknis Kebijakan', 'kelas' => 7, 'kebutuhan' => 5, 'urutan' => 8],
            ['kode' => 'tu_keu_pdi', 'section' => 'tu_subbag_keuangan', 'tipe' => 'pelaksana', 'nama_jabatan' => 'Pengolah Data dan Informasi', 'kelas' => 6, 'kebutuhan' => 1, 'urutan' => 9],
            ['kode' => 'tu_keu_pengelola_lo', 'section' => 'tu_subbag_keuangan', 'tipe' => 'pelaksana', 'nama_jabatan' => 'Pengelola Layanan Operasional', 'kelas' => 6, 'kebutuhan' => 1, 'urutan' => 10],

            // Subbagian SDM dan Umum
            ['kode' => 'tu_sdm_head', 'section' => 'tu_subbag_sdm_head', 'tipe' => 'struktural', 'nama_jabatan' => 'Kepala Subbagian SDM dan Umum', 'kelas' => 10, 'kebutuhan' => 1, 'urutan' => 1],
            ['kode' => 'tu_sdm_pk_muda', 'section' => 'tu_subbag_sdm', 'tipe' => 'fungsional', 'nama_jabatan' => 'Penata Kanselerai Ahli Muda', 'kelas' => 9, 'kebutuhan' => 1, 'urutan' => 1],
            ['kode' => 'tu_sdm_pid_muda', 'section' => 'tu_subbag_sdm', 'tipe' => 'fungsional', 'nama_jabatan' => 'Pranata Informasi Diplomatik Ahli Muda', 'kelas' => 9, 'kebutuhan' => 1, 'urutan' => 2],
            ['kode' => 'tu_sdm_arsiparis_muda', 'section' => 'tu_subbag_sdm', 'tipe' => 'fungsional', 'nama_jabatan' => 'Arsiparis Ahli Muda', 'kelas' => 9, 'kebutuhan' => 1, 'urutan' => 3],
            ['kode' => 'tu_sdm_pk_pertama', 'section' => 'tu_subbag_sdm', 'tipe' => 'fungsional', 'nama_jabatan' => 'Penata Kanselerai Ahli Pertama', 'kelas' => 8, 'kebutuhan' => 1, 'urutan' => 4],
            ['kode' => 'tu_sdm_arsiparis_pertama', 'section' => 'tu_subbag_sdm', 'tipe' => 'fungsional', 'nama_jabatan' => 'Arsiparis Ahli Pertama', 'kelas' => 8, 'kebutuhan' => 1, 'urutan' => 5],
            ['kode' => 'tu_sdm_pengelola_lo', 'section' => 'tu_subbag_sdm', 'tipe' => 'pelaksana', 'nama_jabatan' => 'Pengelola Layanan Operasional', 'kelas' => 6, 'kebutuhan' => 1, 'urutan' => 6],

            // Alih Daya TU
            ['kode' => 'tu_alih_daya', 'section' => 'tu_alih_daya', 'tipe' => 'alih_daya', 'nama_jabatan' => 'Tenaga Alih Daya', 'kelas' => null, 'kebutuhan' => 7, 'urutan' => 1],
        ];

        foreach ($positions as $pos) {
            DB::table('peta_jabatan_positions')->updateOrInsert(
                ['kode' => $pos['kode']],
                array_merge($pos, ['created_at' => $now, 'updated_at' => $now])
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('peta_jabatan_assignments');
        Schema::dropIfExists('peta_jabatan_positions');
    }
};
