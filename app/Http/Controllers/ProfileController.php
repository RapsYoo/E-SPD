<?php

namespace App\Http\Controllers;

use App\Models\Pegawai;
use App\Models\UptBidang;
use App\Models\User;
use Closure;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        // Pastikan user memiliki relasi pegawai agar bisa mengunggah foto dan mengubah data pegawainya.
        $pegawai = $user->pegawai;
        if (! $pegawai) {
            $existingPegawai = Pegawai::where('nama', $user->name)->whereDoesntHave('user')->first();
            if ($existingPegawai) {
                $user->update(['pegawai_id' => $existingPegawai->id]);
                $pegawai = $existingPegawai;
            } else {
                $pegawai = Pegawai::create([
                    'nama' => $user->name,
                    'nip' => '-',
                    'is_active' => true,
                ]);
                $user->update(['pegawai_id' => $pegawai->id]);
            }
        }

        $pegawai->load('upt');

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => session('status'),
            'pegawai' => $pegawai,
            'uptBidangList' => UptBidang::where('is_active', true)->orderBy('nama')->get(['id', 'nama', 'kode']),
        ]);
    }

    /**
     * Update the user's profile information and linked pegawai data.
     */
    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();
        $pegawai = $user->pegawai;

        // Validasi akun & data pegawai
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($user->id),
            ],
            'nip' => [
                'nullable', 'string', 'max:255',
                function (string $attribute, mixed $value, Closure $fail) use ($pegawai): void {
                    $nip = trim((string) $value);
                    if ($nip === '' || $nip === '-') {
                        return;
                    }
                    $exists = Pegawai::where('nip', $nip)
                        ->when($pegawai, fn ($q) => $q->where('id', '!=', $pegawai->id))
                        ->exists();
                    if ($exists) {
                        $fail('NIP sudah digunakan oleh pegawai lain.');
                    }
                },
            ],
            'jabatan' => ['nullable', 'string', 'max:255'],
            'pangkat' => ['nullable', 'string', 'max:255'],
            'golongan' => ['nullable', 'string', 'max:255'],
            'upt_bidang_id' => ['nullable', 'integer', 'exists:upt_bidang,id'],
            'jenis_kelamin' => ['nullable', 'string', 'max:255'],
            'agama' => ['nullable', 'string', 'max:255'],
            'status_kepegawaian' => ['nullable', 'string', 'max:255'],
            'bank' => ['nullable', 'string', 'max:255'],
            'no_rekening' => ['nullable', 'string', 'max:255'],
            'nama_rekening' => ['nullable', 'string', 'max:255'],
            'keterangan' => ['nullable', 'string'],
            'foto' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
            'hapus_foto' => ['nullable', 'boolean'],
        ]);

        if (! $pegawai) {
            $pegawai = Pegawai::create([
                'nama' => $validated['name'],
                'nip' => $validated['nip'] ?? '-',
                'is_active' => true,
            ]);
            $user->update(['pegawai_id' => $pegawai->id]);
        }

        // Handle foto upload / delete
        if ($request->hasFile('foto')) {
            if ($pegawai->foto && Storage::disk('public')->exists($pegawai->foto)) {
                Storage::disk('public')->delete($pegawai->foto);
            }
            $pegawai->foto = $request->file('foto')->store('pegawai_foto', 'public');
        } elseif ($request->boolean('hapus_foto')) {
            if ($pegawai->foto && Storage::disk('public')->exists($pegawai->foto)) {
                Storage::disk('public')->delete($pegawai->foto);
            }
            $pegawai->foto = null;
        }

        // Update data pegawai
        $pegawai->nama = $validated['name'];
        if (array_key_exists('nip', $validated)) {
            $pegawai->nip = $validated['nip'];
        }
        if (array_key_exists('jabatan', $validated)) {
            $pegawai->jabatan = $validated['jabatan'];
        }
        if (array_key_exists('pangkat', $validated)) {
            $pegawai->pangkat = $validated['pangkat'];
        }
        if (array_key_exists('golongan', $validated)) {
            $pegawai->golongan = $validated['golongan'];
        }
        if (array_key_exists('upt_bidang_id', $validated)) {
            $pegawai->upt_bidang_id = $validated['upt_bidang_id'];
        }
        if (array_key_exists('jenis_kelamin', $validated)) {
            $pegawai->jenis_kelamin = $validated['jenis_kelamin'];
        }
        if (array_key_exists('agama', $validated)) {
            $pegawai->agama = $validated['agama'];
        }
        if (array_key_exists('status_kepegawaian', $validated)) {
            $pegawai->status_kepegawaian = $validated['status_kepegawaian'];
        }
        if (array_key_exists('bank', $validated)) {
            $pegawai->bank = $validated['bank'];
        }
        if (array_key_exists('no_rekening', $validated)) {
            $pegawai->no_rekening = $validated['no_rekening'];
        }
        if (array_key_exists('nama_rekening', $validated)) {
            $pegawai->nama_rekening = $validated['nama_rekening'];
        }
        if (array_key_exists('keterangan', $validated)) {
            $pegawai->keterangan = $validated['keterangan'];
        }
        $pegawai->save();

        // Update user
        $user->name = $validated['name'];
        $user->email = $validated['email'];
        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }
        $user->save();

        return Redirect::route('profile.edit')->with('success', 'Profil dan data pegawai berhasil diperbarui.');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
