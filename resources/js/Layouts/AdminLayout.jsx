import React, { useState } from 'react';
import Navbar from './Partials/Navbar';
import Sidebar from './Partials/Sidebar';
import FlashMessage from './Partials/FlashMessage';

export default function AdminLayout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen bg-slate-50 font-sans text-slate-800 flex flex-col overflow-hidden">
      {/* Top Header / Navigation Bar */}
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Menu & App Version */}
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-6 lg:p-8">
          {/* Flash Alert Messages */}
          <FlashMessage />

          {/* Page Contents */}
          {children}
        </main>
      </div>
    </div>
  );
}
