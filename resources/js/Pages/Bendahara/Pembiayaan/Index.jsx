import React, { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import InfoTooltip from '@/Components/InfoTooltip';
import {
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Printer,
  Eye,
  MapPin,
  Calendar,
  UserCheck,
  Inbox,
  FileSpreadsheet,
  Users,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatRupiah } from '@/Utils/terbilang';

const PEMBIAYAAN_META = {
  MENUNGGU_PERSETUJUAN: {
    label: 'Menunggu Approval Bendahara',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  DISETUJUI: {
    label: 'Pembiayaan Disetujui',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  PERLU_REVISI: {
    label: 'Catatan Revisi Bendahara',
    badge: 'bg-rose-100 text-rose-800 border-rose-300',
  },
  BELUM_DIISI: {
    label: 'RPD Belum Diisi',
    badge: 'bg-slate-100 text-slate-600 border-slate-300',
  },
};

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function BendaharaPembiayaanIndex({
  items = [],
  summary = { total: 0, pending: 0, approved: 0, other: 0 },
  filters = { status: 'ALL', search: '' },
}) {
  const [activeStatus, setActiveStatus] = useState(filters.status || 'ALL');
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [processingId, setProcessingId] = useState(null);
  const [revisiTarget, setRevisiTarget] = useState(null);
  const [revisiNote, setRevisiNote] = useState('');
  const [expandedIds, setExpandedIds] = useState({});

  const toggleExpand = (id) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (activeStatus !== 'ALL' && item.pembiayaan_status !== activeStatus) {
        return false;
      }
      if (!q) return true;
      const pegawaiText = (item.pegawai_list || []).map((p) => `${p.nama} ${p.nip}`).join(' ');
      const haystack = [
        item.nomor_nota,
        item.nomor_st,
        item.nomor_spd,
        item.perihal_nota,
        item.tempat_tujuan,
        item.negara_tujuan,
        item.pengusul_name,
        pegawaiText,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [items, activeStatus, searchQuery]);

  const handleApprove = (item) => {
    if (processingId !== null) return;
    router.post(
      route('bendahara.pembiayaan.approve', item.id),
      {},
      {
        preserveScroll: true,
        onStart: () => setProcessingId(item.id),
        onFinish: () => setProcessingId(null),
      }
    );
  };

  const handleSubmitRevisi = (e) => {
    e.preventDefault();
    if (!revisiTarget || !revisiNote.trim() || processingId !== null) return;
    router.post(
      route('bendahara.pembiayaan.revisi', revisiTarget.id),
      { catatan_bendahara: revisiNote.trim() },
      {
        preserveScroll: true,
        onStart: () => setProcessingId(revisiTarget.id),
        onSuccess: () => {
          setRevisiTarget(null);
          setRevisiNote('');
        },
        onFinish: () => setProcessingId(null),
      }
    );
  };

  const statusTabs = [
    { id: 'ALL', label: 'Semua' },
    { id: 'MENUNGGU_PERSETUJUAN', label: 'Menunggu Approval' },
    { id: 'DISETUJUI', label: 'Disetujui' },
    { id: 'PERLU_REVISI', label: 'Catatan Revisi' },
    { id: 'BELUM_DIISI', label: 'RPD Belum Diisi' },
  ];

  const summaryCards = [
    {
      key: 'total',
      label: 'Total Pengajuan Jaldis',
      value: summary.total ?? 0,
      icon: Wallet,
      tone: 'bg-indigo-50 text-indigo-600',
      sub: 'Seluruh surat tugas aktif & terbit',
    },
    {
      key: 'pending',
      label: 'Menunggu Approval',
      value: summary.pending ?? 0,
      icon: Clock,
      tone: 'bg-amber-50 text-amber-600',
      sub: 'RPD & Nominatif siap diperiksa Bendahara',
    },
    {
      key: 'approved',
      label: 'Pembiayaan Disetujui',
      value: summary.approved ?? 0,
      icon: CheckCircle2,
      tone: 'bg-emerald-50 text-emerald-600',
      sub: 'Telah disetujui Bendahara Pengeluaran',
    },
    {
      key: 'other',
      label: 'Revisi / Belum Diisi',
      value: summary.other ?? 0,
      icon: AlertCircle,
      tone: 'bg-slate-100 text-slate-600',
      sub: 'Perlu catatan revisi atau RPD kosong',
    },
  ];

  return (
    <AdminLayout title="Kelola RPD & Daftar Nominatif">
      <Head title="Kelola RPD & Nominatif - E-Jaldis Pusdiklat Kemlu" />

      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-cyan-700">
            <Wallet className="h-4 w-4" />
            <span>Verifikasi Bendahara Pengeluaran</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Monitoring RPD &amp; Daftar Nominatif Biaya
            </h1>
            <InfoTooltip
              label="Petunjuk"
              title="Alur Bendahara Pengeluaran"
              text="Pantau Rincian Biaya Perjalanan Dinas (RPD) per pegawai, cetak Daftar Nominatif, dan berikan persetujuan pembiayaan secara paralel tanpa menghambat alur penyuratan Kapus maupun TU."
            />
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500">{card.label}</p>
                  <p className="mt-1.5 text-3xl font-extrabold text-slate-900">{card.value}</p>
                </div>
                <div className={`rounded-xl p-2.5 ${card.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Filter Tabs & Search */}
      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveStatus(tab.id)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeStatus === tab.id
                  ? 'bg-[#0F2C59] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari perihal, pegawai, nomor ST/SPD..."
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs focus:border-amber-500 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* List */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <Inbox className="mx-auto mb-2 h-8 w-8 text-slate-300" />
          <p className="text-sm font-bold text-slate-700">Belum ada data pembiayaan pada filter ini</p>
          <p className="mt-1 text-xs text-slate-500">Data RPD &amp; Daftar Nominatif yang dikirim Sesparlu akan muncul otomatis di sini.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm divide-y divide-slate-100">
          {filteredItems.map((item) => {
            const meta = PEMBIAYAAN_META[item.pembiayaan_status] || PEMBIAYAAN_META.BELUM_DIISI;
            const isApproved = item.pembiayaan_status === 'DISETUJUI';
            const isProcessing = processingId === item.id;
            const isExpanded = Boolean(expandedIds[item.id]);

            return (
              <div key={item.id} className="transition hover:bg-slate-50/70">
                <div className="flex flex-col gap-2.5 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                  {/* Left: Compact Info */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.badge}`}>
                        {meta.label}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {item.status_label}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {item.nomor_spd ? `SPD: ${item.nomor_spd}` : `Nota: ${item.nomor_nota}`}
                      </span>
                    </div>

                    <h2 className="truncate text-sm font-bold text-slate-900" title={item.perihal_nota}>
                      {item.perihal_nota}
                    </h2>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-amber-500" />
                        {item.tempat_tujuan || '-'}{item.negara_tujuan ? `, ${item.negara_tujuan}` : ''}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {formatDate(item.tanggal_berangkat)} – {formatDate(item.tanggal_kembali)} ({item.durasi_hari || 1} hr)
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleExpand(item.id)}
                        className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700 hover:bg-slate-200 transition"
                      >
                        <Users className="h-3 w-3 text-slate-500" />
                        <span>{item.pegawai_list.length} Pelaksana</span>
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                      {item.catatan_bendahara && (
                        <span className="truncate max-w-xs text-amber-700 font-medium" title={item.catatan_bendahara}>
                          • Catatan: {item.catatan_bendahara}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Total & Compact Inline Actions */}
                  <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
                    <div className="mr-1 text-left lg:text-right">
                      <p className="font-mono text-sm font-extrabold text-slate-900">
                        Rp {formatRupiah(item.total_biaya)}
                      </p>
                      {isApproved && item.approver_name && (
                        <p className="text-[10px] font-medium text-emerald-700">✓ {item.approver_name}</p>
                      )}
                    </div>

                    <Link
                      href={item.cetak_nominatif_url}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#0F2C59] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#1a3e7a] transition"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      <span>Nominatif</span>
                    </Link>

                    <Link
                      href={item.cetak_rpd_all_url}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:border-amber-400 hover:bg-amber-50 transition"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>RPD</span>
                    </Link>

                    <Link
                      href={item.detail_st_url}
                      title="Detail Surat Tugas"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Detail</span>
                    </Link>

                    {!isApproved && (
                      <>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleApprove(item)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-500 disabled:opacity-60 transition"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          <span>{isProcessing ? '...' : 'Setujui'}</span>
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => {
                            setRevisiTarget(item);
                            setRevisiNote(item.catatan_bendahara || '');
                          }}
                          title="Beri catatan revisi pembiayaan"
                          className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-700 hover:bg-rose-100 transition"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Expandable Per-Pegawai RPD Breakdown */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-2">
                    <div className="divide-y divide-slate-200/60">
                      {item.pegawai_list.map((peg) => (
                        <div key={peg.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5 text-xs">
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-800">{peg.nama}</span>
                            {peg.no_rekening && (
                              <span className="ml-2 font-mono text-[11px] text-slate-500">
                                Rek: {peg.no_rekening} {peg.kode_bank ? `(${peg.kode_bank})` : ''}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-emerald-700">
                              Rp {formatRupiah(peg.rpd_total)}
                            </span>
                            <Link
                              href={peg.cetak_rpd_url}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:border-amber-400 hover:bg-amber-50 transition"
                            >
                              <Printer className="h-3 w-3" />
                              <span>RPD</span>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Catatan Revisi Pembiayaan */}
      {revisiTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900">Catatan Revisi Pembiayaan</h3>
            <p className="mt-1 text-xs text-slate-500">
              Catatan ini bersifat paralel (tidak menghentikan alur surat tugas di Kapus/TU).
            </p>
            <form onSubmit={handleSubmitRevisi} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan / Koreksi Biaya *
                </label>
                <textarea
                  rows={4}
                  required
                  value={revisiNote}
                  onChange={(e) => setRevisiNote(e.target.value)}
                  placeholder="Contoh: Sesuaikan tarif uang harian atau lengkapi nomor rekening pegawai..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRevisiTarget(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={processingId !== null}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-60"
                >
                  Kirim Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
