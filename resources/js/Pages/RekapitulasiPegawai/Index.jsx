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

function getUptColor(name) {
  const colorIndex = [...name].reduce(
    (value, character) => (value * 31 + character.charCodeAt(0)) % PIE_COLORS.length,
    0
  );
  return PIE_COLORS[colorIndex];
}

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
 * Komponen Grafik Kombinasi (Clustered Column/Bar + Line Chart) beserta Tabel Ringkasan
 * Menyerupai tampilan grafik kombinasi Excel (2 Batang Vertikal Biru & Oranye + 1 Garis Tren Abu-abu)
 */
function ComboBarLineChart({
  title = 'Rekapitulasi Jaldis',
  categoryHeader = 'Bulan',
  seriesALabel = 'Dalam Negeri',
  seriesBLabel = 'Luar Negeri',
  seriesCLabel = 'Total Jaldis',
  items = [],
  valueFormatter = (v) => v,
  axisFormatter = (v) => v,
  onItemClick = null,
  activeItemKey = null,
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Hitung nilai maksimum untuk skala sumbu Y
  const rawMax = Math.max(
    0,
    ...items.map((it) =>
      Math.max(Number(it.seriesA || 0), Number(it.seriesB || 0), Number(it.seriesC || 0))
    )
  );

  // Buat langkah skala Y yang rapi (6 interval)
  const stepCount = 6;
  const niceStep = (() => {
    if (rawMax <= 0) return 1;
    const rough = rawMax / stepCount;
    const mag = Math.pow(10, Math.floor(Math.log10(rough)));
    const residual = rough / mag;
    if (residual > 5) return 10 * mag;
    if (residual > 2) return 5 * mag;
    if (residual > 1) return 2 * mag;
    return Math.max(1, mag);
  })();
  const yMax = Math.max(niceStep * stepCount, Math.ceil(rawMax / niceStep) * niceStep || 6);

  const yTicks = [];
  for (let val = yMax; val >= 0; val -= niceStep) {
    yTicks.push(val);
  }

  // Dimensi SVG
  const count = Math.max(1, items.length);
  const padLeft = 72;
  const padRight = 28;
  const padTop = 28;
  const padBottom = 86;
  const plotHeight = 230;
  const slotWidth = Math.max(54, Math.min(82, Math.floor(680 / count)));
  const plotWidth = count * slotWidth;
  const svgWidth = padLeft + plotWidth + padRight;
  const svgHeight = padTop + plotHeight + padBottom;

  const toY = (val) => {
    const ratio = yMax > 0 ? Math.min(1, Math.max(0, Number(val || 0) / yMax)) : 0;
    return padTop + plotHeight - ratio * plotHeight;
  };

  // Titik-titik garis untuk Series C
  const linePoints = items.map((it, idx) => {
    const cx = padLeft + idx * slotWidth + slotWidth / 2;
    const cy = toY(it.seriesC);
    return { x: cx, y: cy, val: Number(it.seriesC || 0) };
  });

  const polylineStr = linePoints.map((pt) => `${pt.x},${pt.y}`).join(' ');

  const totalA = items.reduce((acc, it) => acc + Number(it.seriesA || 0), 0);
  const totalB = items.reduce((acc, it) => acc + Number(it.seriesB || 0), 0);
  const totalC = items.reduce((acc, it) => acc + Number(it.seriesC || 0), 0);

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
      {/* Tabel Ringkasan di Sisi Kiri (Gaya Spreadsheet) */}
      <div className="overflow-x-auto rounded-xl border border-slate-300 bg-white shadow-sm xl:col-span-4">
        <table className="w-full border-collapse text-xs text-slate-800">
          <thead>
            <tr className="bg-slate-100 font-bold text-slate-900">
              <th className="border border-slate-300 px-3 py-2 text-left">{categoryHeader}</th>
              <th className="border border-slate-300 px-2.5 py-2 text-right text-[#2F5597]">
                {seriesALabel}
              </th>
              <th className="border border-slate-300 px-2.5 py-2 text-right text-[#C55A11]">
                {seriesBLabel}
              </th>
              <th className="border border-slate-300 px-2.5 py-2 text-right text-slate-700">
                {seriesCLabel}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => {
              const isHovered = hoveredIdx === idx;
              const isSelected = activeItemKey && activeItemKey === it.key;
              return (
                <tr
                  key={it.key || idx}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => onItemClick && onItemClick(it)}
                  className={`transition ${onItemClick ? 'cursor-pointer' : ''} ${
                    isSelected
                      ? 'bg-amber-50 font-bold'
                      : isHovered
                      ? 'bg-blue-50/70'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="border border-slate-200 px-3 py-1.5 font-medium text-slate-900 truncate max-w-[140px]">
                    {it.label}
                  </td>
                  <td className="border border-slate-200 px-2.5 py-1.5 text-right font-mono">
                    {valueFormatter(it.seriesA)}
                  </td>
                  <td className="border border-slate-200 px-2.5 py-1.5 text-right font-mono">
                    {valueFormatter(it.seriesB)}
                  </td>
                  <td className="border border-slate-200 px-2.5 py-1.5 text-right font-mono font-semibold">
                    {valueFormatter(it.seriesC)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-extrabold text-slate-900">
              <td className="border border-slate-300 px-3 py-2">Total</td>
              <td className="border border-slate-300 px-2.5 py-2 text-right font-mono text-[#2F5597]">
                {valueFormatter(totalA)}
              </td>
              <td className="border border-slate-300 px-2.5 py-2 text-right font-mono text-[#C55A11]">
                {valueFormatter(totalB)}
              </td>
              <td className="border border-slate-300 px-2.5 py-2 text-right font-mono">
                {valueFormatter(totalC)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Grafik Kombinasi Batang + Garis di Sisi Kanan */}
      <div className="flex flex-col justify-between rounded-xl border border-slate-300 bg-white p-5 shadow-sm xl:col-span-8">
        {/* Judul Grafik */}
        <div className="mb-2 text-center">
          <h3 className="text-base font-bold tracking-tight text-slate-600 sm:text-lg">
            {title}
          </h3>
        </div>

        {/* Kanvas SVG Grafik */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="mx-auto h-auto min-w-[560px] w-full select-none"
          >
            {/* Garis Grid Horizontal & Label Sumbu Y */}
            {yTicks.map((tickVal, i) => {
              const y = toY(tickVal);
              return (
                <g key={i}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={padLeft + plotWidth}
                    y2={y}
                    stroke="#D9D9D9"
                    strokeWidth="1"
                  />
                  <text
                    x={padLeft - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-slate-500 text-[11px] font-medium"
                  >
                    {axisFormatter(tickVal)}
                  </text>
                </g>
              );
            })}

            {/* Batang Series A (Biru) & Series B (Oranye) per Kategori */}
            {items.map((it, idx) => {
              const groupCenter = padLeft + idx * slotWidth + slotWidth / 2;
              const barWidth = Math.min(16, Math.max(10, Math.floor(slotWidth * 0.24)));
              const barGap = 3;

              const valA = Number(it.seriesA || 0);
              const valB = Number(it.seriesB || 0);
              const yA = toY(valA);
              const hA = Math.max(0, padTop + plotHeight - yA);
              const yB = toY(valB);
              const hB = Math.max(0, padTop + plotHeight - yB);

              const xA = groupCenter - barWidth - barGap / 2;
              const xB = groupCenter + barGap / 2;
              const isHovered = hoveredIdx === idx;
              const isSelected = activeItemKey && activeItemKey === it.key;

              return (
                <g
                  key={it.key || idx}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => onItemClick && onItemClick(it)}
                  className={onItemClick ? 'cursor-pointer' : ''}
                >
                  {/* Highlight Latar Kolom Saat Hover / Aktif */}
                  {(isHovered || isSelected) && (
                    <rect
                      x={padLeft + idx * slotWidth + 2}
                      y={padTop}
                      width={slotWidth - 4}
                      height={plotHeight}
                      rx="4"
                      fill={isSelected ? '#FEF3C7' : '#F1F5F9'}
                      opacity="0.7"
                    />
                  )}

                  {/* Batang Biru (Series A) */}
                  <rect
                    x={xA}
                    y={yA}
                    width={barWidth}
                    height={hA}
                    fill="#4472C4"
                    rx="1.5"
                  >
                    <title>{`${it.label} — ${seriesALabel}: ${valueFormatter(valA)}`}</title>
                  </rect>

                  {/* Batang Oranye (Series B) */}
                  <rect
                    x={xB}
                    y={yB}
                    width={barWidth}
                    height={hB}
                    fill="#ED7D31"
                    rx="1.5"
                  >
                    <title>{`${it.label} — ${seriesBLabel}: ${valueFormatter(valB)}`}</title>
                  </rect>

                  {/* Label Sumbu X Miring (-45 derajat) */}
                  <text
                    x={groupCenter}
                    y={padTop + plotHeight + 16}
                    textAnchor="end"
                    transform={`rotate(-40, ${groupCenter}, ${padTop + plotHeight + 16})`}
                    className={`text-[11px] ${
                      isHovered || isSelected
                        ? 'fill-slate-900 font-bold'
                        : 'fill-slate-600 font-medium'
                    }`}
                  >
                    {String(it.label).length > 16
                      ? `${String(it.label).slice(0, 15)}…`
                      : it.label}
                  </text>
                </g>
              );
            })}

            {/* Garis Tren Abu-abu (Series C) di Atas Batang */}
            {linePoints.length > 1 && (
              <polyline
                fill="none"
                stroke="#A5A5A5"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylineStr}
              />
            )}

            {/* Titik Marker & Tooltip Nilai pada Garis Series C */}
            {linePoints.map((pt, idx) => {
              const isHovered = hoveredIdx === idx;
              return (
                <g
                  key={idx}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 5 : 3.5}
                    fill={isHovered ? '#0F2C59' : '#A5A5A5'}
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                  {isHovered && (
                    <g>
                      <rect
                        x={pt.x - 42}
                        y={Math.max(4, pt.y - 28)}
                        width="84"
                        height="20"
                        rx="4"
                        fill="#0F2C59"
                      />
                      <text
                        x={pt.x}
                        y={Math.max(18, pt.y - 14)}
                        textAnchor="middle"
                        className="fill-white text-[10px] font-bold"
                      >
                        {valueFormatter(pt.val)}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legenda Bawah (Persis Gaya Excel) */}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-6 border-t border-slate-100 pt-3 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-7 rounded-sm bg-[#4472C4]" />
            <span>{seriesALabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-7 rounded-sm bg-[#ED7D31]" />
            <span>{seriesBLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-8 items-center">
              <span className="h-[3px] w-full rounded bg-[#A5A5A5]" />
              <span className="absolute left-1/2 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-[#A5A5A5] ring-2 ring-white" />
            </span>
            <span>{seriesCLabel}</span>
          </div>
        </div>
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

  // State khusus Grafik Kombinasi agar dinamis terhadap metrik & tampilan sumbu X
  const [pieMetric, setPieMetric] = useState('jalis'); // 'jalis' | 'biaya'
  const [pieView, setPieView] = useState('bulanan'); // 'bulanan' | 'upt' | 'pegawai' | 'tingkat'

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

  const rekapBulanan = charts.rekapBulanan || [];
  const topJalis = charts.topPegawaiJalis || [];
  const topBiaya = charts.topPegawaiBiaya || [];
  const distribusiUpt = charts.distribusiUpt || [];
  const distribusiTingkat = charts.distribusiTingkat || [];
  const activeFilterCount = [
    form.dari,
    form.sampai,
    form.status,
    form.kategori,
    form.unit,
    form.search,
    form.tampil !== 'semua',
    form.sort !== 'jalis_desc',
  ].filter(Boolean).length;

  const maxJalisCount = Math.max(1, ...topJalis.map((item) => item.total_jalis || 0));
  const maxBiayaCount = Math.max(1, ...topBiaya.map((item) => item.total_biaya || 0));
  const totalJalisUpt = distribusiUpt.reduce((total, item) => total + Number(item.total_jalis || 0), 0);

  const isBiayaMetric = pieMetric === 'biaya';
  const comboValueFormatter = isBiayaMetric
    ? (val) => formatCompactRupiah(val)
    : (val) => Number(val || 0).toLocaleString('id-ID');
  const comboAxisFormatter = isBiayaMetric
    ? (val) => formatCompactRupiah(val)
    : (val) => Number(val || 0).toLocaleString('id-ID');

  const activeYearLabel = form.dari
    ? String(form.dari).slice(0, 4)
    : form.sampai
    ? String(form.sampai).slice(0, 4)
    : new Date().getFullYear();

  // 1. Data Grafik Kombinasi: Per Bulan (Januari - Desember)
  const comboBulananItems = rekapBulanan.map((m) => ({
    key: String(m.bulan_num),
    label: m.bulan,
    seriesA: isBiayaMetric ? m.biaya_dalam_negeri ?? 0 : m.jalis_dalam_negeri ?? 0,
    seriesB: isBiayaMetric ? m.biaya_luar_negeri ?? 0 : m.jalis_luar_negeri ?? 0,
    seriesC: isBiayaMetric ? m.total_biaya ?? 0 : m.total_jalis ?? 0,
    raw: m,
  }));

  // 2. Data Grafik Kombinasi: Per UPT / Bidang
  const comboUptItems = distribusiUpt.map((u) => ({
    key: u.upt,
    label: u.upt,
    seriesA: isBiayaMetric ? u.biaya_dalam_negeri ?? 0 : u.jalis_dalam_negeri ?? 0,
    seriesB: isBiayaMetric ? u.biaya_luar_negeri ?? 0 : u.jalis_luar_negeri ?? 0,
    seriesC: isBiayaMetric ? u.total_biaya ?? 0 : u.total_jalis ?? 0,
    raw: u,
  }));

  // 3. Data Grafik Kombinasi: Per Pegawai (Top 12)
  const comboPegawaiItems = rows.slice(0, 12).map((r) => {
    const biayaDN = (r.riwayat || []).reduce(
      (sum, t) =>
        (t.kategori_kode ?? '') !== 'LUAR_NEGERI' ? sum + Number(t.biaya_efektif || 0) : sum,
      0
    );
    const biayaLN = (r.riwayat || []).reduce(
      (sum, t) =>
        (t.kategori_kode ?? '') === 'LUAR_NEGERI' ? sum + Number(t.biaya_efektif || 0) : sum,
      0
    );
    return {
      key: r.key,
      label: r.nama,
      seriesA: isBiayaMetric ? biayaDN : r.jalis_dalam_negeri ?? 0,
      seriesB: isBiayaMetric ? biayaLN : r.jalis_luar_negeri ?? 0,
      seriesC: isBiayaMetric ? r.total_biaya ?? 0 : r.total_jalis ?? 0,
      raw: r,
    };
  });

  // 4. Data Grafik Kombinasi: Per Tingkat Biaya (A / B / C)
  const comboTingkatItems = distribusiTingkat.map((tb) => ({
    key: tb.kode,
    label: `Tingkat ${tb.kode}`,
    seriesA: isBiayaMetric ? tb.biaya_dalam_negeri ?? 0 : tb.jalis_dalam_negeri ?? 0,
    seriesB: isBiayaMetric ? tb.biaya_luar_negeri ?? 0 : tb.jalis_luar_negeri ?? 0,
    seriesC: isBiayaMetric ? tb.total_biaya ?? 0 : tb.total_jalis ?? 0,
    raw: tb,
  }));

  const chartViews = [
    { id: 'bulanan', label: 'Per Bulan (Jan – Des)' },
    { id: 'upt', label: 'Per UPT / Bidang' },
    { id: 'pegawai', label: 'Per Pegawai' },
    { id: 'tingkat', label: 'Tingkat Biaya (A/B/C)' },
  ];

  const chartConfigs = {
    bulanan: {
      title: `${
        isBiayaMetric ? 'Rekapitulasi Biaya Jaldis' : 'Rekapitulasi Jaldis'
      } Tahun ${activeYearLabel}`,
      subtitle: 'Perbandingan Dalam Negeri, Luar Negeri, dan Total per Bulan',
      categoryHeader: 'Bulan',
      items: comboBulananItems,
      activeItemKey: null,
      resetLabel: null,
      onReset: null,
      onItemClick: null,
    },
    upt: {
      title: `${
        isBiayaMetric ? 'Rekapitulasi Biaya Jaldis' : 'Rekapitulasi Jaldis'
      } per UPT / Bidang`,
      subtitle: 'Klik baris atau batang UPT/Bidang untuk memfilter data',
      categoryHeader: 'UPT / Bidang',
      items: comboUptItems,
      activeItemKey: form.unit || null,
      resetLabel: form.unit ? 'Tampilkan Semua UPT' : null,
      onReset: () => updateFilter('unit', ''),
      onItemClick: (it) => updateFilter('unit', form.unit === it.key ? '' : it.key),
    },
    pegawai: {
      title: `${
        isBiayaMetric ? 'Rekapitulasi Biaya Jaldis' : 'Rekapitulasi Jaldis'
      } per Pegawai (Top 12)`,
      subtitle: 'Klik baris atau batang pegawai untuk membuka rincian perjalanan dinasnya',
      categoryHeader: 'Nama Pegawai',
      items: comboPegawaiItems,
      activeItemKey: null,
      resetLabel: null,
      onReset: null,
      onItemClick: (it) => {
        if (it.raw) setSelectedPegawaiRekap(it.raw);
      },
    },
    tingkat: {
      title: `${
        isBiayaMetric ? 'Rekapitulasi Biaya Jaldis' : 'Rekapitulasi Jaldis'
      } per Tingkat Biaya`,
      subtitle: 'Distribusi Tingkat Biaya A, B, dan C',
      categoryHeader: 'Tingkat Biaya',
      items: comboTingkatItems,
      activeItemKey: null,
      resetLabel: null,
      onReset: null,
      onItemClick: null,
    },
  };

  const activeChart = chartConfigs[pieView] || chartConfigs.bulanan;

  return (
    <AdminLayout title="Rekap Jaldis Pegawai">
      <Head title="Rekap Jaldis Pegawai - e-SPD Pusdiklat Kemlu" />

      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 12mm;

            @top-left-corner,
            @top-left,
            @top-center,
            @top-right,
            @top-right-corner,
            @bottom-left-corner,
            @bottom-left,
            @bottom-center,
            @bottom-right-corner {
              content: "";
            }

            @bottom-right {
              content: counter(page);
              color: #64748b;
              font-family: sans-serif;
              font-size: 9pt;
            }
          }

          html, body, #app, #app > div {
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }

          body * {
            visibility: hidden !important;
          }

          #app > div,
          #app > div > div,
          main {
            display: block !important;
            position: static !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            padding: 0 !important;
            background: #fff !important;
          }

          .print-page,
          .print-page * {
            visibility: visible !important;
          }

          main > *:not(.print-page) {
            display: none !important;
          }

          .print-page {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .print-page > *:not(.printable-table),
          .printable-table .no-print {
            display: none !important;
          }

          .printable-table {
            position: relative !important;
            width: 100% !important;
            overflow: visible !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }

          .print-only {
            display: block !important;
          }

          .printable-table .overflow-x-auto {
            overflow: visible !important;
          }

          .printable-table table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 9pt !important;
          }

          .printable-table thead {
            display: table-header-group;
          }

          .printable-table tr {
            break-inside: avoid;
          }

          .printable-table th,
          .printable-table td {
            padding: 6px !important;
            border: 1px solid #cbd5e1 !important;
            color: #0f172a !important;
            vertical-align: middle !important;
          }

          .printable-table th {
            background: #0f2c59 !important;
            color: #fff !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="print-page mx-auto max-w-[1600px] space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-amber-50/80 p-5 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-4 sm:p-6">
          <div className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-amber-100/50 blur-3xl" />
          <div className="relative flex items-start gap-3">
            <div className="rounded-2xl bg-[#0F2C59] p-3 text-amber-400 shadow-lg shadow-blue-950/10">
              <PieChart className="h-6 w-6" />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-600">
                Analitik Perjalanan Dinas
              </p>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Rekap Jaldis Pegawai
              </h1>
              <p className="no-print mt-1.5 text-sm text-slate-500">
                Pantau perjalanan dinas, biaya, dan partisipasi pegawai.
              </p>
            </div>
          </div>

          <div className="no-print relative mt-4 flex flex-wrap gap-2 sm:mt-0 sm:justify-end">
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
          <div className="rounded-2xl border border-slate-200/80 border-t-4 border-t-blue-900 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pegawai melakukan Jaldis
              </span>
              <div className="rounded-xl bg-blue-50 p-2.5 text-[#0F2C59]">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                {summary.total_pegawai_jalis ?? 0}
              </span>
              <span className="text-xs text-slate-500">
                / {summary.total_pegawai ?? 0} pegawai
              </span>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500">
              {summary.total_pegawai_belum_jalis ?? 0} belum melakukan perjalanan
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 border-t-4 border-t-emerald-500 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total penugasan
              </span>
              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                <Plane className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                {summary.total_jalis ?? 0}
              </span>
              <span className="text-xs text-slate-500">perjalanan dinas</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-800">
                DN {summary.jalis_dalam_negeri ?? 0}
              </span>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">
                LN {summary.jalis_luar_negeri ?? 0}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 border-t-4 border-t-violet-500 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Lama perjalanan
              </span>
              <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                {summary.total_hari ?? 0}
              </span>
              <span className="text-xs text-slate-500">hari dinas</span>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 border-t-4 border-t-amber-500 bg-gradient-to-br from-amber-50/80 to-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Total biaya perjalanan
              </span>
              <div className="rounded-xl bg-amber-500 p-2.5 text-slate-950 shadow-sm">
                <Coins className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                {formatRupiah(summary.total_biaya ?? 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Filter & Pencarian */}
        <form
          onSubmit={applyFilter}
          className="no-print rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-2 text-slate-600">
                <Search className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Filter data</h2>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Persempit hasil berdasarkan periode, unit, atau pegawai.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                  {activeFilterCount} filter aktif
                </span>
              )}
              <button
                type="button"
                onClick={resetFilter}
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>
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
                <option value="pernah_jalis">Pernah melakukan Jaldis</option>
                <option value="belum_jalis">Belum pernah melakukan Jaldis</option>
              </select>
            </label>

            <label className="block text-xs font-semibold text-slate-600">
              <span>Urutkan Berdasarkan</span>
              <select
                value={form.sort}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className={inputClass}
              >
                <option value="jalis_desc">Jaldis terbanyak</option>
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
                  Ringkasan Jaldis &amp; Biaya
                </h2>
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
                Jumlah Jaldis
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
                Total Biaya
              </button>
            </div>
          </div>

          {/* Pilihan Kategori Sumbu X yang Ditampilkan */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Tampilkan grafik:</span>
              {chartViews.map((view) => (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => setPieView(view.id)}
                  className={`rounded-xl border px-3.5 py-1.5 text-xs font-bold transition ${
                    pieView === view.id
                      ? 'border-[#0F2C59] bg-[#0F2C59] text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-amber-400 hover:bg-amber-50'
                  }`}
                >
                  {view.label}
                </button>
              ))}
            </div>

            {activeChart.resetLabel && (
              <button
                type="button"
                onClick={activeChart.onReset}
                className="rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 hover:bg-amber-200"
              >
                {activeChart.resetLabel}
              </button>
            )}
          </div>

          <ComboBarLineChart
            title={activeChart.title}
            categoryHeader={activeChart.categoryHeader}
            seriesALabel="Dalam Negeri"
            seriesBLabel="Luar Negeri"
            seriesCLabel={isBiayaMetric ? 'Total Biaya' : 'Total Jaldis'}
            items={activeChart.items}
            valueFormatter={comboValueFormatter}
            axisFormatter={comboAxisFormatter}
            activeItemKey={activeChart.activeItemKey}
            onItemClick={activeChart.onItemClick}
          />
        </section>

        {/* DIAGRAM BATANG VISUAL */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Diagram 1: Frekuensi Jaldis per Pegawai */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-blue-50 p-2 text-[#0F2C59]">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Frekuensi Jaldis Terbanyak
                  </h3>
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
                          {item.total_jalis} Jaldis{' '}
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
                            title={`Dalam Negeri: ${item.jalis_dalam_negeri} Jaldis`}
                          />
                        )}
                        {item.jalis_luar_negeri > 0 && (
                          <div
                            style={{ width: `${Math.max(lnPct, 4)}%` }}
                            className="h-full bg-amber-500 transition-all duration-500"
                            title={`Luar Negeri: ${item.jalis_luar_negeri} Jaldis`}
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

          {/* Diagram 2: Total Biaya Jaldis per Pegawai */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Biaya Jaldis Tertinggi
                  </h3>
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
                            ({item.total_jalis}x Jaldis)
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
                  Distribusi Jaldis per UPT / Bidang
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Persentase dari total Jaldis
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {distribusiUpt.map((u) => {
                const share = totalJalisUpt > 0 ? (u.total_jalis / totalJalisUpt) * 100 : 0;
                const uptColor = getUptColor(u.upt);
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
                      <span className="truncate text-xs font-bold text-slate-900">{u.upt}</span>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{
                            backgroundColor: `${uptColor}18`,
                            color: uptColor,
                          }}
                          title={`${share.toFixed(1)}% dari total Jaldis`}
                        >
                          {share.toFixed(1)}%
                        </span>
                        <span className="rounded-full bg-[#0F2C59] px-2 py-0.5 text-[10px] font-bold text-white">
                          {u.total_jalis} Jaldis
                        </span>
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        {u.pegawai_jalis}/{u.total_pegawai} Pegawai • {u.total_hari} Hari
                      </span>
                      <span className="font-mono font-bold text-emerald-700">
                        {formatRupiah(u.total_biaya)}
                      </span>
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

        {/* TABEL / LIST REKAPITULASI JALDIS & BIAYA PEGAWAI */}
        <section className="printable-table overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="print-only hidden border-b border-slate-200 px-0 py-0 pb-3">
            <h1 className="text-xl font-bold text-slate-900">Rekap Jaldis &amp; Biaya Pegawai</h1>
            <p className="mt-1 text-sm text-slate-600">Jumlah pegawai: {rows.length}</p>
          </div>
          <div className="no-print flex flex-col gap-1 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Daftar Jaldis &amp; Biaya Pegawai
              </h2>
              <p className="text-xs text-slate-500">
                Pilih pegawai untuk melihat rincian.
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
                  <th className="py-3.5 px-4 text-center">Total Jaldis</th>
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
                          {item.total_jalis} Jaldis
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
                            Rata-rata: {formatRupiah(item.rata_rata_biaya)}/Jaldis
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
                            title="Lihat Rincian Jaldis & Biaya"
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
                      {rows.reduce((acc, r) => acc + (r.total_jalis || 0), 0)} Jaldis
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

      {/* MODAL RINCIAN JALDIS & BIAYA PER PEGAWAI */}
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
                    Rincian Perjalanan Dinas (Jaldis) &amp; Biaya Pegawai
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
                    <div className="text-[10px] uppercase text-slate-300">Total Jaldis</div>
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

            {/* Body Daftar Riwayat Jaldis */}
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
