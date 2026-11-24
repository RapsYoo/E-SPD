<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SuratTugasPegawai extends Model
{
    use HasFactory;

    public const DPR_DRAFT = 'DRAFT';

    public const DPR_PENDING_APPROVAL = 'MENUNGGU_PERSETUJUAN';

    public const DPR_APPROVED = 'DISETUJUI';

    protected $table = 'surat_tugas_pegawai';

    protected $fillable = [
        'surat_tugas_id',
        'pegawai_id',
        'nama',
        'nip',
        'pangkat',
        'golongan',
        'jabatan',
        'unit_kerja',
        'urutan',
        'biaya',
        'rpd_items',
        'rpd_total',
        'rpd_telah_dibayar',
        'nama_rekening',
        'no_rekening',
        'kode_bank',
    ];

    protected $casts = [
        'biaya' => 'integer',
        'rpd_items' => 'array',
        'rpd_total' => 'integer',
        'rpd_telah_dibayar' => 'integer',
        'dpr_submitted_at' => 'datetime',
        'dpr_approved_at' => 'datetime',
    ];

    public function suratTugas()
    {
        return $this->belongsTo(SuratTugas::class, 'surat_tugas_id');
    }

    public function pegawaiMaster()
    {
        return $this->belongsTo(Pegawai::class, 'pegawai_id');
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(TiketPerjalanan::class, 'surat_tugas_pegawai_id');
    }

    public function dprApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dpr_approved_by');
    }
}
