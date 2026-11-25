<?php

namespace App\Http\Requests\SuratTugas;

use App\Models\SuratTugas;
use App\Services\SuratTugas\WorkflowService;
use Illuminate\Validation\Rule;

/**
 * Validasi pengiriman usulan. Tahap 1 hanya menyimpan nota sebagai draft;
 * tahap 2 mengirim nota bersama data PPK, perjalanan, dan pegawai ke Kapus.
 */
class StoreSuratTugasRequest extends ProposerRequest
{
    private ?SuratTugas $draft = null;

    private bool $draftResolved = false;

    protected function deniedMessage(): string
    {
        return 'Hanya Sesparlu/Pemohon atau Admin yang dapat mengirim usulan Surat Tugas.';
    }

    /** Tahap 1 hanya berisi data nota; pengiriman ke Kapus dilakukan setelah tahap 2 lengkap. */
    public function isNoteStep(): bool
    {
        return (int) $this->input('draft_step', 1) === 1;
    }

    /** Draft yang dilanjutkan (null bila usulan baru). Otorisasi akses draft dilakukan di sini. */
    public function draft(): ?SuratTugas
    {
        if (! $this->draftResolved) {
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
            'bendahara_id' => ['nullable', Rule::exists('users', 'id')->where('role', 'bendahara')],
            'tingkat_biaya_kode' => 'required|exists:tingkat_biaya,kode',
            'jenis_angkutan_nama' => 'required|exists:jenis_angkutan,nama',
            'tempat_berangkat' => 'required|string',
            'tempat_tujuan' => 'required|string',
            'is_multi_trip' => 'nullable|boolean',
            'rute_perjalanan' => 'nullable|array|max:4',
            'rute_perjalanan.*.tujuan' => 'required_if:is_multi_trip,true,1|nullable|string|max:255',
            'rute_perjalanan.*.negara' => 'nullable|string|max:255',
            'rute_perjalanan.*.tanggal_berangkat' => 'required_if:is_multi_trip,true,1|nullable|date',
            'rute_perjalanan.*.tanggal_kembali' => 'required_if:is_multi_trip,true,1|nullable|date',
            'rute_perjalanan.*.durasi_hari' => 'nullable|integer|min:1',
            'negara_tujuan' => 'required_if:kategori_perjalanan,LUAR_NEGERI|nullable|string|max:255',
            'no_setneg' => 'required_if:kategori_perjalanan,LUAR_NEGERI|nullable|string|max:255',
            'tanggal_berangkat' => 'required|date',
            'tanggal_kembali' => 'required|date|after_or_equal:tanggal_berangkat',
            'tanggal_surat' => 'nullable|date',
            'tanggal_rpd' => 'nullable|date',
            'durasi_hari' => 'required|integer|min:1',

            // Officers array
            'pegawai_ids' => 'required|array|min:1',
            'pegawai_ids.*' => 'exists:pegawai,id',

            // RPD & Daftar Nominatif per pegawai
            'rpd_data' => 'nullable|array',
            'rpd_data.*.nama_rekening' => 'nullable|string|max:255',
            'rpd_data.*.no_rekening' => 'nullable|string|max:100',
            'rpd_data.*.kode_bank' => 'nullable|string|max:100',
            'rpd_data.*.telah_dibayar' => 'nullable|numeric|min:0',
            'rpd_data.*.items' => 'nullable|array',
            'rpd_data.*.items.*.jenis' => 'nullable|string|max:255',
            'rpd_data.*.items.*.uraian' => 'nullable|string|max:255',
            'rpd_data.*.items.*.jumlah_satuan' => 'nullable|numeric|min:0',
            'rpd_data.*.items.*.satuan' => 'nullable|string|max:50',
            'rpd_data.*.items.*.persentase' => 'nullable|numeric|min:0|max:1000',
            'rpd_data.*.items.*.mata_uang' => 'nullable|in:IDR,USD',
            'rpd_data.*.items.*.besaran' => 'nullable|numeric|min:0',
            'rpd_data.*.items.*.kurs' => 'nullable|numeric|min:0',
        ];
    }
}
