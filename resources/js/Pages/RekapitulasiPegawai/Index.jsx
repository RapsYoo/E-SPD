import React, { useEffect, useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import PegawaiProfileModal from '@/Components/PegawaiProfileModal';
import {
  BarChart3,
  Briefcase,
  Building2,
  Calendar,
  Coins,
  Download,
  Edit3,
  Eye,
  FileSpreadsheet,
  MapPin,
  PieChart,
  Plane,
  Printer,
  RotateCcw,
  Search,
  Settings,
  TrendingUp,
  User,
  Users,
  X,
} from 'lucide-react';

const inputClass =
  'mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10';

const PIE_COLORS = [
  '#0F2C59',
  '#F59E0B',
  '#10B981',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#F97316',
  '#6366F1',
  '#EF4444',
];

function formatRupiah(value) {
  const num = Number(value || 0);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
}

function formatCompactRupiah(value) {
  const num = Number(value || 0);
  if (num >= 1_000_000_000) {
    return `Rp ${(num / 1_000_000_000).toFixed(1).replace('.', ',')} M`;
  }
  if (num >= 1_000_000) {
    return `Rp ${(num / 1_000_000).toFixed(1).replace('.', ',')} Jt`;
  }
  if (num >= 1_000) {
    return `Rp ${(num / 1_000).toFixed(0)} Rb`;
  }
  return formatRupiah(num);
}

/**
 * Komponen Diagram Lingkaran (SVG Donut / Pie Chart) Interaktif
 */
function InteractiveDonutChart({
  data = [],
  centerTitle = 'Total',
  centerValue = '0',
  centerSub = '',
  valueFormatter = (v) => v,
  emptyText = 'Belum ada data pada filter ini',
  onSliceClick = null,
  activeSliceKey = null,
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const validData = data.filter((d) => Number(d.value || 0) > 0);
  const total = validData.reduce((sum, item) => sum + Number(item.value || 0), 0);

  if (total <= 0 || validData.length === 0) {
    return (
      <div className="flex h-56 flex-col items-center justify-center text-center text-xs text-slate-400">
        <PieChart className="mb-2 h-9 w-9 text-slate-300" />
        <span>{emptyText}</span>
      </div>
    );
  }

  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;

  const segments = validData.map((item, idx) => {
    const val = Number(item.value || 0);
    const pct = total > 0 ? val / total : 0;
    const strokeDasharray = `${pct * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativePercent * circumference;
    cumulativePercent += pct;

    return {
      ...item,
      index: idx,
      percentage: Math.round(pct * 1000) / 10,
      strokeDasharray,
      strokeDashoffset,
      color: item.color || PIE_COLORS[idx % PIE_COLORS.length],
    };
  });

  const activeSegment = hoveredIdx !== null ? segments[hoveredIdx] : null;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      {/* SVG Lingkaran */}
      <div className="relative flex h-44 w-44 shrink-0 items-center justify-center">
        <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90 transform overflow-visible">
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="#F1F5F9"
            strokeWidth="22"
          />
          {segments.map((seg, idx) => {
            const isHovered = hoveredIdx === idx;
            const isSelected = activeSliceKey && activeSliceKey === seg.key;
            return (
              <circle
                key={seg.key || idx}
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={isHovered || isSelected ? '26' : '22'}
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => onSliceClick && onSliceClick(seg)}
                className={`transition-all duration-300 ${
                  onSliceClick ? 'cursor-pointer' : ''
                }`}
              />
            );
          })}
        </svg>

        {/* Teks Tengah Lingkaran */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <span className="max-w-[105px] truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {activeSegment ? activeSegment.label : centerTitle}
          </span>
          <span className="mt-0.5 text-sm font-extrabold text-slate-900">
            {activeSegment ? valueFormatter(activeSegment.value) : centerValue}
          </span>
          <span className="text-[10px] font-semibold text-amber-600">
            {activeSegment ? `${activeSegment.percentage}%` : centerSub}
          </span>
        </div>
      </div>

      {/* Daftar Legenda */}
      <div className="max-h-48 w-full flex-1 space-y-1.5 overflow-y-auto pr-1 text-xs">
        {segments.map((seg, idx) => {
          const isSelected = activeSliceKey && activeSliceKey === seg.key;
          return (
            <div
              key={seg.key || idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => onSliceClick && onSliceClick(seg)}
              className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 transition ${
                onSliceClick ? 'cursor-pointer' : ''
              } ${
                isSelected
                  ? 'bg-amber-50 ring-1 ring-amber-400 font-bold'
                  : hoveredIdx === idx
                  ? 'bg-slate-100'
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-3 w-3 shrink-0 rounded-full shadow-sm"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="truncate font-semibold text-slate-800">{seg.label}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-right">
                <span className="font-mono text-[11px] font-bold text-slate-700">
                  {valueFormatter(seg.value)}
                </span>
                <span className="min-w-[42px] rounded bg-slate-100 px-1.5 py-0.5 text-center text-[10px] font-bold text-slate-600">
                  {seg.percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Index({
  rows = [],
  summary = {},
  charts = {},
  tarifMap = {},
  filters = {},
  statusOptions = {},
  unitOptions = [],
}) {
  const searchTimeout = useRef(null);
  const [form, setForm] = useState({
    dari: filters.dari || '',
    sampai: filters.sampai || '',
    status: filters.status || '',
    kategori: filters.kategori || '',
    unit: filters.unit || '',
    search: filters.search || '',
    tampil: filters.tampil || 'semua',
    sort: filters.sort || 'jalis_desc',
  });

  const [selectedPegawaiRekap, setSelectedPegawaiRekap] = useState(null);
  const [selectedProfilePegawai, setSelectedProfilePegawai] = useState(null);
  const [editingBiayaId, setEditingBiayaId] = useState(null);
  const [biayaInputValue, setBiayaInputValue] = useState('');
  const [savingBiaya, setSavingBiaya] = useState(false);

  const [isTarifModalOpen, setIsTarifModalOpen] = useState(false);
  const [tarifForm, setTarifForm] = useState({
    A: tarifMap.A ?? 1500000,
    B: tarifMap.B ?? 1000000,
    C: tarifMap.C ?? 750000,
  });
  const [savingTarif, setSavingTarif] = useState(false);

  // State khusus Diagram Lingkaran agar dinamis terhadap metrik & filter
  const [pieMetric, setPieMetric] = useState('jalis'); // 'jalis' | 'biaya'
  const [thirdPieMode, setThirdPieMode] = useState('tingkat'); // 'tingkat' | 'partisipasi'

  useEffect(() => () => clearTimeout(searchTimeout.current), []);

  // Sinkronkan modal detail jika data rows diperbarui setelah edit biaya
  useEffect(() => {
    if (selectedPegawaiRekap) {
      const updated = rows.find((r) => r.key === selectedPegawaiRekap.key);
      if (updated) {
        setSelectedPegawaiRekap(updated);
      }
    }
  }, [rows]);

  const cleanParams = (values = form) =>
    Object.fromEntries(
      Object.entries(values).filter(([, value]) => value !== '' && value !== null)
    );

  const updateFilter = (key, value) => {
    clearTimeout(searchTimeout.current);
    const updatedForm = { ...form, [key]: value };
    setForm(updatedForm);
    router.get('/rekapitulasi-pegawai', cleanParams(updatedForm), {
      preserveState: true,
      preserveScroll: true,
      replace: true,
    });
  };

  const handleSearchChange = (value) => {
    const updatedForm = { ...form, search: value };
    setForm(updatedForm);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      router.get('/rekapitulasi-pegawai', cleanParams(updatedForm), {
        preserveState: true,
        preserveScroll: true,
        replace: true,
      });
    }, 350);
  };

  const applyFilter = (e) => {
    e.preventDefault();
    clearTimeout(searchTimeout.current);
    router.get('/rekapitulasi-pegawai', cleanParams(), {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const resetFilter = () => {
    clearTimeout(searchTimeout.current);
    const initial = {
      dari: '',
      sampai: '',
      status: '',
      kategori: '',
      unit: '',
      search: '',
      tampil: 'semua',
      sort: 'jalis_desc',
    };
    setForm(initial);
    router.get('/rekapitulasi-pegawai', {}, { preserveState: true, preserveScroll: true, replace: true });
  };

  const exportUrl = (format) => {
    const qs = new URLSearchParams({ ...cleanParams(), format }).toString();
    return `/rekapitulasi-pegawai/export?${qs}`;
  };

  const handleSaveBiaya = (suratTugasPegawaiId, customValue) => {
    if (savingBiaya) return;
    setSavingBiaya(true);
    const payload = {
      biaya: customValue === '' || customValue === null ? null : Number(customValue),
    };
    router.put(`/rekapitulasi-pegawai/biaya/${suratTugasPegawaiId}`, payload, {
      preserveScroll: true,
      onFinish: () => {
        setSavingBiaya(false);
        setEditingBiayaId(null);
      },
    });
  };

  const handleSaveTarif = (e) => {
    e.preventDefault();
    if (savingTarif) return;
    setSavingTarif(true);
    router.put(
      '/rekapitulasi-pegawai/tarif',
      { tarif: tarifForm },
      {
        preserveScroll: true,
        onSuccess: () => setIsTarifModalOpen(false),
        onFinish: () => setSavingTarif(false),
      }
    );
  };

  const topJalis = charts.topPegawaiJalis || [];
  const topBiaya = charts.topPegawaiBiaya || [];
  const distribusiUpt = charts.distribusiUpt || [];
  const distribusiTingkat = charts.distribusiTingkat || [];

  const maxJalisCount = Math.max(1, ...topJalis.map((item) => item.total_jalis || 0));
  const maxBiayaCount = Math.max(1, ...topBiaya.map((item) => item.total_biaya || 0));
  const maxUptJalis = Math.max(1, ...distribusiUpt.map((item) => item.total_jalis || 0));

  const isBiayaMetric = pieMetric === 'biaya';
  const metricFormatter = isBiayaMetric
    ? (val) => formatCompactRupiah(val)
    : (val) => `${val} Jalis`;

  // Data Diagram Lingkaran 1:
  // Jika filter UPT/Bidang belum dipilih -> tampilkan proporsi antar UPT/Bidang.
  // Jika filter UPT/Bidang sedang dipilih -> otomatis tampilkan proporsi antar Pegawai di UPT tersebut.
  const pieUptOrPegawaiData = form.unit
    ? (isBiayaMetric ? topBiaya : topJalis).map((p, idx) => ({
        key: String(p.pegawai_id || p.nama),
        label: p.nama,
        value: isBiayaMetric ? p.total_biaya : p.total_jalis,
        color: PIE_COLORS[idx % PIE_COLORS.length],
        raw: p,
      }))
    : distribusiUpt.map((u, idx) => ({
        key: u.upt,
        label: u.upt,
        value: isBiayaMetric ? u.total_biaya : u.total_jalis,
        color: PIE_COLORS[idx % PIE_COLORS.length],
        raw: u,
      }));

  // Data Diagram Lingkaran 2: Proporsi Kategori Perjalanan (Dalam Negeri vs Luar Negeri)
  const pieKategoriData = [
    {
      key: 'DALAM_NEGERI',
      label: 'Dalam Negeri',
      value: isBiayaMetric
        ? summary.biaya_dalam_negeri ?? 0
        : summary.jalis_dalam_negeri ?? 0,
      color: '#0F2C59',
    },
    {
      key: 'LUAR_NEGERI',
      label: 'Luar Negeri',
      value: isBiayaMetric
        ? summary.biaya_luar_negeri ?? 0
        : summary.jalis_luar_negeri ?? 0,
      color: '#F59E0B',
    },
  ];

  // Data Diagram Lingkaran 3: Tingkat Biaya (A/B/C) atau Partisipasi Pegawai
  const pieThirdData =
    thirdPieMode === 'tingkat'
      ? distribusiTingkat.map((tb, idx) => ({
          key: tb.kode,
          label: `Tingkat ${tb.kode}`,
          value: isBiayaMetric ? tb.total_biaya : tb.total_jalis,
          color: ['#0F2C59', '#F59E0B', '#10B981', '#8B5CF6'][idx % 4],
        }))
      : [
          {
            key: 'pernah_jalis',
            label: 'Pernah Jalis',
            value: summary.total_pegawai_jalis ?? 0,
            color: '#10B981',
          },
          {
            key: 'belum_jalis',
            label: 'Belum Pernah Jalis',
            value: summary.total_pegawai_belum_jalis ?? 0,
            color: '#94A3B8',
          },
        ];

  return (
    <AdminLayout title="Rekap Jalis & Biaya Pegawai">
      <Head title="Rekap Jalis & Biaya Pegawai - e-SPD Pusdiklat Kemlu" />

      <style>{`
        @media print {
          .no-print { display: none !important; }
          aside, header { display: none !important; }
          main { padding: 8mm !important; overflow: visible !important; }
        }
      `}</style>

      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="hidden rounded-2xl bg-[#0F2C59] p-3 text-amber-400 shadow-lg shadow-blue-950/10 sm:block">
              <PieChart className="h-6 w-6" />
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-amber-600">
                Analitik &amp; Laporan Perjalanan Dinas
              </p>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Rekapitulasi Jalis &amp; Biaya Pegawai
              </h1>
              <p className="no-print mt-1 text-xs text-slate-500">
                Diagram perbandingan frekuensi perjalanan dinas (Jalis) dan akumulasi biaya per pegawai Pusdiklat Kemlu.
              </p>
            </div>
          </div>

          <div className="no-print flex flex-wrap gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => setIsTarifModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-amber-400 hover:bg-amber-50"
            >
              <Settings className="h-4 w-4 text-amber-600" /> Standar Tarif Biaya
            </button>
            <a
              href={exportUrl('csv')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" /> CSV
            </a>
            <a
              href={exportUrl('xls')}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <FileSpreadsheet className="h-4 w-4" /> Excel
            </a>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-3.5 py-2.5 text-xs font-bold text-slate-950 shadow-sm transition hover:bg-amber-400"
            >
              <Printer className="h-4 w-4" /> PDF / Cetak
            </button>
          </div>
        </div>

        {/* 4 Summary KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Pegawai Melakukan Jalis
              </span>
              <div className="rounded-xl bg-blue-50 p-2.5 text-[#0F2C59]">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">
                {summary.total_pegawai_jalis ?? 0}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                dari {summary.total_pegawai ?? 0} Pegawai
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {summary.total_pegawai_belum_jalis ?? 0} pegawai belum memiliki riwayat jalis pada filter ini
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Frekuensi Jalis
              </span>
              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                <Plane className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">
                {summary.total_jalis ?? 0}
              </span>
              <span className="text-xs font-semibold text-slate-500">Kali Penugasan</span>
            </div>
            <div className="mt-1 flex items-center gap-3 text-[11px] font-semibold">
              <span className="text-blue-600">
                Dalam Negeri: {summary.jalis_dalam_negeri ?? 0}
              </span>
              <span className="text-amber-600">
                Luar Negeri: {summary.jalis_luar_negeri ?? 0}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Hari Perjalanan
              </span>
              <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">
                {summary.total_hari ?? 0}
              </span>
              <span className="text-xs font-semibold text-slate-500">Hari Kerja Dinas</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Akumulasi durasi perjalanan dinas seluruh personel
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/80 to-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Total Biaya Jalis
              </span>
              <div className="rounded-xl bg-amber-500 p-2.5 text-slate-950 shadow-sm">
                <Coins className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                {formatRupiah(summary.total_biaya ?? 0)}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-amber-800/80">
              Klik baris pegawai di bawah untuk melihat atau menyesuaikan rincian biaya
            </p>
          </div>
        </div>

        {/* Filter & Pencarian */}
        <form
          onSubmit={applyFilter}
          className="no-print rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Filter &amp; Pengurutan Data</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Saring rekapitulasi jalis dan biaya pegawai berdasarkan periode, UPT/Bidang, kategori, maupun urutan tertinggi.
              </p>
            </div>
            <Search className="h-5 w-5 text-slate-400" />
          </div>

          <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block text-xs font-semibold text-slate-600">
              <span>Dari Tanggal</span>
              <input
                type="date"
                value={form.dari}
                onChange={(e) => updateFilter('dari', e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="block text-xs font-semibold text-slate-600">
              <span>Sampai Tanggal</span>
              <input
                type="date"
                value={form.sampai}
                onChange={(e) => updateFilter('sampai', e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="block text-xs font-semibold text-slate-600">
              <span>Status Surat Tugas</span>
              <select
                value={form.status}
                onChange={(e) => updateFilter('status', e.target.value)}
                className={inputClass}
              >
                <option value="">Semua Status Aktif</option>
                {Object.entries(statusOptions).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-semibold text-slate-600">
              <span>Kategori Perjalanan</span>
              <select
                value={form.kategori}
                onChange={(e) => updateFilter('kategori', e.target.value)}
                className={inputClass}
              >
                <option value="">Semua Kategori (DN &amp; LN)</option>
                <option value="DALAM_NEGERI">Dalam Negeri</option>
                <option value="LUAR_NEGERI">Luar Negeri</option>
              </select>
            </label>

            <label className="block text-xs font-semibold text-slate-600">
              <span>UPT / Bidang</span>
              <select
                value={form.unit}
                onChange={(e) => updateFilter('unit', e.target.value)}
                className={inputClass}
              >
                <option value="">Semua UPT / Bidang</option>
                {unitOptions.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-semibold text-slate-600">
              <span>Tampilkan Pegawai</span>
              <select
                value={form.tampil}
                onChange={(e) => updateFilter('tampil', e.target.value)}
                className={inputClass}
              >
                <option value="semua">Semua Pegawai</option>
                <option value="pernah_jalis">Hanya yang Pernah Jalis (&gt; 0)</option>
                <option value="belum_jalis">Belum Pernah Jalis (0)</option>
              </select>
            </label>

            <label className="block text-xs font-semibold text-slate-600">
              <span>Urutkan Berdasarkan</span>
              <select
                value={form.sort}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className={inputClass}
              >
                <option value="jalis_desc">Total Jalis Terbanyak</option>
                <option value="biaya_desc">Total Biaya Tertinggi</option>
                <option value="hari_desc">Total Hari Dinas Terbanyak</option>
                <option value="nama_asc">Nama Pegawai (A - Z)</option>
              </select>
            </label>

            <div className="flex items-end gap-2">
              <label className="flex-1 text-xs font-semibold text-slate-600">
                <span>Cari Pegawai / NIP</span>
                <input
                  type="text"
                  value={form.search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Ketik nama, NIP, atau jabatan..."
                  className={inputClass}
                />
              </label>
              <button
                type="button"
                onClick={resetFilter}
                title="Reset Filter"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </form>

        {/* DIAGRAM LINGKARAN (PIE / DONUT CHARTS) DINAMIS SESUAI FILTER */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl bg-[#0F2C59] p-2 text-amber-400">
                <PieChart className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 sm:text-base">
                  Diagram Lingkaran Proporsi Jalis &amp; Biaya (Menyesuaikan Filter)
                </h2>
                <p className="text-[11px] text-slate-500">
                  Klik pada irisan diagram lingkaran untuk menyaring data secara langsung.
                </p>
              </div>
            </div>

            {/* Toggle Metrik Diagram Lingkaran */}
            <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs">
              <button
                type="button"
                onClick={() => setPieMetric('jalis')}
                className={`rounded-lg px-3 py-1.5 font-bold transition ${
                  pieMetric === 'jalis'
                    ? 'bg-[#0F2C59] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Berdasarkan Jumlah Jalis
              </button>
              <button
                type="button"
                onClick={() => setPieMetric('biaya')}
                className={`rounded-lg px-3 py-1.5 font-bold transition ${
                  pieMetric === 'biaya'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Berdasarkan Total Biaya (Rp)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Pie 1: Proporsi per UPT / Bidang (atau per Pegawai jika UPT difilter) */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                    {form.unit
                      ? `Proporsi Pegawai (${form.unit})`
                      : 'Proporsi per UPT / Bidang'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {form.unit
                      ? 'Klik irisan untuk melihat rincian pegawai'
                      : 'Klik irisan untuk memfilter UPT/Bidang'}
                  </p>
                </div>
                {form.unit && (
                  <button
                    type="button"
                    onClick={() => updateFilter('unit', '')}
                    className="rounded-lg bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800 hover:bg-amber-200"
                  >
                    Semua UPT
                  </button>
                )}
              </div>

              <InteractiveDonutChart
                data={pieUptOrPegawaiData}
                centerTitle={form.unit ? form.unit : 'Semua UPT'}
                centerValue={
                  isBiayaMetric
                    ? formatCompactRupiah(summary.total_biaya ?? 0)
                    : `${summary.total_jalis ?? 0} Jalis`
                }
                centerSub={`${pieUptOrPegawaiData.filter((d) => d.value > 0).length} Kelompok`}
                valueFormatter={metricFormatter}
                activeSliceKey={form.unit || null}
                onSliceClick={(seg) => {
                  if (!form.unit) {
                    updateFilter('unit', seg.key);
                  } else {
                    const target = rows.find(
                      (r) => String(r.pegawai_id || r.nama) === seg.key
                    );
                    if (target) setSelectedPegawaiRekap(target);
                  }
                }}
              />
            </div>

            {/* Pie 2: Proporsi Kategori Perjalanan (Dalam Negeri vs Luar Negeri) */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                    Proporsi Kategori Perjalanan
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Perbandingan Dalam Negeri vs Luar Negeri
                  </p>
                </div>
                {form.kategori && (
                  <button
                    type="button"
                    onClick={() => updateFilter('kategori', '')}
                    className="rounded-lg bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800 hover:bg-amber-200"
                  >
                    Semua Kategori
                  </button>
                )}
              </div>

              <InteractiveDonutChart
                data={pieKategoriData}
                centerTitle={
                  form.kategori === 'DALAM_NEGERI'
                    ? 'Dalam Negeri'
                    : form.kategori === 'LUAR_NEGERI'
                    ? 'Luar Negeri'
                    : 'DN vs LN'
                }
                centerValue={
                  isBiayaMetric
                    ? formatCompactRupiah(summary.total_biaya ?? 0)
                    : `${summary.total_jalis ?? 0} Jalis`
                }
                centerSub={`${summary.total_hari ?? 0} Hari`}
                valueFormatter={metricFormatter}
                activeSliceKey={form.kategori || null}
                onSliceClick={(seg) =>
                  updateFilter('kategori', form.kategori === seg.key ? '' : seg.key)
                }
              />
            </div>

            {/* Pie 3: Komposisi Tingkat Biaya (A/B/C) atau Partisipasi Pegawai */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                    {thirdPieMode === 'tingkat'
                      ? 'Proporsi Tingkat Biaya'
                      : 'Rasio Partisipasi Pegawai'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {thirdPieMode === 'tingkat'
                      ? 'Distribusi Tingkat A, B, dan C'
                      : 'Pernah Jalis vs Belum Pernah Jalis'}
                  </p>
                </div>
                <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setThirdPieMode('tingkat')}
                    className={`rounded-md px-2 py-1 transition ${
                      thirdPieMode === 'tingkat'
                        ? 'bg-[#0F2C59] text-white'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Tingkat
                  </button>
                  <button
                    type="button"
                    onClick={() => setThirdPieMode('partisipasi')}
                    className={`rounded-md px-2 py-1 transition ${
                      thirdPieMode === 'partisipasi'
                        ? 'bg-[#0F2C59] text-white'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Pegawai
                  </button>
                </div>
              </div>

              <InteractiveDonutChart
                data={pieThirdData}
                centerTitle={thirdPieMode === 'tingkat' ? 'Tingkat Biaya' : 'Total Pegawai'}
                centerValue={
                  thirdPieMode === 'tingkat'
                    ? isBiayaMetric
                      ? formatCompactRupiah(summary.total_biaya ?? 0)
                      : `${summary.total_jalis ?? 0} Jalis`
                    : `${summary.total_pegawai ?? 0} Org`
                }
                centerSub={
                  thirdPieMode === 'tingkat'
                    ? 'A / B / C'
                    : `${summary.total_pegawai_jalis ?? 0} Aktif Jalis`
                }
                valueFormatter={
                  thirdPieMode === 'tingkat' ? metricFormatter : (val) => `${val} Pegawai`
                }
                activeSliceKey={thirdPieMode === 'partisipasi' ? form.tampil : null}
                onSliceClick={
                  thirdPieMode === 'partisipasi'
                    ? (seg) =>
                        updateFilter('tampil', form.tampil === seg.key ? 'semua' : seg.key)
                    : null
                }
              />
            </div>
          </div>
        </section>

        {/* DIAGRAM BATANG VISUAL */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Diagram 1: Frekuensi Jalis per Pegawai */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-blue-50 p-2 text-[#0F2C59]">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Diagram Frekuensi Jalis Pegawai (Top 10)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Perbandingan jumlah perjalanan dinas Dalam Negeri &amp; Luar Negeri
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-semibold">
                <span className="inline-flex items-center gap-1 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#0F2C59]" /> Dalam Negeri
                </span>
                <span className="inline-flex items-center gap-1 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" /> Luar Negeri
                </span>
              </div>
            </div>

            {topJalis.length > 0 ? (
              <div className="space-y-3.5">
                {topJalis.map((item, idx) => {
                  const dnPct = Math.round(((item.jalis_dalam_negeri || 0) / maxJalisCount) * 100);
                  const lnPct = Math.round(((item.jalis_luar_negeri || 0) / maxJalisCount) * 100);

                  return (
                    <div
                      key={item.pegawai_id || idx}
                      onClick={() => {
                        const target = rows.find(
                          (r) => r.pegawai_id === item.pegawai_id || r.nama === item.nama
                        );
                        if (target) setSelectedPegawaiRekap(target);
                      }}
                      className="group cursor-pointer rounded-xl border border-transparent p-2 transition hover:border-slate-200 hover:bg-slate-50/80"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-700">
                            {idx + 1}
                          </span>
                          <span className="truncate font-bold text-slate-900 group-hover:text-[#0F2C59]">
                            {item.nama}
                          </span>
                          <span className="hidden rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 sm:inline-block">
                            {item.upt_bidang}
                          </span>
                        </div>
                        <div className="shrink-0 text-right font-bold text-slate-900">
                          {item.total_jalis} Jalis{' '}
                          <span className="font-normal text-slate-400">
                            ({item.total_hari} hari)
                          </span>
                        </div>
                      </div>

                      <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
                        {item.jalis_dalam_negeri > 0 && (
                          <div
                            style={{ width: `${Math.max(dnPct, 4)}%` }}
                            className="h-full bg-[#0F2C59] transition-all duration-500"
                            title={`Dalam Negeri: ${item.jalis_dalam_negeri} Jalis`}
                          />
                        )}
                        {item.jalis_luar_negeri > 0 && (
                          <div
                            style={{ width: `${Math.max(lnPct, 4)}%` }}
                            className="h-full bg-amber-500 transition-all duration-500"
                            title={`Luar Negeri: ${item.jalis_luar_negeri} Jalis`}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-52 flex-col items-center justify-center text-center text-xs text-slate-400">
                <BarChart3 className="mb-2 h-8 w-8 text-slate-300" />
                <span>Belum ada data perjalanan dinas pada filter yang dipilih.</span>
              </div>
            )}
          </div>

          {/* Diagram 2: Total Biaya Jalis per Pegawai */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Diagram Total Biaya Jalis Pegawai (Top 10)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Akumulasi biaya perjalanan dinas tertinggi per pegawai (Rupiah)
                  </p>
                </div>
              </div>
              <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                Dalam Rupiah (IDR)
              </span>
            </div>

            {topBiaya.length > 0 ? (
              <div className="space-y-3.5">
                {topBiaya.map((item, idx) => {
                  const pct = Math.round(((item.total_biaya || 0) / maxBiayaCount) * 100);
                  return (
                    <div
                      key={item.pegawai_id || idx}
                      onClick={() => {
                        const target = rows.find(
                          (r) => r.pegawai_id === item.pegawai_id || r.nama === item.nama
                        );
                        if (target) setSelectedPegawaiRekap(target);
                      }}
                      className="group cursor-pointer rounded-xl border border-transparent p-2 transition hover:border-slate-200 hover:bg-slate-50/80"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-900">
                            {idx + 1}
                          </span>
                          <span className="truncate font-bold text-slate-900 group-hover:text-amber-700">
                            {item.nama}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            ({item.total_jalis}x Jalis)
                          </span>
                        </div>
                        <span className="shrink-0 font-mono text-xs font-extrabold text-emerald-700">
                          {formatRupiah(item.total_biaya)}
                        </span>
                      </div>

                      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          style={{ width: `${Math.max(pct, 4)}%` }}
                          className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 transition-all duration-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-52 flex-col items-center justify-center text-center text-xs text-slate-400">
                <Coins className="mb-2 h-8 w-8 text-slate-300" />
                <span>Belum ada data biaya perjalanan dinas pada filter yang dipilih.</span>
              </div>
            )}
          </div>
        </div>

        {/* Diagram 3: Ringkasan per UPT / Bidang & Tingkat Biaya */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Distribusi per UPT / Bidang */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Distribusi Jalis &amp; Biaya per UPT / Bidang
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Klik nama UPT untuk menyaring tabel
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {distribusiUpt.map((u) => {
                const barWidth = Math.round(((u.total_jalis || 0) / maxUptJalis) * 100);
                const isSelected = form.unit === u.upt;
                return (
                  <div
                    key={u.upt}
                    onClick={() => updateFilter('unit', isSelected ? '' : u.upt)}
                    className={`cursor-pointer rounded-xl border p-3 transition ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                        : 'border-slate-100 bg-slate-50/60 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-slate-900">{u.upt}</span>
                      <span className="rounded-full bg-[#0F2C59] px-2 py-0.5 text-[10px] font-bold text-white">
                        {u.total_jalis} Jalis
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        {u.pegawai_jalis}/{u.total_pegawai} Pegawai • {u.total_hari} Hari
                      </span>
                      <span className="font-mono font-bold text-emerald-700">
                        {formatRupiah(u.total_biaya)}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        style={{ width: `${u.total_jalis > 0 ? Math.max(barWidth, 6) : 0}%` }}
                        className="h-full bg-amber-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Distribusi Tingkat Biaya */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Komposisi Tingkat Biaya
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTarifModalOpen(true)}
                className="text-[11px] font-bold text-amber-600 hover:underline"
              >
                Ubah Tarif
              </button>
            </div>

            <div className="space-y-3">
              {distribusiTingkat.map((tb) => (
                <div
                  key={tb.kode}
                  className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0F2C59] text-xs font-extrabold text-amber-400">
                        {tb.kode}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{tb.nama}</div>
                        <div className="text-[10px] text-slate-500">
                          Standar: {formatRupiah(tb.tarif_harian)} / hari
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-slate-900">
                        {tb.total_jalis} Penugasan
                      </div>
                      <div className="font-mono text-[11px] font-bold text-emerald-700">
                        {formatRupiah(tb.total_biaya)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TABEL / LIST REKAPITULASI JALIS & BIAYA PEGAWAI */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex flex-col gap-1 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Daftar Rekapitulasi Jalis &amp; Biaya per Pegawai
              </h2>
              <p className="text-xs text-slate-500">
                Klik pada baris pegawai untuk melihat rincian perjalanan dinas, mengubah nominal biaya, atau membuka profil lengkap pegawai.
              </p>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Menampilkan <strong className="text-slate-900">{rows.length}</strong> pegawai
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-[#0F2C59] text-white font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4">Nama Pegawai / NIP</th>
                  <th className="py-3.5 px-4">Jabatan &amp; Pangkat</th>
                  <th className="py-3.5 px-4">UPT / Bidang</th>
                  <th className="py-3.5 px-4 text-center">Dalam Negeri</th>
                  <th className="py-3.5 px-4 text-center">Luar Negeri</th>
                  <th className="py-3.5 px-4 text-center">Total Jalis</th>
                  <th className="py-3.5 px-4 text-center">Total Hari</th>
                  <th className="py-3.5 px-4 text-right">Total Biaya (Rp)</th>
                  <th className="py-3.5 px-4 text-center no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.length > 0 ? (
                  rows.map((item, index) => (
                    <tr
                      key={item.key}
                      onClick={() => setSelectedPegawaiRekap(item)}
                      className="group cursor-pointer transition hover:bg-amber-50/40"
                    >
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {index + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-[#0F2C59] group-hover:underline">
                          {item.nama}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500">
                          NIP: {item.nip}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{item.jabatan}</div>
                        <div className="text-[11px] text-slate-400">
                          {item.pangkat !== '-' ? `${item.pangkat} (${item.golongan})` : '-'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                          {item.upt_bidang}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {item.jalis_dalam_negeri > 0 ? (
                          <span className="inline-flex items-center justify-center rounded-full bg-blue-50 px-2.5 py-0.5 font-bold text-blue-700">
                            {item.jalis_dalam_negeri}x
                          </span>
                        ) : (
                          <span className="text-slate-300">0</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {item.jalis_luar_negeri > 0 ? (
                          <span className="inline-flex items-center justify-center rounded-full bg-amber-100 px-2.5 py-0.5 font-bold text-amber-800">
                            {item.jalis_luar_negeri}x
                          </span>
                        ) : (
                          <span className="text-slate-300">0</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center rounded-xl px-3 py-1 text-xs font-extrabold ${
                            item.total_jalis > 0
                              ? 'bg-[#0F2C59] text-white shadow-sm'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {item.total_jalis} Jalis
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                        {item.total_hari} Hari
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div
                          className={`font-mono text-xs font-extrabold ${
                            item.total_biaya > 0 ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          {formatRupiah(item.total_biaya)}
                        </div>
                        {item.total_jalis > 0 && (
                          <div className="text-[10px] text-slate-400">
                            Rata-rata: {formatRupiah(item.rata_rata_biaya)}/jalis
                          </div>
                        )}
                      </td>
                      <td
                        className="py-3.5 px-4 text-center no-print"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedPegawaiRekap(item)}
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-1.5 text-[11px] font-bold text-amber-900 transition hover:bg-amber-200"
                            title="Lihat Rincian Jalis & Biaya"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Rincian</span>
                          </button>
                          {item.pegawai_detail && (
                            <button
                              type="button"
                              onClick={() => setSelectedProfilePegawai(item.pegawai_detail)}
                              className="rounded-lg bg-slate-100 p-1.5 text-slate-600 transition hover:bg-blue-100 hover:text-blue-800"
                              title="Lihat Profil Pegawai"
                            >
                              <User className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="py-10 text-center text-sm text-slate-400">
                      Tidak ada data pegawai yang sesuai dengan filter.
                    </td>
                  </tr>
                )}
              </tbody>
              {rows.length > 0 && (
                <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-extrabold text-slate-900">
                  <tr>
                    <td colSpan="4" className="py-3.5 px-4 text-right uppercase tracking-wider">
                      Total Keseluruhan ({rows.length} Pegawai)
                    </td>
                    <td className="py-3.5 px-4 text-center text-blue-700">
                      {rows.reduce((acc, r) => acc + (r.jalis_dalam_negeri || 0), 0)}x
                    </td>
                    <td className="py-3.5 px-4 text-center text-amber-700">
                      {rows.reduce((acc, r) => acc + (r.jalis_luar_negeri || 0), 0)}x
                    </td>
                    <td className="py-3.5 px-4 text-center text-[#0F2C59]">
                      {rows.reduce((acc, r) => acc + (r.total_jalis || 0), 0)} Jalis
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {rows.reduce((acc, r) => acc + (r.total_hari || 0), 0)} Hari
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-700">
                      {formatRupiah(rows.reduce((acc, r) => acc + (r.total_biaya || 0), 0))}
                    </td>
                    <td className="no-print" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>
      </div>

      {/* MODAL RINCIAN JALIS & BIAYA PER PEGAWAI */}
      {selectedPegawaiRekap && (
        <div
          onClick={() => {
            setSelectedPegawaiRekap(null);
            setEditingBiayaId(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-2xl"
          >
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-[#0F2C59] to-[#1a4180] px-6 py-5 text-white">
              <button
                type="button"
                onClick={() => {
                  setSelectedPegawaiRekap(null);
                  setEditingBiayaId(null);
                }}
                className="absolute right-4 top-4 rounded-lg bg-white/10 p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pr-8">
                <div>
                  <span className="inline-block rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-300 border border-amber-400/30">
                    Rincian Perjalanan Dinas (Jalis) &amp; Biaya Pegawai
                  </span>
                  <h3 className="mt-1 text-lg font-extrabold text-white sm:text-xl">
                    {selectedPegawaiRekap.nama}
                  </h3>
                  <p className="text-xs text-slate-200">
                    NIP: <span className="font-mono">{selectedPegawaiRekap.nip}</span> •{' '}
                    {selectedPegawaiRekap.jabatan} ({selectedPegawaiRekap.upt_bidang})
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-xl bg-white/10 px-3.5 py-2 text-center">
                    <div className="text-[10px] uppercase text-slate-300">Total Jalis</div>
                    <div className="text-base font-extrabold text-amber-400">
                      {selectedPegawaiRekap.total_jalis}x ({selectedPegawaiRekap.total_hari} Hari)
                    </div>
                  </div>
                  <div className="rounded-xl bg-emerald-500/20 border border-emerald-400/30 px-3.5 py-2 text-right">
                    <div className="text-[10px] uppercase text-emerald-200">Total Biaya</div>
                    <div className="font-mono text-base font-extrabold text-emerald-300">
                      {formatRupiah(selectedPegawaiRekap.total_biaya)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Body Daftar Riwayat Jalis */}
            <div className="p-6">
              {selectedPegawaiRekap.riwayat && selectedPegawaiRekap.riwayat.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 font-bold text-slate-800 uppercase text-[11px]">
                      <tr>
                        <th className="py-3 px-3 text-center w-10">No</th>
                        <th className="py-3 px-3">Nomor ST / SPD &amp; Perihal</th>
                        <th className="py-3 px-3">Tujuan &amp; Kategori</th>
                        <th className="py-3 px-3 text-center">Periode &amp; Hari</th>
                        <th className="py-3 px-3 text-center">Tingkat Biaya</th>
                        <th className="py-3 px-3 text-right">Biaya (Rp)</th>
                        <th className="py-3 px-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedPegawaiRekap.riwayat.map((trip, idx) => {
                        const isEditing = editingBiayaId === trip.surat_tugas_pegawai_id;
                        return (
                          <tr key={trip.surat_tugas_pegawai_id} className="hover:bg-slate-50/80">
                            <td className="py-3 px-3 text-center font-bold">{idx + 1}</td>
                            <td className="py-3 px-3">
                              <div className="font-mono font-bold text-slate-900">
                                {trip.nomor_st}
                              </div>
                              <div className="font-mono text-[11px] text-slate-500">
                                SPD: {trip.nomor_spd}
                              </div>
                              <div className="mt-1 line-clamp-2 text-slate-700 font-medium">
                                {trip.perihal}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900">{trip.tujuan}</div>
                              <span
                                className={`mt-1 inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                                  trip.kategori_kode === 'LUAR_NEGERI'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-blue-50 text-blue-700'
                                }`}
                              >
                                {trip.kategori}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <div className="font-medium text-slate-800">
                                {trip.tanggal_berangkat || '-'} s/d {trip.tanggal_kembali || '-'}
                              </div>
                              <div className="text-[11px] font-bold text-amber-600">
                                {trip.durasi_hari} Hari
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 font-bold text-slate-800">
                                {trip.tingkat_biaya}
                              </span>
                              <div className="mt-0.5 text-[10px] text-slate-400">
                                {trip.angkutan}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right">
                              {isEditing ? (
                                <div className="flex flex-col items-end gap-1.5">
                                  <input
                                    type="number"
                                    min="0"
                                    value={biayaInputValue}
                                    onChange={(e) => setBiayaInputValue(e.target.value)}
                                    placeholder={String(trip.biaya_otomatis)}
                                    className="w-36 rounded-lg border border-amber-400 px-2.5 py-1 text-right font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                                  />
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      disabled={savingBiaya}
                                      onClick={() =>
                                        handleSaveBiaya(
                                          trip.surat_tugas_pegawai_id,
                                          biayaInputValue
                                        )
                                      }
                                      className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-emerald-700"
                                    >
                                      Simpan
                                    </button>
                                    <button
                                      type="button"
                                      disabled={savingBiaya}
                                      onClick={() =>
                                        handleSaveBiaya(trip.surat_tugas_pegawai_id, null)
                                      }
                                      className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-300"
                                      title="Kembalikan ke perhitungan standar otomatis"
                                    >
                                      Otomatis
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingBiayaId(null)}
                                      className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="font-mono font-extrabold text-emerald-700">
                                    {formatRupiah(trip.biaya_efektif)}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {trip.biaya_manual !== null
                                      ? 'Nominal Aktual (Manual)'
                                      : 'Estimasi Standar'}
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingBiayaId(trip.surat_tugas_pegawai_id);
                                    setBiayaInputValue(String(trip.biaya_efektif));
                                  }}
                                  className="rounded-lg bg-slate-100 p-1.5 text-slate-700 transition hover:bg-amber-100 hover:text-amber-800"
                                  title="Ubah Nominal Biaya"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <Link
                                  href={`/surat-tugas/${trip.surat_tugas_id}`}
                                  className="rounded-lg bg-slate-100 p-1.5 text-slate-700 transition hover:bg-blue-100 hover:text-blue-800"
                                  title="Buka Detail Surat Tugas"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-100 bg-slate-50 py-10 text-center text-xs text-slate-400">
                  Pegawai ini belum memiliki riwayat perjalanan dinas pada periode/filter yang dipilih.
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-6 py-4">
              {selectedPegawaiRekap.pegawai_detail ? (
                <button
                  type="button"
                  onClick={() => {
                    const detail = selectedPegawaiRekap.pegawai_detail;
                    setSelectedPegawaiRekap(null);
                    setSelectedProfilePegawai(detail);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                >
                  <User className="h-3.5 w-3.5 text-amber-600" />
                  <span>Lihat Profil Lengkap Pegawai</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={() => {
                  setSelectedPegawaiRekap(null);
                  setEditingBiayaId(null);
                }}
                className="rounded-xl bg-[#0F2C59] px-5 py-2 text-xs font-bold text-white transition hover:bg-[#0B2247]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PENGATURAN TARIF STANDAR HARIAN */}
      {isTarifModalOpen && (
        <div
          onClick={() => setIsTarifModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Standar Tarif Harian Tingkat Biaya
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Digunakan untuk estimasi otomatis biaya per hari perjalanan dinas
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTarifModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTarif} className="space-y-4">
              {['A', 'B', 'C'].map((kode) => (
                <div key={kode}>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tarif Harian Tingkat {kode} (Rp / Hari)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={tarifForm[kode] ?? 0}
                    onChange={(e) =>
                      setTarifForm((prev) => ({ ...prev, [kode]: Number(e.target.value) }))
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 font-mono text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              ))}

              <p className="rounded-xl bg-amber-50 p-3 text-[11px] text-amber-800 border border-amber-200">
                Catatan: Untuk perjalanan dinas <strong>Luar Negeri</strong>, kalkulasi otomatis dikalikan 2x tarif harian standar (kecuali jika diisi nominal aktual secara manual pada rincian pegawai).
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTarifModalOpen(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingTarif}
                  className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:bg-amber-400 disabled:opacity-60"
                >
                  {savingTarif ? 'Menyimpan...' : 'Simpan Standar Tarif'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PROFIL PEGAWAI */}
      <PegawaiProfileModal
        pegawai={selectedProfilePegawai}
        onClose={() => setSelectedProfilePegawai(null)}
        showBankInfo={true}
      />
    </AdminLayout>
  );
}

