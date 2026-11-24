import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer, FileSpreadsheet } from 'lucide-react';
import { calcRpdItemTotal, formatRupiah, terbilangRupiah } from '@/Utils/terbilang';

function formatLongDate(value) {
  if (!value) return '-';
  const raw = typeof value === 'string' && value.includes('T') ? value.slice(0, 10) : value;
  const date = new Date(`${raw}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatMonthYear(value) {
  if (!value) return '';
  const raw = typeof value === 'string' && value.includes('T') ? value.slice(0, 10) : value;
  const date = new Date(`${raw}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

function formatPerincian(item) {
  const qty = Number(item.jumlah_satuan) || 0;
  const satuan = item.satuan || 'Hari';
  const pct = Number(item.persentase ?? 100);
  const besaran = Number(item.besaran) || 0;

  if (item.mata_uang === 'USD') {
    const kurs = Number(item.kurs) || 0;
    return `${qty} ${satuan}  x  ${pct}%  x  $ ${formatRupiah(besaran)}  x  Kurs ${formatRupiah(kurs)}`;
  }

  return `${qty} ${satuan}  x  ${pct}%  x  Rp ${formatRupiah(besaran)}`;
}

function RpdSingleSheet({ suratTugas, peserta, bendahara, ppk }) {
  const items = Array.isArray(peserta.rpd_items) ? peserta.rpd_items : [];
  const total = items.length > 0
    ? items.reduce((sum, item) => sum + (Number(item.jumlah) || calcRpdItemTotal(item)), 0)
    : Number(peserta.rpd_total) || 0;

  const telahDibayar = peserta.rpd_telah_dibayar !== null && peserta.rpd_telah_dibayar !== undefined
    ? Number(peserta.rpd_telah_dibayar)
    : total;
  const sisa = total - telahDibayar;

  const tanggalDoc = suratTugas.tanggal_rpd || suratTugas.tanggal_surat || suratTugas.tanggal_berangkat;

  return (
    <article className="rpd-sheet mx-auto my-6 w-full max-w-[210mm] border border-slate-300 bg-white px-10 py-8 shadow-xl text-[11px] leading-snug text-black">
      {/* Top Right PMK Notice */}
      <div className="flex justify-end mb-2">
        <div className="w-[48%] text-[7.5px] leading-tight uppercase tracking-tight text-slate-900">
          <p className="font-semibold">LAMPIRAN II</p>
          <p>PERATURAN MENTERI KEUANGAN REPUBLIK INDONESIA</p>
          <p>NOMOR 113/PMK.05/2012</p>
          <p>TENTANG</p>
          <p>PERJALANAN DINAS DALAM NEGERI BAGI PEJABAT NEGARA, PEGAWAI NEGERI, DAN PEGAWAI TIDAK TETAP</p>
        </div>
      </div>

      {/* Logo & Kop */}
      <header className="text-center mb-5">
        <img
          src="/images/kemlu-logo.webp"
          alt="Lambang Kementerian Luar Negeri"
          className="mx-auto mb-1.5 h-16 w-auto object-contain"
        />
        <p className="text-[12px] font-bold tracking-wide text-[#0F2C59]">KEMENTERIAN LUAR NEGERI</p>
        <p className="text-[10px] font-bold tracking-[0.2em] text-[#8B1E24]">REPUBLIK INDONESIA</p>

        <h1 className="mt-4 text-[13px] font-bold tracking-wide uppercase">
          RINCIAN BIAYA PERJALANAN DINAS
        </h1>
      </header>

      {/* Metadata Lampiran SPD */}
      <div className="mb-3 grid grid-cols-[150px_12px_1fr] gap-y-0.5 text-[11px]">
        <span>Lampiran SPD Nomor</span>
        <span>:</span>
        <span className="font-medium">{suratTugas.nomor_spd || '[Belum diterbitkan TU]'}</span>

        <span>Tanggal</span>
        <span>:</span>
        <span>{formatLongDate(tanggalDoc)}</span>
      </div>

      {/* Tabel Rincian Biaya */}
      <table className="w-full border-collapse border border-black text-[10.5px]">
        <thead>
          <tr className="text-center font-bold">
            <th className="w-9 border border-black px-2 py-2">No.</th>
            <th className="border border-black px-2 py-2">Uraian/Keterangan</th>
            <th className="w-[42%] border border-black px-2 py-2">Perincian Biaya</th>
            <th className="w-[18%] border border-black px-2 py-2">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={4} className="border border-black px-3 py-8 text-center italic text-slate-500">
                Belum ada rincian komponen biaya yang diinput untuk pegawai ini.
              </td>
            </tr>
          ) : (
            items.map((item, idx) => {
              const rowJumlah = Number(item.jumlah) || calcRpdItemTotal(item);
              return (
                <tr key={idx} className="align-top">
                  <td className="border-x border-black px-2 py-1.5 text-center">{idx + 1}</td>
                  <td className="border-x border-black px-2 py-1.5">{item.uraian || item.jenis || '-'}</td>
                  <td className="border-x border-black px-2 py-1.5 font-mono text-[10px]">
                    {formatPerincian(item)}
                  </td>
                  <td className="border-x border-black px-2 py-1.5">
                    <div className="flex justify-between font-mono">
                      <span>Rp</span>
                      <span>{formatRupiah(rowJumlah)}</span>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
          {/* Spacer rows agar proporsional seperti format PMK */}
          <tr>
            <td className="border-x border-black h-12"></td>
            <td className="border-x border-black"></td>
            <td className="border-x border-black"></td>
            <td className="border-x border-black"></td>
          </tr>
          {/* Total Row */}
          <tr className="font-bold border-t border-black">
            <td colSpan={3} className="border border-black px-2 py-1.5 text-right">Jumlah</td>
            <td className="border border-black px-2 py-1.5">
              <div className="flex justify-between font-mono">
                <span>Rp</span>
                <span>{formatRupiah(total)}</span>
              </div>
            </td>
          </tr>
          {/* Terbilang */}
          <tr>
            <td colSpan={4} className="border border-black px-2 py-1.5">
              <span className="font-semibold">Terbilang :</span>{' '}
              <span className="italic font-semibold">{terbilangRupiah(total)}</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Blok Tanda Tangan Bendahara & Yang Menerima */}
      <div className="mt-5 grid grid-cols-2 gap-8 text-[11px]">
        <div>
          <p className="mt-4">Telah dibayar sejumlah</p>
          <p className="font-bold font-mono">Rp {formatRupiah(telahDibayar)}</p>
          <p className="mt-4">Bendahara Pengeluaran</p>
          <div className="h-16" />
          <p className="font-bold underline">{bendahara?.nama || '........................................'}</p>
          <p>NIP. {bendahara?.nip || '-'}</p>
        </div>

        <div>
          <p>Jakarta, {formatLongDate(tanggalDoc) !== '-' ? formatLongDate(tanggalDoc) : formatMonthYear(tanggalDoc)}</p>
          <p>Telah menerima jumlah uang sebesar</p>
          <p className="font-bold font-mono">Rp {formatRupiah(total)}</p>
          <p className="mt-4">Yang Menerima</p>
          <div className="h-16" />
          <p className="font-bold underline">{peserta.nama}</p>
          <p>NIP. {peserta.nip || '-'}</p>
        </div>
      </div>

      {/* Garis Pemisah & PERHITUNGAN SPD RAMPUNG */}
      <div className="mt-6 border-t-2 border-black pt-3">
        <h2 className="text-center text-[11.5px] font-bold uppercase tracking-wide mb-4">
          PERHITUNGAN SPD RAMPUNG
        </h2>

        <div className="grid grid-cols-[170px_12px_30px_120px] gap-y-1 text-[11px] mb-5">
          <span>Ditetapkan sejumlah</span>
          <span>:</span>
          <span>Rp.</span>
          <span className="text-right font-mono font-semibold">{formatRupiah(total)}</span>

          <span>Yang telah dibayar</span>
          <span>:</span>
          <span>Rp.</span>
          <span className="text-right font-mono font-semibold">{formatRupiah(telahDibayar)}</span>

          <span>Sisa kurang/lebih</span>
          <span>:</span>
          <span>Rp.</span>
          <span className="text-right font-mono font-semibold">{formatRupiah(sisa)}</span>
        </div>

        <div className="flex justify-end">
          <div className="w-[46%] text-center">
            <p>Pejabat Pembuat Komitmen</p>
            <div className="h-16" />
            <p className="font-bold uppercase underline">{ppk?.nama || '-'}</p>
            <p>NIP. {ppk?.nip || '-'}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function CetakRpd({ suratTugas, selectedPesertaId, bendahara, ppk, backUrl }) {
  const pegawaiList = Array.isArray(suratTugas.pegawai_list) ? suratTugas.pegawai_list : [];
  const [activeId, setActiveId] = useState(selectedPesertaId || pegawaiList[0]?.id || null);
  const [printAll, setPrintAll] = useState(false);

  const visiblePeserta = printAll
    ? pegawaiList
    : pegawaiList.filter((p) => Number(p.id) === Number(activeId));

  return (
    <div className="min-h-screen bg-slate-200 text-black font-sans">
      <Head title={`Rincian Biaya Perjalanan Dinas (RPD) - ${suratTugas.nomor_spd || suratTugas.nomor_nota}`} />
      <style>{`
        @page { size: A4 portrait; margin: 12mm 14mm; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .rpd-sheet {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            box-shadow: none !important;
            page-break-after: always;
          }
          .rpd-sheet:last-child { page-break-after: auto; }
        }
      `}</style>

      {/* Sticky Toolbar */}
      <div className="no-print sticky top-0 z-20 border-b-4 border-amber-500 bg-[#0F2C59] px-4 py-3 text-white shadow-lg">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Link
              href={backUrl || route('surat-tugas.show', suratTugas.id)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali</span>
            </Link>
            <Link
              href={route('surat-tugas.cetak-nominatif', suratTugas.id)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-amber-300" />
              <span>Lihat Daftar Nominatif</span>
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {pegawaiList.length > 1 && (
              <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-900/40 p-1">
                {pegawaiList.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPrintAll(false);
                      setActiveId(p.id);
                    }}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                      !printAll && Number(activeId) === Number(p.id)
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    {p.nama}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPrintAll(true)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                    printAll ? 'bg-amber-500 text-slate-950' : 'text-slate-200 hover:bg-white/10'
                  }`}
                >
                  Semua ({pegawaiList.length})
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow transition hover:bg-amber-400"
            >
              <Printer className="h-4 w-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Render Sheet(s) */}
      <main className="px-4 py-2">
        {visiblePeserta.map((peserta) => (
          <RpdSingleSheet
            key={peserta.id}
            suratTugas={suratTugas}
            peserta={peserta}
            bendahara={bendahara}
            ppk={ppk}
          />
        ))}
      </main>
    </div>
  );
}
