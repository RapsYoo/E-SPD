<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ppk;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PpkController extends Controller
{
    public function index(Request $request)
    {
        $query = Ppk::query();

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nama', 'like', "%{$search}%")
                  ->orWhere('nip', 'like', "%{$search}%");
            });
        }

        $ppk = $query->orderBy('nama')->paginate(10)->withQueryString();

        return Inertia::render('Admin/Ppk/Index', [
            'ppk' => $ppk,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'nip' => 'required|string|max:50|unique:ppk,nip',
            'jabatan' => 'nullable|string|max:255',
        ]);

        Ppk::create($validated);

        return redirect()->back()->with('success', 'Data PPK berhasil ditambahkan.');
    }

    public function update(Request $request, Ppk $ppk)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'nip' => 'required|string|max:50|unique:ppk,nip,' . $ppk->id,
            'jabatan' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $ppk->update($validated);

        return redirect()->back()->with('success', 'Data PPK berhasil diperbarui.');
    }

    public function destroy(Ppk $ppk)
    {
        $ppk->delete();

        return redirect()->back()->with('success', 'Data PPK berhasil dihapus.');
    }
}
