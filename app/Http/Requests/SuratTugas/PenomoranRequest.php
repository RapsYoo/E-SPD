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
}
