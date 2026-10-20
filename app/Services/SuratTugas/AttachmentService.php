<?php

namespace App\Services\SuratTugas;

use App\Models\SuratTugas;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

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
     * Payload lampiran untuk halaman (nama + URL publik), null bila file tidak ada.
     *
     * @param  array<string, string>  $names  Nama asli opsional (dari draft_data).
     */
    public function payload(SuratTugas $suratTugas, array $names = []): array
    {
        return [
            'invitation' => $this->item($suratTugas->file_undangan, $names['file_undangan_name'] ?? null),
            'setneg' => $this->item($suratTugas->file_izin_setneg, $names['file_izin_setneg_name'] ?? null),
        ];
    }

    private function item(?string $path, ?string $name): ?array
    {
        if (!$path) {
            return null;
        }

        return [
            'name' => $name ?? basename($path),
            'url' => Storage::disk('public')->url($path),
        ];
    }
}
