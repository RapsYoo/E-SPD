<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TiketPerjalanan extends Model
{
    protected $table = 'tiket_perjalanan';

    protected $fillable = [
        'surat_tugas_pegawai_id',
        'uploaded_by',
        'file_path',
        'original_name',
    ];

    public function peserta(): BelongsTo
    {
        return $this->belongsTo(SuratTugasPegawai::class, 'surat_tugas_pegawai_id');
    }

    public function pengunggah(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
