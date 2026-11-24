<?php

namespace App\Http\Controllers\Bendahara;

use App\Http\Controllers\Controller;
use App\Models\SuratTugas;
use App\Models\SuratTugasLog;
use App\Models\SuratTugasPegawai;
use App\Models\User;
use App\Services\Admin\RbacService;
use App\Services\SuratTugas\WorkflowService;
use App\Support\SuratTugasStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PembiayaanController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless(
            $user instanceof User && app(RbacService::class)->hasPermission($user, 'pembiayaan.manage_bendahara'),
            403
        );

        $statusFilter = (string) $request->query('status', 'ALL');
        $search = trim((string) $request->query('search', ''));

        $baseQuery = SuratTugas::query()
            ->where('status', '!=', SuratTugasStatus::DRAFT)
            ->when($user->role === 'bendahara', function (Builder $q) use ($user) {
                $q->where(function (Builder $sub) use ($user) {
                    $sub->where('bendahara_id', $user->id)
                        ->orWhereNull('bendahara_id');
                });
            });

        $summaryCounts = (clone $baseQuery)
            ->select('pembiayaan_status', DB::raw('count(*) as total'))
            ->groupBy('pembiayaan_status')
            ->pluck('total', 'pembiayaan_status');

        $pendingCount = (int) ($summaryCounts[SuratTugas::PEMBIAYAAN_MENUNGGU] ?? 0);
        $approvedCount = (int) ($summaryCounts[SuratTugas::PEMBIAYAAN_DISETUJUI] ?? 0);
        $revisiCount = (int) ($summaryCounts[SuratTugas::PEMBIAYAAN_REVISI] ?? 0);
        $belumDiisiCount = (int) ($summaryCounts[SuratTugas::PEMBIAYAAN_BELUM_DIISI] ?? 0);
        $totalCount = $pendingCount + $approvedCount + $revisiCount + $belumDiisiCount;

        $listQuery = (clone $baseQuery)->with([
            'pegawaiList',
            'ppk.pegawai',
            'bendahara.pegawai',
            'pembiayaanApprover:id,name',
            'user:id,name',
        ]);

        if (in_array($statusFilter, [
            SuratTugas::PEMBIAYAAN_MENUNGGU,
            SuratTugas::PEMBIAYAAN_DISETUJUI,
            SuratTugas::PEMBIAYAAN_REVISI,
            SuratTugas::PEMBIAYAAN_BELUM_DIISI,
        ], true)) {
            $listQuery->where('pembiayaan_status', $statusFilter);
        }

        if ($search !== '') {
            $listQuery->where(function (Builder $q) use ($search) {
                $q->where('nomor_nota', 'like', "%{$search}%")
                    ->orWhere('nomor_st', 'like', "%{$search}%")
                    ->orWhere('nomor_spd', 'like', "%{$search}%")
                    ->orWhere('perihal_nota', 'like', "%{$search}%")
                    ->orWhere('tempat_tujuan', 'like', "%{$search}%")
                    ->orWhereHas('pegawaiList', function (Builder $pq) use ($search) {
                        $pq->where('nama', 'like', "%{$search}%")
                            ->orWhere('nip', 'like', "%{$search}%");
                    });
            });
        }

        $items = $listQuery
            ->orderByRaw("CASE pembiayaan_status WHEN 'MENUNGGU_PERSETUJUAN' THEN 1 WHEN 'PERLU_REVISI' THEN 2 WHEN 'DISETUJUI' THEN 3 ELSE 4 END")
            ->orderByDesc('created_at')
            ->get()
            ->map(function (SuratTugas $st) {
                $totalBiaya = (int) $st->pegawaiList->sum('rpd_total');

                return [
                    'id' => $st->id,
                    'nomor_nota' => $st->nomor_nota,
                    'nomor_st' => $st->nomor_st,
                    'nomor_spd' => $st->nomor_spd,
                    'perihal_nota' => $st->perihal_nota,
                    'kategori_perjalanan' => $st->kategori_perjalanan,
                    'tempat_berangkat' => $st->tempat_berangkat,
                    'tempat_tujuan' => $st->tempat_tujuan,
                    'negara_tujuan' => $st->negara_tujuan,
                    'tanggal_berangkat' => $st->tanggal_berangkat?->toDateString(),
                    'tanggal_kembali' => $st->tanggal_kembali?->toDateString(),
                    'durasi_hari' => $st->durasi_hari,
                    'status' => $st->status,
                    'status_label' => SuratTugasStatus::LABELS[$st->status] ?? $st->status,
                    'pembiayaan_status' => $st->pembiayaan_status ?: SuratTugas::PEMBIAYAAN_BELUM_DIISI,
                    'pembiayaan_approved_at' => $st->pembiayaan_approved_at?->toIso8601String(),
                    'approver_name' => $st->pembiayaanApprover?->name,
                    'catatan_bendahara' => $st->catatan_bendahara,
                    'pengusul_name' => $st->user?->name,
                    'total_biaya' => $totalBiaya,
                    'detail_st_url' => route('surat-tugas.show', $st->id),
                    'cetak_nominatif_url' => route('surat-tugas.cetak-nominatif', $st->id),
                    'cetak_rpd_all_url' => route('surat-tugas.cetak-rpd', $st->id),
                    'pegawai_list' => $st->pegawaiList->map(fn (SuratTugasPegawai $p) => [
                        'id' => $p->id,
                        'nama' => $p->nama,
                        'nip' => $p->nip,
                        'jabatan' => $p->jabatan,
                        'golongan' => $p->golongan,
                        'rpd_total' => (int) ($p->rpd_total ?? 0),
                        'items_count' => is_array($p->rpd_items) ? count($p->rpd_items) : 0,
                        'no_rekening' => $p->no_rekening,
                        'kode_bank' => $p->kode_bank,
                        'cetak_rpd_url' => route('surat-tugas.cetak-rpd', [$st->id, $p->id]),
                    ])->values(),
                ];
            })
            ->values();

        return Inertia::render('Bendahara/Pembiayaan/Index', [
            'items' => $items,
            'summary' => [
                'total' => $totalCount,
                'pending' => $pendingCount,
                'approved' => $approvedCount,
                'other' => $revisiCount + $belumDiisiCount,
            ],
            'filters' => [
                'status' => $statusFilter,
                'search' => $search,
            ],
        ]);
    }

    public function approve(Request $request, SuratTugas $suratTugas): RedirectResponse
    {
        $user = $request->user();
        abort_unless(
            $user instanceof User && app(RbacService::class)->hasPermission($user, 'pembiayaan.manage_bendahara'),
            403
        );

        $validated = $request->validate([
            'catatan_bendahara' => ['nullable', 'string', 'max:1000'],
        ]);

        $user->loadMissing('pegawai');
        $bendaharaNama = $suratTugas->bendahara_nama_snapshot ?: ($user->pegawai?->nama ?? $user->name);
        $bendaharaNip = $suratTugas->bendahara_nip_snapshot ?: ($user->pegawai?->nip ?? '');

        $suratTugas->update([
            'bendahara_id' => $suratTugas->bendahara_id ?? ($user->role === 'bendahara' ? $user->id : null),
            'bendahara_nama_snapshot' => $bendaharaNama,
            'bendahara_nip_snapshot' => $bendaharaNip,
            'pembiayaan_status' => SuratTugas::PEMBIAYAAN_DISETUJUI,
            'pembiayaan_approved_at' => now(),
            'pembiayaan_approved_by' => $user->id,
            'catatan_bendahara' => $validated['catatan_bendahara'] ?? $suratTugas->catatan_bendahara,
        ]);

        SuratTugasLog::create([
            'surat_tugas_id' => $suratTugas->id,
            'user_id' => $user->id,
            'aksi' => 'APPROVE_PEMBIAYAAN',
            'status_dari' => $suratTugas->status,
            'status_ke' => $suratTugas->status,
            'keterangan' => 'Pembiayaan (RPD & Daftar Nominatif) disetujui oleh Bendahara Pengeluaran ('.$user->name.').'
                .(! empty($validated['catatan_bendahara']) ? ' Catatan: '.$validated['catatan_bendahara'] : ''),
        ]);

        return redirect()->back()->with('success', 'Pembiayaan (RPD & Daftar Nominatif) berhasil disetujui.');
    }

    public function revisi(Request $request, SuratTugas $suratTugas): RedirectResponse
    {
        $user = $request->user();
        abort_unless(
            $user instanceof User && app(RbacService::class)->hasPermission($user, 'pembiayaan.manage_bendahara'),
            403
        );

        $validated = $request->validate([
            'catatan_bendahara' => ['required', 'string', 'max:1000'],
        ]);

        $suratTugas->update([
            'pembiayaan_status' => SuratTugas::PEMBIAYAAN_REVISI,
            'pembiayaan_approved_at' => null,
            'pembiayaan_approved_by' => null,
            'catatan_bendahara' => $validated['catatan_bendahara'],
        ]);

        SuratTugasLog::create([
            'surat_tugas_id' => $suratTugas->id,
            'user_id' => $user->id,
            'aksi' => 'CATATAN_BENDAHARA',
            'status_dari' => $suratTugas->status,
            'status_ke' => $suratTugas->status,
            'keterangan' => 'Bendahara Pengeluaran memberi catatan revisi pembiayaan: '.$validated['catatan_bendahara'],
        ]);

        return redirect()->back()->with('success', 'Catatan revisi pembiayaan berhasil dikirim.');
    }

    public function cetakRpd(Request $request, SuratTugas $suratTugas, ?SuratTugasPegawai $peserta = null): Response
    {
        $user = $request->user();
        $canManage = $user instanceof User && app(RbacService::class)->hasPermission($user, 'pembiayaan.manage_bendahara');
        abort_unless($canManage || app(WorkflowService::class)->canView($suratTugas, $user), 403);

        if ($peserta !== null) {
            abort_unless($peserta->surat_tugas_id === $suratTugas->id, 404);
        }

        $suratTugas->load(['pegawaiList', 'ppk.pegawai', 'bendahara.pegawai', 'pembiayaanApprover.pegawai']);
        $bendahara = $this->resolveBendahara($suratTugas);
        $ppk = $this->resolvePpk($suratTugas);

        return Inertia::render('Bendahara/Pembiayaan/CetakRpd', [
            'suratTugas' => $suratTugas,
            'selectedPesertaId' => $peserta?->id ?? $suratTugas->pegawaiList->first()?->id,
            'bendahara' => $bendahara,
            'ppk' => $ppk,
            'backUrl' => $canManage ? route('bendahara.pembiayaan.index') : route('surat-tugas.show', $suratTugas->id),
        ]);
    }

    public function cetakNominatif(Request $request, SuratTugas $suratTugas): Response
    {
        $user = $request->user();
        $canManage = $user instanceof User && app(RbacService::class)->hasPermission($user, 'pembiayaan.manage_bendahara');
        abort_unless($canManage || app(WorkflowService::class)->canView($suratTugas, $user), 403);

        $suratTugas->load(['pegawaiList', 'ppk.pegawai', 'bendahara.pegawai', 'pembiayaanApprover.pegawai']);
        $bendahara = $this->resolveBendahara($suratTugas);
        $ppk = $this->resolvePpk($suratTugas);

        return Inertia::render('Bendahara/Pembiayaan/CetakNominatif', [
            'suratTugas' => $suratTugas,
            'bendahara' => $bendahara,
            'ppk' => $ppk,
            'backUrl' => $canManage ? route('bendahara.pembiayaan.index') : route('surat-tugas.show', $suratTugas->id),
        ]);
    }

    /** @return array{nama: string, nip: string} */
    private function resolveBendahara(SuratTugas $suratTugas): array
    {
        if (! empty($suratTugas->bendahara_nama_snapshot)) {
            return [
                'nama' => $suratTugas->bendahara_nama_snapshot,
                'nip' => $suratTugas->bendahara_nip_snapshot ?: '-',
            ];
        }

        $user = $suratTugas->bendahara
            ?? $suratTugas->pembiayaanApprover
            ?? User::with('pegawai')->where('role', 'bendahara')->orderBy('id')->first();

        return [
            'nama' => $user?->pegawai?->nama ?? $user?->name ?? '........................................',
            'nip' => $user?->pegawai?->nip ?: '-',
        ];
    }

    /** @return array{nama: string, nip: string} */
    private function resolvePpk(SuratTugas $suratTugas): array
    {
        return [
            'nama' => $suratTugas->ppk_nama_snapshot ?: ($suratTugas->ppk?->pegawai?->nama ?? $suratTugas->ppk?->name ?? '-'),
            'nip' => $suratTugas->ppk_nip_snapshot ?: ($suratTugas->ppk?->pegawai?->nip ?? '-'),
        ];
    }
}
