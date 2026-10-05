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
        'urutan',
    ];

    public function suratTugas()
    {
        return $this->belongsTo(SuratTugas::class, 'surat_tugas_id');
    }

    public function pegawaiMaster()
    {
        return $this->belongsTo(Pegawai::class, 'pegawai_id');
    }
}
