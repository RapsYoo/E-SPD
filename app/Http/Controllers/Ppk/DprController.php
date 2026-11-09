<?php

namespace App\Http\Controllers\Ppk;

use App\Http\Controllers\Controller;
use App\Models\SuratTugas;
use App\Models\SuratTugasLog;
use App\Models\SuratTugasPegawai;
use App\Models\TiketPerjalanan;
use App\Models\User;
use App\Support\SuratTugasStatus;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DprController extends Controller
{
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
