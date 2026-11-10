<?php

namespace App\Http\Middleware;

use App\Services\Admin\RbacService;
use Closure;
use Illuminate\Http\Request;

class EnsureUserHasModuleAccess
{
    public function __construct(private RbacService $rbac) {}

    public function handle(Request $request, Closure $next, string ...$modules)
    {
        $user = $request->user();

        $requiredModules = collect($modules)
            ->flatMap(fn ($m) => explode(',', $m))
            ->map(fn ($m) => trim($m))
            ->filter()
            ->values()
            ->all();

        if ($user && $this->rbac->hasAnyPermission($user, $requiredModules)) {
            return $next($request);
        }

        if ($request->expectsJson() || $request->is('api/*')) {
            abort(403, 'Anda tidak memiliki hak akses pada modul ini.');
        }

        if ($user) {
            return redirect()->route($user->role === 'admin' ? 'admin.dashboard' : 'dashboard')
                ->with('error', 'Akses ke modul tersebut telah dinonaktifkan untuk peran Anda.');
        }

        return redirect()->route('login');
    }
}

