<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\UnitKerja;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UnitKerjaController extends Controller
{
    public function index(Request $request)
    {
        $query = UnitKerja::query();

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nama', 'like', "%{$search}%")
                  ->orWhere('kode', 'like', "%{$search}%")
                  ->orWhere('singkatan', 'like', "%{$search}%");
            });
        }

        $unitKerja = $query->orderBy('nama')->paginate(10)->withQueryString();

        return Inertia::render('Admin/UnitKerja/Index', [
            'unitKerja' => $unitKerja,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode' => 'required|string|max:50|unique:unit_kerja,kode',
            'nama' => 'required|string|max:255',
            'singkatan' => 'nullable|string|max:50',
            'alamat' => 'nullable|string',
        ]);

        UnitKerja::create($validated);

        return redirect()->back()->with('success', 'Data unit kerja berhasil ditambahkan.');
    }

    public function update(Request $request, UnitKerja $unitKerja)
    {
        $validated = $request->validate([
            'kode' => 'required|string|max:50|unique:unit_kerja,kode,' . $unitKerja->id,
            'nama' => 'required|string|max:255',
            'singkatan' => 'nullable|string|max:50',
            'alamat' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $unitKerja->update($validated);

        return redirect()->back()->with('success', 'Data unit kerja berhasil diperbarui.');
    }

    public function destroy(UnitKerja $unitKerja)
    {
        $unitKerja->delete();

        return redirect()->back()->with('success', 'Data unit kerja berhasil dihapus.');
    }
}
