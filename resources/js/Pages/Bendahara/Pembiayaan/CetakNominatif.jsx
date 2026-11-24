import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer, FileText } from 'lucide-react';
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

export default function CetakNominatif({ suratTugas, bendahara, ppk, backUrl }) {
  const pegawaiList = Array.isArray(suratTugas.pegawai_list) ? suratTugas.pegawai_list : [];
  const tujuan = [
    suratTugas.tempat_tujuan,
    suratTugas.kategori_perjalanan === 'LUAR_NEGERI' ? suratTugas.negara_tujuan : null,
  ].filter(Boolean).join(', ') || '-';

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
    return {
      peg,
      items,
      total,
    };
  });

  const grandTotal = computedRows.reduce((sum, row) => sum + row.total, 0);

  return (
    <div className="min-h-screen bg-slate-200 text-black font-sans">
      <Head title={`Daftar Nominatif Biaya Perjalanan Dinas - ${suratTugas.perihal_nota}`} />
      <style>{`
        @page { size: A4 landscape; margin: 10mm 12mm; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .nominatif-sheet {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Sticky Toolbar */}
      <div className="no-print sticky top-0 z-20 border-b-4 border-amber-500 bg-[#0F2C59] px-4 py-3 text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Link
              href={backUrl || route('surat-tugas.show', suratTugas.id)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali</span>
            </Link>
            <Link
              href={route('surat-tugas.cetak-rpd', suratTugas.id)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition"
            >
              <FileText className="h-3.5 w-3.5 text-amber-300" />
              <span>Lihat RPD per Pegawai</span>
            </Link>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow transition hover:bg-amber-400"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak / Simpan PDF (Landscape)</span>
          </button>
        </div>
      </div>

      {/* Landscape Sheet */}
      <main className="px-4 py-4">
        <article className="nominatif-sheet mx-auto w-full max-w-[297mm] border border-slate-300 bg-white px-8 py-7 shadow-xl text-[10.5px] leading-snug text-black">
          {/* Kop Kiri Atas */}
          <div className="mb-4 inline-block border-b border-black pb-1 text-center text-[10.5px] font-medium">
            <p>Pusat Pendidikan dan Pelatihan</p>
            <p>Kementerian Luar Negeri</p>
          </div>

          {/* Judul & Subjudul */}
          <header className="mb-4 text-center">
            <h1 className="text-[12.5px] font-bold uppercase tracking-wide">
              DAFTAR NOMINATIF BIAYA PERJALANAN DINAS
            </h1>
            <p className="mt-1 text-[11px] font-bold">
              Dalam rangka {suratTugas.perihal_nota || '-'}, di {tujuan} pada tanggal {formatRangeTanggal(suratTugas.tanggal_berangkat, suratTugas.tanggal_kembali)}
            </p>
          </header>

          {/* Tabel Daftar Nominatif */}
          <table className="w-full border-collapse border border-black text-[10px]">
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
                          <p>
                            {[peg.pangkat, peg.golongan].filter(Boolean).join('/ ') || '-'}
                          </p>
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

              {/* Grand Total Row */}
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

          {/* Tanda Tangan PPK & Bendahara Pengeluaran */}
          <div className="mt-7 grid grid-cols-2 gap-12 px-8 text-[10.5px]">
            <div className="text-center w-64">
              <p>Mengetahui/Menyetujui,</p>
              <p>Pejabat Pembuat Komitmen</p>
              <div className="h-16" />
              <p className="font-bold uppercase underline">{ppk?.nama || '-'}</p>
              <p>NIP. {ppk?.nip || '-'}</p>
            </div>

            <div className="ml-auto text-center w-64">
              <p>Jakarta, {formatMonthYear(tanggalDoc)}</p>
              <p>Yang membayarkan,</p>
              <p>Bendahara Pengeluaran</p>
              <div className="h-16" />
              <p className="font-bold uppercase underline">{bendahara?.nama || '........................................'}</p>
              <p>NIP. {bendahara?.nip || '-'}</p>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
