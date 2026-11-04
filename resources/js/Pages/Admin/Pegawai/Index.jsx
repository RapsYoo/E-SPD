import React, { useEffect, useRef, useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import PegawaiProfileModal from '@/Components/PegawaiProfileModal';
import { 
  Users, 
  Plus, 
  Search, 
  Eye,
  Edit3, 
  Trash2, 
  X, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  UserPlus,
  Building,
  ShieldAlert
} from 'lucide-react';

export default function Index({ pegawai, uptBidangList = [], filters }) {
  const searchTimeout = useRef(null);
  const [search, setSearch] = useState(filters?.search || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPegawai, setEditingPegawai] = useState(null);
  const [deleteConfirmPegawai, setDeleteConfirmPegawai] = useState(null);
  const [selectedProfilePegawai, setSelectedProfilePegawai] = useState(null);

  const emptyForm = {
    nama: '',
    nip: '',
    status_kepegawaian: '',
    upt_bidang_id: '',
    upt_bidang: '',
    jenis_kelamin: '',
    agama: '',
    tanggal_lahir: '',
    masuk_kemlu: '',
    masuk_pusdiklat: '',
    pddn_pdln: '',
    pangkat: '',
    golongan: '',
    kelas_jabatan: '',
    jabatan: '',
    struktural_lainnya: '',
    fungsional: '',
    jenjang: '',
    gelar: '',
    tmt: '',
    kode_bank: '',
    bank: '',
    no_rekening: '',
    nama_rekening: '',
    keterangan: '',
    is_active: true,
  };

  const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm(emptyForm);

  useEffect(() => () => clearTimeout(searchTimeout.current), []);

  const searchPegawai = (value) => {
    setSearch(value);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      router.get('/admin/pegawai', { search: value }, {
        preserveState: true,
        preserveScroll: true,
        replace: true,
      });
    }, 350);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    clearTimeout(searchTimeout.current);
    router.get('/admin/pegawai', { search }, { preserveState: true, preserveScroll: true });
  };

  const openCreateModal = () => {
    setEditingPegawai(null);
    clearErrors();
    reset();
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingPegawai(item);
    clearErrors();
    const matchedUptId = item.upt_bidang_id ?? (uptBidangList.find((u) => u.nama === item.upt_bidang)?.id ?? '');
    setData({
      ...Object.fromEntries(Object.keys(emptyForm).map((key) => [key, item[key] ?? ''])),
      upt_bidang_id: matchedUptId,
      is_active: Boolean(item.is_active ?? true),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (processing) return;
    if (editingPegawai) {
      put(`/admin/pegawai/${editingPegawai.id}`, {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        },
      });
    } else {
      post('/admin/pegawai', {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        },
      });
    }
  };

  const handleDelete = () => {
    if (!deleteConfirmPegawai || processing) return;
    destroy(`/admin/pegawai/${deleteConfirmPegawai.id}`, {
      onSuccess: () => setDeleteConfirmPegawai(null),
    });
  };

  return (
    <AdminLayout title="Master Data Pegawai">
      <Head title="Master Data Pegawai - e-SPD Pusdiklat Kemlu" />

      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Master Database</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Master Data Pegawai</h1>
          <p className="text-xs text-slate-500">Kelola data pegawai Pusdiklat Kemlu penerima Surat Tugas & SPD</p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-md shadow-amber-500/20 transition text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pegawai Baru</span>
        </button>
      </div>

      {/* Filters & Search Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => searchPegawai(e.target.value)}
              placeholder="Cari berdasarkan nama, NIP, atau jabatan..."
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
                router.get('/admin/pegawai', {}, { preserveState: true, preserveScroll: true, replace: true });
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
                <th className="py-3.5 px-4">Nama / NIP</th>
                <th className="py-3.5 px-4">Pangkat / Golongan</th>
                <th className="py-3.5 px-4">Jabatan</th>
                <th className="py-3.5 px-4">UPT / Bidang</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pegawai.data && pegawai.data.length > 0 ? (
                pegawai.data.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedProfilePegawai(item)}
                    className="group cursor-pointer hover:bg-amber-50/50 transition"
                    title={`Klik untuk melihat profil ${item.nama}`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-[#0F2C59] group-hover:underline">
                        {item.nama}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">NIP: {item.nip || '-'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{item.pangkat}</div>
                      <div className="text-xs text-slate-500">Golongan {item.golongan}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-medium">{item.jabatan}</div>
                      <div className="text-xs text-slate-400">{item.fungsional || item.struktural_lainnya || ''}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {item.upt?.nama || item.upt_bidang || <span className="text-slate-400 italic">-</span>}
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
                    <td
                      className="py-3.5 px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setSelectedProfilePegawai(item)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-800 transition"
                          title="Lihat Profil"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 transition"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmPegawai(item)}
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
                    Tidak ada data pegawai ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Links */}
        {pegawai.links && pegawai.links.length > 3 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Menampilkan {pegawai.from || 0} - {pegawai.to || 0} dari {pegawai.total} pegawai
            </div>
            <div className="flex items-center space-x-1">
              {pegawai.links.map((link, idx) => {
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

      {/* Modal Profil Detail Pegawai */}
      <PegawaiProfileModal
        pegawai={selectedProfilePegawai}
        onClose={() => setSelectedProfilePegawai(null)}
        onEdit={(item) => openEditModal(item)}
        showBankInfo={true}
      />

      {/* Modal Add/Edit Pegawai */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative border border-slate-100 animate-scale-in">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingPegawai ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingPegawai ? 'Perbarui informasi pegawai terdaftar' : 'Masukkan rincian pegawai baru'}
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
                  placeholder="Contoh: Dr. Ahmad Susanto, M.A."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                {errors.nama && <span className="text-xs text-red-500 mt-1 block">{errors.nama}</span>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">NIP</label>
                  <input
                    type="text"
                    value={data.nip}
                    onChange={(e) => setData('nip', e.target.value)}
                    placeholder="198501012010121001"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  {errors.nip && <span className="text-xs text-red-500 mt-1 block">{errors.nip}</span>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Golongan</label>
                  <input
                    type="text"
                    value={data.golongan}
                    onChange={(e) => setData('golongan', e.target.value)}
                    placeholder="Contoh: IV/a"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  {errors.golongan && <span className="text-xs text-red-500 mt-1 block">{errors.golongan}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pangkat</label>
                  <input
                    type="text"
                    value={data.pangkat}
                    onChange={(e) => setData('pangkat', e.target.value)}
                    placeholder="Pembina Tingkat I"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  {errors.pangkat && <span className="text-xs text-red-500 mt-1 block">{errors.pangkat}</span>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jabatan</label>
                  <input
                    type="text"
                    value={data.jabatan}
                    onChange={(e) => setData('jabatan', e.target.value)}
                    placeholder="Widyaiswara Ahli Madya"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  {errors.jabatan && <span className="text-xs text-red-500 mt-1 block">{errors.jabatan}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">UPT / Bidang</label>
                  <select
                    value={data.upt_bidang_id || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const selected = uptBidangList.find((u) => String(u.id) === val);
                      setData((prev) => ({
                        ...prev,
                        upt_bidang_id: val ? Number(val) : '',
                        upt_bidang: selected ? selected.nama : '',
                      }));
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="">-- Pilih UPT / Bidang --</option>
                    {uptBidangList.map((upt) => (
                      <option key={upt.id} value={upt.id}>
                        {upt.nama}{upt.keterangan ? ` — ${upt.keterangan}` : ''}
                      </option>
                    ))}
                  </select>
                  {(errors.upt_bidang_id || errors.upt_bidang) && (
                    <span className="text-xs text-red-500 mt-1 block">{errors.upt_bidang_id || errors.upt_bidang}</span>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status Kepegawaian</label>
                  <input
                    type="text"
                    value={data.status_kepegawaian}
                    onChange={(e) => setData('status_kepegawaian', e.target.value)}
                    placeholder="PNS, PNS Arunika, PPNPN..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  {errors.status_kepegawaian && <span className="text-xs text-red-500 mt-1 block">{errors.status_kepegawaian}</span>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Kelamin (L/P)</label>
                  <input
                    type="text"
                    value={data.jenis_kelamin}
                    onChange={(e) => setData('jenis_kelamin', e.target.value)}
                    placeholder="L"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  {errors.jenis_kelamin && <span className="text-xs text-red-500 mt-1 block">{errors.jenis_kelamin}</span>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Agama</label>
                  <input
                    type="text"
                    value={data.agama}
                    onChange={(e) => setData('agama', e.target.value)}
                    placeholder="Islam"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  {errors.agama && <span className="text-xs text-red-500 mt-1 block">{errors.agama}</span>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Lahir</label>
                  <input
                    type="text"
                    value={data.tanggal_lahir}
                    onChange={(e) => setData('tanggal_lahir', e.target.value)}
                    placeholder="1990-01-31"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  {errors.tanggal_lahir && <span className="text-xs text-red-500 mt-1 block">{errors.tanggal_lahir}</span>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">PDDN / PDLN</label>
                  <input
                    type="text"
                    value={data.pddn_pdln}
                    onChange={(e) => setData('pddn_pdln', e.target.value)}
                    placeholder="PDDN"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  {errors.pddn_pdln && <span className="text-xs text-red-500 mt-1 block">{errors.pddn_pdln}</span>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Masuk Kemlu</label>
                  <input
                    type="text"
                    value={data.masuk_kemlu}
                    onChange={(e) => setData('masuk_kemlu', e.target.value)}
                    placeholder="2020-01-20"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  {errors.masuk_kemlu && <span className="text-xs text-red-500 mt-1 block">{errors.masuk_kemlu}</span>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Masuk Pusdiklat</label>
                  <input
                    type="text"
                    value={data.masuk_pusdiklat}
                    onChange={(e) => setData('masuk_pusdiklat', e.target.value)}
                    placeholder="2022-07-01"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  {errors.masuk_pusdiklat && <span className="text-xs text-red-500 mt-1 block">{errors.masuk_pusdiklat}</span>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kelas Jabatan</label>
                  <input
                    type="text"
                    value={data.kelas_jabatan}
                    onChange={(e) => setData('kelas_jabatan', e.target.value)}
                    placeholder="7"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  {errors.kelas_jabatan && <span className="text-xs text-red-500 mt-1 block">{errors.kelas_jabatan}</span>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Struktural / Lainnya</label>
                  <input
                    type="text"
                    value={data.struktural_lainnya}
                    onChange={(e) => setData('struktural_lainnya', e.target.value)}
                    placeholder="Kepala Bidang"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  {errors.struktural_lainnya && <span className="text-xs text-red-500 mt-1 block">{errors.struktural_lainnya}</span>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fungsional</label>
                  <input
                    type="text"
                    value={data.fungsional}
                    onChange={(e) => setData('fungsional', e.target.value)}
                    placeholder="Diplomat"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  {errors.fungsional && <span className="text-xs text-red-500 mt-1 block">{errors.fungsional}</span>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jenjang</label>
                  <input
                    type="text"
                    value={data.jenjang}
                    onChange={(e) => setData('jenjang', e.target.value)}
                    placeholder="Ahli Muda"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  {errors.jenjang && <span className="text-xs text-red-500 mt-1 block">{errors.jenjang}</span>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gelar</label>
                  <input
                    type="text"
                    value={data.gelar}
                    onChange={(e) => setData('gelar', e.target.value)}
                    placeholder="Diplomat Ahli Muda"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  {errors.gelar && <span className="text-xs text-red-500 mt-1 block">{errors.gelar}</span>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">TMT</label>
                  <input
                    type="text"
                    value={data.tmt}
                    onChange={(e) => setData('tmt', e.target.value)}
                    placeholder="2019-04-01"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  {errors.tmt && <span className="text-xs text-red-500 mt-1 block">{errors.tmt}</span>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Bank</label>
                  <input
                    type="text"
                    value={data.kode_bank}
                    onChange={(e) => setData('kode_bank', e.target.value)}
                    placeholder="BNINIDJA"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  {errors.kode_bank && <span className="text-xs text-red-500 mt-1 block">{errors.kode_bank}</span>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bank</label>
                  <input
                    type="text"
                    value={data.bank}
                    onChange={(e) => setData('bank', e.target.value)}
                    placeholder="BNI"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  {errors.bank && <span className="text-xs text-red-500 mt-1 block">{errors.bank}</span>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No. Rekening</label>
                  <input
                    type="text"
                    value={data.no_rekening}
                    onChange={(e) => setData('no_rekening', e.target.value)}
                    placeholder=""
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  {errors.no_rekening && <span className="text-xs text-red-500 mt-1 block">{errors.no_rekening}</span>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Rekening</label>
                  <input
                    type="text"
                    value={data.nama_rekening}
                    onChange={(e) => setData('nama_rekening', e.target.value)}
                    placeholder=""
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  {errors.nama_rekening && <span className="text-xs text-red-500 mt-1 block">{errors.nama_rekening}</span>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan (Pendidikan / Penugasan)</label>
                <textarea
                  rows="3"
                  value={data.keterangan}
                  onChange={(e) => setData('keterangan', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={Boolean(data.is_active)}
                  onChange={(e) => setData('is_active', e.target.checked)}
                  className="w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500"
                />
                <label htmlFor="is_active" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Status Pegawai Aktif (Dapat dipilih pada pembuatan Surat Tugas & SPD)
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
                  {processing ? 'Menyimpan...' : 'Simpan Pegawai'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmPegawai && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Hapus Data Pegawai?</h3>
            <p className="text-xs text-slate-500 mb-6">
              Apakah Anda yakin ingin menghapus data pegawai <strong className="text-slate-900">{deleteConfirmPegawai.nama}</strong> (NIP: {deleteConfirmPegawai.nip || '-'})? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setDeleteConfirmPegawai(null)}
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
