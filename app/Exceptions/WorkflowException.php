<?php

namespace App\Exceptions;

use Illuminate\Http\Request;
use RuntimeException;

/**
 * Pelanggaran aturan bisnis (peran/status tidak sesuai, nomor bentrok, dsb).
 * Dirender sebagai redirect kembali dengan flash `error` (web) atau 422 JSON (API).
 */
class WorkflowException extends RuntimeException
{
    public function render(Request $request)
    {
        if ($request->expectsJson()) {
            return response()->json(['message' => $this->getMessage()], 422);
        }

        return redirect()->back()->with('error', $this->getMessage());
    }
}
