<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class SuratTugas extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'surat_tugas';

    protected $fillable = [
        'user_id',
        'kategori_perjalanan',
        'sumber_asal',
        'nomor_nota',
        'pengirim_nota',
        'tanggal_nota',
        'perihal_nota',
        'file_undangan',
        'file_izin_setneg',
        'status',
        'kapus_decision',
        'catatan_kapus',
        'ppk_id',
        'ppk_nama_snapshot',
        'ppk_nip_snapshot',
        'kapus_nama_snapshot',
        'kapus_nip_snapshot',
        'tingkat_biaya_kode',
        'jenis_angkutan_nama',
        'tempat_berangkat',
        'tempat_tujuan',
        'negara_tujuan',
        'no_setneg',
        'tanggal_berangkat',
        'tanggal_kembali',
        'durasi_hari',
        'nomor_st',
        'nomor_spd',
        'tanggal_surat',
        'is_ppk_signed',
        'signed_at',
        'draft_data',
        'draft_step',
    ];

    protected $casts = [
        'tanggal_nota' => 'date:Y-m-d',
        'tanggal_berangkat' => 'date:Y-m-d',
        'tanggal_kembali' => 'date:Y-m-d',
        'tanggal_surat' => 'date:Y-m-d',
        'is_ppk_signed' => 'boolean',
        'signed_at' => 'datetime',
        'draft_data' => 'array',
        'draft_step' => 'integer',
    ];

    protected static function booted(): void
    {
        // File fisik hanya dihapus saat hapus permanen; soft-delete tetap bisa dipulihkan.
        static::forceDeleting(function (SuratTugas $surat) {
            Storage::disk('public')->delete(array_filter([$surat->file_undangan, $surat->file_izin_setneg]));
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function ppk()
    {
        return $this->belongsTo(User::class, 'ppk_id');
    }

    public function pegawaiList()
    {
        return $this->hasMany(SuratTugasPegawai::class, 'surat_tugas_id')->orderBy('urutan');
    }

    public function logs()
    {
        return $this->hasMany(SuratTugasLog::class, 'surat_tugas_id')->orderByDesc('created_at');
    }

    /**
     * Surat yang menugaskan pegawai tertentu sebagai peserta perjalanan dinas.
     */
    public function scopeDiikutiPegawai(Builder $query, ?int $pegawaiId): Builder
    {
        return $query->whereHas(
            'pegawaiList',
            fn (Builder $q) => $q->where('pegawai_id', $pegawaiId ?? 0)
        );
    }

    public function isDiikutiPegawai(?int $pegawaiId): bool
    {
        return $pegawaiId !== null
            && $this->pegawaiList()->where('pegawai_id', $pegawaiId)->exists();
    }
}
