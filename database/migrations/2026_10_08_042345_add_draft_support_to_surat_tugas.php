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
        Schema::table('surat_tugas', function (Blueprint $table) {
            $table->integer('draft_step')->default(1)->after('status');
            $table->string('nomor_nota')->nullable()->change();
            $table->string('pengirim_nota')->nullable()->change();
            $table->date('tanggal_nota')->nullable()->change();
            $table->text('perihal_nota')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('surat_tugas', function (Blueprint $table) {
            $table->dropColumn('draft_step');
        });
    }
};
