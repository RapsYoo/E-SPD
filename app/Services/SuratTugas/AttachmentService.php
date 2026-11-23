<?php

namespace App\Services\SuratTugas;

use App\Models\SuratTugas;
use Illuminate\Http\UploadedFile;

/**
 * Pengelolaan file lampiran (undangan & izin Setneg).
 */
class AttachmentService
{
    public function store(?UploadedFile $undangan, ?UploadedFile $setneg, ?SuratTugas $existing = null): AttachmentChange
    {
        $oldUndangan = $existing?->file_undangan;
        $oldSetneg = $existing?->file_izin_setneg;
        $newUndangan = null;
        $newSetneg = null;
        $names = [];

        if ($undangan) {
            $newUndangan = $undangan->store('undangan', 'public');
            $names['file_undangan_name'] = $undangan->getClientOriginalName();
        }

        if ($setneg) {
            $newSetneg = $setneg->store('setneg', 'public');
            $names['file_izin_setneg_name'] = $setneg->getClientOriginalName();
        }

        $change = new AttachmentChange(
            $newUndangan ?? $oldUndangan,
            $newSetneg ?? $oldSetneg,
            $oldUndangan,
            $oldSetneg,
            $newUndangan,
            $newSetneg,
        );
        $change->names = $names;

        return $change;
    }

    /**
     * Payload lampiran untuk halaman (nama + URL inline & unduh), null bila file tidak ada.
     *
     * @param  array<string, mixed>  $names  Nama asli opsional (dari draft_data).
     */
    public function payload(SuratTugas $suratTugas, array $names = []): array
    {
        $sourceNames = ! empty($names) ? $names : ($suratTugas->draft_data ?? []);

        return [
            'invitation' => $this->item(
                $suratTugas,
                'invitation',
                $suratTugas->file_undangan,
                $sourceNames['file_undangan_name'] ?? null
            ),
            'setneg' => $this->item(
                $suratTugas,
                'setneg',
                $suratTugas->file_izin_setneg,
                $sourceNames['file_izin_setneg_name'] ?? null
            ),
        ];
    }

    /**
     * @return array{name: string, url: string, download_url: string}|null
     */
    private function item(SuratTugas $suratTugas, string $type, ?string $path, ?string $name): ?array
    {
        if (! $path) {
            return null;
        }

        return [
            'name' => $name ?? basename($path),
            'url' => route('surat-tugas.lampiran', ['suratTugas' => $suratTugas->id, 'type' => $type], false),
            'download_url' => route('surat-tugas.lampiran', ['suratTugas' => $suratTugas->id, 'type' => $type, 'download' => 1], false),
        ];
    }
}
