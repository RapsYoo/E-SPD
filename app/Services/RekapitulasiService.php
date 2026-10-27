<?php

namespace App\Services;

use App\Models\SuratTugas;
use App\Support\SuratTugasStatus as S;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Rekapitulasi perjalanan dinas: query terfilter, ringkasan, dan ekspor CSV / Excel.
 */
class RekapitulasiService
{
    /** Kolom ekspor, urut sesuai tampilan. */
    private const HEADERS = [
        'No', 'Nomor ST', 'Nomor SPD', 'Tanggal Surat', 'Perihal', 'Kategori', 'Tempat Berangkat',
        'Tujuan', 'Tanggal Berangkat', 'Tanggal Kembali', 'Lama (Hari)', 'Pelaksana', 'Jumlah Pelaksana',
        'Tingkat Biaya', 'Angkutan', 'PPK', 'Status',
    ];

    /**
     * @param  array{dari?: ?string, sampai?: ?string, status?: ?string, kategori?: ?string, search?: ?string}  $filters
     */
    public function query(array $filters): Builder
    {
        $query = SuratTugas::query()->with(['pegawaiList', 'ppk.pegawai']);

        if (! empty($filters['dari'])) {
            $query->whereDate('tanggal_berangkat', '>=', $filters['dari']);
        }
        if (! empty($filters['sampai'])) {
            $query->whereDate('tanggal_berangkat', '<=', $filters['sampai']);
        }
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (! empty($filters['kategori'])) {
            $query->where('kategori_perjalanan', $filters['kategori']);
        }
        if (! empty($filters['search'])) {
            $term = $filters['search'];
            $query->where(function (Builder $q) use ($term) {
                $q->where('nomor_st', 'like', "%{$term}%")
                    ->orWhere('nomor_spd', 'like', "%{$term}%")
                    ->orWhere('perihal_nota', 'like', "%{$term}%")
                    ->orWhere('tempat_tujuan', 'like', "%{$term}%")
                    ->orWhereHas('pegawaiList', fn (Builder $p) => $p->where('nama', 'like', "%{$term}%")->orWhere('nip', 'like', "%{$term}%"));
            });
        }

        return $query->orderByDesc('tanggal_berangkat')->orderByDesc('id');
    }

    /** @return array<string, int> */
    public function summary(array $filters): array
    {
        $base = $this->query($filters)->withCount('pegawaiList');
        $rows = $base->get(['id', 'kategori_perjalanan', 'durasi_hari']);

        return [
            'total_surat' => $rows->count(),
            'total_pelaksana' => (int) $rows->sum('pegawai_list_count'),
            'total_hari_dinas' => (int) $rows->sum(fn (SuratTugas $s) => ($s->durasi_hari ?? 0) * $s->pegawai_list_count),
            'dalam_negeri' => $rows->where('kategori_perjalanan', 'DALAM_NEGERI')->count(),
            'luar_negeri' => $rows->where('kategori_perjalanan', 'LUAR_NEGERI')->count(),
        ];
    }

    /** @return array<string, mixed> */
    public function toRow(SuratTugas $surat): array
    {
        return [
            'id' => $surat->id,
            'nomor_st' => $surat->nomor_st,
            'nomor_spd' => $surat->nomor_spd,
            'tanggal_surat' => $surat->tanggal_surat?->toDateString(),
            'perihal' => $surat->perihal_nota,
            'kategori' => $surat->kategori_perjalanan === 'LUAR_NEGERI' ? 'Luar Negeri' : 'Dalam Negeri',
            'tempat_berangkat' => $surat->tempat_berangkat,
            'tujuan' => collect([$surat->tempat_tujuan, $surat->kategori_perjalanan === 'LUAR_NEGERI' ? $surat->negara_tujuan : null])->filter()->implode(', '),
            'tanggal_berangkat' => $surat->tanggal_berangkat?->toDateString(),
            'tanggal_kembali' => $surat->tanggal_kembali?->toDateString(),
            'durasi_hari' => $surat->durasi_hari,
            'pelaksana' => $surat->pegawaiList->pluck('nama')->implode('; '),
            'personel' => $surat->pegawaiList->map(fn ($pegawai) => [
                'nama' => $pegawai->nama,
                'jabatan' => $pegawai->jabatan,
            ])->values()->all(),
            'jumlah_pelaksana' => $surat->pegawaiList->count(),
            'tingkat_biaya' => $surat->tingkat_biaya_kode,
            'angkutan' => $surat->jenis_angkutan_nama,
            'ppk' => $surat->ppk_nama_snapshot ?: ($surat->ppk?->pegawai?->nama ?? $surat->ppk?->name),
            'status' => S::LABELS[$surat->status] ?? $surat->status,
        ];
    }

    /**
     * Unduh hasil rekap. Format `csv` (separator `;` + BOM agar terbuka rapi di Excel) atau `xls` (tabel HTML).
     */
    public function export(array $filters, string $format): StreamedResponse
    {
        $filename = 'rekap-perjalanan-dinas-'.now()->format('Ymd-His').'.'.$format;

        return $format === 'xls'
            ? $this->streamExcel($filters, $filename)
            : $this->streamCsv($filters, $filename);
    }

