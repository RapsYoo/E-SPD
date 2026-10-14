<?php

namespace Tests\Feature;

use App\Models\SuratTugas;
use App\Models\SuratTugasLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SuratTugasP1Test extends TestCase
{
    use RefreshDatabase;

    private function makeUser(string $role): User
    {
        $user = User::factory()->create();
        $user->forceFill(['role' => $role])->save();

        return $user->fresh();
    }

    private function makeSurat(User $owner, array $overrides = []): SuratTugas
    {
        return SuratTugas::create(array_merge([
            'user_id' => $owner->id,
            'kategori_perjalanan' => 'DALAM_NEGERI',
            'sumber_asal' => 'EKSTERNAL',
            'nomor_nota' => 'NOTA/'.uniqid(),
            'pengirim_nota' => 'Sespalu',
            'tanggal_nota' => now()->toDateString(),
            'perihal_nota' => 'Testing P1',
            'status' => 'MENUNGGU_DISPOSISI_KAPUS',
        ], $overrides));
    }

    public function test_disposisi_mencatat_audit_log(): void
    {
        $pemohon = $this->makeUser('pemohon');
        $kapus = $this->makeUser('kapus');
        $surat = $this->makeSurat($pemohon);

        $this->actingAs($kapus)
            ->post(route('surat-tugas.disposisi', $surat->id), [
                'kapus_decision' => 'YA',
                'catatan_kapus' => 'Setuju',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('surat_tugas', [
            'id' => $surat->id,
            'status' => 'DISPOSISI_KAPUS_YA',
        ]);
        $this->assertDatabaseHas('surat_tugas_logs', [
            'surat_tugas_id' => $surat->id,
            'aksi' => 'DISPOSISI_YA',
            'dari_status' => 'MENUNGGU_DISPOSISI_KAPUS',
            'ke_status' => 'DISPOSISI_KAPUS_YA',
        ]);
    }

    public function test_penomoran_tu_mencatat_log_dan_terbit(): void
    {
        $pemohon = $this->makeUser('pemohon');
        $tu = $this->makeUser('tu');
        $surat = $this->makeSurat($pemohon, ['status' => 'MENUNGGU_PENOMORAN_TU']);

        $this->actingAs($tu)
            ->post(route('surat-tugas.penomoran', $surat->id), [
                'nomor_st' => 'ST/001/'.uniqid(),
                'nomor_spd' => 'SPD/001/'.uniqid(),
                'tanggal_surat' => now()->toDateString(),
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('surat_tugas', [
            'id' => $surat->id,
            'status' => 'SELESAI_TERBIT',
        ]);
        $this->assertDatabaseHas('surat_tugas_logs', [
            'surat_tugas_id' => $surat->id,
            'aksi' => 'PENOMORAN',
            'ke_status' => 'SELESAI_TERBIT',
        ]);
    }

    public function test_ttd_ppk_mencatat_audit(): void
    {
        $pemohon = $this->makeUser('pemohon');
        $ppk = $this->makeUser('ppk');
        $surat = $this->makeSurat($pemohon, ['status' => 'SELESAI_TERBIT']);

        $this->actingAs($ppk)
            ->post(route('surat-tugas.sign-ppk', $surat->id), [
                'is_ppk_signed' => true,
            ])
            ->assertRedirect();

        $this->assertTrue($surat->fresh()->is_ppk_signed);
        $this->assertDatabaseHas('surat_tugas_logs', [
            'surat_tugas_id' => $surat->id,
            'aksi' => 'TTD_PPK',
        ]);
    }

    public function test_destroy_soft_delete_bukan_hapus_permanen(): void
    {
        $pemohon = $this->makeUser('pemohon');
        $admin = $this->makeUser('admin');
        $surat = $this->makeSurat($pemohon);

        $this->actingAs($admin)
            ->delete(route('surat-tugas.destroy', $surat->id))
            ->assertRedirect(route('surat-tugas.index'));

        // Masih ada di DB dengan deleted_at (soft-delete).
        $this->assertSoftDeleted('surat_tugas', ['id' => $surat->id]);
        $this->assertDatabaseHas('surat_tugas_logs', [
            'surat_tugas_id' => $surat->id,
            'aksi' => 'HAPUS',
        ]);
        // Index default tidak menampilkan yang terarsip.
        $this->assertNull(SuratTugas::find($surat->id));
        $this->assertNotNull(SuratTugas::withTrashed()->find($surat->id));
    }

    public function test_cetak_akses_luas_owner_dan_kapus(): void
    {
        $pemohon = $this->makeUser('pemohon');
        $kapus = $this->makeUser('kapus');
        $surat = $this->makeSurat($pemohon, ['status' => 'MENUNGGU_PENOMORAN_TU']);

        // Owner (pemohon) boleh cetak setelah disetujui Kapus.
        $this->actingAs($pemohon)
            ->get(route('surat-tugas.cetak', $surat->id))
            ->assertOk();

        // Kapus boleh cetak juga.
        $this->actingAs($kapus)
            ->get(route('surat-tugas.cetak', $surat->id))
            ->assertOk();

        $this->assertDatabaseHas('surat_tugas_logs', [
            'surat_tugas_id' => $surat->id,
            'aksi' => 'CETAK',
        ]);
    }

    public function test_cetak_ditolak_sebelum_disetujui_kapus(): void
    {
        $pemohon = $this->makeUser('pemohon');
        $surat = $this->makeSurat($pemohon, ['status' => 'MENUNGGU_DISPOSISI_KAPUS']);

        $this->actingAs($pemohon)
            ->get(route('surat-tugas.cetak', $surat->id))
            ->assertRedirect(route('surat-tugas.show', $surat->id));
    }
}
