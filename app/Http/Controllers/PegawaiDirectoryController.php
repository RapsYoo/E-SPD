<?php

namespace App\Http\Controllers;

use App\Models\Pegawai;
use App\Support\SearchQuery;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Direktori pegawai read-only untuk role pegawai (tanpa tambah/ubah/hapus).
 */
class PegawaiDirectoryController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Pegawai/Index', [
            'pegawai' => SearchQuery::paginate(
                Pegawai::query()->where('is_active', true),
                $request->search,
                ['nama', 'nip', 'jabatan'],
                'nama'
            ),
            'filters' => $request->only(['search']),
        ]);
    }
}
