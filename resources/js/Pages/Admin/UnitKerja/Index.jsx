import React, { useState } from 'react';
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
  ShieldAlert
} from 'lucide-react';

export default function Index({ unitKerja, filters }) {
  const [search, setSearch] = useState(filters?.search || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [deleteConfirmUnit, setDeleteConfirmUnit] = useState(null);

  const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
    kode: '',
    nama: '',
    singkatan: '',
    alamat: '',
    is_active: true,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    router.get('/admin/unit-kerja', { search }, { preserveState: true });
  };

  const openCreateModal = () => {
    setEditingUnit(null);
    clearErrors();
    reset();
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingUnit(item);
    clearErrors();
    setData({
      kode: item.kode || '',
      nama: item.nama || '',
      singkatan: item.singkatan || '',
      alamat: item.alamat || '',
      is_active: item.is_active ?? true,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingUnit) {
      put(`/admin/unit-kerja/${editingUnit.id}`, {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        },
      });
    } else {
      post('/admin/unit-kerja', {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        },
      });
    }
  };

  const handleDelete = () => {
    if (!deleteConfirmUnit) return;
    destroy(`/admin/unit-kerja/${deleteConfirmUnit.id}`, {
      onSuccess: () => setDeleteConfirmUnit(null),
    });
  };

  return (
    <AdminLayout title="Master Unit Kerja">
      <Head title="Master Unit Kerja - e-SPD Pusdiklat Kemlu" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Master Database</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Master Unit Kerja / Satker</h1>
          <p className="text-xs text-slate-500">Kelola unit kerja dan satuan kerja di lingkungan Pusdiklat Kemlu</p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-md shadow-amber-500/20 transition text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Unit Kerja</span>
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode unit, nama unit kerja, atau singkatan..."
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
                router.get('/admin/unit-kerja');
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
                <th className="py-3.5 px-4">Nama Unit Kerja / Satker</th>
                <th className="py-3.5 px-4">Singkatan</th>
                <th className="py-3.5 px-4">Alamat / Keterangan</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {unitKerja.data && unitKerja.data.length > 0 ? (
                unitKerja.data.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-600 text-xs">
                      {item.kode}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{item.nama}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 text-xs">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800 border border-slate-200">
                        {item.singkatan || '-'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">{item.alamat || '-'}</td>
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
                          onClick={() => setDeleteConfirmUnit(item)}
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
                    Tidak ada data unit kerja ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Links */}
        {unitKerja.links && unitKerja.links.length > 3 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Menampilkan {unitKerja.from || 0} - {unitKerja.to || 0} dari {unitKerja.total} unit kerja
            </div>
            <div className="flex items-center space-x-1">
              {unitKerja.links.map((link, idx) => {
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
                  {editingUnit ? 'Edit Unit Kerja' : 'Tambah Unit Kerja Baru'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingUnit ? 'Perbarui data unit kerja / satker' : 'Masukkan rincian unit kerja baru'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Unit *</label>
                  <input
                    type="text"
                    required
                    value={data.kode}
                    onChange={(e) => setData('kode', e.target.value)}
                    placeholder="UK-001"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  {errors.kode && <span className="text-xs text-red-500 mt-1 block">{errors.kode}</span>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Singkatan / Akronim</label>
                  <input
                    type="text"
                    value={data.singkatan}
                    onChange={(e) => setData('singkatan', e.target.value)}
                    placeholder="Subbag KSP"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap Unit Kerja *</label>
                <input
                  type="text"
                  required
                  value={data.nama}
                  onChange={(e) => setData('nama', e.target.value)}
                  placeholder="Subbagian Keuangan, Sarana dan Prasarana"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                {errors.nama && <span className="text-xs text-red-500 mt-1 block">{errors.nama}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat / Lokasi / Keterangan</label>
                <textarea
                  rows="3"
                  value={data.alamat}
                  onChange={(e) => setData('alamat', e.target.value)}
                  placeholder="Gedung Pusdiklat Kemlu, Jl. Sisingamangaraja No. 73, Jakarta Selatan"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                ></textarea>
              </div>

              {editingUnit && (
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={data.is_active}
                    onChange={(e) => setData('is_active', e.target.checked)}
                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                  />
                  <label htmlFor="is_active" className="text-xs font-semibold text-slate-700">
                    Status Unit Kerja Aktif
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
                  {processing ? 'Menyimpan...' : 'Simpan Unit Kerja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteConfirmUnit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Hapus Unit Kerja?</h3>
            <p className="text-xs text-slate-500 mb-6">
              Apakah Anda yakin ingin menghapus unit kerja <strong className="text-slate-900">{deleteConfirmUnit.nama}</strong>?
            </p>

            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setDeleteConfirmUnit(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition shadow-md shadow-red-600/20"
              >
                Ya, Hapus Unit Kerja
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
