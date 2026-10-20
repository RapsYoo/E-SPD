import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
  FileSignature, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  AlertTriangle,
  Users,
  Globe,
  MapPin,
  ChevronRight,
  BarChart3,
  PieChart,
  Activity,
  Printer,
  Calendar,
  CalendarDays,
  Plane,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Sparkles,
  History,
  User,
  PenTool
} from 'lucide-react';

export default function Dashboard({ 
  totalSurat = 0, 
  statusStats = {}, 
  kategoriStats = {}, 
  scopeStats = null,
  recentSurat = [], 
  needsAction = [], 
  onDutyToday = [], 
  upcomingTrips = [], 
  urgentPending = [], 
  recentActivities = [],
  userRole = 'pemohon', 
  userName = 'User',
  authUserId = null 
}) {
  const [activeDutyTab, setActiveDutyTab] = useState('onDuty'); // 'onDuty' | 'upcoming'

  // Persona Scope State: 'personal' (Usulan Saya) vs 'global' (Seluruh Pusdiklat)
  const defaultScope = (userRole === 'pemohon' || userRole === 'sespalu') ? 'personal' : 'global';
  const [statsScope, setStatsScope] = useState(defaultScope);

  // Dinamis berdasarkan Persona Scope Toggle
  const activeTotalSurat = scopeStats?.[statsScope]?.totalSurat ?? totalSurat;
  const activeStatusStats = scopeStats?.[statsScope]?.statusStats ?? statusStats;
  const activeKategoriStats = scopeStats?.[statsScope]?.kategoriStats ?? kategoriStats;

  // Hitung persentase kategori
  const totalKategori = (activeKategoriStats.DALAM_NEGERI || 0) + (activeKategoriStats.LUAR_NEGERI || 0);
  const persenDalamNegeri = totalKategori > 0 ? Math.round((activeKategoriStats.DALAM_NEGERI || 0) / totalKategori * 100) : 0;
  const persenLuarNegeri = totalKategori > 0 ? Math.round((activeKategoriStats.LUAR_NEGERI || 0) / totalKategori * 100) : 0;

  // Status workflow labels
  const statusLabels = {
    DRAFT: 'Draft Sespalu',
    MENUNGGU_DISPOSISI_KAPUS: 'Menunggu Kapus',
    DISPOSISI_KAPUS_YA: 'Disetujui Kapus',
    DISPOSISI_KAPUS_REVISI: 'Revisi Sespalu',
    DISPOSISI_KAPUS_STOP: 'Dihentikan',
    MENUNGGU_PENOMORAN_TU: 'Menunggu TU',
    SELESAI_TERBIT: 'Selesai Terbit',
  };

  const roleActionLabels = {
    kapus: 'Menunggu Disposisi Kapus',
    tu: 'Menunggu Penomoran Resmi TU',
    ppk: 'Menunggu TTD Digital PPK',
    pemohon: 'Perlu Tindak Lanjut Pemohon',
    sespalu: 'Perlu Tindak Lanjut Sespalu',
    admin: 'Surat Menunggu Tindakan',
  };

  // Helper format tanggal
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatDateRange = (startStr, endStr) => {
    if (!startStr) return '-';
    if (!endStr || startStr === endStr) return formatDate(startStr);
    try {
      const start = new Date(startStr);
      const end = new Date(endStr);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return `${startStr} s/d ${endStr}`;

      if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
        return `${start.getDate()} - ${end.getDate()} ${end.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}`;
      }
      return `${formatDate(startStr)} - ${formatDate(endStr)}`;
    } catch {
      return `${startStr} s/d ${endStr}`;
    }
  };

  // Helper waktu relatif (time ago)
  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const now = new Date();
    const past = new Date(dateStr);
    const diffSec = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffSec < 60) return 'Baru saja';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} mnt lalu`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} jam lalu`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay === 1) return 'Kemarin';
    if (diffDay < 7) return `${diffDay} hr lalu`;
    return past.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  // Helper meta label aksi log
  const getActionMeta = (aksi) => {
    switch (aksi) {
      case 'KIRIM_KE_KAPUS':
        return { label: 'Usulan Dikirim', badge: 'bg-blue-100 text-blue-800 border-blue-200', dot: 'bg-blue-500' };
      case 'DISPOSISI_YA':
        return { label: 'Disetujui Kapus', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' };
      case 'DISPOSISI_REVISI':
        return { label: 'Revisi Kapus', badge: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500' };
      case 'DISPOSISI_STOP':
        return { label: 'Dihentikan Kapus', badge: 'bg-rose-100 text-rose-800 border-rose-200', dot: 'bg-rose-500' };
      case 'PENOMORAN':
        return { label: 'Nomor Diterbitkan', badge: 'bg-purple-100 text-purple-800 border-purple-200', dot: 'bg-purple-500' };
      case 'TTD_PPK':
        return { label: 'TTD Digital PPK', badge: 'bg-indigo-100 text-indigo-800 border-indigo-200', dot: 'bg-indigo-500' };
      case 'CETAK':
        return { label: 'Dicetak', badge: 'bg-slate-100 text-slate-800 border-slate-200', dot: 'bg-slate-500' };
      case 'HAPUS':
        return { label: 'Diarsipkan', badge: 'bg-rose-100 text-rose-800 border-rose-200', dot: 'bg-rose-500' };
      default:
        return { label: aksi, badge: 'bg-slate-100 text-slate-800 border-slate-200', dot: 'bg-slate-400' };
    }
  };

  // Helper hitung mundur urgensi keberangkatan
  const getUrgencyBadge = (targetDate) => {
    if (!targetDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { 
        text: `Terlewat ${Math.abs(diffDays)} hari`, 
        className: 'bg-rose-100 text-rose-800 border-rose-300' 
      };
    }
    if (diffDays === 0) {
      return { 
        text: 'Berangkat Hari Ini', 
        className: 'bg-rose-600 text-white font-bold animate-pulse' 
      };
    }
    if (diffDays === 1) {
      return { 
        text: 'Berangkat Besok', 
        className: 'bg-amber-500 text-white font-bold' 
      };
    }
    return { 
      text: `H-${diffDays} Keberangkatan`, 
      className: 'bg-amber-100 text-amber-900 border-amber-300 font-semibold' 
    };
  };

  // Helper cek izin cetak
  const canPrintSurat = (surat) => {
    const isOwner = surat.user_id === authUserId;
    const allowedRole = ['tu', 'admin', 'kapus', 'ppk'].includes(userRole) || isOwner;
    const allowedStatus = ['MENUNGGU_PENOMORAN_TU', 'SELESAI_TERBIT'].includes(surat.status);
    return allowedRole && allowedStatus;
  };

  return (
    <AdminLayout title="Dashboard e-SPD">
      <Head title="Dashboard - e-SPD Pusdiklat Kemlu" />

      {/* Welcome Section */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Selamat datang, {userName}!
            </h1>
            <span className="text-xs font-bold uppercase tracking-wider bg-slate-200/80 text-slate-700 px-2.5 py-0.5 rounded-md">
              {userRole}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Dashboard monitoring Surat Tugas & Perjalanan Dinas Pusdiklat Kementerian Luar Negeri
          </p>
        </div>

        {/* Action Controls: Persona Toggle & Buat Usulan (Sejajar di sebelah kanan) */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-shrink-0">
          {/* Persona Toggle */}
          <div className="inline-flex p-1 bg-white rounded-xl border border-slate-200 shadow-xs">
            <button
              onClick={() => setStatsScope('personal')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                statsScope === 'personal'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilkan statistik khusus usulan milik Anda"
            >
              <User className="w-3.5 h-3.5" />
              <span>Usulan Saya</span>
            </button>

            <button
              onClick={() => setStatsScope('global')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                statsScope === 'global'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilkan statistik seluruh Pusdiklat"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Seluruh Pusdiklat</span>
            </button>
          </div>

          {(userRole === 'pemohon' || userRole === 'sespalu' || userRole === 'admin') && (
            <Link
              href="/surat-tugas/create"
              className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-4 py-2 rounded-xl shadow-md transition transform hover:-translate-y-0.5 text-xs sm:text-sm whitespace-nowrap"
            >
              <span>+ Buat Usulan</span>
            </Link>
          )}
        </div>
      </div>

      {/* Alert Peringatan: Keberangkatan Mendesak / Urgent Pending Trips */}
      {urgentPending && urgentPending.length > 0 && (
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border-2 border-amber-300/80 p-5 shadow-sm">
          <div className="flex items-start space-x-3.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900">
                  Radar Urgensi: {urgentPending.length} Usulan Dinas Mepet (Berangkat ≤ 3 Hari)
                </h3>
                <span className="bg-rose-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                  Perlu Percepatan
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Surat tugas berikut mendekati tanggal pelaksanaan namun belum tuntas proses penerbitannya. Mohon segera ditindaklanjuti agar administrasi tiket & perbekalan tidak terhambat.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {urgentPending.map((surat) => {
              const urgency = getUrgencyBadge(surat.tanggal_berangkat);
              const tujuan = surat.kategori_perjalanan === 'LUAR_NEGERI'
                ? (surat.negara_tujuan || surat.tempat_tujuan || 'Luar Negeri')
                : (surat.tempat_tujuan || 'Dalam Negeri');

              return (
                <div 
                  key={surat.id}
                  className="bg-white rounded-xl p-3.5 border border-amber-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      {urgency && (
                        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md border ${urgency.className}`}>
                          {urgency.text}
                        </span>
                      )}
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        #{surat.id}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1 mb-1">
                      {surat.perihal_nota}
                    </h4>

                    <div className="flex items-center space-x-1.5 text-xs text-slate-600 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      <span className="truncate font-medium">{tujuan}</span>
                      <span className="text-slate-300">•</span>
                      <span>{formatDate(surat.tanggal_berangkat)}</span>
                    </div>

                    <div className="text-[11px] text-slate-500">
                      Pengusul: <span className="font-semibold text-slate-700">{surat.user?.name || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      {statusLabels[surat.status] || surat.status}
                    </span>

                    <Link
                      href={`/surat-tugas/${surat.id}`}
                      className="inline-flex items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-700 group"
                    >
                      <span>Aksi</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Scope Indicator Note */}
      <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Statistik Aktif: <strong>{statsScope === 'personal' ? 'Usulan Anda Sendiri' : 'Seluruh Surat Pusdiklat'}</strong></span>
        </span>
        <span className="text-[11px] text-slate-400">Dapat diganti kapan saja melalui tombol di atas</span>
      </div>

      {/* Stats Cards (Reactive to Persona Scope) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Surat */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider">
                {statsScope === 'personal' ? 'Usulan Saya' : 'Total Surat Tugas'}
              </p>
              <p className="text-4xl font-extrabold mt-2">{activeTotalSurat}</p>
            </div>
            <FileSignature className="w-12 h-12 text-blue-200 opacity-80" />
          </div>
        </div>

        {/* Menunggu Disposisi Kapus */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-xs font-semibold uppercase tracking-wider">Menunggu Kapus</p>
              <p className="text-4xl font-extrabold mt-2">{activeStatusStats.MENUNGGU_DISPOSISI_KAPUS || 0}</p>
            </div>
            <Clock className="w-12 h-12 text-amber-200 opacity-80" />
          </div>
        </div>

        {/* Menunggu TU */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-xs font-semibold uppercase tracking-wider">Menunggu TU</p>
              <p className="text-4xl font-extrabold mt-2">{activeStatusStats.MENUNGGU_PENOMORAN_TU || 0}</p>
            </div>
            <AlertCircle className="w-12 h-12 text-purple-200 opacity-80" />
          </div>
        </div>

        {/* Selesai Terbit */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Selesai Terbit</p>
              <p className="text-4xl font-extrabold mt-2">{activeStatusStats.SELESAI_TERBIT || 0}</p>
            </div>
            <CheckCircle2 className="w-12 h-12 text-emerald-200 opacity-80" />
          </div>
        </div>
      </div>

      {/* Monitoring Penugasan Pegawai (Sedang Dinas Hari Ini & Keberangkatan Mendatang H-7) */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Plane className="w-4 h-4" />
              <span>Monitoring Penugasan Dinas</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Keberadaan Pegawai & Agenda Perjalanan Pusdiklat
            </h2>
            <p className="text-xs text-slate-500">
              Pantau staf yang saat ini aktif berdinas di luar kantor atau yang dijadwalkan segera berangkat.
            </p>
          </div>

          {/* Toggle Tabs */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl self-start sm:self-auto border border-slate-200">
            <button
              onClick={() => setActiveDutyTab('onDuty')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeDutyTab === 'onDuty'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="relative flex h-2 w-2">
                {onDutyToday.length > 0 && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${onDutyToday.length > 0 ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
              </span>
              <span>Sedang Dinas Hari Ini ({onDutyToday.length})</span>
            </button>

            <button
              onClick={() => setActiveDutyTab('upcoming')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeDutyTab === 'upcoming'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Jadwal H-7 Ke Depan ({upcomingTrips.length})</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Sedang Dinas Hari Ini */}
        {activeDutyTab === 'onDuty' && (
          <div className="mt-5">
            {onDutyToday.length === 0 ? (
              <div className="text-center py-10 bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2 opacity-80" />
                <p className="text-sm font-bold text-slate-800">Tidak ada dinas aktif di luar kantor hari ini</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Semua pegawai Pusdiklat saat ini tercatat berada di kantor atau belum ada surat tugas terbit yang bertanggal hari ini.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {onDutyToday.map((surat) => {
                  const pegawai = surat.pegawai_list || surat.pegawaiList || [];
                  const tujuan = surat.kategori_perjalanan === 'LUAR_NEGERI'
                    ? (surat.negara_tujuan || surat.tempat_tujuan || 'Luar Negeri')
                    : (surat.tempat_tujuan || 'Dalam Negeri');

                  return (
                    <div 
                      key={surat.id}
                      className="bg-slate-50/70 hover:bg-slate-50 rounded-xl p-4 border border-slate-200/90 flex flex-col justify-between transition group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Sedang Berjalan</span>
                          </span>

                          <span className="text-[11px] font-mono text-slate-500">
                            {surat.nomor_st || `#${surat.id}`}
                          </span>
                        </div>

                        <div className="flex items-start space-x-2 mb-2">
                          {surat.kategori_perjalanan === 'LUAR_NEGERI' ? (
                            <Globe className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          ) : (
                            <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          )}
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                            {tujuan}
                          </h4>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                          {surat.perihal_nota}
                        </p>

                        <div className="bg-white rounded-lg p-2.5 border border-slate-200/80 mb-3 text-xs space-y-1.5">
                          <div className="flex items-center justify-between text-slate-500 text-[11px]">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Periode Tugas:
                            </span>
                            <span className="font-semibold text-slate-800">
                              {formatDateRange(surat.tanggal_berangkat, surat.tanggal_kembali)}
                            </span>
                          </div>

                          <div className="pt-1.5 border-t border-slate-100">
                            <span className="text-[11px] text-slate-500 block mb-1">
                              Pelaksana ({pegawai.length} orang):
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {pegawai.slice(0, 3).map((p, idx) => (
                                <span 
                                  key={p.id || idx}
                                  className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded truncate max-w-[140px]"
                                  title={p.nama}
                                >
                                  {p.nama}
                                </span>
                              ))}
                              {pegawai.length > 3 && (
                                <span className="text-[10px] font-semibold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                                  +{pegawai.length - 3} lainnya
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                        <Link
                          href={`/surat-tugas/${surat.id}`}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                        >
                          <span>Rincian</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>

                        {canPrintSurat(surat) && (
                          <Link
                            href={`/surat-tugas/${surat.id}/cetak`}
                            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs transition"
                            title="Cetak Lembar Surat Tugas & SPD"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-600" />
                            <span>Cetak ST</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Jadwal Keberangkatan Mendatang H-7 */}
        {activeDutyTab === 'upcoming' && (
          <div className="mt-5">
            {upcomingTrips.length === 0 ? (
              <div className="text-center py-10 bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
                <CalendarDays className="w-10 h-10 mx-auto text-blue-400 mb-2 opacity-80" />
                <p className="text-sm font-bold text-slate-800">Belum ada keberangkatan resmi dalam 7 hari ke depan</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Semua surat tugas resmi dengan tanggal keberangkatan dalam 7 hari ke depan akan otomatis dirangkum di sini.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingTrips.map((surat) => {
                  const urgency = getUrgencyBadge(surat.tanggal_berangkat);
                  const pegawai = surat.pegawai_list || surat.pegawaiList || [];
                  const tujuan = surat.kategori_perjalanan === 'LUAR_NEGERI'
                    ? (surat.negara_tujuan || surat.tempat_tujuan || 'Luar Negeri')
                    : (surat.tempat_tujuan || 'Dalam Negeri');

                  return (
                    <div 
                      key={surat.id}
                      className="bg-slate-50/70 hover:bg-slate-50 rounded-xl p-4 border border-slate-200/90 flex flex-col justify-between transition group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          {urgency && (
                            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md border ${urgency.className}`}>
                              {urgency.text}
                            </span>
                          )}
                          <span className="text-[11px] font-mono text-slate-500">
                            {surat.nomor_st || `#${surat.id}`}
                          </span>
                        </div>

                        <div className="flex items-start space-x-2 mb-2">
                          <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                            {tujuan}
                          </h4>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                          {surat.perihal_nota}
                        </p>

                        <div className="bg-white rounded-lg p-2.5 border border-slate-200/80 mb-3 text-xs space-y-1.5">
                          <div className="flex items-center justify-between text-slate-500 text-[11px]">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Berangkat:
                            </span>
                            <span className="font-semibold text-slate-800">
                              {formatDate(surat.tanggal_berangkat)}
                            </span>
                          </div>

                          <div className="pt-1.5 border-t border-slate-100">
                            <span className="text-[11px] text-slate-500 block mb-1">
                              Pelaksana ({pegawai.length} orang):
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {pegawai.slice(0, 3).map((p, idx) => (
                                <span 
                                  key={p.id || idx}
                                  className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded truncate max-w-[140px]"
                                  title={p.nama}
                                >
                                  {p.nama}
                                </span>
                              ))}
                              {pegawai.length > 3 && (
                                <span className="text-[10px] font-semibold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                                  +{pegawai.length - 3} lainnya
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                        <Link
                          href={`/surat-tugas/${surat.id}`}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                        >
                          <span>Rincian</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>

                        {canPrintSurat(surat) && (
                          <Link
                            href={`/surat-tugas/${surat.id}/cetak`}
                            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs transition"
                            title="Cetak Lembar Surat Tugas & SPD"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-600" />
                            <span>Cetak ST</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Grid: Charts & Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Diagram Persentase Kategori Perjalanan */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-amber-500" />
              <span>Kategori Perjalanan</span>
            </h2>
            <span className="text-[11px] font-semibold text-slate-400">
              {statsScope === 'personal' ? 'Pribadi' : 'Organisasi'}
            </span>
          </div>

          {/* Pie Chart (Pure CSS) */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                {/* Background circle */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#e2e8f0" strokeWidth="20" />
                
                {/* Dalam Negeri segment */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill="transparent" 
                  stroke="#3b82f6" 
                  strokeWidth="20"
                  strokeDasharray={`${persenDalamNegeri * 2.51} ${251 - persenDalamNegeri * 2.51}`}
                  className="transition-all duration-500"
                />
                
                {/* Luar Negeri segment */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill="transparent" 
                  stroke="#f59e0b" 
                  strokeWidth="20"
                  strokeDasharray={`${persenLuarNegeri * 2.51} ${251 - persenLuarNegeri * 2.51}`}
                  strokeDashoffset={`-${persenDalamNegeri * 2.51}`}
                  className="transition-all duration-500"
                />
              </svg>
              
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-extrabold text-slate-900">{totalKategori}</p>
                <p className="text-xs text-slate-500 font-semibold">Total</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                <span className="text-sm font-semibold text-slate-900">Dalam Negeri</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-extrabold text-blue-600">{persenDalamNegeri}%</p>
                <p className="text-xs text-slate-500">{activeKategoriStats.DALAM_NEGERI || 0} surat</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-amber-500"></div>
                <span className="text-sm font-semibold text-slate-900">Luar Negeri</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-extrabold text-amber-600">{persenLuarNegeri}%</p>
                <p className="text-xs text-slate-500">{activeKategoriStats.LUAR_NEGERI || 0} surat</p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistik Status Workflow */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-amber-500" />
              <span>Status Workflow</span>
            </h2>
            <span className="text-[11px] font-semibold text-slate-400">
              {statsScope === 'personal' ? 'Khusus Usulan Saya' : 'Seluruh Dokumen Pusdiklat'}
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(activeStatusStats).map(([status, count]) => {
              const percentage = activeTotalSurat > 0 ? Math.round((count / activeTotalSurat) * 100) : 0;
              const colors = {
                DRAFT: 'bg-slate-500',
                MENUNGGU_DISPOSISI_KAPUS: 'bg-amber-500',
                DISPOSISI_KAPUS_YA: 'bg-green-500',
                DISPOSISI_KAPUS_REVISI: 'bg-orange-500',
                DISPOSISI_KAPUS_STOP: 'bg-red-500',
                MENUNGGU_PENOMORAN_TU: 'bg-purple-500',
                SELESAI_TERBIT: 'bg-emerald-500',
              };

              return (
                <div key={status} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{statusLabels[status] || status}</span>
                    <span className="font-bold text-slate-900">{count} ({percentage}%)</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${colors[status] || 'bg-slate-400'} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two Column Section: Action Needed & Recent Letters vs Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Kolom Kiri: Action Needed & Recent Tables */}
        <div className="space-y-8">
          {/* Surat yang Perlu Aksi */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Activity className="w-5 h-5 text-red-500" />
                <span>{roleActionLabels[userRole] || 'Perlu Tindakan'}</span>
              </h2>
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">
                {needsAction.length}
              </span>
            </div>

            {needsAction.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Tidak ada surat yang memerlukan tindakan saat ini</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {needsAction.map((surat) => {
                  const tujuan = surat.kategori_perjalanan === 'LUAR_NEGERI'
                    ? (surat.negara_tujuan || surat.tempat_tujuan || 'Luar Negeri')
                    : (surat.tempat_tujuan || 'Dalam Negeri');

                  return (
                    <Link
                      key={surat.id}
                      href={`/surat-tugas/${surat.id}`}
                      className="block p-3 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/60 transition group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[11px] font-mono text-slate-500">#{surat.id}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[11px] font-semibold text-slate-600 truncate">
                              {surat.user?.name || 'Pengusul'}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-slate-900 truncate group-hover:text-amber-800 transition">
                            {surat.perihal_nota}
                          </p>
                          
                          {(surat.tempat_tujuan || surat.negara_tujuan || surat.tanggal_berangkat) && (
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                              <span className="flex items-center gap-1 font-medium text-slate-600">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                {tujuan}
                              </span>
                              {surat.tanggal_berangkat && (
                                <>
                                  <span>•</span>
                                  <span>Tgl: {formatDate(surat.tanggal_berangkat)}</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition flex-shrink-0" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Surat Terbaru (dengan Quick Print 1-Click) */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <FileSignature className="w-5 h-5 text-blue-500" />
                <span>Surat Terbaru</span>
              </h2>
              <Link
                href="/surat-tugas"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
              >
                Lihat Semua →
              </Link>
            </div>

            {recentSurat.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <FileSignature className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Belum ada surat tugas</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentSurat.map((surat) => {
                  const tujuan = surat.kategori_perjalanan === 'LUAR_NEGERI'
                    ? (surat.negara_tujuan || surat.tempat_tujuan || 'Luar Negeri')
                    : (surat.tempat_tujuan || 'Dalam Negeri');

                  const printable = canPrintSurat(surat);

                  return (
                    <div
                      key={surat.id}
                      className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition flex items-center justify-between gap-3 group"
                    >
                      <Link
                        href={`/surat-tugas/${surat.id}`}
                        className="flex-1 min-w-0"
                      >
                        <p className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition">
                          {surat.perihal_nota}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-1 text-xs">
                          <span className="text-slate-500">#{surat.id}</span>
                          <span className="text-slate-300">•</span>
                          <span className="font-semibold text-blue-600">{statusLabels[surat.status] || surat.status}</span>
                          
                          {(surat.tempat_tujuan || surat.negara_tujuan) && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-500 truncate">{tujuan}</span>
                            </>
                          )}
                        </div>
                      </Link>

                      <div className="flex items-center space-x-1.5 flex-shrink-0">
                        {printable && (
                          <Link
                            href={`/surat-tugas/${surat.id}/cetak`}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition"
                            title="Cetak Cepat ST / SPD"
                          >
                            <Printer className="w-4 h-4" />
                          </Link>
                        )}

                        <Link
                          href={`/surat-tugas/${surat.id}`}
                          className="p-1.5 rounded-lg text-slate-400 group-hover:text-blue-600 transition"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Activity Feed / Log Jejak Audit Terkini */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <History className="w-5 h-5 text-indigo-500" />
                <span>Aktivitas Workflow Terkini</span>
              </h2>
              <span className="text-xs text-slate-400 font-medium">Log Sistem Real-Time</span>
            </div>

            {recentActivities.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Belum ada riwayat aktivitas workflow</p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {recentActivities.map((log) => {
                  const meta = getActionMeta(log.aksi);

                  return (
                    <div key={log.id} className="relative group">
                      {/* Timeline Dot */}
                      <span className={`absolute -left-[27px] top-1.5 w-3 h-3 rounded-full border-2 border-white ${meta.dot} shadow-2xs`}></span>

                      <div className="bg-slate-50/70 hover:bg-slate-50 p-3 rounded-xl border border-slate-200/80 transition">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-900">
                              {log.user?.name || 'Sistem'}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.badge}`}>
                              {meta.label}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium flex-shrink-0">
                            {timeAgo(log.created_at)}
                          </span>
                        </div>

                        {log.surat_tugas && (
                          <Link
                            href={`/surat-tugas/${log.surat_tugas_id}`}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 line-clamp-1 group-hover:underline block"
                          >
                            #{log.surat_tugas_id} • {log.surat_tugas.perihal_nota || 'Surat Tugas'}
                          </Link>
                        )}

                        {log.catatan && (
                          <p className="text-xs text-slate-600 mt-1 italic bg-white p-2 rounded-lg border border-slate-200/60">
                            "{log.catatan}"
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Mencatat setiap proses disposisi, penomoran, & TTD</span>
            <Link
              href="/surat-tugas"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Buka Semua Usulan →
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
