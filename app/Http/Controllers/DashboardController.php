<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use App\Support\SuratTugasStatus;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __construct(private DashboardService $dashboard) {}

    public function index()
    {
        $user = auth()->user();

        if ($user->role === SuratTugasStatus::PEGAWAI_ROLE) {
            return Inertia::render('DashboardPegawai', $this->dashboard->pegawaiOverview($user) + [
                'userName' => $user->name,
            ]);
        }

        return Inertia::render('Dashboard', $this->dashboard->overview($user) + [
            'userRole' => $user->role,
            'userName' => $user->name,
            'authUserId' => $user->id,
        ]);
    }
}
