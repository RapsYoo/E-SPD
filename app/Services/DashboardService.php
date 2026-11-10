<?php

namespace App\Services;

use App\Models\JenisAngkutan;
use App\Models\Pegawai;
use App\Models\SuratTugas;
use App\Models\SuratTugasLog;
use App\Models\SuratTugasPegawai;
use App\Models\TingkatBiaya;
use App\Models\UptBidang;
use App\Models\User;
use App\Support\SuratTugasStatus as S;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Data ringkasan untuk dashboard (semua aktor & admin).
 */
class DashboardService
{
    /** Statistik menyeluruh organisasi (terbuka untuk semua aktor). */
    public function overview(User $user): array
    {
        $today = now()->toDateString();
        $upcomingLimit = now()->addDays(7)->toDateString();
        $urgentLimit = now()->addDays(3)->toDateString();

        $globalTotal = SuratTugas::count();
        $globalStatusStats = $this->countBy('status');
        $globalKategoriStats = $this->countBy('kategori_perjalanan');

        $personalTotal = SuratTugas::where('user_id', $user->id)->count();
        $personalStatusStats = $this->countBy('status', $user->id);
        $personalKategoriStats = $this->countBy('kategori_perjalanan', $user->id);

        return [
            // Backward-compatible direct stats
            'totalSurat' => $globalTotal,
            'statusStats' => $globalStatusStats,
            'kategoriStats' => $globalKategoriStats,

            // Dual scope stats for Persona Toggle
            'scopeStats' => [
                'global' => [
                    'totalSurat' => $globalTotal,
                    'statusStats' => $globalStatusStats,
                    'kategoriStats' => $globalKategoriStats,
                ],
                'personal' => [
                    'totalSurat' => $personalTotal,
                    'statusStats' => $personalStatusStats,
                    'kategoriStats' => $personalKategoriStats,
                ],
            ],

            'recentSurat' => SuratTugas::query()
                ->with(['pegawaiList', 'user'])
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get(),
            'needsAction' => $this->needsAction($user),
            'pendingDprs' => $this->pendingDprs($user),
            'onDutyToday' => $this->onDutyToday($today),
            'upcomingTrips' => $this->upcomingTrips($today, $upcomingLimit),
            'urgentPending' => $this->urgentPending($user, $urgentLimit),
            'recentActivities' => $this->recentActivities(),
        ];
    }

    /**
     * Dashboard role pegawai: perjalanan dinas milik sendiri (surat terbit) dikelompokkan berdasarkan waktu.
     *
     * @return array{trips: Collection, summary: array<string, int>, hasPegawaiLink: bool}
     */
    public function pegawaiOverview(User $user): array
    {
        $today = now()->toDateString();

        $trips = SuratTugas::query()
            ->diikutiPegawai($user->pegawai_id)
            ->whereIn('status', S::PEGAWAI_VISIBLE)
            ->with('pegawaiList.tickets')
            ->orderByDesc('tanggal_berangkat')
            ->get()
            ->map(function (SuratTugas $surat) use ($today, $user) {
                $berangkat = $surat->tanggal_berangkat?->toDateString();
                $kembali = $surat->tanggal_kembali?->toDateString() ?? $berangkat;

                $phase = match (true) {
                    $berangkat === null => 'belum_dijadwalkan',
                    $berangkat > $today => 'akan_datang',
                    $kembali < $today => 'selesai',
                    default => 'berlangsung',
                };
                $peserta = $surat->pegawaiList->firstWhere('pegawai_id', $user->pegawai_id);

                return [
                    'id' => $surat->id,
                    'nomor_st' => $surat->nomor_st,
                    'nomor_spd' => $surat->nomor_spd,
                    'perihal_nota' => $surat->perihal_nota,
                    'kategori_perjalanan' => $surat->kategori_perjalanan,
                    'tempat_berangkat' => $surat->tempat_berangkat,
                    'tempat_tujuan' => $surat->tempat_tujuan,
                    'negara_tujuan' => $surat->negara_tujuan,
                    'tanggal_berangkat' => $berangkat,
                    'tanggal_kembali' => $surat->tanggal_kembali?->toDateString(),
                    'durasi_hari' => $surat->durasi_hari,
                    'phase' => $phase,
                    'is_completed' => $surat->tanggal_kembali?->lt(today()) === true,
                    'dpr_status' => $peserta?->dpr_status ?? SuratTugasPegawai::DPR_DRAFT,
                    'has_ppk' => $surat->ppk_id !== null,
                    'tickets' => ($peserta?->tickets ?? collect())->map(fn ($ticket) => [
                        'id' => $ticket->id,
                        'original_name' => $ticket->original_name,
                        'download_url' => route('pegawai.tiket.download', [$surat->id, $ticket->id]),
                    ])->values() ?? collect(),
                    'rekan' => $surat->pegawaiList
                        ->where('pegawai_id', '!=', $user->pegawai_id)
                        ->pluck('nama')
                        ->values(),
                ];
            });

        return [
            'trips' => $trips->values(),
            'summary' => [
                'total' => $trips->count(),
                'berlangsung' => $trips->where('phase', 'berlangsung')->count(),
                'akan_datang' => $trips->where('phase', 'akan_datang')->count(),
                'selesai' => $trips->where('phase', 'selesai')->count(),
            ],
            'hasPegawaiLink' => $user->pegawai_id !== null,
        ];
    }

