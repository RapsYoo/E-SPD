<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SuratTugasLog extends Model
{
    protected $table = 'surat_tugas_logs';

    protected $fillable = [
        'surat_tugas_id',
        'user_id',
        'aksi',
        'dari_status',
        'ke_status',
        'catatan',
    ];
    

    public function suratTugas()
    {
        return $this->belongsTo(SuratTugas::class, 'surat_tugas_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

}
