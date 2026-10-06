import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
  Layers, 
  Truck, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  ShieldAlert,
  Coins
} from 'lucide-react';

export default function Index({ tingkatBiaya, jenisAngkutan }) {
  // Tingkat Biaya States
  const [isTingkatModalOpen, setIsTingkatModalOpen] = useState(false);
  const [editingTingkat, setEditingTingkat] = useState(null);
  const [deleteConfirmTingkat, setDeleteConfirmTingkat] = useState(null);

  // Jenis Angkutan States
  const [isAngkutanModalOpen, setIsAngkutanModalOpen] = useState(false);
  const [editingAngkutan, setEditingAngkutan] = useState(null);
  const [deleteConfirmAngkutan, setDeleteConfirmAngkutan] = useState(null);

  // Forms
  const tingkatForm = useForm({
    kode: '',
    nama: '',
    keterangan: '',
    is_active: true,
  });

  const angkutanForm = useForm({
    kode: '',
    nama: '',
    keterangan: '',
    is_active: true,
  });

  // Tingkat Handlers
  const openCreateTingkatModal = () => {
    setEditingTingkat(null);
    tingkatForm.clearErrors();
    tingkatForm.reset();
    setIsTingkatModalOpen(true);
  };

  const openEditTingkatModal = (item) => {
    setEditingTingkat(item);
    tingkatForm.clearErrors();
    tingkatForm.setData({
      kode: item.kode || '',
      nama: item.nama || '',
      keterangan: item.keterangan || '',
      is_active: item.is_active ?? true,
    });
    setIsTingkatModalOpen(true);
  };

  const handleTingkatSubmit = (e) => {
    e.preventDefault();
    if (editingTingkat) {
      tingkatForm.put(`/admin/referensi/tingkat-biaya/${editingTingkat.id}`, {
        onSuccess: () => {
          setIsTingkatModalOpen(false);
          tingkatForm.reset();
        },
      });
    } else {
      tingkatForm.post('/admin/referensi/tingkat-biaya', {
        onSuccess: () => {
          setIsTingkatModalOpen(false);
          tingkatForm.reset();
        },
      });
    }
  };

  const handleTingkatDelete = () => {
    if (!deleteConfirmTingkat) return;
    router.delete(`/admin/referensi/tingkat-biaya/${deleteConfirmTingkat.id}`, {
      onSuccess: () => setDeleteConfirmTingkat(null),
    });
  };

  // Angkutan Handlers
  const openCreateAngkutanModal = () => {
    setEditingAngkutan(null);
    angkutanForm.clearErrors();
    angkutanForm.reset();
    setIsAngkutanModalOpen(true);
  };

  const openEditAngkutanModal = (item) => {
    setEditingAngkutan(item);
    angkutanForm.clearErrors();
    angkutanForm.setData({
      kode: item.kode || '',
      nama: item.nama || '',
      keterangan: item.keterangan || '',
      is_active: item.is_active ?? true,
    });
    setIsAngkutanModalOpen(true);
  };

  const handleAngkutanSubmit = (e) => {
    e.preventDefault();
    if (editingAngkutan) {
      angkutanForm.put(`/admin/referensi/jenis-angkutan/${editingAngkutan.id}`, {
        onSuccess: () => {
          setIsAngkutanModalOpen(false);
          angkutanForm.reset();
        },
      });
    } else {
      angkutanForm.post('/admin/referensi/jenis-angkutan', {
        onSuccess: () => {
          setIsAngkutanModalOpen(false);
          angkutanForm.reset();
        },
      });
    }
  };

  const handleAngkutanDelete = () => {
    if (!deleteConfirmAngkutan) return;
    router.delete(`/admin/referensi/jenis-angkutan/${deleteConfirmAngkutan.id}`, {
      onSuccess: () => setDeleteConfirmAngkutan(null),
    });
  };

  return (
    <AdminLayout title="Referensi Biaya & Angkutan">
      <Head title="Referensi Biaya & Angkutan - e-SPD Pusdiklat Kemlu" />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
          <Layers className="w-4 h-4" />
          <span>Master Database</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Referensi Tingkat Biaya & Jenis Angkutan</h1>
        <p className="text-xs text-slate-500">Kelola standar tingkat biaya perjalanan dinas dan jenis moda transportasi</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section 1: Tingkat Biaya */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-base">Tingkat Biaya Perjalanan</h2>
                  <p className="text-xs text-slate-500">Kategori / Tingkatan Biaya SPD (A, B, C, dll.)</p>
                </div>
              </div>

              <button
                onClick={openCreateTingkatModal}
                className="inline-flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Kode</th>
                    <th className="py-3 px-3">Tingkat / Kategori</th>
                    <th className="py-3 px-3">Keterangan</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tingkatBiaya && tingkatBiaya.length > 0 ? (
                    tingkatBiaya.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3 font-mono font-bold text-amber-600">{item.kode}</td>
                        <td className="py-3 px-3 font-semibold text-slate-900">{item.nama}</td>
                        <td className="py-3 px-3 text-slate-500">{item.keterangan || '-'}</td>
                        <td className="py-3 px-3 text-center">
                          {item.is_active ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Aktif
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                              Non-aktif
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => openEditTingkatModal(item)}
                              className="p-1 rounded bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmTingkat(item)}
                              className="p-1 rounded bg-slate-100 hover:bg-red-100 text-slate-700 hover:text-red-700"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-slate-400">
                        Belum ada tingkat biaya.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section 2: Jenis Angkutan */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-base">Jenis Angkutan / Moda Transport</h2>
                  <p className="text-xs text-slate-500">Kendaraan Dinas, Pesawat, Kereta, Dsb.</p>
                </div>
              </div>

              <button
                onClick={openCreateAngkutanModal}
                className="inline-flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Kode</th>
                    <th className="py-3 px-3">Moda Transportasi</th>
                    <th className="py-3 px-3">Keterangan</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jenisAngkutan && jenisAngkutan.length > 0 ? (
                    jenisAngkutan.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3 font-mono font-bold text-purple-600">{item.kode}</td>
                        <td className="py-3 px-3 font-semibold text-slate-900">{item.nama}</td>
                        <td className="py-3 px-3 text-slate-500">{item.keterangan || '-'}</td>
                        <td className="py-3 px-3 text-center">
                          {item.is_active ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Aktif
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                              Non-aktif
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => openEditAngkutanModal(item)}
                              className="p-1 rounded bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmAngkutan(item)}
                              className="p-1 rounded bg-slate-100 hover:bg-red-100 text-slate-700 hover:text-red-700"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-slate-400">
                        Belum ada jenis angkutan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Form Tingkat Biaya */}
      {isTingkatModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative border border-slate-100">
            <button
              onClick={() => setIsTingkatModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingTingkat ? 'Edit Tingkat Biaya' : 'Tambah Tingkat Biaya'}
            </h3>

            <form onSubmit={handleTingkatSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kode *</label>
                <input
                  type="text"
                  required
                  value={tingkatForm.data.kode}
                  onChange={(e) => tingkatForm.setData('kode', e.target.value)}
                  placeholder="Contoh: A"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Tingkat / Kategori *</label>
                <input
                  type="text"
                  required
                  value={tingkatForm.data.nama}
                  onChange={(e) => tingkatForm.setData('nama', e.target.value)}
                  placeholder="Tingkat A (Pejabat Eselon I / Duta Besar)"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan</label>
                <textarea
                  rows="2"
                  value={tingkatForm.data.keterangan}
                  onChange={(e) => tingkatForm.setData('keterangan', e.target.value)}
                  placeholder="Keterangan standar biaya perhari..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                ></textarea>
              </div>

              {editingTingkat && (
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="tingkat_active"
                    checked={tingkatForm.data.is_active}
                    onChange={(e) => tingkatForm.setData('is_active', e.target.checked)}
                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                  />
                  <label htmlFor="tingkat_active" className="text-xs font-semibold text-slate-700">
                    Status Aktif
                  </label>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTingkatModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={tingkatForm.processing}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 shadow-md shadow-amber-500/20"
                >
                  Simpan Tingkat Biaya
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Form Jenis Angkutan */}
      {isAngkutanModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative border border-slate-100">
            <button
              onClick={() => setIsAngkutanModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingAngkutan ? 'Edit Jenis Angkutan' : 'Tambah Jenis Angkutan'}
            </h3>

            <form onSubmit={handleAngkutanSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kode *</label>
                <input
                  type="text"
                  required
                  value={angkutanForm.data.kode}
                  onChange={(e) => angkutanForm.setData('kode', e.target.value)}
                  placeholder="Contoh: PU"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Moda Transportasi *</label>
                <input
                  type="text"
                  required
                  value={angkutanForm.data.nama}
                  onChange={(e) => angkutanForm.setData('nama', e.target.value)}
                  placeholder="Pesawat Udara (Ekonomi / Bisnis)"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan</label>
                <textarea
                  rows="2"
                  value={angkutanForm.data.keterangan}
                  onChange={(e) => angkutanForm.setData('keterangan', e.target.value)}
                  placeholder="Contoh: Tiket Pesawat Resmi dengan Boarding Pass"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                ></textarea>
              </div>

              {editingAngkutan && (
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="angkutan_active"
                    checked={angkutanForm.data.is_active}
                    onChange={(e) => angkutanForm.setData('is_active', e.target.checked)}
                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                  />
                  <label htmlFor="angkutan_active" className="text-xs font-semibold text-slate-700">
                    Status Aktif
                  </label>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAngkutanModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={angkutanForm.processing}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 shadow-md shadow-amber-500/20"
                >
                  Simpan Jenis Angkutan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modals */}
      {deleteConfirmTingkat && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 text-center">
            <ShieldAlert className="w-8 h-8 text-red-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Hapus Tingkat Biaya?</h3>
            <p className="text-xs text-slate-500 mb-6">
              Hapus tingkat biaya <strong>{deleteConfirmTingkat.nama}</strong>?
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setDeleteConfirmTingkat(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={handleTingkatDelete}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmAngkutan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 text-center">
            <ShieldAlert className="w-8 h-8 text-red-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Hapus Jenis Angkutan?</h3>
            <p className="text-xs text-slate-500 mb-6">
              Hapus jenis angkutan <strong>{deleteConfirmAngkutan.nama}</strong>?
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setDeleteConfirmAngkutan(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={handleAngkutanDelete}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
