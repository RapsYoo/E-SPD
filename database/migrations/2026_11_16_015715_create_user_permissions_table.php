<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Hak akses modul tambahan yang diberikan khusus ke akun tertentu (di luar hak akses role).
     */
    public function up(): void
    {
        if (Schema::hasTable('user_permissions')) {
            return;
        }

        Schema::create('user_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('module_key', 64);
            $table->timestamps();

            $table->unique(['user_id', 'module_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_permissions');
    }
};
