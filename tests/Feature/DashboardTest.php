<?php

namespace Tests\Feature;

use App\Models\SuratTugas;
use App\Models\SuratTugasLog;
use App\Models\SuratTugasPegawai;
use App\Models\User;
use App\Support\SuratTugasStatus as S;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(string $role): User
    {
        $user = User::factory()->create();
        $user->forceFill(['role' => $role])->save();

        return $user->fresh();
    }

    public function test_guest_is_redirected_to_login(): void
    {
        $response = $this->get('/dashboard');
        $response->assertRedirect('/login');
    }

    public function test_dashboard_renders_with_monitoring_props(): void
    {
        $user = $this->makeUser('pemohon');

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->has('totalSurat')
            ->has('statusStats')
            ->has('kategoriStats')
            ->has('scopeStats')
            ->has('recentSurat')
            ->has('needsAction')
            ->has('onDutyToday')
            ->has('upcomingTrips')
            ->has('urgentPending')
            ->has('recentActivities')
            ->where('userRole', 'pemohon')
            ->where('authUserId', $user->id)
        );
    }

    public function test_dashboard_categorizes_active_duty_and_urgent_trips(): void
    {
        $pemohon = $this->makeUser('pemohon');
        $kapus = $this->makeUser('kapus');
        $today = now()->toDateString();

        // 1. Surat yang sedang aktif dinas hari ini
        $activeSurat = SuratTugas::create([
            'user_id' => $pemohon->id,
            'kategori_perjalanan' => 'DALAM_NEGERI',
            'sumber_asal' => 'EKSTERNAL',
            'nomor_nota' => 'NOTA/1',
            'pengirim_nota' => 'Sespalu',
            'tanggal_nota' => $today,
            'perihal_nota' => 'Dinas Aktif Hari Ini',
            'status' => S::SELESAI_TERBIT,
            'tempat_tujuan' => 'Bandung',
            'tanggal_berangkat' => now()->subDay()->toDateString(),
            'tanggal_kembali' => now()->addDays(2)->toDateString(),
            'durasi_hari' => 4,
            'nomor_st' => 'ST/001/2026',
        ]);

        SuratTugasPegawai::create([
            'surat_tugas_id' => $activeSurat->id,
            'nama' => 'Budi Santoso',
            'nip' => '198001012005011001',
            'pangkat' => 'Penata',
            'golongan' => 'III/c',
            'jabatan' => 'Diplomat Ahli Muda',
            'unit_kerja' => 'Pusdiklat',
            'urutan' => 1,
        ]);

        // 2. Surat mendesak menunggu disposisi Kapus (berangkat besok)
        $urgentSurat = SuratTugas::create([
            'user_id' => $pemohon->id,
            'kategori_perjalanan' => 'DALAM_NEGERI',
            'sumber_asal' => 'EKSTERNAL',
            'nomor_nota' => 'NOTA/2',
            'pengirim_nota' => 'Sespalu',
            'tanggal_nota' => $today,
            'perihal_nota' => 'Dinas Mendesak Berangkat Besok',
            'status' => S::MENUNGGU_DISPOSISI_KAPUS,
            'tempat_tujuan' => 'Surabaya',
            'tanggal_berangkat' => now()->addDay()->toDateString(),
            'tanggal_kembali' => now()->addDays(3)->toDateString(),
            'durasi_hari' => 3,
        ]);

        // Kapus membuka dashboard
        $response = $this->actingAs($kapus)->get('/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->has('onDutyToday', 1)
            ->where('onDutyToday.0.id', $activeSurat->id)
            ->where('onDutyToday.0.tempat_tujuan', 'Bandung')
            ->has('urgentPending', 1)
            ->where('urgentPending.0.id', $urgentSurat->id)
            ->where('urgentPending.0.tempat_tujuan', 'Surabaya')
        );
    }

    public function test_dashboard_provides_dual_scope_stats_for_persona_toggle(): void
    {
        $user1 = $this->makeUser('pemohon');
        $user2 = $this->makeUser('pemohon');

        // user1 has 2 surat
        SuratTugas::create([
            'user_id' => $user1->id,
            'kategori_perjalanan' => 'DALAM_NEGERI',
            'sumber_asal' => 'INTERNAL',
            'nomor_nota' => 'NOTA/U1-1',
            'pengirim_nota' => 'Sespalu',
            'tanggal_nota' => now()->toDateString(),
            'perihal_nota' => 'Surat User 1',
            'status' => S::DRAFT,
        ]);
        SuratTugas::create([
            'user_id' => $user1->id,
            'kategori_perjalanan' => 'LUAR_NEGERI',
            'sumber_asal' => 'INTERNAL',
            'nomor_nota' => 'NOTA/U1-2',
            'pengirim_nota' => 'Sespalu',
            'tanggal_nota' => now()->toDateString(),
            'perihal_nota' => 'Surat User 1 Kedua',
            'status' => S::MENUNGGU_DISPOSISI_KAPUS,
        ]);

        // user2 has 1 surat
        SuratTugas::create([
            'user_id' => $user2->id,
            'kategori_perjalanan' => 'DALAM_NEGERI',
            'sumber_asal' => 'INTERNAL',
            'nomor_nota' => 'NOTA/U2-1',
            'pengirim_nota' => 'Sespalu',
            'tanggal_nota' => now()->toDateString(),
            'perihal_nota' => 'Surat User 2',
            'status' => S::SELESAI_TERBIT,
        ]);

        $response = $this->actingAs($user1)->get('/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->where('scopeStats.global.totalSurat', 3)
            ->where('scopeStats.personal.totalSurat', 2)
        );
    }

    public function test_dashboard_provides_activity_feed(): void
    {
        $tu = $this->makeUser('tu');
        $pemohon = $this->makeUser('pemohon');

        $surat = SuratTugas::create([
            'user_id' => $pemohon->id,
            'kategori_perjalanan' => 'DALAM_NEGERI',
            'sumber_asal' => 'INTERNAL',
            'nomor_nota' => 'NOTA/TU-1',
            'pengirim_nota' => 'Sespalu',
            'tanggal_nota' => now()->toDateString(),
            'perihal_nota' => 'Surat Resmi Terbit',
            'status' => S::SELESAI_TERBIT,
            'nomor_st' => 'ST/099/Pusdiklat/2026',
            'nomor_spd' => '120/SPD/2026',
            'tanggal_surat' => now()->toDateString(),
        ]);

        SuratTugasLog::create([
            'surat_tugas_id' => $surat->id,
            'user_id' => $tu->id,
            'aksi' => 'PENOMORAN',
            'dari_status' => S::MENUNGGU_PENOMORAN_TU,
            'ke_status' => S::SELESAI_TERBIT,
            'catatan' => 'Penomoran nomor resmi berhasil',
        ]);

        $response = $this->actingAs($tu)->get('/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->has('recentActivities', 1)
            ->where('recentActivities.0.aksi', 'PENOMORAN')
            ->where('recentActivities.0.catatan', 'Penomoran nomor resmi berhasil')
        );
    }

    public function test_show_provides_running_number_for_tu_and_admin(): void
    {
        $tu = $this->makeUser('tu');
        $pemohon = $this->makeUser('pemohon');

        // Past letter with numbers
        SuratTugas::create([
            'user_id' => $pemohon->id,
            'kategori_perjalanan' => 'DALAM_NEGERI',
            'sumber_asal' => 'INTERNAL',
            'nomor_nota' => 'NOTA/OLD',
            'pengirim_nota' => 'Sespalu',
            'tanggal_nota' => now()->toDateString(),
            'perihal_nota' => 'Surat Sebelumnya',
            'status' => S::SELESAI_TERBIT,
            'nomor_st' => 'ST/088/Pusdiklat/2026',
            'nomor_spd' => '115/SPD/2026',
            'tanggal_surat' => now()->toDateString(),
        ]);

        // Current letter waiting for TU numbering
        $currentSurat = SuratTugas::create([
            'user_id' => $pemohon->id,
            'kategori_perjalanan' => 'DALAM_NEGERI',
            'sumber_asal' => 'INTERNAL',
            'nomor_nota' => 'NOTA/NEW',
            'pengirim_nota' => 'Sespalu',
            'tanggal_nota' => now()->toDateString(),
            'perihal_nota' => 'Surat Baru Menunggu Nomor',
            'status' => S::MENUNGGU_PENOMORAN_TU,
        ]);

        // TU sees runningNumber
        $tuResponse = $this->actingAs($tu)->get("/surat-tugas/{$currentSurat->id}");
        $tuResponse->assertStatus(200);
        $tuResponse->assertInertia(fn (Assert $page) => $page
            ->component('SuratTugas/Show')
            ->where('runningNumber.lastSt.nomor_st', 'ST/088/Pusdiklat/2026')
            ->where('runningNumber.lastSpd.nomor_spd', '115/SPD/2026')
        );

        // Pemohon does not receive runningNumber (null)
        $pemohonResponse = $this->actingAs($pemohon)->get("/surat-tugas/{$currentSurat->id}");
        $pemohonResponse->assertStatus(200);
        $pemohonResponse->assertInertia(fn (Assert $page) => $page
            ->component('SuratTugas/Show')
            ->where('runningNumber', null)
        );
    }
}
