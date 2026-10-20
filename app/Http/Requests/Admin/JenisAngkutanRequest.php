<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Validasi tambah (POST) & ubah (PUT) Jenis Angkutan. */
class JenisAngkutanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Akses dibatasi middleware role:admin pada route.
    }

    public function rules(): array
    {
        $rules = [
            'kode' => ['required', 'string', 'max:20', Rule::unique('jenis_angkutan', 'kode')->ignore($this->route('jenisAngkutan')?->id)],
            'nama' => 'required|string|max:100',
            'keterangan' => 'nullable|string',
        ];

        if (!$this->isMethod('POST')) {
            $rules['is_active'] = 'boolean';
        }

        return $rules;
    }
}
