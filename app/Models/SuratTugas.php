<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

class SuratTugas extends Model
{
    use HasFactory, SoftDeletes;

    public const PEMBIAYAAN_BELUM_DIISI = 'BELUM_DIISI';

    public const PEMBIAYAAN_MENUNGGU = 'MENUNGGU_PERSETUJUAN';

    public const PEMBIAYAAN_DISETUJUI = 'DISETUJUI';

    public const PEMBIAYAAN_REVISI = 'PERLU_REVISI';

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
        'bendahara_id',
        'bendahara_nama_snapshot',
        'bendahara_nip_snapshot',
        'kapus_nama_snapshot',
        'kapus_nip_snapshot',
        'tingkat_biaya_kode',
        'jenis_angkutan_nama',
        'tempat_berangkat',
        'tempat_tujuan',
        'is_multi_trip',
        'rute_perjalanan',
        'negara_tujuan',
        'no_setneg',
        'tanggal_berangkat',
        'tanggal_kembali',
        'durasi_hari',
        'nomor_st',
        'nomor_spd',
        'tanggal_surat',
        'tanggal_rpd',
        'is_ppk_signed',
        'signed_at',
        'pembiayaan_status',
        'pembiayaan_approved_at',
        'pembiayaan_approved_by',
        'catatan_bendahara',
        'draft_data',
        'draft_step',
    ];

    protected $casts = [
        'tanggal_nota' => 'date:Y-m-d',
        'tanggal_berangkat' => 'date:Y-m-d',
        'tanggal_kembali' => 'date:Y-m-d',
        'tanggal_surat' => 'date:Y-m-d',
        'tanggal_rpd' => 'date:Y-m-d',
        'is_multi_trip' => 'boolean',
        'rute_perjalanan' => 'array',
        'is_ppk_signed' => 'boolean',
        'signed_at' => 'datetime',
        'pembiayaan_approved_at' => 'datetime',
        'draft_data' => 'array',
        'draft_step' => 'integer',
    ];

    public function setAttribute($key, $value)
    {
        if (in_array($key, ['tanggal_nota', 'tanggal_berangkat', 'tanggal_kembali', 'tanggal_surat', 'tanggal_rpd'], true) && ! empty($value)) {
            try {
                $value = $value instanceof \DateTimeInterface
                    ? $value->format('Y-m-d')
                    : Carbon::parse($value)->format('Y-m-d');
            } catch (\Throwable) {
                // Biarkan nilai asli jika gagal di-parse
            }
        }

        return parent::setAttribute($key, $value);
    }

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

    public function bendahara()
    {
        return $this->belongsTo(User::class, 'bendahara_id');
    }

    public function pembiayaanApprover()
    {
        return $this->belongsTo(User::class, 'pembiayaan_approved_by');
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
