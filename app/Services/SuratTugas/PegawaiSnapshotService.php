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
     * Jika $rpdByPegawai disertakan, simpan rincian biaya RPD & data rekening per pegawai.
     *
     * @param  array<int, int|string>  $pegawaiIds
     * @param  array<int|string, array<string, mixed>>  $rpdByPegawai
     */
    public function sync(SuratTugas $suratTugas, array $pegawaiIds, array $rpdByPegawai = []): void
    {
        $suratTugas->pegawaiList()->delete();

        foreach ($pegawaiIds as $index => $pegawaiId) {
            $pegawai = Pegawai::find($pegawaiId);
            if (! $pegawai) {
                continue;
            }

            $rpdEntry = $rpdByPegawai[(string) $pegawai->id] ?? $rpdByPegawai[(int) $pegawai->id] ?? null;
            $normalizedItems = [];
            $rpdTotal = 0;

            if (is_array($rpdEntry) && ! empty($rpdEntry['items']) && is_array($rpdEntry['items'])) {
                foreach ($rpdEntry['items'] as $item) {
                    if (! is_array($item)) {
                        continue;
                    }
                    $uraian = trim((string) ($item['uraian'] ?? $item['jenis'] ?? ''));
                    $jenis = trim((string) ($item['jenis'] ?? $uraian));
                    if ($uraian === '' && $jenis === '') {
                        continue;
                    }

                    $jumlahSatuan = (float) ($item['jumlah_satuan'] ?? 0);
                    $satuan = trim((string) ($item['satuan'] ?? 'Hari')) ?: 'Hari';
                    $persentase = (float) ($item['persentase'] ?? 100);
                    $mataUang = strtoupper((string) ($item['mata_uang'] ?? 'IDR')) === 'USD' ? 'USD' : 'IDR';
                    $besaran = (float) ($item['besaran'] ?? 0);
                    $kurs = $mataUang === 'USD' ? (float) ($item['kurs'] ?? 1) : 1.0;
                    $jumlah = (int) round($jumlahSatuan * ($persentase / 100) * $besaran * $kurs);

                    $normalizedItems[] = [
                        'jenis' => $jenis !== '' ? $jenis : $uraian,
                        'uraian' => $uraian !== '' ? $uraian : $jenis,
                        'jumlah_satuan' => $jumlahSatuan,
                        'satuan' => $satuan,
                        'persentase' => $persentase,
                        'mata_uang' => $mataUang,
                        'besaran' => $besaran,
                        'kurs' => $kurs,
                        'jumlah' => $jumlah,
                    ];
                    $rpdTotal += $jumlah;
                }
            }

            $telahDibayar = is_array($rpdEntry) && array_key_exists('telah_dibayar', $rpdEntry) && $rpdEntry['telah_dibayar'] !== null && $rpdEntry['telah_dibayar'] !== ''
                ? (int) $rpdEntry['telah_dibayar']
                : $rpdTotal;

            $namaRekening = is_array($rpdEntry) && ! empty($rpdEntry['nama_rekening'])
                ? (string) $rpdEntry['nama_rekening']
                : ($pegawai->nama_rekening ?: $pegawai->nama);
            $noRekening = is_array($rpdEntry) && array_key_exists('no_rekening', $rpdEntry)
                ? (string) ($rpdEntry['no_rekening'] ?? '')
                : ($pegawai->no_rekening ?? '');
            $kodeBank = is_array($rpdEntry) && array_key_exists('kode_bank', $rpdEntry)
                ? (string) ($rpdEntry['kode_bank'] ?? '')
                : ($pegawai->kode_bank ?: ($pegawai->bank ?? ''));

            SuratTugasPegawai::create([
                'surat_tugas_id' => $suratTugas->id,
                'pegawai_id' => $pegawai->id,
                'nama' => $pegawai->nama,
                'nip' => $pegawai->nip ?? '',
                'pangkat' => $pegawai->pangkat ?? '',
                'golongan' => $pegawai->golongan ?? '',
                'jabatan' => $pegawai->jabatan ?? '',
                'unit_kerja' => $pegawai->unit_kerja ?: 'Pusdiklat Kemlu',
                'urutan' => $index + 1,
                'biaya' => $rpdTotal > 0 ? $rpdTotal : null,
                'rpd_items' => $normalizedItems ?: null,
                'rpd_total' => $rpdTotal,
                'rpd_telah_dibayar' => $telahDibayar,
                'nama_rekening' => $namaRekening,
                'no_rekening' => $noRekening,
                'kode_bank' => $kodeBank,
            ]);
        }
    }
}
