<?php

namespace App\Http\Controllers;

use App\Models\SuratTugas;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $role = $user->role;

        // Query base terbuka untuk semua aktor (menampilkan statistik menyeluruh organisasi)
        $query = SuratTugas::query();

        // Total surat tugas
        $totalSurat = $query->count();

        // Statistik per status
        $statusStats = $query->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->get()
            ->pluck('total', 'status')
            ->toArray();

        // Statistik per kategori perjalanan
        $kategoriStats = $query->select('kategori_perjalanan', DB::raw('count(*) as total'))
            ->groupBy('kategori_perjalanan')
            ->get()
            ->pluck('total', 'kategori_perjalanan')
            ->toArray();

        // Surat terbaru (5 terakhir)
        $recentSurat = SuratTugas::query()
            ->with(['pegawaiList', 'user'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // Surat yang memerlukan aksi user saat ini
        $needsAction = [];
        
        if ($role === 'kapus') {
            $needsAction = SuratTugas::where('status', 'MENUNGGU_DISPOSISI_KAPUS')
                ->with(['user'])
                ->orderBy('created_at', 'asc')
                ->limit(10)
                ->get();
        } elseif ($role === 'tu') {
            $needsAction = SuratTugas::where('status', 'MENUNGGU_PENOMORAN_TU')
                ->with(['user'])
                ->orderBy('created_at', 'asc')
                ->limit(10)
                ->get();
        } elseif ($role === 'ppk') {
            $needsAction = SuratTugas::where('status', 'SELESAI_TERBIT')
                ->where('is_ppk_signed', false)
                ->with(['user'])
                ->orderBy('created_at', 'asc')
                ->limit(10)
                ->get();
        } elseif (in_array($role, ['pemohon', 'sespalu'], true)) {
            $needsAction = SuratTugas::where('user_id', $user->id)
                ->whereIn('status', ['DISPOSISI_KAPUS_YA', 'DISPOSISI_KAPUS_REVISI'])
                ->orderBy('created_at', 'asc')
                ->limit(10)
                ->get();
        } elseif ($role === 'admin') {
            $needsAction = SuratTugas::whereIn('status', [
                'MENUNGGU_DISPOSISI_KAPUS',
                'MENUNGGU_PENOMORAN_TU',
                'DISPOSISI_KAPUS_YA',
                'DISPOSISI_KAPUS_REVISI'
            ])
                ->with(['user'])
                ->orderBy('created_at', 'asc')
                ->limit(10)
                ->get();
        }

        return Inertia::render('Dashboard', [
            'totalSurat' => $totalSurat,
            'statusStats' => $statusStats,
            'kategoriStats' => $kategoriStats,
            'recentSurat' => $recentSurat,
            'needsAction' => $needsAction,
            'userRole' => $role,
            'userName' => $user->name,
        ]);
    }
}