    private function streamCsv(array $filters, string $filename): StreamedResponse
    {
        return response()->streamDownload(function () use ($filters) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, self::HEADERS, ';');

            foreach ($this->exportRows($filters) as $row) {
                fputcsv($out, array_map(fn ($v) => $this->neutralizeFormula($v), $row), ';');
            }
            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function streamExcel(array $filters, string $filename): StreamedResponse
    {
        return response()->streamDownload(function () use ($filters) {
            echo "\xEF\xBB\xBF";
            echo '<!doctype html><html><head><meta charset="UTF-8"><style>
                @page { size: landscape; margin: 10mm; mso-page-orientation: landscape; }
                body { font-family: Arial, sans-serif; color: #1e293b; }
                .letterhead { width: 100%; text-align: center; margin-bottom: 12px; font-weight: bold; color: #1e3a8a; }
                .letterhead .country { margin-top: 3px; font-size: 9pt; letter-spacing: 3px; color: #b91c1c; }
                .report-title { margin: 8px 0 12px; text-align: center; font-size: 14pt; font-weight: bold; }
                table { width: 100%; table-layout: fixed; border-collapse: collapse; page-break-inside: auto; }
                thead { display: table-header-group; }
                tr { page-break-inside: avoid; }
                th, td { border: 1px solid #000; padding: 4px; font-size: 8pt; vertical-align: top; overflow-wrap: break-word; }
                th { background: #d1fae5; color: #111827; text-align: center; font-weight: bold; }
                td { mso-number-format: "\\@"; }
                .center { text-align: center; }
            </style></head><body>';
            echo '<div class="letterhead"><div>KEMENTERIAN LUAR NEGERI</div><div class="country">REPUBLIK INDONESIA</div></div>';
            echo '<div class="report-title">REKAPITULASI PERJALANAN DINAS</div>';
            echo '<table><colgroup>';
            foreach ([4, 10, 12, 10, 10, 6, 8, 7, 7, 5, 8, 8, 5] as $width) {
                echo '<col style="width:'.$width.'%">';
            }
            echo '</colgroup><thead>
                <tr>
                    <th rowspan="2">No</th>
                    <th rowspan="2">Nomor Dokumen</th>
                    <th rowspan="2">Nama</th>
                    <th rowspan="2">Posisi</th>
                    <th rowspan="2">Tujuan</th>
                    <th colspan="2">Transportasi / Angkutan</th>
                    <th colspan="3">Periode Perjalanan</th>
                    <th rowspan="2">PPK</th>
                    <th rowspan="2">Aktivitas Perjalanan</th>
                    <th rowspan="2">Status</th>
                </tr>
                <tr>
                    <th>Tingkat Biaya</th>
                    <th>Jenis Angkutan</th>
                    <th>Berangkat</th>
                    <th>Kembali</th>
                    <th>Total Hari</th>
                </tr>
            </thead><tbody>';

            $number = 0;
            foreach ($this->query($filters)->get() as $surat) {
                $row = $this->toRow($surat);
                $names = implode('<br>', array_map(
                    fn (array $person) => e($this->neutralizeFormula($person['nama'] ?? '-')),
                    $row['personel']
                ));
                $positions = implode('<br>', array_map(
                    fn (array $person) => e($this->neutralizeFormula($person['jabatan'] ?? '-')),
                    $row['personel']
                ));
                $destination = e($this->neutralizeFormula($row['tujuan'] ?: '-'))
                    .'<br><span style="color:#334155">'.e($row['kategori']).'</span>';
                $documentNumbers = '<strong>ST:</strong> '.e($this->neutralizeFormula($row['nomor_st'] ?: '-'))
                    .'<br><strong>SPD:</strong> '.e($this->neutralizeFormula($row['nomor_spd'] ?: '-'));
                $values = [
                    ++$number,
                    $documentNumbers,
                    $names ?: '-',
                    $positions ?: '-',
                    $destination,
                    $row['tingkat_biaya'] ?: '-',
                    $row['angkutan'] ?: '-',
                    $row['tanggal_berangkat'] ?: '-',
                    $row['tanggal_kembali'] ?: '-',
                    ($row['durasi_hari'] ?? '-').' hari',
                    $row['ppk'] ?: '-',
                    $row['perihal'] ?: '-',
                    $row['status'] ?: '-',
                ];

                echo '<tr>';
                foreach ($values as $index => $value) {
                    $class = in_array($index, [0, 5, 7, 8, 9, 12], true) ? ' class="center"' : '';
                    $content = in_array($index, [1, 2, 3, 4], true)
                        ? $value
                        : e($this->neutralizeFormula($value));

                    echo '<td'.$class.'>'.$content.'</td>';
                }
                echo '</tr>';
            }
            echo '</tbody></table></body></html>';
        }, $filename, ['Content-Type' => 'application/vnd.ms-excel; charset=UTF-8']);
    }

    /** @return \Generator<int, array<int, mixed>> */
    private function exportRows(array $filters): \Generator
    {
        $no = 0;
        foreach ($this->query($filters)->get() as $surat) {
            $r = $this->toRow($surat);
            yield [
                ++$no, $r['nomor_st'], $r['nomor_spd'], $r['tanggal_surat'], $r['perihal'], $r['kategori'],
                $r['tempat_berangkat'], $r['tujuan'], $r['tanggal_berangkat'], $r['tanggal_kembali'],
                $r['durasi_hari'], $r['pelaksana'], $r['jumlah_pelaksana'], $r['tingkat_biaya'],
                $r['angkutan'], $r['ppk'], $r['status'],
            ];
        }
    }

    /** Cegah CSV/formula injection: sel yang diawali = + - @ dijadikan teks. */
    private function neutralizeFormula(mixed $value): mixed
    {
        if (is_string($value) && $value !== '' && in_array($value[0], ['=', '+', '-', '@', "\t", "\r"], true)) {
            return "'".$value;
        }

        return $value;
    }

    /** Halaman rekap: baris sudah dipetakan untuk ditampilkan. */
    public function rows(array $filters, int $perPage = 25): LengthAwarePaginator
    {
        return $this->query($filters)->paginate($perPage)->withQueryString()
            ->through(fn (SuratTugas $s) => $this->toRow($s));
    }
}
