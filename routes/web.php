<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\PegawaiController;
use App\Http\Controllers\Admin\PpkController;
use App\Http\Controllers\Admin\UnitKerjaController;
use App\Http\Controllers\Admin\ReferensiController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('admin.dashboard');
});

Route::get('/dashboard', function () {
    return redirect()->route('admin.dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    // Master Pegawai
    Route::resource('pegawai', PegawaiController::class)->except(['create', 'edit', 'show']);

    // Master PPK
    Route::resource('ppk', PpkController::class)->except(['create', 'edit', 'show']);

    // Master Unit Kerja
    Route::resource('unit-kerja', UnitKerjaController::class)->except(['create', 'edit', 'show']);

    // Referensi
    Route::get('referensi', [ReferensiController::class, 'index'])->name('referensi.index');
    Route::post('referensi/tingkat-biaya', [ReferensiController::class, 'storeTingkatBiaya'])->name('referensi.tingkat-biaya.store');
    Route::put('referensi/tingkat-biaya/{tingkatBiaya}', [ReferensiController::class, 'updateTingkatBiaya'])->name('referensi.tingkat-biaya.update');
    Route::delete('referensi/tingkat-biaya/{tingkatBiaya}', [ReferensiController::class, 'destroyTingkatBiaya'])->name('referensi.tingkat-biaya.destroy');

    Route::post('referensi/jenis-angkutan', [ReferensiController::class, 'storeJenisAngkutan'])->name('referensi.jenis-angkutan.store');
    Route::put('referensi/jenis-angkutan/{jenisAngkutan}', [ReferensiController::class, 'updateJenisAngkutan'])->name('referensi.jenis-angkutan.update');
    Route::delete('referensi/jenis-angkutan/{jenisAngkutan}', [ReferensiController::class, 'destroyJenisAngkutan'])->name('referensi.jenis-angkutan.destroy');
});

require __DIR__.'/auth.php';

