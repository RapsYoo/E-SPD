<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Admin\RbacService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RbacController extends Controller
{
    public function __construct(private RbacService $rbac) {}

    public function index(): Response
    {
        return Inertia::render('Admin/Rbac/Index', [
            'roles' => RbacService::MANAGEABLE_ROLES,
            'modules' => RbacService::MODULES,
            'rolePermissions' => $this->rbac->resolvedMatrix(),
            'defaultPermissions' => RbacService::DEFAULT_ROLE_MODULES,
            'users' => User::query()
                ->where('role', '!=', 'admin')
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'role']),
            'userPermissions' => $this->rbac->allUserExtraPermissions(),
        ]);
    }

    public function updateUser(Request $request, User $user): RedirectResponse
    {
        abort_if($user->role === 'admin', 422, 'Admin Master sudah memiliki akses penuh.');

        $validated = $request->validate([
            'modules' => ['present', 'array'],
            'modules.*' => ['string', Rule::in($this->rbac->allModuleKeys())],
        ]);

        $this->rbac->updateUserPermissions($user, $validated['modules']);

        return redirect()->back()->with('success', "Hak akses khusus untuk akun {$user->name} berhasil diperbarui.");
    }

    public function update(Request $request, string $role): RedirectResponse
    {
        abort_unless(array_key_exists($role, RbacService::MANAGEABLE_ROLES), 404);

        $validated = $request->validate([
            'modules' => ['present', 'array'],
            'modules.*' => ['string', Rule::in($this->rbac->allModuleKeys())],
        ]);

        $this->rbac->updateRolePermissions($role, $validated['modules']);

        $roleLabel = RbacService::MANAGEABLE_ROLES[$role]['label'] ?? strtoupper($role);

        return redirect()->back()->with('success', "Hak akses modul untuk role {$roleLabel} berhasil diperbarui.");
    }

    public function reset(string $role): RedirectResponse
    {
        abort_unless($role === 'all' || array_key_exists($role, RbacService::MANAGEABLE_ROLES), 404);

        if ($role === 'all') {
            $this->rbac->resetToDefault(null);

            return redirect()->back()->with('success', 'Seluruh hak akses role berhasil dikembalikan ke pengaturan default.');
        }

        $this->rbac->resetToDefault($role);
        $roleLabel = RbacService::MANAGEABLE_ROLES[$role]['label'] ?? strtoupper($role);

        return redirect()->back()->with('success', "Hak akses role {$roleLabel} dikembalikan ke pengaturan default.");
    }
}
