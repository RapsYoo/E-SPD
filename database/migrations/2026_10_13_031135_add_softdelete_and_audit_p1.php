<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // P1: soft-delete agar histori tidak hilang permanen (recoverable).
        Schema::table('surat_tugas', function (Blueprint $table) {
            $table->softDeletes()->after('updated_at');
        });

        // P1: audit trail siapa -> aksi apa -> status dari -> ke.
        Schema::create('surat_tugas_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('surat_tugas_id')->constrained('surat_tugas')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('aksi', 50); // BUAT, DRAFT, DISPOSISI_YA, PENOMORAN, TTD_PPK, HAPUS, CETAK
            $table->string('dari_status', 50)->nullable();
            $table->string('ke_status', 50)->nullable();
            $table->text('catatan')->nullable();
            $table->timestamps();
            $table->index(['surat_tugas_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('surat_tugas_logs');
        Schema::table('surat_tugas', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
