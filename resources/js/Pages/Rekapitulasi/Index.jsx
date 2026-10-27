import React, { useEffect, useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
  ClipboardList,
  Download,
  FileSpreadsheet,
  Printer,
  RotateCcw,
  Search,
} from 'lucide-react';

const inputClass =
  'mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10';

const statusClass = (status) => {
  const value = status?.toLowerCase() ?? '';

  if (value.includes('selesai') || value.includes('terbit')) {
    return 'bg-emerald-50 text-emerald-700 ring-emerald-600/15';
  }

  if (value.includes('tolak') || value.includes('batal')) {
    return 'bg-rose-50 text-rose-700 ring-rose-600/15';
  }

  if (value.includes('draft')) {
    return 'bg-slate-100 text-slate-600 ring-slate-500/15';
  }

  return 'bg-amber-50 text-amber-700 ring-amber-600/15';
};

export default function Index({ rows, filters, statusOptions }) {
  const searchTimeout = useRef(null);
  const [form, setForm] = useState({
    dari: filters.dari || '',
    sampai: filters.sampai || '',
    status: filters.status || '',
    kategori: filters.kategori || '',
    search: filters.search || '',
  });

  useEffect(() => () => clearTimeout(searchTimeout.current), []);

  const cleanParams = (values = form) =>
    Object.fromEntries(Object.entries(values).filter(([, value]) => value !== '' && value !== null));

  const updateFilter = (key, value) => {
    clearTimeout(searchTimeout.current);
    const updatedForm = { ...form, [key]: value };
    setForm(updatedForm);
    router.get('/rekapitulasi', cleanParams(updatedForm), {
      preserveState: true,
      preserveScroll: true,
      replace: true,
    });
  };

  const search = (value) => {
    const updatedForm = { ...form, search: value };
    setForm(updatedForm);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      router.get('/rekapitulasi', cleanParams(updatedForm), {
        preserveState: true,
        preserveScroll: true,
        replace: true,
      });
    }, 350);
  };

  const apply = (e) => {
    e.preventDefault();
    clearTimeout(searchTimeout.current);
    router.get('/rekapitulasi', cleanParams(), { preserveState: true, preserveScroll: true });
  };

  const reset = () => {
    clearTimeout(searchTimeout.current);
    setForm({ dari: '', sampai: '', status: '', kategori: '', search: '' });
    router.get('/rekapitulasi', {}, { preserveState: true, preserveScroll: true, replace: true });
  };

  const exportUrl = (format) => {
    const qs = new URLSearchParams({ ...cleanParams(), format }).toString();
    return `/rekapitulasi/export?${qs}`;
  };

  return (
    <AdminLayout title="Rekapitulasi Perjalanan Dinas">
      <Head title="Rekapitulasi" />
      <style>{`
        @page {
          size: landscape;
          margin: 0;
        }
        .rekap-table,
        .rekap-table th,
        .rekap-table td {
          border: 1px solid #000;
        }
        .rekap-table td p {
          border-color: #000;
        }
        @media print {
          .no-print { display: none !important; }
          aside, header { display: none !important; }
          main { padding: 10mm !important; overflow: visible !important; }
          .rekap-print-page { padding-bottom: 12mm !important; }
          .rekap-print-letterhead { display: flex !important; }
          .rekap-table-wrapper { overflow: visible !important; }
          .rekap-table-section {
            overflow: visible !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          .rekap-table { min-width: 0 !important; width: 100% !important; }
          .rekap-table, .rekap-table th, .rekap-table td {
            border: 1px solid #000 !important;
          }
          .rekap-table {
            border: 1.5px solid #000 !important;
          }
          .rekap-table tr > :first-child {
            border-left: 1.5px solid #000 !important;
          }
          .rekap-table tr > :last-child {
            border-right: 1.5px solid #000 !important;
          }
          .rekap-table th, .rekap-table td { padding: 3px !important; font-size: 7pt !important; }
          .rekap-table thead { display: table-header-group; }
          .rekap-table tr { break-inside: avoid; }
        }
      `}</style>

      <div className="rekap-print-page mx-auto max-w-[1600px] space-y-5">
        <div className="rekap-print-letterhead hidden flex-col items-center text-center">
          <img
            src="/images/kemlu-logo.webp"
            alt="Lambang Kementerian Luar Negeri"
            className="h-[18mm] w-auto object-contain"
          />
          <p className="mt-1 text-[12px] font-extrabold leading-tight tracking-wide text-blue-900">
            KEMENTERIAN LUAR NEGERI
          </p>
          <p className="mt-0.5 text-[9px] font-bold leading-tight tracking-[0.22em] text-red-700">
            REPUBLIK INDONESIA
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="hidden rounded-2xl bg-[#0F2C59] p-3 text-white shadow-lg shadow-blue-950/10 sm:block">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-amber-600">Laporan perjalanan dinas</p>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Rekapitulasi</h1>
              <p className="no-print mt-1 text-sm text-slate-500">Pantau surat tugas dan SPD berdasarkan tanggal keberangkatan.</p>
            </div>
          </div>
          <div className="no-print flex flex-wrap gap-2 sm:justify-end">
            <a href={exportUrl('csv')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
              <Download className="w-4 h-4" /> CSV
            </a>
            <a href={exportUrl('xls')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-900/10 transition hover:bg-emerald-700">
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </a>
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-3.5 py-2.5 text-sm font-semibold text-slate-950 shadow-sm shadow-amber-900/10 transition hover:bg-amber-400">
              <Printer className="w-4 h-4" /> PDF / Cetak
            </button>
          </div>
        </div>

        <form onSubmit={apply} className="no-print rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Filter &amp; pencarian</h2>
              <p className="mt-0.5 text-xs text-slate-500">Atur rentang tanggal atau cari data tertentu.</p>
            </div>
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-12 xl:items-end">
            <label className="text-xs font-semibold text-slate-600 xl:col-span-2">Dari
              <input type="date" value={form.dari} onChange={(event) => updateFilter('dari', event.target.value)} className={inputClass} />
            </label>
            <label className="text-xs font-semibold text-slate-600 xl:col-span-2">Sampai
              <input type="date" value={form.sampai} onChange={(event) => updateFilter('sampai', event.target.value)} className={inputClass} />
            </label>
            <label className="text-xs font-semibold text-slate-600 xl:col-span-2">Status
              <select value={form.status} onChange={(event) => updateFilter('status', event.target.value)} className={inputClass}>
                <option value="">Semua status</option>
                {Object.entries(statusOptions).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600 xl:col-span-2">Kategori
              <select value={form.kategori} onChange={(event) => updateFilter('kategori', event.target.value)} className={inputClass}>
                <option value="">Semua kategori</option>
                <option value="DALAM_NEGERI">Dalam Negeri</option>
                <option value="LUAR_NEGERI">Luar Negeri</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600 xl:col-span-2">Cari data
              <input type="text" value={form.search} onChange={(event) => search(event.target.value)} placeholder="Nomor, perihal, atau pegawai" className={inputClass} />
            </label>
            <div className="flex gap-2 sm:col-span-2 lg:col-span-3 xl:col-span-2">
              <button type="submit" className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0F2C59] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0B2247]">
                <Search className="h-4 w-4" /> Filter
              </button>
              <button type="button" onClick={reset} aria-label="Reset filter" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50">
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </form>

        <section className="rekap-table-section overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex flex-col gap-1 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <h2 className="font-bold text-slate-800">Daftar perjalanan dinas</h2>
              <p className="mt-0.5 text-xs text-slate-500">Rincian surat tugas dan pelaksana perjalanan.</p>
            </div>
            <p className="text-xs font-medium text-slate-500">
              Menampilkan <span className="font-bold text-slate-700">{rows.from ?? 0}–{rows.to ?? 0}</span> dari <span className="font-bold text-slate-700">{rows.total}</span> data
            </p>
          </div>
          <div className="rekap-table-wrapper overflow-x-auto">
            <table className="rekap-table w-full min-w-[1450px] table-fixed border-collapse border border-black text-left text-[11px] leading-4 text-slate-700">
              <colgroup>
                <col className="w-[4%]" />
                <col className="w-[10%]" />
                <col className="w-[12%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[7%]" />
                <col className="w-[8%]" />
                <col className="w-[7%]" />
                <col className="w-[7%]" />
                <col className="w-[5%]" />
                <col className="w-[7%]" />
                <col className="w-[8%]" />
                <col className="w-[5%]" />
              </colgroup>
              <thead className="text-center text-[10px] font-bold text-slate-800">
                <tr>
                  <th rowSpan={2} className="border border-black bg-emerald-100 px-2 py-2">No</th>
                  <th rowSpan={2} className="border border-black bg-emerald-100 px-2 py-2">Nomor Dokumen</th>
                  <th rowSpan={2} className="border border-black bg-emerald-100 px-2 py-2">Nama</th>
                  <th rowSpan={2} className="border border-black bg-emerald-100 px-2 py-2">Posisi</th>
                  <th rowSpan={2} className="border border-black bg-emerald-100 px-2 py-2">Tujuan</th>
                  <th colSpan={2} className="border border-black bg-emerald-100 px-2 py-2">Transportasi / Angkutan</th>
                  <th colSpan={3} className="border border-black bg-emerald-100 px-2 py-2">Periode Perjalanan</th>
                  <th rowSpan={2} className="border border-black bg-emerald-100 px-2 py-2">PPK</th>
                  <th rowSpan={2} className="border border-black bg-emerald-100 px-2 py-2">Aktivitas Perjalanan</th>
                  <th rowSpan={2} className="border border-black bg-emerald-100 px-2 py-2">Status</th>
                </tr>
                <tr>
                  {['Tingkat Biaya', 'Jenis Angkutan', 'Berangkat', 'Kembali', 'Total Hari'].map((heading) => (
                    <th key={heading} className="border border-black bg-emerald-100 px-2 py-2">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.data.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="border border-slate-300 px-4 py-14 text-center">
                      <div className="mx-auto flex max-w-xs flex-col items-center">
                        <div className="mb-3 rounded-full bg-slate-100 p-3 text-slate-400">
                          <Search className="h-5 w-5" />
                        </div>
                        <p className="font-semibold text-slate-700">Data tidak ditemukan</p>
                        <p className="mt-1 text-xs text-slate-500">Coba ubah filter atau kata kunci pencarian.</p>
                      </div>
                    </td>
                  </tr>
                ) : rows.data.map((row, index) => (
                  <tr key={row.id} className="align-top odd:bg-white even:bg-slate-50/70">
                    <td className="border border-slate-300 px-2 py-2 text-center font-medium">{(rows.from ?? 1) + index}</td>
                    <td className="break-words border border-slate-300 px-2 py-2">
                      <p><span className="font-semibold">ST:</span> {row.nomor_st || '-'}</p>
                      <p className="mt-1"><span className="font-semibold">SPD:</span> {row.nomor_spd || '-'}</p>
                    </td>
                    <td className="break-words border border-slate-300 px-2 py-2">
                      {row.personel?.length ? row.personel.map((person, index) => (
                        <p key={`${person.nama}-${index}`} className={index > 0 ? 'mt-1 border-t border-slate-200 pt-1' : ''}>
                          {person.nama || '-'}
                        </p>
                      )) : row.pelaksana || '-'}
                    </td>
                    <td className="break-words border border-slate-300 px-2 py-2">
                      {row.personel?.length ? row.personel.map((person, index) => (
                        <p key={`${person.nama}-${index}`} className={index > 0 ? 'mt-1 border-t border-slate-200 pt-1' : ''}>
                          {person.jabatan || '-'}
                        </p>
                      )) : '-'}
                    </td>
                    <td className="break-words border border-slate-300 px-2 py-2">
                      <p>{row.tujuan || '-'}</p>
                      <span className={`mt-1 inline-flex rounded px-1.5 py-0.5 text-[9px] font-semibold ${row.kategori === 'Luar Negeri' ? 'bg-cyan-50 text-cyan-700' : 'bg-blue-50 text-blue-700'}`}>
                        {row.kategori}
                      </span>
                    </td>
                    <td className="break-words border border-slate-300 px-2 py-2 text-center">{row.tingkat_biaya || '-'}</td>
                    <td className="break-words border border-slate-300 px-2 py-2">{row.angkutan || '-'}</td>
                    <td className="whitespace-nowrap border border-slate-300 px-2 py-2 text-center">{row.tanggal_berangkat || '-'}</td>
                    <td className="whitespace-nowrap border border-slate-300 px-2 py-2 text-center">{row.tanggal_kembali || '-'}</td>
                    <td className="whitespace-nowrap border border-slate-300 px-2 py-2 text-center">{row.durasi_hari ?? '-'} hari</td>
                    <td className="break-words border border-slate-300 px-2 py-2">{row.ppk || '-'}</td>
                    <td className="break-words border border-slate-300 px-2 py-2">{row.perihal || '-'}</td>
                    <td className="break-words border border-slate-300 px-2 py-2 text-center">
                      <span className={`inline-flex max-w-full rounded-full px-2 py-1 text-[9px] font-bold ring-1 ring-inset ${statusClass(row.status)}`}>
                        {row.status || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="no-print flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">Gunakan navigasi untuk melihat halaman lainnya.</p>
          <nav aria-label="Navigasi halaman rekap" className="flex flex-wrap items-center gap-1.5">
            {rows.links.map((link, index) => (
              <Link
                key={`${link.label}-${index}`}
                href={link.url || '#'}
                preserveState
                preserveScroll
                aria-current={link.active ? 'page' : undefined}
                aria-disabled={!link.url}
                className={`inline-flex h-9 min-w-9 items-center justify-center rounded-xl border px-3 text-xs font-semibold transition ${link.active ? 'border-[#0F2C59] bg-[#0F2C59] text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                dangerouslySetInnerHTML={{ __html: link.label }}
              />
            ))}
          </nav>
        </div>
      </div>
    </AdminLayout>
  );
}
