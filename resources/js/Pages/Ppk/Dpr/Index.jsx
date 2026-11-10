import React, { useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
  FileCheck2,
  Clock,
  CheckCircle2,
  FileText,
  Search,
  Printer,
  Eye,
  MapPin,
  Calendar,
  Download,
  UserCheck,
  Inbox,
  RotateCcw,
  Building2,
} from 'lucide-react';

const STATUS_META = {
  MENUNGGU_PERSETUJUAN: {
    label: 'Menunggu Persetujuan',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    dot: 'bg-amber-500',
  },
  DISETUJUI: {
    label: 'Disetujui PPK',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dot: 'bg-emerald-500',
  },
  DRAFT: {
    label: 'Belum Unggah Bukti',
    badge: 'bg-slate-100 text-slate-600 border-slate-300',
    dot: 'bg-slate-400',
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

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PpkDprIndex({
  dprs = [],
  summary = { total: 0, pending: 0, approved: 0, draft: 0 },
  filters = { status: 'ALL', search: '' },
}) {
  const [activeStatus, setActiveStatus] = useState(filters.status || 'ALL');
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [approvingId, setApprovingId] = useState(null);

  const filteredDprs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return dprs.filter((item) => {
      if (activeStatus !== 'ALL' && item.dpr_status !== activeStatus) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        item.nama,
        item.nip,
        item.unit_kerja,
        item.jabatan,
        item.nomor_st,
        item.nomor_spd,
        item.perihal_nota,
        item.tempat_tujuan,
        item.negara_tujuan,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [dprs, activeStatus, searchQuery]);

  const handleApprove = (dpr) => {
    if (approvingId !== null) return;
    router.post(
      route('ppk.dpr.approve', [dpr.surat_tugas_id, dpr.participant_id]),
      {},
      {
        preserveScroll: true,
        onStart: () => setApprovingId(dpr.participant_id),
        onFinish: () => setApprovingId(null),
      }
    );
  };

  const statusTabs = [
    { id: 'ALL', label: 'Semua', count: summary.total ?? 0 },
    { id: 'MENUNGGU_PERSETUJUAN', label: 'Menunggu Persetujuan', count: summary.pending ?? 0 },
    { id: 'DISETUJUI', label: 'Disetujui', count: summary.approved ?? 0 },
    { id: 'DRAFT', label: 'Belum Mengajukan', count: summary.draft ?? 0 },
  ];

  const summaryCards = [
    {
      key: 'total',
      label: 'Total Peserta Selesai Dinas',
      value: summary.total ?? 0,
      icon: FileCheck2,
      tone: 'bg-indigo-50 text-indigo-600',
      sub: 'Perjalanan dinas selesai di bawah PPK Anda',
    },
    {
      key: 'pending',
      label: 'Menunggu Persetujuan',
      value: summary.pending ?? 0,
      icon: Clock,
      tone: 'bg-amber-50 text-amber-600',
      sub: 'Bukti tiket diunggah & siap diverifikasi',
    },
    {
      key: 'approved',
      label: 'DPR Disetujui',
      value: summary.approved ?? 0,
      icon: CheckCircle2,
      tone: 'bg-emerald-50 text-emerald-600',
      sub: 'Pengeluaran riil telah diverifikasi PPK',
    },
    {
      key: 'draft',
      label: 'Belum Unggah Bukti',
      value: summary.draft ?? 0,
      icon: FileText,
      tone: 'bg-slate-100 text-slate-600',
      sub: 'Menunggu pegawai mengunggah tiket',
    },
  ];

  return (
    <AdminLayout title="Kelola DPR (Daftar Pengeluaran Riil)">
      <Head title="Kelola DPR - e-SPD Pusdiklat Kemlu" />

      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-600">
            <FileCheck2 className="h-4 w-4" />
            <span>Verifikasi Pejabat Pembuat Komitmen (PPK)</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Manajemen Daftar Pengeluaran Riil (DPR)
          </h1>
          <p className="text-xs text-slate-500">
            Periksa bukti tiket perjalanan dinas pegawai, cetak lembar DPR, dan berikan persetujuan PPK.
          </p>
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
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {card.label}
                </span>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{card.value}</div>
              <p className="mt-1 text-[11px] text-slate-400">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2">
            {statusTabs.map((tab) => {
              const isActive = activeStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveStatus(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    isActive
                      ? 'bg-[#0B2247] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                      isActive ? 'bg-amber-400 text-slate-950' : 'bg-white text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-80">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari pegawai, NIP, nomor ST/SPD, tujuan..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            {(activeStatus !== 'ALL' || searchQuery !== '') && (
              <button
                type="button"
                onClick={() => {
                  setActiveStatus('ALL');
                  setSearchQuery('');
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                title="Reset Filter"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* DPR List */}
      {filteredDprs.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Inbox className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Tidak ada data DPR ditemukan</h3>
          <p className="mt-1 text-xs text-slate-500">
            Belum ada peserta perjalanan dinas selesai yang sesuai dengan filter atau pencarian Anda.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDprs.map((dpr) => {
            const statusMeta = STATUS_META[dpr.dpr_status] || STATUS_META.DRAFT;
            const tujuan = [
              dpr.tempat_tujuan,
              dpr.kategori_perjalanan === 'LUAR_NEGERI' ? dpr.negara_tujuan : null,
            ]
              .filter(Boolean)
              .join(', ') || '-';

            return (
              <article
                key={dpr.participant_id}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  {/* Left: Participant & Trip Info */}
                  <div className="min-w-0 flex-1 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${statusMeta.badge}`}
                      >
                        <span className={`h-2 w-2 rounded-full ${statusMeta.dot}`} />
                        {statusMeta.label}
                      </span>

                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700">
                        ST: {dpr.nomor_st || '-'}
                      </span>
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700">
                        SPD: {dpr.nomor_spd || '-'}
                      </span>
                    </div>

                    <div>
                      <h2 className="text-base font-extrabold text-slate-900">{dpr.nama}</h2>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span>NIP: {dpr.nip || '-'}</span>
                        {dpr.jabatan && <span>• {dpr.jabatan}</span>}
                        {dpr.unit_kerja && (
                          <span className="inline-flex items-center gap-1 text-slate-600">
                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                            {dpr.unit_kerja}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-sm font-medium text-slate-800">{dpr.perihal_nota || '-'}</p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                        <MapPin className="h-3.5 w-3.5 text-amber-500" />
                        {dpr.tempat_berangkat ? `${dpr.tempat_berangkat} → ` : ''}
                        {tujuan}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {formatDate(dpr.tanggal_berangkat)} s/d {formatDate(dpr.tanggal_kembali)}
                        {dpr.durasi_hari ? ` (${dpr.durasi_hari} hari)` : ''}
                      </span>
                    </div>

                    {/* Timestamps */}
                    {(dpr.dpr_submitted_at || dpr.dpr_approved_at) && (
                      <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-slate-500">
                        {dpr.dpr_submitted_at && (
                          <span>
                            Diajukan Pegawai:{' '}
                            <strong className="text-slate-700">
                              {formatDateTime(dpr.dpr_submitted_at)}
                            </strong>
                          </span>
                        )}
                        {dpr.dpr_approved_at && (
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <UserCheck className="h-3.5 w-3.5" />
                            Disetujui PPK ({dpr.approver_name || 'PPK'}):{' '}
                            <strong>{formatDateTime(dpr.dpr_approved_at)}</strong>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-end">
                    {dpr.dpr_status === 'MENUNGGU_PERSETUJUAN' && (
                      <button
                        type="button"
                        disabled={approvingId !== null}
                        onClick={() => handleApprove(dpr)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>
                          {approvingId === dpr.participant_id ? 'Memproses...' : 'Setujui DPR'}
                        </span>
                      </button>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={dpr.cetak_url}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 transition hover:bg-amber-100"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>Lembar DPR</span>
                      </Link>

                      <Link
                        href={dpr.detail_st_url}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Detail ST</span>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Tickets / Bukti Pengeluaran Section */}
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Bukti Tiket / Pengeluaran ({dpr.tickets?.length || 0} Berkas)
                  </div>
                  {!dpr.tickets || dpr.tickets.length === 0 ? (
                    <p className="text-xs italic text-slate-400">
                      Pegawai belum mengunggah berkas tiket perjalanan.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {dpr.tickets.map((ticket) => (
                        <a
                          key={ticket.id}
                          href={ticket.download_url}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-amber-400 hover:bg-amber-50/60 hover:text-slate-900"
                        >
                          <FileText className="h-3.5 w-3.5 text-amber-600" />
                          <span className="max-w-[240px] truncate">{ticket.original_name}</span>
                          <Download className="h-3.5 w-3.5 text-slate-400" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}

