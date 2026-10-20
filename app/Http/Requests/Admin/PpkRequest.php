<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Validasi tambah (POST) & ubah (PUT/PATCH) data PPK. */
class PpkRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Akses dibatasi middleware role:admin pada route.
    }

    public function rules(): array
    {
        $rules = [
            'nama' => 'required|string|max:255',
            'nip' => ['required', 'string', 'max:50', Rule::unique('ppk', 'nip')->ignore($this->route('ppk')?->id)],
            'jabatan' => 'nullable|string|max:255',
        ];

        if (!$this->isMethod('POST')) {
            $rules['is_active'] = 'boolean';
        }

        return $rules;
    }
}
