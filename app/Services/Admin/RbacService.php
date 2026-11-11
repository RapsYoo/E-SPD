<?php

namespace App\Services\Admin;

use App\Models\RolePermission;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

class RbacService
{
    public const CACHE_KEY = 'rbac.role_permissions.v1';

    /**
     * Daftar role yang dapat diatur hak aksesnya oleh Admin Master.
     *
     * @var array<string, array{label: string, description: string, badge: string}>
     */
    public const MANAGEABLE_ROLES = [
        'pemohon' => [
            'label' => 'Pemohon',
            'description' => 'Konseptor / pengaju usulan perjalanan dinas unit.',
            'badge' => 'Pemohon Usulan',
        ],
        'sespalu' => [
            'label' => 'Sesparlu',
            'description' => 'Sekretariat Pusdiklat pengelola nota & draft ST/SPD.',
            'badge' => 'Sekretariat',
        ],
        'kapus' => [
            'label' => 'Kepala Pusat (Kapus)',
            'description' => 'Pejabat pemberi disposisi persetujuan Surat Tugas.',
            'badge' => 'Pejabat Disposisi',
        ],
        'tu' => [
            'label' => 'Tata Usaha (TU)',
            'description' => 'Petugas verifikasi & penerbitan nomor resmi ST dan SPD.',
            'badge' => 'Penomoran Resmi',
        ],
        'ppk' => [
            'label' => 'PPK',
            'description' => 'Pejabat Pembuat Komitmen penandatangan SPD & verifikator DPR.',
            'badge' => 'Komitmen & DPR',
        ],
        'pegawai' => [
            'label' => 'Pegawai',
            'description' => 'Pelaksana perjalanan dinas & pengunggah bukti tiket DPR.',
            'badge' => 'Pelaksana Dinas',
        ],
    ];

