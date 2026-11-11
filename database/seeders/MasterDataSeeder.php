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
                'name' => 'Sespalu / Pemohon',
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
    }
}

