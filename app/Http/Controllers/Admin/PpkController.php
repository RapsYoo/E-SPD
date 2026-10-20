<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PpkRequest;
use App\Models\Ppk;
use App\Support\SearchQuery;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PpkController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Admin/Ppk/Index', [
            'ppk' => SearchQuery::paginate(Ppk::query(), $request->search, ['nama', 'nip'], 'nama'),
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(PpkRequest $request)
    {
        Ppk::create($request->validated());

        return redirect()->back()->with('success', 'Data PPK berhasil ditambahkan.');
    }

    public function update(PpkRequest $request, Ppk $ppk)
    {
        $ppk->update($request->validated());

        return redirect()->back()->with('success', 'Data PPK berhasil diperbarui.');
    }

    public function destroy(Ppk $ppk)
    {
        $ppk->delete();

        return redirect()->back()->with('success', 'Data PPK berhasil dihapus.');
    }
}
