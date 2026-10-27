import React, { useEffect, useRef, useState } from 'react';
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
  ChevronRight,
  Trash2,
  User
} from 'lucide-react';

export default function Index({ suratTugas, filters, userRole, authUserId }) {
  const searchTimeout = useRef(null);
  const [search, setSearch] = useState(filters?.search || '');
  const [selectedStatus, setSelectedStatus] = useState(filters?.status || '');

  useEffect(() => () => clearTimeout(searchTimeout.current), []);

  const searchSuratTugas = (value) => {
    setSearch(value);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      router.get('/surat-tugas', { search: value, status: selectedStatus }, {
        preserveState: true,
        preserveScroll: true,
        replace: true,
      });
    }, 350);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    clearTimeout(searchTimeout.current);
    router.get('/surat-tugas', { search, status: selectedStatus }, { preserveState: true, preserveScroll: true });
  };

  const handleDelete = (surat) => {
    const identifier = surat.status === 'DRAFT' ? `Draft #${surat.id}` : (surat.nomor_st || `Surat #${surat.id}`);
    if (!window.confirm(`Hapus ${identifier} beserta histori proses dan lampirannya? Tindakan ini tidak dapat dibatalkan.`)) return;

    router.delete(`/surat-tugas/${surat.id}`, { preserveScroll: true });
  };

  const getPegawaiList = (st) => st.pegawaiList ?? st.pegawai_list ?? st.pegawai_list_data ?? [];

  const getActorPosition = (status) => {
    switch (status) {
      case 'DRAFT':
        return { label: 'Sespalu / Pemohon', role: 'Konseptor', color: 'text-slate-700 bg-slate-100 border-slate-200' };
      case 'MENUNGGU_DISPOSISI_KAPUS':
        return { label: 'Kapus (Kepala Pusat)', role: 'Disposisi', color: 'text-purple-700 bg-purple-50 border-purple-200' };
      case 'DISPOSISI_KAPUS_YA':
        return { label: 'Sespalu / Pemohon', role: 'Draft Personel & SPD', color: 'text-blue-700 bg-blue-50 border-blue-200' };
      case 'DISPOSISI_KAPUS_REVISI':
        return { label: 'Sespalu / Pemohon', role: 'Perlu Revisi Nota', color: 'text-amber-700 bg-amber-50 border-amber-200' };
      case 'DISPOSISI_KAPUS_STOP':
        return { label: 'Selesai (Stop)', role: 'Dihentikan', color: 'text-red-700 bg-red-50 border-red-200' };
      case 'MENUNGGU_PENOMORAN_TU':
        return { label: 'Tata Usaha (TU)', role: 'Penomoran', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
      case 'SELESAI_TERBIT':
        return { label: 'PPK / Terbit Resmi', role: 'Selesai', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
      default:
        return { label: 'Sistem', role: '-', color: 'text-slate-600 bg-slate-100 border-slate-200' };
    }
  };

  const getStatusBadge = (status, kapusDecision) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <FileText className="w-3.5 h-3.5 mr-1" /> Draft Sespalu
          </span>
        );
      case 'MENUNGGU_DISPOSISI_KAPUS':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 mr-1" /> Nota Masuk Kapus - Menunggu Persetujuan
          </span>
        );
      case 'DISPOSISI_KAPUS_YA':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Disetujui Kapus - Draft Sespalu
          </span>
        );
      case 'SELESAI_TERBIT':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Selesai Diterbitkan TU
          </span>
        );
      case 'MENUNGGU_PENOMORAN_TU':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
            <Clock className="w-3.5 h-3.5 mr-1" /> Menunggu Verifikasi & Nomor TU
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
            <Clock className="w-3.5 h-3.5 mr-1" /> Nota Masuk Kapus - Menunggu Persetujuan
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

        {(userRole === 'pemohon' || userRole === 'sespalu' || userRole === 'admin') && (
          <Link
            href="/surat-tugas/create"
            className="inline-flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-md shadow-amber-500/20 transition text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Surat Tugas Baru</span>
          </Link>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => searchSuratTugas(e.target.value)}
              placeholder="Cari nomor ST, nomor SPD, nomor nota, atau perihal kegiatan..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => {
              clearTimeout(searchTimeout.current);
              setSelectedStatus(e.target.value);
              router.get('/surat-tugas', { search, status: e.target.value }, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
              });
            }}
            className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:ring-amber-500 focus:outline-none"
          >
            <option value="">Semua Status Dokumen</option>
            <option value="DRAFT">Draft Saya</option>
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
                      {st.status === 'DRAFT' ? (
                        <div className="font-mono font-bold text-slate-700 text-xs">Draft #{st.id}</div>
                      ) : st.nomor_st ? (
                        <div className="font-mono font-bold text-slate-900 text-xs">{st.nomor_st}</div>
                      ) : (
                        <div className="text-amber-600 font-medium text-xs italic">[Belum Diisi TU]</div>
                      )}
                      {st.nomor_spd && (
                        <div className="font-mono text-[11px] text-slate-500 mt-0.5">SPD: {st.nomor_spd}</div>
                      )}
                      <div className="text-[10px] text-slate-400 mt-1">
                        Kategori: <strong className="text-slate-600">{st.status === 'DRAFT' ? (st.draft_data?.kategori_perjalanan || 'Belum dipilih') : st.kategori_perjalanan}</strong>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-slate-900 text-xs line-clamp-2">{st.status === 'DRAFT' ? (st.draft_data?.perihal_nota || 'Draft belum lengkap') : st.perihal_nota}</div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Dari: <span className="font-medium text-slate-700">{st.status === 'DRAFT' ? (st.draft_data?.pengirim_nota || 'Belum diisi') : st.pengirim_nota}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Nota: {st.status === 'DRAFT' ? (st.draft_data?.nomor_nota || 'Belum diisi') : st.nomor_nota}
                      </div>
                      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-700 bg-slate-100 border border-slate-200/80 rounded-md px-2 py-0.5">
                          <User className="w-3 h-3 text-indigo-600" />
                          <span>Diajukan: <strong>{st.user?.name || 'Sistem'}</strong></span>
                          <span className="text-[9px] bg-white text-slate-500 px-1 rounded uppercase font-bold">({st.user?.role || 'user'})</span>
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      <div className="flex items-center space-x-1 font-semibold text-slate-800">
                        <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span>{st.status === 'DRAFT' ? (st.draft_data?.tempat_tujuan || 'Belum diisi') : st.tempat_tujuan}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-slate-500 mt-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{st.status === 'DRAFT'
                          ? `${st.draft_data?.tanggal_berangkat || '-'} s/d ${st.draft_data?.tanggal_kembali || '-'}`
                          : `${st.tanggal_berangkat} s/d ${st.tanggal_kembali} (${st.durasi_hari} Hari)`}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {(() => {
                        const list = getPegawaiList(st);
                        return list && list.length > 0 ? (
                        <div className="space-y-1">
                          {list.slice(0, 2).map((peg, idx) => (
                            <div key={peg.id || peg.nip || idx} className="text-xs font-semibold text-slate-800 flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              <span>{peg.nama}</span>
                            </div>
                          ))}
                          {list.length > 2 && (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                              +{list.length - 2} Pegawai Lainnya
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Belum ada pegawai</span>
                      );
                      })()}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div>{getStatusBadge(st.status, st.kapus_decision)}</div>
                      {(() => {
                        const actor = getActorPosition(st.status);
                        return (
                          <div className="mt-2 flex items-center justify-center">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${actor.color}`}>
                              <UserCheck className="w-3 h-3" />
                              <span>Posisi: {actor.label}</span>
                            </span>
                          </div>
                        );
                      })()}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {st.status === 'DRAFT' ? (
                          <>
                            <Link
                              href={`/surat-tugas/${st.id}`}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 transition flex items-center space-x-1 text-xs font-bold"
                              title="Detail / Ruang Kerja Workflow"
                            >
                              <Eye className="w-4 h-4" />
                              <span className="hidden md:inline">Detail</span>
                            </Link>
                            {(userRole === 'admin' || st.user_id === authUserId) && (
                              <Link
                                href={`/surat-tugas/${st.id}/draft`}
                                className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center space-x-1 text-xs font-bold"
                                title="Lanjutkan draft surat"
                              >
                                <ArrowRight className="w-4 h-4" />
                                <span>Lanjutkan</span>
                              </Link>
                            )}
                          </>
                        ) : (
                          <>
                            <Link
                              href={`/surat-tugas/${st.id}`}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 transition flex items-center space-x-1 text-xs font-bold"
                              title="Detail / Ruang Kerja Workflow"
                            >
                              <Eye className="w-4 h-4" />
                              <span className="hidden md:inline">Detail</span>
                            </Link>

                            {['MENUNGGU_PENOMORAN_TU', 'SELESAI_TERBIT'].includes(st.status) && (userRole === 'tu' || userRole === 'admin') && (
                              <Link
                                href={`/surat-tugas/${st.id}/cetak`}
                                className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center space-x-1 text-xs font-bold shadow-sm"
                                title={st.status === 'SELESAI_TERBIT' ? 'Cetak PDF Dokumen Resmi' : 'Pratinjau dokumen sebelum diterbitkan'}
                              >
                                <Printer className="w-4 h-4" />
                                <span className="hidden md:inline">{st.status === 'SELESAI_TERBIT' ? 'Cetak' : 'Pratinjau'}</span>
                              </Link>
                            )}
                          </>
                        )}
                        {userRole === 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleDelete(st)}
                            className="inline-flex items-center justify-center rounded-lg bg-rose-100 p-1.5 text-rose-700 transition hover:bg-rose-200"
                            title="Hapus histori proses surat"
                            aria-label={`Hapus ${st.status === 'DRAFT' ? `draft ${st.id}` : (st.nomor_st || `surat ${st.id}`)}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
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
