import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
  FileSignature, 
  Plus, 
  Search, 
  Eye, 
  Printer, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  UserCheck, 
  FileText,
  Building,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export default function Index({ suratTugas, filters, userRole }) {
  const [search, setSearch] = useState(filters?.search || '');
  const [selectedStatus, setSelectedStatus] = useState(filters?.status || '');

  const handleSearch = (e) => {
    e.preventDefault();
    router.get('/surat-tugas', { search, status: selectedStatus }, { preserveState: true });
  };

  const getStatusBadge = (status, kapusDecision) => {
    switch (status) {
      case 'SELESAI_TERBIT':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Terbit & TTD
          </span>
        );
      case 'MENUNGGU_PENOMORAN_TU':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
            <Clock className="w-3.5 h-3.5 mr-1" /> Menunggu Penomoran TU
          </span>
        );
      case 'DISPOSISI_KAPUS_REVISI':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertCircle className="w-3.5 h-3.5 mr-1" /> Minta Revisi Kapus
          </span>
        );
      case 'DISPOSISI_KAPUS_STOP':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
            <AlertCircle className="w-3.5 h-3.5 mr-1" /> Dihentikan Kapus
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 mr-1" /> Menunggu Disposisi Kapus
          </span>
        );
    }
  };

  return (
    <AdminLayout title="Daftar Surat Tugas & SPD">
      <Head title="Daftar Surat Tugas & SPD - Pusdiklat Kemlu" />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
            <FileSignature className="w-4 h-4" />
            <span>Dokumen Administrasi Perjalanan Dinas</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">E-Surat Tugas & SPD Online</h1>
          <p className="text-xs text-slate-500">Pengelolaan usulan, disposisi, penomoran resmi, dan penerbitan Surat Tugas Pusdiklat Kemlu</p>
        </div>

        <Link
          href="/surat-tugas/create"
          className="inline-flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-md shadow-amber-500/20 transition text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Surat Tugas Baru</span>
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nomor ST, nomor SPD, nomor nota, atau perihal kegiatan..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              router.get('/surat-tugas', { search, status: e.target.value }, { preserveState: true });
            }}
            className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:ring-amber-500 focus:outline-none"
          >
            <option value="">Semua Status Dokumen</option>
            <option value="MENUNGGU_DISPOSISI_KAPUS">Menunggu Disposisi Kapus</option>
            <option value="MENUNGGU_PENOMORAN_TU">Menunggu Penomoran TU</option>
            <option value="SELESAI_TERBIT">Selesai Terbit & Digital TTD</option>
          </select>

          <button
            type="submit"
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-2 rounded-xl text-sm transition"
          >
            Cari
          </button>
        </form>
      </div>

      {/* Documents Table List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-[#0F2C59] text-white font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Nomor Dokumen</th>
                <th className="py-3.5 px-4">Perihal & Undangan</th>
                <th className="py-3.5 px-4">Tujuan & Tanggal</th>
                <th className="py-3.5 px-4">Personel Pelaksana</th>
                <th className="py-3.5 px-4 text-center">Status WorkFlow</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suratTugas.data && suratTugas.data.length > 0 ? (
                suratTugas.data.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      {st.nomor_st ? (
                        <div className="font-mono font-bold text-slate-900 text-xs">{st.nomor_st}</div>
                      ) : (
                        <div className="text-amber-600 font-medium text-xs italic">[Belum Diisi TU]</div>
                      )}
                      {st.nomor_spd && (
                        <div className="font-mono text-[11px] text-slate-500 mt-0.5">SPD: {st.nomor_spd}</div>
                      )}
                      <div className="text-[10px] text-slate-400 mt-1">
                        Kategori: <strong className="text-slate-600">{st.kategori_perjalanan}</strong>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-slate-900 text-xs line-clamp-2">{st.perihal_nota}</div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Dari: <span className="font-medium text-slate-700">{st.pengirim_nota}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Nota: {st.nomor_nota}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      <div className="flex items-center space-x-1 font-semibold text-slate-800">
                        <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span>{st.tempat_tujuan}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-slate-500 mt-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{st.tanggal_berangkat} s/d {st.tanggal_kembali} ({st.durasi_hari} Hari)</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {st.pegawai_list && st.pegawai_list.length > 0 ? (
                        <div className="space-y-1">
                          {st.pegawai_list.slice(0, 2).map((peg, idx) => (
                            <div key={idx} className="text-xs font-semibold text-slate-800 flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              <span>{peg.nama}</span>
                            </div>
                          ))}
                          {st.pegawai_list.length > 2 && (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                              +{st.pegawai_list.length - 2} Pegawai Lainnya
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Belum ada pegawai</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(st.status, st.kapus_decision)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Link
                          href={`/surat-tugas/${st.id}`}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 transition flex items-center space-x-1 text-xs font-bold"
                          title="Detail / Ruang Kerja Workflow"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden md:inline">Detail</span>
                        </Link>

                        <Link
                          href={`/surat-tugas/${st.id}/cetak`}
                          className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center space-x-1 text-xs font-bold shadow-sm"
                          title="Cetak PDF Dokumen Resmi"
                        >
                          <Printer className="w-4 h-4" />
                          <span className="hidden md:inline">Cetak</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-slate-400 text-sm">
                    Belum ada usulan Surat Tugas / SPD yang dibuat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
