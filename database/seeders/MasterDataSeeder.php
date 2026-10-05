<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Pegawai;
use App\Models\Ppk;
use App\Models\UnitKerja;
use App\Models\TingkatBiaya;
use App\Models\JenisAngkutan;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        // Create Admin user
        User::updateOrCreate(
            ['email' => 'admin@pusdiklat.kemlu.go.id'],
            [
                'name' => 'Administrator',
                'password' => Hash::make('password'),
                'role' => 'admin',
            ]
        );

        // Seed Pegawai
        $pegawaiData = [
            ['nama' => 'Geovannie Foresty Palembangan', 'nip' => '19810702 200901 1 002', 'pangkat' => 'Pembina', 'golongan' => 'IV/a', 'jabatan' => 'Diplomat Ahli Madya', 'unit_kerja' => 'Pusdiklat'],
            ['nama' => 'Siti Rahmah, S.IP', 'nip' => '19850415 201012 2 003', 'pangkat' => 'Penata', 'golongan' => 'III/c', 'jabatan' => 'Diplomat Ahli Muda', 'unit_kerja' => 'Pusdiklat'],
            ['nama' => 'Ahmad Syarif, S.H.', 'nip' => '19780512 200312 1 002', 'pangkat' => 'Penata Tk. I', 'golongan' => 'III/d', 'jabatan' => 'Diplomat Ahli Muda', 'unit_kerja' => 'Pusdiklat'],
            ['nama' => 'Budi Santoso, M.Si', 'nip' => '19891104 201402 1 001', 'pangkat' => 'Penata Muda Tk. I', 'golongan' => 'III/b', 'jabatan' => 'Pranata Humas Ahli Muda', 'unit_kerja' => 'Pusdiklat'],
            ['nama' => 'Dewi Lestari, S.S.', 'nip' => '19920310 201801 2 004', 'pangkat' => 'Penata Muda', 'golongan' => 'III/a', 'jabatan' => 'Analis Kebijakan Ahli Pertama', 'unit_kerja' => 'Pusdiklat'],
        ];

        foreach ($pegawaiData as $data) {
            Pegawai::updateOrCreate(['nip' => $data['nip']], $data);
        }

        // Seed PPK
        $ppkData = [
            ['nama' => 'GEORGE JUNIOR', 'nip' => '19790315 200312 1 002', 'jabatan' => 'Pejabat Pembuat Komitmen'],
            ['nama' => 'PIPIN ZAENAL HAPINUDIN', 'nip' => '19820825 200912 1 001', 'jabatan' => 'Pejabat Pembuat Komitmen'],
        ];

        foreach ($ppkData as $data) {
            Ppk::updateOrCreate(['nip' => $data['nip']], $data);
        }

        // Seed Unit Kerja
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

        // Seed Tingkat Biaya
        $tingkatBiayaData = [
            ['kode' => 'A', 'nama' => 'Tingkat A', 'keterangan' => 'Pejabat Negara / Eselon I'],
            ['kode' => 'B', 'nama' => 'Tingkat B', 'keterangan' => 'Eselon II / Golongan IV'],
            ['kode' => 'C', 'nama' => 'Tingkat C', 'keterangan' => 'Eselon III ke bawah / Golongan III dan di bawahnya'],
        ];

        foreach ($tingkatBiayaData as $data) {
            TingkatBiaya::updateOrCreate(['kode' => $data['kode']], $data);
        }

        // Seed Jenis Angkutan
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
