<?php

namespace App\Services\SuratTugas;

use App\Exceptions\WorkflowException;
use App\Models\SuratTugas;
use App\Models\User;
use App\Support\SuratTugasStatus as S;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;

/**
 * Transisi status pada alur Surat Tugas: disposisi Kapus, penomoran TU, TTD PPK, draft aktor, arsip, cetak.
 * Pelanggaran peran/status dilempar sebagai WorkflowException (dirender sebagai redirect back + flash error).
 */
class WorkflowService
{
    public function __construct(private AuditLogger $audit) {}

    /** Draft hanya dapat dibuka pada status tertentu dan oleh admin/pemilik (pemohon/sespalu). */
    public function assertDraftAccessible(SuratTugas $suratTugas, ?User $user): void
    {
        abort_unless(in_array($suratTugas->status, S::EDITABLE_DRAFT, true), 404);
        abort_unless(
            $user?->role === 'admin' || (
                in_array($user?->role, ['pemohon', 'sespalu'], true)
                && $suratTugas->user_id === $user->id
            ),
            403,
            'Anda tidak memiliki akses ke draft ini.'
        );
    }

    // Step 2: Disposisi Kapus (Only Kapus or Admin)
    public function disposisi(SuratTugas $suratTugas, User $user, array $validated): void
    {
        $this->assertRole($user, ['kapus', 'admin'], 'Hanya Kepala Pusat (Kapus) atau Admin yang berhak memberikan disposisi.');
        $this->assertStatus($suratTugas, S::MENUNGGU_DISPOSISI_KAPUS, 'Disposisi Kapus hanya dapat dilakukan setelah usulan dikirim oleh Sespalu.');

        $status = match ($validated['kapus_decision']) {
            'YA' => S::DISPOSISI_KAPUS_YA,
            'REVISI' => S::DISPOSISI_KAPUS_REVISI,
            'STOP' => S::DISPOSISI_KAPUS_STOP,
            default => S::MENUNGGU_DISPOSISI_KAPUS,
        };

        $draftData = $suratTugas->draft_data ?? [];
        unset($draftData['kapus']);

        $dari = $suratTugas->status;
        $suratTugas->update([
            'kapus_decision' => $validated['kapus_decision'],
            'catatan_kapus' => $validated['catatan_kapus'] ?? null,
            'status' => $status,
            'draft_data' => $draftData ?: null,
        ]);
        $this->audit->log($suratTugas->fresh(), 'DISPOSISI_'.$validated['kapus_decision'], $dari, $status, $validated['catatan_kapus'] ?? null);
    }

    // Step 4: Penomoran Resmi TU (Only TU or Admin)
    public function penomoran(SuratTugas $suratTugas, User $user, array $validated): void
    {
        $this->assertRole($user, ['tu', 'admin'], 'Hanya Tata Usaha (TU) atau Admin yang berhak melakukan penomoran naskah dinas.');
        $this->assertStatus($suratTugas, S::MENUNGGU_PENOMORAN_TU, 'Penomoran TU hanya dapat dilakukan setelah disposisi Kapus menyetujui usulan.');

        $draftData = $suratTugas->draft_data ?? [];
        unset($draftData['tu']);

        $kapus = $this->kapusAktif();

        try {
            // P1: lock baris agar dua TU tidak bisa rebut nomor yang sama.
            $dari = $suratTugas->status;
            DB::transaction(function () use ($suratTugas, $validated, $draftData, $kapus) {
                SuratTugas::whereKey($suratTugas->id)->lockForUpdate()->firstOrFail();
                $suratTugas->update([
                    'nomor_st' => $validated['nomor_st'],
                    'nomor_spd' => $validated['nomor_spd'],
                    'tanggal_surat' => $validated['tanggal_surat'],
                    'status' => S::SELESAI_TERBIT,
                    'kapus_nama_snapshot' => $kapus['nama'],
                    'kapus_nip_snapshot' => $kapus['nip'],
                    'draft_data' => $draftData ?: null,
                ]);
            });
            $this->audit->log($suratTugas->fresh(), 'PENOMORAN', $dari, S::SELESAI_TERBIT, 'ST: '.$validated['nomor_st'].' | SPD: '.$validated['nomor_spd']);
        } catch (UniqueConstraintViolationException $e) {
            throw new WorkflowException('Nomor ST/SPD sudah dipakai surat lain. Gunakan nomor berbeda.', 0, $e);
        }
    }

    // Step 5: Signature PPK (Only PPK or Admin)
    public function signPpk(SuratTugas $suratTugas, User $user, bool $isSigned): void
    {
        $this->assertRole($user, ['ppk', 'admin'], 'Hanya Pejabat Pembuat Komitmen (PPK) atau Admin yang berhak menyematkan TTD digital.');
        $this->assertStatus($suratTugas, S::SELESAI_TERBIT, 'TTD PPK dapat dilakukan setelah dokumen selesai diterbitkan oleh TU.');

        $draftData = $suratTugas->draft_data ?? [];
        unset($draftData['ppk']);

        $suratTugas->update([
            'is_ppk_signed' => $isSigned,
            'signed_at' => $isSigned ? now() : null,
            'draft_data' => $draftData ?: null,
        ]);
        $this->audit->log(
            $suratTugas->fresh(),
            $isSigned ? 'TTD_PPK' : 'BATAL_TTD_PPK',
            S::SELESAI_TERBIT,
            S::SELESAI_TERBIT,
            $isSigned ? 'PPK menandatangani SPD' : 'TTD PPK dibatalkan'
        );
    }

