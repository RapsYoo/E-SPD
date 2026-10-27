<?php

namespace App\Http\Controllers;

use App\Http\Requests\SuratTugas\ActorDraftRequest;
use App\Http\Requests\SuratTugas\DisposisiRequest;
use App\Http\Requests\SuratTugas\PenomoranRequest;
use App\Http\Requests\SuratTugas\SaveDraftRequest;
use App\Http\Requests\SuratTugas\StoreSuratTugasRequest;
use App\Models\SuratTugas;
use App\Services\SuratTugas\AttachmentService;
use App\Services\SuratTugas\DraftService;
use App\Services\SuratTugas\QueryService;
use App\Services\SuratTugas\SubmissionService;
use App\Services\SuratTugas\WorkflowService;
use App\Support\SuratTugasStatus;
use Illuminate\Http\Request;
use Inertia\Inertia;

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
        if (! in_array(auth()->user()?->role, SuratTugasStatus::PROPOSER_ROLES)) {
            return redirect()->route('surat-tugas.index')->with('error', 'Hanya Sespalu/Pemohon atau Admin yang dapat membuat usulan Surat Tugas.');
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

            return redirect()->route('surat-tugas.show', $suratTugas->id)
                ->with('success', 'Nota/undangan berhasil dikirim ke Kapus untuk mendapat persetujuan.');
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
        $isPegawai = $user?->role === SuratTugasStatus::PEGAWAI_ROLE;
        $suratTugas->load($isPegawai
            ? ['pegawaiList', 'ppk.pegawai']
            : ['pegawaiList', 'ppk.pegawai', 'user', 'logs.user']);

        return Inertia::render('SuratTugas/Show', [
            'suratTugas' => $suratTugas,
            'userRole' => $user?->role ?? 'pemohon',
            'authUserId' => $user?->id,
            'logs' => $isPegawai ? [] : $suratTugas->logs,
            'attachments' => $isPegawai ? [] : $this->attachments->payload($suratTugas),
            'runningNumber' => in_array($user?->role, ['tu', 'admin'], true)
                ? $this->queries->lastNumbered()
                : null,
        ]);
    }

    // Step 2: Disposisi Kapus (Only Kapus or Admin)
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

    // Print Document View Generator — P1: akses luas (TU/admin/kapus/ppk + pemilik), status minimal disetujui Kapus.
    public function cetak(SuratTugas $suratTugas)
    {
        $user = auth()->user();

        if (! $this->workflow->canPrint($suratTugas, $user)) {
            return redirect()->route('surat-tugas.show', $suratTugas->id)
                ->with('error', 'Pratinjau dokumen hanya tersedia setelah draft disetujui Kapus (untuk TU/Kapus/PPK/pemilik).');
        }

        $suratTugas->load(['pegawaiList', 'ppk.pegawai', 'user']);
        $this->workflow->logPrint($suratTugas, $user);

        $live = $this->workflow->kapusAktif();

        return Inertia::render('SuratTugas/Print', [
            'suratTugas' => $suratTugas,
            // Surat terbit memakai snapshot saat penomoran; pratinjau sebelum terbit memakai Kapus aktif.
            'kapus' => [
                'nama' => $suratTugas->kapus_nama_snapshot ?: $live['nama'],
                'nip' => $suratTugas->kapus_nip_snapshot ?: $live['nip'],
            ],
        ]);
    }

    public function destroy(SuratTugas $suratTugas)
    {
        $this->workflow->archive($suratTugas, auth()->user());

        return redirect()->route('surat-tugas.index')->with('success', 'Surat Tugas dipindahkan ke arsip (soft-delete). Dapat dipulihkan bila diperlukan.');
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
