<?php

namespace App\Services\SuratTugas;

use App\Models\SuratTugas;
use App\Models\User;
use App\Support\SuratTugasStatus as S;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * Query baca untuk daftar Surat Tugas.
 */
class QueryService
{
    /**
     * Akses terbuka untuk semua aktor internal (track pengaju dicatat per dokumen).
     * Role pegawai hanya melihat surat terbit yang menugaskan dirinya.
     *
     * @param  array{search?: ?string, status?: ?string}  $filters
     */
    public function paginate(array $filters, ?User $user = null): LengthAwarePaginator
    {
        $query = SuratTugas::with(['pegawaiList', 'ppk.pegawai', 'user']);

        if ($user?->role === S::PEGAWAI_ROLE) {
            $query->diikutiPegawai($user->pegawai_id)->whereIn('status', S::PEGAWAI_VISIBLE);
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('nomor_st', 'like', "%{$search}%")
                    ->orWhere('nomor_spd', 'like', "%{$search}%")
                    ->orWhere('nomor_nota', 'like', "%{$search}%")
                    ->orWhere('perihal_nota', 'like', "%{$search}%")
                    ->orWhere('pengirim_nota', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();
    }

    /**
     * Mengambil nomor ST dan SPD resmi terakhir yang diterbitkan oleh sistem.
     *
     * @return array{lastSt: ?SuratTugas, lastSpd: ?SuratTugas}
     */
    public function lastNumbered(): array
    {
        $lastSt = SuratTugas::query()
            ->whereNotNull('nomor_st')
            ->where('nomor_st', '!=', '')
            ->orderByDesc('updated_at')
            ->first(['id', 'nomor_st', 'perihal_nota', 'tanggal_surat', 'updated_at']);

        $lastSpd = SuratTugas::query()
            ->whereNotNull('nomor_spd')
            ->where('nomor_spd', '!=', '')
            ->orderByDesc('updated_at')
            ->first(['id', 'nomor_spd', 'perihal_nota', 'tanggal_surat', 'updated_at']);

        return [
            'lastSt' => $lastSt,
            'lastSpd' => $lastSpd,
        ];
    }
}
