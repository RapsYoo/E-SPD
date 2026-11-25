<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('surat_tugas', function (Blueprint $table) {
            if (! Schema::hasColumn('surat_tugas', 'is_multi_trip')) {
                $table->boolean('is_multi_trip')->default(false)->after('tempat_tujuan');
            }
            if (! Schema::hasColumn('surat_tugas', 'rute_perjalanan')) {
                $table->json('rute_perjalanan')->nullable()->after('is_multi_trip');
            }
        });
    }

    public function down(): void
    {
        Schema::table('surat_tugas', function (Blueprint $table) {
            $cols = array_filter(
                ['is_multi_trip', 'rute_perjalanan'],
                fn (string $col) => Schema::hasColumn('surat_tugas', $col)
            );
            if ($cols !== []) {
                $table->dropColumn($cols);
            }
        });
    }
};
