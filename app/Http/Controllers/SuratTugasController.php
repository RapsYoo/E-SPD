<?php

namespace App\Http\Controllers;

use App\Models\SuratTugas;
use App\Models\SuratTugasPegawai;
use App\Models\Pegawai;
use App\Models\Ppk;
use App\Models\UnitKerja;
use App\Models\TingkatBiaya;
use App\Models\JenisAngkutan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class SuratTugasController extends Controller
{
    public function index(Request $request)
    {
        $query = SuratTugas::with(['pegawaiList', 'ppk', 'user']);

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nomor_st', 'like', "%{$search}%")
                  ->orWhere('nomor_spd', 'like', "%{$search}%")
                  ->orWhere('nomor_nota', 'like', "%{$search}%")
                  ->orWhere('perihal_nota', 'like', "%{$search}%")
                  ->orWhere('pengirim_nota', 'like', "%{$search}%");
            });
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        $suratTugas = $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();

        return Inertia::render('SuratTugas/Index', [
            'suratTugas' => $suratTugas,
            'filters' => $request->only(['search', 'status']),
            'userRole' => auth()->user()?->role ?? 'pemohon',
        ]);
    }

    public function create()
    {
        return Inertia::render('SuratTugas/Create', [
            'pegawaiList' => Pegawai::where('is_active', true)->orderBy('nama')->get(),
            'ppkList' => Ppk::where('is_active', true)->orderBy('nama')->get(),
            'unitKerjaList' => UnitKerja::where('is_active', true)->orderBy('nama')->get(),
            'tingkatBiayaList' => TingkatBiaya::where('is_active', true)->orderBy('kode')->get(),
            'jenisAngkutanList' => JenisAngkutan::where('is_active', true)->orderBy('nama')->get(),
            'userRole' => auth()->user()?->role ?? 'pemohon',
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kategori_perjalanan' => 'required|in:DALAM_NEGERI,LUAR_NEGERI',
            'sumber_asal' => 'required|in:INTERNAL,EKSTERNAL',
            'nomor_nota' => 'required|string|max:255',
            'pengirim_nota' => 'required|string|max:255',
            'tanggal_nota' => 'required|date',
            'perihal_nota' => 'required|string',
            'file_undangan' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'file_izin_setneg' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            
            // PPK & Travel details
            'ppk_id' => 'required|exists:ppk,id',
            'tingkat_biaya_kode' => 'required|string',
            'jenis_angkutan_nama' => 'required|string',
            'tempat_berangkat' => 'required|string',
            'tempat_tujuan' => 'required|string',
            'negara_tujuan' => 'nullable|string',
            'no_setneg' => 'nullable|string',
            'tanggal_berangkat' => 'required|date',
            'tanggal_kembali' => 'required|date|after_or_equal:tanggal_berangkat',
            'durasi_hari' => 'required|integer|min:1',
            
            // Officers array
            'pegawai_ids' => 'required|array|min:1',
            'pegawai_ids.*' => 'exists:pegawai,id',
        ]);

        $ppk = Ppk::findOrFail($validated['ppk_id']);

        $filePathUndangan = null;
        if ($request->hasFile('file_undangan')) {
            $filePathUndangan = $request->file('file_undangan')->store('undangan', 'public');
        }

        $filePathSetneg = null;
        if ($request->hasFile('file_izin_setneg')) {
            $filePathSetneg = $request->file('file_izin_setneg')->store('setneg', 'public');
        }

        $suratTugas = SuratTugas::create([
            'user_id' => auth()->id(),
            'kategori_perjalanan' => $validated['kategori_perjalanan'],
            'sumber_asal' => $validated['sumber_asal'],
            'nomor_nota' => $validated['nomor_nota'],
            'pengirim_nota' => $validated['pengirim_nota'],
            'tanggal_nota' => $validated['tanggal_nota'],
            'perihal_nota' => $validated['perihal_nota'],
            'file_undangan' => $filePathUndangan,
            'file_izin_setneg' => $filePathSetneg,
            'status' => 'MENUNGGU_DISPOSISI_KAPUS',
            'ppk_id' => $ppk->id,
            'ppk_nama_snapshot' => $ppk->nama,
            'ppk_nip_snapshot' => $ppk->nip,
            'tingkat_biaya_kode' => $validated['tingkat_biaya_kode'],
            'jenis_angkutan_nama' => $validated['jenis_angkutan_nama'],
            'tempat_berangkat' => $validated['tempat_berangkat'],
            'tempat_tujuan' => $validated['tempat_tujuan'],
            'negara_tujuan' => $validated['negara_tujuan'] ?? null,
            'no_setneg' => $validated['no_setneg'] ?? null,
            'tanggal_berangkat' => $validated['tanggal_berangkat'],
            'tanggal_kembali' => $validated['tanggal_kembali'],
            'durasi_hari' => $validated['durasi_hari'],
        ]);

        // Save officer snapshots
        foreach ($validated['pegawai_ids'] as $index => $pegawaiId) {
            $pegawai = Pegawai::find($pegawaiId);
            if ($pegawai) {
                SuratTugasPegawai::create([
                    'surat_tugas_id' => $suratTugas->id,
                    'pegawai_id' => $pegawai->id,
                    'nama' => $pegawai->nama,
                    'nip' => $pegawai->nip,
                    'pangkat' => $pegawai->pangkat,
                    'golongan' => $pegawai->golongan,
                    'jabatan' => $pegawai->jabatan,
                    'unit_kerja' => $pegawai->unit_kerja || 'Pusdiklat Kemlu',
                    'urutan' => $index + 1,
                ]);
            }
        }

        return redirect()->route('surat-tugas.show', $suratTugas->id)->with('success', 'Usulan Surat Tugas & SPD berhasil diterbitkan! Menunggu Disposisi Kapus.');
    }

    public function show(SuratTugas $suratTugas)
    {
        $suratTugas->load(['pegawaiList', 'ppk', 'user']);

        return Inertia::render('SuratTugas/Show', [
            'suratTugas' => $suratTugas,
            'userRole' => auth()->user()?->role ?? 'pemohon',
        ]);
    }

    // Step 2: Disposisi Kapus (Only Kapus or Admin)
    public function disposisi(Request $request, SuratTugas $suratTugas)
    {
        $userRole = auth()->user()?->role;
        if (!in_array($userRole, ['kapus', 'admin'])) {
            return redirect()->back()->with('error', 'Hanya Kepala Pusat (Kapus) atau Admin yang berhak memberikan disposisi.');
        }

        $validated = $request->validate([
            'kapus_decision' => 'required|in:YA,REVISI,STOP',
            'catatan_kapus' => 'nullable|string',
        ]);

        $status = 'MENUNGGU_DISPOSISI_KAPUS';
        if ($validated['kapus_decision'] === 'YA') {
            $status = 'MENUNGGU_PENOMORAN_TU';
        } elseif ($validated['kapus_decision'] === 'REVISI') {
            $status = 'DISPOSISI_KAPUS_REVISI';
        } elseif ($validated['kapus_decision'] === 'STOP') {
            $status = 'DISPOSISI_KAPUS_STOP';
        }

        $suratTugas->update([
            'kapus_decision' => $validated['kapus_decision'],
            'catatan_kapus' => $validated['catatan_kapus'],
            'status' => $status,
        ]);

        return redirect()->back()->with('success', 'Disposisi Kepala Pusat (Kapus) berhasil disimpan!');
    }

    // Step 4: Penomoran Resmi TU (Only TU or Admin)
    public function penomoran(Request $request, SuratTugas $suratTugas)
    {
        $userRole = auth()->user()?->role;
        if (!in_array($userRole, ['tu', 'admin'])) {
            return redirect()->back()->with('error', 'Hanya Tata Usaha (TU) atau Admin yang berhak melakukan penomoran naskah dinas.');
        }

        $validated = $request->validate([
            'nomor_st' => 'required|string|max:255',
            'nomor_spd' => 'required|string|max:255',
            'tanggal_surat' => 'required|date',
        ]);

        $suratTugas->update([
            'nomor_st' => $validated['nomor_st'],
            'nomor_spd' => $validated['nomor_spd'],
            'tanggal_surat' => $validated['tanggal_surat'],
            'status' => 'SELESAI_TERBIT',
        ]);

        return redirect()->back()->with('success', 'Penomoran resmi Surat Tugas & SPD berhasil diterbitkan oleh Tata Usaha!');
    }

    // Step 5: Signature PPK (Only PPK or Admin)
    public function signPpk(Request $request, SuratTugas $suratTugas)
    {
        $userRole = auth()->user()?->role;
        if (!in_array($userRole, ['ppk', 'admin'])) {
            return redirect()->back()->with('error', 'Hanya Pejabat Pembuat Komitmen (PPK) atau Admin yang berhak menyematkan TTD digital.');
        }

        $isSigned = $request->boolean('is_ppk_signed', true);

        $suratTugas->update([
            'is_ppk_signed' => $isSigned,
            'signed_at' => $isSigned ? now() : null,
        ]);

        $msg = $isSigned ? 'Tanda tangan digital PPK telah resmi disematkan pada Lembar SPD.' : 'Tanda tangan digital PPK dibatalkan.';
        return redirect()->back()->with('success', $msg);
    }

    // Print Document View Generator
    public function cetak(SuratTugas $suratTugas)
    {
        $suratTugas->load(['pegawaiList', 'ppk', 'user']);

        return Inertia::render('SuratTugas/Print', [
            'suratTugas' => $suratTugas,
        ]);
    }
}