    /**
     * Katalog seluruh modul hak akses yang dapat diatur per role.
     *
     * @var array<int, array{key: string, category: string, label: string, description: string, route_hint: string}>
     */
    public const MODULES = [
        [
            'key' => 'surat_tugas.view',
            'category' => 'Dokumen Jaldis',
            'label' => 'Lihat Daftar & Detail Jaldis',
            'description' => 'Menampilkan menu Daftar Jaldis di sidebar serta membuka halaman detail ruang kerja surat.',
            'route_hint' => '/surat-tugas',
        ],
        [
            'key' => 'surat_tugas.create',
            'category' => 'Dokumen Jaldis',
            'label' => 'Buat Penugasan Baru',
            'description' => 'Menampilkan menu Buat Penugasan di sidebar serta mengizinkan pembuatan/penyuntingan draft penugasan.',
            'route_hint' => '/surat-tugas/create',
        ],
        [
            'key' => 'surat_tugas.disposisi',
            'category' => 'Dokumen Jaldis',
            'label' => 'Proses Disposisi Kapus',
            'description' => 'Mengizinkan pemberian keputusan disposisi (Setuju, Revisi, atau Stop) pada usulan Surat Tugas.',
            'route_hint' => 'POST /surat-tugas/{id}/disposisi',
        ],
        [
            'key' => 'surat_tugas.penomoran',
            'category' => 'Dokumen Jaldis',
            'label' => 'Proses Penomoran Resmi TU',
            'description' => 'Mengizinkan pengisian nomor resmi Surat Tugas (ST) & SPD serta menerbitkan dokumen.',
            'route_hint' => 'POST /surat-tugas/{id}/penomoran',
        ],
        [
            'key' => 'surat_tugas.sign_ppk',
            'category' => 'Dokumen Jaldis',
            'label' => 'Sematkan TTD Digital PPK',
            'description' => 'Mengizinkan penyematan atau pembatalan tanda tangan digital PPK pada lembar SPD.',
            'route_hint' => 'POST /surat-tugas/{id}/sign-ppk',
        ],
        [
            'key' => 'surat_tugas.print',
            'category' => 'Dokumen Jaldis',
            'label' => 'Lihat & Cetak Dokumen Resmi',
            'description' => 'Mengizinkan akses halaman pratinjau/cetak Surat Tugas, SPD, Lampiran Matriks, dan Visum.',
            'route_hint' => '/surat-tugas/{id}/cetak',
        ],
        [
            'key' => 'rekapitulasi.view',
            'category' => 'Laporan & Rekapitulasi',
            'label' => 'Menu Rekapitulasi & Ekspor',
            'description' => 'Menampilkan menu Rekapitulasi di sidebar serta mengizinkan ekspor CSV/Excel/Cetak.',
            'route_hint' => '/rekapitulasi',
        ],
        [
            'key' => 'rekap_pegawai.view',
            'category' => 'Laporan & Rekapitulasi',
            'label' => 'Menu Rekap Jaldis & Biaya Pegawai',
            'description' => 'Menampilkan menu Rekap Jaldis Pegawai (grafik kombinasi & daftar rincian biaya) di sidebar.',
            'route_hint' => '/rekapitulasi-pegawai',
        ],
        [
            'key' => 'rekap_pegawai.edit_biaya',
            'category' => 'Laporan & Rekapitulasi',
            'label' => 'Ubah Biaya Riil & Standar Tarif Jaldis',
            'description' => 'Mengizinkan pengubahan nominal biaya riil pegawai dan standar tarif pada halaman Rekap Jaldis Pegawai.',
            'route_hint' => 'PUT /rekapitulasi-pegawai/biaya',
        ],
        [
            'key' => 'dpr.upload_tiket',
            'category' => 'DPR & Bukti Perjalanan',
            'label' => 'Unggah Tiket & Cetak Lembar DPR Pegawai',
            'description' => 'Mengizinkan pegawai mengunggah bukti tiket perjalanan selesai dinas dan mencetak lembar DPR.',
            'route_hint' => '/surat-tugas/{id}/pengeluaran-rill',
        ],
        [
            'key' => 'dpr.manage_ppk',
            'category' => 'DPR & Bukti Perjalanan',
            'label' => 'Menu Kelola DPR & Persetujuan PPK',
            'description' => 'Menampilkan menu Kelola DPR di sidebar serta mengizinkan verifikasi/persetujuan DPR pegawai.',
            'route_hint' => '/ppk/dpr',
        ],
        [
            'key' => 'pegawai_directory.view',
            'category' => 'Direktori & Master Database',
            'label' => 'Menu Direktori Data Pegawai (Read-Only)',
            'description' => 'Menampilkan menu Data Pegawai (mode baca & lihat profil) di sidebar.',
            'route_hint' => '/pegawai',
        ],
        [
            'key' => 'master_pegawai.manage',
            'category' => 'Direktori & Master Database',
            'label' => 'Kelola Master Data Pegawai (CRUD)',
            'description' => 'Menampilkan menu Master Data Pegawai di sidebar & mengizinkan tambah/ubah/hapus pegawai.',
            'route_hint' => '/admin/pegawai',
        ],
        [
            'key' => 'master_upt.manage',
            'category' => 'Direktori & Master Database',
            'label' => 'Kelola Master UPT / Bidang (CRUD)',
            'description' => 'Menampilkan menu Master UPT / Bidang di sidebar & mengizinkan tambah/ubah/hapus UPT.',
            'route_hint' => '/admin/upt-bidang',
        ],
        [
            'key' => 'master_referensi.manage',
            'category' => 'Direktori & Master Database',
            'label' => 'Kelola Master Biaya & Angkutan (CRUD)',
            'description' => 'Menampilkan menu Biaya & Angkutan di sidebar & mengizinkan pengelolaan tingkat biaya dan jenis angkutan.',
            'route_hint' => '/admin/referensi',
        ],
    ];

    /**
     * Hak akses bawaan (default) untuk masing-masing role sesuai alur baku e-SPD Pusdiklat.
     *
     * @var array<string, array<int, string>>
     */
    public const DEFAULT_ROLE_MODULES = [
        'pemohon' => [
            'surat_tugas.view',
            'surat_tugas.create',
            'surat_tugas.print',
        ],
        'sespalu' => [
            'surat_tugas.view',
            'surat_tugas.create',
            'surat_tugas.print',
        ],
        'kapus' => [
            'surat_tugas.view',
            'surat_tugas.disposisi',
            'surat_tugas.print',
            'rekapitulasi.view',
            'rekap_pegawai.view',
        ],
        'tu' => [
            'surat_tugas.view',
            'surat_tugas.penomoran',
            'surat_tugas.print',
            'rekapitulasi.view',
            'rekap_pegawai.view',
            'rekap_pegawai.edit_biaya',
        ],
        'ppk' => [
            'surat_tugas.view',
            'surat_tugas.sign_ppk',
            'surat_tugas.print',
            'rekapitulasi.view',
            'rekap_pegawai.view',
            'rekap_pegawai.edit_biaya',
            'dpr.manage_ppk',
        ],
        'pegawai' => [
            'surat_tugas.view',
            'surat_tugas.print',
            'dpr.upload_tiket',
            'pegawai_directory.view',
        ],
    ];

