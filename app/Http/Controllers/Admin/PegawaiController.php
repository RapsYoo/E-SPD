<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PegawaiRequest;
use App\Models\Pegawai;
use App\Support\SearchQuery;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PegawaiController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Admin/Pegawai/Index', [
            'pegawai' => SearchQuery::paginate(Pegawai::query(), $request->search, ['nama', 'nip', 'jabatan'], 'nama'),
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(PegawaiRequest $request)
    {
        Pegawai::create($request->validated());

        return redirect()->back()->with('success', 'Data pegawai berhasil ditambahkan.');
    }

    public function update(PegawaiRequest $request, Pegawai $pegawai)
    {
        $pegawai->update($request->validated());

        // Sinkronkan nama akun login bila pegawai ini terhubung ke akun pengguna.
        // Arsip surat yang sudah siap cetak / terbit tetap aman karena menggunakan kolom snapshot.
        if ($pegawai->user && $pegawai->user->name !== $pegawai->nama) {
            $pegawai->user->update(['name' => $pegawai->nama]);
        }

        return redirect()->back()->with('success', 'Data pegawai berhasil diperbarui.');
    }

    public function destroy(Pegawai $pegawai)
    {
        $pegawai->delete();

        return redirect()->back()->with('success', 'Data pegawai berhasil dihapus.');
    }
}
