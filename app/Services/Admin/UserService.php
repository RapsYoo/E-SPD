<?php

namespace App\Services\Admin;

use App\Exceptions\WorkflowException;
use App\Models\Pegawai;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

/**
 * Manajemen akun pengguna. Nama akun selalu mengikuti data pegawai.
 */
class UserService
{
    /** Daftar peran yang tersedia pada sistem. */
    public const ROLES = [
        'admin' => 'Admin Master',
        'pemohon' => 'Pemohon',
        'sespalu' => 'Sespalu',
        'kapus' => 'Kepala Pusat (Kapus)',
        'tu' => 'Tata Usaha (TU)',
        'ppk' => 'PPK',
        'pegawai' => 'Pegawai',
    ];

    /** @param array{search?: ?string, role?: ?string} $filters */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = User::with('pegawai:id,nama,nip,jabatan,unit_kerja');

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhereHas('pegawai', fn ($p) => $p->where('nip', 'like', "%{$search}%"));
            });
        }

        if (!empty($filters['role']) && array_key_exists($filters['role'], self::ROLES)) {
            $query->where('role', $filters['role']);
        }

        return $query->orderBy('name')->paginate(10)->withQueryString();
    }

    /** Pegawai aktif beserta id akun yang sudah memakainya (untuk memfilter pilihan di form). */
    public function pegawaiOptions(): \Illuminate\Support\Collection
    {
        return Pegawai::where('is_active', true)
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
    }

    public function create(array $validated): User
    {
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

        return $user;
    }

    public function update(User $user, array $validated, ?User $actor): User
    {
        if ($validated['role'] !== 'admin' && $user->role === 'admin') {
            if ($user->id === $actor?->id) {
                throw ValidationException::withMessages(['role' => 'Anda tidak dapat menurunkan peran akun Anda sendiri.']);
            }
            if ($this->isLastAdmin($user)) {
                throw ValidationException::withMessages(['role' => 'Minimal harus ada satu akun Admin Master.']);
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

        return $user;
    }

    /** @return string Nama akun yang dihapus. */
    public function delete(User $user, ?User $actor): string
    {
        if ($user->id === $actor?->id) {
            throw new WorkflowException('Anda tidak dapat menghapus akun yang sedang Anda gunakan.');
        }

        if ($user->role === 'admin' && $this->isLastAdmin($user)) {
            throw new WorkflowException('Akun Admin Master terakhir tidak dapat dihapus.');
        }

        $name = $user->name;
        // surat_tugas.user_id & log memakai nullOnDelete, sehingga riwayat dokumen tetap aman.
        $user->delete();

        return $name;
    }

    private function isLastAdmin(User $user): bool
    {
        return User::where('role', 'admin')->where('id', '!=', $user->id)->doesntExist();
    }
}
