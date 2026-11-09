<?php

namespace App\Http\Controllers\Pegawai;

use App\Http\Controllers\Controller;
use App\Models\SuratTugas;
use App\Models\SuratTugasPegawai;
use App\Models\TiketPerjalanan;
use App\Models\User;
use App\Support\SuratTugasStatus;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class TiketPerjalananController extends Controller
{
    public function store(Request $request, SuratTugas $suratTugas): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);
        $peserta = $this->completedTripParticipant($suratTugas, $user);
        abort_unless($suratTugas->ppk_id !== null, 422, 'PPK perjalanan dinas belum ditetapkan.');
        abort_unless($peserta->dpr_status === SuratTugasPegawai::DPR_DRAFT, 409, 'DPR sudah dikirim atau disetujui PPK.');

        $validated = $request->validate([
            'tickets' => ['required', 'array', 'min:1', 'max:5'],
            'tickets.*' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
        ], [
            'tickets.required' => 'Pilih setidaknya satu tiket perjalanan.',
            'tickets.max' => 'Maksimal 5 tiket dapat diunggah sekaligus.',
            'tickets.*.mimes' => 'Tiket harus berformat PDF, JPG, atau PNG.',
            'tickets.*.max' => 'Ukuran setiap tiket maksimal 10 MB.',
        ]);

        $storedPaths = [];
        try {
            DB::transaction(function () use ($validated, $suratTugas, $peserta, $user, &$storedPaths): void {
                $peserta = SuratTugasPegawai::query()->lockForUpdate()->findOrFail($peserta->id);
                abort_unless($peserta->dpr_status === SuratTugasPegawai::DPR_DRAFT, 409, 'DPR sudah dikirim atau disetujui PPK.');

                foreach ($validated['tickets'] as $file) {
                    $path = $file->store('tiket-perjalanan/'.$suratTugas->id.'/'.$peserta->id, 'local');
                    if (! is_string($path)) {
                        throw new RuntimeException('Tiket gagal disimpan. Silakan coba kembali.');
                    }

                    $storedPaths[] = $path;
                    $peserta->tickets()->create([
                        'uploaded_by' => $user->id,
                        'file_path' => $path,
                        'original_name' => basename($file->getClientOriginalName()),
                    ]);
                }

                $peserta->forceFill([
                    'dpr_status' => SuratTugasPegawai::DPR_PENDING_APPROVAL,
                    'dpr_submitted_at' => now(),
                ])->save();
            });
        } catch (Throwable $exception) {
            Storage::disk('local')->delete($storedPaths);
            throw $exception;
        }

        return redirect()->back()->with('success', 'Tiket perjalanan berhasil diunggah.');
    }

    public function download(
        Request $request,
        SuratTugas $suratTugas,
        TiketPerjalanan $ticket
    ): StreamedResponse {
        $user = $request->user();
        abort_unless($user instanceof User, 403);
        $peserta = $this->completedTripParticipant($suratTugas, $user);

        abort_unless((int) $ticket->surat_tugas_pegawai_id === (int) $peserta->id, 404);
        abort_unless(Storage::disk('local')->exists($ticket->file_path), 404, 'Berkas tiket tidak ditemukan.');

        return Storage::disk('local')->download($ticket->file_path, $ticket->original_name);
    }

    public function cetakPengeluaranRill(Request $request, SuratTugas $suratTugas): Response
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);
        $peserta = $this->completedTripParticipant($suratTugas, $user);

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
        ]);
    }

    private function completedTripParticipant(SuratTugas $suratTugas, User $user): SuratTugasPegawai
    {
        abort_unless(
            $user->role === SuratTugasStatus::PEGAWAI_ROLE
                && $user->pegawai_id !== null
                && $suratTugas->status === SuratTugasStatus::SELESAI_TERBIT
                && $suratTugas->tanggal_kembali?->lt(today()) === true,
            403,
            'Fitur ini tersedia setelah perjalanan dinas Anda selesai.'
        );

        $peserta = $suratTugas->pegawaiList()
            ->where('pegawai_id', $user->pegawai_id)
            ->first();

        abort_unless($peserta instanceof SuratTugasPegawai, 403, 'Anda bukan peserta perjalanan dinas ini.');

        return $peserta;
    }
}
