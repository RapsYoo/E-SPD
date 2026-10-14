<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        $user = $request->user();

        // P0: dukung 'role:admin' maupun 'role:a,b,c' (Laravel bisa kirim sebagai satu string).
        $allowed = collect($roles)
            ->flatMap(fn ($r) => explode(',', $r))
            ->map(fn ($r) => trim($r))
            ->filter()
            ->all();

        if ($user && in_array($user->role, $allowed, true)) {
            return $next($request);
        }

        // P0: jangan redirect untuk API — kembalikan 403 JSON agar tidak bocor ke login HTML.
        if ($request->expectsJson() || $request->is('api/*')) {
            abort(403, 'Anda tidak memiliki akses ke resource ini.');
        }

        if ($user) {
            return redirect()->route($user->role === 'admin' ? 'admin.dashboard' : 'surat-tugas.index')
                ->with('error', 'Anda tidak memiliki akses ke halaman tersebut.');
        }

        return redirect()->route('login');
    }
}