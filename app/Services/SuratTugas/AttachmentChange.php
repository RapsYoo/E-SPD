<?php

namespace App\Services\SuratTugas;

use Illuminate\Support\Facades\Storage;

/**
 * Perubahan lampiran dalam satu operasi simpan: menyimpan file baru lebih dulu,
 * lalu `commit()` menghapus file lama (DB sukses) atau `rollback()` menghapus file baru (DB gagal).
 */
class AttachmentChange
{
    /** @var array<string, string> Nama asli file baru, untuk disimpan di draft_data. */
    public array $names = [];

    public function __construct(
        public ?string $undangan,
        public ?string $setneg,
        private ?string $oldUndangan,
        private ?string $oldSetneg,
        private ?string $newUndangan,
        private ?string $newSetneg,
    ) {
    }

    public function rollback(): void
    {
        if ($this->newUndangan) Storage::disk('public')->delete($this->newUndangan);
        if ($this->newSetneg) Storage::disk('public')->delete($this->newSetneg);
    }

    /** Hapus file lama hanya setelah DB sukses diganti. */
    public function commit(): void
    {
        if ($this->newUndangan && $this->oldUndangan && $this->newUndangan !== $this->oldUndangan) {
            Storage::disk('public')->delete($this->oldUndangan);
        }
        if ($this->newSetneg && $this->oldSetneg && $this->newSetneg !== $this->oldSetneg) {
            Storage::disk('public')->delete($this->oldSetneg);
        }
    }
}
