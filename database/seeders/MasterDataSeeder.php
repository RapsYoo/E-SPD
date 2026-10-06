<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Pegawai;
use App\Models\Ppk;
use App\Models\UnitKerja;
use App\Models\TingkatBiaya;
use App\Models\JenisAngkutan;
use App\Models\User;
use App\Models\SuratTugas;
use App\Models\SuratTugasPegawai;
use Illuminate\Support\Facades\Hash;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Actor Users with respective roles
        $users = [
            [
                'email' => 'admin@pusdiklat.kemlu.go.id',
                'name' => 'Administrator System',
                'role' => 'admin',
            ],
            [
                'email' => 'pemohon@pusdiklat.kemlu.go.id',
                'name' => 'Sespalu / Pemohon',
                'role' => 'pemohon',
            ],
            [
                'email' => 'kapus@pusdiklat.kemlu.go.id',
                'name' => 'Dr. Muhammad Takdir (Kapus)',
                'role' => 'kapus',
            ],
            [
                'email' => 'tu@pusdiklat.kemlu.go.id',
                'name' => 'Staf Tata Usaha (TU)',
                'role' => 'tu',
            ],
            [
                'email' => 'ppk@pusdiklat.kemlu.go.id',
                'name' => 'George Junior (PPK)',
                'role' => 'ppk',
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'password' => Hash::make('password'),
                    'role' => $userData['role'],
                ]
            );
        }

        // 2. Seed Pegawai Master
        $pegawaiData = [
            ['nama' => 'Geovannie Foresty Palembangan', 'nip' => '19810702 200901 1 002', 'pangkat' => 'Pembina', 'golongan' => 'IV/a', 'jabatan' => 'Diplomat Ahli Madya', 'unit_kerja' => 'Pusdiklat Kemlu'],
            ['nama' => 'Siti Rahmah, S.IP', 'nip' => '19850415 201012 2 003', 'pangkat' => 'Penata', 'golongan' => 'III/c', 'jabatan' => 'Diplomat Ahli Muda', 'unit_kerja' => 'Pusdiklat Kemlu'],
            ['nama' => 'Ahmad Syarif, S.H.', 'nip' => '19780512 200312 1 002', 'pangkat' => 'Penata Tk. I', 'golongan' => 'III/d', 'jabatan' => 'Diplomat Ahli Muda', 'unit_kerja' => 'Pusdiklat Kemlu'],
            ['nama' => 'Budi Santoso, M.Si', 'nip' => '19891104 201402 1 001', 'pangkat' => 'Penata Muda Tk. I', 'golongan' => 'III/b', 'jabatan' => 'Pranata Humas Ahli Muda', 'unit_kerja' => 'Pusdiklat Kemlu'],
            ['nama' => 'Dewi Lestari, S.S.', 'nip' => '19920310 201801 2 004', 'pangkat' => 'Penata Muda', 'golongan' => 'III/a', 'jabatan' => 'Analis Kebijakan Ahli Pertama', 'unit_kerja' => 'Pusdiklat Kemlu'],
        ];

        foreach ($pegawaiData as $data) {
            Pegawai::updateOrCreate(['nip' => $data['nip']], $data);
        }

        // 3. Seed PPK Master
        $ppkData = [
            ['nama' => 'GEORGE JUNIOR', 'nip' => '19790315 200312 1 002', 'jabatan' => 'Pejabat Pembuat Komitmen'],
            ['nama' => 'PIPIN ZAENAL HAPINUDIN', 'nip' => '19820825 200912 1 001', 'jabatan' => 'Pejabat Pembuat Komitmen'],
        ];

        foreach ($ppkData as $data) {
            Ppk::updateOrCreate(['nip' => $data['nip']], $data);
        }

        // 4. Seed Unit Kerja
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

        // 5. Seed Tingkat Biaya
        $tingkatBiayaData = [
            ['kode' => 'A', 'nama' => 'Tingkat A', 'keterangan' => 'Pejabat Negara / Eselon I'],
            ['kode' => 'B', 'nama' => 'Tingkat B', 'keterangan' => 'Eselon II / Golongan IV'],
            ['kode' => 'C', 'nama' => 'Tingkat C', 'keterangan' => 'Eselon III ke bawah / Golongan III dan di bawahnya'],
        ];

        foreach ($tingkatBiayaData as $data) {
            TingkatBiaya::updateOrCreate(['kode' => $data['kode']], $data);
        }

        // 6. Seed Jenis Angkutan
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
        $ppkObj = Ppk::first();
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
                'ppk_id' => $ppkObj?->id,
                'ppk_nama_snapshot' => $ppkObj?->nama ?? 'GEORGE JUNIOR',
                'ppk_nip_snapshot' => $ppkObj?->nip ?? '19790315 200312 1 002',
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
