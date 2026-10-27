import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
  KeyRound,
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  ShieldAlert,
  UserRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
  Link2Off,
} from 'lucide-react';

const ROLE_STYLES = {
  admin: 'bg-amber-100 text-amber-800 border-amber-300',
  pemohon: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  sespalu: 'bg-sky-100 text-sky-800 border-sky-300',
  kapus: 'bg-purple-100 text-purple-800 border-purple-300',
  tu: 'bg-blue-100 text-blue-800 border-blue-300',
  ppk: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  pegawai: 'bg-teal-100 text-teal-800 border-teal-300',
};

export default function Index({ users, filters, roles, pegawaiOptions, currentUserId }) {
  const searchTimeout = useRef(null);
  const [search, setSearch] = useState(filters?.search || '');
  const [roleFilter, setRoleFilter] = useState(filters?.role || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [pegawaiSearch, setPegawaiSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
    pegawai_id: '',
    email: '',
    role: 'pemohon',
    password: '',
  });

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      clearTimeout(searchTimeout.current);
    };
  }, []);

  // Pegawai yang boleh dipilih: belum punya akun, atau akun milik user yang sedang diedit.
  const availablePegawai = useMemo(
    () => pegawaiOptions.filter((p) => !p.user_id || p.user_id === editingUser?.id),
    [pegawaiOptions, editingUser]
  );

  const filteredPegawai = useMemo(() => {
    const q = pegawaiSearch.trim().toLowerCase();
    return availablePegawai
      .filter((p) => !q || p.nama.toLowerCase().includes(q) || (p.nip || '').toLowerCase().includes(q))
      .slice(0, 30);
  }, [availablePegawai, pegawaiSearch]);

  const selectedPegawai = useMemo(
    () => pegawaiOptions.find((p) => String(p.id) === String(data.pegawai_id)) || null,
    [pegawaiOptions, data.pegawai_id]
  );

  const applyFilters = (next = {}) => {
    router.get('/admin/users', { search, role: roleFilter, ...next }, { preserveState: true });
  };

  const searchUsers = (value) => {
    setSearch(value);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      router.get('/admin/users', { search: value, role: roleFilter }, {
        preserveState: true,
        preserveScroll: true,
        replace: true,
      });
    }, 350);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    clearTimeout(searchTimeout.current);
    applyFilters();
  };

  const openCreateModal = () => {
    setEditingUser(null);
    clearErrors();
    reset();
    setShowPassword(false);
    setPegawaiSearch('');
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingUser(item);
    clearErrors();
    setData({
      pegawai_id: item.pegawai_id ? String(item.pegawai_id) : '',
      email: item.email || '',
      role: item.role || 'pemohon',
      password: '',
    });
    setShowPassword(false);
    setPegawaiSearch('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setDropdownOpen(false);
  };

  const choosePegawai = (p) => {
    // Email otomatis terisi dari data pegawai bila form email masih kosong (tetap bisa diubah).
    setData((prev) => ({
      ...prev,
      pegawai_id: String(p.id),
      email: prev.email || p.email || '',
    }));
    setPegawaiSearch('');
    setDropdownOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const options = {
      preserveScroll: true,
      onSuccess: () => {
        closeModal();
        reset();
      },
    };
    if (editingUser) {
      put(`/admin/users/${editingUser.id}`, options);
    } else {
      post('/admin/users', options);
    }
  };

  const handleDelete = () => {
    if (!deleteConfirmUser) return;
    destroy(`/admin/users/${deleteConfirmUser.id}`, {
      preserveScroll: true,
      onFinish: () => setDeleteConfirmUser(null),
    });
  };

  const canPickPegawaiOptional = editingUser && !editingUser.pegawai_id;

  return (
    <AdminLayout title="Akun Pengguna">
      <Head title="Akun Pengguna - e-SPD Pusdiklat Kemlu" />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
            <KeyRound className="w-4 h-4" />
            <span>Master Database</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Akun Pengguna</h1>
          <p className="text-xs text-slate-500">
            Kelola akun login sistem. Setiap akun dibuat dari data pegawai, nama tidak diketik manual.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-md shadow-amber-500/20 transition text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Akun Baru</span>
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
              onChange={(e) => searchUsers(e.target.value)}
              placeholder="Cari nama, email, atau NIP..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => {
              clearTimeout(searchTimeout.current);
              setRoleFilter(e.target.value);
              applyFilters({ role: e.target.value });
            }}
            className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:ring-amber-500 focus:outline-none"
          >
            <option value="">Semua Peran</option>
            {Object.entries(roles).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <button
            type="submit"
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-2 rounded-xl text-sm transition"
          >
            Cari
          </button>
          {(search || roleFilter) && (
            <button
              type="button"
              onClick={() => {
                clearTimeout(searchTimeout.current);
                setSearch('');
                setRoleFilter('');
                router.get('/admin/users', {}, { preserveState: true, preserveScroll: true, replace: true });
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
                <th className="py-3.5 px-4">Pegawai</th>
                <th className="py-3.5 px-4">Email Login</th>
                <th className="py-3.5 px-4 text-center">Peran</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.data && users.data.length > 0 ? (
                users.data.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-amber-500/70 flex items-center justify-center text-amber-400 font-bold flex-shrink-0">
                          {(item.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span className="truncate">{item.name}</span>
                            {item.id === currentUserId && (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Anda</span>
                            )}
                          </div>
                          {item.pegawai ? (
                            <div className="text-[11px] text-slate-500">
                              <span className="font-mono">NIP: {item.pegawai.nip}</span>
                              {item.pegawai.jabatan && <span> • {item.pegawai.jabatan}</span>}
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mt-0.5">
                              <Link2Off className="w-3 h-3" /> Belum terhubung ke data pegawai
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-700">{item.email}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${ROLE_STYLES[item.role] || 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                        {roles[item.role] || item.role}
                      </span>
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
                          onClick={() => setDeleteConfirmUser(item)}
                          disabled={item.id === currentUserId}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-700 hover:text-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-100 disabled:hover:text-slate-700"
                          title={item.id === currentUserId ? 'Tidak dapat menghapus akun sendiri' : 'Hapus'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-400 text-sm">
                    Tidak ada akun ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Links */}
        {users.links && users.links.length > 3 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Menampilkan {users.from || 0} - {users.to || 0} dari {users.total} akun
            </div>
            <div className="flex items-center space-x-1">
              {users.links.map((link, idx) => {
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
              onClick={closeModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingUser ? 'Edit Akun Pengguna' : 'Tambah Akun Baru'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingUser ? 'Perbarui data akun login' : 'Pilih pegawai dari data pegawai untuk dibuatkan akun'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Pegawai (pilih dari DB, bukan ketik) */}
              <div ref={dropdownRef}>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pegawai {canPickPegawaiOptional ? '(opsional)' : '*'}
                </label>

                {selectedPegawai ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-amber-500/70 flex items-center justify-center text-amber-400 font-bold flex-shrink-0">
                        {selectedPegawai.nama.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900">{selectedPegawai.nama}</div>
                        <div className="text-[11px] font-mono text-slate-600">NIP: {selectedPegawai.nip}</div>
                        <div className="text-[11px] text-slate-500">
                          {[selectedPegawai.pangkat && `${selectedPegawai.pangkat} (${selectedPegawai.golongan})`, selectedPegawai.jabatan]
                            .filter(Boolean)
                            .join(' • ')}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setData('pegawai_id', '');
                        setDropdownOpen(true);
                      }}
                      className="text-[11px] font-bold text-amber-800 hover:text-amber-950 bg-white border border-amber-300 px-2 py-1 rounded-lg flex-shrink-0"
                    >
                      Ganti
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <UserRound className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={pegawaiSearch}
                      onChange={(e) => {
                        setPegawaiSearch(e.target.value);
                        setDropdownOpen(true);
                      }}
                      onFocus={() => setDropdownOpen(true)}
                      placeholder="Cari & pilih pegawai berdasarkan nama atau NIP..."
                      className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <ChevronDown className="w-4 h-4 absolute right-3.5 top-2.5 text-slate-400 pointer-events-none" />

                    {dropdownOpen && (
                      <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                        <ul className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                          {filteredPegawai.length > 0 ? (
                            filteredPegawai.map((p) => (
                              <li
                                key={p.id}
                                onClick={() => choosePegawai(p)}
                                className="px-3 py-2 cursor-pointer hover:bg-amber-50 text-xs"
                              >
                                <span className="font-semibold text-slate-800">{p.nama}</span>
                                <span className="text-slate-500 ml-1 font-mono">— {p.nip}</span>
                                <div className="text-[10px] text-slate-400 truncate">{p.jabatan}</div>
                              </li>
                            ))
                          ) : (
                            <li className="px-3 py-3 text-xs text-slate-400 text-center">
                              {availablePegawai.length === 0
                                ? 'Semua pegawai aktif sudah memiliki akun.'
                                : 'Pegawai tidak ditemukan.'}
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                {errors.pegawai_id && <span className="text-xs text-red-500 mt-1 block">{errors.pegawai_id}</span>}
                {canPickPegawaiOptional && !selectedPegawai && (
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Akun lama belum terhubung ke data pegawai. Pilih pegawai agar nama akun mengikuti data pegawai.
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Login *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    placeholder="nama@pusdiklat.kemlu.go.id"
                    className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                {errors.email && <span className="text-xs text-red-500 mt-1 block">{errors.email}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Peran / Aktor *</label>
                <select
                  value={data.role}
                  onChange={(e) => setData('role', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {Object.entries(roles).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                {errors.role && <span className="text-xs text-red-500 mt-1 block">{errors.role}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kata Sandi {editingUser ? '(kosongkan jika tidak diubah)' : '*'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!editingUser}
                    minLength={8}
                    autoComplete="new-password"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className="w-full pl-10 pr-10 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <span className="text-xs text-red-500 mt-1 block">{errors.password}</span>}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 transition shadow-md shadow-amber-500/20 disabled:opacity-60"
                >
                  {processing ? 'Menyimpan...' : editingUser ? 'Simpan Perubahan' : 'Buat Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Hapus Akun?</h3>
            <p className="text-xs text-slate-500 mb-6">
              Apakah Anda yakin ingin menghapus akun <strong className="text-slate-900">{deleteConfirmUser.name}</strong> ({deleteConfirmUser.email})?
              Riwayat surat yang pernah diajukan tetap tersimpan. Data pegawai tidak ikut terhapus.
            </p>

            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={processing}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition shadow-md shadow-red-600/20 disabled:opacity-60"
              >
                Ya, Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
