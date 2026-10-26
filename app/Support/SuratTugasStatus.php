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

    public const ALL = [
        self::DRAFT,
        self::MENUNGGU_DISPOSISI_KAPUS,
        self::DISPOSISI_KAPUS_YA,
        self::DISPOSISI_KAPUS_REVISI,
        self::DISPOSISI_KAPUS_STOP,
        self::MENUNGGU_PENOMORAN_TU,
        self::SELESAI_TERBIT,
    ];

    /** Label status untuk tampilan & ekspor laporan. */
    public const LABELS = [
        self::DRAFT => 'Draft',
        self::MENUNGGU_DISPOSISI_KAPUS => 'Menunggu Disposisi Kapus',
        self::DISPOSISI_KAPUS_YA => 'Disetujui Kapus',
        self::DISPOSISI_KAPUS_REVISI => 'Perlu Revisi',
        self::DISPOSISI_KAPUS_STOP => 'Dihentikan Kapus',
        self::MENUNGGU_PENOMORAN_TU => 'Menunggu Penomoran TU',
        self::SELESAI_TERBIT => 'Selesai Terbit',
    ];

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
