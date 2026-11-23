<?php

namespace App\Http\Requests\SuratTugas;

use App\Exceptions\WorkflowException;
use App\Services\Admin\RbacService;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Dasar request pengusul: cek izin modul RBAC surat_tugas.create sebelum validasi.
 * Pelanggaran izin dirender sebagai redirect back + flash error (bukan 403).
 */
abstract class ProposerRequest extends FormRequest
{
    abstract protected function deniedMessage(): string;

    public function authorize(): bool
    {
        return app(RbacService::class)->hasPermission($this->user(), 'surat_tugas.create');
    }

    protected function failedAuthorization(): void
    {
        throw new WorkflowException($this->deniedMessage());
    }
}
