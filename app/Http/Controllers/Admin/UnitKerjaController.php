<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UnitKerjaRequest;
use App\Models\UnitKerja;
use App\Support\SearchQuery;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UnitKerjaController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Admin/UnitKerja/Index', [
            'unitKerja' => SearchQuery::paginate(UnitKerja::query(), $request->search, ['nama', 'kode', 'singkatan'], 'nama'),
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(UnitKerjaRequest $request)
    {
        UnitKerja::create($request->validated());

        return redirect()->back()->with('success', 'Data unit kerja berhasil ditambahkan.');
    }

    public function update(UnitKerjaRequest $request, UnitKerja $unitKerja)
    {
        $unitKerja->update($request->validated());

        return redirect()->back()->with('success', 'Data unit kerja berhasil diperbarui.');
    }

    public function destroy(UnitKerja $unitKerja)
    {
        $unitKerja->delete();

        return redirect()->back()->with('success', 'Data unit kerja berhasil dihapus.');
    }
}
