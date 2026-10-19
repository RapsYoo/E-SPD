import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { FileSignature, Menu, X, LogOut } from 'lucide-react';

export default function Navbar({ sidebarOpen, setSidebarOpen }) {
  const { auth } = usePage().props;

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
      default:
        return (
          <span className="bg-indigo-600 text-white text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow">
            Pemohon / Sespalu
          </span>
        );
    }
  };

  return (
    <header className="bg-[#0F2C59] text-white shadow-md border-b border-slate-700/50 flex-shrink-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section: Logo & Mobile Toggle */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
              aria-label="Toggle Menu"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link href="/dashboard" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition transform">
                <FileSignature className="w-6 h-6 text-slate-950 font-bold" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-lg tracking-wide text-white">e-SPD & ST Online</span>
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-500/30">
                    Pusdiklat Kemlu
                  </span>
                </div>
                <p className="text-xs text-slate-300 hidden sm:block">Sistem Surat Tugas & Perjalanan Dinas</p>
              </div>
            </Link>
          </div>

          {/* Right section: Role Badge & Profile */}
          <div className="flex items-center space-x-4">
            {/* User Role Badge */}
            <div className="hidden sm:block">
              {getRoleBadge(auth?.user?.role)}
            </div>

            {/* User Profile & Logout */}
            <div className="flex items-center space-x-3 border-l border-slate-700/80 pl-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-white leading-tight">{auth?.user?.name || 'User'}</p>
                <p className="text-[11px] text-slate-300">{auth?.user?.email || 'user@kemlu.go.id'}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-amber-500/80 flex items-center justify-center text-amber-400 font-bold shadow-inner">
                {(auth?.user?.name || 'U').charAt(0).toUpperCase()}
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
  );
}
