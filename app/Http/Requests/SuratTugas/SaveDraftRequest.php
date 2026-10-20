<?php

namespace App\Http\Requests\SuratTugas;

use App\Models\SuratTugas;
use App\Services\SuratTugas\WorkflowService;

/**
 * Validasi simpan draft (longgar: semua field opsional).
 */
class SaveDraftRequest extends ProposerRequest
{
    protected function deniedMessage(): string
    {
        return 'Hanya Sespalu/Pemohon atau Admin yang dapat menyimpan draft.';
    }

    public function authorize(): bool
    {
        if (!parent::authorize()) {
            return false;
        }

        // Update draft: pastikan draft boleh diakses sebelum validasi (404/403).
        $draft = $this->route('suratTugas');
        if ($draft instanceof SuratTugas) {
            app(WorkflowService::class)->assertDraftAccessible($draft, $this->user());
        }

        return true;
    }

    public function rules(): array
    {
        return [
            'draft_step' => 'required|integer|between:1,4',
            'kategori_perjalanan' => 'nullable|in:DALAM_NEGERI,LUAR_NEGERI',
            'sumber_asal' => 'nullable|in:INTERNAL,EKSTERNAL',
            'nomor_nota' => 'nullable|string|max:255',
            'pengirim_nota' => 'nullable|string|max:255',
            'tanggal_nota' => 'nullable|date',
            'perihal_nota' => 'nullable|string',
            'file_undangan' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'file_izin_setneg' => 'nullable|file|mimes:pdf,docx|max:10240',
            'ppk_id' => 'nullable|exists:ppk,id',
            'tingkat_biaya_kode' => 'nullable|exists:tingkat_biaya,kode',
            'jenis_angkutan_nama' => 'nullable|exists:jenis_angkutan,nama',
            'tempat_berangkat' => 'nullable|string|max:255',
            'tempat_tujuan' => 'nullable|string|max:255',
            'negara_tujuan' => 'nullable|string|max:255',
            'no_setneg' => 'nullable|string|max:255',
            'tanggal_berangkat' => 'nullable|date',
            'tanggal_kembali' => 'nullable|date',
            'tanggal_surat' => 'nullable|date',
            'durasi_hari' => 'nullable|integer|min:1',
            'pegawai_ids' => 'nullable|array',
            'pegawai_ids.*' => 'exists:pegawai,id',
        ];
    }
}