    /** Statistik master data untuk dashboard admin. */
    public function adminStats(): array
    {
        return [
            'stats' => [
                'totalPegawai' => Pegawai::count(),
                'pegawaiAktif' => Pegawai::where('is_active', true)->count(),
                'totalPpk' => User::where('role', 'ppk')->count(),
                'totalUnitKerja' => UptBidang::where('is_active', true)->count(),
                'totalTingkatBiaya' => TingkatBiaya::where('is_active', true)->count(),
                'totalJenisAngkutan' => JenisAngkutan::where('is_active', true)->count(),
            ],
            'recentPegawai' => Pegawai::orderBy('updated_at', 'desc')->take(5)->get(),
        ];
    }

    private function countBy(string $column, ?int $userId = null): array
    {
        $query = SuratTugas::query()
            ->select($column, DB::raw('count(*) as total'));

        if ($userId !== null) {
            $query->where('user_id', $userId);
        }

        return $query->groupBy($column)
            ->get()
            ->pluck('total', $column)
            ->toArray();
    }

    /** Surat yang memerlukan aksi pengguna saat ini, menurut perannya. */
    private function needsAction(User $user): Collection|array
    {
        return $this->needsActionQuery($user)?->orderBy('created_at', 'asc')->limit(10)->get() ?? [];
    }

    private function needsActionQuery(User $user): ?Builder
    {
        return match (true) {
            $user->role === 'kapus' => SuratTugas::where('status', S::MENUNGGU_DISPOSISI_KAPUS)->with(['user', 'pegawaiList']),
            $user->role === 'tu' => SuratTugas::where('status', S::MENUNGGU_PENOMORAN_TU)->with(['user', 'pegawaiList']),
            $user->role === 'ppk' => SuratTugas::where('status', S::SELESAI_TERBIT)->where('is_ppk_signed', false)->with(['user', 'pegawaiList']),
            in_array($user->role, ['pemohon', 'sespalu'], true) => SuratTugas::where('user_id', $user->id)
                ->whereIn('status', [S::DRAFT, S::DISPOSISI_KAPUS_YA, S::DISPOSISI_KAPUS_REVISI, S::DISPOSISI_KAPUS_STOP])->with(['pegawaiList']),
            $user->role === 'admin' => SuratTugas::whereIn('status', [
                S::DRAFT,
                S::MENUNGGU_DISPOSISI_KAPUS,
                S::MENUNGGU_PENOMORAN_TU,
                S::DISPOSISI_KAPUS_YA,
                S::DISPOSISI_KAPUS_REVISI,
            ])->with(['user', 'pegawaiList']),
            default => null,
        };
    }

