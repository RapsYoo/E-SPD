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
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
