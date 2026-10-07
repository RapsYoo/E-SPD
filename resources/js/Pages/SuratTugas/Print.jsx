import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Printer, ArrowLeft } from 'lucide-react';

const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function formatDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || '');
  if (!match) return '-';

  const [, year, month, day] = match;
  return `${Number(day)} ${monthNames[Number(month) - 1]} ${year}`;
}

function formatShortDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || '');
  if (!match) return '-';

  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const [, year, month, day] = match;
  return `${day}-${shortMonths[Number(month) - 1]}-${year.slice(-2)}`;
}

function spellNumber(value) {
  const words = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh'];
  return words[value] || String(value || '-');
}

export default function Print({ suratTugas }) {
  const [activeDocument, setActiveDocument] = useState('st');
  const pegawaiList = Array.isArray(suratTugas.pegawai_list) ? suratTugas.pegawai_list : [];
  const pegawaiMain = pegawaiList[0] || { nama: '-', nip: '-', pangkat: '-', golongan: '-', jabatan: '-' };
  const tujuanPerjalanan = [suratTugas.tempat_tujuan, suratTugas.kategori_perjalanan === 'LUAR_NEGERI' ? suratTugas.negara_tujuan : null]
    .filter(Boolean)
    .join(', ') || '-';
  const tanggalSurat = formatDate(suratTugas.tanggal_surat);
  const tanggalBerangkat = formatDate(suratTugas.tanggal_berangkat);
  const tanggalKembali = formatDate(suratTugas.tanggal_kembali);
  const ppkNama = suratTugas.ppk_nama_snapshot || suratTugas.ppk?.nama || '-';
  const ppkNip = suratTugas.ppk_nip_snapshot || suratTugas.ppk?.nip || '-';
  const ppkSigned = Boolean(suratTugas.is_ppk_signed);
  const multiPegawai = pegawaiList.length > 1;
  const pengikutList = pegawaiList.slice(1);
  const tahunAnggaran = suratTugas.tanggal_surat?.slice(0, 4) || suratTugas.tanggal_berangkat?.slice(0, 4) || '-';

  return (
    <div className="print-document-flow min-h-screen bg-slate-200 font-sans text-black">
      <Head title={`Cetak ST & SPD - ${suratTugas.nomor_st || 'Resmi'}`} />
      <style>{`.print-document-flow { display: flex; flex-direction: column; } .print-document-sheet { order: 1; } .print-break-lampiran { order: 2; } .print-sheet-lampiran { order: 3; } .print-break-visum { order: 4; } .print-sheet-visum { order: 5; } .print-sheet-lampiran, .print-sheet-visum { box-sizing: border-box; width: 100%; max-width: 210mm; margin: 1.5rem auto; padding: 2rem 3rem; background: white; border: 1px solid #cbd5e1; box-shadow: 0 20px 25px -5px rgb(15 23 42 / 0.12); } @media print { @page { size: A4; margin: 14mm; } .no-print { display: none !important; } .print-document-flow { display: block; background: white; } .print-document-sheet, .print-sheet-lampiran, .print-sheet-visum { max-width: none; margin: 0; padding: 0; box-shadow: none; border: 0; } .print-page-break { display: none !important; } .print-hide-border { border: 0 !important; } }`}</style>
      <style>{`.spd-brand img { width: 25mm; height: 19mm; object-fit: contain; }
        .spd-brand-name { margin-top: 0.5mm; font-size: 8pt; font-weight: 700; line-height: 1; }
        .spd-brand-country { margin-top: 1mm; font-size: 6pt; letter-spacing: 1.5pt; line-height: 1; color: #b4233a; }
        .spd-annex { font-size: 5.5pt; line-height: 1.2; }
        @media print {
        @page { size: A4 portrait; margin: 8mm; }
        .spd-document { box-sizing: border-box; display: flex; flex-direction: column; gap: 2mm; width: 194mm; height: 281mm; max-height: 281mm; overflow: hidden; font-size: 8pt; line-height: 1.05; }
        .spd-document > :not([hidden]) ~ :not([hidden]) { margin-top: 0 !important; }
        .spd-letterhead { height: 34mm; flex: 0 0 34mm; }
        .spd-brand { display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1; }
        .spd-info { min-height: 11mm; flex: 0 0 11mm; }
        .spd-title { min-height: 8mm; flex: 0 0 8mm; padding: 0 !important; }
        .spd-title h2 { font-size: 12pt; }
        .spd-table { width: 100%; flex: 1 1 auto; table-layout: fixed; font-size: 7.2pt; line-height: 1.05; }
        .spd-table td { padding: 0.6mm !important; line-height: 1 !important; }
        .spd-table .h-20 { height: auto !important; min-height: 7mm; }
        .spd-footer { min-height: 36mm; flex: 0 0 36mm; padding-top: 0.5mm !important; }
        .spd-stamp-space { height: 18mm !important; min-height: 18mm; flex: 0 0 18mm; }
        .spd-stamp-space .border-dashed { width: 14mm; height: 14mm; font-size: 5pt; }
        .print-sheet-st { width: 194mm; margin: 0 auto; }
      }`}</style>

      {/* Top Floating Control Bar (Hidden on Print) */}
      <div className="no-print bg-[#0F2C59] text-white p-4 shadow-lg border-b-4 border-amber-500 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href={`/surat-tugas/${suratTugas.id}`}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Ruang Kerja</span>
          </Link>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.print()}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-5 py-2 rounded-xl shadow-lg transition flex items-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Dokumen Ini / Simpan PDF</span>
            </button>
          </div>
        </div>

      </div>

      <div className="no-print mx-auto mb-4 flex w-full max-w-5xl gap-2 overflow-x-auto border-b border-slate-300 px-4">
        {[
          { id: 'st', label: '1. Surat Tugas (ST)' },
          { id: 'spd', label: '2. SPD Lembar 1' },
          { id: 'lampiran', label: '3. Lampiran Matriks SPD' },
          { id: 'visum', label: '4. Lembar Visum Rampungan' },
        ].map((document) => (
          <button
            key={document.id}
            type="button"
            role="tab"
            aria-selected={activeDocument === document.id}
            onClick={() => setActiveDocument(document.id)}
            className={`shrink-0 border-b-2 px-4 py-2 text-xs font-bold transition ${
              activeDocument === document.id
                ? 'border-[#0F2C59] bg-[#0F2C59] text-white'
                : 'border-transparent bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            {document.label}
          </button>
        ))}
      </div>

        <div className="print-page-break print-break-lampiran hidden border-t-2 border-dashed border-slate-300 pt-12"></div>

        {/* ================= DOKUMEN 3: LAMPIRAN SPD ================= */}
        <section className={`print-sheet-lampiran space-y-5 text-[10px] leading-snug ${activeDocument === 'lampiran' ? '' : 'hidden'}`}>
          <header className="flex items-start justify-between gap-6">
            <h2 className="pt-5 text-sm font-bold">Lampiran SPD</h2>
            <p className="max-w-[58%] text-[8px] leading-relaxed">
              LAMPIRAN IV<br />
              PERATURAN DIRJEN PERBENDAHARAAN NOMOR PER-22/PB/2011 TENTANG KETENTUAN LEBIH LANJUT PELAKSANAAN PERJALANAN DINAS DALAM NEGERI BAGI PEJABAT NEGARA, PEGAWAI NEGERI DAN PEGAWAI TIDAK TETAP
            </p>
          </header>

          <div className="space-y-1 text-[11px]">
            <p><span className="inline-block w-32">Nomor</span>: {suratTugas.nomor_spd || '-'}</p>
            <p><span className="inline-block w-32">Tanggal</span>: {tanggalSurat}</p>
            <p className="pt-2"><span className="inline-block w-32">DAFTAR PESERTA KEGIATAN</span>: {suratTugas.perihal_nota || '-'}</p>
            <p className="pt-2"><span className="inline-block w-32">TANGGAL PENYELENGGARAAN</span>: {tanggalBerangkat}{tanggalKembali !== '-' ? ` s.d. ${tanggalKembali}` : ''}</p>
            <p><span className="inline-block w-32">KOTA TEMPAT PENYELENGGARAAN</span>: {tujuanPerjalanan}</p>
            <p><span className="inline-block w-32">SATUAN KERJA</span>: Pusat Pendidikan dan Pelatihan</p>
            <p><span className="inline-block w-32">KEMENTERIAN NEGARA/LEMBAGA</span>: Kementerian Luar Negeri</p>
          </div>

          <table className="w-full table-fixed border-collapse text-center text-[8px] leading-tight">
            <thead>
              <tr>
                <th rowSpan="2" className="border border-black p-1">No</th>
                <th rowSpan="2" className="border border-black p-1">Nama Pelaksana SPD / NIP / Jabatan / Pangkat Golongan</th>
                <th rowSpan="2" className="border border-black p-1">Tempat Kedudukan Asal</th>
                <th rowSpan="2" className="border border-black p-1">Tingkat Biaya</th>
                <th rowSpan="2" className="border border-black p-1">Alat Angkutan</th>
                <th colSpan="2" className="border border-black p-1">Surat Tugas</th>
                <th colSpan="2" className="border border-black p-1">Tanggal</th>
                <th rowSpan="2" className="border border-black p-1">Lama Dinas</th>
                <th rowSpan="2" className="border border-black p-1">Ket</th>
              </tr>
              <tr>
                <th className="border border-black p-1">Nomor</th>
                <th className="border border-black p-1">Tanggal</th>
                <th className="border border-black p-1">Berangkat</th>
                <th className="border border-black p-1">Kembali</th>
              </tr>
            </thead>
            <tbody>
              {pegawaiList.length > 0 ? pegawaiList.map((pegawai, index) => (
                <tr key={pegawai.id || pegawai.nip || index}>
                  <td className="border border-black p-1">{index + 1}</td>
                  <td className="border border-black p-1 text-left">
                    <strong>{pegawai.nama || '-'}</strong><br />
                    NIP. {pegawai.nip || '-'}<br />
                    {pegawai.jabatan || '-'}<br />
                    {pegawai.pangkat || '-'} / {pegawai.golongan || '-'}
                  </td>
                  <td className="border border-black p-1">{suratTugas.tempat_berangkat || '-'}</td>
                  <td className="border border-black p-1">{suratTugas.tingkat_biaya_kode || '-'}</td>
                  <td className="border border-black p-1">{suratTugas.jenis_angkutan_nama || '-'}</td>
                  <td className="border border-black p-1 break-words">{suratTugas.nomor_st || '-'}</td>
                  <td className="border border-black p-1">{tanggalSurat}</td>
                  <td className="border border-black p-1">{formatShortDate(suratTugas.tanggal_berangkat)}</td>
                  <td className="border border-black p-1">{formatShortDate(suratTugas.tanggal_kembali)}</td>
                  <td className="border border-black p-1">{suratTugas.durasi_hari || '-'} hari</td>
                  <td className="border border-black p-1">-</td>
                </tr>
              )) : (
                <tr><td colSpan="11" className="border border-black p-3">Belum ada data personel.</td></tr>
              )}
            </tbody>
          </table>

          <footer className="ml-auto w-2/5 pt-2 text-[10px]">
            <p>Jakarta, {tanggalSurat}</p>
            <p className="pl-3">Mengetahui/Menyetujui:</p>
            <p className="pl-3">Pejabat Pembuat Komitmen</p>
            <div className="h-20" />
            {ppkSigned && <p className="font-bold text-blue-800">TTD DIGITAL PPK</p>}
            <p className="pl-3 font-bold underline">{ppkNama}</p>
            <p className="pl-3">NIP. {ppkNip}</p>
          </footer>
        </section>

        <div className="print-page-break print-break-visum hidden border-t-2 border-dashed border-slate-300 pt-12"></div>

        {/* ================= DOKUMEN 4: VISUM RAMPUNGAN ================= */}
        <section className={`print-sheet-visum space-y-4 text-[10px] leading-snug ${activeDocument === 'visum' ? '' : 'hidden'}`}>
          <header className="text-center">
            <img src="/images/kemlu-logo.webp" alt="Lambang Kementerian Luar Negeri" className="mx-auto h-20 w-auto object-contain" />
            <h2 className="font-bold tracking-wide">KEMENTERIAN LUAR NEGERI</h2>
            <p className="text-[9px] tracking-[0.2em]">REPUBLIK INDONESIA</p>
            <p className="mt-3 font-bold">- 2 -</p>
          </header>

          <table className="w-full table-fixed border-collapse text-[9px] leading-snug">
            <colgroup><col className="w-[6%]" /><col className="w-[47%]" /><col className="w-[47%]" /></colgroup>
            <tbody>
              <tr className="h-32">
                <td colSpan="2" className="border border-black p-2" />
                <td className="border border-black p-2 align-top">
                  <p><strong className="mr-2">I</strong>Berangkat dari (tempat kedudukan): {suratTugas.tempat_berangkat || '-'}</p>
                  <p className="mt-1">ke: {tujuanPerjalanan}</p>
                  <p className="mt-1">Pada tanggal: {tanggalBerangkat}</p>
                  <div className="mt-2 text-center">Pejabat Pembuat Komitmen</div>
                  <div className="h-10" />
                  {ppkSigned && <div className="text-center font-bold text-blue-800">TTD DIGITAL PPK</div>}
                  <p className="text-center font-bold underline">{ppkNama}</p>
                  <p className="text-center">NIP. {ppkNip}</p>
                </td>
              </tr>
              <tr className="h-28">
                <td className="border border-black p-2 text-center">II</td>
                <td className="border border-black p-2 align-top">
                  <p>Tiba di: {tujuanPerjalanan}</p>
                  <p className="mt-1">Pada tanggal: {tanggalBerangkat}</p>
                  <p className="mt-1">Kepala: ____________________</p>
                  <div className="mt-8 text-center">(__________________)</div>
                  <p className="text-center">NIP. __________________</p>
                </td>
                <td className="border border-black p-2 align-top">
                  <p>Berangkat dari: {tujuanPerjalanan}</p>
                  <p className="mt-1">ke: {suratTugas.tempat_berangkat || '-'}</p>
                  <p className="mt-1">Pada tanggal: {tanggalKembali}</p>
                  <p className="mt-1">Kepala: ____________________</p>
                  <div className="mt-4 text-center">(__________________)</div>
                  <p className="text-center">NIP. __________________</p>
                </td>
              </tr>
              {['III', 'IV', 'V'].map((nomor) => (
                <tr key={nomor} className="h-24">
                  <td className="border border-black p-2 text-center">{nomor}</td>
                  <td className="border border-black p-2 align-top">
                    <p>Tiba di: ____________________</p>
                    <p className="mt-1">Pada tanggal: ______________</p>
                    <p className="mt-1">Kepala: ___________________</p>
                    <div className="mt-5 text-center">(__________________)</div>
                    <p className="text-center">NIP. __________________</p>
                  </td>
                  <td className="border border-black p-2 align-top">
                    <p>Berangkat dari: ______________</p>
                    <p className="mt-1">ke: _______________________</p>
                    <p className="mt-1">Pada tanggal: ______________</p>
                    <p className="mt-1">Kepala: ___________________</p>
                    <div className="mt-3 text-center">(__________________)</div>
                    <p className="text-center">NIP. __________________</p>
                  </td>
                </tr>
              ))}
              <tr className="h-32">
                <td className="border border-black p-2 text-center">VI</td>
                <td className="border border-black p-2 align-top">
                  <p>Tiba di (tempat kedudukan): {suratTugas.tempat_berangkat || '-'}</p>
                  <p className="mt-1">Pada tanggal: {tanggalKembali}</p>
                  <div className="mt-2 text-center">Pejabat Pembuat Komitmen</div>
                  <div className="h-8" />
                  {ppkSigned && <div className="text-center font-bold text-blue-800">TTD DIGITAL PPK</div>}
                  <p className="text-center font-bold underline">{ppkNama}</p>
                  <p className="text-center">NIP. {ppkNip}</p>
                </td>
                <td className="border border-black p-2 align-top">
                  <p>Telah diperiksa dengan keterangan bahwa perjalanan tersebut atas perintahnya dan semata-mata untuk kepentingan jabatan dalam waktu yang sesingkat-singkatnya.</p>
                  <div className="mt-2 text-center">Pejabat Pembuat Komitmen</div>
                  <div className="h-8" />
                  {ppkSigned && <div className="text-center font-bold text-blue-800">TTD DIGITAL PPK</div>}
                  <p className="text-center font-bold underline">{ppkNama}</p>
                  <p className="text-center">NIP. {ppkNip}</p>
                </td>
              </tr>
              <tr>
                <td className="border border-black p-2 text-center">VII</td>
                <td colSpan="2" className="border border-black p-2">Catatan Lain-lain:</td>
              </tr>
              <tr>
                <td className="border border-black p-2 text-center align-top">VIII</td>
                <td colSpan="2" className="border border-black p-2">
                  PERHATIAN: PPK yang menerbitkan SPD, pegawai yang melakukan perjalanan dinas, para pejabat yang mengesahkan tanggal berangkat/tiba, serta bendahara pengeluaran bertanggung jawab berdasarkan peraturan-peraturan Keuangan negara apabila negara menderita rugi akibat kesalahan, kelalaian, dan kealpaannya.
                </td>
              </tr>
            </tbody>
          </table>
        </section>

      {/* Document Sheet Container */}
      <div className={`print-document-sheet max-w-[210mm] mx-auto my-6 bg-white p-8 sm:p-12 shadow-2xl border border-slate-300 doc-st print-hide-border ${['st', 'spd'].includes(activeDocument) ? '' : 'hidden'}`}>
        {/* ================= DOKUMEN 1: SURAT TUGAS ================= */}
        <div className={`print-sheet-st space-y-6 ${activeDocument === 'st' ? '' : 'hidden'}`}>
          {/* Kop surat sesuai format ST */}
          <div className="text-center pb-2 leading-tight">
            <img src="/images/kemlu-logo.webp" alt="Lambang Kementerian Luar Negeri" className="mx-auto h-20 w-24 object-contain" />
            <p className="mt-1 text-[9px] font-bold tracking-wide">KEMENTERIAN LUAR NEGERI</p>
            <p className="text-[7px] tracking-[0.2em] text-rose-700">REPUBLIK INDONESIA</p>
          </div>

          {/* Judul Surat Tugas */}
          <div className="text-center space-y-1">
            <h1 className="font-bold text-base underline uppercase tracking-wider">SURAT TUGAS</h1>
            <p className="font-mono text-xs font-bold">Nomor: {suratTugas.nomor_st || '-'}</p>
          </div>

          <div className="space-y-4 text-[13px] leading-relaxed">
            <p className="text-justify">
              Dalam rangka <strong>{suratTugas.perihal_nota || '-'}</strong>, sesuai {suratTugas.sumber_asal === 'INTERNAL' ? 'Nota Dinas' : 'Undangan'} dari <strong>{suratTugas.pengirim_nota || '-'}</strong> Nomor <strong>{suratTugas.nomor_nota || '-'}</strong> tanggal {formatDate(suratTugas.tanggal_nota)}, dengan ini kami menugaskan:
            </p>

            <table className="w-full table-fixed border-collapse text-[12px]">
              <colgroup><col className="w-[8%]" /><col className="w-[36%]" /><col className="w-[28%]" /><col className="w-[28%]" /></colgroup>
              <thead>
                <tr className="font-bold">
                  <th className="border border-slate-900 p-2 text-center">No</th>
                  <th className="border border-slate-900 p-2 text-center">Nama/NIP</th>
                  <th className="border border-slate-900 p-2 text-center">Pangkat/Golongan</th>
                  <th className="border border-slate-900 p-2 text-center">Jabatan</th>
                </tr>
              </thead>
              <tbody>
                {pegawaiList.length > 0 ? pegawaiList.map((pegawai, index) => (
                  <tr key={pegawai.id || pegawai.nip || index}>
                    <td className="border border-slate-900 p-2 text-center">{index + 1}</td>
                    <td className="border border-slate-900 p-2">{pegawai.nama || '-'}<br />NIP. {pegawai.nip || '-'}</td>
                    <td className="border border-slate-900 p-2">{pegawai.pangkat || '-'} / {pegawai.golongan || '-'}</td>
                    <td className="border border-slate-900 p-2">{pegawai.jabatan || '-'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="border border-slate-900 p-2 text-center">Belum ada data personel.</td></tr>
                )}
              </tbody>
            </table>

            <p className="text-justify">
              untuk menghadiri <strong>{suratTugas.perihal_nota || '-'}</strong> di <strong>{tujuanPerjalanan}</strong> pada tanggal <strong>{tanggalBerangkat}{tanggalKembali !== '-' ? ` s.d. ${tanggalKembali}` : ''}</strong>.
            </p>
            <p className="text-justify">
              Seluruh biaya yang berkaitan dengan pelaksanaan tugas ini dibebankan pada Daftar Isian Pelaksanaan Anggaran (DIPA) Pusat Pendidikan dan Pelatihan Tahun Anggaran {suratTugas.tanggal_surat?.slice(0, 4) || suratTugas.tanggal_berangkat?.slice(0, 4) || '-'}.
            </p>
            <p className="text-justify">
              Surat tugas ini disusun untuk dilaksanakan dan setelah dilaksanakan pelaksana tugas segera menyampaikan laporan kepada Kepala Pusat Pendidikan dan Pelatihan.
            </p>
            <p className="text-justify">Demikian Surat Tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab.</p>
          </div>

          {/* TTD Kepala Pusat */}
          <div className="pt-8 flex justify-end text-xs">
            <div className="text-center w-64 space-y-10 text-[13px]">
              <div>
                <p>Jakarta, {tanggalSurat}</p>
                <p className="font-bold uppercase mt-1">Kepala Pusat Pendidikan dan Pelatihan</p>
              </div>

              <div>
                <p className="font-bold underline">Khasan Ashari</p>
                <p className="font-mono text-[11px]">NIP. 19750617 200003 1 001</p>
              </div>
            </div>
          </div>

          <div className="pt-4 text-[12px]">
            <p>Tembusan:</p>
            <ol className="list-decimal pl-6">
              <li>Administrator AMS/PMS</li>
              <li>Yang bersangkutan</li>
              <li>Arsip</li>
            </ol>
          </div>
        </div>

        {/* Page Break for Print */}
        <div className="print-page-break print-break-spd hidden border-t-2 border-dashed border-slate-300 pt-12"></div>

        {/* ================= DOKUMEN 2: SURAT PERJALANAN DINAS (SPD) ================= */}
        <div className={`spd-document print-sheet-spd space-y-6 ${activeDocument === 'spd' ? '' : 'hidden'}`}>
          <div className="spd-letterhead grid grid-cols-[1fr_auto_1fr] items-start gap-2">
            <div />
            <div className="spd-brand text-center">
              <img src="/images/kemlu-logo.webp" alt="Lambang Kementerian Luar Negeri" className="mx-auto object-contain" />
              <p className="spd-brand-name">KEMENTERIAN LUAR NEGERI</p>
              <p className="spd-brand-country">REPUBLIK INDONESIA</p>
            </div>
            <div className="spd-annex pt-1 text-[8px] leading-relaxed">
              LAMPIRAN I<br />
              PERATURAN MENTERI KEUANGAN REPUBLIK INDONESIA<br />
              NOMOR 113/PMK.05/2012<br />
              TENTANG<br />
              PERJALANAN DINAS DALAM NEGERI BAGI PEJABAT NEGARA, PEGAWAI NEGERI, DAN PEGAWAI TIDAK TETAP
            </div>
          </div>

          <div className="spd-info flex items-end justify-between text-[11px]">
            <div className="font-bold uppercase leading-relaxed">
              <p>KEMENTERIAN LUAR NEGERI</p>
              <p>(PUSAT PENDIDIKAN DAN PELATIHAN)</p>
            </div>
            <div className="grid grid-cols-[auto_auto] gap-x-2 leading-relaxed">
              <span>Lembar</span><span>: 1</span>
              <span>Kode</span><span>: -</span>
              <span>Nomor</span><span>: {suratTugas.nomor_spd || '-'}</span>
            </div>
          </div>

          <div className="spd-title text-center py-2">
            <h2 className="font-bold text-lg uppercase">SURAT PERJALANAN DINAS</h2>
          </div>

          {/* Tabel Isian SPD PMK 113 */}
          <table className="spd-table w-full table-fixed border-collapse border border-slate-900 text-[11px] leading-snug">
            <colgroup><col className="w-[6%]" /><col className="w-[38%]" /><col className="w-[28%]" /><col className="w-[28%]" /></colgroup>
            <tbody>
              <tr>
                <td className="border border-slate-900 p-2 text-center font-bold">1</td>
                <td className="border border-slate-900 p-2">Pejabat Pembuat Komitmen</td>
                <td colSpan="2" className="border border-slate-900 p-2 font-bold uppercase">{ppkNama}</td>
              </tr>
              <tr>
                <td rowSpan="2" className="border border-slate-900 p-2 text-center font-bold">2</td>
                <td rowSpan="2" className="border border-slate-900 p-2">Nama/NIP Pegawai yang melaksanakan perjalanan dinas</td>
                <td colSpan="2" className="border border-slate-900 p-2">{multiPegawai ? `${pegawaiMain.nama}, dkk` : pegawaiMain.nama}</td>
              </tr>
              <tr><td colSpan="2" className="border border-slate-900 p-2">{multiPegawai ? 'Terlampir' : `NIP. ${pegawaiMain.nip}`}</td></tr>
              <tr>
                <td rowSpan="3" className="border border-slate-900 p-2 text-center font-bold">3</td>
                <td className="border border-slate-900 p-2">a. Pangkat dan Golongan</td>
                <td colSpan="2" className="border border-slate-900 p-2">{multiPegawai ? 'Terlampir' : `${pegawaiMain.pangkat} (Gol. ${pegawaiMain.golongan})`}</td>
              </tr>
              <tr>
                <td className="border border-slate-900 p-2">b. Jabatan/Instansi</td>
                <td colSpan="2" className="border border-slate-900 p-2">{multiPegawai ? 'Terlampir' : `${pegawaiMain.jabatan} / Pusat Pendidikan dan Pelatihan`}</td>
              </tr>
              <tr>
                <td className="border border-slate-900 p-2">c. Tingkat Biaya Perjalanan Dinas</td>
                <td colSpan="2" className="border border-slate-900 p-2">{multiPegawai ? 'Terlampir' : `Tingkat ${suratTugas.tingkat_biaya_kode || '-'}`}</td>
              </tr>
              <tr className="h-20">
                <td className="border border-slate-900 p-2 text-center font-bold">4</td>
                <td className="border border-slate-900 p-2">Maksud Perjalanan Dinas</td>
                <td colSpan="2" className="border border-slate-900 p-2">{suratTugas.perihal_nota || '-'}</td>
              </tr>
              <tr>
                <td className="border border-slate-900 p-2 text-center font-bold">5</td>
                <td className="border border-slate-900 p-2">Alat angkutan yang dipergunakan</td>
                <td colSpan="2" className="border border-slate-900 p-2">{suratTugas.jenis_angkutan_nama || '-'}</td>
              </tr>
              <tr>
                <td rowSpan="2" className="border border-slate-900 p-2 text-center font-bold">6</td>
                <td className="border border-slate-900 p-2">a. Tempat berangkat</td>
                <td colSpan="2" className="border border-slate-900 p-2">{suratTugas.tempat_berangkat || '-'}</td>
              </tr>
              <tr>
                <td className="border border-slate-900 p-2">b. Tempat tujuan</td>
                <td colSpan="2" className="border border-slate-900 p-2">{tujuanPerjalanan}{suratTugas.no_setneg ? ` (Izin Setneg No: ${suratTugas.no_setneg})` : ''}</td>
              </tr>
              <tr>
                <td rowSpan="3" className="border border-slate-900 p-2 text-center font-bold">7</td>
                <td className="border border-slate-900 p-2">a. Lamanya Perjalanan Dinas</td>
                <td colSpan="2" className="border border-slate-900 p-2">a. {suratTugas.durasi_hari || '-'} ({spellNumber(Number(suratTugas.durasi_hari))}) hari</td>
              </tr>
              <tr><td className="border border-slate-900 p-2">b. Tanggal Berangkat</td><td colSpan="2" className="border border-slate-900 p-2">b. {tanggalBerangkat}</td></tr>
              <tr><td className="border border-slate-900 p-2">c. Tanggal harus kembali/tiba di tempat baru *)</td><td colSpan="2" className="border border-slate-900 p-2">c. {tanggalKembali}</td></tr>
              <tr>
                <td rowSpan="2" className="border border-slate-900 p-2 text-center font-bold">8</td>
                <td className="border border-slate-900 p-2">Pengikut: Nama</td>
                <td className="border border-slate-900 p-2 text-center">Tanggal Lahir</td>
                <td className="border border-slate-900 p-2 text-center">Keterangan</td>
              </tr>
              <tr>
                <td className="border border-slate-900 p-2 align-top">
                  {pengikutList.length > 0 ? pengikutList.map((pegawai, index) => (
                    <p key={pegawai.id || pegawai.nip || index}>{index + 1}. {pegawai.nama} (NIP. {pegawai.nip})</p>
                  )) : <p>1.<br />2.<br />3.<br />4.<br />5.</p>}
                </td>
                <td className="border border-slate-900 p-2" />
                <td className="border border-slate-900 p-2" />
              </tr>
              <tr>
                <td rowSpan="2" className="border border-slate-900 p-2 text-center font-bold">9</td>
                <td className="border border-slate-900 p-2">Pembebanan Anggaran</td>
                <td colSpan="2" className="border border-slate-900 p-2" />
              </tr>
              <tr>
                <td className="border border-slate-900 p-2">a. Instansi<br />b. Akun</td>
                <td colSpan="2" className="border border-slate-900 p-2">a. Pusat Pendidikan dan Pelatihan<br />b. DIPA Pusdiklat Kemlu Tahun Anggaran {tahunAnggaran}</td>
              </tr>
              <tr>
                <td className="border border-slate-900 p-2 text-center font-bold">10</td>
                <td className="border border-slate-900 p-2">Keterangan lain-lain</td>
                <td colSpan="2" className="border border-slate-900 p-2">Surat Tugas No. {suratTugas.nomor_st || '-'} tanggal {tanggalSurat}</td>
              </tr>
            </tbody>
          </table>

          {/* Signature & Digital Stamp Overlay */}
          <div className="spd-footer pt-6 flex justify-end text-xs relative">
            <div className="text-center w-72 space-y-4 relative">
              <div>
                <p>Dikeluarkan di: Jakarta</p>
                <p>Pada Tanggal: {tanggalSurat}</p>
                <p className="font-bold uppercase mt-1">Pejabat Pembuat Komitmen (PPK)</p>
              </div>

              <div className="spd-stamp-space h-20 flex items-center justify-center relative">
                {ppkSigned && <div className="border-2 border-dashed border-blue-700 text-blue-900 rounded-full w-24 h-24 flex items-center justify-center text-[8px] font-bold uppercase text-center transform -rotate-12 opacity-80 shadow-sm">
                  <span>Pusdiklat Kemlu<br /><strong>VERIFIED PPK</strong><br />DIGITAL STAMP</span>
                </div>}
              </div>

              <div>
                <p className="font-bold underline uppercase">{ppkNama}</p>
                <p className="font-mono text-[11px]">NIP. {ppkNip}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
