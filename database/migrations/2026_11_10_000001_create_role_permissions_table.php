<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('role_permissions')) {
            return;
        }

        Schema::create('role_permissions', function (Blueprint $table) {
            $table->id();
            $table->string('role', 32)->index();
            $table->string('module_key', 64);
            $table->boolean('is_enabled')->default(true);
            $table->timestamps();

            $table->unique(['role', 'module_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('role_permissions');
    }
};

