<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TingkatBiaya;
use App\Models\JenisAngkutan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReferensiController extends Controller
{
    public function index(Request $request)
    {
        $tingkatBiaya = TingkatBiaya::orderBy('kode')->get();
        $jenisAngkutan = JenisAngkutan::orderBy('kode')->get();

        return Inertia::render('Admin/Referensi/Index', [
            'tingkatBiaya' => $tingkatBiaya,
            'jenisAngkutan' => $jenisAngkutan,
        ]);
    }

    // Tingkat Biaya CRUD
    public function storeTingkatBiaya(Request $request)
    {
        $validated = $request->validate([
            'kode' => 'required|string|max:10|unique:tingkat_biaya,kode',
            'nama' => 'required|string|max:100',
            'keterangan' => 'nullable|string',
        ]);

        TingkatBiaya::create($validated);

        return redirect()->back()->with('success', 'Tingkat biaya berhasil ditambahkan.');
    }

    public function updateTingkatBiaya(Request $request, TingkatBiaya $tingkatBiaya)
    {
        $validated = $request->validate([
            'kode' => 'required|string|max:10|unique:tingkat_biaya,kode,' . $tingkatBiaya->id,
            'nama' => 'required|string|max:100',
            'keterangan' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $tingkatBiaya->update($validated);

        return redirect()->back()->with('success', 'Tingkat biaya berhasil diperbarui.');
    }

    public function destroyTingkatBiaya(TingkatBiaya $tingkatBiaya)
    {
        $tingkatBiaya->delete();

        return redirect()->back()->with('success', 'Tingkat biaya berhasil dihapus.');
    }

    // Jenis Angkutan CRUD
    public function storeJenisAngkutan(Request $request)
    {
        $validated = $request->validate([
            'kode' => 'required|string|max:20|unique:jenis_angkutan,kode',
            'nama' => 'required|string|max:100',
            'keterangan' => 'nullable|string',
        ]);

        JenisAngkutan::create($validated);

        return redirect()->back()->with('success', 'Jenis angkutan berhasil ditambahkan.');
    }

    public function updateJenisAngkutan(Request $request, JenisAngkutan $jenisAngkutan)
    {
        $validated = $request->validate([
            'kode' => 'required|string|max:20|unique:jenis_angkutan,kode,' . $jenisAngkutan->id,
            'nama' => 'required|string|max:100',
            'keterangan' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $jenisAngkutan->update($validated);

        return redirect()->back()->with('success', 'Jenis angkutan berhasil diperbarui.');
    }

    public function destroyJenisAngkutan(JenisAngkutan $jenisAngkutan)
    {
        $jenisAngkutan->delete();

        return redirect()->back()->with('success', 'Jenis angkutan berhasil dihapus.');
    }
}
