<?php

namespace App\Http\Requests\SuratTugas;

use Illuminate\Foundation\Http\FormRequest;

class DisposisiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Peran & status dicek di WorkflowService (pesan error khusus).
    }

    public function rules(): array
    {
        return [
            'kapus_decision' => 'required|in:YA,REVISI,STOP',
            'catatan_kapus' => 'nullable|string',
        ];
    }
}
