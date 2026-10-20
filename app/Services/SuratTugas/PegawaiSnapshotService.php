<?php

namespace App\Services\SuratTugas;

use App\Models\Pegawai;
use App\Models\SuratTugas;
use App\Models\SuratTugasPegawai;

/**
 * Menyimpan snapshot pegawai yang ditugaskan pada sebuah Surat Tugas.
 */
class PegawaiSnapshotService
{
    /**
     * Ganti seluruh snapshot pegawai pada surat dengan daftar ID terbaru (urutan dipertahankan).
     *
     * @param  array<int, int|string>  $pegawaiIds
     */
    public function sync(SuratTugas $suratTugas, array $pegawaiIds): void
    {
        $suratTugas->pegawaiList()->delete();

        foreach ($pegawaiIds as $index => $pegawaiId) {
            $pegawai = Pegawai::find($pegawaiId);
            if (!$pegawai) {
                continue;
            }

            SuratTugasPegawai::create([
                'surat_tugas_id' => $suratTugas->id,
                'pegawai_id'     => $pegawai->id,
                'nama'           => $pegawai->nama,
                'nip'            => $pegawai->nip ?? '',
                'pangkat'        => $pegawai->pangkat ?? '',
                'golongan'       => $pegawai->golongan ?? '',
                'jabatan'        => $pegawai->jabatan ?? '',
                'unit_kerja'     => $pegawai->unit_kerja ?: 'Pusdiklat Kemlu',
                'urutan'         => $index + 1,
            ]);
        }
    }
}
