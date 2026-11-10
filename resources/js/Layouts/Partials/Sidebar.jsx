import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
  LayoutDashboard,
  Users,
  Building2,
  ChevronDown,
  Database,
  Layers,
  FileSignature,
  PlusCircle,
  FileText,
  FileCheck2,
  KeyRound,
  ShieldCheck,
  BarChart3,
  PieChart,
} from 'lucide-react';

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const { auth, notifications } = usePage().props;
  const notifCount = notifications?.count ?? 0;
  const userRole = auth?.user?.role;
  const isAdmin = userRole === 'admin';
  const permissions = Array.isArray(auth?.permissions) ? auth.permissions : [];

  const can = (moduleKey) => isAdmin || permissions.includes(moduleKey);

  const canSeeSuratGroup = can('surat_tugas.view') || can('surat_tugas.create');
  const canSeeMasterGroup =
    isAdmin ||
    can('master_pegawai.manage') ||
    can('master_upt.manage') ||
    can('master_referensi.manage');

  const [masterMenuOpen, setMasterMenuOpen] = useState(true);
  const [suratMenuOpen, setSuratMenuOpen] = useState(true);
  const currentRoute = window.location.pathname;

  const isActive = (path) =>
    currentRoute === path || (path !== '/' && currentRoute.startsWith(`${path}/`));

  return (
    <>
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 flex-shrink-0 h-full bg-[#0B2247] text-slate-200 shadow-xl transform transition-transform duration-200 ease-in-out lg:translate-x-0 flex flex-col justify-between border-r border-slate-800 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="p-4 space-y-6 overflow-y-auto">
          {/* Section Title */}
          <div className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Menu Utama
          </div>

          <nav className="space-y-1">
            {/* Menu Dashboard Utama untuk Semua Aktor */}
            <Link
              href="/dashboard"
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${currentRoute === '/dashboard'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
            >
              <LayoutDashboard
                className={`w-5 h-5 ${currentRoute === '/dashboard' ? 'text-slate-950' : 'text-amber-400'
                  }`}
              />
              <span className="flex-1">Dashboard</span>
              {notifCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center">
                  {notifCount}
                </span>
              )}
            </Link>

            {/* Group 1: Dokumen ST & SPD (Dikontrol RBAC surat_tugas.view / surat_tugas.create) */}
            {canSeeSuratGroup && (
              <div>
                <button
                  onClick={() => setSuratMenuOpen(!suratMenuOpen)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white transition"
                >
                  <div className="flex items-center space-x-3">
                    <FileSignature className="w-5 h-5 text-amber-400" />
                    <span>Dokumen ST & SPD</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${suratMenuOpen ? 'rotate-180' : ''
                      }`}
                  />
                </button>

                {suratMenuOpen && (
                  <div className="mt-1 pl-4 space-y-1 border-l-2 border-slate-700/60 ml-4">
                    {can('surat_tugas.view') && (
                      <Link
                        href="/surat-tugas"
                        className={`flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition ${currentRoute === '/surat-tugas'
                            ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                          }`}
                      >
                        <FileText className="w-4 h-4" />
                        <span>Daftar ST & SPD</span>
                      </Link>
                    )}

                    {can('surat_tugas.create') && (
                      <Link
                        href="/surat-tugas/create"
                        className={`flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition ${currentRoute === '/surat-tugas/create'
                            ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                          }`}
                      >
                        <PlusCircle className="w-4 h-4 text-emerald-400" />
                        <span>Buat Surat Baru</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Menu Manajemen DPR (Dikontrol RBAC dpr.manage_ppk) */}
            {can('dpr.manage_ppk') && !isAdmin && (
              <Link
                href="/ppk/dpr"
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${isActive('/ppk/dpr')
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
              >
                <FileCheck2
                  className={`w-5 h-5 ${isActive('/ppk/dpr') ? 'text-slate-950' : 'text-amber-400'
                    }`}
                />
                <span className="flex-1">Kelola DPR</span>
              </Link>
            )}

            {/* Menu Rekapitulasi (Dikontrol RBAC rekapitulasi.view) */}
            {can('rekapitulasi.view') && (
              <Link
                href="/rekapitulasi"
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${isActive('/rekapitulasi')
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
              >
                <BarChart3
                  className={`w-5 h-5 ${isActive('/rekapitulasi') ? 'text-slate-950' : 'text-amber-400'
                    }`}
                />
                <span>Rekapitulasi</span>
              </Link>
            )}

            {/* Menu Rekap Jaldis Pegawai (Dikontrol RBAC rekap_pegawai.view) */}
            {can('rekap_pegawai.view') && (
              <Link
                href="/rekapitulasi-pegawai"
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${isActive('/rekapitulasi-pegawai')
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
              >
                <PieChart
                  className={`w-5 h-5 ${isActive('/rekapitulasi-pegawai') ? 'text-slate-950' : 'text-amber-400'
                    }`}
                />
                <span>Rekap Jaldis Pegawai</span>
              </Link>
            )}

            {/* Direktori Pegawai (read-only) — tampil bila modul pegawai_directory.view aktif */}
            {can('pegawai_directory.view') && !can('master_pegawai.manage') && (
              <Link
                href="/pegawai"
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${isActive('/pegawai')
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
              >
                <Users
                  className={`w-5 h-5 ${isActive('/pegawai') ? 'text-slate-950' : 'text-amber-400'
                    }`}
                />
                <span>Data Pegawai</span>
              </Link>
            )}

            {/* Group 2: Master Database (Admin & Role yang Diberi Izin Modul Master) */}
            {canSeeMasterGroup && (
              <div className="pt-2">
                <button
                  onClick={() => setMasterMenuOpen(!masterMenuOpen)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white transition"
                >
                  <div className="flex items-center space-x-3">
                    <Database className="w-5 h-5 text-amber-400" />
                    <span>Master Database</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${masterMenuOpen ? 'rotate-180' : ''
                      }`}
                  />
                </button>

                {masterMenuOpen && (
                  <div className="mt-1 pl-4 space-y-1 border-l-2 border-slate-700/60 ml-4">
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className={`flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition ${currentRoute === '/admin'
                            ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                          }`}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Overview Master</span>
                      </Link>
                    )}

                    {can('master_pegawai.manage') && (
                      <Link
                        href="/admin/pegawai"
                        className={`flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition ${isActive('/admin/pegawai')
                            ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                          }`}
                      >
                        <Users className="w-4 h-4" />
                        <span>Data Pegawai</span>
                      </Link>
                    )}

                    {can('master_upt.manage') && (
                      <Link
                        href="/admin/upt-bidang"
                        className={`flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition ${isActive('/admin/upt-bidang')
                            ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                          }`}
                      >
                        <Building2 className="w-4 h-4" />
                        <span>UPT / Bidang</span>
                      </Link>
                    )}

                    {isAdmin && (
                      <Link
                        href="/admin/users"
                        className={`flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition ${isActive('/admin/users')
                            ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                          }`}
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>Akun Pengguna</span>
                      </Link>
                    )}

                    {isAdmin && (
                      <Link
                        href="/admin/rbac"
                        className={`flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition ${isActive('/admin/rbac')
                            ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                          }`}
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <span>Hak Akses (RBAC)</span>
                      </Link>
                    )}

                    {can('master_referensi.manage') && (
                      <Link
                        href="/admin/referensi"
                        className={`flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition ${isActive('/admin/referensi')
                            ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                          }`}
                      >
                        <Layers className="w-4 h-4" />
                        <span>Biaya & Angkutan</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>

        {/* Footer Info & Versi Aplikasi */}
        <div className="p-4 border-t border-slate-800 bg-[#081935] text-xs text-slate-400 flex flex-col space-y-1">
          <div className="flex items-center justify-between text-slate-300">
            <span className="font-semibold text-amber-400">e-SPD Pusdiklat</span>
            <span className="font-mono text-slate-300">Beta v1.6.1</span>
          </div>
          <p className="text-[11px] text-slate-400">Kementerian Luar Negeri RI</p>
        </div>
      </aside>
    </>
  );
}
