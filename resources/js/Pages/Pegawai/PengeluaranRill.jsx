import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';

function formatDate(value) {
  if (!value) return '-';

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function PengeluaranRill({ suratTugas, pegawai, backUrl = null }) {
  const tujuan = [
    suratTugas.tempat_tujuan,
    suratTugas.kategori_perjalanan === 'LUAR_NEGERI' ? suratTugas.negara_tujuan : null,
  ].filter(Boolean).join(', ') || '-';

  return (
    <div className="min-h-screen bg-slate-200 text-black">
      <Head title={`Daftar Pengeluaran Riil - ${suratTugas.nomor_st || suratTugas.id}`} />
      <style>{`
        @page { size: A4 portrait; margin: 15mm; }
        @media print {
          .no-print { display: none !important; }
          .expense-sheet { width: 100% !important; margin: 0 !important; border: 0 !important; box-shadow: none !important; }
        }
      `}</style>

      <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b-4 border-amber-500 bg-[#0F2C59] p-4 text-white shadow-lg">
        <Link href={backUrl || route('dashboard')} className="inline-flex items-center gap-2 text-sm font-bold text-amber-300 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          {backUrl ? 'Kembali ke Kelola DPR' : 'Kembali ke Dashboard'}
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-amber-400"
        >
          <Printer className="h-4 w-4" />
          Cetak / Simpan PDF
        </button>
      </div>

      <main className="expense-sheet mx-auto my-6 w-full max-w-[210mm] border border-slate-300 bg-white p-8 shadow-xl sm:p-12">
        <header className="mb-6 text-center">
          <img src="/images/kemlu-logo.webp" alt="Lambang Kementerian Luar Negeri" className="mx-auto mb-2 h-16 w-auto object-contain" />
          <p className="text-sm font-bold tracking-wide">KEMENTERIAN LUAR NEGERI</p>
          <p className="text-xs font-bold tracking-[0.2em]">REPUBLIK INDONESIA</p>
          <h1 className="mt-6 text-base font-bold underline underline-offset-4">DAFTAR PENGELUARAN RIIL</h1>
        </header>

        <section className="mb-5 space-y-1 text-sm">
          <p>Nama/NIP <span className="ml-8">: {pegawai.nama} / {pegawai.nip || '-'}</span></p>
          <p>Pangkat/Golongan <span className="ml-8">: {pegawai.pangkat || '-'} / {pegawai.golongan || '-'}</span></p>
          <p>Jabatan/Unit Kerja <span className="ml-8">: {pegawai.jabatan || '-'} / {pegawai.unit_kerja || '-'}</span></p>
          <p>Surat Tugas / SPD <span className="ml-8">: {suratTugas.nomor_st || '-'} / {suratTugas.nomor_spd || '-'}</span></p>
          <p>Maksud Perjalanan <span className="ml-8">: {suratTugas.perihal_nota || '-'}</span></p>
          <p>Tujuan <span className="ml-8">: {tujuan}</span></p>
          <p>Tanggal Perjalanan <span className="ml-8">: {formatDate(suratTugas.tanggal_berangkat)} s.d. {formatDate(suratTugas.tanggal_kembali)}</span></p>
        </section>

        <p className="mb-3 text-sm leading-relaxed">
          Berdasarkan Surat Perjalanan Dinas tersebut di atas, bersama ini kami menyampaikan
          pengeluaran riil selama melaksanakan perjalanan dinas:
        </p>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-center font-bold">
              <th className="w-10 border border-black p-2">No.</th>
              <th className="border border-black p-2">Uraian Pengeluaran</th>
              <th className="w-36 border border-black p-2">Jumlah (Rp)</th>
              <th className="w-36 border border-black p-2">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {[
              'Tiket/transportasi perjalanan dinas',
              'Transportasi lokal',
              'Penginapan',
              'Pengeluaran lainnya',
              '',
              '',
            ].map((item, index) => (
              <tr key={index} className="h-11">
                <td className="border border-black p-2 text-center">{index + 1}</td>
                <td className="border border-black p-2">{item}</td>
                <td className="border border-black p-2" />
                <td className="border border-black p-2" />
              </tr>
            ))}
            <tr className="h-11 font-bold">
              <td colSpan="2" className="border border-black p-2 text-right">Jumlah</td>
              <td className="border border-black p-2" />
              <td className="border border-black p-2" />
            </tr>
          </tbody>
        </table>

        <p className="mt-4 text-sm">
          Bukti pengeluaran terlampir dan dapat dipertanggungjawabkan sesuai ketentuan yang berlaku.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-10 text-center text-sm">
          <div>
            <p>Mengetahui,</p>
            <p>Pejabat Pembuat Komitmen</p>
            <div className="h-20" />
            <p className="font-bold underline">{suratTugas.ppk_nama_snapshot || ' '}</p>
            <p>NIP. {suratTugas.ppk_nip_snapshot || '____________________'}</p>
          </div>
          <div>
            <p>{tujuan}, {formatDate(suratTugas.tanggal_kembali)}</p>
            <p>Pelaksana Perjalanan Dinas</p>
            <div className="h-20" />
            <p className="font-bold underline">{pegawai.nama}</p>
            <p>NIP. {pegawai.nip || '____________________'}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
