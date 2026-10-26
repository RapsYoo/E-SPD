<?php

namespace App\Http\Requests;

use App\Support\SuratTugasStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Filter rekapitulasi perjalanan dinas (halaman & ekspor). Akses dibatasi middleware role pada route.
 */
class RekapitulasiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'dari' => ['nullable', 'date'],
            'sampai' => ['nullable', 'date', 'after_or_equal:dari'],
            'status' => ['nullable', Rule::in(SuratTugasStatus::ALL)],
            'kategori' => ['nullable', 'in:DALAM_NEGERI,LUAR_NEGERI'],
            'search' => ['nullable', 'string', 'max:100'],
            'format' => ['nullable', 'in:csv,xls'],
        ];
    }

    /** @return array{dari: ?string, sampai: ?string, status: ?string, kategori: ?string, search: ?string} */
    public function filters(): array
    {
        $data = $this->validated();

        return [
            'dari' => $data['dari'] ?? null,
            'sampai' => $data['sampai'] ?? null,
            'status' => $data['status'] ?? null,
            'kategori' => $data['kategori'] ?? null,
            'search' => $data['search'] ?? null,
        ];
    }
}