    /** Simpan draft sementara milik aktor (kapus/tu/ppk) tanpa mengubah status surat. */
    public function saveActorDraft(SuratTugas $suratTugas, string $actor, array $validated): void
    {
        $draftData = $suratTugas->draft_data ?? [];
        $draftData[$actor] = array_merge($draftData[$actor] ?? [], $validated, [
            'saved_at' => now()->toISOString(),
        ]);
        $suratTugas->update(['draft_data' => $draftData]);
    }

    /** Soft-delete (arsip) oleh admin; bisa dipulihkan. */
    public function archive(SuratTugas $suratTugas, ?User $user): void
    {
        abort_unless($user?->role === 'admin', 403, 'Hanya Admin yang dapat menghapus histori Surat Tugas.');

        // P1: soft-delete recoverable — jangan hapus file/snapshot permanen di sini.
        // File fisik hanya dihapus saat forceDelete (via tinker/console), bukan dari UI.
        $this->audit->log($suratTugas, 'HAPUS', $suratTugas->status, null, 'Soft-delete oleh admin');
        $suratTugas->delete();
    }

    /**
     * Usulan yang dihentikan Kapus dapat dibuka kembali oleh pengusul (pemilik) atau admin sebagai draft baru,
     * sehingga alur tidak berhenti buntu. Catatan Kapus dipertahankan sebagai acuan perbaikan.
     */
    public function ajukanUlang(SuratTugas $suratTugas, User $user): void
    {
        $isOwner = in_array($user->role, ['pemohon', 'sespalu'], true) && $suratTugas->user_id === $user->id;
        if ($user->role !== 'admin' && ! $isOwner) {
            throw new WorkflowException('Hanya pengusul surat ini atau Admin yang dapat mengajukan ulang.');
        }
        $this->assertStatus($suratTugas, S::DISPOSISI_KAPUS_STOP, 'Pengajuan ulang hanya untuk usulan yang dihentikan Kapus.');

        $suratTugas->update([
            'status' => S::DRAFT,
            'kapus_decision' => null,
            'draft_step' => 1,
        ]);
        $this->audit->log($suratTugas->fresh(), 'AJUKAN_ULANG', S::DISPOSISI_KAPUS_STOP, S::DRAFT, 'Usulan dibuka kembali sebagai draft setelah dihentikan Kapus');
    }

    /**
     * Pejabat Kapus aktif (akun role kapus) untuk penandatangan Surat Tugas.
     *
     * @return array{nama: ?string, nip: ?string}
     */
    public function kapusAktif(): array
    {
        $kapus = User::with('pegawai')->where('role', 'kapus')->orderBy('id')->first();

        return [
            'nama' => $kapus?->pegawai?->nama ?? $kapus?->name,
            'nip' => $kapus?->pegawai?->nip,
        ];
    }

    /** P1: akses cetak luas (TU/admin/kapus/ppk + pemilik), status minimal disetujui Kapus. */
    public function canPrint(SuratTugas $suratTugas, ?User $user): bool
    {
        if ($user?->role === S::PEGAWAI_ROLE) {
            return $this->canView($suratTugas, $user);
        }

        $isOwner = $suratTugas->user_id === $user?->id;
        $allowedRole = in_array($user?->role, S::PRINT_ROLES, true) || $isOwner;
        $allowedStatus = in_array($suratTugas->status, S::PRINTABLE, true);

        return $allowedRole && $allowedStatus;
    }

    /** Role pegawai hanya boleh melihat surat terbit yang menugaskan dirinya; role lain tidak dibatasi. */
    public function canView(SuratTugas $suratTugas, ?User $user): bool
    {
        if ($user?->role !== S::PEGAWAI_ROLE) {
            return true;
        }

        return in_array($suratTugas->status, S::PEGAWAI_VISIBLE, true)
            && $suratTugas->isDiikutiPegawai($user->pegawai_id);
    }

    public function logPrint(SuratTugas $suratTugas, ?User $user): void
    {
        $this->audit->log($suratTugas, 'CETAK', $suratTugas->status, $suratTugas->status, 'Dokumen dicetak oleh '.$user?->role);
    }

    private function assertRole(User $user, array $roles, string $message): void
    {
        if (! in_array($user->role, $roles, true)) {
            throw new WorkflowException($message);
        }
    }

    private function assertStatus(SuratTugas $suratTugas, string $status, string $message): void
    {
        if ($suratTugas->status !== $status) {
            throw new WorkflowException($message);
        }
    }
}
