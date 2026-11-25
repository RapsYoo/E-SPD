<?php

namespace App\Http\Controllers;

use App\Models\Pegawai;
use App\Models\PetaJabatanAssignment;
use App\Models\PetaJabatanPosition;
use App\Models\User;
use App\Services\Admin\RbacService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PetaJabatanController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $rbac = app(RbacService::class);
        $canManage = $user instanceof User && $rbac->hasPermission($user, 'peta_jabatan.manage');
        $canView = $canManage || ($user instanceof User && $rbac->hasPermission($user, 'peta_jabatan.view'));

        abort_unless($canView, 403);

        $positions = PetaJabatanPosition::query()
            ->with(['assignments.pegawai.upt'])
            ->orderBy('section')
            ->orderBy('urutan')
            ->orderBy('id')
            ->get()
            ->map(function (PetaJabatanPosition $pos) {
                $bezetting = $pos->assignments->count();

                return [
                    'id' => $pos->id,
                    'kode' => $pos->kode,
                    'section' => $pos->section,
                    'tipe' => $pos->tipe,
                    'nama_jabatan' => $pos->nama_jabatan,
                    'kelas' => $pos->kelas,
                    'kebutuhan' => $pos->kebutuhan,
                    'bezetting' => $bezetting,
                    'selisih' => $bezetting - $pos->kebutuhan,
                    'urutan' => $pos->urutan,
                    'assignments' => $pos->assignments->map(fn (PetaJabatanAssignment $a) => [
                        'id' => $a->id,
                        'pegawai_id' => $a->pegawai_id,
                        'catatan' => $a->catatan,
                        'pegawai' => $a->pegawai ? [
                            'id' => $a->pegawai->id,
                            'nama' => $a->pegawai->nama,
                            'nip' => $a->pegawai->nip,
                            'pangkat' => $a->pegawai->pangkat,
                            'golongan' => $a->pegawai->golongan,
                            'jabatan' => $a->pegawai->jabatan,
                            'upt_bidang' => $a->pegawai->upt?->nama ?: $a->pegawai->upt_bidang,
                            'foto_url' => $a->pegawai->foto_url,
                            'status_kepegawaian' => $a->pegawai->status_kepegawaian,
                            'is_active' => $a->pegawai->is_active,
                        ] : null,
                    ])->values(),
                ];
            })
            ->values();

        $pegawaiOptions = $canManage
            ? Pegawai::query()
                ->with('upt:id,nama')
                ->where('is_active', true)
                ->orderBy('nama')
                ->get()
                ->map(fn (Pegawai $p) => [
                    'id' => $p->id,
                    'nama' => $p->nama,
                    'nip' => $p->nip ?: '-',
                    'jabatan' => $p->jabatan ?: '-',
                    'pangkat' => $p->pangkat ?: '-',
                    'golongan' => $p->golongan ?: '-',
                    'upt_bidang' => $p->upt?->nama ?: ($p->upt_bidang ?: '-'),
                    'foto_url' => $p->foto_url,
                ])
                ->values()
            : [];

        $totalKebutuhan = $positions->sum('kebutuhan');
        $totalBezetting = $positions->sum('bezetting');

        return Inertia::render('PetaJabatan/Index', [
            'positions' => $positions,
            'pegawaiOptions' => $pegawaiOptions,
            'canManage' => $canManage,
            'summary' => [
                'total_jabatan' => $positions->count(),
                'total_kebutuhan' => $totalKebutuhan,
                'total_bezetting' => $totalBezetting,
                'selisih' => $totalBezetting - $totalKebutuhan,
            ],
        ]);
    }

    public function assign(Request $request, PetaJabatanPosition $position): RedirectResponse
    {
        $user = $request->user();
        abort_unless(
            $user instanceof User && app(RbacService::class)->hasPermission($user, 'peta_jabatan.manage'),
            403
        );

        $validated = $request->validate([
            'pegawai_id' => ['required', 'exists:pegawai,id'],
            'catatan' => ['nullable', 'string', 'max:120'],
        ]);

        // Untuk jabatan struktural/pimpinan tunggal (kebutuhan 1), ganti pejabat sebelumnya jika sudah ada.
        if (in_array($position->tipe, ['pimpinan', 'struktural'], true) && $position->kebutuhan === 1) {
            $position->assignments()->delete();
        }

        PetaJabatanAssignment::updateOrCreate(
            [
                'position_id' => $position->id,
                'pegawai_id' => $validated['pegawai_id'],
            ],
            [
                'catatan' => ! empty($validated['catatan']) ? trim($validated['catatan']) : null,
                'urutan' => $position->assignments()->count() + 1,
            ]
        );

        return redirect()->back()->with('success', "Penempatan pegawai pada jabatan {$position->nama_jabatan} berhasil disimpan.");
    }

    public function unassign(Request $request, PetaJabatanAssignment $assignment): RedirectResponse
    {
        $user = $request->user();
        abort_unless(
            $user instanceof User && app(RbacService::class)->hasPermission($user, 'peta_jabatan.manage'),
            403
        );

        $assignment->delete();

        return redirect()->back()->with('success', 'Penempatan pegawai berhasil dihapus dari posisi jabatan.');
    }

    public function updatePosition(Request $request, PetaJabatanPosition $position): RedirectResponse
    {
        $user = $request->user();
        abort_unless(
            $user instanceof User && app(RbacService::class)->hasPermission($user, 'peta_jabatan.manage'),
            403
        );

        $validated = $request->validate([
            'kebutuhan' => ['required', 'integer', 'min:0', 'max:99'],
            'kelas' => ['nullable', 'integer', 'min:1', 'max:17'],
        ]);

        $position->update($validated);

        return redirect()->back()->with('success', "Kebutuhan jabatan {$position->nama_jabatan} berhasil diperbarui.");
    }
}
