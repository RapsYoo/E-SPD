<?php

namespace App\Http\Requests\Admin;

use App\Models\Pegawai;
use Closure;
use Illuminate\Foundation\Http\FormRequest;

/** Validasi tambah (POST) & ubah (PUT/PATCH) data pegawai. */
class PegawaiRequest extends FormRequest
{
    /** Kolom teks opsional pada master pegawai (disalin apa adanya dari Excel). */
    private const OPTIONAL_TEXT_COLUMNS = [
        'masuk_kemlu', 'tanggal_lahir', 'zodiac', 'shio', 'jenis_kelamin', 'agama', 'upt_bidang',
        'status_kepegawaian', 'pddn_pdln', 'masuk_pusdiklat', 'waktu_di_pusdiklat', 'ceksk_spmt',
        'kelas_jabatan', 'pangkat', 'golongan', 'tmt', 'struktural_lainnya', 'fungsional', 'jenjang',
        'jabatan', 'gelar', 'tmt_2', 'usia', 'usia_pensiun', 'tahun_pensiun',
        'kode_bank', 'no_rekening', 'nama_rekening', 'bank',
    ];

    public function authorize(): bool
    {
        return true; // Akses dibatasi middleware role:admin pada route.
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $pegawai = $this->route('pegawai');

        $rules = [
            'nama' => 'required|string|max:255',
            // NIP boleh kosong / '-' (mis. PPNPN), selain itu harus unik.
            'nip' => [
                'nullable', 'string', 'max:255',
                function (string $attribute, mixed $value, Closure $fail) use ($pegawai): void {
                    $nip = trim((string) $value);
                    if ($nip === '' || $nip === '-') {
                        return;
                    }

                    $exists = Pegawai::where('nip', $nip)
                        ->when($pegawai, fn ($q) => $q->where('id', '!=', $pegawai->id))
                        ->exists();

                    if ($exists) {
                        $fail('NIP sudah digunakan oleh pegawai lain.');
                    }
                },
            ],
            'keterangan' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
        ];

        foreach (self::OPTIONAL_TEXT_COLUMNS as $column) {
            $rules[$column] = 'nullable|string|max:255';
        }

        return $rules;
    }
}
