<?php

namespace App\Services\SuratTugas;

use App\Models\SuratTugas;
use App\Models\User;
use App\Support\SuratTugasStatus;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

/**
 * Pengiriman usulan: tahap 1 (nota ke Kapus) dan pengiriman lengkap (ke TU / kembali ke Kapus).
 */
class SubmissionService
{
    public function __construct(
        private AttachmentService $attachments,
        private PegawaiSnapshotService $snapshots,
        private AuditLogger $audit,
    ) {
    }

    /** Pesan sukses untuk pengiriman lengkap, mengikuti status akhir. */
    public function messageFor(SuratTugas $suratTugas): string
    {
        return $suratTugas->status === SuratTugasStatus::MENUNGGU_PENOMORAN_TU
            ? 'Draft Surat Tugas & SPD berhasil dikirim ke TU untuk verifikasi dan penomoran.'
            : 'Nota/undangan berhasil dikirim ke Kapus dan sedang menunggu persetujuan.';
    }

    /**
     * Tahap 1: kirim nota/undangan ke Kapus.
     *
     * @param  array<string, mixed>  $validated
     */
    public function submitNote(array $validated, ?UploadedFile $undangan, ?UploadedFile $setneg, User $user, ?SuratTugas $draft = null): SuratTugas
    {
        $files = $this->attachments->store($undangan, $setneg, $draft);

        $draftData = $draft?->draft_data ?? [];
        unset($draftData['kapus']);
        $draftData = array_merge($draftData, $files->names);

        $values = [
            'user_id' => $draft?->user_id ?? $user->id,
            'kategori_perjalanan' => $validated['kategori_perjalanan'],
            'sumber_asal' => $validated['sumber_asal'],
            'nomor_nota' => $validated['nomor_nota'],
            'pengirim_nota' => $validated['pengirim_nota'],
            'tanggal_nota' => $validated['tanggal_nota'],
            'perihal_nota' => $validated['perihal_nota'],
            'file_undangan' => $files->undangan,
            'file_izin_setneg' => $files->setneg,
            'status' => SuratTugasStatus::MENUNGGU_DISPOSISI_KAPUS,
            'kapus_decision' => null,
            'catatan_kapus' => null,
            'draft_data' => $draftData ?: null,
            'draft_step' => null,
        ];

        $suratTugas = null;
        try {
            DB::transaction(function () use ($draft, $values, &$suratTugas) {
                $suratTugas = $draft ?? new SuratTugas();
                $suratTugas->fill($values);
                $suratTugas->save();
            });
        } catch (\Throwable $e) {
            $files->rollback();
            throw $e;
        }

        $files->commit();

        $this->audit->log($suratTugas, 'KIRIM_KE_KAPUS', $draft?->status ?? SuratTugasStatus::DRAFT, SuratTugasStatus::MENUNGGU_DISPOSISI_KAPUS, 'Nota dikirim ke Kapus');

        return $suratTugas;
    }

    /**
     * Pengiriman lengkap: ke TU bila Kapus sudah menyetujui, selain itu ke Kapus.
     *
     * @param  array<string, mixed>  $validated
     */
    public function submitFull(array $validated, ?UploadedFile $undangan, ?UploadedFile $setneg, User $user, ?SuratTugas $draft = null): SuratTugas
    {
        $ppk = User::with('pegawai')->where('role', 'ppk')->findOrFail($validated['ppk_id']);
        $ppkNama = $ppk->pegawai?->nama ?? $ppk->name;
        $ppkNip = $ppk->pegawai?->nip ?? '';
        $files = $this->attachments->store($undangan, $setneg, $draft);

        $values = [
            'user_id' => $draft?->user_id ?? $user->id,
            'kategori_perjalanan' => $validated['kategori_perjalanan'],
            'sumber_asal' => $validated['sumber_asal'],
            'nomor_nota' => $validated['nomor_nota'],
            'pengirim_nota' => $validated['pengirim_nota'],
            'tanggal_nota' => $validated['tanggal_nota'],
            'perihal_nota' => $validated['perihal_nota'],
            'file_undangan' => $files->undangan,
            'file_izin_setneg' => $files->setneg,
            'status' => $draft?->kapus_decision === 'YA'
                ? SuratTugasStatus::MENUNGGU_PENOMORAN_TU
                : SuratTugasStatus::MENUNGGU_DISPOSISI_KAPUS,
            'ppk_id' => $ppk->id,
            'ppk_nama_snapshot' => $ppkNama,
            'ppk_nip_snapshot' => $ppkNip,
            'tingkat_biaya_kode' => $validated['tingkat_biaya_kode'],
            'jenis_angkutan_nama' => $validated['jenis_angkutan_nama'],
            'tempat_berangkat' => $validated['tempat_berangkat'],
            'tempat_tujuan' => $validated['tempat_tujuan'],
            'negara_tujuan' => $validated['negara_tujuan'] ?? null,
            'no_setneg' => $validated['no_setneg'] ?? null,
            'tanggal_berangkat' => $validated['tanggal_berangkat'],
            'tanggal_kembali' => $validated['tanggal_kembali'],
            'tanggal_surat' => $validated['tanggal_surat'],
            'durasi_hari' => $validated['durasi_hari'],
            'draft_data' => null,
            'draft_step' => null,
        ];

        $suratTugas = null;
        try {
            DB::transaction(function () use ($draft, $values, $validated, &$suratTugas) {
                $suratTugas = $draft ?? new SuratTugas();
                $suratTugas->fill($values);
                $suratTugas->save();

                $this->snapshots->sync($suratTugas, $validated['pegawai_ids']);
            });
        } catch (\Throwable $e) {
            $files->rollback();
            throw $e;
        }

        $files->commit();

        $toTu = $suratTugas->status === SuratTugasStatus::MENUNGGU_PENOMORAN_TU;
        $this->audit->log(
            $suratTugas,
            $toTu ? 'KIRIM_KE_TU' : 'KIRIM_KE_KAPUS',
            $draft?->status ?? SuratTugasStatus::DRAFT,
            $suratTugas->status,
            $this->messageFor($suratTugas),
        );

        return $suratTugas;
    }
}
