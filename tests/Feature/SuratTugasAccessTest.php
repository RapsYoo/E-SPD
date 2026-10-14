<?php

namespace Tests\Feature;

use App\Models\JenisAngkutan;
use App\Models\Pegawai;
use App\Models\Ppk;
use App\Models\SuratTugas;
use App\Models\TingkatBiaya;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SuratTugasAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_sespalu_is_redirected_to_the_workflow_and_cannot_open_admin_pages(): void
    {
        $user = User::factory()->create(['role' => 'pemohon']);

        $response = $this->withSession(['url.intended' => '/admin'])
            ->post('/login', ['email' => $user->email, 'password' => 'password']);

        $response->assertRedirect(route('surat-tugas.index'));
        $this->get('/admin')->assertForbidden();
    }

    public function test_kapus_and_tu_cannot_open_the_create_form(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'kapus']))
            ->get(route('surat-tugas.create'))
            ->assertForbidden();

        $this->actingAs(User::factory()->create(['role' => 'tu']))
            ->get(route('surat-tugas.create'))
            ->assertForbidden();
    }

    public function test_admin_login_is_redirected_to_the_admin_dashboard(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->post('/login', ['email' => $admin->email, 'password' => 'password'])
            ->assertRedirect(route('admin.dashboard'));

        $this->get(route('admin.dashboard'))->assertOk();
    }

    public function test_sespalu_can_open_the_create_form(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'sespalu']))
            ->get(route('surat-tugas.create'))
            ->assertOk();
    }

    public function test_sespalu_submits_the_note_for_kapus_review_before_entering_stage_three(): void
    {
        Storage::fake('public');
        $sespalu = User::factory()->create(['role' => 'sespalu']);

        $response = $this->actingAs($sespalu)->post(route('surat-tugas.store'), [
            'kategori_perjalanan' => 'DALAM_NEGERI',
            'sumber_asal' => 'EKSTERNAL',
            'nomor_nota' => 'NOTA-QUEUE-001',
            'pengirim_nota' => 'Unit Pengirim',
            'tanggal_nota' => '2026-10-12',
            'perihal_nota' => 'Tinjauan nota sebelum penyusunan SPD',
            'file_undangan' => UploadedFile::fake()->create('nota.pdf', 20, 'application/pdf'),
        ]);

        $surat = SuratTugas::where('nomor_nota', 'NOTA-QUEUE-001')->firstOrFail();
        $response->assertRedirect(route('surat-tugas.show', $surat));
        $this->assertDatabaseHas('surat_tugas', [
            'id' => $surat->id,
            'status' => 'MENUNGGU_DISPOSISI_KAPUS',
            'draft_step' => 2,
            'ppk_id' => null,
        ]);
        Storage::disk('public')->assertExists($surat->file_undangan);

        $this->actingAs(User::factory()->create(['role' => 'kapus']))
            ->get(route('surat-tugas.index'))
            ->assertOk()
            ->assertSee('NOTA-QUEUE-001');

        $this->actingAs($sespalu)
            ->post(route('surat-tugas.complete', $surat))
            ->assertNotFound();
    }

    public function test_authorized_users_can_preview_or_download_note_attachments(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('undangan/nota.pdf', 'sample-pdf-content');
        Storage::disk('public')->put('setneg/izin.docx', 'sample-docx-content');
        $surat = SuratTugas::create([
            'nomor_nota' => 'NOTA-FILE-001',
            'perihal_nota' => 'Lampiran uji',
            'file_undangan' => 'undangan/nota.pdf',
            'file_izin_setneg' => 'setneg/izin.docx',
            'status' => 'MENUNGGU_DISPOSISI_KAPUS',
        ]);

        $this->actingAs(User::factory()->create(['role' => 'kapus']))
            ->get(route('surat-tugas.attachment', [$surat, 'undangan']))
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf')
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertStreamedContent('sample-pdf-content');

        $this->actingAs(User::factory()->create(['role' => 'kapus']))
            ->get(route('surat-tugas.attachment', [$surat, 'setneg']))
            ->assertOk()
            ->assertDownload('izin.docx')
            ->assertStreamedContent('sample-docx-content');

        $this->get(route('surat-tugas.attachment', [$surat, 'not-a-lampiran']))
            ->assertNotFound();
    }

    public function test_users_cannot_access_another_users_draft_attachment(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('undangan/draft.pdf', 'private-content');
        $surat = SuratTugas::create([
            'user_id' => User::factory()->create(['role' => 'sespalu'])->id,
            'nomor_nota' => 'NOTA-DRAFT-001',
            'file_undangan' => 'undangan/draft.pdf',
            'status' => 'DRAFT',
        ]);

        $this->actingAs(User::factory()->create(['role' => 'kapus']))
            ->get(route('surat-tugas.attachment', [$surat, 'undangan']))
            ->assertNotFound();
    }

    public function test_index_shows_status_summaries_scoped_to_each_users_visible_documents(): void
    {
        $owner = User::factory()->create(['role' => 'sespalu']);
        $anotherOwner = User::factory()->create(['role' => 'sespalu']);
        foreach ([
            ['MENUNGGU_DISPOSISI_KAPUS', null],
            ['DISPOSISI_KAPUS_YA', null],
            ['DISPOSISI_KAPUS_REVISI', null],
            ['DISPOSISI_KAPUS_STOP', null],
            ['MENUNGGU_PENOMORAN_TU', null],
            ['SELESAI_TERBIT', null],
            ['DRAFT', $owner->id],
            ['DRAFT', $anotherOwner->id],
        ] as [$status, $userId]) {
            SuratTugas::create([
                'user_id' => $userId,
                'status' => $status,
                'nomor_nota' => 'NOTA-'.$status.'-'.$userId,
                'perihal_nota' => 'Pengajuan '.$status,
            ]);
        }

        $kapusResponse = $this->actingAs(User::factory()->create(['role' => 'kapus']))
            ->get(route('surat-tugas.index'))
            ->assertOk();
        $this->assertSame([
            'total' => 6,
            'waiting_kapus' => 1,
            'in_progress' => 3,
            'published' => 1,
        ], $kapusResponse->inertiaProps('statusSummary'));

        $sespaluResponse = $this->actingAs($owner)
            ->get(route('surat-tugas.index'))
            ->assertOk();
        $this->assertSame([
            'total' => 7,
            'waiting_kapus' => 1,
            'in_progress' => 3,
            'published' => 1,
        ], $sespaluResponse->inertiaProps('statusSummary'));

        $filteredResponse = $this->actingAs(User::factory()->create(['role' => 'tu']))
            ->get(route('surat-tugas.index', ['status' => 'DALAM_PROSES']))
            ->assertOk();
        $filteredStatuses = array_column($filteredResponse->inertiaProps('suratTugas.data'), 'status');
        sort($filteredStatuses);
        $this->assertSame([
            'DISPOSISI_KAPUS_REVISI',
            'DISPOSISI_KAPUS_YA',
            'MENUNGGU_PENOMORAN_TU',
        ], $filteredStatuses);
    }

    public function test_only_sespalu_can_create_and_resume_its_own_drafts(): void
    {
        $owner = User::factory()->create(['role' => 'sespalu']);

        $response = $this->actingAs($owner)
            ->post(route('surat-tugas.draft'), [
                'draft_step' => 3,
                'nomor_nota' => 'NOTA-001',
                'perihal_nota' => 'Rapat koordinasi',
            ])
            ->assertRedirect();

        $draft = SuratTugas::where('user_id', $owner->id)->where('status', 'DRAFT')->firstOrFail();
        $this->assertSame('NOTA-001', $draft->nomor_nota);
        $response->assertRedirect(route('surat-tugas.create', ['draft_id' => $draft->id]));

        $this->post(route('surat-tugas.draft'), [
            'draft_id' => $draft->id,
            'draft_step' => 3,
            'nomor_nota' => 'NOTA-001',
            'perihal_nota' => 'Rapat koordinasi diperbarui',
        ])->assertRedirect();
        $this->assertSame(1, SuratTugas::where('user_id', $owner->id)->where('status', 'DRAFT')->count());
        $this->assertSame('Rapat koordinasi diperbarui', $draft->fresh()->perihal_nota);

        $otherUser = User::factory()->create(['role' => 'sespalu']);
        $this->actingAs($otherUser)
            ->get(route('surat-tugas.create', ['draft_id' => $draft->id]))
            ->assertNotFound();

        $this->actingAs(User::factory()->create(['role' => 'tu']))
            ->post(route('surat-tugas.draft'), ['draft_step' => 1])
            ->assertForbidden();
    }

    public function test_kapus_approves_and_tu_numbers_while_admin_can_perform_both_actions(): void
    {
        $owner = User::factory()->create(['role' => 'sespalu']);
        $surat = SuratTugas::create([
            'user_id' => $owner->id,
            'nomor_nota' => 'NOTA-002',
            'perihal_nota' => 'Perjalanan dinas',
            'file_undangan' => 'undangan/nota.pdf',
            'status' => 'MENUNGGU_DISPOSISI_KAPUS',
        ]);

        $this->actingAs($owner)
            ->post(route('surat-tugas.penomoran', $surat), [
                'nomor_st' => 'ST-999',
                'nomor_spd' => 'SPD-999',
                'tanggal_surat' => '2026-10-12',
            ])
            ->assertForbidden();
        $this->assertDatabaseHas('surat_tugas', [
            'id' => $surat->id,
            'status' => 'MENUNGGU_DISPOSISI_KAPUS',
            'nomor_st' => null,
        ]);

        $this->actingAs(User::factory()->create(['role' => 'kapus']))
            ->post(route('surat-tugas.disposisi', $surat), [
                'kapus_decision' => 'YA',
                'catatan_kapus' => 'Disetujui',
            ])
            ->assertRedirect();
        $this->assertDatabaseHas('surat_tugas', [
            'id' => $surat->id,
            'status' => 'DISPOSISI_KAPUS_YA',
        ]);

        $this->actingAs($owner)
            ->get(route('surat-tugas.create', ['workflow_id' => $surat->id]))
            ->assertOk();

        $ppk = Ppk::create(['nama' => 'PPK Uji', 'nip' => '198000000000000001']);
        TingkatBiaya::create(['kode' => 'C', 'nama' => 'Tingkat C']);
        JenisAngkutan::create(['kode' => 'DARAT', 'nama' => 'Perjalanan Darat']);
        $pegawai = Pegawai::create([
            'nama' => 'Pegawai Uji',
            'nip' => '198000000000000002',
            'pangkat' => 'Penata',
            'golongan' => 'III/c',
            'jabatan' => 'Analis',
        ]);
        $pegawaiKedua = Pegawai::create([
            'nama' => 'Pegawai Uji Kedua',
            'nip' => '198000000000000003',
            'pangkat' => 'Penata',
            'golongan' => 'III/c',
            'jabatan' => 'Analis',
        ]);

        $this->actingAs($owner)
            ->post(route('surat-tugas.complete', $surat), [
                'kategori_perjalanan' => 'DALAM_NEGERI',
                'sumber_asal' => 'EKSTERNAL',
                'nomor_nota' => 'NOTA-002',
                'pengirim_nota' => 'Unit Pengirim',
                'tanggal_nota' => '2026-10-12',
                'perihal_nota' => 'Perjalanan dinas',
                'ppk_id' => $ppk->id,
                'tingkat_biaya_kode' => 'C',
                'jenis_angkutan_nama' => 'Perjalanan Darat',
                'tempat_berangkat' => 'Jakarta',
                'tempat_tujuan' => 'Bandung',
                'pegawai_ids' => [$pegawai->id, $pegawaiKedua->id],
                'pegawai_tanggal' => [
                    $pegawai->id => [
                        'tanggal_berangkat' => '2026-10-20',
                        'tanggal_kembali' => '2026-10-21',
                    ],
                    $pegawaiKedua->id => [
                        'tanggal_berangkat' => '2026-10-22',
                        'tanggal_kembali' => '2026-10-24',
                    ],
                ],
            ])
            ->assertRedirect(route('surat-tugas.show', $surat));
        $this->assertDatabaseHas('surat_tugas', [
            'id' => $surat->id,
            'status' => 'MENUNGGU_PENOMORAN_TU',
            'kapus_decision' => 'YA',
            'tanggal_berangkat' => '2026-10-20',
            'tanggal_kembali' => '2026-10-24',
            'durasi_hari' => 5,
        ]);
        $this->assertDatabaseHas('surat_tugas_pegawai', [
            'surat_tugas_id' => $surat->id,
            'pegawai_id' => $pegawai->id,
            'tanggal_berangkat' => '2026-10-20',
            'tanggal_kembali' => '2026-10-21',
        ]);
        $this->assertDatabaseHas('surat_tugas_pegawai', [
            'surat_tugas_id' => $surat->id,
            'pegawai_id' => $pegawaiKedua->id,
            'tanggal_berangkat' => '2026-10-22',
            'tanggal_kembali' => '2026-10-24',
        ]);
        $this->assertDatabaseHas('surat_tugas_biaya', [
            'surat_tugas_id' => $surat->id,
            'surat_tugas_pegawai_id' => $surat->pegawaiList()->where('pegawai_id', $pegawaiKedua->id)->value('id'),
            'uang_harian_hari' => 3,
        ]);

        $this->actingAs(User::factory()->create(['role' => 'tu']))
            ->post(route('surat-tugas.penomoran', $surat), [
                'nomor_st' => 'ST-001',
                'nomor_spd' => 'SPD-001',
                'tanggal_surat' => '2026-10-12',
            ])
            ->assertRedirect();
        $this->assertDatabaseHas('surat_tugas', [
            'id' => $surat->id,
            'status' => 'SELESAI_TERBIT',
            'nomor_st' => 'ST-001',
            'nomor_spd' => 'SPD-001',
        ]);

        $anotherSurat = SuratTugas::create([
            'user_id' => $owner->id,
            'nomor_nota' => 'NOTA-003',
            'perihal_nota' => 'Perjalanan dinas lain',
            'status' => 'MENUNGGU_PENOMORAN_TU',
        ]);
        $this->actingAs(User::factory()->create(['role' => 'admin']))
            ->post(route('surat-tugas.penomoran', $anotherSurat), [
                'nomor_st' => 'ST-002',
                'nomor_spd' => 'SPD-002',
                'tanggal_surat' => '2026-10-12',
            ])
            ->assertRedirect();
        $this->assertDatabaseHas('surat_tugas', [
            'id' => $anotherSurat->id,
            'status' => 'SELESAI_TERBIT',
            'nomor_st' => 'ST-002',
        ]);
    }

    public function test_draft_saves_individual_travel_dates_for_each_participant(): void
    {
        $owner = User::factory()->create(['role' => 'sespalu']);
        $pegawai = Pegawai::create([
            'nama' => 'Pegawai Draft',
            'nip' => '198000000000000004',
            'pangkat' => 'Penata',
            'golongan' => 'III/c',
            'jabatan' => 'Analis',
        ]);

        $this->actingAs($owner)
            ->post(route('surat-tugas.draft'), [
                'draft_step' => 3,
                'pegawai_ids' => [$pegawai->id],
                'pegawai_tanggal' => [
                    $pegawai->id => [
                        'tanggal_berangkat' => '2026-11-10',
                        'tanggal_kembali' => '2026-11-12',
                    ],
                ],
            ])
            ->assertRedirect();

        $draft = SuratTugas::where('user_id', $owner->id)->where('status', 'DRAFT')->firstOrFail();
        $this->assertDatabaseHas('surat_tugas_pegawai', [
            'surat_tugas_id' => $draft->id,
            'pegawai_id' => $pegawai->id,
            'tanggal_berangkat' => '2026-11-10',
            'tanggal_kembali' => '2026-11-12',
        ]);

        $this->post(route('surat-tugas.draft'), [
            'draft_id' => $draft->id,
            'draft_step' => 3,
            'pegawai_ids' => [$pegawai->id],
            'pegawai_tanggal' => [
                $pegawai->id => [
                    'tanggal_berangkat' => '2026-11-11',
                    'tanggal_kembali' => '2026-11-13',
                ],
            ],
        ])->assertRedirect();

        $this->assertDatabaseHas('surat_tugas_pegawai', [
            'surat_tugas_id' => $draft->id,
            'pegawai_id' => $pegawai->id,
            'tanggal_berangkat' => '2026-11-11',
            'tanggal_kembali' => '2026-11-13',
        ]);

        $this->post(route('surat-tugas.draft'), [
            'draft_id' => $draft->id,
            'draft_step' => 3,
            'pegawai_ids_provided' => '1',
        ])->assertRedirect();

        $this->assertDatabaseMissing('surat_tugas_pegawai', [
            'surat_tugas_id' => $draft->id,
            'pegawai_id' => $pegawai->id,
        ]);
        $this->assertDatabaseHas('surat_tugas', [
            'id' => $draft->id,
            'tanggal_berangkat' => null,
            'tanggal_kembali' => null,
        ]);
    }

    public function test_completion_rejects_a_participant_return_date_before_departure(): void
    {
        $owner = User::factory()->create(['role' => 'sespalu']);
        $surat = SuratTugas::create([
            'user_id' => $owner->id,
            'nomor_nota' => 'NOTA-TANGGAL-001',
            'perihal_nota' => 'Perjalanan dinas',
            'file_undangan' => 'undangan/nota.pdf',
            'status' => 'DISPOSISI_KAPUS_YA',
        ]);
        $ppk = Ppk::create(['nama' => 'PPK Uji', 'nip' => '198000000000000005']);
        TingkatBiaya::create(['kode' => 'C', 'nama' => 'Tingkat C']);
        JenisAngkutan::create(['kode' => 'DARAT', 'nama' => 'Perjalanan Darat']);
        $pegawai = Pegawai::create([
            'nama' => 'Pegawai Uji',
            'nip' => '198000000000000006',
            'pangkat' => 'Penata',
            'golongan' => 'III/c',
            'jabatan' => 'Analis',
        ]);

        $response = $this->actingAs($owner)
            ->post(route('surat-tugas.complete', $surat), [
                'kategori_perjalanan' => 'DALAM_NEGERI',
                'sumber_asal' => 'EKSTERNAL',
                'nomor_nota' => 'NOTA-TANGGAL-001',
                'pengirim_nota' => 'Unit Pengirim',
                'tanggal_nota' => '2026-10-12',
                'perihal_nota' => 'Perjalanan dinas',
                'ppk_id' => $ppk->id,
                'tingkat_biaya_kode' => 'C',
                'jenis_angkutan_nama' => 'Perjalanan Darat',
                'tempat_berangkat' => 'Jakarta',
                'tempat_tujuan' => 'Bandung',
                'pegawai_ids' => [$pegawai->id],
                'pegawai_tanggal' => [
                    $pegawai->id => [
                        'tanggal_berangkat' => '2026-10-20',
                        'tanggal_kembali' => '2026-10-19',
                    ],
                ],
            ]);

        $response->assertSessionHasErrors(["pegawai_tanggal.{$pegawai->id}.tanggal_kembali"]);
        $this->assertDatabaseHas('surat_tugas', [
            'id' => $surat->id,
            'status' => 'DISPOSISI_KAPUS_YA',
        ]);
    }
}
