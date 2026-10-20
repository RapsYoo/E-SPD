<?php

namespace App\Http\Requests\Admin;

use App\Services\Admin\UserService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Validasi tambah (POST) & ubah (PUT/PATCH) akun pengguna. */
class UserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Akses dibatasi middleware role:admin pada route.
    }

    public function rules(): array
    {
        $roles = array_keys(UserService::ROLES);

        if ($this->isMethod('POST')) {
            return [
                'pegawai_id' => [
                    'required',
                    Rule::exists('pegawai', 'id')->where('is_active', true),
                    'unique:users,pegawai_id',
                ],
                'email' => 'required|email|max:255|unique:users,email',
                'role' => ['required', Rule::in($roles)],
                'password' => 'required|string|min:8|max:255',
            ];
        }

        $user = $this->route('user');

        return [
            // Akun lama (hasil seeder) belum terhubung ke pegawai, jadi boleh kosong.
            'pegawai_id' => [
                Rule::requiredIf($user->pegawai_id !== null),
                'nullable',
                Rule::exists('pegawai', 'id')->where('is_active', true),
                Rule::unique('users', 'pegawai_id')->ignore($user->id),
            ],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'role' => ['required', Rule::in($roles)],
            'password' => 'nullable|string|min:8|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            'pegawai_id.required' => 'Pilih pegawai dari daftar data pegawai.',
            'pegawai_id.unique' => $this->isMethod('POST') ? 'Pegawai ini sudah memiliki akun.' : 'Pegawai ini sudah memiliki akun lain.',
            'pegawai_id.exists' => 'Pegawai tidak ditemukan atau tidak aktif.',
        ];
    }
}
