<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SuratTugas extends Model
{
    use HasFactory;

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
        'draft_step',
        'kapus_decision',
        'catatan_kapus',
        'ppk_id',
        'ppk_nama_snapshot',
        'ppk_nip_snapshot',
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
        'penandatangan_st_jabatan',
        'penandatangan_st_nama',
        'penandatangan_st_nip',
        'bendahara_id',
        'bendahara_nama_snapshot',
        'bendahara_nip_snapshot',
        'akun_anggaran',
        'tanggal_bayar',
        'is_ppk_signed',
        'signed_at',
    ];

    protected $casts = [
        'tanggal_nota' => 'date:Y-m-d',
        'tanggal_berangkat' => 'date:Y-m-d',
        'tanggal_kembali' => 'date:Y-m-d',
        'tanggal_surat' => 'date:Y-m-d',
        'tanggal_bayar' => 'date:Y-m-d',
        'is_ppk_signed' => 'boolean',
        'signed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function ppk()
    {
        return $this->belongsTo(Ppk::class);
    }

    public function bendahara()
    {
        return $this->belongsTo(Bendahara::class);
    }

    public function pegawaiList()
    {
        return $this->hasMany(SuratTugasPegawai::class, 'surat_tugas_id')->orderBy('urutan');
    }

    public function biayaList()
    {
        return $this->hasMany(SuratTugasBiaya::class, 'surat_tugas_id');
    }
}
