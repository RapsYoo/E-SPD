<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Validasi tambah (POST) & ubah (PUT/PATCH) data pegawai. */
class PegawaiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Akses dibatasi middleware role:admin pada route.
    }

    public function rules(): array
    {
        $pegawai = $this->route('pegawai');

        $rules = [
            'nama' => 'required|string|max:255',
            'nip' => ['required', 'string', 'max:50', Rule::unique('pegawai', 'nip')->ignore($pegawai?->id)],
            'pangkat' => 'required|string|max:100',
            'golongan' => 'required|string|max:20',
            'jabatan' => 'required|string|max:255',
            'unit_kerja' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'no_telepon' => 'nullable|string|max:20',
        ];

        if (!$this->isMethod('POST')) {
            $rules['is_active'] = 'boolean';
        }

        return $rules;
    }
}
