import React, { useEffect, useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
  Plus,
  Search,
  Eye,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  MapPin,
  Calendar,
  ArrowRight,
  Trash2,
  ChevronDown,
  MoreHorizontal,
  User,
  UserCheck,
} from 'lucide-react';

export default function Index({ suratTugas, filters, userRole, authUserId }) {
  const searchTimeout = useRef(null);
  const [search, setSearch] = useState(filters?.search || '');
  const [selectedStatus, setSelectedStatus] = useState(filters?.status || '');
  const [deletingId, setDeletingId] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);

  useEffect(() => () => clearTimeout(searchTimeout.current), []);

  // Close kebab menu on outside click
  useEffect(() => {
    if (!openMenu) return;
    const handler = (e) => {
      if (!e.target.closest('[data-kebab-menu]')) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenu]);

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
    if (deletingId) return;
    const identifier = surat.status === 'DRAFT' ? `Draft #${surat.id}` : (surat.nomor_st || `Surat #${surat.id}`);
    if (!window.confirm(`Hapus ${identifier} beserta histori proses dan lampirannya? Tindakan ini tidak dapat dibatalkan.`)) return;

    setDeletingId(surat.id);
    router.delete(`/surat-tugas/${surat.id}`, {
      preserveScroll: true,
      onFinish: () => setDeletingId(null),
    });
  };

  const getPegawaiList = (st) => st.pegawaiList ?? st.pegawai_list ?? st.pegawai_list_data ?? [];

  const getActorPosition = (status) => {
    switch (status) {
      case 'DRAFT':
        return { label: 'Sespalu / Pemohon', role: 'Konseptor', color: 'text-slate-700 bg-slate-100 border-slate-200' };
      case 'MENUNGGU_DISPOSISI_KAPUS':
        return { label: 'Kapus (Kepala Pusat)', role: 'Disposisi Tahap 3', color: 'text-purple-700 bg-purple-50 border-purple-200' };
      case 'DISPOSISI_KAPUS_YA':
        return { label: 'Sespalu / Pemohon', role: 'Draft Personel & SPD', color: 'text-blue-700 bg-blue-50 border-blue-200' };
      case 'DISPOSISI_KAPUS_REVISI':
        return { label: 'Sespalu / Pemohon', role: 'Perlu Revisi Draft ST & SPD', color: 'text-amber-700 bg-amber-50 border-amber-200' };
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <FileText className="w-3.5 h-3.5 mr-1" /> Draft
          </span>
        );
      case 'MENUNGGU_DISPOSISI_KAPUS':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 mr-1" /> Menunggu Kapus
          </span>
        );
      case 'DISPOSISI_KAPUS_YA':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Disetujui Kapus
          </span>
        );
      case 'SELESAI_TERBIT':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Selesai Terbit
          </span>
        );
      case 'MENUNGGU_PENOMORAN_TU':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
            <Clock className="w-3.5 h-3.5 mr-1" /> Menunggu TU
          </span>
        );
      case 'DISPOSISI_KAPUS_REVISI':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-300">
            <AlertCircle className="w-3.5 h-3.5 mr-1" /> Minta Revisi
          </span>
        );
      case 'DISPOSISI_KAPUS_STOP':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
            <AlertCircle className="w-3.5 h-3.5 mr-1" /> Dihentikan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 mr-1" /> Menunggu Proses
          </span>
        );
    }
  };

  const isPrintable = (st) =>
    st.status === 'SELESAI_TERBIT' ||
    (st.status === 'MENUNGGU_PENOMORAN_TU' && ['tu', 'admin', 'kapus', 'ppk'].includes(userRole));

  return (
    <AdminLayout title="Daftar Surat Tugas & SPD">
      <Head title="Daftar Surat Tugas & SPD - Pusdiklat Kemlu" />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">E-Surat Tugas & SPD Online</h1>
        <p className="text-xs text-slate-500 mt-0.5">Pengelolaan Surat Tugas & SPD Pusdiklat Kemlu</p>
      </div>

      {/* Search & Filter Bar (inline, no card wrapper) */}
      <form onSubmit={handleSearch} className="flex items-center gap-2 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => searchSuratTugas(e.target.value)}
            placeholder="Cari nomor ST, nomor nota, perihal..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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
          className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:ring-amber-500 focus:outline-none"
        >
          <option value="">Semua Status</option>
          <option value="DRAFT">Draft Saya</option>
          <option value="MENUNGGU_DISPOSISI_KAPUS">Menunggu Kapus</option>
          <option value="MENUNGGU_PENOMORAN_TU">Menunggu TU</option>
          <option value="SELESAI_TERBIT">Selesai Terbit</option>
        </select>

        <button
          type="submit"
          className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-lg text-sm transition"
        >
          Cari
        </button>

        {(userRole === 'pemohon' || userRole === 'sespalu' || userRole === 'admin') && (
          <Link
            href="/surat-tugas/create"
            className="inline-flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-4 py-2 rounded-lg shadow-sm shadow-amber-500/20 transition text-sm ml-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Surat Tugas Baru</span>
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[12px] font-semibold text-slate-500 uppercase tracking-[0.05em]">
              <tr>
                <th className="py-3 px-4 w-8"></th>
                <th className="py-3 px-4">Perihal</th>
                <th className="py-3 px-4">Tujuan & Tanggal</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suratTugas.data && suratTugas.data.length > 0 ? (
                suratTugas.data.map((st) => {
                  const isExpanded = expandedRow === st.id;
                  const pegawaiList = getPegawaiList(st);
                  const actor = getActorPosition(st.status);

                  return (
                    <React.Fragment key={st.id}>
                      <tr className="hover:bg-slate-50/60 transition">
                        {/* Chevron toggle */}
                        <td className="py-3 px-4 w-8">
                          <button
                            type="button"
                            onClick={() => setExpandedRow(isExpanded ? null : st.id)}
                            className="text-slate-400 hover:text-slate-700 transition"
                            aria-label={isExpanded ? 'Tutup detail' : 'Buka detail'}
                          >
                            <ChevronDown
                              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            />
                          </button>
                        </td>

                        {/* Perihal */}
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-medium text-sm text-slate-900 line-clamp-2">
                            {st.status === 'DRAFT' ? (st.draft_data?.perihal_nota || 'Draft belum lengkap') : st.perihal_nota}
                          </div>
                        </td>

                        {/* Tujuan & Tanggal */}
                        <td className="py-3 px-4 text-xs">
                          <div className="flex items-center space-x-1 font-semibold text-slate-800">
                            <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                            <span>{st.status === 'DRAFT' ? (st.draft_data?.tempat_tujuan || 'Belum diisi') : st.tempat_tujuan}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-slate-500 mt-1 tabular-nums">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>
                              {st.status === 'DRAFT'
                                ? `${st.draft_data?.tanggal_berangkat || '-'} s/d ${st.draft_data?.tanggal_kembali || '-'}`
                                : `${st.tanggal_berangkat} s/d ${st.tanggal_kembali} (${st.durasi_hari} Hari)`}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center">
                          {getStatusBadge(st.status)}
                        </td>

                        {/* Aksi */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5" data-kebab-menu>
                            {st.status === 'DRAFT' ? (
                              <>
                                {(userRole === 'admin' || st.user_id === authUserId) && (
                                  <Link
                                    href={`/surat-tugas/${st.id}/draft`}
                                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition"
                                    title="Lanjutkan draft"
                                  >
                                    <ArrowRight className="w-3.5 h-3.5" />
                                    <span>Lanjutkan</span>
                                  </Link>
                                )}
                                {userRole === 'admin' && (
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(st)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold transition"
                                    title="Hapus surat tugas"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Hapus</span>
                                  </button>
                                )}
                                {/* Kebab menu for DRAFT */}
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => setOpenMenu(openMenu === st.id ? null : st.id)}
                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                                    title="Opsi lainnya"
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                                  {openMenu === st.id && (
                                    <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1">
                                      <Link
                                        href={`/surat-tugas/${st.id}`}
                                        className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 w-full"
                                        onClick={() => setOpenMenu(null)}
                                      >
                                        <Eye className="w-3.5 h-3.5" /> Detail
                                      </Link>
                                    </div>
                                  )}
                                </div>
                              </>
                            ) : (
                              <>
                                <Link
                                  href={`/surat-tugas/${st.id}`}
                                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                                  title="Detail / Ruang Kerja Workflow"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Detail</span>
                                </Link>
                                {userRole === 'admin' && (
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(st)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold transition"
                                    title="Hapus surat tugas"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Hapus</span>
                                  </button>
                                )}
                                {/* Kebab menu for non-DRAFT */}
                                <div className="relative" data-kebab-menu>
                                  <button
                                    type="button"
                                    onClick={() => setOpenMenu(openMenu === st.id ? null : st.id)}
                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                                    title="Opsi lainnya"
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                                  {openMenu === st.id && (
                                    <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1">
                                      {isPrintable(st) && (
                                        <Link
                                          href={`/surat-tugas/${st.id}/cetak`}
                                          className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 w-full"
                                          onClick={() => setOpenMenu(null)}
                                        >
                                          <Printer className="w-3.5 h-3.5" />
                                          {st.status === 'SELESAI_TERBIT' ? 'Cetak Surat' : 'Pratinjau'}
                                        </Link>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable detail row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={5} className="px-6 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
                              {/* Nomor Dokumen */}
                              <div>
                                <div className="font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nomor Dokumen</div>
                                {st.status === 'DRAFT' ? (
                                  <div className="font-mono font-bold text-slate-700">Draft #{st.id}</div>
                                ) : st.nomor_st ? (
                                  <div className="font-mono font-bold text-slate-900">{st.nomor_st}</div>
                                ) : (
                                  <div className="text-amber-600 font-medium italic">[Belum Diisi TU]</div>
                                )}
                                {st.nomor_spd && (
                                  <div className="font-mono text-slate-500 mt-0.5">SPD: {st.nomor_spd}</div>
                                )}
                                <div className="text-slate-400 mt-1">
                                  Kategori: <strong className="text-slate-600">{st.status === 'DRAFT' ? (st.draft_data?.kategori_perjalanan || 'Belum dipilih') : st.kategori_perjalanan}</strong>
                                </div>
                              </div>

                              {/* Asal Surat */}
                              <div>
                                <div className="font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Asal Surat</div>
                                <div className="text-slate-800 font-medium">
                                  {st.status === 'DRAFT' ? (st.draft_data?.pengirim_nota || 'Belum diisi') : (st.pengirim_nota || '—')}
                                </div>
                                <div className="font-mono text-slate-500 mt-0.5">
                                  {st.status === 'DRAFT' ? (st.draft_data?.nomor_nota || 'Belum diisi') : (st.nomor_nota || '—')}
                                </div>
                              </div>

                              {/* Diajukan oleh */}
                              <div>
                                <div className="font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Diajukan Oleh</div>
                                <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                                  <User className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                                  <span>{st.user?.name || 'Sistem'}</span>
                                </div>
                                <div className="text-slate-500 mt-0.5 uppercase font-bold text-[10px] bg-slate-200 inline-block px-1.5 py-0.5 rounded">
                                  {st.user?.role || 'user'}
                                </div>
                              </div>

                              {/* Posisi Workflow */}
                              <div>
                                <div className="font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Posisi Workflow</div>
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${actor.color}`}>
                                  <UserCheck className="w-3 h-3" />
                                  {actor.label}
                                </span>
                                <div className="text-slate-400 mt-1">{actor.role}</div>
                              </div>

                              {/* Personel Pelaksana */}
                              <div>
                                <div className="font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Personel Pelaksana</div>
                                {pegawaiList && pegawaiList.length > 0 ? (
                                  <div className="space-y-1">
                                    {pegawaiList.map((peg, idx) => (
                                      <div key={peg.id || peg.nip || idx} className="text-slate-800 font-medium flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"></span>
                                        {peg.nama}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400 text-sm">
                    Belum ada usulan Surat Tugas / SPD yang dibuat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {suratTugas.links && suratTugas.links.length > 3 && (
        <div className="flex items-center justify-center gap-1 mt-4 flex-wrap">
          {suratTugas.links.map((link, idx) => (
            link.url ? (
              <Link
                key={idx}
                href={link.url}
                preserveScroll
                preserveState
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                  link.active
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
                dangerouslySetInnerHTML={{ __html: link.label }}
              />
            ) : (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 border border-slate-100 cursor-default"
                dangerouslySetInnerHTML={{ __html: link.label }}
              />
            )
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
