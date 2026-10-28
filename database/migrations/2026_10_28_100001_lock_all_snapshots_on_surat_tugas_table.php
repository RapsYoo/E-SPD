<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('surat_tugas')) {
            return;
        }

        // 1. Cari data Kapus aktif saat ini (dari akun role kapus -> pegawai, atau jabatan Kepala Pusat di tabel pegawai).
        $kapusNama = null;
        $kapusNip = null;

        if (Schema::hasTable('users')) {
            $kapusUser = DB::table('users')->where('role', 'kapus')->orderBy('id')->first();
            if ($kapusUser) {
                if (! empty($kapusUser->pegawai_id) && Schema::hasTable('pegawai')) {
                    $pegawaiKapus = DB::table('pegawai')->where('id', $kapusUser->pegawai_id)->first();
                    $kapusNama = $pegawaiKapus->nama ?? $kapusUser->name;
                    $kapusNip = $pegawaiKapus->nip ?? null;
                } else {
                    $kapusNama = $kapusUser->name;
                    if (Schema::hasTable('pegawai')) {
                        $pegawaiKapus = DB::table('pegawai')
                            ->where('nama', $kapusUser->name)
                            ->orWhere('jabatan', 'like', '%Kepala Pusat%')
                            ->first();
                        if ($pegawaiKapus) {
                            $kapusNip = $pegawaiKapus->nip;
                        }
                    }
                }
            }
        }

        if ((! $kapusNama || ! $kapusNip) && Schema::hasTable('pegawai')) {
            $pegawaiKapus = DB::table('pegawai')
                ->where('jabatan', 'like', '%Kepala Pusat%')
                ->orderBy('id')
                ->first();
            if ($pegawaiKapus) {
                $kapusNama = $kapusNama ?: $pegawaiKapus->nama;
                $kapusNip = $kapusNip ?: $pegawaiKapus->nip;
            }
        }

        $kapusNama = $kapusNama ?: 'Khasan Ashari';
        $kapusNip = $kapusNip ?: '19750617 200003 1 001';

        // 2. Kunci kapus_nama_snapshot & kapus_nip_snapshot pada surat yang sudah disetujui / siap cetak / selesai terbit.
        DB::table('surat_tugas')
            ->whereIn('status', ['DISPOSISI_KAPUS_YA', 'MENUNGGU_PENOMORAN_TU', 'SELESAI_TERBIT'])
            ->where(function ($q) {
                $q->whereNull('kapus_nama_snapshot')->orWhere('kapus_nama_snapshot', '');
            })
            ->update([
                'kapus_nama_snapshot' => $kapusNama,
            ]);

        DB::table('surat_tugas')
            ->whereIn('status', ['DISPOSISI_KAPUS_YA', 'MENUNGGU_PENOMORAN_TU', 'SELESAI_TERBIT'])
            ->where(function ($q) {
                $q->whereNull('kapus_nip_snapshot')->orWhere('kapus_nip_snapshot', '');
            })
            ->update([
                'kapus_nip_snapshot' => $kapusNip,
            ]);

        // 3. Kunci ppk_nama_snapshot & ppk_nip_snapshot pada surat yang memiliki ppk_id namun snapshot-nya masih kosong.
        if (Schema::hasTable('users')) {
            $suratList = DB::table('surat_tugas')
                ->whereNotNull('ppk_id')
                ->where(function ($q) {
                    $q->whereNull('ppk_nama_snapshot')
                        ->orWhere('ppk_nama_snapshot', '')
                        ->orWhereNull('ppk_nip_snapshot')
                        ->orWhere('ppk_nip_snapshot', '');
                })
                ->get(['id', 'ppk_id', 'ppk_nama_snapshot', 'ppk_nip_snapshot']);

            foreach ($suratList as $surat) {
                $ppkUser = DB::table('users')->where('id', $surat->ppk_id)->first();
                if (! $ppkUser) {
                    continue;
                }

                $ppkPegawai = (! empty($ppkUser->pegawai_id) && Schema::hasTable('pegawai'))
                    ? DB::table('pegawai')->where('id', $ppkUser->pegawai_id)->first()
                    : null;

                if (! $ppkPegawai && Schema::hasTable('pegawai')) {
                    $ppkPegawai = DB::table('pegawai')->where('nama', $ppkUser->name)->first();
                }

                $nama = $surat->ppk_nama_snapshot ?: ($ppkPegawai->nama ?? $ppkUser->name);
                $nip = $surat->ppk_nip_snapshot ?: ($ppkPegawai->nip ?? '');

                DB::table('surat_tugas')->where('id', $surat->id)->update([
                    'ppk_nama_snapshot' => $nama,
                    'ppk_nip_snapshot' => $nip,
                ]);
            }
        }

        // 4. Pastikan surat_tugas_pegawai yang snapshot jabatan/pangkat/golongan-nya kosong terisi dari master pegawai.
        if (Schema::hasTable('surat_tugas_pegawai') && Schema::hasTable('pegawai')) {
            $items = DB::table('surat_tugas_pegawai')
                ->whereNotNull('pegawai_id')
                ->where(function ($q) {
                    $q->whereNull('jabatan')
                        ->orWhere('jabatan', '')
                        ->orWhereNull('pangkat')
                        ->orWhere('pangkat', '')
                        ->orWhereNull('golongan')
                        ->orWhere('golongan', '');
                })
                ->get();

            foreach ($items as $item) {
                $pegawai = DB::table('pegawai')->where('id', $item->pegawai_id)->first();
                if (! $pegawai) {
                    continue;
                }

                DB::table('surat_tugas_pegawai')->where('id', $item->id)->update([
                    'nama' => $item->nama ?: $pegawai->nama,
                    'nip' => $item->nip ?: ($pegawai->nip ?? ''),
                    'pangkat' => $item->pangkat ?: ($pegawai->pangkat ?? ''),
                    'golongan' => $item->golongan ?: ($pegawai->golongan ?? ''),
                    'jabatan' => $item->jabatan ?: ($pegawai->jabatan ?? ''),
                    'unit_kerja' => $item->unit_kerja ?: ($pegawai->unit_kerja ?: 'Pusdiklat Kemlu'),
                ]);
            }
        }
    }

    public function down(): void
    {
        // Data snapshot yang sudah dikunci tidak perlu dikosongkan kembali.
    }
};
