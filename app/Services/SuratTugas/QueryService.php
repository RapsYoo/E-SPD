<?php

namespace App\Services\SuratTugas;

use App\Models\SuratTugas;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * Query baca untuk daftar Surat Tugas.
 */
class QueryService
{
    /**
     * Akses terbuka untuk semua aktor (track pengaju dicatat per dokumen).
     *
     * @param  array{search?: ?string, status?: ?string}  $filters
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = SuratTugas::with(['pegawaiList', 'ppk', 'user']);

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('nomor_st', 'like', "%{$search}%")
                    ->orWhere('nomor_spd', 'like', "%{$search}%")
                    ->orWhere('nomor_nota', 'like', "%{$search}%")
                    ->orWhere('perihal_nota', 'like', "%{$search}%")
                    ->orWhere('pengirim_nota', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();
    }
}
