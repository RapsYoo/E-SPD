<?php

use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\PegawaiController;
use App\Http\Controllers\Admin\RbacController;
use App\Http\Controllers\Admin\ReferensiController;
use App\Http\Controllers\Admin\UnitKerjaController;
use App\Http\Controllers\Admin\UptBidangController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Pegawai\TiketPerjalananController;
use App\Http\Controllers\PegawaiDirectoryController;
use App\Http\Controllers\Ppk\DprController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RekapitulasiController;
use App\Http\Controllers\RekapJalisPegawaiController;
use App\Http\Controllers\SuratTugasController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    if (! auth()->check()) {
        return redirect()->route('login');
    }

    return redirect()->route('dashboard');
});

Route::get('/dashboard', [DashboardController::class, 'index'])->middleware('auth')->name('dashboard');
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // P0: proteksi lapis route berbasis modul RBAC dinamis.
    // PENTING: route statis /create harus di atas wildcard {suratTugas} agar tidak dikira id.
    Route::middleware('module:surat_tugas.create')->group(function () {
        Route::get('/surat-tugas/create', [SuratTugasController::class, 'create'])->name('surat-tugas.create');
        Route::post('/surat-tugas/draft', [SuratTugasController::class, 'storeDraft'])->name('surat-tugas.draft.store');
        Route::get('/surat-tugas/{suratTugas}/draft', [SuratTugasController::class, 'editDraft'])->name('surat-tugas.draft.edit');
        Route::post('/surat-tugas/{suratTugas}/draft', [SuratTugasController::class, 'updateDraft'])->name('surat-tugas.draft.update');
        Route::post('/surat-tugas', [SuratTugasController::class, 'store'])->name('surat-tugas.store');
    });

    // Lihat semua usulan — dikontrol via modul surat_tugas.view.
    Route::middleware('module:surat_tugas.view')->group(function () {
        Route::get('/surat-tugas', [SuratTugasController::class, 'index'])->name('surat-tugas.index');
        Route::get('/surat-tugas/{suratTugas}', [SuratTugasController::class, 'show'])->name('surat-tugas.show');
    });

    // Aksi per tahapan kerja.
    Route::post('/surat-tugas/{suratTugas}/actor-draft', [SuratTugasController::class, 'saveActorDraft'])->middleware('module:surat_tugas.disposisi,surat_tugas.penomoran,surat_tugas.sign_ppk')->name('surat-tugas.actor-draft');
    Route::post('/surat-tugas/{suratTugas}/disposisi', [SuratTugasController::class, 'disposisi'])->middleware('module:surat_tugas.disposisi')->name('surat-tugas.disposisi');
    Route::post('/surat-tugas/{suratTugas}/penomoran', [SuratTugasController::class, 'penomoran'])->middleware('module:surat_tugas.penomoran')->name('surat-tugas.penomoran');
    Route::post('/surat-tugas/{suratTugas}/sign-ppk', [SuratTugasController::class, 'signPpk'])->middleware('module:surat_tugas.sign_ppk')->name('surat-tugas.sign-ppk');
    // Usulan yang dihentikan Kapus dapat diajukan ulang.
    Route::post('/surat-tugas/{suratTugas}/ajukan-ulang', [SuratTugasController::class, 'ajukanUlang'])->middleware('module:surat_tugas.create')->name('surat-tugas.ajukan-ulang');

    // Rekapitulasi & ekspor laporan perjalanan dinas.
    Route::middleware('module:rekapitulasi.view')->group(function () {
        Route::get('/rekapitulasi', [RekapitulasiController::class, 'index'])->name('rekapitulasi.index');
        Route::get('/rekapitulasi/export', [RekapitulasiController::class, 'export'])->name('rekapitulasi.export');
    });

    // Rekapitulasi Jaldis (Perjalanan Dinas) & Biaya per Pegawai (Diagram + List)
    Route::middleware('module:rekap_pegawai.view')->group(function () {
        Route::get('/rekapitulasi-pegawai', [RekapJalisPegawaiController::class, 'index'])->name('rekapitulasi-pegawai.index');
        Route::get('/rekapitulasi-pegawai/export', [RekapJalisPegawaiController::class, 'export'])->name('rekapitulasi-pegawai.export');
    });
    Route::middleware('module:rekap_pegawai.edit_biaya')->group(function () {
        Route::put('/rekapitulasi-pegawai/biaya/{suratTugasPegawai}', [RekapJalisPegawaiController::class, 'updateBiaya'])->name('rekapitulasi-pegawai.update-biaya');
        Route::put('/rekapitulasi-pegawai/tarif', [RekapJalisPegawaiController::class, 'updateTarif'])->name('rekapitulasi-pegawai.update-tarif');
    });

    // P1: cetak akses luas — dikontrol via modul surat_tugas.print + otorisasi detail di controller.
    Route::get('/surat-tugas/{suratTugas}/cetak', [SuratTugasController::class, 'cetak'])->middleware('module:surat_tugas.print')->name('surat-tugas.cetak');

    // Direktori pegawai read-only.
    Route::get('/pegawai', [PegawaiDirectoryController::class, 'index'])->middleware('module:pegawai_directory.view')->name('pegawai.index');

    Route::middleware('module:dpr.upload_tiket')->group(function () {
        Route::post('/surat-tugas/{suratTugas}/tiket', [TiketPerjalananController::class, 'store'])->name('pegawai.tiket.store');
        Route::get('/surat-tugas/{suratTugas}/tiket/{ticket}', [TiketPerjalananController::class, 'download'])->name('pegawai.tiket.download');
        Route::get('/surat-tugas/{suratTugas}/pengeluaran-rill', [TiketPerjalananController::class, 'cetakPengeluaranRill'])->name('pegawai.pengeluaran-rill');
    });

    Route::middleware('module:dpr.manage_ppk')->prefix('ppk')->name('ppk.')->group(function () {
        Route::get('/dpr', [DprController::class, 'index'])->name('dpr.index');
        Route::get('/dpr/{suratTugas}/{peserta}/cetak', [DprController::class, 'cetak'])->name('dpr.cetak');
        Route::get('/dpr/{suratTugas}/{peserta}/tiket/{ticket}', [DprController::class, 'downloadTicket'])->name('dpr.ticket.download');
        Route::post('/dpr/{suratTugas}/{peserta}/approve', [DprController::class, 'approve'])->name('dpr.approve');
    });

    // Hapus histori — admin saja.
    Route::delete('/surat-tugas/{suratTugas}', [SuratTugasController::class, 'destroy'])->middleware('role:admin')->name('surat-tugas.destroy');
});

