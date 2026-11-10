<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('tiket_perjalanan')) {
            return;
        }

        Schema::create('tiket_perjalanan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('surat_tugas_pegawai_id')
                ->constrained('surat_tugas_pegawai')
                ->cascadeOnDelete();
            $table->foreignId('uploaded_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->string('file_path');
            $table->string('original_name');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tiket_perjalanan');
    }
};
