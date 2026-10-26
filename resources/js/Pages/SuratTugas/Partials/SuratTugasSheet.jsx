import React from 'react';
import { formatDate } from './printHelpers';

export default function SuratTugasSheet({
  suratTugas,
  pegawaiList = [],
  nomorST = '-',
  tanggalSurat = '-',
  tanggalBerangkat = '-',
  tanggalKembali = '-',
  tujuanPerjalanan = '-',
  tahunAnggaran = '-',
  kapusNama = null,
  kapusNip = null,
  isActive = true,
}) {
  return (
    <div
      className={`print-preview-sheet print-sheet-st max-w-[210mm] mx-auto my-6 bg-white px-12 sm:px-20 py-8 sm:py-12 shadow-2xl border border-slate-300 doc-st print-hide-border ${
        isActive ? '' : 'hidden'
      }`}
    >
      <div className="space-y-4">
        {/* Kop Surat Kementerian Luar Negeri */}
        <div className="text-center pb-2 flex flex-col items-center justify-center">
          <img
            src="/images/kemlu-logo.webp"
            alt="Lambang Kementerian Luar Negeri"
            className="h-20 w-auto object-contain"
          />
          <p className="mt-1.5 text-[12px] font-extrabold tracking-wide text-blue-900 leading-tight">
            KEMENTERIAN LUAR NEGERI
          </p>
          <p className="mt-0.5 text-[9px] font-bold tracking-[0.22em] text-red-700 leading-tight">
            REPUBLIK INDONESIA
          </p>
        </div>

        {/* Judul Surat Tugas */}
        <div className="text-center space-y-1">
          <h1 className="font-bold text-base uppercase tracking-wider text-black underline underline-offset-2">
            SURAT TUGAS
          </h1>
          <p className="font-bold text-xs text-black">Nomor: {nomorST}</p>
        </div>

        {/* Isi Surat Tugas */}
        <div className="space-y-4 text-[13px] leading-relaxed">
          <p className="text-justify">
            Dalam rangka <strong>{suratTugas.perihal_nota || '-'}</strong>, sesuai{' '}
            {suratTugas.sumber_asal === 'INTERNAL' ? 'Nota Dinas' : 'Undangan'} dari{' '}
            <strong>{suratTugas.pengirim_nota || '-'}</strong> Nomor{' '}
            <strong>{suratTugas.nomor_nota || '-'}</strong> tanggal{' '}
            {formatDate(suratTugas.tanggal_nota)}, dengan ini kami menugaskan:
          </p>

          <table className="w-full table-fixed border-collapse text-[12px]">
            <colgroup>
              <col className="w-[8%]" />
              <col className="w-[36%]" />
              <col className="w-[28%]" />
              <col className="w-[28%]" />
            </colgroup>
            <thead>
              <tr className="font-bold">
                <th className="border border-slate-900 p-2 text-center">No</th>
                <th className="border border-slate-900 p-2 text-center">Nama/NIP</th>
                <th className="border border-slate-900 p-2 text-center">Pangkat/Golongan</th>
                <th className="border border-slate-900 p-2 text-center">Jabatan</th>
              </tr>
            </thead>
            <tbody>
              {pegawaiList.length > 0 ? (
                pegawaiList.map((pegawai, index) => (
                  <tr key={pegawai.id || pegawai.nip || index}>
                    <td className="border border-slate-900 p-2 text-center">{index + 1}</td>
                    <td className="border border-slate-900 p-2">
                      {pegawai.nama || '-'}
                      <br />
                      NIP. {pegawai.nip || '-'}
                    </td>
                    <td className="border border-slate-900 p-2">
                      {pegawai.pangkat || '-'} / {pegawai.golongan || '-'}
                    </td>
                    <td className="border border-slate-900 p-2">{pegawai.jabatan || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="border border-slate-900 p-2 text-center">
                    Belum ada data personel.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <p className="text-justify">
            untuk menghadiri <strong>{suratTugas.perihal_nota || '-'}</strong> di{' '}
            <strong>{tujuanPerjalanan}</strong> pada tanggal{' '}
            <strong>
              {tanggalBerangkat}
              {tanggalKembali !== '-' ? ` s.d. ${tanggalKembali}` : ''}
            </strong>
            .
          </p>
          <p className="text-justify">
            Seluruh biaya yang berkaitan dengan pelaksanaan tugas ini dibebankan pada
            Daftar Isian Pelaksanaan Anggaran (DIPA) Pusat Pendidikan dan Pelatihan
            Tahun Anggaran {tahunAnggaran}.
          </p>
          <p className="text-justify">
            Surat tugas ini disusun untuk dilaksanakan dan setelah dilaksanakan pelaksana tugas
            segera menyampaikan laporan kepada Kepala Pusat Pendidikan dan Pelatihan.
          </p>
          <p className="text-justify">
            Demikian Surat Tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab.
          </p>
        </div>

        {/* Tanda Tangan Kepala Pusat */}
        <div className="pt-6 flex justify-end text-xs">
          <div className="text-left w-72 text-[13px]">
            <div className="leading-snug">
              <p>Dikeluarkan di Jakarta</p>
              <p>Pada tanggal {tanggalSurat}</p>
              <p className="font-bold mt-1">Kepala Pusat Pendidikan dan Pelatihan</p>
            </div>

            {/* Space tanda tangan antara jabatan dan nama */}
            <div className="h-24 sm:h-28" />

            <div>
              <p className="font-bold underline">{kapusNama || '..............................'}</p>
              <p className="text-[12px]">NIP. {kapusNip || '..............................'}</p>
            </div>
          </div>
        </div>

        {/* Tembusan */}
        <div className="pt-4 text-[12px]">
          <p>Tembusan:</p>
          <ol className="list-decimal pl-6">
            <li>Administrator AMS/PMS</li>
            <li>Yang bersangkutan</li>
            <li>Arsip</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
