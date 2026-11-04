<?php

use App\Models\UptBidang;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('upt_bidang', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 50)->unique();
            $table->string('nama')->unique();
            $table->string('keterangan')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        $now = now();
        foreach (UptBidang::DEFAULT_ITEMS as $item) {
            DB::table('upt_bidang')->insert([
                'kode' => $item['kode'],
                'nama' => $item['nama'],
                'keterangan' => $item['keterangan'],
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        Schema::table('pegawai', function (Blueprint $table) {
            $table->foreignId('upt_bidang_id')
                ->nullable()
                ->after('agama')
                ->constrained('upt_bidang')
                ->nullOnDelete();
        });

        // Tautkan data pegawai yang sudah memiliki nilai teks upt_bidang ke upt_bidang_id
        $map = DB::table('upt_bidang')->pluck('id', 'nama');
        foreach ($map as $nama => $id) {
            DB::table('pegawai')
                ->where('upt_bidang', $nama)
                ->update(['upt_bidang_id' => $id]);
        }
    }

    public function down(): void
    {
        Schema::table('pegawai', function (Blueprint $table) {
            $table->dropConstrainedForeignId('upt_bidang_id');
        });

        Schema::dropIfExists('upt_bidang');
    }
};
