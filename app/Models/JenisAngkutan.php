<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JenisAngkutan extends Model
{
    use HasFactory;

    protected $table = 'jenis_angkutan';

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
