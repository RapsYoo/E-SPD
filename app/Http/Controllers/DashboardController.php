<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __construct(private DashboardService $dashboard) {}

    public function index()
    {
        $user = auth()->user();

        return Inertia::render('Dashboard', $this->dashboard->overview($user) + [
            'userRole' => $user->role,
            'userName' => $user->name,
            'authUserId' => $user->id,
        ]);
    }
}
