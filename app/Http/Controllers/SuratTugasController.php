<?php

namespace App\Http\Controllers;

use App\Exceptions\WorkflowException;
use App\Http\Requests\SuratTugas\ActorDraftRequest;
use App\Http\Requests\SuratTugas\DisposisiRequest;
use App\Http\Requests\SuratTugas\PenomoranRequest;
use App\Http\Requests\SuratTugas\SaveDraftRequest;
use App\Http\Requests\SuratTugas\StoreSuratTugasRequest;
use App\Models\SuratTugas;
use App\Services\Admin\RbacService;
use App\Services\SuratTugas\AttachmentService;
use App\Services\SuratTugas\DraftService;
use App\Services\SuratTugas\QueryService;
use App\Services\SuratTugas\SubmissionService;
use App\Services\SuratTugas\WorkflowService;
use App\Support\SuratTugasStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Controller tipis: validasi di FormRequest, logika bisnis di App\Services\SuratTugas\*.
 */
class SuratTugasController extends Controller
{
    public function __construct(
        private QueryService $queries,
        private DraftService $drafts,
        private SubmissionService $submissions,
        private WorkflowService $workflow,
        private AttachmentService $attachments,
    ) {}

    public function index(Request $request)
    {
        return Inertia::render('SuratTugas/Index', [
            'suratTugas' => $this->queries->paginate($request->only(['search', 'status']), auth()->user()),
            'filters' => $request->only(['search', 'status']),
            'userRole' => auth()->user()?->role ?? 'pemohon',
            'authUserId' => auth()->id(),
        ]);
    }

    public function create()
    {
        if (! app(RbacService::class)->hasPermission(auth()->user(), 'surat_tugas.create')) {
            return redirect()->route('surat-tugas.index')->with('error', 'Hanya Sesparlu/Pemohon atau Admin yang dapat membuat usulan Surat Tugas.');
        }

        return Inertia::render('SuratTugas/Create', $this->drafts->formOptions() + [
            'userRole' => auth()->user()?->role ?? 'pemohon',
        ]);
    }

    public function storeDraft(SaveDraftRequest $request)
    {
        return $this->saveDraft($request);
    }

    public function editDraft(SuratTugas $suratTugas)
    {
        $this->workflow->assertDraftAccessible($suratTugas, auth()->user());

        return Inertia::render('SuratTugas/Create', $this->drafts->formOptions() + [
            'userRole' => auth()->user()?->role ?? 'pemohon',
        ] + $this->drafts->editPayload($suratTugas));
    }

    public function updateDraft(SaveDraftRequest $request, SuratTugas $suratTugas)
    {
        return $this->saveDraft($request, $suratTugas);
    }

    public function saveActorDraft(ActorDraftRequest $request, SuratTugas $suratTugas)
    {
        $actor = $request->actor();
        $validated = $request->validated();
        unset($validated['actor']);

        $this->workflow->saveActorDraft($suratTugas, $actor, $validated);

        return redirect()->back()->with('success', 'Draft '.strtoupper($actor).' berhasil disimpan. Status surat belum berubah.');
    }

    public function store(StoreSuratTugasRequest $request)
    {
        $user = $request->user();
        $validated = $request->validated();
        $undangan = $request->file('file_undangan');
        $setneg = $request->file('file_izin_setneg');

        if ($request->isNoteStep()) {
            $suratTugas = $this->submissions->submitNote($validated, $undangan, $setneg, $user, $request->draft());

            return redirect()->route('surat-tugas.draft.edit', $suratTugas->id)
                ->with('success', 'Nota/undangan disimpan sebagai draft. Lengkapi Surat Tugas & SPD sebelum dikirim ke Kapus.');
        }

        $suratTugas = $this->submissions->submitFull($validated, $undangan, $setneg, $user, $request->draft());

        return redirect()->route('surat-tugas.show', $suratTugas->id)
            ->with('success', $this->submissions->messageFor($suratTugas));
    }

