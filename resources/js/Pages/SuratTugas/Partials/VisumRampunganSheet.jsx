import React from 'react';

export default function VisumRampunganSheet({
  suratTugas,
  tanggalBerangkat = '-',
  tanggalKembali = '-',
  tujuanPerjalanan = '-',
  ppkNama = '-',
  ppkNip = '-',
  ppkSigned = false,
  isActive = true,
}) {
  return (
    <section
      className={`print-sheet-visum space-y-4 text-[10px] leading-snug ${
        isActive ? '' : 'hidden'
      }`}
    >
      <header className="text-center">
        <img
          src="/images/kemlu-logo.webp"
          alt="Lambang Kementerian Luar Negeri"
          className="mx-auto h-20 w-auto object-contain"
        />
        <h2 className="font-bold tracking-wide">KEMENTERIAN LUAR NEGERI</h2>
        <p className="text-[9px] tracking-[0.2em]">REPUBLIK INDONESIA</p>
        <p className="mt-3 font-bold">- 2 -</p>
      </header>

      <table className="w-full table-fixed border-collapse text-[9px] leading-snug">
        <colgroup>
          <col className="w-[6%]" />
          <col className="w-[47%]" />
          <col className="w-[47%]" />
        </colgroup>
        <tbody>
          <tr className="h-32">
            <td colSpan="2" className="border border-black p-2" />
            <td className="border border-black p-2 align-top">
              <p>
                <strong className="mr-2">I</strong>Berangkat dari (tempat kedudukan):{' '}
                {suratTugas.tempat_berangkat || '-'}
              </p>
              <p className="mt-1">ke: {tujuanPerjalanan}</p>
              <p className="mt-1">Pada tanggal: {tanggalBerangkat}</p>
              <div className="mt-2 text-center">Pejabat Pembuat Komitmen</div>
              <div className="h-10" />
              {ppkSigned && (
                <div className="text-center font-bold text-blue-800">TTD DIGITAL PPK</div>
              )}
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
              {ppkSigned && (
                <div className="text-center font-bold text-blue-800">TTD DIGITAL PPK</div>
              )}
              <p className="text-center font-bold underline">{ppkNama}</p>
              <p className="text-center">NIP. {ppkNip}</p>
            </td>
            <td className="border border-black p-2 align-top">
              <p>
                Telah diperiksa dengan keterangan bahwa perjalanan tersebut atas perintahnya dan
                semata-mata untuk kepentingan jabatan dalam waktu yang sesingkat-singkatnya.
              </p>
              <div className="mt-2 text-center">Pejabat Pembuat Komitmen</div>
              <div className="h-8" />
              {ppkSigned && (
                <div className="text-center font-bold text-blue-800">TTD DIGITAL PPK</div>
              )}
              <p className="text-center font-bold underline">{ppkNama}</p>
              <p className="text-center">NIP. {ppkNip}</p>
            </td>
          </tr>
          <tr>
            <td className="border border-black p-2 text-center">VII</td>
            <td colSpan="2" className="border border-black p-2">
              Catatan Lain-lain:
            </td>
          </tr>
          <tr>
            <td className="border border-black p-2 text-center align-top">VIII</td>
            <td colSpan="2" className="border border-black p-2">
              PERHATIAN: PPK yang menerbitkan SPD, pegawai yang melakukan perjalanan dinas, para
              pejabat yang mengesahkan tanggal berangkat/tiba, serta bendahara pengeluaran
              bertanggung jawab berdasarkan peraturan-peraturan Keuangan negara apabila negara
              menderita rugi akibat kesalahan, kelalaian, dan kealpaannya.
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
