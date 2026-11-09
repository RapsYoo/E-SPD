<?php

namespace Tests\Feature;

use App\Models\Pegawai;
use App\Models\SuratTugas;
use App\Models\SuratTugasPegawai;
use App\Models\TiketPerjalanan;
use App\Models\User;
use App\Support\SuratTugasStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DprWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_uploads_expense_evidence_for_assigned_ppk_approval(): void
    {
        Storage::fake('local');
        $ppk = $this->makeUser('ppk');
        [$employee, $suratTugas, $peserta] = $this->makeTrip($ppk);

        $this->actingAs($employee)->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('DashboardPegawai')
                ->has('trips', 1)
                ->where('trips.0.dpr_status', SuratTugasPegawai::DPR_DRAFT)
                ->where('trips.0.is_completed', true)
            );

        $this->actingAs($employee)->get(route('pegawai.pengeluaran-rill', $suratTugas))
            ->assertInertia(fn (Assert $page) => $page->component('Pegawai/PengeluaranRill'));

        $this->actingAs($employee)->from(route('dashboard'))->post(route('pegawai.tiket.store', $suratTugas), [
            'tickets' => [UploadedFile::fake()->create('tiket-perjalanan.pdf', 200, 'application/pdf')],
        ])->assertRedirect(route('dashboard'));

        $peserta->refresh();
        $this->assertSame(SuratTugasPegawai::DPR_PENDING_APPROVAL, $peserta->dpr_status);
        $this->assertNotNull($peserta->dpr_submitted_at);
        $this->assertDatabaseCount('tiket_perjalanan', 1);
        Storage::disk('local')->assertExists(TiketPerjalanan::firstOrFail()->file_path);

        $this->actingAs($ppk)->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->has('pendingDprs', 1)
                ->where('pendingDprs.0.participant_id', $peserta->id)
                ->where('pendingDprs.0.surat_tugas_id', $suratTugas->id)
                ->has('pendingDprs.0.tickets', 1)
                ->where('notifications.count', 2)
                ->where('notifications.items.0.message', 'DPR '.$peserta->nama.' menunggu persetujuan Anda')
            );

        $ticket = TiketPerjalanan::firstOrFail();
        $this->actingAs($ppk)->get(route('ppk.dpr.ticket.download', [$suratTugas, $peserta, $ticket]))
            ->assertDownload('tiket-perjalanan.pdf');

        $this->actingAs($ppk)->from(route('dashboard'))->post(route('ppk.dpr.approve', [$suratTugas, $peserta]))
            ->assertRedirect(route('dashboard'));

        $peserta->refresh();
        $this->assertSame(SuratTugasPegawai::DPR_APPROVED, $peserta->dpr_status);
        $this->assertSame($ppk->id, $peserta->dpr_approved_by);
        $this->assertNotNull($peserta->dpr_approved_at);
        $this->assertDatabaseHas('surat_tugas_logs', [
            'surat_tugas_id' => $suratTugas->id,
            'aksi' => 'DPR_DISETUJUI',
        ]);
        $this->actingAs($ppk)->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page->has('pendingDprs', 0));
    }

    public function test_only_assigned_ppk_can_view_or_approve_submitted_dpr(): void
    {
        Storage::fake('local');
        $assignedPpk = $this->makeUser('ppk');
        $otherPpk = $this->makeUser('ppk');
        [$employee, $suratTugas, $peserta] = $this->makeTrip($assignedPpk);

        $this->actingAs($employee)->post(route('pegawai.tiket.store', $suratTugas), [
            'tickets' => [UploadedFile::fake()->create('struk.pdf', 200, 'application/pdf')],
        ])->assertRedirect();

        $ticket = TiketPerjalanan::firstOrFail();
        $this->actingAs($otherPpk)->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page->has('pendingDprs', 0));
        $this->actingAs($otherPpk)->get(route('ppk.dpr.ticket.download', [$suratTugas, $peserta, $ticket]))
            ->assertForbidden();
        $this->actingAs($otherPpk)->post(route('ppk.dpr.approve', [$suratTugas, $peserta]))
            ->assertForbidden();

        $this->assertSame(SuratTugasPegawai::DPR_PENDING_APPROVAL, $peserta->fresh()->dpr_status);
    }

    public function test_employee_cannot_upload_before_trip_completion_or_for_another_employee(): void
    {
        Storage::fake('local');
        $ppk = $this->makeUser('ppk');
        [$employee, $activeTrip] = $this->makeTrip($ppk, now()->addDay()->toDateString());
        [, $completedTrip] = $this->makeTrip($ppk);
        $otherEmployee = $this->makeEmployee();

        $this->actingAs($employee)->post(route('pegawai.tiket.store', $activeTrip), [
            'tickets' => [UploadedFile::fake()->create('tiket.pdf', 100, 'application/pdf')],
        ])->assertForbidden();
        $this->actingAs($otherEmployee)->post(route('pegawai.tiket.store', $completedTrip), [
            'tickets' => [UploadedFile::fake()->create('tiket-lain.pdf', 100, 'application/pdf')],
        ])->assertForbidden();
        $this->assertDatabaseCount('tiket_perjalanan', 0);
    }

    public function test_employee_upload_requires_supported_files_and_assigned_ppk(): void
    {
        Storage::fake('local');
        $ppk = $this->makeUser('ppk');
        [$employee, $suratTugas] = $this->makeTrip($ppk);

        $this->actingAs($employee)->from(route('dashboard'))->post(route('pegawai.tiket.store', $suratTugas), [
            'tickets' => [UploadedFile::fake()->create('catatan.txt', 10, 'text/plain')],
        ])->assertSessionHasErrors('tickets.0');

        $suratTugas->forceFill(['ppk_id' => null])->save();
        $this->actingAs($employee)->post(route('pegawai.tiket.store', $suratTugas), [
            'tickets' => [UploadedFile::fake()->create('tiket.pdf', 100, 'application/pdf')],
        ])->assertStatus(422);
        $this->assertDatabaseCount('tiket_perjalanan', 0);
    }

    /**
     * @return array{0: User, 1: SuratTugas, 2: SuratTugasPegawai}
     */
    private function makeTrip(User $ppk, ?string $tanggalKembali = null): array
    {
        $pegawai = $this->makePegawai();
        $employee = $this->makeUser('pegawai');
        $employee->forceFill(['pegawai_id' => $pegawai->id])->save();

        $suratTugas = SuratTugas::create([
            'user_id' => $this->makeUser('pemohon')->id,
            'ppk_id' => $ppk->id,
            'kategori_perjalanan' => 'DALAM_NEGERI',
            'sumber_asal' => 'INTERNAL',
            'nomor_nota' => 'NOTA/DPR-'.$pegawai->id,
            'pengirim_nota' => 'Sespalu',
            'tanggal_nota' => now()->subDays(4)->toDateString(),
            'perihal_nota' => 'Perjalanan dinas pegawai',
            'status' => SuratTugasStatus::SELESAI_TERBIT,
            'tempat_tujuan' => 'Bandung',
            'tanggal_berangkat' => now()->subDays(3)->toDateString(),
            'tanggal_kembali' => $tanggalKembali ?? now()->subDay()->toDateString(),
            'durasi_hari' => 3,
            'nomor_st' => 'ST/DPR-'.$pegawai->id,
            'nomor_spd' => 'SPD/DPR-'.$pegawai->id,
        ]);

        $peserta = SuratTugasPegawai::create([
            'surat_tugas_id' => $suratTugas->id,
            'pegawai_id' => $pegawai->id,
            'nama' => $pegawai->nama,
            'nip' => $pegawai->nip,
            'pangkat' => $pegawai->pangkat,
            'golongan' => $pegawai->golongan,
            'jabatan' => $pegawai->jabatan,
            'unit_kerja' => $pegawai->unit_kerja,
            'urutan' => 1,
        ]);

        return [$employee->fresh(), $suratTugas, $peserta];
    }

    private function makeUser(string $role): User
    {
        $user = User::factory()->create();
        $user->forceFill(['role' => $role])->save();

        return $user->fresh();
    }

    private function makeEmployee(): User
    {
        $pegawai = $this->makePegawai();
        $user = $this->makeUser('pegawai');
        $user->forceFill(['pegawai_id' => $pegawai->id])->save();

        return $user->fresh();
    }

    private function makePegawai(): Pegawai
    {
        return Pegawai::create([
            'nama' => 'Pegawai DPR '.fake()->unique()->numerify('###'),
            'nip' => fake()->unique()->numerify('##################'),
            'pangkat' => 'Penata',
            'golongan' => 'III/c',
            'jabatan' => 'Analis',
            'unit_kerja' => 'Pusdiklat',
        ]);
    }
}
