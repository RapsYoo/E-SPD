<?php

namespace App\Console\Commands;

use App\Models\SuratTugas;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class BersihkanLampiranYatim extends Command
{
    protected $signature = 'lampiran:bersihkan
                            {--dry-run : Hanya tampilkan file yatim tanpa menghapus}
                            {--umur=24 : Hanya file yang lebih tua dari N jam (menghindari file upload yang sedang diproses)}';

    protected $description = 'Hapus file lampiran (undangan/izin Setneg) di storage yang tidak lagi dirujuk surat mana pun';

    private const DIRECTORIES = ['undangan', 'setneg'];

    public function handle(): int
    {
        $disk = Storage::disk('public');
        $batas = now()->subHours((int) $this->option('umur'))->getTimestamp();

        // Surat yang di-soft-delete tetap dianggap memakai file (bisa dipulihkan).
        $dipakai = SuratTugas::withTrashed()
            ->get(['file_undangan', 'file_izin_setneg'])
            ->flatMap(fn (SuratTugas $s) => [$s->file_undangan, $s->file_izin_setneg])
            ->filter()
            ->flip();

        $jumlah = 0;
        $ukuran = 0;

        foreach (self::DIRECTORIES as $directory) {
            foreach ($disk->files($directory) as $path) {
                if ($dipakai->has($path) || $disk->lastModified($path) > $batas) {
                    continue;
                }

                $jumlah++;
                $ukuran += $disk->size($path);
                $this->line(($this->option('dry-run') ? '[dry-run] ' : 'Hapus ').$path);

                if (! $this->option('dry-run')) {
                    $disk->delete($path);
                }
            }
        }

        $this->info(sprintf(
            '%d file yatim %s (%.1f KB).',
            $jumlah,
            $this->option('dry-run') ? 'ditemukan' : 'dihapus',
            $ukuran / 1024
        ));

        return self::SUCCESS;
    }
}
