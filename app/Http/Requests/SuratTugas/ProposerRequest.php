<?php

namespace App\Http\Requests\SuratTugas;

use App\Exceptions\WorkflowException;
use App\Support\SuratTugasStatus;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Dasar request pengusul (pemohon/sespalu/admin): cek peran sebelum validasi.
 * Peran tak sesuai dirender sebagai redirect back + flash error (bukan 403).
 */
abstract class ProposerRequest extends FormRequest
{
    abstract protected function deniedMessage(): string;

    public function authorize(): bool
    {
        return in_array($this->user()?->role, SuratTugasStatus::PROPOSER_ROLES, true);
    }

    protected function failedAuthorization(): void
    {
        throw new WorkflowException($this->deniedMessage());
    }
}
