<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
    ];

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

    public function user()
    {
        return $this->hasOne(User::class);
    }
}
