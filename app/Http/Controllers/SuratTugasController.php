<?php

namespace App\Http\Controllers;

use App\Models\SuratTugas;
use App\Models\SuratTugasPegawai;
use App\Models\Pegawai;
use App\Models\Ppk;
use App\Models\UnitKerja;
use App\Models\TingkatBiaya;
use App\Models\JenisAngkutan;
use App\Models\Bendahara;
use App\Models\SuratTugasBiaya;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class SuratTugasController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $userRole = in_array($user?->role, ['pemohon', 'sespalu']) ? 'sespalu' : ($user?->role ?? 'sespalu');

        $query = SuratTugas::with(['pegawaiList', 'ppk', 'user']);

        // Role-based document visibility
        if ($userRole === 'sespalu') {
            // Sespalu can see all published/in-progress letters, plus their own drafts
            $query->where(function ($q) use ($user) {
                $q->where('status', '!=', 'DRAFT')
                  ->orWhere(function ($sub) use ($user) {
                      $sub->where('status', 'DRAFT')->where('user_id', $user?->id);
                  });
            });
        } elseif ($userRole === 'kapus') {
            // Kapus sees documents waiting for review or completed, excluding unfinished drafts
            $query->where('status', '!=', 'DRAFT');
        } elseif ($userRole === 'tu') {
            // TU sees all letters
        } // Admin sees everything including all drafts

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

        // Count drafts for user / admin
        $draftCountQuery = SuratTugas::where('status', 'DRAFT');
        if ($userRole !== 'admin') {
            $draftCountQuery->where('user_id', $user?->id);
        }
        $draftCount = $draftCountQuery->count();

        $suratTugas = $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();

        return Inertia::render('SuratTugas/Index', [
            'suratTugas' => $suratTugas,
            'filters' => $request->only(['search', 'status']),
            'userRole' => $userRole,
            'draftCount' => $draftCount,
        ]);
    }

    public function create(Request $request)
    {
        $user = auth()->user();
        $userRole = in_array($user?->role, ['pemohon', 'sespalu']) ? 'sespalu' : ($user?->role ?? 'sespalu');

        if (!in_array($userRole, ['sespalu', 'admin', 'tu'])) {
            return redirect()->route('surat-tugas.index')->with('error', 'Hanya Sespalu, TU, atau Admin yang dapat mengakses form Surat Tugas.');
        }

        $draft = null;
        if ($request->has('draft_id')) {
            $draft = SuratTugas::with(['pegawaiList'])->find($request->draft_id);
        }

        // Active drafts for quick-resume banner
        $activeDraftsQuery = SuratTugas::where('status', 'DRAFT');
        if ($userRole !== 'admin') {
            $activeDraftsQuery->where('user_id', $user?->id);
        }
        $activeDrafts = $activeDraftsQuery->latest()->get(['id', 'nomor_nota', 'perihal_nota', 'draft_step', 'created_at', 'updated_at']);

        return Inertia::render('SuratTugas/Create', [
            'pegawaiList' => Pegawai::where('is_active', true)->orderBy('nama')->get(),
            'ppkList' => Ppk::where('is_active', true)->orderBy('nama')->get(),
            'unitKerjaList' => UnitKerja::where('is_active', true)->orderBy('nama')->get(),
            'tingkatBiayaList' => TingkatBiaya::where('is_active', true)->orderBy('kode')->get(),
            'jenisAngkutanList' => JenisAngkutan::where('is_active', true)->orderBy('nama')->get(),
            'bendaharaList' => Bendahara::where('is_active', true)->orderBy('nama')->get(),
            'userRole' => $userRole,
            'draft' => $draft,
            'activeDrafts' => $activeDrafts,
        ]);
    }

    public function edit(SuratTugas $suratTugas)
    {
        return redirect()->route('surat-tugas.create', ['draft_id' => $suratTugas->id]);
    }

    public function saveDraft(Request $request)
    {
        $user = auth()->user();
        $userRole = in_array($user?->role, ['pemohon', 'sespalu']) ? 'sespalu' : ($user?->role ?? 'sespalu');

        if (!in_array($userRole, ['sespalu', 'admin', 'tu'])) {
            return redirect()->back()->with('error', 'Anda tidak memiliki hak untuk menyimpan draft.');
        }

        $draftId = $request->input('draft_id');
        $suratTugas = null;
        if ($draftId) {
            $suratTugas = SuratTugas::find($draftId);
        }

        if (!$suratTugas) {
            $suratTugas = new SuratTugas();
            $suratTugas->user_id = $user->id;
            $suratTugas->status = 'DRAFT';
        }

        // Handle file uploads if provided
        if ($request->hasFile('file_undangan')) {
            $suratTugas->file_undangan = $request->file('file_undangan')->store('undangan', 'public');
        }
        if ($request->hasFile('file_izin_setneg')) {
            $suratTugas->file_izin_setneg = $request->file('file_izin_setneg')->store('setneg', 'public');
        }

        // Fill data from request if present
        $suratTugas->draft_step = (int) $request->input('draft_step', 1);
        $suratTugas->kategori_perjalanan = $request->input('kategori_perjalanan', $suratTugas->kategori_perjalanan ?? 'DALAM_NEGERI');
        $suratTugas->sumber_asal = $request->input('sumber_asal', $suratTugas->sumber_asal ?? 'EKSTERNAL');
        $suratTugas->nomor_nota = $request->input('nomor_nota') ?: ($suratTugas->nomor_nota ?: 'DRAFT-' . date('YmdHis'));
        $suratTugas->pengirim_nota = $request->input('pengirim_nota', $suratTugas->pengirim_nota);
        $suratTugas->tanggal_nota = $request->input('tanggal_nota', $suratTugas->tanggal_nota ?? now()->toDateString());
        $suratTugas->perihal_nota = $request->input('perihal_nota') ?: ($suratTugas->perihal_nota ?: 'Draft Usulan Surat Tugas');
        
        if ($request->filled('kapus_decision')) {
            $suratTugas->kapus_decision = $request->input('kapus_decision');
        }
        if ($request->filled('catatan_kapus')) {
            $suratTugas->catatan_kapus = $request->input('catatan_kapus');
        }

        if ($request->filled('ppk_id')) {
            $ppk = Ppk::find($request->input('ppk_id'));
            if ($ppk) {
                $suratTugas->ppk_id = $ppk->id;
                $suratTugas->ppk_nama_snapshot = $ppk->nama;
                $suratTugas->ppk_nip_snapshot = $ppk->nip;
            }
        }

        $bendahara = Bendahara::where('is_active', true)->first();
        if ($bendahara) {
            $suratTugas->bendahara_id = $bendahara->id;
            $suratTugas->bendahara_nama_snapshot = $bendahara->nama;
            $suratTugas->bendahara_nip_snapshot = $bendahara->nip;
        }

        if ($request->filled('tingkat_biaya_kode')) $suratTugas->tingkat_biaya_kode = $request->input('tingkat_biaya_kode');
        if ($request->filled('jenis_angkutan_nama')) $suratTugas->jenis_angkutan_nama = $request->input('jenis_angkutan_nama');
        if ($request->filled('tempat_berangkat')) $suratTugas->tempat_berangkat = $request->input('tempat_berangkat');
        if ($request->filled('tempat_tujuan')) $suratTugas->tempat_tujuan = $request->input('tempat_tujuan');
        if ($request->filled('negara_tujuan')) $suratTugas->negara_tujuan = $request->input('negara_tujuan');
        if ($request->filled('no_setneg')) $suratTugas->no_setneg = $request->input('no_setneg');
        if ($request->filled('tanggal_berangkat')) $suratTugas->tanggal_berangkat = $request->input('tanggal_berangkat');
        if ($request->filled('tanggal_kembali')) $suratTugas->tanggal_kembali = $request->input('tanggal_kembali');
        if ($request->filled('durasi_hari')) $suratTugas->durasi_hari = (int) $request->input('durasi_hari', 1);

        // Numbering fields if filled by admin/tu
        if ($request->filled('nomor_st')) $suratTugas->nomor_st = $request->input('nomor_st');
        if ($request->filled('nomor_spd')) $suratTugas->nomor_spd = $request->input('nomor_spd');
        if ($request->filled('tanggal_surat')) $suratTugas->tanggal_surat = $request->input('tanggal_surat');

        $suratTugas->save();

        // Sync pegawai if present
        if ($request->has('pegawai_ids') && is_array($request->input('pegawai_ids'))) {
            $suratTugas->pegawaiList()->delete();
            $suratTugas->biayaList()->delete();

            $durasi = max(1, (int)$suratTugas->durasi_hari);
            $malam = max(0, $durasi - 1);
            $tarifHarian = 370000;
            $tarifTransport = 170000;
            $tarifHotel = 350000;

            foreach ($request->input('pegawai_ids') as $index => $pegawaiId) {
                $pegawai = Pegawai::find($pegawaiId);
                if ($pegawai) {
                    $stPegawai = SuratTugasPegawai::create([
                        'surat_tugas_id' => $suratTugas->id,
                        'pegawai_id' => $pegawai->id,
                        'nama' => $pegawai->nama,
                        'nip' => $pegawai->nip,
                        'nik' => $pegawai->nik,
                        'pangkat' => $pegawai->pangkat,
                        'golongan' => $pegawai->golongan,
                        'jabatan' => $pegawai->jabatan,
                        'unit_kerja' => $pegawai->unit_kerja ?: 'Pusdiklat Kemlu',
                        'swift' => $pegawai->swift,
                        'nama_bank' => $pegawai->nama_bank,
                        'no_rekening' => $pegawai->no_rekening,
                        'urutan' => $index + 1,
                    ]);

                    $uangHarianTotal = $durasi * $tarifHarian;
                    $transAsalTotal = 2 * $tarifTransport;
                    $transTujTotal = 2 * $tarifTransport;
                    $hotelTotal = $malam * $tarifHotel;
                    $pengeluaranRiilTrans = $transAsalTotal + $transTujTotal;
                    $totalBiaya = $uangHarianTotal + $transAsalTotal + $transTujTotal + $hotelTotal;

                    SuratTugasBiaya::create([
                        'surat_tugas_id' => $suratTugas->id,
                        'surat_tugas_pegawai_id' => $stPegawai->id,
                        'uang_harian_hari' => $durasi,
                        'uang_harian_tarif' => $tarifHarian,
                        'uang_harian_persen' => 100,
                        'uang_harian_total' => $uangHarianTotal,
                        'representasi_hari' => 0,
                        'representasi_tarif' => 0,
                        'representasi_persen' => 100,
                        'representasi_total' => 0,
                        'transport_asal_kali' => 2,
                        'transport_asal_tarif' => $tarifTransport,
                        'transport_asal_persen' => 100,
                        'transport_asal_total' => $transAsalTotal,
                        'transport_tujuan_kali' => 2,
                        'transport_tujuan_tarif' => $tarifTransport,
                        'transport_tujuan_persen' => 100,
                        'transport_tujuan_total' => $transTujTotal,
                        'akomodasi_malam' => $malam,
                        'akomodasi_tarif' => $tarifHotel,
                        'akomodasi_persen' => 100,
                        'akomodasi_total' => $hotelTotal,
                        'status_menginap' => 'HOTEL',
                        'pengeluaran_riil_transport' => $pengeluaranRiilTrans,
                        'pengeluaran_riil_penginapan_30' => 0,
                        'pengeluaran_riil_total' => $pengeluaranRiilTrans,
                        'total_biaya' => $totalBiaya,
                        'uang_muka' => $totalBiaya,
                        'sisa_kurang_lebih' => 0,
                    ]);
                }
            }
        }

        return redirect()->route('surat-tugas.create', ['draft_id' => $suratTugas->id])
            ->with('success', 'Draft surat berhasil disimpan di Tahap ' . $suratTugas->draft_step . '! Anda dapat melanjutkan kapan saja.');
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        $userRole = in_array($user?->role, ['pemohon', 'sespalu']) ? 'sespalu' : ($user?->role ?? 'sespalu');

        if (!in_array($userRole, ['sespalu', 'admin', 'tu'])) {
            return redirect()->back()->with('error', 'Hanya Sespalu, TU, atau Admin yang dapat mengirim usulan Surat Tugas.');
        }

        // If drafting an existing surat_tugas, file_undangan may already exist in storage
        $draftId = $request->input('draft_id');
        $existingDraft = $draftId ? SuratTugas::find($draftId) : null;

        $rules = [
            'kategori_perjalanan' => 'required|in:DALAM_NEGERI,LUAR_NEGERI',
            'sumber_asal' => 'required|in:INTERNAL,EKSTERNAL',
            'nomor_nota' => 'required|string|max:255',
            'pengirim_nota' => 'required|string|max:255',
            'tanggal_nota' => 'required|date',
            'perihal_nota' => 'required|string',
            'ppk_id' => 'required|exists:ppk,id',
            'tingkat_biaya_kode' => 'required|exists:tingkat_biaya,kode',
            'jenis_angkutan_nama' => 'required|exists:jenis_angkutan,nama',
            'tempat_berangkat' => 'required|string',
            'tempat_tujuan' => 'required|string',
            'negara_tujuan' => 'required_if:kategori_perjalanan,LUAR_NEGERI|nullable|string|max:255',
            'no_setneg' => 'required_if:kategori_perjalanan,LUAR_NEGERI|nullable|string|max:255',
            'tanggal_berangkat' => 'required|date',
            'tanggal_kembali' => 'required|date|after_or_equal:tanggal_berangkat',
            'tanggal_surat' => 'required|date',
            'durasi_hari' => 'required|integer|min:1',
            'pegawai_ids' => 'required|array|min:1',
            'pegawai_ids.*' => 'exists:pegawai,id',
        ];

        // File validation: required if new, or nullable if existing draft has it
        if ($existingDraft && $existingDraft->file_undangan) {
            $rules['file_undangan'] = 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240';
        } else {
            $rules['file_undangan'] = 'required|file|mimes:pdf,jpg,jpeg,png|max:10240';
        }

        if ($request->input('kategori_perjalanan') === 'LUAR_NEGERI') {
            if ($existingDraft && $existingDraft->file_izin_setneg) {
                $rules['file_izin_setneg'] = 'nullable|file|mimes:pdf,docx|max:10240';
            } else {
                $rules['file_izin_setneg'] = 'required|file|mimes:pdf,docx|max:10240';
            }
        }

        // If Admin or TU fills nomor_st & nomor_spd, validate them
        if (in_array($userRole, ['admin', 'tu']) && $request->filled('nomor_st')) {
            $rules['nomor_st'] = 'required|string|max:255';
            $rules['nomor_spd'] = 'required|string|max:255';
        }

        $validated = $request->validate($rules);

        $ppk = Ppk::findOrFail($validated['ppk_id']);
        $bendahara = Bendahara::where('is_active', true)->first();

        $filePathUndangan = $existingDraft?->file_undangan;
        if ($request->hasFile('file_undangan')) {
            if ($filePathUndangan) {
                Storage::disk('public')->delete($filePathUndangan);
            }
            $filePathUndangan = $request->file('file_undangan')->store('undangan', 'public');
        }

        $filePathSetneg = $existingDraft?->file_izin_setneg;
        if ($request->hasFile('file_izin_setneg')) {
            if ($filePathSetneg) {
                Storage::disk('public')->delete($filePathSetneg);
            }
            $filePathSetneg = $request->file('file_izin_setneg')->store('setneg', 'public');
        }

        // Determine workflow status:
        // Admin or TU who filled nomor_st & nomor_spd -> SELESAI_TERBIT
        // Admin who approved kapus -> MENUNGGU_PENOMORAN_TU (if no nomor_st)
        // Otherwise -> MENUNGGU_DISPOSISI_KAPUS
        $status = 'MENUNGGU_DISPOSISI_KAPUS';
        $nomorSt = $request->input('nomor_st');
        $nomorSpd = $request->input('nomor_spd');
        $kapusDecision = $request->input('kapus_decision', $existingDraft?->kapus_decision);
        $catatanKapus = $request->input('catatan_kapus', $existingDraft?->catatan_kapus);

        if (in_array($userRole, ['admin', 'tu']) && $nomorSt && $nomorSpd) {
            $status = 'SELESAI_TERBIT';
            if (!$kapusDecision) $kapusDecision = 'YA';
        } elseif (in_array($userRole, ['admin', 'kapus']) && $kapusDecision === 'YA') {
            $status = 'MENUNGGU_PENOMORAN_TU';
        }

        $dataToSave = [
            'user_id' => $existingDraft ? $existingDraft->user_id : auth()->id(),
            'kategori_perjalanan' => $validated['kategori_perjalanan'],
            'sumber_asal' => $validated['sumber_asal'],
            'nomor_nota' => $validated['nomor_nota'],
            'pengirim_nota' => $validated['pengirim_nota'],
            'tanggal_nota' => $validated['tanggal_nota'],
            'perihal_nota' => $validated['perihal_nota'],
            'file_undangan' => $filePathUndangan,
            'file_izin_setneg' => $filePathSetneg,
            'status' => $status,
            'draft_step' => 4,
            'kapus_decision' => $kapusDecision,
            'catatan_kapus' => $catatanKapus,
            'ppk_id' => $ppk->id,
            'ppk_nama_snapshot' => $ppk->nama,
            'ppk_nip_snapshot' => $ppk->nip,
            'bendahara_id' => $bendahara?->id,
            'bendahara_nama_snapshot' => $bendahara?->nama,
            'bendahara_nip_snapshot' => $bendahara?->nip,
            'tingkat_biaya_kode' => $validated['tingkat_biaya_kode'],
            'jenis_angkutan_nama' => $validated['jenis_angkutan_nama'],
            'tempat_berangkat' => $validated['tempat_berangkat'],
            'tempat_tujuan' => $validated['tempat_tujuan'],
            'negara_tujuan' => $validated['negara_tujuan'] ?? null,
            'no_setneg' => $validated['no_setneg'] ?? null,
            'tanggal_berangkat' => $validated['tanggal_berangkat'],
            'tanggal_kembali' => $validated['tanggal_kembali'],
            'tanggal_surat' => $validated['tanggal_surat'],
            'durasi_hari' => $validated['durasi_hari'],
            'nomor_st' => $nomorSt,
            'nomor_spd' => $nomorSpd,
            'akun_anggaran' => 'DIPA Pusdiklat Kemlu',
        ];

        if ($existingDraft) {
            $existingDraft->update($dataToSave);
            $suratTugas = $existingDraft;
            $suratTugas->pegawaiList()->delete();
            $suratTugas->biayaList()->delete();
        } else {
            $suratTugas = SuratTugas::create($dataToSave);
        }

        // Save officer snapshots & default biaya
        $durasi = (int)$validated['durasi_hari'];
        $malam = max(0, $durasi - 1);
        $tarifHarian = 370000;
        $tarifTransport = 170000;
        $tarifHotel = 350000;

        foreach ($validated['pegawai_ids'] as $index => $pegawaiId) {
            $pegawai = Pegawai::find($pegawaiId);
            if ($pegawai) {
                $stPegawai = SuratTugasPegawai::create([
                    'surat_tugas_id' => $suratTugas->id,
                    'pegawai_id' => $pegawai->id,
                    'nama' => $pegawai->nama,
                    'nip' => $pegawai->nip,
                    'nik' => $pegawai->nik,
                    'pangkat' => $pegawai->pangkat,
                    'golongan' => $pegawai->golongan,
                    'jabatan' => $pegawai->jabatan,
                    'unit_kerja' => $pegawai->unit_kerja ?: 'Pusdiklat Kemlu',
                    'swift' => $pegawai->swift,
                    'nama_bank' => $pegawai->nama_bank,
                    'no_rekening' => $pegawai->no_rekening,
                    'urutan' => $index + 1,
                ]);

                // Hitung biaya estimasi awal
                $uangHarianTotal = $durasi * $tarifHarian;
                $transAsalTotal = 2 * $tarifTransport;
                $transTujTotal = 2 * $tarifTransport;
                $hotelTotal = $malam * $tarifHotel;
                $pengeluaranRiilTrans = $transAsalTotal + $transTujTotal;
                $totalBiaya = $uangHarianTotal + $transAsalTotal + $transTujTotal + $hotelTotal;

                SuratTugasBiaya::create([
                    'surat_tugas_id' => $suratTugas->id,
                    'surat_tugas_pegawai_id' => $stPegawai->id,
                    'uang_harian_hari' => $durasi,
                    'uang_harian_tarif' => $tarifHarian,
                    'uang_harian_persen' => 100,
                    'uang_harian_total' => $uangHarianTotal,
                    'representasi_hari' => 0,
                    'representasi_tarif' => 0,
                    'representasi_persen' => 100,
                    'representasi_total' => 0,
                    'transport_asal_kali' => 2,
                    'transport_asal_tarif' => $tarifTransport,
                    'transport_asal_persen' => 100,
                    'transport_asal_total' => $transAsalTotal,
                    'transport_tujuan_kali' => 2,
                    'transport_tujuan_tarif' => $tarifTransport,
                    'transport_tujuan_persen' => 100,
                    'transport_tujuan_total' => $transTujTotal,
                    'akomodasi_malam' => $malam,
                    'akomodasi_tarif' => $tarifHotel,
                    'akomodasi_persen' => 100,
                    'akomodasi_total' => $hotelTotal,
                    'status_menginap' => 'HOTEL',
                    'pengeluaran_riil_transport' => $pengeluaranRiilTrans,
                    'pengeluaran_riil_penginapan_30' => 0,
                    'pengeluaran_riil_total' => $pengeluaranRiilTrans,
                    'total_biaya' => $totalBiaya,
                    'uang_muka' => $totalBiaya,
                    'sisa_kurang_lebih' => 0,
                ]);
            }
        }

        $message = $status === 'SELESAI_TERBIT'
            ? 'Surat Tugas & SPD resmi berhasil diterbitkan dengan nomor resmi TU!'
            : 'Usulan Surat Tugas & SPD berhasil dikirim! Menunggu persetujuan / proses selanjutnya.';

        return redirect()->route('surat-tugas.show', $suratTugas->id)->with('success', $message);
    }

    public function destroy(SuratTugas $suratTugas)
    {
        $user = auth()->user();
        if ($user->role !== 'admin' && ($suratTugas->user_id !== $user->id || $suratTugas->status !== 'DRAFT')) {
            return redirect()->back()->with('error', 'Anda tidak memiliki hak untuk menghapus dokumen ini.');
        }

        if ($suratTugas->file_undangan) {
            Storage::disk('public')->delete($suratTugas->file_undangan);
        }
        if ($suratTugas->file_izin_setneg) {
            Storage::disk('public')->delete($suratTugas->file_izin_setneg);
        }

        $suratTugas->delete();

        return redirect()->route('surat-tugas.index')->with('success', 'Dokumen / Draft Surat Tugas berhasil dihapus.');
    }

    public function show(SuratTugas $suratTugas)
    {
        $suratTugas->load(['pegawaiList.biaya', 'ppk', 'bendahara', 'user', 'biayaList']);
        $userRole = in_array(auth()->user()?->role, ['pemohon', 'sespalu']) ? 'sespalu' : (auth()->user()?->role ?? 'sespalu');

        return Inertia::render('SuratTugas/Show', [
            'suratTugas' => $suratTugas,
            'userRole' => $userRole,
        ]);
    }

    // Step 2: Disposisi Kapus (Only Kapus or Admin)
    public function disposisi(Request $request, SuratTugas $suratTugas)
    {
        $userRole = auth()->user()?->role;
        if (!in_array($userRole, ['kapus', 'admin'])) {
            return redirect()->back()->with('error', 'Hanya Kepala Pusat (Kapus) atau Admin yang berhak memberikan disposisi.');
        }
        if ($suratTugas->status !== 'MENUNGGU_DISPOSISI_KAPUS') {
            return redirect()->back()->with('error', 'Disposisi Kapus hanya dapat dilakukan setelah usulan dikirim oleh Sespalu.');
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
        if ($suratTugas->status !== 'MENUNGGU_PENOMORAN_TU') {
            return redirect()->back()->with('error', 'Penomoran TU hanya dapat dilakukan setelah disposisi Kapus menyetujui usulan.');
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
        if ($suratTugas->status !== 'SELESAI_TERBIT') {
            return redirect()->back()->with('error', 'TTD PPK dapat dilakukan setelah dokumen selesai diterbitkan oleh TU.');
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
        if (!in_array(auth()->user()?->role, ['tu', 'admin']) || $suratTugas->status !== 'SELESAI_TERBIT') {
            return redirect()->route('surat-tugas.show', $suratTugas->id)->with('error', 'Dokumen hanya dapat dicetak oleh TU setelah penomoran resmi diterbitkan.');
        }

        $suratTugas->load(['pegawaiList.biaya', 'ppk', 'bendahara', 'user', 'biayaList']);

        return Inertia::render('SuratTugas/Print', [
            'suratTugas' => $suratTugas,
        ]);
    }
}
