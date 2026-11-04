<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UptBidangRequest;
use App\Models\Pegawai;
use App\Models\UptBidang;
use App\Support\SearchQuery;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UptBidangController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Admin/UptBidang/Index', [
            'uptBidang' => SearchQuery::paginate(
                UptBidang::query()->withCount('pegawai'),
                $request->search,
                ['nama', 'kode', 'keterangan'],
                'nama'
            ),
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(UptBidangRequest $request)
    {
        UptBidang::create($request->validated());

        return redirect()->back()->with('success', 'Data UPT / Bidang berhasil ditambahkan.');
    }

    public function update(UptBidangRequest $request, UptBidang $uptBidang)
    {
        $uptBidang->update($request->validated());

        // Sinkronkan nama UPT/Bidang pada data pegawai yang berelasi dengan UPT/Bidang ini.
        Pegawai::where('upt_bidang_id', $uptBidang->id)
            ->update(['upt_bidang' => $uptBidang->nama]);

        return redirect()->back()->with('success', 'Data UPT / Bidang berhasil diperbarui.');
    }

    public function destroy(UptBidang $uptBidang)
    {
        // Kosongkan kolom teks upt_bidang pada pegawai yang tertaut sebelum menghapus master UPT/Bidang.
        Pegawai::where('upt_bidang_id', $uptBidang->id)
            ->update(['upt_bidang_id' => null, 'upt_bidang' => null]);

        $uptBidang->delete();

        return redirect()->back()->with('success', 'Data UPT / Bidang berhasil dihapus.');
    }
}
