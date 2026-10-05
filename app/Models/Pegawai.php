<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pegawai extends Model
{
    use HasFactory;

    protected $table = 'pegawai';

    protected $fillable = [
        'nama',
        'nip',
        'pangkat',
        'golongan',
        'jabatan',
        'unit_kerja',
        'email',
        'no_telepon',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
