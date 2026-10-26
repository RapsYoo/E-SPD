<?php

namespace Tests\Feature;

use App\Models\SuratTugas;
use App\Models\User;
use App\Support\SuratTugasStatus as S;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FiturTahapLanjutanTest extends TestCase
{
    use RefreshDatabase;

    private function userWithRole(string $role): User
    {
        $user = User::factory()->create();
        $user->forceFill(['role' => $role])->save();

        return $user->fresh();
    }

    private function makeSurat(User $owner, string $status, array $extra = []): SuratTugas
    {
        static $seq = 1;
        $seq++;

        return SuratTugas::create(array_merge([
            'user_id' => $owner->id,
            'kategori_perjalanan' => 'DALAM_NEGERI',
            'sumber_asal' => 'EKSTERNAL',
            'nomor_nota' => 'NOTA/'.$seq,
            'pengirim_nota' => 'Sespalu',
            'tanggal_nota' => now()->toDateString(),
            'perihal_nota' => 'Dinas uji',
            'status' => $status,
            'tempat_tujuan' => 'Semarang',
            'tanggal_berangkat' => now()->addDays(3)->toDateString(),
            'tanggal_kembali' => now()->addDays(5)->toDateString(),
            'durasi_hari' => 3,
            'nomor_st' => 'ST/00'.$seq,
        ], $extra));
    }

    public function test_rekapitulasi_is_limited_to_management_roles(): void
    {
        foreach (['admin', 'tu', 'ppk', 'kapus'] as $role) {
            $this->actingAs($this->userWithRole($role))->get('/rekapitulasi')->assertOk();
        }

        foreach (['pemohon', 'pegawai'] as $role) {
            $this->actingAs($this->userWithRole($role))->get('/rekapitulasi')->assertRedirect(route('surat-tugas.index'));
        }
    }

    public function test_rekapitulasi_filters_by_status_and_exports_csv(): void
    {
        $admin = $this->userWithRole('admin');
        $this->makeSurat($admin, S::SELESAI_TERBIT, ['tempat_tujuan' => 'Semarang']);
        $this->makeSurat($admin, S::DRAFT, ['tempat_tujuan' => 'Bogor']);

        $this->actingAs($admin)
            ->get('/rekapitulasi?status='.S::SELESAI_TERBIT)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Rekapitulasi/Index')
                ->has('rows.data', 1)
                ->where('summary.total_surat', 1));

        $response = $this->actingAs($admin)->get('/rekapitulasi/export?format=csv');
        $response->assertOk();
        $this->assertStringContainsString('text/csv', $response->headers->get('content-type'));
        $this->assertStringContainsString('Semarang', $response->streamedContent());
    }

    public function test_owner_can_resubmit_stopped_letter_but_others_cannot(): void
    {
        $owner = $this->userWithRole('pemohon');
        $other = $this->userWithRole('pemohon');
        $surat = $this->makeSurat($owner, S::DISPOSISI_KAPUS_STOP, ['kapus_decision' => 'STOP']);

        $this->actingAs($other)->post("/surat-tugas/{$surat->id}/ajukan-ulang");
        $this->assertSame(S::DISPOSISI_KAPUS_STOP, $surat->fresh()->status);

        $this->actingAs($owner)->post("/surat-tugas/{$surat->id}/ajukan-ulang")
            ->assertRedirect();
        $this->assertSame(S::DRAFT, $surat->fresh()->status);
        $this->assertNull($surat->fresh()->kapus_decision);
    }

    public function test_resubmit_is_rejected_for_wrong_status(): void
    {
        $owner = $this->userWithRole('pemohon');
        $surat = $this->makeSurat($owner, S::SELESAI_TERBIT);

        $this->actingAs($owner)->post("/surat-tugas/{$surat->id}/ajukan-ulang");

        $this->assertSame(S::SELESAI_TERBIT, $surat->fresh()->status);
    }

    public function test_notifications_are_shared_per_role(): void
    {
        $owner = $this->userWithRole('pemohon');
        $this->makeSurat($owner, S::DISPOSISI_KAPUS_STOP);
        $tu = $this->userWithRole('tu');
        $this->makeSurat($owner, S::MENUNGGU_PENOMORAN_TU);

        $this->actingAs($owner)->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page->where('notifications.count', 1));

        $this->actingAs($tu)->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page->where('notifications.count', 1));
    }

    public function test_cleanup_command_removes_only_orphan_files(): void
    {
        Storage::fake('public');
        $owner = $this->userWithRole('pemohon');

        Storage::disk('public')->put('undangan/dipakai.pdf', 'x');
        Storage::disk('public')->put('undangan/yatim.pdf', 'x');
        $this->makeSurat($owner, S::DRAFT, ['file_undangan' => 'undangan/dipakai.pdf']);

        $this->artisan('lampiran:bersihkan --umur=0')->assertSuccessful();

        Storage::disk('public')->assertExists('undangan/dipakai.pdf');
        Storage::disk('public')->assertMissing('undangan/yatim.pdf');
    }
}
