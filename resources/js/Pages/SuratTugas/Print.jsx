import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Printer, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function Print({ suratTugas }) {
  const pegawaiMain = suratTugas.pegawai_list && suratTugas.pegawai_list.length > 0
    ? suratTugas.pegawai_list[0]
    : { nama: 'Geovannie Foresty Palembangan', nip: '19810702 200901 1 002', pangkat: 'Pembina', golongan: 'IV/a', jabatan: 'Diplomat Ahli Madya' };

  return (
    <div className="min-h-screen bg-slate-200 font-sans text-black">
      <Head title={`Cetak ST & SPD - ${suratTugas.nomor_st || 'Resmi'}`} />

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
            <span className="text-xs text-slate-300 hidden sm:inline">Format Dokumen Kemlu PMK 113/PMK.05/2012</span>
            <button
              onClick={() => window.print()}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-5 py-2 rounded-xl shadow-lg transition flex items-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Document Sheet Container */}
      <div className="max-w-[210mm] mx-auto my-6 bg-white p-8 sm:p-12 shadow-2xl border border-slate-300 doc-st space-y-12">
        {/* ================= DOKUMEN 1: SURAT TUGAS ================= */}
        <div className="space-y-6">
          {/* Kop Surat Pusdiklat Kemlu */}
          <div className="text-center border-b-4 border-double border-slate-900 pb-3">
            <h2 className="font-bold text-base tracking-widest uppercase">KEMENTERIAN LUAR NEGERI REPUBLIK INDONESIA</h2>
            <h3 className="font-extrabold text-lg uppercase tracking-wide">PUSAT PENDIDIKAN DAN PELATIHAN</h3>
            <p className="text-[11px] text-slate-700">Jalan Sisingamangaraja No. 73, Kebayoran Baru, Jakarta Selatan 12120</p>
            <p className="text-[10px] text-slate-600">Telepon: (021) 3848626 | Website: www.kemlu.go.id</p>
          </div>

          {/* Judul Surat Tugas */}
          <div className="text-center space-y-1">
            <h1 className="font-bold text-base underline uppercase tracking-wider">SURAT TUGAS</h1>
            <p className="font-mono text-xs font-bold">Nomor: {suratTugas.nomor_st || 'ST/KP/08581/08/2026/79'}</p>
          </div>

          {/* Menimbang & Dasar */}
          <div className="space-y-3 text-xs leading-relaxed">
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-2 font-bold uppercase">Menimbang</div>
              <div className="col-span-1 text-center">:</div>
              <div className="col-span-9">
                Bahwa dalam rangka {suratTugas.perihal_nota}, dipandang perlu menugaskan Pegawai Negeri Sipil di lingkungan Pusat Pendidikan dan Pelatihan Kementerian Luar Negeri.
              </div>
            </div>

            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-2 font-bold uppercase">Dasar</div>
              <div className="col-span-1 text-center">:</div>
              <div className="col-span-9 space-y-1">
                <p>1. Peraturan Menteri Keuangan Nomor 113/PMK.05/2012 tentang Perjalanan Dinas Dalam Negeri Bagi Pejabat Negara, Pegawai Negeri, dan Pegawai Tidak Tetap;</p>
                <p>2. Nota / Undangan Nomor: <strong>{suratTugas.nomor_nota}</strong> dari <strong>{suratTugas.pengirim_nota}</strong> tanggal {suratTugas.tanggal_nota};</p>
                {suratTugas.catatan_kapus && (
                  <p>3. Disposisi Kepala Pusat Pendidikan dan Pelatihan Kementerian Luar Negeri RI.</p>
                )}
              </div>
            </div>
          </div>

          {/* Memberi Tugas */}
          <div className="text-center font-bold text-xs uppercase tracking-wider my-4">
            MEMBERI TUGAS:
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-2 font-bold uppercase">Kepada</div>
              <div className="col-span-1 text-center">:</div>
              <div className="col-span-9">
                <table className="w-full border-collapse border border-slate-900 text-xs">
                  <thead>
                    <tr className="bg-slate-100 font-bold border-b border-slate-900">
                      <th className="border border-slate-900 p-1.5 text-center w-8">No</th>
                      <th className="border border-slate-900 p-1.5 text-left">Nama / NIP</th>
                      <th className="border border-slate-900 p-1.5 text-left">Pangkat / Gol.</th>
                      <th className="border border-slate-900 p-1.5 text-left">Jabatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suratTugas.pegawai_list && suratTugas.pegawai_list.length > 0 ? (
                      suratTugas.pegawai_list.map((peg, idx) => (
                        <tr key={peg.id}>
                          <td className="border border-slate-900 p-1.5 text-center font-bold">{idx + 1}</td>
                          <td className="border border-slate-900 p-1.5">
                            <div className="font-bold">{peg.nama}</div>
                            <div className="font-mono text-[10px]">NIP: {peg.nip}</div>
                          </td>
                          <td className="border border-slate-900 p-1.5">
                            <div>{peg.pangkat}</div>
                            <div className="text-[10px]">Gol. {peg.golongan}</div>
                          </td>
                          <td className="border border-slate-900 p-1.5">{peg.jabatan}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="p-2 text-center">Data pegawai pelaksana.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-2 font-bold uppercase">Untuk</div>
              <div className="col-span-1 text-center">:</div>
              <div className="col-span-9 leading-relaxed">
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Melaksanakan penugasan dinas ke <strong>{suratTugas.tempat_tujuan}</strong> dalam rangka <strong>{suratTugas.perihal_nota}</strong>.</li>
                  <li>Perjalanan dinas dilaksanakan selama <strong>{suratTugas.durasi_hari} ({suratTugas.durasi_hari}) hari</strong> terhitung mulai tanggal <strong>{suratTugas.tanggal_berangkat}</strong> sampai dengan <strong>{suratTugas.tanggal_kembali}</strong>.</li>
                  <li>Melaporkan hasil pelaksanaan tugas kepada Kepala Pusat Pendidikan dan Pelatihan Kemlu RI setelah menyelesaikan penugasan.</li>
                </ol>
              </div>
            </div>
          </div>

          {/* TTD Kepala Pusat */}
          <div className="pt-8 flex justify-end text-xs">
            <div className="text-center w-64 space-y-12">
              <div>
                <p>Jakarta, {suratTugas.tanggal_surat || '21 Agustus 2026'}</p>
                <p className="font-bold uppercase mt-1">Kepala Pusat Pendidikan dan Pelatihan</p>
              </div>

              <div>
                <p className="font-bold underline uppercase">Dr. Muhammad Takdir</p>
                <p className="font-mono text-[11px]">NIP. 19690412 199503 1 001</p>
              </div>
            </div>
          </div>
        </div>

        {/* Page Break for Print */}
        <div className="border-t-2 border-dashed border-slate-300 pt-12"></div>

        {/* ================= DOKUMEN 2: SURAT PERJALANAN DINAS (SPD) ================= */}
        <div className="space-y-6">
          <div className="text-right text-[10px] font-mono space-y-0.5">
            <p>LAMPIRAN I</p>
            <p>PERATURAN MENTERI KEUANGAN REPUBLIK INDONESIA</p>
            <p>NOMOR 113/PMK.05/2012 TENTANG PERJALANAN DINAS</p>
          </div>

          <div className="text-center space-y-1">
            <h2 className="font-bold text-base underline uppercase">SURAT PERJALANAN DINAS (SPD)</h2>
            <p className="font-mono text-xs font-bold">Nomor: {suratTugas.nomor_spd || '0088/DL-SPD/VIII/2026/79'}</p>
          </div>

          {/* Tabel Isian SPD PMK 113 */}
          <table className="w-full border-collapse border border-slate-900 text-xs">
            <tbody>
              <tr>
                <td className="border border-slate-900 p-2 w-8 text-center font-bold">1.</td>
                <td className="border border-slate-900 p-2 w-1/2">Pejabat Pembuat Komitmen</td>
                <td className="border border-slate-900 p-2 font-bold uppercase">{suratTugas.ppk_nama_snapshot || 'GEORGE JUNIOR'}</td>
              </tr>

              <tr>
                <td className="border border-slate-900 p-2 text-center font-bold">2.</td>
                <td className="border border-slate-900 p-2">Nama / NIP Pegawai yang diperintah</td>
                <td className="border border-slate-900 p-2">
                  <div className="font-bold">{pegawaiMain.nama}</div>
                  <div className="font-mono text-[11px]">NIP: {pegawaiMain.nip}</div>
                </td>
              </tr>

              <tr>
                <td className="border border-slate-900 p-2 text-center font-bold">3.</td>
                <td className="border border-slate-900 p-2">
                  a. Pangkat dan Golongan<br />
                  b. Jabatan / Instansi<br />
                  c. Tingkat Biaya Perjalanan Dinas
                </td>
                <td className="border border-slate-900 p-2">
                  a. {pegawaiMain.pangkat} (Gol. {pegawaiMain.golongan})<br />
                  b. {pegawaiMain.jabatan} / Pusdiklat Kemlu<br />
                  c. Tingkat {suratTugas.tingkat_biaya_kode || 'C'}
                </td>
              </tr>

              <tr>
                <td className="border border-slate-900 p-2 text-center font-bold">4.</td>
                <td className="border border-slate-900 p-2">Maksud Perjalanan Dinas</td>
                <td className="border border-slate-900 p-2">{suratTugas.perihal_nota}</td>
              </tr>

              <tr>
                <td className="border border-slate-900 p-2 text-center font-bold">5.</td>
                <td className="border border-slate-900 p-2">Alat Angkut yang dipergunakan</td>
                <td className="border border-slate-900 p-2 font-semibold">{suratTugas.jenis_angkutan_nama || 'Perjalanan Darat'}</td>
              </tr>

              <tr>
                <td className="border border-slate-900 p-2 text-center font-bold">6.</td>
                <td className="border border-slate-900 p-2">
                  a. Tempat Berangkat<br />
                  b. Tempat Tujuan
                </td>
                <td className="border border-slate-900 p-2">
                  a. {suratTugas.tempat_berangkat}<br />
                  b. <strong>{suratTugas.tempat_tujuan}</strong>
                </td>
              </tr>

              <tr>
                <td className="border border-slate-900 p-2 text-center font-bold">7.</td>
                <td className="border border-slate-900 p-2">
                  a. Lamanya Perjalanan Dinas<br />
                  b. Tanggal Berangkat<br />
                  c. Tanggal Harus Kembali
                </td>
                <td className="border border-slate-900 p-2">
                  a. {suratTugas.durasi_hari} ({suratTugas.durasi_hari}) Hari<br />
                  b. {suratTugas.tanggal_berangkat}<br />
                  c. {suratTugas.tanggal_kembali}
                </td>
              </tr>

              <tr>
                <td className="border border-slate-900 p-2 text-center font-bold">8.</td>
                <td className="border border-slate-900 p-2">Pengikut / Pelaksana Lainnya</td>
                <td className="border border-slate-900 p-2">
                  {suratTugas.pegawai_list && suratTugas.pegawai_list.length > 1 ? (
                    <ul className="list-disc pl-4">
                      {suratTugas.pegawai_list.slice(1).map((p, i) => (
                        <li key={i}>{p.nama} (NIP. {p.nip})</li>
                      ))}
                    </ul>
                  ) : (
                    <span>-</span>
                  )}
                </td>
              </tr>

              <tr>
                <td className="border border-slate-900 p-2 text-center font-bold">9.</td>
                <td className="border border-slate-900 p-2">Pembebanan Anggaran DIPA</td>
                <td className="border border-slate-900 p-2">DIPA Pusdiklat Kementerian Luar Negeri TA 2026</td>
              </tr>
            </tbody>
          </table>

          {/* Signature & Digital Stamp Overlay */}
          <div className="pt-6 flex justify-end text-xs relative">
            <div className="text-center w-72 space-y-4 relative">
              <div>
                <p>Dikeluarkan di: Jakarta</p>
                <p>Pada Tanggal: {suratTugas.tanggal_surat || '21 Agustus 2026'}</p>
                <p className="font-bold uppercase mt-1">Pejabat Pembuat Komitmen (PPK)</p>
              </div>

              <div className="h-20 flex items-center justify-center relative">
                {/* Stamp Badge simulation */}
                <div className="border-2 border-dashed border-blue-700 text-blue-900 rounded-full w-24 h-24 flex items-center justify-center text-[8px] font-bold uppercase text-center transform -rotate-12 opacity-80 shadow-sm">
                  <span>Pusdiklat Kemlu<br /><strong>VERIFIED PPK</strong><br />DIGITAL STAMP</span>
                </div>
              </div>

              <div>
                <p className="font-bold underline uppercase">{suratTugas.ppk_nama_snapshot || 'GEORGE JUNIOR'}</p>
                <p className="font-mono text-[11px]">NIP. {suratTugas.ppk_nip_snapshot || '19790315 200312 1 002'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
