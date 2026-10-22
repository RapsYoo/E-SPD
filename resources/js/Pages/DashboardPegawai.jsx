import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
  Plane,
  CalendarClock,
  CheckCircle2,
  Route,
  MapPin,
  Printer,
  Eye,
  Users,
  Globe,
  Link2Off,
  Inbox,
} from 'lucide-react';

const PHASE_META = {
  berlangsung: { label: 'Sedang Berlangsung', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  akan_datang: { label: 'Akan Datang', badge: 'bg-amber-100 text-amber-800 border-amber-300' },
  selesai: { label: 'Selesai', badge: 'bg-slate-100 text-slate-700 border-slate-300' },
  belum_dijadwalkan: { label: 'Belum Dijadwalkan', badge: 'bg-slate-100 text-slate-600 border-slate-300' },
};

const FILTERS = [
  { id: 'semua', label: 'Semua' },
  { id: 'berlangsung', label: 'Berlangsung' },
  { id: 'akan_datang', label: 'Akan Datang' },
  { id: 'selesai', label: 'Selesai' },
];

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DashboardPegawai({ trips = [], summary = {}, hasPegawaiLink = true, userName = 'Pegawai' }) {
  const [filter, setFilter] = useState('semua');
  const visibleTrips = filter === 'semua' ? trips : trips.filter((trip) => trip.phase === filter);

  const summaryCards = [
    { key: 'total', label: 'Total Perjalanan', icon: Route, tone: 'bg-indigo-50 text-indigo-600' },
    { key: 'berlangsung', label: 'Sedang Berlangsung', icon: Plane, tone: 'bg-emerald-50 text-emerald-600' },
    { key: 'akan_datang', label: 'Akan Datang', icon: CalendarClock, tone: 'bg-amber-50 text-amber-600' },
    { key: 'selesai', label: 'Selesai', icon: CheckCircle2, tone: 'bg-slate-100 text-slate-600' },
  ];

  return (
    <AdminLayout title="Dashboard Pegawai">
      <Head title="Dashboard Perjalanan Saya - e-SPD Pusdiklat Kemlu" />

      <div className="mb-6">
        <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
          <Plane className="w-4 h-4" />
          <span>Perjalanan Dinas Saya</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Halo, {userName}</h1>
        <p className="text-xs text-slate-500">
          Pantau perjalanan dinas Anda dan unduh Surat Tugas, SPD, Lampiran, serta Visum yang telah terbit.
        </p>
      </div>

      {!hasPegawaiLink && (
        <div className="mb-6 flex items-start space-x-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <Link2Off className="w-5 h-5 mt-0.5 shrink-0" />
          <p>
            Akun Anda belum terhubung ke data pegawai sehingga perjalanan dinas tidak dapat ditampilkan.
            Hubungi Admin untuk menautkan akun Anda.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryCards.map(({ key, label, icon: Icon, tone }) => (
          <div key={key} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{summary[key] ?? 0}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Daftar Perjalanan Dinas</h2>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                  filter === item.id
                    ? 'bg-[#0F2C59] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {visibleTrips.length === 0 ? (
          <div className="py-12 flex flex-col items-center text-slate-400">
            <Inbox className="w-10 h-10 mb-2" />
            <p className="text-sm">Belum ada perjalanan dinas pada kategori ini.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {visibleTrips.map((trip) => {
              const meta = PHASE_META[trip.phase] || PHASE_META.belum_dijadwalkan;
              const tujuan = [trip.tempat_tujuan, trip.kategori_perjalanan === 'LUAR_NEGERI' ? trip.negara_tujuan : null]
                .filter(Boolean)
                .join(', ') || '-';

              return (
                <li key={trip.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${meta.badge}`}>
                          {meta.label}
                        </span>
                        {trip.kategori_perjalanan === 'LUAR_NEGERI' && (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-200 rounded-full px-2.5 py-0.5">
                            <Globe className="w-3 h-3" />
                            <span>Luar Negeri</span>
                          </span>
                        )}
                        <span className="text-xs font-mono text-slate-500">{trip.nomor_st || '-'}</span>
                      </div>
                      <p className="font-bold text-slate-900 leading-snug">{trip.perihal_nota || '-'}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{tujuan}</span>
                        </span>
                        <span className="inline-flex items-center space-x-1">
                          <CalendarClock className="w-3.5 h-3.5" />
                          <span>
                            {formatDate(trip.tanggal_berangkat)} s/d {formatDate(trip.tanggal_kembali)}
                            {trip.durasi_hari ? ` (${trip.durasi_hari} hari)` : ''}
                          </span>
                        </span>
                        {trip.rekan?.length > 0 && (
                          <span className="inline-flex items-center space-x-1">
                            <Users className="w-3.5 h-3.5" />
                            <span>Bersama {trip.rekan.join(', ')}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/surat-tugas/${trip.id}`}
                        className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Detail</span>
                      </Link>
                      <a
                        href={`/surat-tugas/${trip.id}/cetak`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow transition"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Unduh Surat</span>
                      </a>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AdminLayout>
  );
}
