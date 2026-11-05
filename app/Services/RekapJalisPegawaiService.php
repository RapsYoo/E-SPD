<?php

namespace App\Services;

use App\Models\Pegawai;
use App\Models\SuratTugas;
use App\Models\TingkatBiaya;
use App\Support\SuratTugasStatus as S;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Layanan Rekapitulasi Jalis (Perjalanan Dinas) & Biaya per Pegawai.
 */
class RekapJalisPegawaiService
{
    private const DEFAULT_TARIF = [
        'A' => 1500000,
        'B' => 1000000,
        'C' => 750000,
    ];

    /**
     * @param  array<string, mixed>  $filters
     */
    public function suratQuery(array $filters): Builder
    {
        $query = SuratTugas::query()->with(['pegawaiList.pegawaiMaster.upt']);

        if (! empty($filters['dari'])) {
            $query->whereDate('tanggal_berangkat', '>=', $filters['dari']);
        }
        if (! empty($filters['sampai'])) {
            $query->whereDate('tanggal_berangkat', '<=', $filters['sampai']);
        }
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        } else {
            // Secara default kecualikan DRAFT murni & yang dihentikan Kapus agar rekap akurat
            $query->whereNotIn('status', [S::DRAFT, S::DISPOSISI_KAPUS_STOP]);
        }
        if (! empty($filters['kategori'])) {
            $query->where('kategori_perjalanan', $filters['kategori']);
        }

