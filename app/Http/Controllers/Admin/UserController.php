<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UserRequest;
use App\Models\User;
use App\Services\Admin\UserService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
    public function __construct(private UserService $users)
    {
    }

    public function index(Request $request)
    {
        return Inertia::render('Admin/Users/Index', [
            'users' => $this->users->paginate($request->only(['search', 'role'])),
            'filters' => $request->only(['search', 'role']),
            'roles' => UserService::ROLES,
            'pegawaiOptions' => $this->users->pegawaiOptions(),
            'currentUserId' => auth()->id(),
        ]);
    }

    public function store(UserRequest $request)
    {
        $user = $this->users->create($request->validated());

        return redirect()->back()->with('success', "Akun {$user->name} berhasil ditambahkan.");
    }

    public function update(UserRequest $request, User $user)
    {
        $user = $this->users->update($user, $request->validated(), $request->user());

        return redirect()->back()->with('success', "Akun {$user->name} berhasil diperbarui.");
    }

    public function destroy(Request $request, User $user)
    {
        $name = $this->users->delete($user, $request->user());

        return redirect()->back()->with('success', "Akun {$name} berhasil dihapus.");
    }
}
