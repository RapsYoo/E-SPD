<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\JenisAngkutanRequest;
use App\Http\Requests\Admin\TingkatBiayaRequest;
use App\Models\JenisAngkutan;
use App\Models\TingkatBiaya;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReferensiController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Admin/Referensi/Index', [
            'tingkatBiaya' => TingkatBiaya::orderBy('kode')->get(),
            'jenisAngkutan' => JenisAngkutan::orderBy('kode')->get(),
        ]);
    }

    // Tingkat Biaya CRUD
    public function storeTingkatBiaya(TingkatBiayaRequest $request)
    {
        TingkatBiaya::create($request->validated());

        return redirect()->back()->with('success', 'Tingkat biaya berhasil ditambahkan.');
    }

    public function updateTingkatBiaya(TingkatBiayaRequest $request, TingkatBiaya $tingkatBiaya)
    {
        $tingkatBiaya->update($request->validated());

        return redirect()->back()->with('success', 'Tingkat biaya berhasil diperbarui.');
    }

    public function destroyTingkatBiaya(TingkatBiaya $tingkatBiaya)
    {
        $tingkatBiaya->delete();

        return redirect()->back()->with('success', 'Tingkat biaya berhasil dihapus.');
    }

    // Jenis Angkutan CRUD
    public function storeJenisAngkutan(JenisAngkutanRequest $request)
    {
        JenisAngkutan::create($request->validated());

        return redirect()->back()->with('success', 'Jenis angkutan berhasil ditambahkan.');
    }

    public function updateJenisAngkutan(JenisAngkutanRequest $request, JenisAngkutan $jenisAngkutan)
    {
        $jenisAngkutan->update($request->validated());

        return redirect()->back()->with('success', 'Jenis angkutan berhasil diperbarui.');
    }

    public function destroyJenisAngkutan(JenisAngkutan $jenisAngkutan)
    {
        $jenisAngkutan->delete();

        return redirect()->back()->with('success', 'Jenis angkutan berhasil dihapus.');
    }
}
