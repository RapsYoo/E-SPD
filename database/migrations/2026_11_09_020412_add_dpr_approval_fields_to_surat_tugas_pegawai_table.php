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
        Schema::table('surat_tugas_pegawai', function (Blueprint $table) {
            $table->string('dpr_status')->default('DRAFT')->index();
            $table->timestamp('dpr_submitted_at')->nullable();
            $table->foreignId('dpr_approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('dpr_approved_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('surat_tugas_pegawai', function (Blueprint $table) {
            $table->dropConstrainedForeignId('dpr_approved_by');
            $table->dropIndex(['dpr_status']);
            $table->dropColumn(['dpr_status', 'dpr_submitted_at', 'dpr_approved_at']);
        });
    }
};
