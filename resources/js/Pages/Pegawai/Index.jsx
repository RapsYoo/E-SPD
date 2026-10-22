import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Users, Search, ChevronLeft, ChevronRight, Mail, Phone } from 'lucide-react';

export default function Index({ pegawai, filters }) {
  const [search, setSearch] = useState(filters?.search || '');

  const handleSearch = (e) => {
    e.preventDefault();
    router.get('/pegawai', { search }, { preserveState: true });
  };

  return (
    <AdminLayout title="Data Pegawai">
      <Head title="Data Pegawai - e-SPD Pusdiklat Kemlu" />

      <div className="mb-6">
        <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
          <Users className="w-4 h-4" />
          <span>Direktori</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Data Pegawai</h1>
        <p className="text-xs text-slate-500">Daftar pegawai Pusdiklat Kemlu (hanya lihat).</p>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berdasarkan nama, NIP, atau jabatan..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-2 rounded-xl text-sm transition">
            Cari
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                router.get('/pegawai');
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-xl text-sm transition"
            >
              Reset
            </button>
          )}
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-[#0F2C59] text-white font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Nama / NIP</th>
                <th className="py-3.5 px-4">Pangkat / Golongan</th>
                <th className="py-3.5 px-4">Jabatan</th>
                <th className="py-3.5 px-4">Kontak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pegawai.data && pegawai.data.length > 0 ? (
                pegawai.data.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{item.nama}</div>
                      <div className="text-xs text-slate-500 font-mono">NIP: {item.nip}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{item.pangkat}</div>
                      <div className="text-xs text-slate-500">Golongan {item.golongan}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-medium">{item.jabatan}</div>
                      <div className="text-xs text-slate-400">{item.unit_kerja || 'Pusdiklat Kemlu'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs space-y-0.5">
                      {item.email && (
                        <div className="flex items-center text-slate-600">
                          <Mail className="w-3 h-3 mr-1 text-slate-400" />
                          <span>{item.email}</span>
                        </div>
                      )}
                      {item.no_telepon && (
                        <div className="flex items-center text-slate-600">
                          <Phone className="w-3 h-3 mr-1 text-slate-400" />
                          <span>{item.no_telepon}</span>
                        </div>
                      )}
                      {!item.email && !item.no_telepon && <span className="text-slate-400 italic">-</span>}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-400 text-sm">
                    Tidak ada data pegawai ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pegawai.links && pegawai.links.length > 3 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/60">
            <p className="text-xs text-slate-500">
              Menampilkan {pegawai.from || 0} - {pegawai.to || 0} dari {pegawai.total} pegawai
            </p>
            <div className="flex items-center space-x-1">
              {pegawai.links.map((link, idx) => {
                const isPrev = idx === 0;
                const isNext = idx === pegawai.links.length - 1;
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={!link.url}
                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                    className={`min-w-8 h-8 px-2 rounded-lg text-xs font-semibold transition ${
                      link.active
                        ? 'bg-[#0F2C59] text-white'
                        : link.url
                          ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          : 'text-slate-300 cursor-not-allowed'
                    }`}
                  >
                    {isPrev ? <ChevronLeft className="w-4 h-4 mx-auto" /> : isNext ? <ChevronRight className="w-4 h-4 mx-auto" /> : link.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