    public function show(SuratTugas $suratTugas)
    {
        // Akses detail terbuka untuk aktor internal; role pegawai hanya untuk perjalanannya sendiri.
        $user = auth()->user();
        abort_unless($this->workflow->canView($suratTugas, $user), 403, 'Anda tidak memiliki akses ke surat ini.');
        $this->workflow->ensureSnapshotsLocked($suratTugas);
        $isPegawai = $user?->role === SuratTugasStatus::PEGAWAI_ROLE;
        $suratTugas->load($isPegawai
            ? ['pegawaiList', 'ppk.pegawai', 'bendahara.pegawai', 'pembiayaanApprover.pegawai']
            : ['pegawaiList', 'ppk.pegawai', 'bendahara.pegawai', 'pembiayaanApprover.pegawai', 'user', 'logs.user']);

        $bendaharaUser = $suratTugas->bendahara ?? $suratTugas->pembiayaanApprover;

        return Inertia::render('SuratTugas/Show', [
            'suratTugas' => $suratTugas,
            'userRole' => $user?->role ?? 'pemohon',
            'authUserId' => $user?->id,
            'logs' => $isPegawai ? [] : $suratTugas->logs,
            'attachments' => $isPegawai ? [] : $this->attachments->payload($suratTugas),
            'runningNumber' => app(RbacService::class)->hasPermission($user, 'surat_tugas.penomoran')
                ? $this->queries->lastNumbered()
                : null,
            'kapus' => [
                'nama' => $suratTugas->kapus_nama_snapshot,
                'nip' => $suratTugas->kapus_nip_snapshot,
            ],
            'ppk' => [
                'nama' => $suratTugas->ppk_nama_snapshot ?: ($suratTugas->ppk?->pegawai?->nama ?? $suratTugas->ppk?->name),
                'nip' => $suratTugas->ppk_nip_snapshot ?: $suratTugas->ppk?->pegawai?->nip,
            ],
            'bendahara' => [
                'nama' => $suratTugas->bendahara_nama_snapshot ?: ($bendaharaUser?->pegawai?->nama ?? $bendaharaUser?->name),
                'nip' => $suratTugas->bendahara_nip_snapshot ?: $bendaharaUser?->pegawai?->nip,
            ],
        ]);
    }

    // Step 3: Disposisi Kapus (Only Kapus or Admin)
    public function disposisi(DisposisiRequest $request, SuratTugas $suratTugas)
    {
        $this->workflow->disposisi($suratTugas, $request->user(), $request->validated());

        return redirect()->back()->with('success', 'Disposisi Kepala Pusat (Kapus) berhasil disimpan!');
    }

    // Step 4: Penomoran Resmi TU (Only TU or Admin)
    public function penomoran(PenomoranRequest $request, SuratTugas $suratTugas)
    {
        $this->workflow->penomoran($suratTugas, $request->user(), $request->validated());

        return redirect()->back()->with('success', 'Penomoran resmi Surat Tugas & SPD berhasil diterbitkan oleh Tata Usaha!');
    }

    // Step 5: Signature PPK (Only PPK or Admin)
    public function signPpk(Request $request, SuratTugas $suratTugas)
    {
        $isSigned = $request->boolean('is_ppk_signed', true);

        $this->workflow->signPpk($suratTugas, $request->user(), $isSigned);

        return redirect()->back()->with(
            'success',
            $isSigned ? 'Tanda tangan digital PPK telah resmi disematkan pada Lembar SPD.' : 'Tanda tangan digital PPK dibatalkan.'
        );
    }

    // Usulan dihentikan Kapus -> buka kembali sebagai draft (pengusul/admin).
    public function ajukanUlang(Request $request, SuratTugas $suratTugas)
    {
        $this->workflow->ajukanUlang($suratTugas, $request->user());

        return redirect()->route('surat-tugas.draft.edit', $suratTugas->id)
            ->with('success', 'Usulan dibuka kembali sebagai draft. Perbaiki sesuai catatan Kapus lalu kirim ulang.');
    }

    /**
     * Sesparlu/Admin menarik kembali surat yang sudah disetujui Kapus (MENUNGGU_PENOMORAN_TU)
     * sebelum TU memberikan nomor resmi, untuk direvisi dan diajukan ulang.
     */
    public function tarikKembali(Request $request, SuratTugas $suratTugas)
    {
        $validated = $request->validate([
            'alasan' => ['required', 'string', 'max:500'],
        ]);

        try {
            $this->workflow->tarikKembali($suratTugas, $request->user(), $validated['alasan']);
        } catch (WorkflowException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }

        return redirect()->route('surat-tugas.draft.edit', $suratTugas->id)
            ->with('success', 'Surat berhasil ditarik kembali ke Draft untuk direvisi. Ajukan ulang setelah diperbaiki.');
    }

