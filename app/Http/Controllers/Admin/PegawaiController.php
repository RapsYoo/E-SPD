<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PegawaiRequest;
use App\Models\Pegawai;
use App\Models\UptBidang;
use App\Support\SearchQuery;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PegawaiController extends Controller
{
    public function index(Request $request)
    {
        $query = Pegawai::query()->with('upt:id,kode,nama,keterangan');

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

        return Inertia::render('Admin/Pegawai/Index', [
            'pegawai' => SearchQuery::paginate(
                $query,
                $request->search,
                ['nama', 'nip', 'jabatan', 'upt_bidang', 'status_kepegawaian'],
                'nama'
            ),
            'uptBidangList' => UptBidang::where('is_active', true)
                ->orderBy('nama')
                ->get(['id', 'kode', 'nama', 'keterangan']),
            'filters' => $request->only(['search', 'upt_id']),
        ]);
    }

    public function store(PegawaiRequest $request)
    {
        $data = $request->validated();
        unset($data['hapus_foto']);

        if ($request->hasFile('foto')) {
            $data['foto'] = $request->file('foto')->store('pegawai_foto', 'public');
        }

        Pegawai::create($data);

        return redirect()->back()->with('success', 'Data pegawai berhasil ditambahkan.');
    }

    public function update(PegawaiRequest $request, Pegawai $pegawai)
    {
        $data = $request->validated();
        $hapusFoto = $request->boolean('hapus_foto');
        unset($data['hapus_foto']);

        if ($request->hasFile('foto')) {
            if ($pegawai->foto && Storage::disk('public')->exists($pegawai->foto)) {
                Storage::disk('public')->delete($pegawai->foto);
            }
            $data['foto'] = $request->file('foto')->store('pegawai_foto', 'public');
        } elseif ($hapusFoto) {
            if ($pegawai->foto && Storage::disk('public')->exists($pegawai->foto)) {
                Storage::disk('public')->delete($pegawai->foto);
            }
            $data['foto'] = null;
        }

        $pegawai->update($data);

        // Sinkronkan nama akun login bila pegawai ini terhubung ke akun pengguna.
        // Arsip surat yang sudah siap cetak / terbit tetap aman karena menggunakan kolom snapshot.
        if ($pegawai->user && $pegawai->user->name !== $pegawai->nama) {
            $pegawai->user->update(['name' => $pegawai->nama]);
        }

        return redirect()->back()->with('success', 'Data pegawai berhasil diperbarui.');
    }

    public function destroy(Pegawai $pegawai)
    {
        if ($pegawai->foto && Storage::disk('public')->exists($pegawai->foto)) {
            Storage::disk('public')->delete($pegawai->foto);
        }

        $pegawai->delete();

        return redirect()->back()->with('success', 'Data pegawai berhasil dihapus.');
    }
}