    /**
     * DPR yang menunggu persetujuan PPK untuk perjalanan yang ditugaskan kepadanya.
     *
     * @return array<int, array<string, mixed>>
     */
    private function pendingDprs(User $user): array
    {
        if ($user->role !== 'ppk') {
            return [];
        }

        return SuratTugasPegawai::query()
            ->where('dpr_status', SuratTugasPegawai::DPR_PENDING_APPROVAL)
            ->whereHas('suratTugas', fn (Builder $query) => $query
                ->where('ppk_id', $user->id)
                ->where('status', S::SELESAI_TERBIT)
                ->where('tanggal_kembali', '<', today()))
            ->with([
                'suratTugas:id,ppk_id,nomor_st,nomor_spd,perihal_nota,tempat_tujuan,tanggal_berangkat,tanggal_kembali',
                'tickets:id,surat_tugas_pegawai_id,original_name',
            ])
            ->orderBy('dpr_submitted_at')
            ->limit(20)
            ->get()
            ->map(fn (SuratTugasPegawai $peserta) => [
                'participant_id' => $peserta->id,
                'surat_tugas_id' => $peserta->suratTugas->id,
                'nama' => $peserta->nama,
                'nip' => $peserta->nip,
                'nomor_st' => $peserta->suratTugas->nomor_st,
                'nomor_spd' => $peserta->suratTugas->nomor_spd,
                'perihal_nota' => $peserta->suratTugas->perihal_nota,
                'tempat_tujuan' => $peserta->suratTugas->tempat_tujuan,
                'tanggal_berangkat' => $peserta->suratTugas->tanggal_berangkat?->toDateString(),
                'tanggal_kembali' => $peserta->suratTugas->tanggal_kembali?->toDateString(),
                'dpr_submitted_at' => $peserta->dpr_submitted_at?->toIso8601String(),
                'tickets' => $peserta->tickets->map(fn ($ticket) => [
                    'id' => $ticket->id,
                    'original_name' => $ticket->original_name,
                    'download_url' => route('ppk.dpr.ticket.download', [
                        $peserta->suratTugas->id,
                        $peserta->id,
                        $ticket->id,
                    ]),
                ])->values(),
            ])
            ->all();
    }

    /**
     * Lencana notifikasi in-app: jumlah pekerjaan yang menunggu pengguna + beberapa item terbaru.
     * Dihitung langsung dari status surat sehingga selalu sinkron (tanpa tabel notifikasi terpisah).
     *
     * @return array{count: int, items: array<int, array{id: int, title: ?string, message: string, url: string}>}
     */
    public function notifications(User $user): array
    {
        if ($user->role === S::PEGAWAI_ROLE) {
            return $this->pegawaiNotifications($user);
        }

        $query = $this->needsActionQuery($user);
        if ($query === null) {
            return ['count' => 0, 'items' => []];
        }

        $count = (clone $query)->count();
        $items = $query->orderBy('created_at', 'asc')->limit(5)->get()->map(fn (SuratTugas $s) => [
            'id' => $s->id,
            'title' => $s->perihal_nota,
            'message' => $this->actionMessage($user, $s),
            'url' => '/surat-tugas/'.$s->id,
        ])->all();

        if ($user->role === 'ppk') {
            $dprQuery = SuratTugasPegawai::query()
                ->where('dpr_status', SuratTugasPegawai::DPR_PENDING_APPROVAL)
                ->whereHas('suratTugas', fn (Builder $suratQuery) => $suratQuery
                    ->where('ppk_id', $user->id)
                    ->where('status', S::SELESAI_TERBIT)
                    ->where('tanggal_kembali', '<', today()));

            $dprCount = (clone $dprQuery)->count();
            $dprItems = $dprQuery
                ->with('suratTugas:id,perihal_nota')
                ->orderBy('dpr_submitted_at')
                ->limit(5)
                ->get()
                ->map(fn (SuratTugasPegawai $peserta) => [
                    'id' => 'dpr-'.$peserta->id,
                    'title' => $peserta->suratTugas->perihal_nota,
                    'message' => 'DPR '.$peserta->nama.' menunggu persetujuan Anda',
                    'url' => route('dashboard'),
                ])
                ->all();

            return [
                'count' => $count + $dprCount,
                'items' => array_slice(array_merge($dprItems, $items), 0, 5),
            ];
        }

        return ['count' => $count, 'items' => $items];
    }

