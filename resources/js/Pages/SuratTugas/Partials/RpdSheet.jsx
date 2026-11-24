import React, { useState } from 'react';
import { calcRpdItemTotal, formatRupiah, terbilangRupiah } from '@/Utils/terbilang';

function formatLongDate(value) {
  if (!value) return '-';
  const raw = typeof value === 'string' && value.includes('T') ? value.slice(0, 10) : value;
  const date = new Date(`${raw}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
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

export default function RpdSheet({
  suratTugas,
  pegawaiList = [],
  nomorSPD,
  ppkNama,
  ppkNip,
  bendaharaNama,
  bendaharaNip,
  isActive,
}) {
  const [selectedId, setSelectedId] = useState(pegawaiList[0]?.id || null);
  const [showAll, setShowAll] = useState(false);

  if (!isActive) return null;

  const activeList = showAll
    ? pegawaiList
    : pegawaiList.filter((p) => Number(p.id) === Number(selectedId || pegawaiList[0]?.id));

  const tanggalDoc = suratTugas.tanggal_rpd || suratTugas.tanggal_surat || suratTugas.tanggal_berangkat;

  return (
    <div className="space-y-4">
      {pegawaiList.length > 1 && (
        <div className="no-print flex flex-wrap items-center gap-1.5 rounded-xl bg-white border border-slate-200 p-2">
          <span className="px-2 text-[11px] font-bold text-slate-500">Pilih Pegawai:</span>
          {pegawaiList.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setShowAll(false);
                setSelectedId(p.id);
              }}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                !showAll && Number(selectedId || pegawaiList[0]?.id) === Number(p.id)
                  ? 'bg-[#0F2C59] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {p.nama}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
              showAll ? 'bg-[#0F2C59] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Semua ({pegawaiList.length})
          </button>
        </div>
      )}

      {activeList.map((peserta) => {
        const items = Array.isArray(peserta.rpd_items) ? peserta.rpd_items : [];
        const total = items.length > 0
          ? items.reduce((sum, item) => sum + (Number(item.jumlah) || calcRpdItemTotal(item)), 0)
          : Number(peserta.rpd_total) || 0;

        const telahDibayar = peserta.rpd_telah_dibayar !== null && peserta.rpd_telah_dibayar !== undefined
          ? Number(peserta.rpd_telah_dibayar)
          : total;
        const sisa = total - telahDibayar;

        return (
          <div
            key={peserta.id}
            className="print-sheet-rpd mx-auto w-full max-w-[210mm] border border-slate-300 bg-white px-8 py-7 shadow text-[11px] leading-snug text-black"
          >
            <div className="flex justify-end mb-2">
              <div className="w-[48%] text-[7.5px] leading-tight uppercase tracking-tight text-slate-900">
                <p className="font-semibold">LAMPIRAN II</p>
                <p>PERATURAN MENTERI KEUANGAN REPUBLIK INDONESIA</p>
                <p>NOMOR 113/PMK.05/2012</p>
                <p>TENTANG</p>
                <p>PERJALANAN DINAS DALAM NEGERI BAGI PEJABAT NEGARA, PEGAWAI NEGERI, DAN PEGAWAI TIDAK TETAP</p>
              </div>
            </div>

            <header className="text-center mb-5">
              <img
                src="/images/kemlu-logo.webp"
                alt="Lambang Kementerian Luar Negeri"
                className="mx-auto mb-1.5 h-14 w-auto object-contain"
              />
              <p className="text-[12px] font-bold tracking-wide text-[#0F2C59]">KEMENTERIAN LUAR NEGERI</p>
              <p className="text-[10px] font-bold tracking-[0.2em] text-[#8B1E24]">REPUBLIK INDONESIA</p>
              <h2 className="mt-4 text-[13px] font-bold tracking-wide uppercase">
                RINCIAN BIAYA PERJALANAN DINAS
              </h2>
            </header>

            <div className="mb-3 grid grid-cols-[150px_12px_1fr] gap-y-0.5 text-[11px]">
              <span>Lampiran SPD Nomor</span>
              <span>:</span>
              <span className="font-medium">{nomorSPD || '[Belum diisi TU]'}</span>

              <span>Tanggal</span>
              <span>:</span>
              <span>{formatLongDate(tanggalDoc)}</span>
            </div>

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
                    <td colSpan={4} className="border border-black px-3 py-6 text-center italic text-slate-500">
                      Belum ada rincian komponen biaya untuk pegawai ini.
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
                <tr>
                  <td className="border-x border-black h-8"></td>
                  <td className="border-x border-black"></td>
                  <td className="border-x border-black"></td>
                  <td className="border-x border-black"></td>
                </tr>
                <tr className="font-bold border-t border-black">
                  <td colSpan={3} className="border border-black px-2 py-1.5 text-right">Jumlah</td>
                  <td className="border border-black px-2 py-1.5">
                    <div className="flex justify-between font-mono">
                      <span>Rp</span>
                      <span>{formatRupiah(total)}</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colSpan={4} className="border border-black px-2 py-1.5">
                    <span className="font-semibold">Terbilang :</span>{' '}
                    <span className="italic font-semibold">{terbilangRupiah(total)}</span>
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="mt-5 grid grid-cols-2 gap-8 text-[11px]">
              <div>
                <p className="mt-4">Telah dibayar sejumlah</p>
                <p className="font-bold font-mono">Rp {formatRupiah(telahDibayar)}</p>
                <p className="mt-4">Bendahara Pengeluaran</p>
                <div className="h-14" />
                <p className="font-bold underline">{bendaharaNama || '........................................'}</p>
                <p>NIP. {bendaharaNip || '-'}</p>
              </div>

              <div>
                <p>Jakarta, {formatLongDate(tanggalDoc)}</p>
                <p>Telah menerima jumlah uang sebesar</p>
                <p className="font-bold font-mono">Rp {formatRupiah(total)}</p>
                <p className="mt-4">Yang Menerima</p>
                <div className="h-14" />
                <p className="font-bold underline">{peserta.nama}</p>
                <p>NIP. {peserta.nip || '-'}</p>
              </div>
            </div>

            <div className="mt-6 border-t-2 border-black pt-3">
              <h3 className="text-center text-[11.5px] font-bold uppercase tracking-wide mb-3">
                PERHITUNGAN SPD RAMPUNG
              </h3>

              <div className="grid grid-cols-[170px_12px_30px_120px] gap-y-1 text-[11px] mb-4">
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
                  <div className="h-14" />
                  <p className="font-bold uppercase underline">{ppkNama || '-'}</p>
                  <p>NIP. {ppkNip || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
