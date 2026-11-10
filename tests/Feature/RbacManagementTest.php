<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RbacManagementTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(string $role): User
    {
        $user = User::factory()->create();
        $user->forceFill(['role' => $role])->save();

        return $user->fresh();
    }

    public function test_admin_can_view_rbac_page_and_non_admin_is_rejected(): void
    {
        $admin = $this->makeUser('admin');
        $pemohon = $this->makeUser('pemohon');

        $this->actingAs($admin)->get(route('admin.rbac.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Rbac/Index')
                ->has('roles')
                ->has('modules')
                ->has('rolePermissions')
            );

        $this->actingAs($pemohon)->get(route('admin.rbac.index'))
            ->assertRedirect();
    }

    public function test_disabling_module_for_role_hides_permission_and_blocks_route(): void
    {
        $admin = $this->makeUser('admin');
        $pegawai = $this->makeUser('pegawai');

        // Default: pegawai punya izin pegawai_directory.view dan bisa buka /pegawai
        $this->actingAs($pegawai)->get('/pegawai')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('auth.permissions', fn ($perms) => collect($perms)->contains('pegawai_directory.view'))
            );

        // Admin menonaktifkan pegawai_directory.view untuk role pegawai
        $this->actingAs($admin)->put(route('admin.rbac.update', 'pegawai'), [
            'modules' => [
                'surat_tugas.view',
                'surat_tugas.print',
                'dpr.upload_tiket',
            ],
        ])->assertRedirect();

        // Sekarang pegawai tidak punya pegawai_directory.view di auth.permissions (menu sidebar tertutup)
        $this->actingAs($pegawai)->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('auth.permissions', fn ($perms) => ! collect($perms)->contains('pegawai_directory.view'))
            );

        // Dan akses langsung ke /pegawai ditolak
        $this->actingAs($pegawai)->get('/pegawai')
            ->assertRedirect(route('dashboard'));

        // Admin mereset role pegawai ke default -> kembali bisa diakses
        $this->actingAs($admin)->post(route('admin.rbac.reset', 'pegawai'))
            ->assertRedirect();

        $this->actingAs($pegawai)->get('/pegawai')
            ->assertOk();
    }

    public function test_enabling_module_for_role_grants_route_access_and_sidebar_permission(): void
    {
        $admin = $this->makeUser('admin');
        $pemohon = $this->makeUser('pemohon');

        // Default: pemohon tidak bisa akses /rekapitulasi
        $this->actingAs($pemohon)->get('/rekapitulasi')
            ->assertRedirect(route('dashboard'));

        // Admin mengaktifkan rekapitulasi.view untuk pemohon
        $this->actingAs($admin)->put(route('admin.rbac.update', 'pemohon'), [
            'modules' => [
                'surat_tugas.view',
                'surat_tugas.create',
                'surat_tugas.print',
                'rekapitulasi.view',
            ],
        ])->assertRedirect();

        // Pemohon kini bisa mengakses /rekapitulasi dan menerima izin di auth.permissions
        $this->actingAs($pemohon)->get('/rekapitulasi')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('auth.permissions', fn ($perms) => collect($perms)->contains('rekapitulasi.view'))
            );
    }
}

