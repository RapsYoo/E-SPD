import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  Plus,
  Trash2,
  Wallet,
  Copy,
  CreditCard,
  Building2,
  UserCheck,
  Calculator,
} from 'lucide-react';
import { calcRpdItemTotal, formatRupiah, terbilangRupiah } from '@/Utils/terbilang';

const JENIS_PRESETS = [
  'Uang harian',
  'Uang harian Perjalanan',
  'Representasi',
  'Transportasi Jakarta',
  'Transportasi Bandara',
  'Transportasi Tujuan',
  'Akomodasi',
  'Penggantian Transportasi',
];

function createDefaultItems(durasiHari, kategoriPerjalanan, tempatTujuan) {
  const days = Math.max(1, Number(durasiHari) || 1);
  const nights = Math.max(1, days - 1);
  const isLuarNegeri = kategoriPerjalanan === 'LUAR_NEGERI';
  const tujuanLabel = tempatTujuan ? ` ${tempatTujuan}` : '';

  if (isLuarNegeri) {
    return [
      {
        jenis: 'Uang harian',
        uraian: `Uang harian di${tujuanLabel || ' Lokasi Tujuan'}`,
        jumlah_satuan: days,
        satuan: 'Hari',
        persentase: 100,
        mata_uang: 'USD',
        besaran: 0,
        kurs: 16500,
      },
      {
        jenis: 'Uang harian Perjalanan',
        uraian: `Uang harian Perjalanan${tujuanLabel}`,
        jumlah_satuan: 1,
        satuan: 'Hari',
        persentase: 40,
        mata_uang: 'USD',
        besaran: 0,
        kurs: 16500,
      },
      {
        jenis: 'Transportasi Bandara',
        uraian: 'Transportasi Bandara di Jakarta',
        jumlah_satuan: 2,
        satuan: 'Kali',
        persentase: 100,
        mata_uang: 'IDR',
        besaran: 0,
        kurs: 1,
      },
    ];
  }

  return [
    {
      jenis: 'Uang harian',
      uraian: `Uang harian${tujuanLabel ? ` di${tujuanLabel}` : ''}`,
      jumlah_satuan: days,
      satuan: 'Hari',
      persentase: 100,
      mata_uang: 'IDR',
      besaran: 0,
      kurs: 1,
    },
    {
      jenis: 'Transportasi Jakarta',
      uraian: 'Transportasi Jakarta',
      jumlah_satuan: 2,
      satuan: 'Kali',
      persentase: 100,
      mata_uang: 'IDR',
      besaran: 0,
      kurs: 1,
    },
    {
      jenis: 'Transportasi Tujuan',
      uraian: `Transportasi${tujuanLabel || ' Tujuan'}`,
      jumlah_satuan: 2,
      satuan: 'Kali',
      persentase: 100,
      mata_uang: 'IDR',
      besaran: 0,
      kurs: 1,
    },
    {
      jenis: 'Akomodasi',
      uraian: `Akomodasi${tujuanLabel ? ` di${tujuanLabel}` : ''}`,
      jumlah_satuan: nights,
      satuan: 'Hari',
      persentase: 100,
      mata_uang: 'IDR',
      besaran: 0,
      kurs: 1,
    },
  ];
}

