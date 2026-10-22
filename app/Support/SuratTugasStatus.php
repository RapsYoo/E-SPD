<?php

namespace App\Support;

/**
 * Konstanta status & peran pada alur Surat Tugas, agar tidak tersebar sebagai string di banyak tempat.
 */
final class SuratTugasStatus
{
    public const DRAFT = 'DRAFT';
    public const MENUNGGU_DISPOSISI_KAPUS = 'MENUNGGU_DISPOSISI_KAPUS';
    public const DISPOSISI_KAPUS_YA = 'DISPOSISI_KAPUS_YA';
    public const DISPOSISI_KAPUS_REVISI = 'DISPOSISI_KAPUS_REVISI';
    public const DISPOSISI_KAPUS_STOP = 'DISPOSISI_KAPUS_STOP';
    public const MENUNGGU_PENOMORAN_TU = 'MENUNGGU_PENOMORAN_TU';
    public const SELESAI_TERBIT = 'SELESAI_TERBIT';

    /** Status di mana draft masih boleh dibuka/diedit oleh pengusul. */
    public const EDITABLE_DRAFT = [self::DRAFT, self::DISPOSISI_KAPUS_YA, self::DISPOSISI_KAPUS_REVISI];

    /** Status minimal agar dokumen boleh dicetak. */
    public const PRINTABLE = [self::MENUNGGU_PENOMORAN_TU, self::SELESAI_TERBIT];

    /** Peran yang boleh membuat/mengirim usulan. */
    public const PROPOSER_ROLES = ['pemohon', 'sespalu', 'admin'];

    /** Peran yang boleh mencetak dokumen terlepas dari kepemilikan. */
    public const PRINT_ROLES = ['tu', 'admin', 'kapus', 'ppk'];

    /** Peran pegawai biasa: hanya melihat surat perjalanannya sendiri. */
    public const PEGAWAI_ROLE = 'pegawai';

    /** Status surat yang boleh dilihat/diunduh pegawai peserta (hanya yang sudah terbit resmi). */
    public const PEGAWAI_VISIBLE = [self::SELESAI_TERBIT];
}
