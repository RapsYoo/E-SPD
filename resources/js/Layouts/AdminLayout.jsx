import React, { useState } from 'react';
import Navbar from './Partials/Navbar';
import Sidebar from './Partials/Sidebar';
import FlashMessage from './Partials/FlashMessage';

export default function AdminLayout({ children, title, variant, theme, onThemeToggle }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAnalytics = variant === 'analytics';

  return (
    <div className={`admin-shell h-screen bg-slate-50 font-sans text-slate-800 flex flex-col overflow-hidden ${isAnalytics ? 'admin-shell-analytics' : ''}`}>
      {/* Top Header / Navigation Bar */}
      <Navbar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        title={title}
        variant={variant}
        theme={theme}
        onThemeToggle={onThemeToggle}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Menu & User Account Footer */}
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Main Content Area + Bottom Footerbar (Scrollable together so footer appears at the bottom of the page) */}
        <div className={`admin-shell-content flex-1 overflow-y-auto bg-slate-100 flex flex-col ${isAnalytics ? 'admin-shell-content-analytics' : ''}`}>
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {/* Flash Alert Messages */}
            <FlashMessage />

            {/* Page Contents */}
            {children}
          </main>

          {/* Footerbar Copyright & System Version */}
          <footer className="mt-auto bg-white border-t border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              &copy; {new Date().getFullYear()} <strong className="font-semibold text-slate-700">E-Jaldis Pusdiklat Kemlu</strong> &mdash; Pusat Pendidikan dan Pelatihan Kementerian Luar Negeri RI. Hak Cipta Dilindungi.
            </div>
            <div className="flex items-center space-x-2 text-[11px]">
              <span className="text-slate-400">Versi Sistem</span>
              <span className="font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md">
                Beta v1.6.1
              </span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