    /**
     * Semua kode modul yang terdaftar.
     *
     * @return array<int, string>
     */
    public function allModuleKeys(): array
    {
        return array_column(self::MODULES, 'key');
    }

    /**
     * Mengembalikan daftar module_key yang aktif untuk suatu user.
     *
     * @return array<int, string>
     */
    public function permissionsForUser(?User $user): array
    {
        if (! $user) {
            return [];
        }

        if ($user->role === 'admin') {
            return $this->allModuleKeys();
        }

        return $this->permissionsForRole($user->role);
    }

    /**
     * Mengembalikan daftar module_key yang aktif untuk suatu role.
     *
     * @return array<int, string>
     */
    public function permissionsForRole(string $role): array
    {
        if ($role === 'admin') {
            return $this->allModuleKeys();
        }

        $matrix = $this->resolvedMatrix();

        return $matrix[$role] ?? (self::DEFAULT_ROLE_MODULES[$role] ?? []);
    }

    public function hasPermission(?User $user, string $moduleKey): bool
    {
        if (! $user) {
            return false;
        }

        if ($user->role === 'admin') {
            return true;
        }

        return in_array($moduleKey, $this->permissionsForRole($user->role), true);
    }

    /**
     * @param  array<int, string>  $moduleKeys
     */
    public function hasAnyPermission(?User $user, array $moduleKeys): bool
    {
        if (! $user) {
            return false;
        }

        if ($user->role === 'admin') {
            return true;
        }

        $active = $this->permissionsForRole($user->role);
        foreach ($moduleKeys as $key) {
            if (in_array($key, $active, true)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Matriks lengkap semua role yang dapat dikelola (role => array of enabled module_keys).
     *
     * @return array<string, array<int, string>>
     */
    public function resolvedMatrix(): array
    {
        try {
            return Cache::rememberForever(self::CACHE_KEY, function (): array {
                return $this->buildMatrixFromDatabase();
            });
        } catch (Throwable) {
            return self::DEFAULT_ROLE_MODULES;
        }
    }

    /**
     * Simpan pengaturan modul untuk suatu role.
     *
     * @param  array<int, string>  $enabledModuleKeys
     */
    public function updateRolePermissions(string $role, array $enabledModuleKeys): void
    {
        if (! array_key_exists($role, self::MANAGEABLE_ROLES)) {
            return;
        }

        $validKeys = $this->allModuleKeys();
        $enabledSet = array_flip(array_intersect($enabledModuleKeys, $validKeys));

        DB::transaction(function () use ($role, $validKeys, $enabledSet): void {
            foreach ($validKeys as $moduleKey) {
                RolePermission::query()->updateOrCreate(
                    [
                        'role' => $role,
                        'module_key' => $moduleKey,
                    ],
                    [
                        'is_enabled' => isset($enabledSet[$moduleKey]),
                    ]
                );
            }
        });

        $this->clearCache();
    }

    /**
     * Kembalikan hak akses suatu role (atau semua role) ke pengaturan default.
     */
    public function resetToDefault(?string $role = null): void
    {
        if ($role !== null && array_key_exists($role, self::MANAGEABLE_ROLES)) {
            RolePermission::query()->where('role', $role)->delete();
        } else {
            RolePermission::query()->delete();
        }

        $this->clearCache();
    }

    public function clearCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /**
     * @return array<string, array<int, string>>
     */
    private function buildMatrixFromDatabase(): array
    {
        $matrix = self::DEFAULT_ROLE_MODULES;

        if (! Schema::hasTable('role_permissions')) {
            return $matrix;
        }

        $rows = RolePermission::query()->get(['role', 'module_key', 'is_enabled']);
        if ($rows->isEmpty()) {
            return $matrix;
        }

        $validKeys = array_flip($this->allModuleKeys());

        foreach (array_keys(self::MANAGEABLE_ROLES) as $role) {
            $defaults = array_flip(self::DEFAULT_ROLE_MODULES[$role] ?? []);
            $roleRows = $rows->where('role', $role);

            foreach ($roleRows as $row) {
                if (! isset($validKeys[$row->module_key])) {
                    continue;
                }

                if ($row->is_enabled) {
                    $defaults[$row->module_key] = true;
                } else {
                    unset($defaults[$row->module_key]);
                }
            }

            $matrix[$role] = array_values(array_keys($defaults));
        }

        return $matrix;
    }
}
