<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        $user = $request->user();

        if ($user && in_array($user->role, $roles, true)) {
            return $next($request);
        }

        if ($user) {
            return redirect()->route($user->role === 'admin' ? 'admin.dashboard' : 'surat-tugas.index')
                ->with('error', 'Anda tidak memiliki akses ke halaman tersebut.');
        }

        return redirect()->route('login');
    }
}