<?php

namespace App\Http\Controllers;

use App\Http\Requests\RekapitulasiRequest;
use App\Services\RekapitulasiService;
use App\Support\SuratTugasStatus;
use Inertia\Inertia;

/**
 * Rekapitulasi perjalanan dinas untuk kebutuhan administrasi/SPJ (admin, TU, PPK, Kapus).
 */
class RekapitulasiController extends Controller
{
    public function __construct(private RekapitulasiService $rekap) {}

    public function index(RekapitulasiRequest $request)
    {
        $filters = $request->filters();

        return Inertia::render('Rekapitulasi/Index', [
            'rows' => $this->rekap->rows($filters),
            'summary' => $this->rekap->summary($filters),
            'filters' => $filters,
            'statusOptions' => SuratTugasStatus::LABELS,
        ]);
    }

    public function export(RekapitulasiRequest $request)
    {
        return $this->rekap->export($request->filters(), $request->input('format', 'csv'));
    }
}
