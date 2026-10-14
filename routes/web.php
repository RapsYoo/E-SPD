<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\PegawaiController;
use App\Http\Controllers\Admin\PpkController;
use App\Http\Controllers\Admin\UnitKerjaController;
use App\Http\Controllers\Admin\ReferensiController;
use App\Http\Controllers\SuratTugasController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (!auth()->check()) {
        return redirect()->route('login');
    }

    return redirect()->route(auth()->user()->role === 'admin' ? 'admin.dashboard' : 'surat-tugas.index');
});

Route::get('/dashboard', function () {
    return redirect()->route(auth()->user()->role === 'admin' ? 'admin.dashboard' : 'surat-tugas.index');
})->middleware('auth')->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // P0: proteksi lapis route (defense-in-depth, controller tetap cek inline per status).
    // PENTING: route statis /create harus di atas wildcard {suratTugas} agar tidak dikira id.
    // Buat usulan + draft awal — hanya pemohon/sespalu/admin.
    Route::middleware('role:pemohon,sespalu,admin')->group(function () {
        Route::get('/surat-tugas/create', [SuratTugasController::class, 'create'])->name('surat-tugas.create');
        Route::post('/surat-tugas/draft', [SuratTugasController::class, 'storeDraft'])->name('surat-tugas.draft.store');
        Route::get('/surat-tugas/{suratTugas}/draft', [SuratTugasController::class, 'editDraft'])->name('surat-tugas.draft.edit');
        Route::post('/surat-tugas/{suratTugas}/draft', [SuratTugasController::class, 'updateDraft'])->name('surat-tugas.draft.update');
        Route::post('/surat-tugas', [SuratTugasController::class, 'store'])->name('surat-tugas.store');
    });

    // Lihat semua usulan — semua role internal boleh masuk, scoping milik sendiri tetap di controller.
    Route::middleware('role:admin,pemohon,sespalu,kapus,tu,ppk')->group(function () {
        Route::get('/surat-tugas', [SuratTugasController::class, 'index'])->name('surat-tugas.index');
        Route::get('/surat-tugas/{suratTugas}', [SuratTugasController::class, 'show'])->name('surat-tugas.show');
    });

    // Aksi per tahapan kerja.
    Route::post('/surat-tugas/{suratTugas}/actor-draft', [SuratTugasController::class, 'saveActorDraft'])->middleware('role:kapus,tu,ppk,admin')->name('surat-tugas.actor-draft');
    Route::post('/surat-tugas/{suratTugas}/disposisi', [SuratTugasController::class, 'disposisi'])->middleware('role:kapus,admin')->name('surat-tugas.disposisi');
    Route::post('/surat-tugas/{suratTugas}/penomoran', [SuratTugasController::class, 'penomoran'])->middleware('role:tu,admin')->name('surat-tugas.penomoran');
    Route::post('/surat-tugas/{suratTugas}/sign-ppk', [SuratTugasController::class, 'signPpk'])->middleware('role:ppk,admin')->name('surat-tugas.sign-ppk');
    // P1: cetak akses luas — middleware longgar (semua role internal), otorisasi detail (owner/role+status) di controller.
    Route::get('/surat-tugas/{suratTugas}/cetak', [SuratTugasController::class, 'cetak'])->middleware('role:admin,pemohon,sespalu,kapus,tu,ppk')->name('surat-tugas.cetak');

    // Hapus histori — admin saja.
    Route::delete('/surat-tugas/{suratTugas}', [SuratTugasController::class, 'destroy'])->middleware('role:admin')->name('surat-tugas.destroy');
});

Route::middleware(['auth', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
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