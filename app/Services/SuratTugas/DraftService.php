<?php

namespace App\Services\SuratTugas;

use App\Models\JenisAngkutan;
use App\Models\Pegawai;
use App\Models\Ppk;
use App\Models\SuratTugas;
use App\Models\TingkatBiaya;
use App\Models\UnitKerja;
use App\Models\User;
use App\Support\SuratTugasStatus;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

/**
 * Penyimpanan & pembacaan draft usulan Surat Tugas.
 */
class DraftService
{
    public function __construct(
        private AttachmentService $attachments,
        private PegawaiSnapshotService $snapshots,
    ) {
    }

    /** Daftar referensi aktif untuk form pembuatan/pengeditan usulan. */
    public function formOptions(): array
    {
        return [
            'pegawaiList' => Pegawai::where('is_active', true)->orderBy('nama')->get(),
            'ppkList' => Ppk::where('is_active', true)->orderBy('nama')->get(),
            'unitKerjaList' => UnitKerja::where('is_active', true)->orderBy('nama')->get(),
            'tingkatBiayaList' => TingkatBiaya::where('is_active', true)->orderBy('kode')->get(),
            'jenisAngkutanList' => JenisAngkutan::where('is_active', true)->orderBy('nama')->get(),
        ];
    }

    /** Data awal form saat draft dibuka kembali. */
    public function editPayload(SuratTugas $suratTugas): array
    {
        $suratTugas->load(['pegawaiList', 'ppk']);

        $draftStep = match ($suratTugas->status) {
            SuratTugasStatus::DISPOSISI_KAPUS_YA => 3,
            SuratTugasStatus::DISPOSISI_KAPUS_REVISI => 1,
            default => $suratTugas->draft_step ?? 1,
        };

        $draftData = array_merge([
            'kategori_perjalanan' => $suratTugas->kategori_perjalanan,
            'sumber_asal' => $suratTugas->sumber_asal,
            'nomor_nota' => $suratTugas->nomor_nota,
            'pengirim_nota' => $suratTugas->pengirim_nota,
            'tanggal_nota' => $suratTugas->tanggal_nota,
            'perihal_nota' => $suratTugas->perihal_nota,
            'ppk_id' => $suratTugas->ppk_id ?? '',
            'tingkat_biaya_kode' => $suratTugas->tingkat_biaya_kode,
            'jenis_angkutan_nama' => $suratTugas->jenis_angkutan_nama,
            'tempat_berangkat' => $suratTugas->tempat_berangkat,
            'tempat_tujuan' => $suratTugas->tempat_tujuan,
            'negara_tujuan' => $suratTugas->negara_tujuan,
            'no_setneg' => $suratTugas->no_setneg,
            'tanggal_berangkat' => $suratTugas->tanggal_berangkat,
            'tanggal_kembali' => $suratTugas->tanggal_kembali,
            'tanggal_surat' => $suratTugas->tanggal_surat,
            'durasi_hari' => $suratTugas->durasi_hari,
        ], $suratTugas->draft_data ?? []);
        $draftData['draft_id'] = $suratTugas->id;
        $draftData['draft_step'] = $draftStep;
        $draftData['pegawai_ids'] = $draftData['pegawai_ids']
            ?? $suratTugas->pegawaiList->pluck('pegawai_id')->filter()->values()->all();

        return [
            'draft' => $suratTugas,
            'draftData' => $draftData,
            'draftStep' => $draftStep,
            'draftAttachments' => $this->attachments->payload($suratTugas, $draftData),
        ];
    }

    /**
     * Simpan draft (buat baru bila $suratTugas null). Validasi longgar: field kosong diberi default.
     *
     * @param  array<string, mixed>  $validated
     */
    public function save(array $validated, ?UploadedFile $undangan, ?UploadedFile $setneg, User $user, ?SuratTugas $suratTugas = null): SuratTugas
    {
        $draftData = collect($validated)->except(['file_undangan', 'file_izin_setneg', 'draft_step'])->all();

        // P0-verifikasi: bawa nama file lama + sub-draft actor agar tidak hilang saat update parsial.
        $existingDraft = $suratTugas?->draft_data ?? [];
        foreach (['file_undangan_name', 'file_izin_setneg_name', 'kapus', 'tu', 'ppk'] as $keep) {
            if (!array_key_exists($keep, $draftData) && array_key_exists($keep, $existingDraft)) {
                $draftData[$keep] = $existingDraft[$keep];
            }
        }
        // pegawai_ids kondisional LUAR_NEGERI/DALAM_NEGERI: jangan timpa dengan kosong bila tidak dikirim.
        if (!array_key_exists('pegawai_ids', $validated) && array_key_exists('pegawai_ids', $existingDraft)) {
            $draftData['pegawai_ids'] = $existingDraft['pegawai_ids'];
        }

        $files = $this->attachments->store($undangan, $setneg, $suratTugas);
        $draftData = array_merge($draftData, $files->names);

        $ppk = !empty($validated['ppk_id']) ? Ppk::find($validated['ppk_id']) : null;
        $values = [
            'user_id' => $suratTugas?->user_id ?? $user->id,
            'kategori_perjalanan' => $validated['kategori_perjalanan'] ?? 'DALAM_NEGERI',
            'sumber_asal' => $validated['sumber_asal'] ?? 'EKSTERNAL',
            'nomor_nota' => $validated['nomor_nota'] ?? '[Draft belum lengkap]',
            'pengirim_nota' => $validated['pengirim_nota'] ?? '[Belum diisi]',
            'tanggal_nota' => $validated['tanggal_nota'] ?? now()->toDateString(),
            'perihal_nota' => $validated['perihal_nota'] ?? '[Draft belum lengkap]',
            'file_undangan' => $files->undangan,
            'file_izin_setneg' => $files->setneg,
            'status' => $suratTugas?->status ?? SuratTugasStatus::DRAFT,
            'ppk_id' => $ppk?->id,
            'ppk_nama_snapshot' => $ppk?->nama,
            'ppk_nip_snapshot' => $ppk?->nip,
            'tingkat_biaya_kode' => $validated['tingkat_biaya_kode'] ?? 'C',
            'jenis_angkutan_nama' => $validated['jenis_angkutan_nama'] ?? 'Perjalanan Darat',
            'tempat_berangkat' => $validated['tempat_berangkat'] ?? 'Jakarta',
            'tempat_tujuan' => $validated['tempat_tujuan'] ?? null,
            'negara_tujuan' => $validated['negara_tujuan'] ?? null,
            'no_setneg' => $validated['no_setneg'] ?? null,
            'tanggal_berangkat' => $validated['tanggal_berangkat'] ?? null,
            'tanggal_kembali' => $validated['tanggal_kembali'] ?? null,
            'tanggal_surat' => $validated['tanggal_surat'] ?? null,
            'durasi_hari' => $validated['durasi_hari'] ?? 1,
            'draft_data' => $draftData,
            'draft_step' => $validated['draft_step'],
        ];

        $pegawaiIds = $validated['pegawai_ids'] ?? $draftData['pegawai_ids'] ?? [];

        try {
            DB::transaction(function () use ($values, $pegawaiIds, &$suratTugas) {
                if ($suratTugas) {
                    $suratTugas->update($values);
                } else {
                    $suratTugas = SuratTugas::create($values);
                }

                $this->snapshots->sync($suratTugas, $pegawaiIds);
            });
        } catch (\Throwable $e) {
            // Rollback file baru agar tidak yatim saat DB gagal.
            $files->rollback();
            throw $e;
        }

        $files->commit();

        return $suratTugas;
    }
}
