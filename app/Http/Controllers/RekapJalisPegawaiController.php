<?php

namespace App\Http\Controllers;

use App\Models\SuratTugasPegawai;
use App\Models\TingkatBiaya;
use App\Models\UptBidang;
use App\Services\RekapJalisPegawaiService;
use App\Support\SuratTugasStatus;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Rekapitulasi Perjalanan Dinas (Jalis) & Biaya per Pegawai dalam bentuk Diagram & Daftar.
 */
class RekapJalisPegawaiController extends Controller
{
    public function __construct(private RekapJalisPegawaiService $rekapJalis) {}

    /**
     * Validasi dan ambil parameter filter untuk rekapitulasi jalis pegawai.
     *
     * @return array<string, mixed>
     */
    private function extractFilters(Request $request): array
    {
        $validated = $request->validate([
            'dari' => ['nullable', 'date'],
            'sampai' => ['nullable', 'date', 'after_or_equal:dari'],
            'status' => ['nullable', Rule::in(SuratTugasStatus::ALL)],
            'kategori' => ['nullable', 'in:DALAM_NEGERI,LUAR_NEGERI'],
            'unit' => ['nullable', 'string', 'max:255'],
            'search' => ['nullable', 'string', 'max:100'],
            'tampil' => ['nullable', 'in:semua,pernah_jalis,belum_jalis'],
            'sort' => ['nullable', 'in:jalis_desc,biaya_desc,hari_desc,nama_asc'],
        ]);

        return [
            'dari' => $validated['dari'] ?? null,
            'sampai' => $validated['sampai'] ?? null,
            'status' => $validated['status'] ?? null,
            'kategori' => $validated['kategori'] ?? null,
            'unit' => $validated['unit'] ?? null,
            'search' => $validated['search'] ?? null,
            'tampil' => $validated['tampil'] ?? 'semua',
            'sort' => $validated['sort'] ?? 'jalis_desc',
        ];
    }

    public function index(Request $request): Response
    {
        $filters = $this->extractFilters($request);
        $report = $this->rekapJalis->buildReport($filters);

        $unitOptions = UptBidang::query()
            ->where('is_active', true)
            ->orderBy('nama')
            ->pluck('nama')
            ->all();

        return Inertia::render('RekapitulasiPegawai/Index', [
            'rows' => $report['rows'],
            'summary' => $report['summary'],
            'charts' => $report['charts'],
            'tarifMap' => $report['tarifMap'],
            'filters' => $filters,
            'statusOptions' => SuratTugasStatus::LABELS,
            'unitOptions' => $unitOptions,
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $filters = $this->extractFilters($request);
        $format = in_array($request->input('format'), ['csv', 'xls'], true)
            ? $request->input('format')
            : 'csv';

        return $this->rekapJalis->export($filters, $format);
    }

    /**
     * Perbarui nominal biaya aktual per pegawai pada suatu surat tugas.
     */
    public function updateBiaya(Request $request, SuratTugasPegawai $suratTugasPegawai): RedirectResponse
    {
        $validated = $request->validate([
            'biaya' => ['nullable', 'integer', 'min:0', 'max:10000000000'],
        ]);

        $suratTugasPegawai->update([
            'biaya' => $validated['biaya'],
        ]);

        return redirect()->back()->with('success', 'Rincian biaya perjalanan dinas pegawai berhasil diperbarui.');
    }

    /**
     * Perbarui tarif harian standar per Tingkat Biaya (A/B/C).
     */
    public function updateTarif(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'tarif' => ['required', 'array'],
            'tarif.*' => ['required', 'integer', 'min:0', 'max:1000000000'],
        ]);

        foreach ($validated['tarif'] as $kode => $nominal) {
            TingkatBiaya::where('kode', strtoupper((string) $kode))->update([
                'tarif_harian' => (int) $nominal,
            ]);
        }

        return redirect()->back()->with('success', 'Standar tarif harian tingkat biaya berhasil diperbarui.');
    }
}
