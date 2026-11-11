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
  LogOut,
} from 'lucide-react';

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const { auth } = usePage().props;
  const userRole = auth?.user?.role;
  const isAdmin = userRole === 'admin';
  const permissions = Array.isArray(auth?.permissions) ? auth.permissions : [];

  const can = (moduleKey) => isAdmin || permissions.includes(moduleKey);

  const canSeeSuratGroup = can('surat_tugas.view') || can('surat_tugas.create');
  const canSeeRekapGroup = can('rekapitulasi.view') || can('rekap_pegawai.view');
  const canSeeMasterGroup =
    isAdmin ||
    can('master_pegawai.manage') ||
    can('master_upt.manage') ||
    can('master_referensi.manage');

  const [suratMenuOpen, setSuratMenuOpen] = useState(false);
  const [rekapMenuOpen, setRekapMenuOpen] = useState(false);
  const [masterMenuOpen, setMasterMenuOpen] = useState(false);
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
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 flex-shrink-0 h-full bg-[#0B2247] text-slate-200 shadow-xl transform transition-transform duration-200 ease-in-out lg:translate-x-0 flex flex-col justify-between border-r border-slate-800 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="sidebar-scroll p-4 space-y-6 overflow-y-auto">
          {/* Section Title */}
          <div className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Menu Utama
          </div>

          <nav className="space-y-1">
            {/* Menu Dashboard Utama untuk Semua Aktor */}
            <Link
              href="/dashboard"
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                currentRoute === '/dashboard'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <LayoutDashboard
                className={`w-5 h-5 ${
                  currentRoute === '/dashboard' ? 'text-slate-950' : 'text-amber-400'
                }`}
              />
              <span className="flex-1">Dashboard</span>
            </Link>

            {/* Group 1: Dokumen Jaldis (Dikontrol RBAC surat_tugas.view / surat_tugas.create) */}
            {canSeeSuratGroup && (
              <div>
                <button
                  onClick={() => setSuratMenuOpen(!suratMenuOpen)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white transition"
                >
                  <div className="flex items-center space-x-3">
                    <FileSignature className="w-5 h-5 text-amber-400" />
                    <span>Dokumen Jaldis</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      suratMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {suratMenuOpen && (
                  <div className="mt-1 pl-4 space-y-1 border-l-2 border-slate-700/60 ml-4">
                    {can('surat_tugas.view') && (
                      <Link
                        href="/surat-tugas"
                        className={`flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition ${
                          currentRoute === '/surat-tugas'
                            ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                        <span>Daftar Jaldis</span>
                      </Link>
                    )}

                    {can('surat_tugas.create') && (
                      <Link
                        href="/surat-tugas/create"
                        className={`flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition ${
                          currentRoute === '/surat-tugas/create'
                            ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                      >
                        <PlusCircle className="w-4 h-4 text-emerald-400" />
                        <span>Buat Penugasan</span>
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
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive('/ppk/dpr')
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <FileCheck2
                  className={`w-5 h-5 ${
                    isActive('/ppk/dpr') ? 'text-slate-950' : 'text-amber-400'
                  }`}
                />
                <span className="flex-1">Kelola DPR</span>
              </Link>
            )}

            {/* Group 2: Rekapitulasi (Submenu Rekap Dokumen & Rekap Jaldis Pegawai) */}
            {canSeeRekapGroup && (
              <div>
                <button
                  onClick={() => setRekapMenuOpen(!rekapMenuOpen)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white transition"
                >
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="w-5 h-5 text-amber-400" />
                    <span>Rekapitulasi</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      rekapMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {rekapMenuOpen && (
                  <div className="mt-1 pl-4 space-y-1 border-l-2 border-slate-700/60 ml-4">
                    {can('rekapitulasi.view') && (
                      <Link
                        href="/rekapitulasi"
                        className={`flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition ${
                          isActive('/rekapitulasi')
                            ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                      >
                        <BarChart3 className="w-4 h-4" />
                        <span>Rekap Dokumen Jaldis</span>
                      </Link>
                    )}

                    {can('rekap_pegawai.view') && (
                      <Link
                        href="/rekapitulasi-pegawai"
                        className={`flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition ${
                          isActive('/rekapitulasi-pegawai')
                            ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                      >
                        <PieChart className="w-4 h-4" />
                        <span>Rekap Jaldis Pegawai</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Direktori Pegawai (read-only) — tampil bila modul pegawai_directory.view aktif */}
            {can('pegawai_directory.view') && !can('master_pegawai.manage') && (
              <Link
                href="/pegawai"
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive('/pegawai')
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Users
                  className={`w-5 h-5 ${
                    isActive('/pegawai') ? 'text-slate-950' : 'text-amber-400'
                  }`}
                />
                <span>Data Pegawai</span>
              </Link>
            )}

            {/* Group 3: Master Database (Admin & Role yang Diberi Izin Modul Master) */}
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
                    className={`w-4 h-4 transition-transform duration-200 ${
                      masterMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {masterMenuOpen && (
                  <div className="mt-1 pl-4 space-y-1 border-l-2 border-slate-700/60 ml-4">
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className={`flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition ${
                          currentRoute === '/admin'
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
                        className={`flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition ${
                          isActive('/admin/pegawai')
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
                        className={`flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition ${
                          isActive('/admin/upt-bidang')
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
                        className={`flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition ${
                          isActive('/admin/users')
                            ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>Akun Pengguna</span>
                      </Link>
                    )}

                    {can('master_referensi.manage') && (
                      <Link
                        href="/admin/referensi"
                        className={`flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition ${
                          isActive('/admin/referensi')
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

            {/* Menu Terpisah Khusus Admin: Manajemen Hak Akses (RBAC) */}
            {isAdmin && (
              <div className="pt-1">
                <Link
                  href="/admin/rbac"
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive('/admin/rbac')
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <ShieldCheck
                    className={`w-5 h-5 ${
                      isActive('/admin/rbac') ? 'text-slate-950' : 'text-amber-400'
                    }`}
                  />
                  <span>Hak Akses (RBAC)</span>
                </Link>
              </div>
            )}
          </nav>
        </div>

        {/* Sidebar Footer: User Profile & Logout */}
        <div className="p-3.5 border-t border-slate-800/90 bg-[#081935]">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-amber-500/80 flex items-center justify-center text-amber-400 font-bold text-sm shadow-inner shrink-0">
                {(auth?.user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {auth?.user?.name || 'User'}
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {auth?.user?.email || 'user@kemlu.go.id'}
                </p>
              </div>
            </div>

            <Link
              href={route('logout')}
              method="post"
              as="button"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/90 rounded-lg transition shrink-0"
              title="Keluar dari Sistem"
              aria-label="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
