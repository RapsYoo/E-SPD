<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(DashboardService $dashboard)
    {
        return Inertia::render('Admin/Dashboard', $dashboard->adminStats());
    }
}
