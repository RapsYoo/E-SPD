import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Menu, X, Bell, Moon, Sun } from 'lucide-react';

export default function Navbar({ sidebarOpen, setSidebarOpen, title, variant, theme, onThemeToggle }) {
  const { auth, notifications } = usePage().props;
  const isAnalytics = variant === 'analytics';
  const [bellOpen, setBellOpen] = useState(false);
  const notifCount = notifications?.count ?? 0;
  const notifItems = notifications?.items ?? [];

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="bg-amber-500 text-slate-950 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow">
            Admin Master
          </span>
        );
      case 'kapus':
        return (
          <span className="bg-purple-600 text-white text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow">
            Kepala Pusdiklat (Kapus)
          </span>
        );
      case 'tu':
        return (
          <span className="bg-blue-600 text-white text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow">
            Tata Usaha (TU)
          </span>
        );
      case 'ppk':
        return (
          <span className="bg-emerald-600 text-white text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow">
            PPK
          </span>
        );
      case 'pegawai':
        return (
          <span className="bg-teal-600 text-white text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow">
            Pegawai
          </span>
        );
      default:
        return (
          <span className="bg-indigo-600 text-white text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow">
            Pemohon / Sesparlu
          </span>
        );
    }
  };

  return (
    <header className={`admin-topbar flex-shrink-0 z-40 bg-[#0F2C59] text-white shadow-md border-b border-slate-700/50 ${isAnalytics ? 'admin-topbar-analytics' : ''}`}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left section: Logo & Mobile Toggle */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`lg:hidden p-2 rounded-lg transition ${isAnalytics ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
              aria-label="Toggle Menu"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link href="/dashboard" className="flex items-center space-x-2.5 group">
              <img
                src="/images/kemlu-logo.webp"
                alt="Logo Kementerian Luar Negeri RI"
                className="h-12 sm:h-[52px] w-auto object-contain drop-shadow-md group-hover:scale-105 transition transform"
              />
              <div>
                <div className="flex items-center">
                  <span className="font-bold text-lg tracking-wide text-white leading-tight">E-Jaldis Pusdiklat Kemlu</span>
                </div>
                <p className="text-xs text-slate-300 hidden sm:block mt-0.5">Sistem Surat Tugas & Perjalanan Dinas</p>
              </div>
            </Link>
          </div>

          {/* Right section: Role Badge & Profile */}
          <div className="admin-topbar-actions flex items-center space-x-4">
            {isAnalytics && (
              <button
                type="button"
                onClick={onThemeToggle}
                className="rounded-lg p-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
                aria-label={theme === 'dark' ? 'Beralih ke tema terang' : 'Beralih ke tema gelap'}
                title={theme === 'dark' ? 'Tema terang' : 'Tema gelap'}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            )}
            {/* Notifikasi */}
            <div className="relative">
              <button
                onClick={() => setBellOpen(!bellOpen)}
                className={`relative p-2 rounded-lg transition ${isAnalytics ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-800' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
                aria-label="Notifikasi"
              >
                <Bell className="w-5 h-5" />
                {notifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                    {notifCount}
                  </span>
                )}
              </button>
              {bellOpen && (
                <div className="admin-notification-popover absolute right-0 mt-2 w-80 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b text-xs font-bold uppercase tracking-wider text-slate-500">
                    Notifikasi ({notifCount})
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y">
                    {notifItems.length === 0 && (
                      <p className="px-4 py-6 text-sm text-center text-slate-400">Tidak ada notifikasi baru.</p>
                    )}
                    {notifItems.map((item) => (
                      <Link
                        key={item.id}
                        href={item.url}
                        onClick={() => setBellOpen(false)}
                        className="block px-4 py-3 hover:bg-amber-50 transition"
                      >
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{item.message}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Role Badge */}
            <div>
              {getRoleBadge(auth?.user?.role)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
