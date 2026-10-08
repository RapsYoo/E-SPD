<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('surat_tugas_biaya', function (Blueprint $table) {
            $table->id();
            $table->foreignId('surat_tugas_id')->constrained('surat_tugas')->cascadeOnDelete();
            $table->foreignId('surat_tugas_pegawai_id')->constrained('surat_tugas_pegawai')->cascadeOnDelete();

            // 1. Uang Harian
            $table->integer('uang_harian_hari')->default(0);
            $table->decimal('uang_harian_tarif', 15, 2)->default(0);
            $table->decimal('uang_harian_persen', 5, 2)->default(100.00);
            $table->decimal('uang_harian_total', 15, 2)->default(0);

            // 2. Representasi
            $table->integer('representasi_hari')->default(0);
            $table->decimal('representasi_tarif', 15, 2)->default(0);
            $table->decimal('representasi_persen', 5, 2)->default(100.00);
            $table->decimal('representasi_total', 15, 2)->default(0);

            // 3. Transportasi Asal / Kedudukan (misal Jakarta)
            $table->integer('transport_asal_kali')->default(0);
            $table->decimal('transport_asal_tarif', 15, 2)->default(0);
            $table->decimal('transport_asal_persen', 5, 2)->default(100.00);
            $table->decimal('transport_asal_total', 15, 2)->default(0);

            // 4. Transportasi Tujuan / Lokal (misal Semarang)
            $table->integer('transport_tujuan_kali')->default(0);
            $table->decimal('transport_tujuan_tarif', 15, 2)->default(0);
            $table->decimal('transport_tujuan_persen', 5, 2)->default(100.00);
            $table->decimal('transport_tujuan_total', 15, 2)->default(0);

            // 5. Akomodasi / Penginapan
            $table->integer('akomodasi_malam')->default(0);
            $table->decimal('akomodasi_tarif', 15, 2)->default(0);
            $table->decimal('akomodasi_persen', 5, 2)->default(100.00);
            $table->decimal('akomodasi_total', 15, 2)->default(0);
            $table->enum('status_menginap', ['HOTEL', 'TIDAK_MENGINAP_30', 'TIDAK_ADA'])->default('HOTEL');

            // 6. Daftar Pengeluaran Riil (Lampiran IX PMK 113)
            $table->decimal('pengeluaran_riil_transport', 15, 2)->default(0);
            $table->decimal('pengeluaran_riil_penginapan_30', 15, 2)->default(0);
            $table->decimal('pengeluaran_riil_total', 15, 2)->default(0);

            // 7. Total Penerimaan & Rampung
            $table->decimal('total_biaya', 15, 2)->default(0);
            $table->decimal('uang_muka', 15, 2)->default(0); // Yang telah dibayar semula
            $table->decimal('sisa_kurang_lebih', 15, 2)->default(0); // Sisa kurang/lebih

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('surat_tugas_biaya');
    }
};
