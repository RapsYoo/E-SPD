<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Validasi tambah (POST) & ubah (PUT) Tingkat Biaya. */
class TingkatBiayaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Akses dibatasi middleware role:admin pada route.
    }

    public function rules(): array
    {
        $rules = [
            'kode' => ['required', 'string', 'max:10', Rule::unique('tingkat_biaya', 'kode')->ignore($this->route('tingkatBiaya')?->id)],
            'nama' => 'required|string|max:100',
            'keterangan' => 'nullable|string',
        ];

        if (!$this->isMethod('POST')) {
            $rules['is_active'] = 'boolean';
        }

        return $rules;
    }
}
