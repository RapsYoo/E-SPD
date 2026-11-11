<?php

namespace Database\Seeders;

use App\Models\JenisAngkutan;
use App\Models\Pegawai;
use App\Models\TingkatBiaya;
use App\Models\UnitKerja;
use App\Models\UptBidang;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        // 0. Seed Master UPT / Bidang Pusdiklat
        foreach (UptBidang::DEFAULT_ITEMS as $item) {
            UptBidang::updateOrCreate(
                ['kode' => $item['kode']],
                [
                    'nama' => $item['nama'],
                    'keterangan' => $item['keterangan'],
                    'is_active' => true,
                ]
            );
        }

        // 1. Seed Master Pegawai (81 pegawai Pusdiklat dengan ID terurut 1..81)
        $sqlFile = database_path('seeders/sql/pegawai_2026.sql');
        if (is_file($sqlFile) && Pegawai::count() === 0) {
            DB::unprepared((string) file_get_contents($sqlFile));
        }

        // Tautkan relasi pegawai.upt_bidang_id ke tabel upt_bidang berdasarkan nama UPT/Bidang
        $uptMap = UptBidang::pluck('id', 'nama');
        foreach ($uptMap as $nama => $id) {
            Pegawai::where('upt_bidang', $nama)
                ->whereNull('upt_bidang_id')
                ->update(['upt_bidang_id' => $id]);
        }

        // 2. Seed Akun Pengguna (ID terurut 1..7, tertaut langsung ke pegawai_id yang sesuai)
        $users = [
            [
                'email' => 'admin@pusdiklat.kemlu.go.id',
                'name' => 'Administrator System',
                'role' => 'admin',
                'pegawai_id' => null,
            ],
            [
                'email' => 'pemohon@pusdiklat.kemlu.go.id',
                'name' => 'Sesparlu / Pemohon',
                'role' => 'pemohon',
                'pegawai_id' => null,
            ],
            [
                'email' => 'kapus@pusdiklat.kemlu.go.id',
                'name' => 'Khasan Ashari',
                'role' => 'kapus',
                'pegawai_id' => Pegawai::where('nama', 'Khasan Ashari')->value('id'),
            ],
            [
                'email' => 'tu@pusdiklat.kemlu.go.id',
                'name' => 'Staf Tata Usaha (TU)',
                'role' => 'tu',
                'pegawai_id' => null,
            ],
            [
                'email' => 'ppk@pusdiklat.kemlu.go.id',
                'name' => 'George Junior',
                'role' => 'ppk',
                'pegawai_id' => Pegawai::where('nama', 'George Junior')->value('id'),
            ],
            [
                'email' => 'pipinppk@gmail.com',
                'name' => 'Pipin Zaenal Hapinudin',
                'role' => 'ppk',
                'pegawai_id' => Pegawai::where('nama', 'Pipin Zaenal Hapinudin')->value('id'),
            ],
            [
                'email' => 'pegawai2@gmail.com',
                'name' => 'Geovannie F Palembangan',
                'role' => 'pegawai',
                'pegawai_id' => Pegawai::where('nama', 'Geovannie F Palembangan')->value('id'),
            ],
        ];

        foreach ($users as $userData) {
            $u = User::updateOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'password' => Hash::make('password'),
                    'pegawai_id' => $userData['pegawai_id'],
                ]
            );
            if ($u->role !== $userData['role']) {
                $u->forceFill(['role' => $userData['role']])->save();
            }
        }

        // 3. Seed Unit Kerja
        $unitKerjaData = [
            ['kode' => 'PUSDIKLAT', 'nama' => 'Pusat Pendidikan dan Pelatihan', 'singkatan' => 'Pusdiklat', 'alamat' => 'Jakarta'],
            ['kode' => 'SEKJEN', 'nama' => 'Sekretariat Jenderal', 'singkatan' => 'Setjen', 'alamat' => 'Jakarta'],
            ['kode' => 'DITJEN_IDP', 'nama' => 'Direktorat Jenderal Informasi dan Diplomasi Publik', 'singkatan' => 'Ditjen IDP', 'alamat' => 'Jakarta'],
            ['kode' => 'DITJEN_AP', 'nama' => 'Direktorat Jenderal Asia Pasifik dan Afrika', 'singkatan' => 'Ditjen Aspasaf', 'alamat' => 'Jakarta'],
            ['kode' => 'DITJEN_AMEROP', 'nama' => 'Direktorat Jenderal Amerika dan Eropa', 'singkatan' => 'Ditjen Amerop', 'alamat' => 'Jakarta'],
        ];

        foreach ($unitKerjaData as $data) {
            UnitKerja::updateOrCreate(['kode' => $data['kode']], $data);
        }

        // 4. Seed Tingkat Biaya
        $tingkatBiayaData = [
            ['kode' => 'A', 'nama' => 'Tingkat A', 'keterangan' => 'Pejabat Negara / Eselon I'],
            ['kode' => 'B', 'nama' => 'Tingkat B', 'keterangan' => 'Eselon II / Golongan IV'],
            ['kode' => 'C', 'nama' => 'Tingkat C', 'keterangan' => 'Eselon III ke bawah / Golongan III dan di bawahnya'],
        ];

        foreach ($tingkatBiayaData as $data) {
            TingkatBiaya::updateOrCreate(['kode' => $data['kode']], $data);
        }

        // 5. Seed Jenis Angkutan
        $jenisAngkutanData = [
            ['kode' => 'DARAT', 'nama' => 'Perjalanan Darat', 'keterangan' => 'Menggunakan kendaraan darat (bus, kereta, dll)'],
            ['kode' => 'UDARA', 'nama' => 'Perjalanan Udara / Tiket', 'keterangan' => 'Menggunakan pesawat terbang'],
            ['kode' => 'DINAS', 'nama' => 'Kendaraan Dinas', 'keterangan' => 'Menggunakan kendaraan dinas kantor'],
            ['kode' => 'LAUT', 'nama' => 'Perjalanan Laut', 'keterangan' => 'Menggunakan kapal laut'],
        ];

        foreach ($jenisAngkutanData as $data) {
            JenisAngkutan::updateOrCreate(['kode' => $data['kode']], $data);
        }

        // 7. Seed Sample Complete Surat Tugas & SPD
        $ppkUser = User::with('pegawai')->where('role', 'ppk')->first();
        $st = SuratTugas::updateOrCreate(
            ['nomor_st' => 'ST/KP/08581/08/2026/79'],
            [
                'user_id' => User::where('role', 'pemohon')->first()?->id,
                'kategori_perjalanan' => 'DALAM_NEGERI',
                'sumber_asal' => 'EKSTERNAL',
                'nomor_nota' => 'Undangan/OT/01710/08/2026/21',
                'pengirim_nota' => 'Pusat Studi Jepang Universitas Indonesia',
                'tanggal_nota' => '2026-08-20',
                'perihal_nota' => 'Undangan Rapat Koordinasi Pembahasan Capaian Peta Jalan Postur Diplomasi Tahun 2026 serta reviu progres dan penghitungan capaian indikator.',
                'status' => 'SELESAI_TERBIT',
                'kapus_decision' => 'YA',
                'catatan_kapus' => 'Tugaskan sdr. Geovannie Foresty Palembangan (Diplomat Ahli Madya) beserta tim pendamping untuk menghadiri rapat koordinasi tersebut.',
                'ppk_id' => $ppkUser?->id,
                'ppk_nama_snapshot' => $ppkUser?->pegawai?->nama ?? $ppkUser?->name ?? 'GEORGE JUNIOR',
                'ppk_nip_snapshot' => $ppkUser?->pegawai?->nip ?? '19790315 200312 1 002',
                'tingkat_biaya_kode' => 'C',
                'jenis_angkutan_nama' => 'Perjalanan Darat',
                'tempat_berangkat' => 'Jakarta',
                'tempat_tujuan' => 'Depok, Jawa Barat',
                'tanggal_berangkat' => '2026-08-27',
                'tanggal_kembali' => '2026-09-01',
                'durasi_hari' => 6,
                'nomor_st' => 'ST/KP/08581/08/2026/79',
                'nomor_spd' => '0088/DL-SPD/VIII/2026/79',
                'tanggal_surat' => '2026-08-21',
                'is_ppk_signed' => true,
                'signed_at' => now(),
            ]
        );

        // Attach Officers to sample ST
        $peg1 = Pegawai::where('nama', 'like', '%Geovannie%')->first();
        $peg2 = Pegawai::where('nama', 'like', '%Siti Rahmah%')->first();

        if ($peg1) {
            SuratTugasPegawai::updateOrCreate(
                ['surat_tugas_id' => $st->id, 'pegawai_id' => $peg1->id],
                [
                    'nama' => $peg1->nama,
                    'nip' => $peg1->nip,
                    'pangkat' => $peg1->pangkat,
                    'golongan' => $peg1->golongan,
                    'jabatan' => $peg1->jabatan,
                    'unit_kerja' => $peg1->unit_kerja,
                    'urutan' => 1,
                ]
            );
        }

        if ($peg2) {
            SuratTugasPegawai::updateOrCreate(
                ['surat_tugas_id' => $st->id, 'pegawai_id' => $peg2->id],
                [
                    'nama' => $peg2->nama,
                    'nip' => $peg2->nip,
                    'pangkat' => $peg2->pangkat,
                    'golongan' => $peg2->golongan,
                    'jabatan' => $peg2->jabatan,
                    'unit_kerja' => $peg2->unit_kerja,
                    'urutan' => 2,
                ]
            );
        }
    }
}