Route::middleware('auth')->prefix('admin')->name('admin.')->group(function () {
    Route::middleware('role:admin')->group(function () {
        Route::get('/', [AdminDashboardController::class, 'index'])->name('dashboard');

        // Manajemen Akun Pengguna (akun dibuat dari data pegawai)
        Route::resource('users', UserController::class)->except(['create', 'edit', 'show']);

        // Manajemen Hak Akses Role (RBAC)
        Route::get('rbac', [RbacController::class, 'index'])->name('rbac.index');
        Route::put('rbac/{role}', [RbacController::class, 'update'])->name('rbac.update');
        Route::post('rbac/{role}/reset', [RbacController::class, 'reset'])->name('rbac.reset');

        // Master Unit Kerja
        Route::resource('unit-kerja', UnitKerjaController::class)->except(['create', 'edit', 'show']);
    });

    // Master Pegawai (dikontrol RBAC master_pegawai.manage, default: admin)
    Route::middleware('module:master_pegawai.manage')->group(function () {
        Route::resource('pegawai', PegawaiController::class)->except(['create', 'edit', 'show']);
    });

    // Master UPT / Bidang (dikontrol RBAC master_upt.manage, default: admin)
    Route::middleware('module:master_upt.manage')->group(function () {
        Route::resource('upt-bidang', UptBidangController::class)
            ->parameters(['upt-bidang' => 'uptBidang'])
            ->except(['create', 'edit', 'show']);
    });

    // Referensi Biaya & Angkutan (dikontrol RBAC master_referensi.manage, default: admin)
    Route::middleware('module:master_referensi.manage')->group(function () {
        Route::get('referensi', [ReferensiController::class, 'index'])->name('referensi.index');
        Route::post('referensi/tingkat-biaya', [ReferensiController::class, 'storeTingkatBiaya'])->name('referensi.tingkat-biaya.store');
        Route::put('referensi/tingkat-biaya/{tingkatBiaya}', [ReferensiController::class, 'updateTingkatBiaya'])->name('referensi.tingkat-biaya.update');
        Route::delete('referensi/tingkat-biaya/{tingkatBiaya}', [ReferensiController::class, 'destroyTingkatBiaya'])->name('referensi.tingkat-biaya.destroy');

        Route::post('referensi/jenis-angkutan', [ReferensiController::class, 'storeJenisAngkutan'])->name('referensi.jenis-angkutan.store');
        Route::put('referensi/jenis-angkutan/{jenisAngkutan}', [ReferensiController::class, 'updateJenisAngkutan'])->name('referensi.jenis-angkutan.update');
        Route::delete('referensi/jenis-angkutan/{jenisAngkutan}', [ReferensiController::class, 'destroyJenisAngkutan'])->name('referensi.jenis-angkutan.destroy');
    });
});

require __DIR__.'/auth.php';