export default function RpdStepForm({
  data,
  setData,
  selectedPegawaiIds,
  pegawaiList,
  bendaharaList = [],
  onBack,
  processing,
  savingDraft,
}) {
  const [activePegawaiId, setActivePegawaiId] = useState(() => selectedPegawaiIds[0] || null);
  const [copiedNotice, setCopiedNotice] = useState('');

  const selectedPegawais = selectedPegawaiIds
    .map((id) => pegawaiList.find((p) => Number(p.id) === Number(id)))
    .filter(Boolean);

  // Pastikan activePegawaiId valid dan setiap pegawai punya entry default di rpd_data
  useEffect(() => {
    if (selectedPegawaiIds.length > 0 && !selectedPegawaiIds.includes(Number(activePegawaiId))) {
      setActivePegawaiId(selectedPegawaiIds[0]);
    }

    const currentRpd = data.rpd_data || {};
    let changed = false;
    const nextRpd = { ...currentRpd };

    selectedPegawaiIds.forEach((id) => {
      const key = String(id);
      const peg = pegawaiList.find((p) => Number(p.id) === Number(id));
      if (!nextRpd[key] || !Array.isArray(nextRpd[key].items) || nextRpd[key].items.length === 0) {
        nextRpd[key] = {
          nama_rekening: nextRpd[key]?.nama_rekening || peg?.nama_rekening || peg?.nama || '',
          no_rekening: nextRpd[key]?.no_rekening ?? peg?.no_rekening ?? '',
          kode_bank: nextRpd[key]?.kode_bank ?? peg?.kode_bank ?? peg?.bank ?? '',
          telah_dibayar: nextRpd[key]?.telah_dibayar ?? '',
          items: createDefaultItems(data.durasi_hari, data.kategori_perjalanan, data.tempat_tujuan),
        };
        changed = true;
      }
    });

    if (changed) {
      setData('rpd_data', nextRpd);
    }
  }, [selectedPegawaiIds.join(',')]);

  // Auto-pilih bendahara jika hanya ada 1 akun bendahara dan belum terpilih
  useEffect(() => {
    if (!data.bendahara_id && bendaharaList.length === 1) {
      setData('bendahara_id', bendaharaList[0].id);
    }
  }, [bendaharaList.length]);

  const rpdData = data.rpd_data || {};

  const updatePegawaiEntry = (pegId, updater) => {
    const key = String(pegId);
    const current = rpdData[key] || {
      nama_rekening: '',
      no_rekening: '',
      kode_bank: '',
      telah_dibayar: '',
      items: [],
    };
    const updated = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
    setData('rpd_data', {
      ...rpdData,
      [key]: updated,
    });
  };

  const handleItemChange = (pegId, idx, field, value) => {
    updatePegawaiEntry(pegId, (entry) => {
      const nextItems = [...(entry.items || [])];
      const item = { ...nextItems[idx], [field]: value };
      if (field === 'mata_uang') {
        item.kurs = value === 'USD' ? (Number(item.kurs) > 1 ? item.kurs : 16500) : 1;
      }
      if (field === 'jenis' && (!item.uraian || JENIS_PRESETS.includes(item.uraian))) {
        item.uraian = value;
      }
      nextItems[idx] = item;
      return { ...entry, items: nextItems };
    });
  };

  const handleAddItem = (pegId) => {
    updatePegawaiEntry(pegId, (entry) => ({
      ...entry,
      items: [
        ...(entry.items || []),
        {
          jenis: 'Penggantian Transportasi',
          uraian: '',
          jumlah_satuan: 1,
          satuan: 'Kali',
          persentase: 100,
          mata_uang: 'IDR',
          besaran: 0,
          kurs: 1,
        },
      ],
    }));
  };

  const handleRemoveItem = (pegId, idx) => {
    updatePegawaiEntry(pegId, (entry) => ({
      ...entry,
      items: (entry.items || []).filter((_, i) => i !== idx),
    }));
  };

  const handleCopyToAll = (sourcePegId) => {
    const sourceEntry = rpdData[String(sourcePegId)];
    if (!sourceEntry) return;

    const nextRpd = { ...rpdData };
    selectedPegawaiIds.forEach((id) => {
      const key = String(id);
      if (Number(id) === Number(sourcePegId)) return;
      const peg = pegawaiList.find((p) => Number(p.id) === Number(id));
      const existing = nextRpd[key] || {};
      nextRpd[key] = {
        ...existing,
        nama_rekening: existing.nama_rekening || peg?.nama_rekening || peg?.nama || '',
        no_rekening: existing.no_rekening ?? peg?.no_rekening ?? '',
        kode_bank: existing.kode_bank ?? peg?.kode_bank ?? peg?.bank ?? '',
        items: (sourceEntry.items || []).map((item) => ({ ...item })),
      };
    });

    setData('rpd_data', nextRpd);
    setCopiedNotice('Rincian biaya berhasil disalin ke seluruh pegawai peserta.');
    setTimeout(() => setCopiedNotice(''), 3000);
  };

  const getPegawaiTotal = (pegId) => {
    const entry = rpdData[String(pegId)];
    if (!entry || !Array.isArray(entry.items)) return 0;
    return entry.items.reduce((sum, item) => sum + calcRpdItemTotal(item), 0);
  };

  const grandTotal = selectedPegawaiIds.reduce((sum, id) => sum + getPegawaiTotal(id), 0);
  const activePegawai = selectedPegawais.find((p) => Number(p.id) === Number(activePegawaiId)) || selectedPegawais[0];
  const activeEntry = activePegawai ? (rpdData[String(activePegawai.id)] || { items: [] }) : null;
  const activeTotal = activePegawai ? getPegawaiTotal(activePegawai.id) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-6">
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
            <Wallet className="w-5 h-5 text-amber-500" />
            <span>Tahap 3: Rincian Biaya Perjalanan Dinas (RPD) &amp; Daftar Nominatif</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Isi komponen pembiayaan per pegawai sebelum dikirim ke Kapus. Data ini otomatis menghasilkan dokumen <strong>RPD (per pegawai)</strong> &amp; <strong>Daftar Nominatif</strong> untuk dipantau Bendahara Pengeluaran.
          </p>
        </div>
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-right shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Total Daftar Nominatif</p>
          <p className="text-base font-extrabold text-emerald-900">Rp {formatRupiah(grandTotal)}</p>
        </div>
      </div>

      {/* Pengaturan Bendahara & Tanggal RPD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-cyan-600" />
            <span>Bendahara Pengeluaran</span>
          </label>
          <select
            value={data.bendahara_id || ''}
            onChange={(e) => setData('bendahara_id', e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:border-amber-500 focus:ring-amber-500"
          >
            <option value="">-- Pilih Bendahara Pengeluaran (Opsional) --</option>
            {bendaharaList.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nama} {b.nip && b.nip !== '-' ? `(NIP. ${b.nip})` : ''}
              </option>
            ))}
          </select>
          {bendaharaList.length === 0 && (
            <p className="text-[11px] text-amber-700 mt-1">
              Belum ada akun dengan role Bendahara. Admin dapat menambahkannya di menu Akun Pengguna.
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Tanggal RPD &amp; Daftar Nominatif
          </label>
          <input
            type="date"
            value={data.tanggal_rpd || ''}
            onChange={(e) => setData('tanggal_rpd', e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:border-amber-500 focus:ring-amber-500"
          />
          <p className="text-[11px] text-slate-500 mt-1">Kosongkan untuk mengikuti tanggal surat / hari ini.</p>
        </div>
      </div>

      {/* Tab Pilihan Pegawai */}
      {selectedPegawais.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {selectedPegawais.map((peg, index) => {
                const isActive = Number(peg.id) === Number(activePegawai?.id);
                const pegTotal = getPegawaiTotal(peg.id);
                return (
                  <button
                    key={peg.id}
                    type="button"
                    onClick={() => setActivePegawaiId(peg.id)}
                    className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                      isActive
                        ? 'bg-[#0F2C59] text-white border-amber-500 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                      isActive ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {index + 1}
                    </span>
                    <span>{peg.nama}</span>
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                      isActive ? 'bg-white/15 text-amber-200' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      Rp {formatRupiah(pegTotal)}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedPegawais.length > 1 && activePegawai && (
              <button
                type="button"
                onClick={() => handleCopyToAll(activePegawai.id)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Rincian ke Semua Pegawai</span>
              </button>
            )}
          </div>

          {copiedNotice && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700">
              {copiedNotice}
            </div>
          )}

          {/* Panel Input RPD Pegawai Aktif */}
          {activePegawai && activeEntry && (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              {/* Info Pegawai & Data Rekening */}
              <div className="bg-slate-50/90 border-b border-slate-200 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-5 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pegawai Penerima</p>
                  <p className="text-sm font-extrabold text-slate-900">{activePegawai.nama}</p>
                  <p className="text-xs text-slate-600">
                    NIP: {activePegawai.nip || '-'} &bull; {activePegawai.pangkat || '-'} {activePegawai.golongan ? `(${activePegawai.golongan})` : ''}
                  </p>
                  <p className="text-xs text-slate-500">{activePegawai.jabatan || '-'}</p>
                </div>

                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-slate-400" /> Nama Rekening
                    </label>
                    <input
                      type="text"
                      value={activeEntry.nama_rekening || ''}
                      onChange={(e) => updatePegawaiEntry(activePegawai.id, { nama_rekening: e.target.value })}
                      placeholder="Nama pemilik rekening"
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">No. Rekening</label>
                    <input
                      type="text"
                      value={activeEntry.no_rekening || ''}
                      onChange={(e) => updatePegawaiEntry(activePegawai.id, { no_rekening: e.target.value })}
                      placeholder="Contoh: 14233859"
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400" /> Kode Bank / Bank
                    </label>
                    <input
                      type="text"
                      value={activeEntry.kode_bank || ''}
                      onChange={(e) => updatePegawaiEntry(activePegawai.id, { kode_bank: e.target.value })}
                      placeholder="Contoh: BNINIDJA / BRI"
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs bg-white uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Tabel Rincian Komponen Biaya */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-amber-500" />
                    <span>Komponen Rincian Biaya</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleAddItem(activePegawai.id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#0F2C59] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1a3e7a] transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Komponen</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 border-y border-slate-200">
                        <th className="py-2 px-2 font-bold w-[160px]">Jenis (Nominatif)</th>
                        <th className="py-2 px-2 font-bold">Uraian / Keterangan (RPD)</th>
                        <th className="py-2 px-2 font-bold w-[70px] text-center">Jml</th>
                        <th className="py-2 px-2 font-bold w-[75px]">Satuan</th>
                        <th className="py-2 px-2 font-bold w-[68px] text-center">%</th>
                        <th className="py-2 px-2 font-bold w-[72px]">Mata Uang</th>
                        <th className="py-2 px-2 font-bold w-[120px] text-right">Besaran</th>
                        <th className="py-2 px-2 font-bold w-[95px] text-right">Kurs (USD)</th>
                        <th className="py-2 px-2 font-bold w-[125px] text-right">Jumlah (Rp)</th>
                        <th className="py-2 px-1 w-[36px]"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(activeEntry.items || []).map((item, idx) => {
                        const rowTotal = calcRpdItemTotal(item);
                        return (
                          <tr key={idx} className="hover:bg-slate-50/70">
                            <td className="py-2 px-1.5">
                              <input
                                type="text"
                                list="rpd-jenis-presets"
                                value={item.jenis || ''}
                                onChange={(e) => handleItemChange(activePegawai.id, idx, 'jenis', e.target.value)}
                                placeholder="Uang harian"
                                className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                              />
                            </td>
                            <td className="py-2 px-1.5">
                              <input
                                type="text"
                                value={item.uraian || ''}
                                onChange={(e) => handleItemChange(activePegawai.id, idx, 'uraian', e.target.value)}
                                placeholder="Keterangan di RPD"
                                className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                              />
                            </td>
                            <td className="py-2 px-1.5">
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={item.jumlah_satuan ?? ''}
                                onChange={(e) => handleItemChange(activePegawai.id, idx, 'jumlah_satuan', e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-center"
                              />
                            </td>
                            <td className="py-2 px-1.5">
                              <select
                                value={item.satuan || 'Hari'}
                                onChange={(e) => handleItemChange(activePegawai.id, idx, 'satuan', e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-1.5 py-1.5 text-xs bg-white"
                              >
                                <option value="Hari">Hari</option>
                                <option value="Kali">Kali</option>
                                <option value="Malam">Malam</option>
                                <option value="Paket">Paket</option>
                              </select>
                            </td>
                            <td className="py-2 px-1.5">
                              <input
                                type="number"
                                min="0"
                                max="1000"
                                value={item.persentase ?? 100}
                                onChange={(e) => handleItemChange(activePegawai.id, idx, 'persentase', e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-center"
                              />
                            </td>
                            <td className="py-2 px-1.5">
                              <select
                                value={item.mata_uang || 'IDR'}
                                onChange={(e) => handleItemChange(activePegawai.id, idx, 'mata_uang', e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-1.5 py-1.5 text-xs bg-white font-semibold"
                              >
                                <option value="IDR">Rp</option>
                                <option value="USD">USD ($)</option>
                              </select>
                            </td>
                            <td className="py-2 px-1.5">
                              <input
                                type="number"
                                min="0"
                                value={item.besaran ?? ''}
                                onChange={(e) => handleItemChange(activePegawai.id, idx, 'besaran', e.target.value)}
                                placeholder="0"
                                className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-right font-mono"
                              />
                            </td>
                            <td className="py-2 px-1.5">
                              {item.mata_uang === 'USD' ? (
                                <input
                                  type="number"
                                  min="0"
                                  value={item.kurs ?? 16500}
                                  onChange={(e) => handleItemChange(activePegawai.id, idx, 'kurs', e.target.value)}
                                  placeholder="16500"
                                  className="w-full rounded-lg border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs text-right font-mono"
                                />
                              ) : (
                                <span className="block text-right text-slate-400 pr-2">-</span>
                              )}
                            </td>
                            <td className="py-2 px-2 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                              Rp {formatRupiah(rowTotal)}
                            </td>
                            <td className="py-2 px-1 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(activePegawai.id, idx)}
                                title="Hapus baris"
                                className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <datalist id="rpd-jenis-presets">
                    {JENIS_PRESETS.map((preset) => (
                      <option key={preset} value={preset} />
                    ))}
                  </datalist>
                </div>

                {/* Ringkasan Subtotal & SPD Rampung */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-slate-500">Subtotal Pegawai ({activePegawai.nama}):</p>
                    <p className="text-lg font-extrabold text-slate-900">Rp {formatRupiah(activeTotal)}</p>
                    <p className="text-xs italic text-slate-600">Terbilang: {terbilangRupiah(activeTotal)}</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Yang Telah Dibayar (Perhitungan SPD Rampung — Opsional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={activeEntry.telah_dibayar ?? ''}
                      onChange={(e) => updatePegawaiEntry(activePegawai.id, { telah_dibayar: e.target.value })}
                      placeholder={`Default sama dengan total (${formatRupiah(activeTotal)})`}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Sisa kurang/lebih: <strong className="text-slate-700">
                        Rp {formatRupiah(activeTotal - (activeEntry.telah_dibayar !== '' && activeEntry.telah_dibayar !== null && activeEntry.telah_dibayar !== undefined ? Number(activeEntry.telah_dibayar) : activeTotal))}
                      </strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation & Final Submit */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center space-x-1 text-slate-600 hover:text-slate-800 font-semibold text-xs"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Draft Personel &amp; SPD</span>
        </button>

        <button
          type="submit"
          disabled={processing || savingDraft || selectedPegawaiIds.length === 0}
          className="inline-flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm px-6 py-2.5 rounded-xl shadow-lg transition transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span>{processing ? 'Mengirim ke Kapus...' : 'Kirim Nota, ST, SPD & RPD ke Disposisi Kapus'}</span>
        </button>
      </div>
    </div>
  );
}
