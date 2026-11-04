<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Master pegawai mengikuti struktur "Data Pegawai_Update 2026".
 * Seluruh kolom data bertipe teks (apa adanya dari Excel), sehingga nilai janggal tetap tersimpan.
 */
class Pegawai extends Model
{
    use HasFactory;

    protected $table = 'pegawai';

    /** @var array<int, string> */
    protected $fillable = [
        'nama',
        'nip',
        'masuk_kemlu',
        'tanggal_lahir',
        'zodiac',
        'shio',
        'jenis_kelamin',
        'agama',
        'upt_bidang_id',
        'upt_bidang',
        'status_kepegawaian',
        'pddn_pdln',
        'masuk_pusdiklat',
        'waktu_di_pusdiklat',
        'ceksk_spmt',
        'kelas_jabatan',
        'pangkat',
        'golongan',
        'tmt',
        'struktural_lainnya',
        'fungsional',
        'jenjang',
        'jabatan',
        'gelar',
        'tmt_2',
        'usia',
        'usia_pensiun',
        'tahun_pensiun',
        'keterangan',
        'kode_bank',
        'no_rekening',
        'nama_rekening',
        'bank',
        'is_active',
    ];

    protected $casts = [
        'upt_bidang_id' => 'integer',
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::saving(function (self $pegawai): void {
            if ($pegawai->isDirty('upt_bidang_id')) {
                $pegawai->upt_bidang = $pegawai->upt_bidang_id
                    ? UptBidang::whereKey($pegawai->upt_bidang_id)->value('nama')
                    : null;
            } elseif ($pegawai->upt_bidang && ! $pegawai->upt_bidang_id) {
                $pegawai->upt_bidang_id = UptBidang::where('nama', $pegawai->upt_bidang)->value('id');
            }
        });
    }

    /**
     * Alias `unit_kerja` agar UI & snapshot surat lama tetap kompatibel (sumber: kolom `upt_bidang`).
     *
     * @var array<int, string>
     */
    protected $appends = ['unit_kerja'];

    public function getUnitKerjaAttribute(): ?string
    {
        return $this->attributes['upt_bidang'] ?? null;
    }

    public function upt(): BelongsTo
    {
        return $this->belongsTo(UptBidang::class, 'upt_bidang_id');
    }

    public function user()
    {
        return $this->hasOne(User::class);
    }
}
