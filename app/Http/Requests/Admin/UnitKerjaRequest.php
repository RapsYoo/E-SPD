<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Validasi tambah (POST) & ubah (PUT/PATCH) data unit kerja. */
class UnitKerjaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Akses dibatasi middleware role:admin pada route.
    }

    public function rules(): array
    {
        $rules = [
            'kode' => ['required', 'string', 'max:50', Rule::unique('unit_kerja', 'kode')->ignore($this->route('unit_kerja')?->id)],
            'nama' => 'required|string|max:255',
            'singkatan' => 'nullable|string|max:50',
            'alamat' => 'nullable|string',
        ];

        if (!$this->isMethod('POST')) {
            $rules['is_active'] = 'boolean';
        }

        return $rules;
    }
}
