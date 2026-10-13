<?php

namespace App\Http\Controllers;

use App\Models\Bendahara;
use App\Models\JenisAngkutan;
use App\Models\Pegawai;
use App\Models\Ppk;
use App\Models\SuratTugas;
use App\Models\SuratTugasBiaya;
use App\Models\SuratTugasPegawai;
use App\Models\TingkatBiaya;
use App\Models\UnitKerja;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SuratTugasController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $userRole = $user->normalizedRole();

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
        } elseif ($userRole !== 'admin') {
            // Only the owner and Admin can see unfinished drafts.
            $query->where('status', '!=', 'DRAFT');
        }

        $statusCounts = (clone $query)
            ->selectRaw('status, COUNT(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');
        $inProgressStatuses = ['DISPOSISI_KAPUS_YA', 'DISPOSISI_KAPUS_REVISI', 'MENUNGGU_PENOMORAN_TU'];
        $statusSummary = [
            'total' => (int) $statusCounts->sum(),
            'waiting_kapus' => (int) ($statusCounts['MENUNGGU_DISPOSISI_KAPUS'] ?? 0),
            'in_progress' => (int) $statusCounts->only($inProgressStatuses)->sum(),
            'published' => (int) ($statusCounts['SELESAI_TERBIT'] ?? 0),
        ];

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
            if ($request->status === 'DALAM_PROSES') {
                $query->whereIn('status', $inProgressStatuses);
            } else {
                $query->where('status', $request->status);
            }
        }

        // Count drafts for user / admin
        $draftCountQuery = SuratTugas::where('status', 'DRAFT');
        if ($userRole === 'sespalu') {
            $draftCountQuery->where('user_id', $user?->id);
        } elseif ($userRole !== 'admin') {
            $draftCountQuery->whereRaw('1 = 0');
        }
        $draftCount = $draftCountQuery->count();

        $suratTugas = $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();

        return Inertia::render('SuratTugas/Index', [
            'suratTugas' => $suratTugas,
            'filters' => $request->only(['search', 'status']),
            'userRole' => $userRole,
            'draftCount' => $draftCount,
            'statusSummary' => $statusSummary,
        ]);
    }

    public function create(Request $request)
    {
        $user = auth()->user();
        $userRole = $user->normalizedRole();

        abort_unless(in_array($userRole, ['sespalu', 'admin'], true), 403);

        $draft = null;
        if ($request->filled('draft_id')) {
            $draft = $this->draftQueryFor($user)
                ->with(['pegawaiList'])
                ->findOrFail($request->integer('draft_id'));
        } elseif ($request->filled('workflow_id')) {
            $draft = $this->editableWorkflowQueryFor($user)
                ->with(['pegawaiList'])
                ->findOrFail($request->integer('workflow_id'));
        }

        // Active drafts for quick-resume banner
        $activeDraftsQuery = SuratTugas::where('status', 'DRAFT');
        if ($userRole === 'sespalu') {
            $activeDraftsQuery->where('user_id', $user?->id);
        } elseif ($userRole !== 'admin') {
            $activeDraftsQuery->whereRaw('1 = 0');
        }
        $activeDrafts = $activeDraftsQuery->latest()->get(['id', 'nomor_nota', 'perihal_nota', 'draft_step', 'created_at', 'updated_at']);

        return Inertia::render('SuratTugas/Create', [
            'pegawaiList' => Pegawai::where('is_active', true)->orderBy('nama')->get(),
            'ppkList' => Ppk::where('is_active', true)->orderBy('nama')->get(),
            'unitKerjaList' => UnitKerja::where('is_active', true)->orderBy('nama')->get(),
            'tingkatBiayaList' => TingkatBiaya::where('is_active', true)->orderBy('kode')->get(),
            'jenisAngkutanList' => JenisAngkutan::where('is_active', true)->orderBy('nama')->get(),
            'bendaharaList' => Bendahara::where('is_active', true)->orderBy('nama')->get(),
            'draft' => $draft,
            'activeDrafts' => $activeDrafts,
        ]);
    }

    public function edit(SuratTugas $suratTugas)
    {
        abort_unless($suratTugas->status === 'DRAFT', 404);
        abort_unless(
            auth()->user()->isAdmin() || $suratTugas->user_id === auth()->id(),
            404
        );

        return redirect()->route('surat-tugas.create', ['draft_id' => $suratTugas->id]);
    }

    public function saveDraft(Request $request)
    {
        $user = auth()->user();
        $userRole = $user->normalizedRole();

        abort_unless(in_array($userRole, ['sespalu', 'admin'], true), 403);

        $validated = $request->validate([
            'draft_id' => 'nullable|integer',
            'workflow_id' => 'nullable|integer',
            'draft_step' => 'required|integer|between:1,5',
            'kategori_perjalanan' => 'sometimes|in:DALAM_NEGERI,LUAR_NEGERI',
            'sumber_asal' => 'sometimes|in:INTERNAL,EKSTERNAL',
            'nomor_nota' => 'nullable|string|max:255',
            'pengirim_nota' => 'nullable|string|max:255',
            'tanggal_nota' => 'nullable|date',
            'perihal_nota' => 'nullable|string',
            'file_undangan' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'file_izin_setneg' => 'nullable|file|mimes:pdf,docx|max:10240',
            'ppk_id' => 'nullable|exists:ppk,id',
            'tingkat_biaya_kode' => 'nullable|exists:tingkat_biaya,kode',
            'jenis_angkutan_nama' => 'nullable|exists:jenis_angkutan,nama',
            'tempat_berangkat' => 'nullable|string|max:255',
            'tempat_tujuan' => 'nullable|string|max:255',
            'negara_tujuan' => 'nullable|string|max:255',
            'no_setneg' => 'nullable|string|max:255',
            'tanggal_berangkat' => 'nullable|date',
            'tanggal_kembali' => 'nullable|date',
            'durasi_hari' => 'nullable|integer|min:1',
            'pegawai_ids' => 'sometimes|array',
            'pegawai_ids.*' => 'exists:pegawai,id',
        ]);

        $suratTugas = ! empty($validated['workflow_id'])
            ? $this->editableWorkflowQueryFor($user)->findOrFail($validated['workflow_id'])
            : (! empty($validated['draft_id'])
                ? $this->draftQueryFor($user)->findOrFail($validated['draft_id'])
                : null);
        $isWorkflowResume = $suratTugas && $suratTugas->status !== 'DRAFT';

        if (! $suratTugas) {
            $suratTugas = new SuratTugas;
            $suratTugas->user_id = $user->id;
            $suratTugas->status = 'DRAFT';
        }

        // Handle file uploads if provided
        if ($request->hasFile('file_undangan')) {
            if ($suratTugas->file_undangan) {
                Storage::disk('public')->delete($suratTugas->file_undangan);
            }
            $suratTugas->file_undangan = $request->file('file_undangan')->store('undangan', 'public');
        }
        if ($request->hasFile('file_izin_setneg')) {
            if ($suratTugas->file_izin_setneg) {
                Storage::disk('public')->delete($suratTugas->file_izin_setneg);
            }
            $suratTugas->file_izin_setneg = $request->file('file_izin_setneg')->store('setneg', 'public');
        }

        // Fill data from request if present
        $suratTugas->draft_step = $isWorkflowResume
            ? ($suratTugas->status === 'DISPOSISI_KAPUS_YA' ? 3 : 1)
            : min($validated['draft_step'], 1);
        $suratTugas->kategori_perjalanan = $validated['kategori_perjalanan'] ?? $suratTugas->kategori_perjalanan ?? 'DALAM_NEGERI';
        $suratTugas->sumber_asal = $validated['sumber_asal'] ?? $suratTugas->sumber_asal ?? 'EKSTERNAL';
        $suratTugas->nomor_nota = $validated['nomor_nota'] ?? $suratTugas->nomor_nota ?? 'DRAFT-'.now()->format('YmdHis');
        $suratTugas->pengirim_nota = $validated['pengirim_nota'] ?? $suratTugas->pengirim_nota;
        $suratTugas->tanggal_nota = $validated['tanggal_nota'] ?? $suratTugas->tanggal_nota;
        $suratTugas->perihal_nota = $validated['perihal_nota'] ?? $suratTugas->perihal_nota ?? 'Draft Usulan Surat Tugas';

        if (! empty($validated['ppk_id'])) {
            $ppk = Ppk::find($validated['ppk_id']);
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

        foreach ([
            'tingkat_biaya_kode', 'jenis_angkutan_nama', 'tempat_berangkat',
            'tempat_tujuan', 'negara_tujuan', 'no_setneg', 'tanggal_berangkat',
            'tanggal_kembali', 'durasi_hari',
        ] as $field) {
            if (array_key_exists($field, $validated) && $validated[$field] !== null) {
                $suratTugas->{$field} = $validated[$field];
            }
        }

        $suratTugas->save();

        // Sync pegawai if present
        if (array_key_exists('pegawai_ids', $validated)) {
            $suratTugas->pegawaiList()->delete();
            $suratTugas->biayaList()->delete();

            $durasi = max(1, (int) $suratTugas->durasi_hari);
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

        return redirect()->route('surat-tugas.create', [
            $isWorkflowResume ? 'workflow_id' : 'draft_id' => $suratTugas->id,
        ])
            ->with('success', 'Draft surat berhasil disimpan di Tahap '.$suratTugas->draft_step.'! Anda dapat melanjutkan kapan saja.');
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        abort_unless(in_array($user->normalizedRole(), ['sespalu', 'admin'], true), 403);

        $validated = $request->validate([
            'draft_id' => 'nullable|integer',
            'workflow_id' => 'nullable|integer',
            'kategori_perjalanan' => 'required|in:DALAM_NEGERI,LUAR_NEGERI',
            'sumber_asal' => 'required|in:INTERNAL,EKSTERNAL',
            'nomor_nota' => 'required|string|max:255',
            'pengirim_nota' => 'required|string|max:255',
            'tanggal_nota' => 'required|date',
            'perihal_nota' => 'required|string',
            'file_undangan' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'file_izin_setneg' => 'nullable|file|mimes:pdf,docx|max:10240',
        ]);

        abort_if(! empty($validated['draft_id']) && ! empty($validated['workflow_id']), 422);

        $suratTugas = ! empty($validated['draft_id'])
            ? $this->draftQueryFor($user)->findOrFail($validated['draft_id'])
            : (! empty($validated['workflow_id'])
                ? $this->editableWorkflowQueryFor($user)
                    ->where('status', 'DISPOSISI_KAPUS_REVISI')
                    ->findOrFail($validated['workflow_id'])
                : new SuratTugas);

        if (! $suratTugas->exists && ! $request->hasFile('file_undangan')) {
            return back()->withErrors(['file_undangan' => 'Lampiran nota / undangan wajib diunggah.'])->withInput();
        }
        if ($validated['kategori_perjalanan'] === 'LUAR_NEGERI'
            && ! $suratTugas->file_izin_setneg
            && ! $request->hasFile('file_izin_setneg')) {
            return back()->withErrors(['file_izin_setneg' => 'Lampiran izin Setneg wajib diunggah untuk perjalanan luar negeri.'])->withInput();
        }

        if ($request->hasFile('file_undangan')) {
            if ($suratTugas->file_undangan) {
                Storage::disk('public')->delete($suratTugas->file_undangan);
            }
            $suratTugas->file_undangan = $request->file('file_undangan')->store('undangan', 'public');
        }
        if ($request->hasFile('file_izin_setneg')) {
            if ($suratTugas->file_izin_setneg) {
                Storage::disk('public')->delete($suratTugas->file_izin_setneg);
            }
            $suratTugas->file_izin_setneg = $request->file('file_izin_setneg')->store('setneg', 'public');
        }

        $suratTugas->user_id ??= $user->id;
        $suratTugas->fill([
            'kategori_perjalanan' => $validated['kategori_perjalanan'],
            'sumber_asal' => $validated['sumber_asal'],
            'nomor_nota' => $validated['nomor_nota'],
            'pengirim_nota' => $validated['pengirim_nota'],
            'tanggal_nota' => $validated['tanggal_nota'],
            'perihal_nota' => $validated['perihal_nota'],
            'status' => 'MENUNGGU_DISPOSISI_KAPUS',
            'draft_step' => 2,
            'kapus_decision' => null,
            'catatan_kapus' => null,
        ]);
        $suratTugas->save();

        return redirect()->route('surat-tugas.show', $suratTugas)
            ->with('success', 'Nota / undangan berhasil dikirim untuk ditinjau Kapus.');
    }

    public function complete(Request $request, SuratTugas $suratTugas)
    {
        $user = auth()->user();
        $userRole = $user->normalizedRole();

        abort_unless(in_array($userRole, ['sespalu', 'admin'], true), 403);
        abort_unless(
            $suratTugas->status === 'DISPOSISI_KAPUS_YA'
                && ($user->isAdmin() || $suratTugas->user_id === $user->id),
            404
        );

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
            'durasi_hari' => 'required|integer|min:1',
            'pegawai_ids' => 'required|array|min:1',
            'pegawai_ids.*' => 'exists:pegawai,id',
        ];

        $rules['file_undangan'] = 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240';

        if ($request->input('kategori_perjalanan') === 'LUAR_NEGERI') {
            $rules['file_izin_setneg'] = 'nullable|file|mimes:pdf,docx|max:10240';
        }

        $validated = $request->validate($rules);
        abort_if(! $suratTugas->file_undangan && ! $request->hasFile('file_undangan'), 422, 'Lampiran nota / undangan tidak ditemukan.');
        abort_if(
            $validated['kategori_perjalanan'] === 'LUAR_NEGERI'
                && ! $suratTugas->file_izin_setneg
                && ! $request->hasFile('file_izin_setneg'),
            422,
            'Lampiran izin Setneg tidak ditemukan.'
        );

        $ppk = Ppk::findOrFail($validated['ppk_id']);
        $bendahara = Bendahara::where('is_active', true)->first();

        $filePathUndangan = $suratTugas->file_undangan;
        if ($request->hasFile('file_undangan')) {
            if ($filePathUndangan) {
                Storage::disk('public')->delete($filePathUndangan);
            }
            $filePathUndangan = $request->file('file_undangan')->store('undangan', 'public');
        }

        $filePathSetneg = $suratTugas->file_izin_setneg;
        if ($request->hasFile('file_izin_setneg')) {
            if ($filePathSetneg) {
                Storage::disk('public')->delete($filePathSetneg);
            }
            $filePathSetneg = $request->file('file_izin_setneg')->store('setneg', 'public');
        }

        $dataToSave = [
            'user_id' => $suratTugas->user_id,
            'kategori_perjalanan' => $validated['kategori_perjalanan'],
            'sumber_asal' => $validated['sumber_asal'],
            'nomor_nota' => $validated['nomor_nota'],
            'pengirim_nota' => $validated['pengirim_nota'],
            'tanggal_nota' => $validated['tanggal_nota'],
            'perihal_nota' => $validated['perihal_nota'],
            'file_undangan' => $filePathUndangan,
            'file_izin_setneg' => $filePathSetneg,
            'status' => 'MENUNGGU_PENOMORAN_TU',
            'draft_step' => 4,
            'kapus_decision' => 'YA',
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
            'tanggal_surat' => null,
            'durasi_hari' => $validated['durasi_hari'],
            'nomor_st' => null,
            'nomor_spd' => null,
            'akun_anggaran' => 'DIPA Pusdiklat Kemlu',
        ];

        $suratTugas->update($dataToSave);
        $suratTugas->pegawaiList()->delete();
        $suratTugas->biayaList()->delete();

        // Save officer snapshots & default biaya
        $durasi = (int) $validated['durasi_hari'];
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

        return redirect()->route('surat-tugas.show', $suratTugas->id)
            ->with('success', 'Draft Personel & SPD berhasil dikirim ke TU untuk penomoran.');
    }

    public function destroy(SuratTugas $suratTugas)
    {
        $user = auth()->user();
        abort_unless(
            $user->isAdmin() || ($suratTugas->user_id === $user->id && $suratTugas->status === 'DRAFT'),
            403
        );

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
        $user = auth()->user();
        abort_unless(
            $suratTugas->status !== 'DRAFT'
                || $user->isAdmin()
                || $suratTugas->user_id === $user->id,
            404
        );

        $suratTugas->load(['pegawaiList.biaya', 'ppk', 'bendahara', 'user', 'biayaList']);
        $userRole = $user->normalizedRole();

        return Inertia::render('SuratTugas/Show', [
            'suratTugas' => $suratTugas,
            'userRole' => $userRole,
            'canContinueWorkflow' => $user->isAdmin() || $suratTugas->user_id === $user->id,
        ]);
    }

    public function attachment(SuratTugas $suratTugas, string $lampiran)
    {
        $user = auth()->user();
        abort_unless(
            $suratTugas->status !== 'DRAFT'
                || $user->isAdmin()
                || $suratTugas->user_id === $user->id,
            404
        );

        $path = match ($lampiran) {
            'undangan' => $suratTugas->file_undangan,
            'setneg' => $suratTugas->file_izin_setneg,
            default => null,
        };
        abort_unless($path, 404);

        $disk = Storage::disk('public');
        abort_unless($disk->exists($path), 404);

        $mimeType = match (strtolower(pathinfo($path, PATHINFO_EXTENSION))) {
            'pdf' => 'application/pdf',
            'jpg', 'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            default => abort(404),
        };
        $disposition = $mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ? 'attachment'
            : 'inline';

        return $disk->response($path, basename($path), [
            'Content-Type' => $mimeType,
            'X-Content-Type-Options' => 'nosniff',
        ], $disposition);
    }

    // Step 2: Disposisi Kapus (Only Kapus or Admin)
    public function disposisi(Request $request, SuratTugas $suratTugas)
    {
        $userRole = auth()->user()?->role;
        if (! in_array($userRole, ['kapus', 'admin'])) {
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
            $status = 'DISPOSISI_KAPUS_YA';
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
        if (! in_array($userRole, ['tu', 'admin'])) {
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
        if (! in_array($userRole, ['ppk', 'admin'])) {
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
        if (! in_array(auth()->user()?->role, ['tu', 'admin']) || $suratTugas->status !== 'SELESAI_TERBIT') {
            return redirect()->route('surat-tugas.show', $suratTugas->id)->with('error', 'Dokumen hanya dapat dicetak oleh TU setelah penomoran resmi diterbitkan.');
        }

        $suratTugas->load(['pegawaiList.biaya', 'ppk', 'bendahara', 'user', 'biayaList']);

        return Inertia::render('SuratTugas/Print', [
            'suratTugas' => $suratTugas,
        ]);
    }

    private function draftQueryFor(User $user): Builder
    {
        $query = SuratTugas::where('status', 'DRAFT');

        if (! $user->isAdmin()) {
            $query->where('user_id', $user->id);
        }

        return $query;
    }

    private function editableWorkflowQueryFor(User $user): Builder
    {
        $query = SuratTugas::whereIn('status', ['DISPOSISI_KAPUS_YA', 'DISPOSISI_KAPUS_REVISI']);

        if (! $user->isAdmin()) {
            $query->where('user_id', $user->id);
        }

        return $query;
    }
}
