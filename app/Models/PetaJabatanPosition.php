<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PetaJabatanPosition extends Model
{
    protected $table = 'peta_jabatan_positions';

    protected $fillable = [
        'kode',
        'section',
        'tipe',
        'nama_jabatan',
        'kelas',
        'kebutuhan',
        'urutan',
    ];

    protected $casts = [
        'kelas' => 'integer',
        'kebutuhan' => 'integer',
        'urutan' => 'integer',
    ];

    public function assignments(): HasMany
    {
        return $this->hasMany(PetaJabatanAssignment::class, 'position_id')->orderBy('urutan')->orderBy('id');
    }
}
