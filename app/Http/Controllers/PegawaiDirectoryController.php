<?php

namespace App\Http\Controllers;

use App\Models\Pegawai;
use App\Models\UptBidang;
use App\Support\SearchQuery;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

/**
 * Direktori pegawai read-only untuk role pegawai (tanpa tambah/ubah/hapus).
 */
class PegawaiDirectoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Pegawai::query()->with('upt:id,kode,nama,keterangan')->where('is_active', true);

        if ($request->filled('upt_id')) {
            $uptId = $request->input('upt_id');
            $upt = UptBidang::find($uptId);
            $query->where(function ($q) use ($uptId, $upt) {
                $q->where('upt_bidang_id', $uptId);
                if ($upt) {
                    $q->orWhere('upt_bidang', $upt->nama)
                        ->orWhere('upt_bidang', $upt->kode);
                }
            });
        }

        return Inertia::render('Pegawai/Index', [
            'pegawai' => SearchQuery::paginate(
                $query,
                $request->search,
                ['nama', 'nip', 'jabatan', 'upt_bidang'],
                'nama'
            ),
            'uptBidangList' => UptBidang::where('is_active', true)
                ->orderBy('nama')
                ->get(['id', 'kode', 'nama', 'keterangan']),
            'filters' => $request->only(['search', 'upt_id']),
        ]);
    }

    /**
     * Tampilkan file foto pegawai dari storage public.
     */
    public function foto(Pegawai $pegawai)
    {
        if ($pegawai->foto && Storage::disk('public')->exists($pegawai->foto)) {
            return Storage::disk('public')->response($pegawai->foto);
        }

        abort(404, 'Foto tidak ditemukan');
    }
}
