<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Validasi tambah (POST) & ubah (PUT/PATCH) data UPT / Bidang. */
class UptBidangRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Akses dibatasi middleware role:admin pada route.
    }

    public function rules(): array
    {
        $uptBidang = $this->route('uptBidang');

        return [
            'kode' => [
                'required',
                'string',
                'max:50',
                Rule::unique('upt_bidang', 'kode')->ignore($uptBidang?->id),
            ],
            'nama' => [
                'required',
                'string',
                'max:255',
                Rule::unique('upt_bidang', 'nama')->ignore($uptBidang?->id),
            ],
            'keterangan' => 'nullable|string|max:255',
            'is_active' => 'sometimes|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'kode.required' => 'Kode UPT / Bidang wajib diisi.',
            'kode.unique' => 'Kode UPT / Bidang sudah digunakan.',
            'nama.required' => 'Nama UPT / Bidang wajib diisi.',
            'nama.unique' => 'Nama UPT / Bidang sudah digunakan.',
        ];
    }
}
