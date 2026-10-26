import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Download, FileSpreadsheet, Printer, Search } from 'lucide-react';

const inputClass =
  'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none';

export default function Index({ rows, summary, filters, statusOptions }) {
  const [form, setForm] = useState({
    dari: filters.dari || '',
    sampai: filters.sampai || '',
    status: filters.status || '',
    kategori: filters.kategori || '',
    search: filters.search || '',
  });

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const cleanParams = () =>
    Object.fromEntries(Object.entries(form).filter(([, v]) => v !== '' && v !== null));

  const apply = (e) => {
    e.preventDefault();
    router.get('/rekapitulasi', cleanParams(), { preserveState: true, preserveScroll: true });
  };

  const reset = () => {
    setForm({ dari: '', sampai: '', status: '', kategori: '', search: '' });
    router.get('/rekapitulasi');
  };

  const exportUrl = (format) => {
    const qs = new URLSearchParams({ ...cleanParams(), format }).toString();
    return `/rekapitulasi/export?${qs}`;
  };

  const cards = [
    { label: 'Total Surat', value: summary.total_surat },
    { label: 'Total Pelaksana', value: summary.total_pelaksana },
    { label: 'Total Hari Dinas', value: summary.total_hari_dinas },
    { label: 'Dalam Negeri', value: summary.dalam_negeri },
    { label: 'Luar Negeri', value: summary.luar_negeri },
  ];

  return (
    <AdminLayout title="Rekapitulasi Perjalanan Dinas">
      <Head title="Rekapitulasi" />
      <style>{`@media print { .no-print { display: none !important; } aside, header { display: none !important; } }`}</style>

      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Rekapitulasi Perjalanan Dinas</h1>
            <p className="text-sm text-slate-500">Rekap surat tugas &amp; SPD berdasarkan tanggal berangkat.</p>
          </div>
          <div className="flex flex-wrap gap-2 no-print">
            <a href={exportUrl('csv')} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-slate-700 text-white hover:bg-slate-800 transition">
              <Download className="w-4 h-4" /> CSV
            </a>
            <a href={exportUrl('xls')} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition">
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </a>
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 transition">
              <Printer className="w-4 h-4" /> PDF / Cetak
            </button>
          </div>
        </div>

        <form onSubmit={apply} className="no-print bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
          <label className="text-xs font-semibold text-slate-600">Dari
            <input type="date" value={form.dari} onChange={set('dari')} className={inputClass} />
          </label>
          <label className="text-xs font-semibold text-slate-600">Sampai
            <input type="date" value={form.sampai} onChange={set('sampai')} className={inputClass} />
          </label>
          <label className="text-xs font-semibold text-slate-600">Status
            <select value={form.status} onChange={set('status')} className={inputClass}>
              <option value="">Semua</option>
              {Object.entries(statusOptions).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">Kategori
            <select value={form.kategori} onChange={set('kategori')} className={inputClass}>
              <option value="">Semua</option>
              <option value="DALAM_NEGERI">Dalam Negeri</option>
              <option value="LUAR_NEGERI">Luar Negeri</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">Cari
            <input type="text" value={form.search} onChange={set('search')} placeholder="Nomor / perihal / pegawai" className={inputClass} />
          </label>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-[#0F2C59] text-white hover:bg-[#0B2247] transition">
              <Search className="w-4 h-4" /> Filter
            </button>
            <button type="button" onClick={reset} className="px-3 py-2 text-sm rounded-lg border border-slate-300 hover:bg-slate-50">Reset</button>
          </div>
        </form>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {cards.map((c) => (
            <div key={c.label} className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">{c.label}</p>
              <p className="text-2xl font-extrabold text-[#0F2C59]">{c.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider">
              <tr>
                {['No. ST', 'No. SPD', 'Perihal', 'Kategori', 'Tujuan', 'Berangkat', 'Kembali', 'Hari', 'Pelaksana', 'PPK', 'Status'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.data.length === 0 && (
                <tr><td colSpan={11} className="px-3 py-8 text-center text-slate-400">Tidak ada data.</td></tr>
              )}
              {rows.data.map((r, i) => (
                <tr key={i} className="hover:bg-amber-50/40">
                  <td className="px-3 py-2">{r.nomor_st || '-'}</td>
                  <td className="px-3 py-2">{r.nomor_spd || '-'}</td>
                  <td className="px-3 py-2 max-w-xs">{r.perihal}</td>
                  <td className="px-3 py-2">{r.kategori}</td>
                  <td className="px-3 py-2">{r.tujuan}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.tanggal_berangkat}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.tanggal_kembali}</td>
                  <td className="px-3 py-2 text-center">{r.durasi_hari}</td>
                  <td className="px-3 py-2">{r.pelaksana}</td>
                  <td className="px-3 py-2">{r.ppk}</td>
                  <td className="px-3 py-2 font-semibold">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="no-print flex flex-wrap gap-1">
          {rows.links.map((link, i) => (
            <Link
              key={i}
              href={link.url || '#'}
              preserveState
              preserveScroll
              className={`px-3 py-1 text-xs rounded border ${link.active ? 'bg-[#0F2C59] text-white' : 'bg-white text-slate-600'} ${!link.url ? 'opacity-40 pointer-events-none' : ''}`}
              dangerouslySetInnerHTML={{ __html: link.label }}
            />
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
