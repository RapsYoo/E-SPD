<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Pegawai;
use App\Models\Ppk;
use App\Models\Bendahara;

class ImportPegawaiBankSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Bendahara Pengeluaran
        $bendaharaList = [
            [
                'nama' => 'LARAS WAHYUNING HAPSARI',
                'nip' => '19940309 202205 2 001',
                'jabatan' => 'Bendahara Pengeluaran',
                'is_active' => true,
            ],
        ];

        foreach ($bendaharaList as $b) {
            Bendahara::updateOrCreate(
                ['nip' => $b['nip']],
                $b
            );
        }

        // 2. Seed PPK (Pejabat Pembuat Komitmen)
        $ppkList = [
            [
                'nama' => 'GEORGE JUNIOR',
                'nip' => '19820806 200901 1 001',
                'jabatan' => 'Pejabat Pembuat Komitmen',
                'is_active' => true,
            ],
            [
                'nama' => 'PIPIN ZAENAL HAPINUDIN',
                'nip' => '19820825 200912 1 001',
                'jabatan' => 'Pejabat Pembuat Komitmen',
                'is_active' => true,
            ],
            [
                'nama' => 'DANIEL NUGROHO',
                'nip' => '19890721 201502 1 001',
                'jabatan' => 'Pejabat Pembuat Komitmen',
                'is_active' => true,
            ],
        ];

        foreach ($ppkList as $p) {
            Ppk::updateOrCreate(
                ['nip' => $p['nip']],
                $p
            );
        }

        // 3. Bank SWIFT mapping dictionary
        $bankMap = [
            'BNINIDJA' => 'BNI',
            'BRINIDJA' => 'BRI',
            'BMRIIDJA' => 'Bank Mandiri',
            'CENAIDJA' => 'Bank BCA',
            'BSMDIDJA' => 'BSI',
            'BBLUIDJA' => 'Bank Permata',
            'BDKIIDJA' => 'Bank DKI',
            'BTANIDJA' => 'Bank BTN',
            'BTPNIDJA' => 'Bank BTPN',
            'MUABIDJA' => 'Bank Muamalat',
            'PDIJIDJ1' => 'Bank Papua',
            'PDJBIDJA' => 'Bank BJB',
        ];

        // 4. Import Pegawai CSV
        $csvPath = database_path('data/pegawai.csv');
        if (!file_exists($csvPath)) {
            $this->command->error("File {$csvPath} tidak ditemukan!");
            return;
        }

        $file = fopen($csvPath, 'r');
        $header = fgetcsv($file); // skip header

        $count = 0;
        while (($row = fgetcsv($file)) !== false) {
            if (empty($row) || !isset($row[1]) || trim($row[1]) === '') {
                continue;
            }

            $nama = trim($row[1]);
            $nip = trim($row[2] ?? '');
            if ($nip === '' || $nip === '-' || strtolower($nip) === 'nan') {
                $nip = '-';
            }

            $nik = trim($row[3] ?? '');
            $jabatan = trim($row[4] ?? '-');
            $pangkatGolongan = trim($row[5] ?? '-');
            $swift = trim($row[6] ?? '');
            $noRekening = trim($row[7] ?? '');
            $noRekeningLain = trim($row[8] ?? '');

            // Parse Pangkat and Golongan
            $pangkat = $pangkatGolongan;
            $golongan = '-';
            if (str_contains($pangkatGolongan, '/')) {
                $parts = explode('/', $pangkatGolongan, 2);
                $pangkat = trim($parts[0]);
                $golongan = trim($parts[1]);
            } elseif (str_contains($pangkatGolongan, ',')) {
                $parts = explode(',', $pangkatGolongan, 2);
                $pangkat = trim($parts[0]);
                $golongan = trim($parts[1]);
            }

            $namaBank = $bankMap[$swift] ?? ($swift ?: null);

            // Upsert based on nama and nip
            $existing = Pegawai::where('nama', $nama)->first();
            if ($existing) {
                $existing->update([
                    'nip' => $nip,
                    'nik' => $nik ?: $existing->nik,
                    'jabatan' => $jabatan ?: $existing->jabatan,
                    'pangkat' => $pangkat ?: $existing->pangkat,
                    'golongan' => $golongan ?: $existing->golongan,
                    'swift' => $swift ?: $existing->swift,
                    'nama_bank' => $namaBank ?: $existing->nama_bank,
                    'no_rekening' => $noRekening ?: $existing->no_rekening,
                    'no_rekening_lain' => $noRekeningLain ?: $existing->no_rekening_lain,
                ]);
            } else {
                Pegawai::create([
                    'nama' => $nama,
                    'nip' => $nip,
                    'nik' => $nik,
                    'pangkat' => $pangkat,
                    'golongan' => $golongan,
                    'jabatan' => $jabatan,
                    'unit_kerja' => 'Pusdiklat Kemlu',
                    'swift' => $swift,
                    'nama_bank' => $namaBank,
                    'no_rekening' => $noRekening,
                    'no_rekening_lain' => $noRekeningLain,
                    'is_active' => true,
                ]);
            }
            $count++;
        }
        fclose($file);

        $this->command->info("Berhasil mengimpor/memperbarui {$count} data pegawai dan rekening!");
    }
}
