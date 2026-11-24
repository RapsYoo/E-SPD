import React from 'react';
import { calcRpdItemTotal, formatRupiah } from '@/Utils/terbilang';

function formatRangeTanggal(start, end) {
  if (!start && !end) return '-';
  const parse = (val) => {
    const raw = typeof val === 'string' && val.includes('T') ? val.slice(0, 10) : val;
    const d = new Date(`${raw}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  };
  const d1 = parse(start);
  const d2 = parse(end);
  if (d1 && d2) {
    const sameMonth = d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
    if (sameMonth) {
      const monthYear = d2.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      return `${d1.getDate()} - ${d2.getDate()} ${monthYear}`;
    }
    return `${d1.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} - ${d2.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  }
  const single = d1 || d2;
  return single ? single.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';
}

function formatMonthYear(value) {
  if (!value) {
    return new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }
  const raw = typeof value === 'string' && value.includes('T') ? value.slice(0, 10) : value;
  const d = new Date(`${raw}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

export default function DaftarNominatifSheet({
  suratTugas,
  pegawaiList = [],
  tujuanPerjalanan,
  ppkNama,
  ppkNip,
  bendaharaNama,
  bendaharaNip,
  isActive,
}) {
  if (!isActive) return null;

  const tanggalDoc = suratTugas.tanggal_rpd || suratTugas.tanggal_surat || suratTugas.tanggal_berangkat;

  const computedRows = pegawaiList.map((peg) => {
    const rawItems = Array.isArray(peg.rpd_items) && peg.rpd_items.length > 0
      ? peg.rpd_items
      : [{ jenis: '-', jumlah_satuan: '', besaran: 0, jumlah: 0, persentase: 100 }];

    const items = rawItems.map((it) => {
      const jumlah = Number(it.jumlah) || calcRpdItemTotal(it);
      const besaranIdr = it.mata_uang === 'USD'
        ? Math.round((Number(it.besaran) || 0) * (Number(it.kurs) || 1))
        : Number(it.besaran) || 0;
      return {
        ...it,
        besaran_idr: besaranIdr,
        jumlah_idr: jumlah,
      };
    });

    const total = items.reduce((sum, it) => sum + it.jumlah_idr, 0);
    return { peg, items, total };
  });

  const grandTotal = computedRows.reduce((sum, row) => sum + row.total, 0);

  return (
    <div className="print-sheet-lampiran mx-auto w-full max-w-[297mm] border border-slate-300 bg-white px-7 py-6 shadow text-[10px] leading-snug text-black">
      <div className="mb-3 inline-block border-b border-black pb-1 text-center text-[10px] font-medium">
        <p>Pusat Pendidikan dan Pelatihan</p>
        <p>Kementerian Luar Negeri</p>
      </div>

      <header className="mb-4 text-center">
        <h2 className="text-[12px] font-bold uppercase tracking-wide">
          DAFTAR NOMINATIF BIAYA PERJALANAN DINAS
        </h2>
        <p className="mt-1 text-[10.5px] font-bold">
          Dalam rangka {suratTugas.perihal_nota || '-'}, di {tujuanPerjalanan || '-'} pada tanggal {formatRangeTanggal(suratTugas.tanggal_berangkat, suratTugas.tanggal_kembali)}
        </p>
      </header>

      <table className="w-full border-collapse border border-black text-[9.5px]">
        <thead>
          <tr className="bg-slate-200/80 text-center font-bold">
            <th rowSpan={2} className="w-8 border border-black px-1.5 py-1.5">No.</th>
            <th rowSpan={2} className="w-[21%] border border-black px-2 py-1.5">Nama/NIP/Jabatan/Golongan</th>
            <th colSpan={6} className="border border-black px-2 py-1">Penerimaan</th>
            <th rowSpan={2} className="w-[15%] border border-black px-2 py-1.5">Data Rekening</th>
          </tr>
          <tr className="bg-slate-200/80 text-center font-bold">
            <th className="border border-black px-2 py-1">Jenis</th>
            <th className="w-8 border border-black px-1 py-1">hr</th>
            <th className="w-[11%] border border-black px-2 py-1">Besaran</th>
            <th className="w-[11%] border border-black px-2 py-1">Jumlah</th>
            <th className="w-14 border border-black px-1 py-1">Persentase</th>
            <th className="w-[12%] border border-black px-2 py-1">Total</th>
          </tr>
        </thead>
        <tbody>
          {computedRows.map(({ peg, items, total }, pegIdx) =>
            items.map((item, itemIdx) => (
              <tr key={`${peg.id}-${itemIdx}`} className="align-top">
                {itemIdx === 0 && (
                  <>
                    <td
                      rowSpan={items.length}
                      className="border border-black px-1.5 py-1.5 text-center align-middle font-medium"
                    >
                      {pegIdx + 1}
                    </td>
                    <td rowSpan={items.length} className="border border-black px-2 py-1.5 align-top">
                      <p className="font-semibold">{peg.nama}</p>
                      <p>NIP. {peg.nip || '-'}</p>
                      <p>{peg.jabatan || '-'}</p>
                      <p>{[peg.pangkat, peg.golongan].filter(Boolean).join('/ ') || '-'}</p>
                    </td>
                  </>
                )}

                <td className="border-x border-black px-2 py-1">
                  {item.jenis || item.uraian || '-'}
                </td>
                <td className="border-x border-black px-1 py-1 text-center font-mono">
                  {item.jumlah_satuan ? item.jumlah_satuan : ''}
                </td>
                <td className="border-x border-black px-2 py-1 font-mono">
                  {item.besaran_idr > 0 ? (
                    <div className="flex justify-between">
                      <span>Rp</span>
                      <span>{formatRupiah(item.besaran_idr)}</span>
                    </div>
                  ) : null}
                </td>
                <td className="border-x border-black px-2 py-1 font-mono">
                  {item.jumlah_idr > 0 ? (
                    <div className="flex justify-between">
                      <span>Rp</span>
                      <span>{formatRupiah(item.jumlah_idr)}</span>
                    </div>
                  ) : null}
                </td>
                <td className="border-x border-black px-1 py-1 text-center font-mono">
                  {item.jumlah_idr > 0 ? `${item.persentase ?? 100}%` : ''}
                </td>

                {itemIdx === 0 && (
                  <>
                    <td
                      rowSpan={items.length}
                      className="border border-black px-2 py-1.5 align-middle font-mono font-semibold"
                    >
                      <div className="flex justify-between">
                        <span>Rp</span>
                        <span>{formatRupiah(total)}</span>
                      </div>
                    </td>
                    <td
                      rowSpan={items.length}
                      className="border border-black px-2 py-1.5 text-center align-top"
                    >
                      <p className="font-medium">{peg.nama_rekening || peg.nama}</p>
                      <p className="font-mono">{peg.no_rekening || '-'}</p>
                      <p className="uppercase">{peg.kode_bank || '-'}</p>
                    </td>
                  </>
                )}
              </tr>
            ))
          )}

          <tr className="bg-slate-200/80 font-bold">
            <td colSpan={7} className="border border-black px-2 py-1.5 text-center uppercase tracking-wider">
              TOTAL
            </td>
            <td className="border border-black px-2 py-1.5 font-mono">
              <div className="flex justify-between">
                <span>Rp</span>
                <span>{formatRupiah(grandTotal)}</span>
              </div>
            </td>
            <td className="border border-black"></td>
          </tr>
        </tbody>
      </table>

      <div className="mt-6 grid grid-cols-2 gap-12 px-8 text-[10px]">
        <div className="text-center w-64">
          <p>Mengetahui/Menyetujui,</p>
          <p>Pejabat Pembuat Komitmen</p>
          <div className="h-14" />
          <p className="font-bold uppercase underline">{ppkNama || '-'}</p>
          <p>NIP. {ppkNip || '-'}</p>
        </div>

        <div className="ml-auto text-center w-64">
          <p>Jakarta, {formatMonthYear(tanggalDoc)}</p>
          <p>Yang membayarkan,</p>
          <p>Bendahara Pengeluaran</p>
          <div className="h-14" />
          <p className="font-bold uppercase underline">{bendaharaNama || '........................................'}</p>
          <p>NIP. {bendaharaNip || '-'}</p>
        </div>
      </div>
    </div>
  );
}
