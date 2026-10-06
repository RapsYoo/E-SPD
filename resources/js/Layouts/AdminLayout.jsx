import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Building2, 
  Settings, 
  ChevronDown, 
  Menu, 
  X, 
  LogOut, 
  ShieldCheck, 
  FileText,
  Search,
  Bell,
  Database,
  Layers,
  Sparkles
} from 'lucide-react';

export default function AdminLayout({ children, title }) {
  const { auth, flash } = usePage().props;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [masterMenuOpen, setMasterMenuOpen] = useState(true);
  const currentRoute = window.location.pathname;

  const isActive = (path) => currentRoute === path || currentRoute.startsWith(path + '/');

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      {/* Top Header Navigation */}
      <header className="bg-[#0F2C59] text-white shadow-md border-b border-slate-700/50 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left section: Logo & Mobile Toggle */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <Link href="/admin" className="flex items-center space-x-3 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition transform">
                  <ShieldCheck className="w-6 h-6 text-slate-950 font-bold" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-lg tracking-wide text-white">e-SPD Admin</span>
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-500/30">
                      Pusdiklat Kemlu
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 hidden sm:block">Sistem Surat Tugas & Perjalanan Dinas</p>
                </div>
              </Link>
            </div>

            {/* Right section: Profile & Actions */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center bg-slate-800/80 rounded-lg px-3 py-1.5 border border-slate-700 text-xs text-slate-300">
                <Database className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                <span>Status DB: <strong className="text-emerald-400">Connected</strong></span>
              </div>

              {/* User Dropdown Profile */}
              <div className="flex items-center space-x-3 border-l border-slate-700/80 pl-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-white leading-tight">{auth?.user?.name || 'Administrator'}</p>
                  <p className="text-xs text-amber-400 font-medium">Administrator Master</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-amber-500/80 flex items-center justify-center text-amber-400 font-bold shadow-inner">
                  {(auth?.user?.name || 'A').charAt(0).toUpperCase()}
                </div>
                <Link
                  href={route('logout')}
                  method="post"
                  as="button"
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                  title="Keluar"
                >
                  <LogOut className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Overlay for Mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-[#0B2247] text-slate-200 shadow-xl transform transition-transform duration-200 ease-in-out lg:translate-x-0 flex flex-col justify-between border-r border-slate-800 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 space-y-6 overflow-y-auto">
            {/* Quick Title */}
            <div className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Navigasi Admin
            </div>

            <nav className="space-y-1">
              <Link
                href="/admin"
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                  currentRoute === '/admin'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard Overview</span>
              </Link>

              {/* Group: Master Database */}
              <div className="pt-2">
                <button
                  onClick={() => setMasterMenuOpen(!masterMenuOpen)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white transition"
                >
                  <div className="flex items-center space-x-3">
                    <Database className="w-5 h-5 text-amber-400" />
                    <span>Master Database</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${masterMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {masterMenuOpen && (
                  <div className="mt-1 pl-4 space-y-1 border-l-2 border-slate-700/60 ml-4">
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

                    <Link
                      href="/admin/ppk"
                      className={`flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition ${
                        isActive('/admin/ppk')
                          ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Data PPK</span>
                    </Link>

                    <Link
                      href="/admin/unit-kerja"
                      className={`flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition ${
                        isActive('/admin/unit-kerja')
                          ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                      <span>Unit Kerja</span>
                    </Link>

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
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Footer Info inside Sidebar */}
          <div className="p-4 border-t border-slate-800 bg-[#081935] text-xs text-slate-400 flex flex-col space-y-1">
            <div className="flex items-center justify-between text-slate-300">
              <span className="font-semibold text-amber-400">e-SPD Pusdiklat</span>
              <span>v1.0.0</span>
            </div>
            <p className="text-[11px] text-slate-300">Kementerian Luar Negeri RI</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-6 lg:p-8">
          {/* Flash Messages */}
          {flash?.success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between shadow-sm animate-fade-in">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>{flash.success}</span>
              </div>
            </div>
          )}

          {flash?.error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between shadow-sm animate-fade-in">
              <div className="flex items-center space-x-2">
                <X className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span>{flash.error}</span>
              </div>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