    /**
     * TU/pihak berwenang menarik nomor surat ST & SPD yang sudah terbit agar surat kembali ke Draft
     * dan Sesparlu/pengusul dapat merevisi seluruh persuratan termasuk RPD & Daftar Nominatif.
     */
    public function tarikNomor(Request $request, SuratTugas $suratTugas)
    {
        $validated = $request->validate([
            'alasan' => ['required', 'string', 'max:500'],
        ]);

        try {
            $this->workflow->tarikNomor($suratTugas, $request->user(), $validated['alasan']);
        } catch (WorkflowException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }

        return redirect()->route('surat-tugas.show', $suratTugas->id)
            ->with('success', 'Nomor surat ST & SPD berhasil ditarik. Surat dikembalikan ke Draft agar Sesparlu/pengusul dapat merevisi seluruh dokumen termasuk RPD & Daftar Nominatif.');
    }

    // Print Document View Generator — P1: akses luas (TU/admin/kapus/ppk + pemilik), status minimal disetujui Kapus.
    public function cetak(SuratTugas $suratTugas)
    {
        $user = auth()->user();

        if (! $this->workflow->canPrint($suratTugas, $user)) {
            return redirect()->route('surat-tugas.show', $suratTugas->id)
                ->with('error', 'Pratinjau dokumen hanya tersedia setelah draft disetujui Kapus (untuk TU/Kapus/PPK/pemilik).');
        }

        $this->workflow->ensureSnapshotsLocked($suratTugas);
        $suratTugas->load(['pegawaiList', 'user', 'bendahara.pegawai', 'pembiayaanApprover.pegawai']);
        $this->workflow->logPrint($suratTugas, $user);

        $bendaharaUser = $suratTugas->bendahara ?? $suratTugas->pembiayaanApprover;

        return Inertia::render('SuratTugas/Print', [
            'suratTugas' => $suratTugas,
            // Surat yang siap cetak / selesai terbit selalu menggunakan snapshot arsip yang terkunci di DB.
            'kapus' => [
                'nama' => $suratTugas->kapus_nama_snapshot,
                'nip' => $suratTugas->kapus_nip_snapshot,
            ],
            'ppk' => [
                'nama' => $suratTugas->ppk_nama_snapshot,
                'nip' => $suratTugas->ppk_nip_snapshot,
            ],
            'bendahara' => [
                'nama' => $suratTugas->bendahara_nama_snapshot ?: ($bendaharaUser?->pegawai?->nama ?? $bendaharaUser?->name),
                'nip' => $suratTugas->bendahara_nip_snapshot ?: $bendaharaUser?->pegawai?->nip,
            ],
        ]);
    }

    public function destroy(SuratTugas $suratTugas)
    {
        $this->workflow->archive($suratTugas, auth()->user());

        return redirect()->route('surat-tugas.index')->with('success', 'Surat Tugas dipindahkan ke arsip (soft-delete). Dapat dipulihkan bila diperlukan.');
    }

    /**
     * Stream berkas lampiran Nota/Undangan atau Izin Setneg secara inline (tanpa perlu symlink public/storage).
     */
    public function lampiran(Request $request, SuratTugas $suratTugas, string $type): StreamedResponse
    {
        abort_unless($this->workflow->canView($suratTugas, $request->user()), 403, 'Anda tidak memiliki akses ke lampiran surat ini.');

        $path = $type === 'setneg' ? $suratTugas->file_izin_setneg : $suratTugas->file_undangan;
        abort_unless(is_string($path) && $path !== '' && Storage::disk('public')->exists($path), 404, 'Berkas lampiran tidak ditemukan.');

        $nameKey = $type === 'setneg' ? 'file_izin_setneg_name' : 'file_undangan_name';
        $filename = $suratTugas->draft_data[$nameKey] ?? basename($path);
        $disposition = $request->boolean('download') ? 'attachment' : 'inline';

        return Storage::disk('public')->response($path, $filename, [
            'Content-Disposition' => $disposition.'; filename="'.addslashes($filename).'"',
        ]);
    }

    private function saveDraft(SaveDraftRequest $request, ?SuratTugas $suratTugas = null)
    {
        $this->drafts->save(
            $request->validated(),
            $request->file('file_undangan'),
            $request->file('file_izin_setneg'),
            $request->user(),
            $suratTugas,
        );

        return redirect()->route('surat-tugas.index')->with('success', 'Draft Surat Tugas berhasil disimpan. Anda dapat melanjutkannya kapan saja.');
    }
}