        return $query->orderByDesc('tanggal_berangkat')->orderByDesc('id');
    }

    /**
     * Ambil peta tarif harian per kode tingkat biaya.
     *
     * @return array<string, int>
     */
    public function tarifMap(): array
    {
        $map = self::DEFAULT_TARIF;
        try {
            foreach (TingkatBiaya::query()->get(['kode', 'tarif_harian']) as $tb) {
                $kode = strtoupper((string) $tb->kode);
                $map[$kode] = (int) ($tb->tarif_harian ?: ($map[$kode] ?? 750000));
            }
        } catch (\Throwable) {
            // Fallback ke DEFAULT_TARIF jika kolom belum dimigrasi
        }

        return $map;
    }

    /**
     * Hitung biaya otomatis 1 personel untuk 1 surat tugas berdasarkan tingkat biaya, durasi, dan kategori.
     *
     * @param  array<string, int>  $tarifMap
     */
    public function hitungBiayaOtomatis(SuratTugas $surat, array $tarifMap): int
    {
        $kode = strtoupper((string) ($surat->tingkat_biaya_kode ?: 'C'));
        $tarifHarian = $tarifMap[$kode] ?? 750000;
        $durasi = max(1, (int) ($surat->durasi_hari ?: 1));
        $multiplier = $surat->kategori_perjalanan === 'LUAR_NEGERI' ? 2 : 1;

        return $tarifHarian * $durasi * $multiplier;
    }

    /**
     * Bangun data rekap lengkap (list pegawai, summary KPI, dan data diagram).
     *
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public function buildReport(array $filters): array
    {
        $tarifMap = $this->tarifMap();
        $suratList = $this->suratQuery($filters)->get();

        $allPegawai = Pegawai::query()
            ->with('upt:id,kode,nama,keterangan')
            ->orderBy('nama')
            ->get();

        /** @var array<string, array<string, mixed>> $rekapMap */
        $rekapMap = [];

        foreach ($allPegawai as $peg) {
            $key = 'id_'.$peg->id;
            $rekapMap[$key] = [
                'key' => $key,
                'pegawai_id' => $peg->id,
                'nama' => $peg->nama,
                'nip' => $peg->nip ?: '-',
                'pangkat' => $peg->pangkat ?: '-',
                'golongan' => $peg->golongan ?: '-',
                'jabatan' => $peg->jabatan ?: '-',
                'upt_bidang' => $peg->upt?->nama ?: ($peg->upt_bidang ?: '-'),
                'status_kepegawaian' => $peg->status_kepegawaian ?: '-',
                'is_active' => (bool) ($peg->is_active ?? true),
                'pegawai_detail' => $peg,
                'total_jalis' => 0,
                'jalis_dalam_negeri' => 0,
                'jalis_luar_negeri' => 0,
                'total_hari' => 0,
                'total_biaya' => 0,
                'tingkat_biaya_counts' => [],
                'riwayat' => [],
            ];
        }

        $distribusiTingkat = [];
        foreach (TingkatBiaya::query()->orderBy('kode')->get() as $tb) {
            $kode = strtoupper($tb->kode);
            $distribusiTingkat[$kode] = [
                'kode' => $kode,
                'nama' => $tb->nama,
                'keterangan' => $tb->keterangan,
                'tarif_harian' => $tarifMap[$kode] ?? 750000,
                'total_jalis' => 0,
                'total_biaya' => 0,
            ];
        }

        foreach ($suratList as $surat) {
            $biayaOtomatis = $this->hitungBiayaOtomatis($surat, $tarifMap);
            $kodeBiaya = strtoupper((string) ($surat->tingkat_biaya_kode ?: 'C'));
            $durasi = max(1, (int) ($surat->durasi_hari ?: 1));
            $isLN = $surat->kategori_perjalanan === 'LUAR_NEGERI';
            $tujuanLabel = collect([
                $surat->tempat_tujuan,
                $isLN ? $surat->negara_tujuan : null,
            ])->filter()->implode(', ');

            foreach ($surat->pegawaiList as $sp) {
                $key = $sp->pegawai_id && isset($rekapMap['id_'.$sp->pegawai_id])
                    ? 'id_'.$sp->pegawai_id
                    : 'snap_'.md5(strtolower(trim((string) $sp->nama)).'|'.trim((string) $sp->nip));

                if (! isset($rekapMap[$key])) {
                    $rekapMap[$key] = [
                        'key' => $key,
                        'pegawai_id' => $sp->pegawai_id,
                        'nama' => $sp->nama,
                        'nip' => $sp->nip ?: '-',
                        'pangkat' => $sp->pangkat ?: '-',
                        'golongan' => $sp->golongan ?: '-',
                        'jabatan' => $sp->jabatan ?: '-',
                        'upt_bidang' => $sp->unit_kerja ?: '-',
                        'status_kepegawaian' => '-',
                        'is_active' => true,
                        'pegawai_detail' => null,
                        'total_jalis' => 0,
                        'jalis_dalam_negeri' => 0,
                        'jalis_luar_negeri' => 0,
                        'total_hari' => 0,
                        'total_biaya' => 0,
                        'tingkat_biaya_counts' => [],
                        'riwayat' => [],
                    ];
                }

                $biayaManual = $sp->biaya !== null ? (int) $sp->biaya : null;
                $biayaEfektif = $biayaManual ?? $biayaOtomatis;

                $rekapMap[$key]['total_jalis'] += 1;
                if ($isLN) {
                    $rekapMap[$key]['jalis_luar_negeri'] += 1;
                } else {
                    $rekapMap[$key]['jalis_dalam_negeri'] += 1;
                }
                $rekapMap[$key]['total_hari'] += $durasi;
                $rekapMap[$key]['total_biaya'] += $biayaEfektif;
                $rekapMap[$key]['tingkat_biaya_counts'][$kodeBiaya] =
                    ($rekapMap[$key]['tingkat_biaya_counts'][$kodeBiaya] ?? 0) + 1;

                $rekapMap[$key]['riwayat'][] = [
                    'surat_tugas_id' => $surat->id,
                    'surat_tugas_pegawai_id' => $sp->id,
                    'nomor_st' => $surat->nomor_st ?: '[Belum Diisi TU]',
                    'nomor_spd' => $surat->nomor_spd ?: '[Belum Diisi TU]',
                    'perihal' => $surat->perihal_nota,
                    'tujuan' => $tujuanLabel ?: '-',
                    'kategori' => $isLN ? 'Luar Negeri' : 'Dalam Negeri',
                    'kategori_kode' => $surat->kategori_perjalanan,
                    'tingkat_biaya' => $kodeBiaya,
                    'angkutan' => $surat->jenis_angkutan_nama ?: '-',
                    'tanggal_berangkat' => $surat->tanggal_berangkat?->toDateString(),
                    'tanggal_kembali' => $surat->tanggal_kembali?->toDateString(),
                    'durasi_hari' => $durasi,
                    'status' => S::LABELS[$surat->status] ?? $surat->status,
                    'status_kode' => $surat->status,
                    'biaya_manual' => $biayaManual,
                    'biaya_otomatis' => $biayaOtomatis,
                    'biaya_efektif' => $biayaEfektif,
                ];

                if (! isset($distribusiTingkat[$kodeBiaya])) {
                    $distribusiTingkat[$kodeBiaya] = [
                        'kode' => $kodeBiaya,
                        'nama' => 'Tingkat '.$kodeBiaya,
                        'keterangan' => '',
                        'tarif_harian' => $tarifMap[$kodeBiaya] ?? 750000,
                        'total_jalis' => 0,
                        'total_biaya' => 0,
                    ];
                }
            }
        }

        $items = collect(array_values($rekapMap))->map(function (array $row) {
            $counts = $row['tingkat_biaya_counts'];
            arsort($counts);
            $dominan = array_key_first($counts) ?: '-';
            $row['tingkat_biaya_dominan'] = $dominan;
            $row['rata_rata_biaya'] = $row['total_jalis'] > 0
                ? (int) round($row['total_biaya'] / $row['total_jalis'])
                : 0;

            return $row;
        });

        // Filter berdasarkan Unit / UPT
        if (! empty($filters['unit'])) {
            $unitFilter = strtolower(trim((string) $filters['unit']));
            $items = $items->filter(
                fn (array $r) => strtolower(trim((string) $r['upt_bidang'])) === $unitFilter
            );
        }

        // Filter berdasarkan pencarian nama / NIP / jabatan
        if (! empty($filters['search'])) {
            $q = strtolower(trim((string) $filters['search']));
            $items = $items->filter(function (array $r) use ($q) {
                return str_contains(strtolower($r['nama']), $q)
                    || str_contains(strtolower($r['nip']), $q)
                    || str_contains(strtolower($r['jabatan']), $q)
                    || str_contains(strtolower($r['upt_bidang']), $q);
            });
        }

        // Simpan statistik populasi sebelum filter 'tampil' untuk rasio partisipasi pegawai
        $totalPopulasiPegawai = $items->count();
        $totalPopulasiPernahJalis = $items->where('total_jalis', '>', 0)->count();
        $totalPopulasiBelumJalis = $items->where('total_jalis', 0)->count();

        // Filter tampilkan: semua vs hanya yang pernah jalis vs belum pernah jalis
        $modeTampil = $filters['tampil'] ?? 'semua';
        if ($modeTampil === 'pernah_jalis') {
            $items = $items->where('total_jalis', '>', 0);
        } elseif ($modeTampil === 'belum_jalis') {
            $items = $items->where('total_jalis', 0);
        }

        // Hitung ulang distribusi Tingkat Biaya dari item yang lolos seluruh filter
        foreach ($items as $personRow) {
            foreach ($personRow['riwayat'] as $trip) {
                $kode = $trip['tingkat_biaya'];
                if (! isset($distribusiTingkat[$kode])) {
                    $distribusiTingkat[$kode] = [
                        'kode' => $kode,
                        'nama' => 'Tingkat '.$kode,
                        'keterangan' => '',
                        'tarif_harian' => $tarifMap[$kode] ?? 750000,
                        'total_jalis' => 0,
                        'total_biaya' => 0,
                    ];
                }
                $distribusiTingkat[$kode]['total_jalis'] += 1;
                $distribusiTingkat[$kode]['total_biaya'] += (int) $trip['biaya_efektif'];
            }
        }

        // Hitung distribusi per UPT/Bidang mengikuti seluruh filter aktif
        $distribusiUpt = $items
            ->groupBy(fn (array $r) => $r['upt_bidang'] && $r['upt_bidang'] !== '-' ? $r['upt_bidang'] : 'Lainnya')
            ->map(function (Collection $group, string $uptName) {
                return [
                    'upt' => $uptName,
                    'total_pegawai' => $group->count(),
                    'pegawai_jalis' => $group->where('total_jalis', '>', 0)->count(),
                    'total_jalis' => (int) $group->sum('total_jalis'),
                    'total_hari' => (int) $group->sum('total_hari'),
                    'total_biaya' => (int) $group->sum('total_biaya'),
                ];
            })
            ->sortByDesc('total_jalis')
            ->values()
            ->all();

        // Hitung biaya Dalam Negeri vs Luar Negeri dari item yang lolos filter
        $biayaDalamNegeri = 0;
        $biayaLuarNegeri = 0;
        foreach ($items as $personRow) {
            foreach ($personRow['riwayat'] as $trip) {
                if (($trip['kategori_kode'] ?? '') === 'LUAR_NEGERI') {
                    $biayaLuarNegeri += (int) $trip['biaya_efektif'];
                } else {
                    $biayaDalamNegeri += (int) $trip['biaya_efektif'];
                }
            }
        }

        // Summary KPI keseluruhan (mengikuti seluruh filter aktif)
        $summary = [
            'total_pegawai' => $totalPopulasiPegawai,
            'total_pegawai_jalis' => $totalPopulasiPernahJalis,
            'total_pegawai_belum_jalis' => $totalPopulasiBelumJalis,
            'total_pegawai_tampil' => $items->count(),
            'total_jalis' => (int) $items->sum('total_jalis'),
            'jalis_dalam_negeri' => (int) $items->sum('jalis_dalam_negeri'),
            'jalis_luar_negeri' => (int) $items->sum('jalis_luar_negeri'),
            'biaya_dalam_negeri' => $biayaDalamNegeri,
            'biaya_luar_negeri' => $biayaLuarNegeri,
            'total_hari' => (int) $items->sum('total_hari'),
            'total_biaya' => (int) $items->sum('total_biaya'),
        ];

        // Pengurutan
        $sort = $filters['sort'] ?? 'jalis_desc';
        $items = match ($sort) {
            'biaya_desc' => $items->sort(fn ($a, $b) => [$b['total_biaya'], $b['total_jalis'], $a['nama']] <=> [$a['total_biaya'], $a['total_jalis'], $b['nama']]),
            'hari_desc' => $items->sort(fn ($a, $b) => [$b['total_hari'], $b['total_jalis'], $a['nama']] <=> [$a['total_hari'], $a['total_jalis'], $b['nama']]),
            'nama_asc' => $items->sortBy('nama', SORT_NATURAL | SORT_FLAG_CASE),
            default => $items->sort(fn ($a, $b) => [$b['total_jalis'], $b['total_biaya'], $a['nama']] <=> [$a['total_jalis'], $a['total_biaya'], $b['nama']]),
        };

        $sortedList = $items->values();

        // Data Diagram (Top 10 Pegawai berdasarkan Jalis & Biaya)
        $topPegawaiJalis = $sortedList
            ->where('total_jalis', '>', 0)
            ->sort(fn ($a, $b) => [$b['total_jalis'], $b['total_hari']] <=> [$a['total_jalis'], $a['total_hari']])
            ->take(10)
            ->map(fn (array $r) => [
                'pegawai_id' => $r['pegawai_id'],
                'nama' => $r['nama'],
                'upt_bidang' => $r['upt_bidang'],
                'total_jalis' => $r['total_jalis'],
                'jalis_dalam_negeri' => $r['jalis_dalam_negeri'],
                'jalis_luar_negeri' => $r['jalis_luar_negeri'],
                'total_hari' => $r['total_hari'],
                'total_biaya' => $r['total_biaya'],
            ])
            ->values()
            ->all();

        $topPegawaiBiaya = $sortedList
            ->where('total_biaya', '>', 0)
            ->sort(fn ($a, $b) => [$b['total_biaya'], $b['total_jalis']] <=> [$a['total_biaya'], $a['total_jalis']])
            ->take(10)
            ->map(fn (array $r) => [
                'pegawai_id' => $r['pegawai_id'],
                'nama' => $r['nama'],
                'upt_bidang' => $r['upt_bidang'],
                'total_jalis' => $r['total_jalis'],
                'total_hari' => $r['total_hari'],
                'total_biaya' => $r['total_biaya'],
            ])
            ->values()
            ->all();

        return [
            'rows' => $sortedList->all(),
            'summary' => $summary,
            'charts' => [
                'topPegawaiJalis' => $topPegawaiJalis,
                'topPegawaiBiaya' => $topPegawaiBiaya,
                'distribusiUpt' => $distribusiUpt,
                'distribusiTingkat' => array_values($distribusiTingkat),
            ],
            'tarifMap' => $tarifMap,
        ];
    }

    /**
     * Ekspor Rekapitulasi Jalis Pegawai ke CSV atau Excel.
     *
     * @param  array<string, mixed>  $filters
     */
    public function export(array $filters, string $format): StreamedResponse
    {
        $report = $this->buildReport($filters);
        $rows = $report['rows'];
        $filename = 'rekap-jalis-pegawai-'.now()->format('Ymd-His').'.'.$format;

        if ($format === 'xls') {
            return response()->streamDownload(function () use ($rows, $report) {
                echo "\xEF\xBB\xBF";
                echo '<!doctype html><html><head><meta charset="UTF-8"><style>
                    @page { size: landscape; margin: 10mm; }
                    body { font-family: Arial, sans-serif; color: #1e293b; }
                    .title { text-align: center; font-size: 14pt; font-weight: bold; margin-bottom: 12px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #000; padding: 5px; font-size: 9pt; }
                    th { background: #0F2C59; color: #ffffff; text-align: center; }
                    .center { text-align: center; }
                    .right { text-align: right; }
                </style></head><body>';
                echo '<div class="title">REKAPITULASI PERJALANAN DINAS (JALIS) & BIAYA PEGAWAI</div>';
                echo '<table><thead><tr>
                    <th>No</th>
                    <th>Nama Pegawai</th>
                    <th>NIP</th>
                    <th>Pangkat / Gol.</th>
                    <th>Jabatan</th>
                    <th>UPT / Bidang</th>
                    <th>Jalis Dalam Negeri</th>
                    <th>Jalis Luar Negeri</th>
                    <th>Total Jalis</th>
                    <th>Total Hari Dinas</th>
                    <th>Total Biaya (Rp)</th>
                </tr></thead><tbody>';

                foreach ($rows as $idx => $r) {
                    echo '<tr>';
                    echo '<td class="center">'.($idx + 1).'</td>';
                    echo '<td>'.e($r['nama']).'</td>';
                    echo '<td style="mso-number-format:\'\\@\'">'.e($r['nip']).'</td>';
                    echo '<td>'.e($r['pangkat'].' / '.$r['golongan']).'</td>';
                    echo '<td>'.e($r['jabatan']).'</td>';
                    echo '<td>'.e($r['upt_bidang']).'</td>';
                    echo '<td class="center">'.(int) $r['jalis_dalam_negeri'].'</td>';
                    echo '<td class="center">'.(int) $r['jalis_luar_negeri'].'</td>';
                    echo '<td class="center"><strong>'.(int) $r['total_jalis'].'</strong></td>';
                    echo '<td class="center">'.(int) $r['total_hari'].' hari</td>';
                    echo '<td class="right">Rp '.number_format((int) $r['total_biaya'], 0, ',', '.').'</td>';
                    echo '</tr>';
                }

                echo '<tr>
                    <th colspan="6">TOTAL KESELURUHAN</th>
                    <th>'.(int) $report['summary']['jalis_dalam_negeri'].'</th>
                    <th>'.(int) $report['summary']['jalis_luar_negeri'].'</th>
                    <th>'.(int) $report['summary']['total_jalis'].'</th>
                    <th>'.(int) $report['summary']['total_hari'].' hari</th>
                    <th class="right">Rp '.number_format((int) $report['summary']['total_biaya'], 0, ',', '.').'</th>
                </tr>';
                echo '</tbody></table></body></html>';
            }, $filename, ['Content-Type' => 'application/vnd.ms-excel; charset=UTF-8']);
        }

        return response()->streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, [
                'No',
                'Nama Pegawai',
                'NIP',
                'Pangkat',
                'Golongan',
                'Jabatan',
                'UPT / Bidang',
                'Jalis Dalam Negeri',
                'Jalis Luar Negeri',
                'Total Jalis',
                'Total Hari Dinas',
                'Total Biaya (Rp)',
            ], ';');

            foreach ($rows as $idx => $r) {
                fputcsv($out, [
                    $idx + 1,
                    $r['nama'],
                    $r['nip'],
                    $r['pangkat'],
                    $r['golongan'],
                    $r['jabatan'],
                    $r['upt_bidang'],
                    $r['jalis_dalam_negeri'],
                    $r['jalis_luar_negeri'],
                    $r['total_jalis'],
                    $r['total_hari'],
                    $r['total_biaya'],
                ], ';');
            }
            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
