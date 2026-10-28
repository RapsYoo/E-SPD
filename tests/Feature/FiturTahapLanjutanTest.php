<?php

namespace Tests\Feature;

use App\Models\JenisAngkutan;
use App\Models\Pegawai;
use App\Models\SuratTugas;
use App\Models\SuratTugasPegawai;
use App\Models\TingkatBiaya;
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

    public function test_ready_to_print_and_completed_letters_do_not_change_when_kapus_or_pegawai_updated_in_db(): void
    {
        $admin = $this->userWithRole('admin');

        $pegawaiKapusLama = Pegawai::create([
            'nama' => 'Dr. Kapus Lama, M.Si.',
            'nip' => '197001011995031001',
            'pangkat' => 'Pembina Utama Muda',
            'golongan' => 'IV/c',
            'jabatan' => 'Kepala Pusat Pendidikan dan Pelatihan',
            'unit_kerja' => 'Pusdiklat Kemlu',
            'is_active' => true,
        ]);
        $kapusUser = User::factory()->create([
            'name' => $pegawaiKapusLama->nama,
            'pegawai_id' => $pegawaiKapusLama->id,
        ]);
        $kapusUser->forceFill(['role' => 'kapus'])->save();

        $pegawaiPelaksana = Pegawai::create([
            'nama' => 'Ahmad Pelaksana',
            'nip' => '198802022015031002',
            'pangkat' => 'Penata',
            'golongan' => 'III/c',
            'jabatan' => 'Analis Diklat',
            'unit_kerja' => 'Pusdiklat Kemlu',
            'is_active' => true,
        ]);

        // 1. Surat berstatus MENUNGGU_DISPOSISI_KAPUS -> Disetujui oleh Kapus Lama
        $surat = $this->makeSurat($admin, S::MENUNGGU_DISPOSISI_KAPUS);
        $this->actingAs($kapusUser)->post("/surat-tugas/{$surat->id}/disposisi", [
            'kapus_decision' => 'YA',
            'catatan_kapus' => 'Setuju lanjutkan',
        ])->assertRedirect();

        // Snapshot Kapus sudah langsung terkunci sejak disposisi YA
        $surat->refresh();
        $this->assertSame('Dr. Kapus Lama, M.Si.', $surat->kapus_nama_snapshot);
        $this->assertSame('197001011995031001', $surat->kapus_nip_snapshot);

        // Simulasikan surat masuk ke tahap siap cetak (MENUNGGU_PENOMORAN_TU) beserta personel
        $surat->update(['status' => S::MENUNGGU_PENOMORAN_TU]);
        SuratTugasPegawai::create([
            'surat_tugas_id' => $surat->id,
            'pegawai_id' => $pegawaiPelaksana->id,
            'nama' => $pegawaiPelaksana->nama,
            'nip' => $pegawaiPelaksana->nip,
            'pangkat' => $pegawaiPelaksana->pangkat,
            'golongan' => $pegawaiPelaksana->golongan,
            'jabatan' => $pegawaiPelaksana->jabatan,
            'unit_kerja' => $pegawaiPelaksana->unit_kerja,
            'urutan' => 1,
        ]);

        // 2. Sekarang ubah nama Kapus & jabatan pegawai pelaksana di DB Master Pegawai
        $pegawaiKapusLama->update([
            'nama' => 'Prof. Kapus Baru Pengganti',
            'nip' => '198009092005011009',
        ]);
        $kapusUser->update(['name' => 'Prof. Kapus Baru Pengganti']);
        $pegawaiPelaksana->update([
            'nama' => 'Ahmad Nama Baru',
            'jabatan' => 'Kepala Bagian Umum',
        ]);

        // 3. Saat dicetak pada status MENUNGGU_PENOMORAN_TU (siap cetak), data surat TIDAK berubah
        $this->actingAs($admin)
            ->get("/surat-tugas/{$surat->id}/cetak")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('SuratTugas/Print')
                ->where('kapus.nama', 'Dr. Kapus Lama, M.Si.')
                ->where('kapus.nip', '197001011995031001')
                ->where('suratTugas.pegawai_list.0.nama', 'Ahmad Pelaksana')
                ->where('suratTugas.pegawai_list.0.jabatan', 'Analis Diklat'));

        // 4. Saat TU menerbitkan nomor resmi (SELESAI_TERBIT), snapshot Kapus Lama tetap dipertahankan
        $this->actingAs($admin)->post("/surat-tugas/{$surat->id}/penomoran", [
            'nomor_st' => 'ST/999/2026',
            'nomor_spd' => 'SPD/999/2026',
            'tanggal_surat' => now()->toDateString(),
        ])->assertRedirect();

        $this->actingAs($admin)
            ->get("/surat-tugas/{$surat->id}/cetak")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('SuratTugas/Print')
                ->where('kapus.nama', 'Dr. Kapus Lama, M.Si.')
                ->where('kapus.nip', '197001011995031001'));
    }

    public function test_tahap_3_draft_personel_dan_spd_dapat_dikirim_tanpa_tanggal_surat(): void
    {
        $sespalu = $this->userWithRole('sespalu');
        $ppk = $this->userWithRole('ppk');

        TingkatBiaya::create(['kode' => 'C', 'nama' => 'Tingkat C', 'deskripsi' => 'Gol III']);
        JenisAngkutan::create(['kode' => 'DARAT', 'nama' => 'Perjalanan Darat']);

        $pegawai = Pegawai::create([
            'nama' => 'Abdul Kadir Jailani',
            'nip' => '196603181993031001',
            'pangkat' => 'Pembina Utama',
            'golongan' => 'IV/e',
            'jabatan' => 'Direktur Jenderal Asia Pasifik dan Afrika',
            'unit_kerja' => 'Pusdiklat',
        ]);

        $surat = SuratTugas::create([
            'user_id' => $sespalu->id,
            'kategori_perjalanan' => 'DALAM_NEGERI',
            'sumber_asal' => 'EKSTERNAL',
            'nomor_nota' => 'NOTA/321',
            'pengirim_nota' => 'Testing',
            'tanggal_nota' => '2026-10-28',
            'perihal_nota' => 'tester',
            'status' => S::DISPOSISI_KAPUS_YA,
            'kapus_decision' => 'YA',
        ]);

        $this->actingAs($sespalu)
            ->get("/surat-tugas/{$surat->id}/draft")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('SuratTugas/Create')
                ->where('draftData.tanggal_nota', '2026-10-28'));

        $response = $this->actingAs($sespalu)->post('/surat-tugas', [
            'draft_id' => $surat->id,
            'draft_step' => 3,
            'kategori_perjalanan' => 'DALAM_NEGERI',
            'sumber_asal' => 'EKSTERNAL',
            'nomor_nota' => 'NOTA/321',
            'pengirim_nota' => 'Testing',
            'tanggal_nota' => '2026-10-28T00:00:00.000000Z',
            'perihal_nota' => 'tester',
            'ppk_id' => $ppk->id,
            'tingkat_biaya_kode' => 'C',
            'jenis_angkutan_nama' => 'Perjalanan Darat',
            'tempat_berangkat' => 'Jakarta',
            'tempat_tujuan' => 'Bandung',
            'tanggal_berangkat' => '2026-10-29',
            'tanggal_kembali' => '2026-10-31',
            'durasi_hari' => 3,
            'tanggal_surat' => '',
            'pegawai_ids' => [$pegawai->id],
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect("/surat-tugas/{$surat->id}");

        $surat->refresh();
        $this->assertSame(S::MENUNGGU_PENOMORAN_TU, $surat->status);
        $this->assertSame('2026-10-28', $surat->getRawOriginal('tanggal_nota'));
        $this->assertNull($surat->tanggal_surat);
        $this->assertCount(1, $surat->pegawaiList);
    }
}
