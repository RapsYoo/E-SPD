<?php

namespace App\Http\Requests\SuratTugas;

use App\Models\SuratTugas;
use App\Services\SuratTugas\WorkflowService;
use Illuminate\Validation\Rule;

/**
 * Validasi pengiriman usulan. Tahap 1 (nota ke Kapus) hanya memvalidasi data nota;
 * tahap lanjut memvalidasi juga data PPK, perjalanan, dan pegawai.
 */
class StoreSuratTugasRequest extends ProposerRequest
{
    private ?SuratTugas $draft = null;
    private bool $draftResolved = false;

    protected function deniedMessage(): string
    {
        return 'Hanya Sespalu/Pemohon atau Admin yang dapat mengirim usulan Surat Tugas.';
    }

    /** Tanpa draft_id atau draft_step == 1 → hanya kirim nota ke Kapus. */
    public function isNoteStep(): bool
    {
        return !$this->filled('draft_id') || (int) $this->input('draft_step', 1) === 1;
    }

    /** Draft yang dilanjutkan (null bila usulan baru). Otorisasi akses draft dilakukan di sini. */
    public function draft(): ?SuratTugas
    {
        if (!$this->draftResolved) {
            $this->draftResolved = true;
            if ($this->filled('draft_id')) {
                $this->draft = SuratTugas::findOrFail($this->input('draft_id'));
                app(WorkflowService::class)->assertDraftAccessible($this->draft, $this->user());
            }
        }

        return $this->draft;
    }

    public function rules(): array
    {
        $draft = $this->draft();

        $setnegFileRule = $draft?->file_izin_setneg
            ? 'nullable|file|mimes:pdf,docx|max:10240'
            : 'nullable|required_if:kategori_perjalanan,LUAR_NEGERI|file|mimes:pdf,docx|max:10240';

        $noteRules = [
            'kategori_perjalanan' => 'required|in:DALAM_NEGERI,LUAR_NEGERI',
            'sumber_asal' => 'required|in:INTERNAL,EKSTERNAL',
            'nomor_nota' => 'required|string|max:255',
            'pengirim_nota' => 'required|string|max:255',
            'tanggal_nota' => 'required|date',
            'perihal_nota' => 'required|string',
            'file_undangan' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'file_izin_setneg' => $setnegFileRule,
        ];

        if ($this->isNoteStep()) {
            return $noteRules;
        }

        return $noteRules + [
            // PPK & Travel details
            'ppk_id' => ['required', Rule::exists('users', 'id')->where('role', 'ppk')],
            'tingkat_biaya_kode' => 'required|exists:tingkat_biaya,kode',
            'jenis_angkutan_nama' => 'required|exists:jenis_angkutan,nama',
            'tempat_berangkat' => 'required|string',
            'tempat_tujuan' => 'required|string',
            'negara_tujuan' => 'required_if:kategori_perjalanan,LUAR_NEGERI|nullable|string|max:255',
            'no_setneg' => 'required_if:kategori_perjalanan,LUAR_NEGERI|nullable|string|max:255',
            'tanggal_berangkat' => 'required|date',
            'tanggal_kembali' => 'required|date|after_or_equal:tanggal_berangkat',
            'tanggal_surat' => 'required|date',
            'durasi_hari' => 'required|integer|min:1',

            // Officers array
            'pegawai_ids' => 'required|array|min:1',
            'pegawai_ids.*' => 'exists:pegawai,id',
        ];
    }
}
