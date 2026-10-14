<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SuratTugasPegawai extends Model
{
    use HasFactory;

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
        'nik',
        'swift',
        'nama_bank',
        'no_rekening',
        'urutan',
        'tanggal_berangkat',
        'tanggal_kembali',
    ];

    protected $casts = [
        'tanggal_berangkat' => 'date:Y-m-d',
        'tanggal_kembali' => 'date:Y-m-d',
    ];

    public function suratTugas()
    {
        return $this->belongsTo(SuratTugas::class, 'surat_tugas_id');
    }

    public function pegawaiMaster()
    {
        return $this->belongsTo(Pegawai::class, 'pegawai_id');
    }

    public function biaya()
    {
        return $this->hasOne(SuratTugasBiaya::class, 'surat_tugas_pegawai_id');
    }
    
}
