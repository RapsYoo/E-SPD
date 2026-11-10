<?php

namespace App\Http\Controllers\Ppk;

use App\Http\Controllers\Controller;
use App\Models\SuratTugas;
use App\Models\SuratTugasLog;
use App\Models\SuratTugasPegawai;
use App\Models\TiketPerjalanan;
use App\Models\User;
use App\Support\SuratTugasStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DprController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user instanceof User && $user->role === 'ppk', 403);

        $statusFilter = (string) $request->query('status', 'ALL');
        $search = trim((string) $request->query('search', ''));

        $baseQuery = SuratTugasPegawai::query()
            ->whereHas('suratTugas', fn (Builder $query) => $query
                ->where('ppk_id', $user->id)
                ->where('status', SuratTugasStatus::SELESAI_TERBIT)
                ->where('tanggal_kembali', '<', today()));

        $summaryCounts = (clone $baseQuery)
            ->select('dpr_status', DB::raw('count(*) as total'))
            ->groupBy('dpr_status')
            ->pluck('total', 'dpr_status');

        $pendingCount = (int) ($summaryCounts[SuratTugasPegawai::DPR_PENDING_APPROVAL] ?? 0);
        $approvedCount = (int) ($summaryCounts[SuratTugasPegawai::DPR_APPROVED] ?? 0);
        $draftCount = (int) ($summaryCounts[SuratTugasPegawai::DPR_DRAFT] ?? 0);
        $totalCount = $pendingCount + $approvedCount + $draftCount;

        $listQuery = (clone $baseQuery)->with([
            'suratTugas:id,ppk_id,nomor_st,nomor_spd,perihal_nota,kategori_perjalanan,tempat_berangkat,tempat_tujuan,negara_tujuan,tanggal_berangkat,tanggal_kembali,durasi_hari',
            'tickets:id,surat_tugas_pegawai_id,original_name,created_at',
            'dprApprover:id,name',
        ]);

        if (in_array($statusFilter, [
            SuratTugasPegawai::DPR_PENDING_APPROVAL,
            SuratTugasPegawai::DPR_APPROVED,
            SuratTugasPegawai::DPR_DRAFT,
        ], true)) {
            $listQuery->where('dpr_status', $statusFilter);
        }

        if ($search !== '') {
            $listQuery->where(function (Builder $q) use ($search) {
                $q->where('nama', 'like', "%{$search}%")
                    ->orWhere('nip', 'like', "%{$search}%")
                    ->orWhere('unit_kerja', 'like', "%{$search}%")
                    ->orWhereHas('suratTugas', function (Builder $sq) use ($search) {
                        $sq->where('nomor_st', 'like', "%{$search}%")
                            ->orWhere('nomor_spd', 'like', "%{$search}%")
                            ->orWhere('perihal_nota', 'like', "%{$search}%")
                            ->orWhere('tempat_tujuan', 'like', "%{$search}%");
                    });
            });
        }

        $dprs = $listQuery
            ->orderByRaw("CASE dpr_status WHEN 'MENUNGGU_PERSETUJUAN' THEN 1 WHEN 'DISETUJUI' THEN 2 ELSE 3 END")
            ->orderByDesc('dpr_submitted_at')
            ->orderByDesc('id')
            ->get()
            ->map(fn (SuratTugasPegawai $peserta) => [
                'participant_id' => $peserta->id,
                'surat_tugas_id' => $peserta->suratTugas->id,
                'nama' => $peserta->nama,
                'nip' => $peserta->nip,
                'pangkat' => $peserta->pangkat,
                'golongan' => $peserta->golongan,
                'jabatan' => $peserta->jabatan,
                'unit_kerja' => $peserta->unit_kerja,
                'nomor_st' => $peserta->suratTugas->nomor_st,
                'nomor_spd' => $peserta->suratTugas->nomor_spd,
                'perihal_nota' => $peserta->suratTugas->perihal_nota,
                'kategori_perjalanan' => $peserta->suratTugas->kategori_perjalanan,
                'tempat_berangkat' => $peserta->suratTugas->tempat_berangkat,
                'tempat_tujuan' => $peserta->suratTugas->tempat_tujuan,
                'negara_tujuan' => $peserta->suratTugas->negara_tujuan,
                'tanggal_berangkat' => $peserta->suratTugas->tanggal_berangkat?->toDateString(),
                'tanggal_kembali' => $peserta->suratTugas->tanggal_kembali?->toDateString(),
                'durasi_hari' => $peserta->suratTugas->durasi_hari,
                'dpr_status' => $peserta->dpr_status ?? SuratTugasPegawai::DPR_DRAFT,
                'dpr_submitted_at' => $peserta->dpr_submitted_at?->toIso8601String(),
                'dpr_approved_at' => $peserta->dpr_approved_at?->toIso8601String(),
                'approver_name' => $peserta->dprApprover?->name,
                'cetak_url' => route('ppk.dpr.cetak', [$peserta->suratTugas->id, $peserta->id]),
                'detail_st_url' => route('surat-tugas.show', $peserta->suratTugas->id),
                'tickets' => $peserta->tickets->map(fn ($ticket) => [
                    'id' => $ticket->id,
                    'original_name' => $ticket->original_name,
                    'download_url' => route('ppk.dpr.ticket.download', [
                        $peserta->suratTugas->id,
                        $peserta->id,
                        $ticket->id,
                    ]),
                ])->values(),
            ])
            ->values();

        return Inertia::render('Ppk/Dpr/Index', [
            'dprs' => $dprs,
            'summary' => [
                'total' => $totalCount,
                'pending' => $pendingCount,
                'approved' => $approvedCount,
                'draft' => $draftCount,
            ],
            'filters' => [
                'status' => $statusFilter,
                'search' => $search,
            ],
        ]);
    }

    public function cetak(
        Request $request,
        SuratTugas $suratTugas,
        SuratTugasPegawai $peserta
    ): Response {
        $user = $request->user();
        abort_unless($user instanceof User, 403);
        $this->authorizeAssignedPpk($suratTugas, $user);
        abort_unless((int) $peserta->surat_tugas_id === (int) $suratTugas->id, 404);

        return Inertia::render('Pegawai/PengeluaranRill', [
            'suratTugas' => $suratTugas->only([
                'id',
                'nomor_st',
                'nomor_spd',
                'perihal_nota',
                'kategori_perjalanan',
                'tempat_berangkat',
                'tempat_tujuan',
                'negara_tujuan',
                'tanggal_berangkat',
                'tanggal_kembali',
                'ppk_nama_snapshot',
                'ppk_nip_snapshot',
            ]),
            'pegawai' => $peserta->only([
                'nama',
                'nip',
                'pangkat',
                'golongan',
                'jabatan',
                'unit_kerja',
            ]),
            'backUrl' => route('ppk.dpr.index'),
        ]);
    }

    public function downloadTicket(
        Request $request,
        SuratTugas $suratTugas,
        SuratTugasPegawai $peserta,
        TiketPerjalanan $ticket
    ): StreamedResponse {
        $user = $request->user();
        abort_unless($user instanceof User, 403);
        $this->authorizeAssignedPpk($suratTugas, $user);
        abort_unless((int) $peserta->surat_tugas_id === (int) $suratTugas->id, 404);
        abort_unless(
            in_array($peserta->dpr_status, [
                SuratTugasPegawai::DPR_PENDING_APPROVAL,
                SuratTugasPegawai::DPR_APPROVED,
            ], true),
            404
        );
        abort_unless((int) $ticket->surat_tugas_pegawai_id === (int) $peserta->id, 404);
        abort_unless(Storage::disk('local')->exists($ticket->file_path), 404, 'Berkas tiket tidak ditemukan.');

        return Storage::disk('local')->download($ticket->file_path, $ticket->original_name);
    }

    public function approve(
        Request $request,
        SuratTugas $suratTugas,
        SuratTugasPegawai $peserta
    ): RedirectResponse {
        $user = $request->user();
        abort_unless($user instanceof User, 403);
        $this->authorizeAssignedPpk($suratTugas, $user);
        abort_unless((int) $peserta->surat_tugas_id === (int) $suratTugas->id, 404);

        DB::transaction(function () use ($suratTugas, $peserta, $user): void {
            $lockedPeserta = SuratTugasPegawai::query()->lockForUpdate()->findOrFail($peserta->id);
            abort_unless(
                $lockedPeserta->dpr_status === SuratTugasPegawai::DPR_PENDING_APPROVAL,
                409,
                'DPR ini sudah diproses atau belum dikirim.'
            );
            abort_unless($lockedPeserta->tickets()->exists(), 422, 'DPR belum memiliki bukti pengeluaran.');

            $lockedPeserta->forceFill([
                'dpr_status' => SuratTugasPegawai::DPR_APPROVED,
                'dpr_approved_by' => $user->id,
                'dpr_approved_at' => now(),
            ])->save();

            SuratTugasLog::create([
                'surat_tugas_id' => $suratTugas->id,
                'user_id' => $user->id,
                'aksi' => 'DPR_DISETUJUI',
                'dari_status' => SuratTugasPegawai::DPR_PENDING_APPROVAL,
                'ke_status' => SuratTugasPegawai::DPR_APPROVED,
                'catatan' => 'DPR disetujui untuk '.$lockedPeserta->nama,
            ]);
        });

        return redirect()->back()->with('success', 'DPR '.$peserta->nama.' berhasil disetujui.');
    }

    private function authorizeAssignedPpk(SuratTugas $suratTugas, User $user): void
    {
        abort_unless(
            $user->role === 'ppk'
                && (int) $suratTugas->ppk_id === (int) $user->id
                && $suratTugas->status === SuratTugasStatus::SELESAI_TERBIT
                && $suratTugas->tanggal_kembali?->lt(today()) === true,
            403,
            'Anda bukan PPK yang ditugaskan untuk DPR ini.'
        );
    }
}
