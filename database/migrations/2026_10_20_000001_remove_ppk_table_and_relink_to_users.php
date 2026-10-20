<?php

use App\Models\Pegawai;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Hubungkan user role PPK ke data pegawai
        $georgePegawai = Pegawai::where('nama', 'like', '%George Junior%')->first();
        $georgeUser = User::where('role', 'ppk')->first();
        if ($georgeUser && $georgePegawai && !$georgeUser->pegawai_id) {
            $georgeUser->update([
                'pegawai_id' => $georgePegawai->id,
                'name' => $georgePegawai->nama,
            ]);
        }

        // 2. Lepas foreign key lama surat_tugas -> ppk jika masih ada
        if (Schema::hasTable('surat_tugas')) {
            try {
                Schema::table('surat_tugas', function (Blueprint $table) {
                    $table->dropForeign(['ppk_id']);
                });
            } catch (\Throwable $e) {
                // Ignore jika FK sudah tidak ada
            }

            // 3. Remap ppk_id ke user ber-role ppk
            if ($georgeUser) {
                DB::table('surat_tugas')->whereNotNull('ppk_id')->update(['ppk_id' => $georgeUser->id]);
            }

            // Pastikan tidak ada ppk_id yang menunjuk user yang tidak valid
            $validUserIds = DB::table('users')->pluck('id')->toArray();
            DB::table('surat_tugas')
                ->whereNotNull('ppk_id')
                ->whereNotIn('ppk_id', $validUserIds)
                ->update(['ppk_id' => null]);

            // 4. Tambahkan foreign key baru surat_tugas -> users(id)
            try {
                Schema::table('surat_tugas', function (Blueprint $table) {
                    $table->foreign('ppk_id')->references('id')->on('users')->nullOnDelete();
                });
            } catch (\Throwable $e) {
                // Ignore jika sudah ada
            }
        }

        // 5. Hapus tabel ppk
        Schema::dropIfExists('ppk');
    }

    public function down(): void
    {
        // 1. Buat kembali tabel ppk
        Schema::create('ppk', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->string('nip')->unique();
            $table->string('jabatan')->default('Pejabat Pembuat Komitmen');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2. Lepas FK ke users dan pasang kembali ke ppk
        if (Schema::hasTable('surat_tugas')) {
            try {
                Schema::table('surat_tugas', function (Blueprint $table) {
                    $table->dropForeign(['ppk_id']);
                    $table->foreign('ppk_id')->references('id')->on('ppk')->nullOnDelete();
                });
            } catch (\Throwable $e) {
                // Ignore
            }
        }
    }
};