    /** Pegawai diberi tahu perjalanan dinas yang akan/sedang berlangsung dalam 7 hari ke depan. */
    private function pegawaiNotifications(User $user): array
    {
        $today = now()->toDateString();
        $query = SuratTugas::query()
            ->diikutiPegawai($user->pegawai_id)
            ->whereIn('status', S::PEGAWAI_VISIBLE)
            ->whereNotNull('tanggal_berangkat')
            ->where('tanggal_berangkat', '<=', now()->addDays(7)->toDateString())
            ->where(fn (Builder $q) => $q->whereNull('tanggal_kembali')->orWhere('tanggal_kembali', '>=', $today));

        $count = (clone $query)->count();
        $items = $query->orderBy('tanggal_berangkat')->limit(5)->get()->map(function (SuratTugas $s) use ($today) {
            $berangkat = $s->tanggal_berangkat->toDateString();

            return [
                'id' => $s->id,
                'title' => $s->perihal_nota,
                'message' => $berangkat <= $today
                    ? 'Perjalanan dinas sedang berlangsung'
                    : 'Berangkat '.$s->tanggal_berangkat->translatedFormat('d M Y').' ('.(int) now()->startOfDay()->diffInDays($s->tanggal_berangkat->copy()->startOfDay()).' hari lagi)',
                'url' => '/surat-tugas/'.$s->id,
            ];
        })->all();

        return ['count' => $count, 'items' => $items];
    }

    private function actionMessage(User $user, SuratTugas $surat): string
    {
        return match (true) {
            $user->role === 'kapus' => 'Menunggu disposisi Anda',
            $user->role === 'tu' => 'Menunggu penomoran resmi',
            $user->role === 'ppk' => 'Menunggu tanda tangan digital Anda',
            $surat->status === S::DRAFT => 'Lanjutkan pengisian Nota, Surat Tugas & SPD',
            $surat->status === S::DISPOSISI_KAPUS_YA => 'Disetujui Kapus — lengkapi draft ST & SPD',
            $surat->status === S::DISPOSISI_KAPUS_REVISI => 'Kapus meminta revisi nota',
            $surat->status === S::DISPOSISI_KAPUS_STOP => 'Dihentikan Kapus — dapat diajukan ulang',
            default => S::LABELS[$surat->status] ?? $surat->status,
        };
    }

    /** Pegawai yang sedang aktif dinas di luar kantor hari ini. */
    private function onDutyToday(string $today): Collection
    {
        return SuratTugas::query()
            ->where('status', S::SELESAI_TERBIT)
            ->whereNotNull('tanggal_berangkat')
            ->whereNotNull('tanggal_kembali')
            ->where('tanggal_berangkat', '<=', $today)
            ->where('tanggal_kembali', '>=', $today)
            ->with(['pegawaiList', 'user'])
            ->orderBy('tanggal_kembali', 'asc')
            ->limit(10)
            ->get();
    }

    /** Jadwal dinas yang akan berangkat dalam 7 hari ke depan. */
    private function upcomingTrips(string $today, string $upcomingLimit): Collection
    {
        return SuratTugas::query()
            ->where('status', S::SELESAI_TERBIT)
            ->whereNotNull('tanggal_berangkat')
            ->where('tanggal_berangkat', '>', $today)
            ->where('tanggal_berangkat', '<=', $upcomingLimit)
            ->with(['pegawaiList', 'user'])
            ->orderBy('tanggal_berangkat', 'asc')
            ->limit(10)
            ->get();
    }

    /** Usulan dinas mendesak (berangkat <= 3 hari ke depan) yang belum tuntas diterbitkan. */
    private function urgentPending(User $user, string $urgentLimit): Collection
    {
        $query = SuratTugas::query()
            ->whereNotNull('tanggal_berangkat')
            ->where('tanggal_berangkat', '<=', $urgentLimit)
            ->whereNotIn('status', [S::SELESAI_TERBIT, S::DISPOSISI_KAPUS_STOP]);

        if (in_array($user->role, ['pemohon', 'sespalu'], true)) {
            $query->where('user_id', $user->id);
        } elseif ($user->role === 'kapus') {
            $query->where('status', S::MENUNGGU_DISPOSISI_KAPUS);
        } elseif ($user->role === 'tu') {
            $query->where('status', S::MENUNGGU_PENOMORAN_TU);
        } elseif ($user->role === 'ppk') {
            $query->where('status', S::SELESAI_TERBIT)->where('is_ppk_signed', false);
        }

        return $query->with(['pegawaiList', 'user'])
            ->orderBy('tanggal_berangkat', 'asc')
            ->limit(5)
            ->get();
    }

    /** Log riwayat aktivitas terbaru sistem. */
    private function recentActivities(): Collection
    {
        return SuratTugasLog::query()
            ->with(['user', 'suratTugas' => fn ($q) => $q->withTrashed()])
            ->orderByDesc('created_at')
            ->limit(8)
            ->get();
    }
}
