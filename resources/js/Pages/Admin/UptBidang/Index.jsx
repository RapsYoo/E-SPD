import React, { useEffect, useRef, useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
  Building2,
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  Building,
  ShieldAlert,
  Users,
} from 'lucide-react';

export default function Index({ uptBidang, filters }) {
  const searchTimeout = useRef(null);
  const [search, setSearch] = useState(filters?.search || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);

  const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
    kode: '',
    nama: '',
    keterangan: '',
    is_active: true,
  });

  useEffect(() => () => clearTimeout(searchTimeout.current), []);

  const searchUptBidang = (value) => {
    setSearch(value);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      router.get('/admin/upt-bidang', { search: value }, {
        preserveState: true,
        preserveScroll: true,
        replace: true,
      });
    }, 350);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    clearTimeout(searchTimeout.current);
    router.get('/admin/upt-bidang', { search }, { preserveState: true, preserveScroll: true });
  };

  const openCreateModal = () => {
    setEditingItem(null);
    clearErrors();
    reset();
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    clearErrors();
    setData({
      kode: item.kode || '',
      nama: item.nama || '',
      keterangan: item.keterangan || '',
      is_active: Boolean(item.is_active ?? true),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (processing) return;
    if (editingItem) {
      put(`/admin/upt-bidang/${editingItem.id}`, {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        },
      });
    } else {
      post('/admin/upt-bidang', {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        },
      });
    }
  };

  const handleDelete = () => {
    if (!deleteConfirmItem || processing) return;
    destroy(`/admin/upt-bidang/${deleteConfirmItem.id}`, {
      onSuccess: () => setDeleteConfirmItem(null),
    });
  };

  return (
    <AdminLayout title="Master UPT / Bidang">
      <Head title="Master UPT / Bidang - e-SPD Pusdiklat Kemlu" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Master Database</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Master UPT / Bidang</h1>
          <p className="text-xs text-slate-500">Kelola daftar UPT dan Bidang di lingkungan Pusdiklat Kemlu</p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-md shadow-amber-500/20 transition text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah UPT / Bidang</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => searchUptBidang(e.target.value)}
              placeholder="Cari kode, nama UPT/Bidang, atau keterangan..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <button
            type="submit"
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-2 rounded-xl text-sm transition"
          >
            Cari
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                clearTimeout(searchTimeout.current);
                setSearch('');
                router.get('/admin/upt-bidang', {}, { preserveState: true, preserveScroll: true, replace: true });
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-xl text-sm transition"
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-[#0F2C59] text-white font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Kode</th>
                <th className="py-3.5 px-4">Nama UPT / Bidang</th>
                <th className="py-3.5 px-4">Keterangan / Nama Lengkap</th>
                <th className="py-3.5 px-4 text-center">Jumlah Pegawai</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {uptBidang.data && uptBidang.data.length > 0 ? (
                uptBidang.data.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-600 text-xs">
                      {item.kode}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{item.nama}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">{item.keterangan || '-'}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        <Users className="w-3.5 h-3.5 mr-1" />
                        <span>{item.pegawai_count ?? 0} Pegawai</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {item.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                          Tidak Aktif
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 transition"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmItem(item)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-700 hover:text-red-700 transition"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 text-sm">
                    Tidak ada data UPT / Bidang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Links */}
        {uptBidang.links && uptBidang.links.length > 3 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Menampilkan {uptBidang.from || 0} - {uptBidang.to || 0} dari {uptBidang.total} UPT / Bidang
            </div>
            <div className="flex items-center space-x-1">
              {uptBidang.links.map((link, idx) => {
                if (!link.url) {
                  return (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md text-slate-300 pointer-events-none"
                      dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                  );
                }
                return (
                  <button
                    key={idx}
                    onClick={() => router.get(link.url, {}, { preserveState: true })}
                    className={`px-2.5 py-1 rounded-md transition font-medium ${
                      link.active
                        ? 'bg-[#0F2C59] text-white font-bold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative border border-slate-100">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingItem ? 'Edit UPT / Bidang' : 'Tambah UPT / Bidang Baru'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingItem ? 'Perbarui data UPT / Bidang' : 'Masukkan rincian UPT / Bidang baru'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kode *</label>
                  <input
                    type="text"
                    required
                    value={data.kode}
                    onChange={(e) => setData('kode', e.target.value)}
                    placeholder="TU"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  {errors.kode && <span className="text-xs text-red-500 mt-1 block">{errors.kode}</span>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama UPT / Bidang *</label>
                  <input
                    type="text"
                    required
                    value={data.nama}
                    onChange={(e) => setData('nama', e.target.value)}
                    placeholder="TU / UPT Sesdilu"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  {errors.nama && <span className="text-xs text-red-500 mt-1 block">{errors.nama}</span>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan / Nama Lengkap</label>
                <textarea
                  rows="3"
                  value={data.keterangan}
                  onChange={(e) => setData('keterangan', e.target.value)}
                  placeholder="Bagian Tata Usaha / UPT Sekolah Staf Dinas Luar Negeri"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                {errors.keterangan && <span className="text-xs text-red-500 mt-1 block">{errors.keterangan}</span>}
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={Boolean(data.is_active)}
                  onChange={(e) => setData('is_active', e.target.checked)}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="is_active" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Status UPT / Bidang Aktif (Muncul di pilihan dropdown pegawai)
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 transition shadow-md shadow-amber-500/20"
                >
                  {processing ? 'Menyimpan...' : 'Simpan UPT / Bidang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Hapus UPT / Bidang?</h3>
            <p className="text-xs text-slate-500 mb-6">
              Apakah Anda yakin ingin menghapus UPT / Bidang <strong className="text-slate-900">{deleteConfirmItem.nama}</strong>?
              {deleteConfirmItem.pegawai_count > 0 && (
                <span className="block mt-2 text-amber-600 font-semibold">
                  Terdapat {deleteConfirmItem.pegawai_count} pegawai yang saat ini terhubung ke UPT / Bidang ini.
                </span>
              )}
            </p>

            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={processing}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition shadow-md shadow-red-600/20 disabled:opacity-60"
              >
                {processing ? 'Menghapus...' : 'Ya, Hapus Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

