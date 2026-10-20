<?php

namespace App\Services\SuratTugas;

use App\Models\SuratTugas;
use App\Models\SuratTugasLog;

/**
 * Mencatat jejak audit aksi pada Surat Tugas.
 */
class AuditLogger
{
    public function log(SuratTugas $suratTugas, string $aksi, ?string $dari, ?string $ke, ?string $catatan = null): void
    {
        try {
            SuratTugasLog::create([
                'surat_tugas_id' => $suratTugas->id,
                'user_id' => auth()->id(),
                'aksi' => $aksi,
                'dari_status' => $dari,
                'ke_status' => $ke,
                'catatan' => $catatan,
            ]);
        } catch (\Throwable $e) {
            // P1: log audit tidak boleh menggagalkan transaksi utama.
            report($e);
        }
    }
}
