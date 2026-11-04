<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UptBidang extends Model
{
    use HasFactory;

    protected $table = 'upt_bidang';

    public const DEFAULT_ITEMS = [
        ['kode' => 'APEL', 'nama' => 'APEL', 'keterangan' => 'Bidang Asesmen dan Pelaporan'],
        ['kode' => 'DKANS', 'nama' => 'DKANS', 'keterangan' => 'Bidang Diklat Kanselerai'],
        ['kode' => 'KSFD', 'nama' => 'KSFD', 'keterangan' => 'Bidang Kerja Sama dan Fasilitasi Diklat'],
        ['kode' => 'PPID', 'nama' => 'PPID', 'keterangan' => 'Bidang Perencanaan, Pengembangan, dan Informasi Diklat'],
        ['kode' => 'TU', 'nama' => 'TU', 'keterangan' => 'Bagian Tata Usaha'],
        ['kode' => 'UPT_SEKDILU', 'nama' => 'UPT Sekdilu', 'keterangan' => 'UPT Sekolah Dinas Luar Negeri'],
        ['kode' => 'UPT_SESDILU', 'nama' => 'UPT Sesdilu', 'keterangan' => 'UPT Sekolah Staf Dinas Luar Negeri'],
        ['kode' => 'UPT_SESPARLU', 'nama' => 'UPT Sesparlu', 'keterangan' => 'UPT Sekolah Staf dan Pimpinan Kementerian Luar Negeri'],
    ];

    protected $fillable = [
        'kode',
        'nama',
        'keterangan',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function pegawai(): HasMany
    {
        return $this->hasMany(Pegawai::class, 'upt_bidang_id');
    }
}
