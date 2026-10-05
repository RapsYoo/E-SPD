<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pegawai;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PegawaiController extends Controller
{
    public function index(Request $request)
    {
        $query = Pegawai::query();

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nama', 'like', "%{$search}%")
                  ->orWhere('nip', 'like', "%{$search}%")
                  ->orWhere('jabatan', 'like', "%{$search}%");
            });
        }

        $pegawai = $query->orderBy('nama')->paginate(10)->withQueryString();

        return Inertia::render('Admin/Pegawai/Index', [
            'pegawai' => $pegawai,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'nip' => 'required|string|max:50|unique:pegawai,nip',
            'pangkat' => 'required|string|max:100',
            'golongan' => 'required|string|max:20',
            'jabatan' => 'required|string|max:255',
            'unit_kerja' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'no_telepon' => 'nullable|string|max:20',
        ]);

        Pegawai::create($validated);

        return redirect()->back()->with('success', 'Data pegawai berhasil ditambahkan.');
    }

    public function update(Request $request, Pegawai $pegawai)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'nip' => 'required|string|max:50|unique:pegawai,nip,' . $pegawai->id,
            'pangkat' => 'required|string|max:100',
            'golongan' => 'required|string|max:20',
            'jabatan' => 'required|string|max:255',
            'unit_kerja' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'no_telepon' => 'nullable|string|max:20',
            'is_active' => 'boolean',
        ]);

        $pegawai->update($validated);

        return redirect()->back()->with('success', 'Data pegawai berhasil diperbarui.');
    }

    public function destroy(Pegawai $pegawai)
    {
        $pegawai->delete();

        return redirect()->back()->with('success', 'Data pegawai berhasil dihapus.');
    }
}
