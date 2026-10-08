<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SuratTugasBiaya extends Model
{
    use HasFactory;

    protected $table = 'surat_tugas_biaya';

    protected $fillable = [
        'surat_tugas_id',
        'surat_tugas_pegawai_id',
        'uang_harian_hari',
        'uang_harian_tarif',
        'uang_harian_persen',
        'uang_harian_total',
        'representasi_hari',
        'representasi_tarif',
        'representasi_persen',
        'representasi_total',
        'transport_asal_kali',
        'transport_asal_tarif',
        'transport_asal_persen',
        'transport_asal_total',
        'transport_tujuan_kali',
        'transport_tujuan_tarif',
        'transport_tujuan_persen',
        'transport_tujuan_total',
        'akomodasi_malam',
        'akomodasi_tarif',
        'akomodasi_persen',
        'akomodasi_total',
        'status_menginap',
        'pengeluaran_riil_transport',
        'pengeluaran_riil_penginapan_30',
        'pengeluaran_riil_total',
        'total_biaya',
        'uang_muka',
        'sisa_kurang_lebih',
    ];

    public function suratTugas()
    {
        return $this->belongsTo(SuratTugas::class, 'surat_tugas_id');
    }

    public function pegawaiTugas()
    {
        return $this->belongsTo(SuratTugasPegawai::class, 'surat_tugas_pegawai_id');
    }
}
