<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TingkatBiaya extends Model
{
    use HasFactory;

    protected $table = 'tingkat_biaya';

    protected $fillable = [
        'kode',
        'nama',
        'keterangan',
        'tarif_harian',
        'is_active',
    ];

    protected $casts = [
        'tarif_harian' => 'integer',
        'is_active' => 'boolean',
    ];
}
