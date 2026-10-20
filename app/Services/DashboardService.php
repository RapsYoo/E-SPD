<?php

namespace App\Services;

use App\Models\JenisAngkutan;
use App\Models\Pegawai;
use App\Models\SuratTugas;
use App\Models\TingkatBiaya;
use App\Models\UnitKerja;
use App\Models\User;
use App\Support\SuratTugasStatus as S;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Data ringkasan untuk dashboard (semua aktor & admin).
 */
class DashboardService
{
    /** Statistik menyeluruh organisasi (terbuka untuk semua aktor). */
    public function overview(User $user): array
    {
        $totalSurat = SuratTugas::count();

        return [
            'totalSurat' => $totalSurat,
            'statusStats' => $this->countBy('status'),
            'kategoriStats' => $this->countBy('kategori_perjalanan'),
            'recentSurat' => SuratTugas::query()
                ->with(['pegawaiList', 'user'])
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get(),
            'needsAction' => $this->needsAction($user),
        ];
    }

    /** Statistik master data untuk dashboard admin. */
    public function adminStats(): array
    {
        return [
            'stats' => [
                'totalPegawai' => Pegawai::count(),
                'pegawaiAktif' => Pegawai::where('is_active', true)->count(),
                'totalPpk' => User::where('role', 'ppk')->count(),
                'totalUnitKerja' => UnitKerja::where('is_active', true)->count(),
                'totalTingkatBiaya' => TingkatBiaya::where('is_active', true)->count(),
                'totalJenisAngkutan' => JenisAngkutan::where('is_active', true)->count(),
            ],
            'recentPegawai' => Pegawai::orderBy('updated_at', 'desc')->take(5)->get(),
        ];
    }

    private function countBy(string $column): array
    {
        return SuratTugas::query()
            ->select($column, DB::raw('count(*) as total'))
            ->groupBy($column)
            ->get()
            ->pluck('total', $column)
            ->toArray();
    }

    /** Surat yang memerlukan aksi pengguna saat ini, menurut perannya. */
    private function needsAction(User $user): Collection|array
    {
        $query = match (true) {
            $user->role === 'kapus' => SuratTugas::where('status', S::MENUNGGU_DISPOSISI_KAPUS)->with(['user']),
            $user->role === 'tu' => SuratTugas::where('status', S::MENUNGGU_PENOMORAN_TU)->with(['user']),
            $user->role === 'ppk' => SuratTugas::where('status', S::SELESAI_TERBIT)->where('is_ppk_signed', false)->with(['user']),
            in_array($user->role, ['pemohon', 'sespalu'], true) => SuratTugas::where('user_id', $user->id)
                ->whereIn('status', [S::DISPOSISI_KAPUS_YA, S::DISPOSISI_KAPUS_REVISI]),
            $user->role === 'admin' => SuratTugas::whereIn('status', [
                S::MENUNGGU_DISPOSISI_KAPUS,
                S::MENUNGGU_PENOMORAN_TU,
                S::DISPOSISI_KAPUS_YA,
                S::DISPOSISI_KAPUS_REVISI,
            ])->with(['user']),
            default => null,
        };

        return $query?->orderBy('created_at', 'asc')->limit(10)->get() ?? [];
    }
}
