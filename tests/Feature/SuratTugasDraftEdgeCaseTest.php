<?php

namespace Tests\Feature;

use App\Models\SuratTugas;
use App\Models\User;
use App\Models\Pegawai;
use App\Models\Ppk;
use App\Models\TingkatBiaya;
use App\Models\JenisAngkutan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SuratTugasDraftEdgeCaseTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(string $role): User
    {
        $user = User::factory()->create();
        $user->forceFill(['role' => $role])->save();

        return $user->fresh();
    }

    private function makePegawai(): Pegawai
    {
        return Pegawai::create([
            'nama' => 'Diplomat ' . uniqid(),
            'nip' => '1985' . rand(10000000, 99999999),
            'pangkat' => 'Penata Tk I',
            'golongan' => 'III/d',
            'jabatan' => 'Fungsional Diplomat',
            'unit_kerja' => 'Pusdiklat Kemlu',
            'is_active' => true,
        ]);
    }

    private function makePpk(): Ppk
    {
        return Ppk::create([
            'nama' => 'PPK Pusdiklat ' . uniqid(),
            'nip' => '1975' . rand(10000000, 99999999),
            'jabatan' => 'PPK',
            'is_active' => true,
        ]);
    }

    public function test_simpan_draft_baru_step_1_sukses_dan_tersimpan_di_draft_data(): void
    {
        Storage::fake('public');
        $pemohon = $this->makeUser('pemohon');

        $response = $this->actingAs($pemohon)
            ->post(route('surat-tugas.draft.store'), [
                'draft_step' => 1,
                'kategori_perjalanan' => 'DALAM_NEGERI',
                'sumber_asal' => 'EKSTERNAL',
                'nomor_nota' => 'ND-001/Pusdiklat/2026',
                'pengirim_nota' => 'Biro Hukum',
                'tanggal_nota' => '2026-10-15',
                'perihal_nota' => 'Undangan Rapat Koordinasi',
            ]);

        $response->assertRedirect(route('surat-tugas.index'));
        $this->assertDatabaseHas('surat_tugas', [
            'user_id' => $pemohon->id,
            'status' => 'DRAFT',
            'draft_step' => 1,
            'nomor_nota' => 'ND-001/Pusdiklat/2026',
        ]);

        $surat = SuratTugas::where('nomor_nota', 'ND-001/Pusdiklat/2026')->first();
        $this->assertNotNull($surat);
        $this->assertIsArray($surat->draft_data);
        $this->assertEquals('Biro Hukum', $surat->draft_data['pengirim_nota']);
    }

    public function test_update_draft_preserves_attachments_and_actor_subdrafts(): void
    {
        $pemohon = $this->makeUser('pemohon');
        $surat = SuratTugas::create([
            'user_id' => $pemohon->id,
            'kategori_perjalanan' => 'DALAM_NEGERI',
            'sumber_asal' => 'EKSTERNAL',
            'nomor_nota' => 'ND-INITIAL/2026',
            'pengirim_nota' => 'Sekretariat',
            'tanggal_nota' => '2026-10-10',
            'perihal_nota' => 'Undangan Awal',
            'file_undangan' => 'undangan/test.pdf',
            'status' => 'DRAFT',
            'draft_step' => 1,
            'draft_data' => [
                'nomor_nota' => 'ND-INITIAL/2026',
                'file_undangan_name' => 'undangan_resmi.pdf',
                'kapus' => [
                    'kapus_decision' => 'YA',
                    'catatan_kapus' => 'Draft catatan kapus tersimpan sebelumnya',
                ],
            ],
        ]);

        // Pemohon melanjutkan ke Step 2 tanpa mengunggah ulang file_undangan
        $response = $this->actingAs($pemohon)
            ->post(route('surat-tugas.draft.update', $surat->id), [
                'draft_step' => 2,
                'nomor_nota' => 'ND-REVISED/2026',
                'pengirim_nota' => 'Sekretariat Utama',
                'tanggal_nota' => '2026-10-12',
                'perihal_nota' => 'Undangan Revisi',
            ]);

        $response->assertRedirect(route('surat-tugas.index'));
        $surat->refresh();

        $this->assertEquals('undangan/test.pdf', $surat->file_undangan);
        $this->assertEquals(2, $surat->draft_step);
        // Memastikan metadata nama file dan sub-draft kapus tidak terhapus
        $this->assertEquals('undangan_resmi.pdf', $surat->draft_data['file_undangan_name'] ?? null);
        $this->assertArrayHasKey('kapus', $surat->draft_data);
        $this->assertEquals('YA', $surat->draft_data['kapus']['kapus_decision']);
    }

    public function test_draft_kategori_luar_negeri_bisa_disimpan_tanpa_file_setneg_tapi_submit_wajib(): void
    {
        $pemohon = $this->makeUser('pemohon');

        // Saat simpan draft, file_izin_setneg boleh null
        $response = $this->actingAs($pemohon)
            ->post(route('surat-tugas.draft.store'), [
                'draft_step' => 1,
                'kategori_perjalanan' => 'LUAR_NEGERI',
                'sumber_asal' => 'EKSTERNAL',
                'nomor_nota' => 'ND-LN/2026',
                'pengirim_nota' => 'Kedubes',
                'tanggal_nota' => '2026-10-20',
                'perihal_nota' => 'Konferensi Internasional Jenewa',
                'negara_tujuan' => 'Swiss',
            ]);

        $response->assertRedirect(route('surat-tugas.index'));
        $surat = SuratTugas::where('nomor_nota', 'ND-LN/2026')->first();
        $this->assertNotNull($surat);
        $this->assertEquals('LUAR_NEGERI', $surat->kategori_perjalanan);

        // Saat submit note ke Kapus (submitNote), file_izin_setneg wajib untuk LUAR_NEGERI jika belum pernah diunggah
        $submitResponse = $this->actingAs($pemohon)
            ->post(route('surat-tugas.store'), [
                'draft_id' => $surat->id,
                'draft_step' => 1,
                'kategori_perjalanan' => 'LUAR_NEGERI',
                'sumber_asal' => 'EKSTERNAL',
                'nomor_nota' => 'ND-LN/2026',
                'pengirim_nota' => 'Kedubes',
                'tanggal_nota' => '2026-10-20',
                'perihal_nota' => 'Konferensi Internasional Jenewa',
            ]);

        $submitResponse->assertSessionHasErrors(['file_izin_setneg']);
    }

    public function test_penomoran_tu_duplikat_nomor_st_atau_spd_ditolak_validasi(): void
    {
        $pemohon = $this->makeUser('pemohon');
        $tu = $this->makeUser('tu');

        // Surat 1 sudah terbit
        SuratTugas::create([
            'user_id' => $pemohon->id,
            'kategori_perjalanan' => 'DALAM_NEGERI',
            'sumber_asal' => 'EKSTERNAL',
            'nomor_nota' => 'NOTA/EXISTING/01',
            'pengirim_nota' => 'Sespalu',
            'tanggal_nota' => '2026-10-01',
            'perihal_nota' => 'Surat Terbit 1',
            'nomor_st' => 'ST/001/DIK/2026',
            'nomor_spd' => 'SPD/001/DIK/2026',
            'status' => 'SELESAI_TERBIT',
        ]);

        // Surat 2 sedang menunggu penomoran TU
        $surat2 = SuratTugas::create([
            'user_id' => $pemohon->id,
            'kategori_perjalanan' => 'DALAM_NEGERI',
            'sumber_asal' => 'EKSTERNAL',
            'nomor_nota' => 'NOTA/PENDING/02',
            'pengirim_nota' => 'Sespalu',
            'tanggal_nota' => '2026-10-02',
            'perihal_nota' => 'Surat Siap Nomor',
            'status' => 'MENUNGGU_PENOMORAN_TU',
        ]);

        // TU mencoba memakai nomor ST yang sudah ada di Surat 1
        $response = $this->actingAs($tu)
            ->post(route('surat-tugas.penomoran', $surat2->id), [
                'nomor_st' => 'ST/001/DIK/2026', // Duplikat!
                'nomor_spd' => 'SPD/002/DIK/2026',
                'tanggal_surat' => '2026-10-13',
            ]);

        $response->assertSessionHasErrors(['nomor_st']);
        $surat2->refresh();
        $this->assertEquals('MENUNGGU_PENOMORAN_TU', $surat2->status);
        $this->assertNull($surat2->nomor_st);
    }

    public function test_actor_draft_hanya_bisa_disimpan_pada_tahap_aktif_dan_role_sesuai(): void
    {
        $pemohon = $this->makeUser('pemohon');
        $kapus = $this->makeUser('kapus');
        $tu = $this->makeUser('tu');

        $surat = SuratTugas::create([
            'user_id' => $pemohon->id,
            'kategori_perjalanan' => 'DALAM_NEGERI',
            'sumber_asal' => 'EKSTERNAL',
            'nomor_nota' => 'NOTA/DISPOSISI/01',
            'pengirim_nota' => 'Sespalu',
            'tanggal_nota' => '2026-10-10',
            'perihal_nota' => 'Menunggu Disposisi',
            'status' => 'MENUNGGU_DISPOSISI_KAPUS',
        ]);

        // 1. Kapus menyimpan actor-draft berhasil tanpa merubah status utama
        $responseKapus = $this->actingAs($kapus)
            ->post(route('surat-tugas.actor-draft', $surat->id), [
                'actor' => 'kapus',
                'kapus_decision' => 'YA',
                'catatan_kapus' => 'Catatan sementara dari Kapus',
            ]);

        $responseKapus->assertRedirect();
        $surat->refresh();
        $this->assertEquals('MENUNGGU_DISPOSISI_KAPUS', $surat->status);
        $this->assertEquals('YA', $surat->draft_data['kapus']['kapus_decision']);
        $this->assertEquals('Catatan sementara dari Kapus', $surat->draft_data['kapus']['catatan_kapus']);

        // 2. TU mencoba menyimpan actor-draft saat status masih MENUNGGU_DISPOSISI_KAPUS -> 409 Conflict
        $responseTu = $this->actingAs($tu)
            ->post(route('surat-tugas.actor-draft', $surat->id), [
                'actor' => 'tu',
                'nomor_st' => 'ST/TEMP/001',
            ]);
        $responseTu->assertStatus(409);

        // 3. Pemohon mencoba actor-draft -> ditolak middleware role (redirect + flash error untuk web, 403 untuk json)
        $responsePemohon = $this->actingAs($pemohon)
            ->post(route('surat-tugas.actor-draft', $surat->id), [
                'actor' => 'kapus',
                'kapus_decision' => 'YA',
            ]);
        $responsePemohon->assertRedirect(route('surat-tugas.index'));
        $responsePemohon->assertSessionHas('error');

        $this->actingAs($pemohon)
            ->postJson(route('surat-tugas.actor-draft', $surat->id), [
                'actor' => 'kapus',
                'kapus_decision' => 'YA',
            ])
            ->assertStatus(403);
    }

    public function test_draft_edit_hanya_bisa_diakses_oleh_pemilik_atau_admin(): void
    {
        $pemohon1 = $this->makeUser('pemohon');
        $pemohon2 = $this->makeUser('pemohon');
        $admin = $this->makeUser('admin');

        $surat = SuratTugas::create([
            'user_id' => $pemohon1->id,
            'kategori_perjalanan' => 'DALAM_NEGERI',
            'sumber_asal' => 'EKSTERNAL',
            'nomor_nota' => 'NOTA/PEMOHON1/01',
            'pengirim_nota' => 'Sespalu',
            'tanggal_nota' => '2026-10-10',
            'perihal_nota' => 'Draft Milik Pemohon 1',
            'status' => 'DRAFT',
            'draft_step' => 1,
        ]);

        // Pemohon 2 mencoba edit draft Pemohon 1 -> 403 Forbidden
        $this->actingAs($pemohon2)
            ->get(route('surat-tugas.draft.edit', $surat->id))
            ->assertStatus(403);

        // Pemohon 1 boleh edit draft miliknya -> 200 OK
        $this->actingAs($pemohon1)
            ->get(route('surat-tugas.draft.edit', $surat->id))
            ->assertStatus(200);

        // Admin juga boleh edit draft siapapun -> 200 OK
        $this->actingAs($admin)
            ->get(route('surat-tugas.draft.edit', $surat->id))
            ->assertStatus(200);
    }
}
