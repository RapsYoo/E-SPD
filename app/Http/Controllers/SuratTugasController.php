<?php

namespace App\Http\Controllers;

use App\Models\SuratTugas;
use App\Models\SuratTugasLog;
use App\Models\SuratTugasPegawai;
use App\Models\Pegawai;
use App\Models\Ppk;
use App\Models\UnitKerja;
use App\Models\TingkatBiaya;
use App\Models\JenisAngkutan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class SuratTugasController extends Controller
{
    public function index(Request $request)
    {
        $query = SuratTugas::with(['pegawaiList', 'ppk', 'user']);

        // P0-3: pemohon/sespalu hanya boleh melihat usulannya sendiri.
        if (in_array(auth()->user()?->role, ['pemohon', 'sespalu'], true)) {
            $query->where('user_id', auth()->id());
        }

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
            'authUserId' => auth()->id(),
        ]);
    }

    public function create()
    {
        if (!in_array(auth()->user()?->role, ['pemohon', 'sespalu', 'admin'])) {
            return redirect()->route('surat-tugas.index')->with('error', 'Hanya Sespalu/Pemohon atau Admin yang dapat membuat usulan Surat Tugas.');
        }

        return Inertia::render('SuratTugas/Create', [
            'pegawaiList' => Pegawai::where('is_active', true)->orderBy('nama')->get(),
            'ppkList' => Ppk::where('is_active', true)->orderBy('nama')->get(),
            'unitKerjaList' => UnitKerja::where('is_active', true)->orderBy('nama')->get(),
            'tingkatBiayaList' => TingkatBiaya::where('is_active', true)->orderBy('kode')->get(),
            'jenisAngkutanList' => JenisAngkutan::where('is_active', true)->orderBy('nama')->get(),
            'userRole' => auth()->user()?->role ?? 'pemohon',
        ]);
    }

    public function storeDraft(Request $request)
    {
        return $this->saveDraft($request);
    }

    public function editDraft(SuratTugas $suratTugas)
    {
        $this->authorizeDraft($suratTugas);
        $suratTugas->load(['pegawaiList', 'ppk']);
        $draftStep = match ($suratTugas->status) {
            'DISPOSISI_KAPUS_YA' => 3,
            'DISPOSISI_KAPUS_REVISI' => 1,
            default => $suratTugas->draft_step ?? 1,
        };
        $draftData = array_merge([
            'kategori_perjalanan' => $suratTugas->kategori_perjalanan,
            'sumber_asal' => $suratTugas->sumber_asal,
            'nomor_nota' => $suratTugas->nomor_nota,
            'pengirim_nota' => $suratTugas->pengirim_nota,
            'tanggal_nota' => $suratTugas->tanggal_nota,
            'perihal_nota' => $suratTugas->perihal_nota,
            'ppk_id' => $suratTugas->ppk_id ?? '',
            'tingkat_biaya_kode' => $suratTugas->tingkat_biaya_kode,
            'jenis_angkutan_nama' => $suratTugas->jenis_angkutan_nama,
            'tempat_berangkat' => $suratTugas->tempat_berangkat,
            'tempat_tujuan' => $suratTugas->tempat_tujuan,
            'negara_tujuan' => $suratTugas->negara_tujuan,
            'no_setneg' => $suratTugas->no_setneg,
            'tanggal_berangkat' => $suratTugas->tanggal_berangkat,
            'tanggal_kembali' => $suratTugas->tanggal_kembali,
            'tanggal_surat' => $suratTugas->tanggal_surat,
            'durasi_hari' => $suratTugas->durasi_hari,
        ], $suratTugas->draft_data ?? []);
        $draftData['draft_id'] = $suratTugas->id;
        $draftData['draft_step'] = $draftStep;
        $draftData['pegawai_ids'] = $draftData['pegawai_ids'] ?? $suratTugas->pegawaiList->pluck('pegawai_id')->filter()->values()->all();

        return Inertia::render('SuratTugas/Create', [
            'pegawaiList' => Pegawai::where('is_active', true)->orderBy('nama')->get(),
            'ppkList' => Ppk::where('is_active', true)->orderBy('nama')->get(),
            'unitKerjaList' => UnitKerja::where('is_active', true)->orderBy('nama')->get(),
            'tingkatBiayaList' => TingkatBiaya::where('is_active', true)->orderBy('kode')->get(),
            'jenisAngkutanList' => JenisAngkutan::where('is_active', true)->orderBy('nama')->get(),
            'userRole' => auth()->user()?->role ?? 'pemohon',
            'draft' => $suratTugas,
            'draftData' => $draftData,
            'draftStep' => $draftStep,
            'draftAttachments' => [
                'invitation' => $suratTugas->file_undangan ? [
                    'name' => $draftData['file_undangan_name'] ?? basename($suratTugas->file_undangan),
                    'url' => Storage::disk('public')->url($suratTugas->file_undangan),
                ] : null,
                'setneg' => $suratTugas->file_izin_setneg ? [
                    'name' => $draftData['file_izin_setneg_name'] ?? basename($suratTugas->file_izin_setneg),
                    'url' => Storage::disk('public')->url($suratTugas->file_izin_setneg),
                ] : null,
            ],
        ]);
    }

    public function updateDraft(Request $request, SuratTugas $suratTugas)
    {
        $this->authorizeDraft($suratTugas);

        return $this->saveDraft($request, $suratTugas);
    }

    private function saveDraft(Request $request, ?SuratTugas $suratTugas = null)
    {
        if (!in_array(auth()->user()?->role, ['pemohon', 'sespalu', 'admin'])) {
            return redirect()->back()->with('error', 'Hanya Sespalu/Pemohon atau Admin yang dapat menyimpan draft.');
        }

        $validated = $request->validate([
            'draft_step' => 'required|integer|between:1,4',
            'kategori_perjalanan' => 'nullable|in:DALAM_NEGERI,LUAR_NEGERI',
            'sumber_asal' => 'nullable|in:INTERNAL,EKSTERNAL',
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
            'tanggal_surat' => 'nullable|date',
            'durasi_hari' => 'nullable|integer|min:1',
            'pegawai_ids' => 'nullable|array',
            'pegawai_ids.*' => 'exists:pegawai,id',
        ]);

        $draftData = collect($validated)->except(['file_undangan', 'file_izin_setneg', 'draft_step'])->all();
        $oldUndangan = $suratTugas?->file_undangan;
        $oldSetneg = $suratTugas?->file_izin_setneg;
        // P0-verifikasi: bawa nama file lama + sub-draft actor agar tidak hilang saat update parsial.
        $existingDraft = $suratTugas?->draft_data ?? [];
        foreach (['file_undangan_name', 'file_izin_setneg_name', 'kapus', 'tu', 'ppk'] as $keep) {
            if (!array_key_exists($keep, $draftData) && array_key_exists($keep, $existingDraft)) {
                $draftData[$keep] = $existingDraft[$keep];
            }
        }
        // pegawai_ids kondisional LUAR_NEGERI/DALAM_NEGERI: jangan timpa dengan kosong bila tidak dikirim.
        if (!array_key_exists('pegawai_ids', $validated) && array_key_exists('pegawai_ids', $existingDraft)) {
            $draftData['pegawai_ids'] = $existingDraft['pegawai_ids'];
        }
        $fileUndangan = $oldUndangan;
        $fileIzinSetneg = $oldSetneg;
        $newUndangan = null;
        $newSetneg = null;

        if ($request->hasFile('file_undangan')) {
            $newUndangan = $request->file('file_undangan')->store('undangan', 'public');
            $fileUndangan = $newUndangan;
            $draftData['file_undangan_name'] = $request->file('file_undangan')->getClientOriginalName();
        }

        if ($request->hasFile('file_izin_setneg')) {
            $newSetneg = $request->file('file_izin_setneg')->store('setneg', 'public');
            $fileIzinSetneg = $newSetneg;
            $draftData['file_izin_setneg_name'] = $request->file('file_izin_setneg')->getClientOriginalName();
        }

        $ppk = !empty($validated['ppk_id']) ? Ppk::find($validated['ppk_id']) : null;
        $values = [
            'user_id' => $suratTugas?->user_id ?? auth()->id(),
            'kategori_perjalanan' => $validated['kategori_perjalanan'] ?? 'DALAM_NEGERI',
            'sumber_asal' => $validated['sumber_asal'] ?? 'EKSTERNAL',
            'nomor_nota' => $validated['nomor_nota'] ?? '[Draft belum lengkap]',
            'pengirim_nota' => $validated['pengirim_nota'] ?? '[Belum diisi]',
            'tanggal_nota' => $validated['tanggal_nota'] ?? now()->toDateString(),
            'perihal_nota' => $validated['perihal_nota'] ?? '[Draft belum lengkap]',
            'file_undangan' => $fileUndangan,
            'file_izin_setneg' => $fileIzinSetneg,
            'status' => $suratTugas?->status ?? 'DRAFT',
            'ppk_id' => $ppk?->id,
            'ppk_nama_snapshot' => $ppk?->nama,
            'ppk_nip_snapshot' => $ppk?->nip,
            'tingkat_biaya_kode' => $validated['tingkat_biaya_kode'] ?? 'C',
            'jenis_angkutan_nama' => $validated['jenis_angkutan_nama'] ?? 'Perjalanan Darat',
            'tempat_berangkat' => $validated['tempat_berangkat'] ?? 'Jakarta',
            'tempat_tujuan' => $validated['tempat_tujuan'] ?? null,
            'negara_tujuan' => $validated['negara_tujuan'] ?? null,
            'no_setneg' => $validated['no_setneg'] ?? null,
            'tanggal_berangkat' => $validated['tanggal_berangkat'] ?? null,
            'tanggal_kembali' => $validated['tanggal_kembali'] ?? null,
            'tanggal_surat' => $validated['tanggal_surat'] ?? null,
            'durasi_hari' => $validated['durasi_hari'] ?? 1,
            'draft_data' => $draftData,
            'draft_step' => $validated['draft_step'],
        ];

        $pegawaiIds = $validated['pegawai_ids']
            ?? $draftData['pegawai_ids']
            ?? [];

        try {
            DB::transaction(function () use ($values, $pegawaiIds, &$suratTugas) {
                if ($suratTugas) {
                    $suratTugas->update($values);
                } else {
                    $suratTugas = SuratTugas::create($values);
                }

                $suratTugas->pegawaiList()->delete();
                foreach ($pegawaiIds as $index => $pegawaiId) {
                    $pegawai = Pegawai::find($pegawaiId);
                    if (!$pegawai) continue;

                    SuratTugasPegawai::create([
                        'surat_tugas_id' => $suratTugas->id,
                        'pegawai_id'     => $pegawai->id,
                        'nama'           => $pegawai->nama,
                        'nip'            => $pegawai->nip ?? '',
                        'pangkat'        => $pegawai->pangkat ?? '',
                        'golongan'       => $pegawai->golongan ?? '',
                        'jabatan'        => $pegawai->jabatan ?? '',
                        'unit_kerja'     => $pegawai->unit_kerja ?: 'Pusdiklat Kemlu',
                        'urutan'         => $index + 1,
                    ]);
                }
            });
        } catch (\Throwable $e) {
            // Rollback file baru agar tidak yatim saat DB gagal.
            if ($newUndangan) Storage::disk('public')->delete($newUndangan);
            if ($newSetneg) Storage::disk('public')->delete($newSetneg);
            throw $e;
        }

        // Hapus file lama hanya setelah DB sukses diganti.
        if ($newUndangan && $oldUndangan && $newUndangan !== $oldUndangan) {
            Storage::disk('public')->delete($oldUndangan);
        }
        if ($newSetneg && $oldSetneg && $newSetneg !== $oldSetneg) {
            Storage::disk('public')->delete($oldSetneg);
        }

        return redirect()->route('surat-tugas.index')->with('success', 'Draft Surat Tugas berhasil disimpan. Anda dapat melanjutkannya kapan saja.');
    }

    private function authorizeDraft(SuratTugas $suratTugas): void
    {
        abort_unless(in_array($suratTugas->status, ['DRAFT', 'DISPOSISI_KAPUS_YA', 'DISPOSISI_KAPUS_REVISI'], true), 404);
        abort_unless(
            auth()->user()?->role === 'admin' || (
                in_array(auth()->user()?->role, ['pemohon', 'sespalu'], true)
                && $suratTugas->user_id === auth()->id()
            ),
            403,
            'Anda tidak memiliki akses ke draft ini.'
        );
    }

    private function catatLog(SuratTugas $suratTugas, string $aksi, ?string $dari, ?string $ke, ?string $catatan = null): void
    {
        try {
            SuratTugasLog::create([
                'surat_tugas_id' => $suratTugas->id,
                'user_id' => auth()->id(),
                'aksi' => $aksi,
                'dari_status' => $dari,
                'ke_status' => $ke,
                'catatan' => $catatan,
            ]);
        } catch (\Throwable $e) {
            // P1: log audit tidak boleh menggagalkan transaksi utama.
            report($e);
        }
    }

    private function submitNote(Request $request)
    {
        $draft = null;
        if ($request->filled('draft_id')) {
            $draft = SuratTugas::findOrFail($request->input('draft_id'));
            $this->authorizeDraft($draft);
        }

        $setnegFileRule = $draft?->file_izin_setneg
            ? 'nullable|file|mimes:pdf,docx|max:10240'
            : 'nullable|required_if:kategori_perjalanan,LUAR_NEGERI|file|mimes:pdf,docx|max:10240';

        $validated = $request->validate([
            'kategori_perjalanan' => 'required|in:DALAM_NEGERI,LUAR_NEGERI',
            'sumber_asal' => 'required|in:INTERNAL,EKSTERNAL',
            'nomor_nota' => 'required|string|max:255',
            'pengirim_nota' => 'required|string|max:255',
            'tanggal_nota' => 'required|date',
            'perihal_nota' => 'required|string',
            'file_undangan' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'file_izin_setneg' => $setnegFileRule,
        ]);

        $oldUndangan = $draft?->file_undangan;
        $oldSetneg = $draft?->file_izin_setneg;
        $fileUndangan = $oldUndangan;
        $fileSetneg = $oldSetneg;
        $newUndangan = null;
        $newSetneg = null;

        if ($request->hasFile('file_undangan')) {
            $newUndangan = $request->file('file_undangan')->store('undangan', 'public');
            $fileUndangan = $newUndangan;
        }

        if ($request->hasFile('file_izin_setneg')) {
            $newSetneg = $request->file('file_izin_setneg')->store('setneg', 'public');
            $fileSetneg = $newSetneg;
        }

        $draftData = $draft?->draft_data ?? [];
        unset($draftData['kapus']);
        if ($request->hasFile('file_undangan')) {
            $draftData['file_undangan_name'] = $request->file('file_undangan')->getClientOriginalName();
        }
        if ($request->hasFile('file_izin_setneg')) {
            $draftData['file_izin_setneg_name'] = $request->file('file_izin_setneg')->getClientOriginalName();
        }

        $values = [
            'user_id' => $draft?->user_id ?? auth()->id(),
            'kategori_perjalanan' => $validated['kategori_perjalanan'],
            'sumber_asal' => $validated['sumber_asal'],
            'nomor_nota' => $validated['nomor_nota'],
            'pengirim_nota' => $validated['pengirim_nota'],
            'tanggal_nota' => $validated['tanggal_nota'],
            'perihal_nota' => $validated['perihal_nota'],
            'file_undangan' => $fileUndangan,
            'file_izin_setneg' => $fileSetneg,
            'status' => 'MENUNGGU_DISPOSISI_KAPUS',
            'kapus_decision' => null,
            'catatan_kapus' => null,
            'draft_data' => $draftData ?: null,
            'draft_step' => null,
        ];

        try {
            DB::transaction(function () use ($draft, $values, &$suratTugas) {
                $suratTugas = $draft ?? new SuratTugas();
                $suratTugas->fill($values);
                $suratTugas->save();
            });
        } catch (\Throwable $e) {
            if ($newUndangan) Storage::disk('public')->delete($newUndangan);
            if ($newSetneg) Storage::disk('public')->delete($newSetneg);
            throw $e;
        }

        if ($newUndangan && $oldUndangan && $newUndangan !== $oldUndangan) {
            Storage::disk('public')->delete($oldUndangan);
        }
        if ($newSetneg && $oldSetneg && $newSetneg !== $oldSetneg) {
            Storage::disk('public')->delete($oldSetneg);
        }

        $this->catatLog($suratTugas, 'KIRIM_KE_KAPUS', $draft?->status ?? 'DRAFT', 'MENUNGGU_DISPOSISI_KAPUS', 'Nota dikirim ke Kapus');

        return redirect()->route('surat-tugas.show', $suratTugas->id)
            ->with('success', 'Nota/undangan berhasil dikirim ke Kapus untuk mendapat persetujuan.');
    }

    public function saveActorDraft(Request $request, SuratTugas $suratTugas)
    {
        $userRole = auth()->user()?->role;
        $actor = $request->input('actor', $userRole);
        $actorRoles = [
            'kapus' => ['kapus', 'admin'],
            'tu' => ['tu', 'admin'],
            'ppk' => ['ppk', 'admin'],
        ];
        $requiredStatuses = [
            'kapus' => 'MENUNGGU_DISPOSISI_KAPUS',
            'tu' => 'MENUNGGU_PENOMORAN_TU',
            'ppk' => 'SELESAI_TERBIT',
        ];

        abort_unless(isset($actorRoles[$actor]) && in_array($userRole, $actorRoles[$actor]), 403);
        abort_unless($suratTugas->status === $requiredStatuses[$actor], 409, 'Draft hanya dapat disimpan pada tahap yang sedang aktif.');

        $rules = match ($actor) {
            'kapus' => [
                'actor' => 'required|in:kapus',
                'kapus_decision' => 'nullable|in:YA,REVISI,STOP',
                'catatan_kapus' => 'nullable|string|max:5000',
            ],
            'tu' => [
                'actor' => 'required|in:tu',
                'nomor_st' => 'nullable|string|max:255',
                'nomor_spd' => 'nullable|string|max:255',
                'tanggal_surat' => 'nullable|date',
            ],
            'ppk' => [
                'actor' => 'required|in:ppk',
                'is_ppk_signed' => 'nullable|boolean',
                'catatan_ppk' => 'nullable|string|max:5000',
            ],
        };
        $validated = $request->validate($rules);
        unset($validated['actor']);

        $draftData = $suratTugas->draft_data ?? [];
        $draftData[$actor] = array_merge($draftData[$actor] ?? [], $validated, [
            'saved_at' => now()->toISOString(),
        ]);
        $suratTugas->update(['draft_data' => $draftData]);

        return redirect()->back()->with('success', 'Draft ' . strtoupper($actor) . ' berhasil disimpan. Status surat belum berubah.');
    }

    public function store(Request $request)
    {
        if (!in_array(auth()->user()?->role, ['pemohon', 'sespalu', 'admin'])) {
            return redirect()->back()->with('error', 'Hanya Sespalu/Pemohon atau Admin yang dapat mengirim usulan Surat Tugas.');
        }

        if (!$request->filled('draft_id') || (int) $request->input('draft_step', 1) === 1) {
            return $this->submitNote($request);
        }

        $draft = null;
        if ($request->filled('draft_id')) {
            $draft = SuratTugas::findOrFail($request->input('draft_id'));
            $this->authorizeDraft($draft);
        }

        $setnegFileRule = $draft?->file_izin_setneg
            ? 'nullable|file|mimes:pdf,docx|max:10240'
            : 'nullable|required_if:kategori_perjalanan,LUAR_NEGERI|file|mimes:pdf,docx|max:10240';

        $validated = $request->validate([
            'kategori_perjalanan' => 'required|in:DALAM_NEGERI,LUAR_NEGERI',
            'sumber_asal' => 'required|in:INTERNAL,EKSTERNAL',
            'nomor_nota' => 'required|string|max:255',
            'pengirim_nota' => 'required|string|max:255',
            'tanggal_nota' => 'required|date',
            'perihal_nota' => 'required|string',
            'file_undangan' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'file_izin_setneg' => $setnegFileRule,
            
            // PPK & Travel details
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
            
            // Officers array
            'pegawai_ids' => 'required|array|min:1',
            'pegawai_ids.*' => 'exists:pegawai,id',
        ]);

        $ppk = Ppk::findOrFail($validated['ppk_id']);

        $oldUndangan = $draft?->file_undangan;
        $oldSetneg = $draft?->file_izin_setneg;
        $filePathUndangan = $oldUndangan;
        $filePathSetneg = $oldSetneg;
        $newUndangan = null;
        $newSetneg = null;

        if ($request->hasFile('file_undangan')) {
            $newUndangan = $request->file('file_undangan')->store('undangan', 'public');
            $filePathUndangan = $newUndangan;
        }

        if ($request->hasFile('file_izin_setneg')) {
            $newSetneg = $request->file('file_izin_setneg')->store('setneg', 'public');
            $filePathSetneg = $newSetneg;
        }

        $suratValues = [
            'user_id' => $draft?->user_id ?? auth()->id(),
            'kategori_perjalanan' => $validated['kategori_perjalanan'],
            'sumber_asal' => $validated['sumber_asal'],
            'nomor_nota' => $validated['nomor_nota'],
            'pengirim_nota' => $validated['pengirim_nota'],
            'tanggal_nota' => $validated['tanggal_nota'],
            'perihal_nota' => $validated['perihal_nota'],
            'file_undangan' => $filePathUndangan,
            'file_izin_setneg' => $filePathSetneg,
            'status' => $draft?->kapus_decision === 'YA' ? 'MENUNGGU_PENOMORAN_TU' : 'MENUNGGU_DISPOSISI_KAPUS',
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
            'tanggal_surat' => $validated['tanggal_surat'],
            'durasi_hari' => $validated['durasi_hari'],
            'draft_data' => null,
            'draft_step' => null,
        ];

        $pegawaiIds = $validated['pegawai_ids'];

        $suratTugas = null;
        try {
            DB::transaction(function () use ($draft, $suratValues, $pegawaiIds, &$suratTugas) {
                $suratTugas = $draft ?? new SuratTugas();
                $suratTugas->fill($suratValues);
                $suratTugas->save();

                if ($draft) {
                    $suratTugas->pegawaiList()->delete();
                }

                // Save officer snapshots
                foreach ($pegawaiIds as $index => $pegawaiId) {
                    $pegawai = Pegawai::find($pegawaiId);
                    if (!$pegawai) continue;
                    SuratTugasPegawai::create([
                        'surat_tugas_id' => $suratTugas->id,
                        'pegawai_id'     => $pegawai->id,
                        'nama'           => $pegawai->nama,
                        'nip'            => $pegawai->nip ?? '',
                        'pangkat'        => $pegawai->pangkat ?? '',
                        'golongan'       => $pegawai->golongan ?? '',
                        'jabatan'        => $pegawai->jabatan ?? '',
                        'unit_kerja'     => $pegawai->unit_kerja ?: 'Pusdiklat Kemlu',
                        'urutan'         => $index + 1,
                    ]);
                }
            });
        } catch (\Throwable $e) {
            if ($newUndangan) Storage::disk('public')->delete($newUndangan);
            if ($newSetneg) Storage::disk('public')->delete($newSetneg);
            throw $e;
        }

        if ($newUndangan && $oldUndangan && $newUndangan !== $oldUndangan) {
            Storage::disk('public')->delete($oldUndangan);
        }
        if ($newSetneg && $oldSetneg && $newSetneg !== $oldSetneg) {
            Storage::disk('public')->delete($oldSetneg);
        }

        $message = $suratTugas->status === 'MENUNGGU_PENOMORAN_TU'
            ? 'Draft Surat Tugas & SPD berhasil dikirim ke TU untuk verifikasi dan penomoran.'
            : 'Nota/undangan berhasil dikirim ke Kapus dan sedang menunggu persetujuan.';

        $this->catatLog($suratTugas, $suratTugas->status === 'MENUNGGU_PENOMORAN_TU' ? 'KIRIM_KE_TU' : 'KIRIM_KE_KAPUS', $draft?->status ?? 'DRAFT', $suratTugas->status, $message);

        return redirect()->route('surat-tugas.show', $suratTugas->id)->with('success', $message);
    }

    public function show(SuratTugas $suratTugas)
    {
        // P0-3: pemilik boleh lihat miliknya; kapus/tu/ppk/admin boleh lihat semua tahapan kerja.
        if (in_array(auth()->user()?->role, ['pemohon', 'sespalu'], true)) {
            abort_unless($suratTugas->user_id === auth()->id(), 403, 'Anda tidak memiliki akses ke surat ini.');
        }
        $suratTugas->load(['pegawaiList', 'ppk', 'user', 'logs.user']);

        return Inertia::render('SuratTugas/Show', [
            'suratTugas' => $suratTugas,
            'userRole' => auth()->user()?->role ?? 'pemohon',
            'authUserId' => auth()->id(),
            'logs' => $suratTugas->logs,
            'attachments' => [
                'invitation' => $suratTugas->file_undangan ? [
                    'name' => basename($suratTugas->file_undangan),
                    'url' => Storage::disk('public')->url($suratTugas->file_undangan),
                ] : null,
                'setneg' => $suratTugas->file_izin_setneg ? [
                    'name' => basename($suratTugas->file_izin_setneg),
                    'url' => Storage::disk('public')->url($suratTugas->file_izin_setneg),
                ] : null,
            ],
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
            $status = 'DISPOSISI_KAPUS_YA';
        } elseif ($validated['kapus_decision'] === 'REVISI') {
            $status = 'DISPOSISI_KAPUS_REVISI';
        } elseif ($validated['kapus_decision'] === 'STOP') {
            $status = 'DISPOSISI_KAPUS_STOP';
        }

        $draftData = $suratTugas->draft_data ?? [];
        unset($draftData['kapus']);

        $dari = $suratTugas->status;
        $suratTugas->update([
            'kapus_decision' => $validated['kapus_decision'],
            'catatan_kapus' => $validated['catatan_kapus'],
            'status' => $status,
            'draft_data' => $draftData ?: null,
        ]);
        $this->catatLog($suratTugas->fresh(), 'DISPOSISI_'.$validated['kapus_decision'], $dari, $status, $validated['catatan_kapus'] ?? null);

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
            'nomor_st' => 'required|string|max:255|unique:surat_tugas,nomor_st,' . $suratTugas->id,
            'nomor_spd' => 'required|string|max:255|unique:surat_tugas,nomor_spd,' . $suratTugas->id,
            'tanggal_surat' => 'required|date',
        ]);

        $draftData = $suratTugas->draft_data ?? [];
        unset($draftData['tu']);

        try {
            // P1: lock baris agar dua TU tidak bisa rebut nomor yang sama.
            $dari = $suratTugas->status;
            DB::transaction(function () use ($suratTugas, $validated, $draftData) {
                SuratTugas::whereKey($suratTugas->id)->lockForUpdate()->firstOrFail();
                $suratTugas->update([
                    'nomor_st' => $validated['nomor_st'],
                    'nomor_spd' => $validated['nomor_spd'],
                    'tanggal_surat' => $validated['tanggal_surat'],
                    'status' => 'SELESAI_TERBIT',
                    'draft_data' => $draftData ?: null,
                ]);
            });
            $this->catatLog($suratTugas->fresh(), 'PENOMORAN', $dari, 'SELESAI_TERBIT', 'ST: '.$validated['nomor_st'].' | SPD: '.$validated['nomor_spd']);
        } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
            return redirect()->back()->with('error', 'Nomor ST/SPD sudah dipakai surat lain. Gunakan nomor berbeda.');
        }

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
        $draftData = $suratTugas->draft_data ?? [];
        unset($draftData['ppk']);

        $suratTugas->update([
            'is_ppk_signed' => $isSigned,
            'signed_at' => $isSigned ? now() : null,
            'draft_data' => $draftData ?: null,
        ]);
        $this->catatLog($suratTugas->fresh(), $isSigned ? 'TTD_PPK' : 'BATAL_TTD_PPK', 'SELESAI_TERBIT', 'SELESAI_TERBIT', $isSigned ? 'PPK menandatangani SPD' : 'TTD PPK dibatalkan');

        $msg = $isSigned ? 'Tanda tangan digital PPK telah resmi disematkan pada Lembar SPD.' : 'Tanda tangan digital PPK dibatalkan.';
        return redirect()->back()->with('success', $msg);
    }

    // Print Document View Generator — P1: akses luas (TU/admin/kapus/ppk + pemilik), status minimal disetujui Kapus.
    public function cetak(SuratTugas $suratTugas)
    {
        $role = auth()->user()?->role;
        $isOwner = $suratTugas->user_id === auth()->id();
        $allowedRole = in_array($role, ['tu', 'admin', 'kapus', 'ppk'], true) || $isOwner;
        $allowedStatus = in_array($suratTugas->status, ['MENUNGGU_PENOMORAN_TU', 'SELESAI_TERBIT'], true);
        if (!$allowedRole || !$allowedStatus) {
            return redirect()->route('surat-tugas.show', $suratTugas->id)->with('error', 'Pratinjau dokumen hanya tersedia setelah draft disetujui Kapus (untuk TU/Kapus/PPK/pemilik).');
        }

        $suratTugas->load(['pegawaiList', 'ppk', 'user']);
        $this->catatLog($suratTugas, 'CETAK', $suratTugas->status, $suratTugas->status, 'Dokumen dicetak oleh '.$role);

        return Inertia::render('SuratTugas/Print', [
            'suratTugas' => $suratTugas,
        ]);
    }

    public function destroy(SuratTugas $suratTugas)
    {
        abort_unless(auth()->user()?->role === 'admin', 403, 'Hanya Admin yang dapat menghapus histori Surat Tugas.');

        // P1: soft-delete recoverable — jangan hapus file/snapshot permanen di sini.
        // File fisik hanya dihapus saat forceDelete (via tinker/console), bukan dari UI.
        $this->catatLog($suratTugas, 'HAPUS', $suratTugas->status, null, 'Soft-delete oleh admin');
        $suratTugas->delete();

        return redirect()->route('surat-tugas.index')->with('success', 'Surat Tugas dipindahkan ke arsip (soft-delete). Dapat dipulihkan bila diperlukan.');
    }
}
