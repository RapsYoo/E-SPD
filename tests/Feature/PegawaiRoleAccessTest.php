<?php

namespace Tests\Feature;

use App\Models\Pegawai;
use App\Models\SuratTugas;
use App\Models\SuratTugasPegawai;
use App\Models\User;
use App\Support\SuratTugasStatus as S;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PegawaiRoleAccessTest extends TestCase
{
    use RefreshDatabase;

    private function makePegawaiUser(string $nama): array
    {
        $pegawai = Pegawai::create([
            'nama' => $nama,
            'nip' => fake()->unique()->numerify('##################'),
            'pangkat' => 'Penata',
            'golongan' => 'III/c',
            'jabatan' => 'Diplomat Ahli Muda',
            'unit_kerja' => 'Pusdiklat Kemlu',
            'is_active' => true,
        ]);

        $user = User::factory()->create(['name' => $nama, 'pegawai_id' => $pegawai->id]);
        $user->forceFill(['role' => 'pegawai'])->save();

        return [$user->fresh(), $pegawai];
    }

    private function makeSurat(Pegawai $pegawai, string $tujuan, string $status = S::SELESAI_TERBIT): SuratTugas
    {
        $pemohon = User::factory()->create();

        $surat = SuratTugas::create([
            'user_id' => $pemohon->id,
            'kategori_perjalanan' => 'DALAM_NEGERI',
            'sumber_asal' => 'EKSTERNAL',
            'nomor_nota' => 'NOTA/'.$tujuan,
            'pengirim_nota' => 'Sespalu',
            'tanggal_nota' => now()->toDateString(),
            'perihal_nota' => 'Dinas ke '.$tujuan,
            'status' => $status,
            'tempat_tujuan' => $tujuan,
            'tanggal_berangkat' => now()->addDays(5)->toDateString(),
            'tanggal_kembali' => now()->addDays(7)->toDateString(),
            'durasi_hari' => 3,
            'nomor_st' => 'ST/'.$tujuan,
        ]);

        SuratTugasPegawai::create([
            'surat_tugas_id' => $surat->id,
            'pegawai_id' => $pegawai->id,
            'nama' => $pegawai->nama,
            'nip' => $pegawai->nip,
            'pangkat' => 'Penata',
            'golongan' => 'III/c',
            'jabatan' => 'Diplomat Ahli Muda',
            'unit_kerja' => 'Pusdiklat Kemlu',
            'urutan' => 1,
        ]);

        return $surat;
    }

    public function test_pegawai_dashboard_only_lists_own_trips(): void
    {
        [$userA, $pegawaiA] = $this->makePegawaiUser('Pegawai A');
        [, $pegawaiB] = $this->makePegawaiUser('Pegawai B');
        $suratA = $this->makeSurat($pegawaiA, 'Semarang');
        $this->makeSurat($pegawaiB, 'Bogor');

        $response = $this->actingAs($userA)->get('/dashboard');
        $response->assertInertia(fn (Assert $page) => $page
            ->component('DashboardPegawai')
            ->has('trips', 1)
            ->where('trips.0.id', $suratA->id)
            ->where('trips.0.tempat_tujuan', 'Semarang')
            ->where('summary.total', 1)
            ->where('summary.akan_datang', 1)
        );
    }

    public function test_pegawai_list_and_detail_are_limited_to_own_trips(): void
    {
        [$userA, $pegawaiA] = $this->makePegawaiUser('Pegawai A');
        [, $pegawaiB] = $this->makePegawaiUser('Pegawai B');
        $suratA = $this->makeSurat($pegawaiA, 'Semarang');
        $suratB = $this->makeSurat($pegawaiB, 'Bogor');

        $this->actingAs($userA)->get('/surat-tugas')->assertInertia(fn (Assert $page) => $page
            ->has('suratTugas.data', 1)
            ->where('suratTugas.data.0.id', $suratA->id)
        );

        $this->actingAs($userA)->get("/surat-tugas/{$suratA->id}")->assertOk();
        $this->actingAs($userA)->get("/surat-tugas/{$suratB->id}")->assertForbidden();
    }

    public function test_pegawai_can_print_own_trip_but_not_others(): void
    {
        [$userA, $pegawaiA] = $this->makePegawaiUser('Pegawai A');
        [, $pegawaiB] = $this->makePegawaiUser('Pegawai B');
        $suratA = $this->makeSurat($pegawaiA, 'Semarang');
        $suratB = $this->makeSurat($pegawaiB, 'Bogor');

        $this->actingAs($userA)->get("/surat-tugas/{$suratA->id}/cetak")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('SuratTugas/Print'));

        $this->actingAs($userA)->get("/surat-tugas/{$suratB->id}/cetak")
            ->assertRedirect(route('surat-tugas.show', $suratB->id));
    }

    public function test_pegawai_cannot_see_trip_that_is_not_yet_issued(): void
    {
        [$userA, $pegawaiA] = $this->makePegawaiUser('Pegawai A');
        $draft = $this->makeSurat($pegawaiA, 'Semarang', S::MENUNGGU_DISPOSISI_KAPUS);

        $this->actingAs($userA)->get("/surat-tugas/{$draft->id}")->assertForbidden();
        $this->actingAs($userA)->get('/surat-tugas')->assertInertia(fn (Assert $page) => $page
            ->has('suratTugas.data', 0)
        );
    }

    public function test_pegawai_can_read_but_not_modify_pegawai_database(): void
    {
        [$userA, $pegawaiA] = $this->makePegawaiUser('Pegawai A');

        $this->actingAs($userA)->get('/pegawai')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Pegawai/Index')
        );

        $this->actingAs($userA)->get('/admin/pegawai')->assertRedirect();
        $this->actingAs($userA)->post('/admin/pegawai', ['nama' => 'X'])->assertRedirect();
        $this->actingAs($userA)->delete("/admin/pegawai/{$pegawaiA->id}")->assertRedirect();
        $this->assertDatabaseHas('pegawai', ['id' => $pegawaiA->id]);
    }

    public function test_pegawai_cannot_create_surat_or_act_on_workflow(): void
    {
        [$userA, $pegawaiA] = $this->makePegawaiUser('Pegawai A');
        $surat = $this->makeSurat($pegawaiA, 'Semarang');

        $this->actingAs($userA)->get('/surat-tugas/create')->assertRedirect();
        $this->actingAs($userA)->post("/surat-tugas/{$surat->id}/sign-ppk")->assertRedirect();
        $this->actingAs($userA)->delete("/surat-tugas/{$surat->id}")->assertRedirect();
        $this->assertNotSoftDeleted('surat_tugas', ['id' => $surat->id]);
    }

    public function test_directory_is_not_available_to_other_roles(): void
    {
        $pemohon = User::factory()->create();

        $this->actingAs($pemohon)->get('/pegawai')->assertRedirect();
    }
}
