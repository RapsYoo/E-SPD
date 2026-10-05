import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
  UserCheck, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

export default function Index({ ppk, filters }) {
  const [search, setSearch] = useState(filters?.search || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPpk, setEditingPpk] = useState(null);
  const [deleteConfirmPpk, setDeleteConfirmPpk] = useState(null);

  const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
    nama: '',
    nip: '',
    jabatan: '',
    is_active: true,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    router.get('/admin/ppk', { search }, { preserveState: true });
  };

  const openCreateModal = () => {
    setEditingPpk(null);
    clearErrors();
    reset();
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingPpk(item);
    clearErrors();
    setData({
      nama: item.nama || '',
      nip: item.nip || '',
      jabatan: item.jabatan || '',
      is_active: item.is_active ?? true,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingPpk) {
      put(`/admin/ppk/${editingPpk.id}`, {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        },
      });
    } else {
      post('/admin/ppk', {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        },
      });
    }
  };

  const handleDelete = () => {
    if (!deleteConfirmPpk) return;
    destroy(`/admin/ppk/${deleteConfirmPpk.id}`, {
      onSuccess: () => setDeleteConfirmPpk(null),
    });
  };

  return (
    <AdminLayout title="Master Data PPK">
      <Head title="Master Data PPK - e-SPD Pusdiklat Kemlu" />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
            <UserCheck className="w-4 h-4" />
            <span>Master Database</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Master Data PPK</h1>
          <p className="text-xs text-slate-500">Kelola Pejabat Pembuat Komitmen penandatangan Surat Tugas & SPD</p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-md shadow-amber-500/20 transition text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah PPK Baru</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama PPK atau NIP..."
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
                setSearch('');
                router.get('/admin/ppk');
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-xl text-sm transition"
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-[#0F2C59] text-white font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Nama Pejabat PPK</th>
                <th className="py-3.5 px-4">NIP</th>
                <th className="py-3.5 px-4">Jabatan Dalam SPD</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ppk.data && ppk.data.length > 0 ? (
                ppk.data.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 flex items-center space-x-2">
                        <ShieldCheck className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <span>{item.nama}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700 text-xs">{item.nip}</td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium">{item.jabatan || 'Pejabat Pembuat Komitmen'}</td>
                    <td className="py-3.5 px-4 text-center">
                      {item.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                          Non-Aktif
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
                          onClick={() => setDeleteConfirmPpk(item)}
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
                  <td colSpan="5" className="py-8 text-center text-slate-400 text-sm">
                    Tidak ada data PPK ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Links */}
        {ppk.links && ppk.links.length > 3 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Menampilkan {ppk.from || 0} - {ppk.to || 0} dari {ppk.total} PPK
            </div>
            <div className="flex items-center space-x-1">
              {ppk.links.map((link, idx) => {
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
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingPpk ? 'Edit Pejabat PPK' : 'Tambah Pejabat PPK Baru'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingPpk ? 'Perbarui data Pejabat Pembuat Komitmen' : 'Input Pejabat Pembuat Komitmen baru'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar *</label>
                <input
                  type="text"
                  required
                  value={data.nama}
                  onChange={(e) => setData('nama', e.target.value)}
                  placeholder="Bambang Suherman, S.E., M.M."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                {errors.nama && <span className="text-xs text-red-500 mt-1 block">{errors.nama}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">NIP *</label>
                <input
                  type="text"
                  required
                  value={data.nip}
                  onChange={(e) => setData('nip', e.target.value)}
                  placeholder="197503121998031002"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                {errors.nip && <span className="text-xs text-red-500 mt-1 block">{errors.nip}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Jabatan Resmi</label>
                <input
                  type="text"
                  value={data.jabatan}
                  onChange={(e) => setData('jabatan', e.target.value)}
                  placeholder="Pejabat Pembuat Komitmen Pusdiklat Kemlu"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {editingPpk && (
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={data.is_active}
                    onChange={(e) => setData('is_active', e.target.checked)}
                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                  />
                  <label htmlFor="is_active" className="text-xs font-semibold text-slate-700">
                    Status PPK Aktif
                  </label>
                </div>
              )}

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
                  {processing ? 'Menyimpan...' : 'Simpan PPK'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmPpk && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Hapus Data PPK?</h3>
            <p className="text-xs text-slate-500 mb-6">
              Apakah Anda yakin ingin menghapus PPK <strong className="text-slate-900">{deleteConfirmPpk.nama}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setDeleteConfirmPpk(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition shadow-md shadow-red-600/20"
              >
                Ya, Hapus PPK
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
