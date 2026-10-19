<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pegawai;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    /** Daftar peran yang tersedia pada sistem. */
    public const ROLES = [
        'admin' => 'Admin Master',
        'pemohon' => 'Pemohon',
        'sespalu' => 'Sespalu',
        'kapus' => 'Kepala Pusat (Kapus)',
        'tu' => 'Tata Usaha (TU)',
        'ppk' => 'PPK',
    ];

    public function index(Request $request)
    {
        $query = User::with('pegawai:id,nama,nip,jabatan,unit_kerja');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhereHas('pegawai', fn ($p) => $p->where('nip', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('role') && array_key_exists($request->role, self::ROLES)) {
            $query->where('role', $request->role);
        }

        $users = $query->orderBy('name')->paginate(10)->withQueryString();

        // Pegawai aktif beserta id akun yang sudah memakainya (untuk memfilter pilihan di form).
        $pegawaiOptions = Pegawai::where('is_active', true)
            ->with('user:id,pegawai_id')
            ->orderBy('nama')
            ->get(['id', 'nama', 'nip', 'pangkat', 'golongan', 'jabatan', 'unit_kerja', 'email'])
            ->map(fn (Pegawai $p) => [
                'id' => $p->id,
                'nama' => $p->nama,
                'nip' => $p->nip,
                'pangkat' => $p->pangkat,
                'golongan' => $p->golongan,
                'jabatan' => $p->jabatan,
                'unit_kerja' => $p->unit_kerja,
                'email' => $p->email,
                'user_id' => $p->user?->id,
            ]);

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => $request->only(['search', 'role']),
            'roles' => self::ROLES,
            'pegawaiOptions' => $pegawaiOptions,
            'currentUserId' => auth()->id(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'pegawai_id' => [
                'required',
                Rule::exists('pegawai', 'id')->where('is_active', true),
                'unique:users,pegawai_id',
            ],
            'email' => 'required|email|max:255|unique:users,email',
            'role' => ['required', Rule::in(array_keys(self::ROLES))],
            'password' => 'required|string|min:8|max:255',
        ], [
            'pegawai_id.required' => 'Pilih pegawai dari daftar data pegawai.',
            'pegawai_id.unique' => 'Pegawai ini sudah memiliki akun.',
            'pegawai_id.exists' => 'Pegawai tidak ditemukan atau tidak aktif.',
        ]);

        // Nama selalu diambil dari data pegawai, bukan dari input pengguna.
        $pegawai = Pegawai::findOrFail($validated['pegawai_id']);

        $user = new User([
            'name' => $pegawai->nama,
            'email' => $validated['email'],
            'password' => $validated['password'], // di-hash oleh cast 'hashed'
            'pegawai_id' => $pegawai->id,
        ]);
        // role di luar fillable (anti mass-assign) -> paksa via forceFill.
        $user->forceFill(['role' => $validated['role']])->save();

        return redirect()->back()->with('success', "Akun {$user->name} berhasil ditambahkan.");
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            // Akun lama (hasil seeder) belum terhubung ke pegawai, jadi boleh kosong.
            'pegawai_id' => [
                Rule::requiredIf($user->pegawai_id !== null),
                'nullable',
                Rule::exists('pegawai', 'id')->where('is_active', true),
                Rule::unique('users', 'pegawai_id')->ignore($user->id),
            ],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'role' => ['required', Rule::in(array_keys(self::ROLES))],
            'password' => 'nullable|string|min:8|max:255',
        ], [
            'pegawai_id.required' => 'Pilih pegawai dari daftar data pegawai.',
            'pegawai_id.unique' => 'Pegawai ini sudah memiliki akun lain.',
            'pegawai_id.exists' => 'Pegawai tidak ditemukan atau tidak aktif.',
        ]);

        if ($validated['role'] !== 'admin' && $user->role === 'admin') {
            if ($user->id === auth()->id()) {
                return redirect()->back()->withErrors(['role' => 'Anda tidak dapat menurunkan peran akun Anda sendiri.']);
            }
            if ($this->isLastAdmin($user)) {
                return redirect()->back()->withErrors(['role' => 'Minimal harus ada satu akun Admin Master.']);
            }
        }

        $values = [
            'email' => $validated['email'],
            'pegawai_id' => $validated['pegawai_id'] ?? null,
        ];

        // Bila terhubung ke pegawai, nama selalu mengikuti data pegawai.
        if (!empty($validated['pegawai_id'])) {
            $values['name'] = Pegawai::findOrFail($validated['pegawai_id'])->nama;
        }

        if (!empty($validated['password'])) {
            $values['password'] = $validated['password'];
        }

        $user->fill($values);
        $user->forceFill(['role' => $validated['role']])->save();

        return redirect()->back()->with('success', "Akun {$user->name} berhasil diperbarui.");
    }

    public function destroy(User $user)
    {
        if ($user->id === auth()->id()) {
            return redirect()->back()->with('error', 'Anda tidak dapat menghapus akun yang sedang Anda gunakan.');
        }

        if ($user->role === 'admin' && $this->isLastAdmin($user)) {
            return redirect()->back()->with('error', 'Akun Admin Master terakhir tidak dapat dihapus.');
        }

        $name = $user->name;
        // surat_tugas.user_id & log memakai nullOnDelete, sehingga riwayat dokumen tetap aman.
        $user->delete();

        return redirect()->back()->with('success', "Akun {$name} berhasil dihapus.");
    }

    private function isLastAdmin(User $user): bool
    {
        return User::where('role', 'admin')->where('id', '!=', $user->id)->doesntExist();
    }
}
