import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
  FileSignature, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Users,
  Globe,
  MapPin,
  ChevronRight,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

export default function Dashboard({ totalSurat, statusStats, kategoriStats, recentSurat, needsAction, userRole, userName }) {
  // Hitung persentase kategori
  const totalKategori = (kategoriStats.DALAM_NEGERI || 0) + (kategoriStats.LUAR_NEGERI || 0);
  const persenDalamNegeri = totalKategori > 0 ? Math.round((kategoriStats.DALAM_NEGERI || 0) / totalKategori * 100) : 0;
  const persenLuarNegeri = totalKategori > 0 ? Math.round((kategoriStats.LUAR_NEGERI || 0) / totalKategori * 100) : 0;

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

  return (
    <AdminLayout title="Dashboard e-SPD">
      <Head title="Dashboard - e-SPD Pusdiklat Kemlu" />

      {/* Welcome Section */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Selamat datang, {userName}!
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Dashboard monitoring Surat Tugas & Perjalanan Dinas Pusdiklat Kementerian Luar Negeri
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Surat */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider">Total Surat Tugas</p>
              <p className="text-4xl font-extrabold mt-2">{totalSurat}</p>
            </div>
            <FileSignature className="w-12 h-12 text-blue-200 opacity-80" />
          </div>
        </div>

        {/* Menunggu Disposisi Kapus */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-xs font-semibold uppercase tracking-wider">Menunggu Kapus</p>
              <p className="text-4xl font-extrabold mt-2">{statusStats.MENUNGGU_DISPOSISI_KAPUS || 0}</p>
            </div>
            <Clock className="w-12 h-12 text-amber-200 opacity-80" />
          </div>
        </div>

        {/* Menunggu TU */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-xs font-semibold uppercase tracking-wider">Menunggu TU</p>
              <p className="text-4xl font-extrabold mt-2">{statusStats.MENUNGGU_PENOMORAN_TU || 0}</p>
            </div>
            <AlertCircle className="w-12 h-12 text-purple-200 opacity-80" />
          </div>
        </div>

        {/* Selesai Terbit */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Selesai Terbit</p>
              <p className="text-4xl font-extrabold mt-2">{statusStats.SELESAI_TERBIT || 0}</p>
            </div>
            <CheckCircle2 className="w-12 h-12 text-emerald-200 opacity-80" />
          </div>
        </div>
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
                <p className="text-xs text-slate-500">{kategoriStats.DALAM_NEGERI || 0} surat</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-amber-500"></div>
                <span className="text-sm font-semibold text-slate-900">Luar Negeri</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-extrabold text-amber-600">{persenLuarNegeri}%</p>
                <p className="text-xs text-slate-500">{kategoriStats.LUAR_NEGERI || 0} surat</p>
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
          </div>

          <div className="space-y-3">
            {Object.entries(statusStats).map(([status, count]) => {
              const percentage = totalSurat > 0 ? Math.round((count / totalSurat) * 100) : 0;
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

      {/* Action Needed & Recent Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
            <div className="space-y-2">
              {needsAction.map((surat) => (
                <Link
                  key={surat.id}
                  href={`/surat-tugas/${surat.id}`}
                  className="block p-3 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50 transition group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{surat.perihal_nota}</p>
                      <p className="text-xs text-slate-500 mt-0.5">#{surat.id} • {surat.user?.name || 'N/A'}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Surat Terbaru */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <FileSignature className="w-5 h-5 text-blue-500" />
              <span>Surat Terbaru</span>
            </h2>
          </div>

          {recentSurat.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <FileSignature className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Belum ada surat tugas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentSurat.map((surat) => (
                <Link
                  key={surat.id}
                  href={`/surat-tugas/${surat.id}`}
                  className="block p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{surat.perihal_nota}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">#{surat.id}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-semibold text-blue-600">{statusLabels[surat.status] || surat.status}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition" />
                  </div>
                </Link>
              ))}
            </div>
          )}

          <Link
            href="/surat-tugas"
            className="mt-4 block text-center text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
          >
            Lihat Semua Surat →
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
