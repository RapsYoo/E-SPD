import React from 'react';
import { formatShortDate } from './printHelpers';

export default function LampiranMatriksSheet({
  suratTugas,
  pegawaiList = [],
  nomorST = '-',
  nomorSPD = '-',
  tanggalSurat = '-',
  tanggalSuratRaw = null,
  tanggalBerangkat = '-',
  tanggalKembali = '-',
  tujuanPerjalanan = '-',
  ppkNama = '-',
  ppkNip = '-',
  isActive = true,
}) {
  return (
    <section
      className={`print-preview-sheet print-sheet-lampiran space-y-5 text-[10px] leading-snug ${
        isActive ? '' : 'hidden'
      }`}
    >
      <header className="flex items-start justify-between gap-6">
        <h2 className="pt-5 text-xs font-bold">Lampiran SPD</h2>
        <p className="max-w-[35%] text-[6px] leading-tight">
          LAMPIRAN IV<br />
          PERATURAN DIRJEN PERBENDAHARAAN NOMOR PER-22/PB/2011 TENTANG KETENTUAN LEBIH LANJUT
          PELAKSANAAN PERJALANAN DINAS DALAM NEGERI BAGI PEJABAT NEGARA, PEGAWAI NEGERI DAN PEGAWAI TIDAK TETAP
        </p>
      </header>

      <div className="grid grid-cols-[200px_14px_1fr] text-[10px] leading-relaxed">
        <span>Nomor</span>
        <span>:</span>
        <span>{nomorSPD}</span>

        <span>Tanggal</span>
        <span>:</span>
        <span>{tanggalSurat}</span>

        <span className="pt-2">DAFTAR PESERTA KEGIATAN</span>
        <span className="pt-2">:</span>
        <span className="pt-2">{suratTugas.perihal_nota || '-'}</span>

        <span className="pt-2">TANGGAL PENYELENGGARAAN</span>
        <span className="pt-2">:</span>
        <span className="pt-2">
          {tanggalBerangkat}
          {tanggalKembali !== '-' ? ` s.d ${tanggalKembali}` : ''}
        </span>

        <span>KOTA TEMPAT PENYELENGGARAAN</span>
        <span>:</span>
        <span>{tujuanPerjalanan}</span>

        <span>SATUAN KERJA</span>
        <span>:</span>
        <span>Pusat Pendidikan dan Pelatihan</span>

        <span>KEMENTERIAN NEGARA/LEMBAGA</span>
        <span>:</span>
        <span>Kementerian Luar Negeri</span>
      </div>

      <table className="w-full table-fixed border-collapse text-center text-[8.5px] leading-tight border border-black">
        <colgroup>
          <col className="w-[5%]" />
          <col className="w-[22%]" />
          <col className="w-[9%]" />
          <col className="w-[7%]" />
          <col className="w-[8%]" />
          <col className="w-[14%]" />
          <col className="w-[7%]" />
          <col className="w-[8%]" />
          <col className="w-[8%]" />
          <col className="w-[7%]" />
          <col className="w-[5%]" />
        </colgroup>
        <thead>
          <tr className="font-bold">
            <th rowSpan="2" className="border border-black p-1 align-middle text-center">
              No
            </th>
            <th rowSpan="2" className="border border-black p-1 align-middle text-center">
              Nama Pelaksana SPD/NIP/Jabatan/Pangkat Golongan
            </th>
            <th rowSpan="2" className="border border-black p-1 align-middle text-center">
              Tempat Kedudukan Asal
            </th>
            <th rowSpan="2" className="border border-black p-1 align-middle text-center">
              Tingkat Biaya Perjalanan Dinas
            </th>
            <th rowSpan="2" className="border border-black p-1 align-middle text-center">
              Alat Angkutan yang digunakan
            </th>
            <th colSpan="2" className="border border-black p-1 align-middle text-center">
              Surat Tugas
            </th>
            <th colSpan="2" className="border border-black p-1 align-middle text-center">
              Tanggal
            </th>
            <th rowSpan="2" className="border border-black p-1 align-middle text-center">
              Lama dinas (hari)
            </th>
            <th rowSpan="2" className="border border-black p-1 align-middle text-center">
              Ket
            </th>
          </tr>
          <tr className="font-bold">
            <th className="border border-black p-1 align-middle text-center">Nomor</th>
            <th className="border border-black p-1 align-middle text-center">Tanggal</th>
            <th className="border border-black p-1 align-middle text-center">Berangkat</th>
            <th className="border border-black p-1 align-middle text-center">Kembali</th>
          </tr>
        </thead>
        <tbody>
          {pegawaiList.length > 0 ? (
            pegawaiList.map((pegawai, index) => {
              const isFirst = index === 0;
              const formattedSuratTugasNo = nomorST.toLowerCase().startsWith('surat tugas')
                ? `${nomorST} tanggal ${tanggalSurat}`
                : `Surat Tugas No. ${nomorST} tanggal ${tanggalSurat}`;

              return (
                <tr key={pegawai.id || pegawai.nip || index}>
                  <td className="border border-black p-1 text-center align-middle">{index + 1}</td>
                  <td className="border border-black p-2 text-left align-middle">
                    <div>{pegawai.nama || '-'}</div>
                    <div>NIP. {pegawai.nip || '-'}</div>
                    <div>{pegawai.jabatan || '-'}</div>
                    <div>
                      {pegawai.pangkat && pegawai.golongan
                        ? `${pegawai.pangkat} / ${pegawai.golongan}`
                        : pegawai.pangkat || pegawai.golongan || '-'}
                    </div>
                  </td>
                  <td className="border border-black p-1 text-center align-middle">
                    {isFirst ? suratTugas.tempat_berangkat || '-' : 'idem'}
                  </td>
                  <td className="border border-black p-1 text-center align-middle">
                    {isFirst ? suratTugas.tingkat_biaya_kode || '-' : 'idem'}
                  </td>
                  <td className="border border-black p-1 text-center align-middle">
                    {isFirst ? suratTugas.jenis_angkutan_nama || '-' : 'idem'}
                  </td>
                  <td className="border border-black p-1 text-center align-middle break-words">
                    {isFirst ? formattedSuratTugasNo : 'idem'}
                  </td>
                  <td className="lampiran-date border border-black p-1 text-center align-middle whitespace-nowrap text-[8px]">
                    {isFirst ? formatShortDate(tanggalSuratRaw) : 'idem'}
                  </td>
                  <td className="lampiran-date border border-black p-1 text-center align-middle whitespace-nowrap text-[8px]">
                    {formatShortDate(suratTugas.tanggal_berangkat)}
                  </td>
                  <td className="lampiran-date border border-black p-1 text-center align-middle whitespace-nowrap text-[8px]">
                    {formatShortDate(suratTugas.tanggal_kembali)}
                  </td>
                  <td className="border border-black p-1 text-center align-middle">
                    {suratTugas.durasi_hari || '-'} Hari
                  </td>
                  <td className="border border-black p-1 text-center align-middle">
                    {/* Ket */}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="11" className="border border-black p-3 text-center">
                Belum ada data personel.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <footer className="ml-auto w-64 pt-6 text-[10px] text-center space-y-1">
        <p>Jakarta, {tanggalSurat}</p>
        <p>Mengetahui/Menyetujui:</p>
        <p>Pejabat Pembuat Komitmen</p>
        <div className="h-16" />
        <p className="font-bold underline uppercase">{ppkNama}</p>
        <p>NIP. {ppkNip}</p>
      </footer>
    </section>
  );
}
