<?php

namespace App\Http\Requests\SuratTugas;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PenomoranRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Peran & status dicek di WorkflowService (pesan error khusus).
    }

    public function rules(): array
    {
        $id = $this->route('suratTugas')?->id;

        return [
            'nomor_st' => ['required', 'string', 'max:255', Rule::unique('surat_tugas', 'nomor_st')->ignore($id)],
            'nomor_spd' => ['required', 'string', 'max:255', Rule::unique('surat_tugas', 'nomor_spd')->ignore($id)],
            'tanggal_surat' => 'required|date',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nomor_st.required' => 'Nomor Surat Tugas wajib diisi.',
            'nomor_st.unique' => 'Nomor Surat Tugas tersebut sudah digunakan pada surat lain. Gunakan nomor urutan berikutnya.',
            'nomor_spd.required' => 'Nomor SPD wajib diisi.',
            'nomor_spd.unique' => 'Nomor SPD tersebut sudah digunakan pada surat lain. Gunakan nomor urutan berikutnya.',
            'tanggal_surat.required' => 'Tanggal Surat Tugas & SPD wajib diisi.',
            'tanggal_surat.date' => 'Format Tanggal Surat Tugas & SPD tidak valid.',
        ];
    }
}
