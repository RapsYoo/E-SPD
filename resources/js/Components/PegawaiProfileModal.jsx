import React from 'react';
import {
  Briefcase,
  Building,
  Calendar,
  CreditCard,
  Edit3,
  FileText,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';

function getInitials(name = '') {
  const parts = String(name)
    .replace(/[^a-zA-Z\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'P';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function formatGender(val) {
  if (!val) return '-';
  const clean = String(val).trim().toUpperCase();
  if (clean === 'L') return 'Laki-laki (L)';
  if (clean === 'P') return 'Perempuan (P)';
  return val;
}

function InfoItem({ label, value, mono = false }) {
  const displayValue =
    value !== null && value !== undefined && String(value).trim() !== '' ? value : '-';
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5">
      <div className="text-[11px] font-medium text-slate-400">{label}</div>
      <div
        className={`mt-0.5 text-xs font-semibold text-slate-800 break-words ${
          mono ? 'font-mono' : ''
        }`}
      >
        {displayValue}
      </div>
    </div>
  );
}

export default function PegawaiProfileModal({
  pegawai,
  onClose,
  onEdit = null,
  showBankInfo = true,
}) {
  if (!pegawai) return null;

  const uptName = pegawai.upt?.nama || pegawai.upt_bidang || '-';
  const uptKeterangan = pegawai.upt?.keterangan || '';

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-2xl animate-scale-in"
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#0F2C59] to-[#1a4180] px-6 py-5 text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg bg-white/10 p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white"
            title="Tutup"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-amber-400/80 bg-amber-500 text-xl font-extrabold text-slate-950 shadow-lg">
              {getInitials(pegawai.nama)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {pegawai.is_active ?? true ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-200 border border-emerald-400/30">
                    <ShieldCheck className="h-3 w-3" />
                    Aktif
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-slate-500/30 px-2.5 py-0.5 text-[11px] font-bold text-slate-200 border border-slate-400/30">
                    Tidak Aktif
                  </span>
                )}

                {pegawai.status_kepegawaian && pegawai.status_kepegawaian !== '-' && (
                  <span className="inline-flex items-center rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-200 border border-amber-400/30">
                    {pegawai.status_kepegawaian}
                  </span>
                )}

                {uptName !== '-' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    <Building className="h-3 w-3 text-amber-300" />
                    {uptName}
                  </span>
                )}
              </div>

              <h3 className="mt-1.5 text-lg font-extrabold tracking-tight text-white sm:text-xl">
                {pegawai.nama}
              </h3>

              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-200">
                <span className="font-mono">NIP: {pegawai.nip || '-'}</span>
                {pegawai.jabatan && (
                  <span>
                    • <strong className="text-amber-300">{pegawai.jabatan}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-6 p-6">
          {/* 1. Jabatan & Kepangkatan */}
          <section>
            <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Briefcase className="h-4 w-4 text-amber-600" />
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                Jabatan &amp; Kepangkatan
              </h4>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              <InfoItem label="Jabatan Utama" value={pegawai.jabatan} />
              <InfoItem label="Pangkat" value={pegawai.pangkat} />
              <InfoItem label="Golongan" value={pegawai.golongan} />
              <InfoItem label="Kelas Jabatan" value={pegawai.kelas_jabatan} />
              <InfoItem label="Jabatan Fungsional" value={pegawai.fungsional} />
              <InfoItem label="Jenjang Fungsional" value={pegawai.jenjang} />
              <InfoItem label="Struktural / Lainnya" value={pegawai.struktural_lainnya} />
              <InfoItem label="Gelar Jabatan" value={pegawai.gelar} />
              <InfoItem label="TMT Pangkat / Jabatan" value={pegawai.tmt || pegawai.tmt_2} />
            </div>
          </section>

          {/* 2. Unit Kerja & Kepegawaian */}
          <section>
            <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Calendar className="h-4 w-4 text-amber-600" />
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                Unit Kerja &amp; Riwayat Kepegawaian
              </h4>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              <InfoItem
                label="UPT / Bidang"
                value={uptKeterangan ? `${uptName} (${uptKeterangan})` : uptName}
              />
              <InfoItem label="Status Kepegawaian" value={pegawai.status_kepegawaian} />
              <InfoItem label="PDDN / PDLN" value={pegawai.pddn_pdln} />
              <InfoItem label="Masuk Kemlu" value={pegawai.masuk_kemlu} />
              <InfoItem label="Masuk Pusdiklat" value={pegawai.masuk_pusdiklat} />
              <InfoItem label="Masa Kerja di Pusdiklat" value={pegawai.waktu_di_pusdiklat} />
              <InfoItem label="Cek SK / SPMT" value={pegawai.ceksk_spmt} />
              <InfoItem label="Usia Pensiun" value={pegawai.usia_pensiun} />
              <InfoItem label="Tahun Pensiun" value={pegawai.tahun_pensiun} />
            </div>
          </section>

          {/* 3. Data Pribadi */}
          <section>
            <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
              <User className="h-4 w-4 text-amber-600" />
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                Data Pribadi
              </h4>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
              <InfoItem label="Jenis Kelamin" value={formatGender(pegawai.jenis_kelamin)} />
              <InfoItem label="Agama" value={pegawai.agama} />
              <InfoItem label="Tanggal Lahir" value={pegawai.tanggal_lahir} />
              <InfoItem label="Usia" value={pegawai.usia} />
            </div>
          </section>

          {/* 4. Data Rekening Bank (Khusus Admin) */}
          {showBankInfo && (
            <section>
              <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
                <CreditCard className="h-4 w-4 text-amber-600" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  Informasi Rekening &amp; Bank
                </h4>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                <InfoItem label="Nama Bank" value={pegawai.bank} />
                <InfoItem label="Kode Bank" value={pegawai.kode_bank} mono />
                <InfoItem label="Nomor Rekening" value={pegawai.no_rekening} mono />
                <InfoItem label="Nama Pemilik Rekening" value={pegawai.nama_rekening} />
              </div>
            </section>
          )}

          {/* 5. Keterangan */}
          {pegawai.keterangan && String(pegawai.keterangan).trim() !== '' && (
            <section>
              <div className="mb-2 flex items-center gap-2 border-b border-slate-100 pb-2">
                <FileText className="h-4 w-4 text-amber-600" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  Keterangan (Pendidikan / Penugasan)
                </h4>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-700 whitespace-pre-line">
                {pegawai.keterangan}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-200/80 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-300/80"
          >
            Tutup
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                const target = pegawai;
                onClose();
                onEdit(target);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition hover:bg-amber-400"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit Data Pegawai</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

