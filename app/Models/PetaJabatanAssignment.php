<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PetaJabatanAssignment extends Model
{
    protected $table = 'peta_jabatan_assignments';

    protected $fillable = [
        'position_id',
        'pegawai_id',
        'catatan',
        'urutan',
    ];

    protected $casts = [
        'position_id' => 'integer',
        'pegawai_id' => 'integer',
        'urutan' => 'integer',
    ];

    public function position(): BelongsTo
    {
        return $this->belongsTo(PetaJabatanPosition::class, 'position_id');
    }

    public function pegawai(): BelongsTo
    {
        return $this->belongsTo(Pegawai::class, 'pegawai_id');
    }
}
