import React from 'react';
import { spellNumber } from './printHelpers';

export default function SpdSheet({
  suratTugas,
  pegawaiList = [],
  nomorST = '-',
  nomorSPD = '-',
  tanggalSurat = '-',
  tanggalBerangkat = '-',
  tanggalKembali = '-',
  tujuanPerjalanan = '-',
  tahunAnggaran = '-',
  ppkNama = '-',
  ppkNip = '-',
  isActive = true,
}) {
  const pegawaiMain = pegawaiList[0] || { nama: '-', nip: '-', pangkat: '-', golongan: '-', jabatan: '-' };
  const multiPegawai = pegawaiList.length > 1;
  const pengikutList = pegawaiList.slice(1);

  return (
    <div
      className={`print-preview-sheet print-sheet-spd max-w-[210mm] mx-auto my-6 bg-white px-10 sm:px-16 py-6 sm:py-10 shadow-2xl border border-slate-300 doc-st print-hide-border ${
        isActive ? '' : 'hidden'
      }`}
    >
      <div className={`spd-document space-y-6 ${isActive ? '' : 'hidden'}`}>
        {/* Kop Surat SPD */}
        <div className="spd-letterhead grid grid-cols-[1fr_auto_1fr] items-start gap-2">
          <div />
          <div className="spd-brand text-center">
            <img
              src="/images/kemlu-logo.webp"
              alt="Lambang Kementerian Luar Negeri"
              className="mx-auto h-20 w-auto object-contain"
            />
            <p className="spd-brand-name font-extrabold text-blue-900">
              KEMENTERIAN LUAR NEGERI
            </p>
            <p className="spd-brand-country font-bold tracking-[0.2em] text-red-700">
              REPUBLIK INDONESIA
            </p>
          </div>
          <div className="spd-annex pt-1 text-[8px] leading-relaxed">
            LAMPIRAN I<br />
            PERATURAN MENTERI KEUANGAN REPUBLIK INDONESIA<br />
            NOMOR 113/PMK.05/2012<br />
            TENTANG<br />
            PERJALANAN DINAS DALAM NEGERI BAGI PEJABAT NEGARA, PEGAWAI NEGERI, DAN PEGAWAI TIDAK TETAP
          </div>
        </div>

        {/* Metadata Dokumen SPD */}
        <div className="spd-info flex items-end justify-between text-[11px]">
          <div className="font-bold uppercase leading-relaxed text-center">
            <p>KEMENTERIAN LUAR NEGERI</p>
            <p>(PUSAT PENDIDIKAN DAN PELATIHAN)</p>
          </div>
          <div className="grid grid-cols-[auto_auto] gap-x-2 leading-relaxed">
            <span>Lembar</span>
            <span>: 1</span>
            <span>Kode</span>
            <span>: -</span>
            <span>Nomor</span>
            <span>: {nomorSPD}</span>
          </div>
        </div>

        {/* Judul Dokumen */}
        <div className="spd-title text-center py-2">
          <h2 className="font-bold text-base uppercase tracking-wider text-black">
            SURAT PERJALANAN DINAS
          </h2>
        </div>

        {/* Tabel Isian SPD PMK 113 */}
        <table className="spd-table w-full table-fixed border-collapse border border-slate-900 text-[11px] leading-snug">
          <colgroup>
            <col className="w-[6%]" />
            <col className="w-[38%]" />
            <col className="w-[28%]" />
            <col className="w-[28%]" />
          </colgroup>
          <tbody>
            <tr>
              <td className="border border-slate-900 p-2 text-center font-bold">1</td>
              <td className="border border-slate-900 p-2">Pejabat Pembuat Komitmen</td>
              <td colSpan="2" className="border border-slate-900 p-2 font-bold uppercase">
                {ppkNama}
              </td>
            </tr>
            <tr>
              <td rowSpan="2" className="border border-slate-900 p-2 text-center font-bold">2</td>
              <td rowSpan="2" className="border border-slate-900 p-2">
                Nama/NIP Pegawai yang melaksanakan perjalanan dinas
              </td>
              <td colSpan="2" className="border border-slate-900 p-2">
                {multiPegawai ? `${pegawaiMain.nama}, dkk` : pegawaiMain.nama}
              </td>
            </tr>
            <tr>
              <td colSpan="2" className="border border-slate-900 p-2">
                {multiPegawai ? 'Terlampir' : `NIP. ${pegawaiMain.nip}`}
              </td>
            </tr>
            <tr>
              <td rowSpan="3" className="border border-slate-900 p-2 text-center font-bold">3</td>
              <td className="border border-slate-900 p-2">a. Pangkat dan Golongan</td>
              <td colSpan="2" className="border border-slate-900 p-2">
                {multiPegawai ? 'Terlampir' : `${pegawaiMain.pangkat} (Gol. ${pegawaiMain.golongan})`}
              </td>
            </tr>
            <tr>
              <td className="border border-slate-900 p-2">b. Jabatan/Instansi</td>
              <td colSpan="2" className="border border-slate-900 p-2">
                {multiPegawai ? 'Terlampir' : `${pegawaiMain.jabatan} / Pusat Pendidikan dan Pelatihan`}
              </td>
            </tr>
            <tr>
              <td className="border border-slate-900 p-2">c. Tingkat Biaya Perjalanan Dinas</td>
              <td colSpan="2" className="border border-slate-900 p-2">
                {multiPegawai ? 'Terlampir' : `Tingkat ${suratTugas.tingkat_biaya_kode || '-'}`}
              </td>
            </tr>
            <tr className="h-20">
              <td className="border border-slate-900 p-2 text-center font-bold">4</td>
              <td className="border border-slate-900 p-2">Maksud Perjalanan Dinas</td>
              <td colSpan="2" className="border border-slate-900 p-2">
                {suratTugas.perihal_nota || '-'}
              </td>
            </tr>
            <tr>
              <td className="border border-slate-900 p-2 text-center font-bold">5</td>
              <td className="border border-slate-900 p-2">Alat angkutan yang dipergunakan</td>
              <td colSpan="2" className="border border-slate-900 p-2">
                {suratTugas.jenis_angkutan_nama || '-'}
              </td>
            </tr>
            <tr>
              <td rowSpan="2" className="border border-slate-900 p-2 text-center font-bold">6</td>
              <td className="border border-slate-900 p-2">a. Tempat berangkat</td>
              <td colSpan="2" className="border border-slate-900 p-2">
                {suratTugas.tempat_berangkat || '-'}
              </td>
            </tr>
            <tr>
              <td className="border border-slate-900 p-2">b. Tempat tujuan</td>
              <td colSpan="2" className="border border-slate-900 p-2">
                {tujuanPerjalanan}
                {suratTugas.no_setneg ? ` (Izin Setneg No: ${suratTugas.no_setneg})` : ''}
              </td>
            </tr>
            <tr>
              <td rowSpan="3" className="border border-slate-900 p-2 text-center font-bold">7</td>
              <td className="border border-slate-900 p-2">a. Lamanya Perjalanan Dinas</td>
              <td colSpan="2" className="border border-slate-900 p-2">
                a. {suratTugas.durasi_hari || '-'} ({spellNumber(Number(suratTugas.durasi_hari))}) hari
              </td>
            </tr>
            <tr>
              <td className="border border-slate-900 p-2">b. Tanggal Berangkat</td>
              <td colSpan="2" className="border border-slate-900 p-2">
                b. {tanggalBerangkat}
              </td>
            </tr>
            <tr>
              <td className="border border-slate-900 p-2">c. Tanggal harus kembali/tiba di tempat baru *)</td>
              <td colSpan="2" className="border border-slate-900 p-2">
                c. {tanggalKembali}
              </td>
            </tr>
            <tr>
              <td rowSpan="2" className="border border-slate-900 p-2 text-center font-bold">8</td>
              <td className="border border-slate-900 p-2">Pengikut: Nama</td>
              <td className="border border-slate-900 p-2 text-center">Tanggal Lahir</td>
              <td className="border border-slate-900 p-2 text-center">Keterangan</td>
            </tr>
            <tr>
              <td className="border border-slate-900 p-2 align-top">
                {pengikutList.length > 0 ? (
                  pengikutList.map((pegawai, index) => (
                    <p key={pegawai.id || pegawai.nip || index}>
                      {index + 1}. {pegawai.nama}
                    </p>
                  ))
                ) : (
                  <p>
                    1.<br />
                    2.<br />
                    3.<br />
                    4.<br />
                    5.
                  </p>
                )}
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
              <td className="border border-slate-900 p-2">
                a. Instansi<br />
                b. Akun
              </td>
              <td colSpan="2" className="border border-slate-900 p-2">
                a. Pusat Pendidikan dan Pelatihan<br />
                b. DIPA Pusdiklat Kemlu Tahun Anggaran {tahunAnggaran}
              </td>
            </tr>
            <tr>
              <td className="border border-slate-900 p-2 text-center font-bold">10</td>
              <td className="border border-slate-900 p-2">Keterangan lain-lain</td>
              <td colSpan="2" className="border border-slate-900 p-2">
                Surat Tugas No. {nomorST} tanggal {tanggalSurat}
              </td>
            </tr>
          </tbody>
        </table>

        <p className="text-[9px] text-slate-700 italic pt-1">*)coret yang tidak perlu</p>

        {/* Tanda Tangan & Digital Stamp PPK */}
        <div className="spd-footer pt-4 flex justify-end text-xs relative">
          <div className="text-left w-72 space-y-3 relative">
            <div className="leading-snug text-[11px]">
              <p>Dikeluarkan di: Jakarta</p>
              <p>Pada Tanggal: {tanggalSurat}</p>
              <p className="font-bold uppercase mt-1">Pejabat Pembuat Komitmen (PPK)</p>
            </div>

            <div className="spd-stamp-space h-16" />

            <div>
              <p className="font-bold underline uppercase">{ppkNama}</p>
              <p className="text-[11px]">NIP. {ppkNip}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
