import React, { useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import {
  User,
  Mail,
  Camera,
  Upload,
  Trash2,
  Building2,
  Briefcase,
  Award,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  FileText
} from 'lucide-react';

function getInitials(name = '') {
  const parts = String(name)
    .replace(/[^a-zA-Z\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function UpdateProfileInformationForm({
  mustVerifyEmail,
  status,
  pegawai = {},
  uptBidangList = [],
}) {
  const { auth } = usePage().props;
  const user = auth?.user || {};

  const [fotoPreview, setFotoPreview] = useState(pegawai?.foto_url || null);

  const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
    _method: 'patch',
    name: user.name || pegawai?.nama || '',
    email: user.email || '',
    nip: pegawai?.nip || '',
    jabatan: pegawai?.jabatan || '',
    pangkat: pegawai?.pangkat || '',
    golongan: pegawai?.golongan || '',
    upt_bidang_id: pegawai?.upt_bidang_id || '',
    status_kepegawaian: pegawai?.status_kepegawaian || '',
    jenis_kelamin: pegawai?.jenis_kelamin || '',
    agama: pegawai?.agama || '',
    bank: pegawai?.bank || '',
    no_rekening: pegawai?.no_rekening || '',
    nama_rekening: pegawai?.nama_rekening || '',
    keterangan: pegawai?.keterangan || '',
    foto: null,
    hapus_foto: false,
  });

  const handleFotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setData((prev) => ({
        ...prev,
        foto: file,
        hapus_foto: false,
      }));
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const handleHapusFoto = () => {
    setData((prev) => ({
      ...prev,
      foto: null,
      hapus_foto: true,
    }));
    setFotoPreview(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('profile.update'), {
      forceFormData: true,
      preserveScroll: true,
    });
  };

  return (
    <section>
      <header className="mb-6 pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Informasi Profil & Data Pegawai
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Perbarui foto profil, akun login, dan data kepegawaian Anda di Pusdiklat Kemlu.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Role Akun:</span>
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-800 border border-amber-500/20">
            {user.role || 'Pegawai'}
          </span>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Upload Foto Profil */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            Foto Profil Pegawai
          </label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="relative shrink-0">
              {fotoPreview ? (
                <img
                  src={fotoPreview}
                  alt={data.name}
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-amber-400 shadow-md bg-slate-800"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-amber-500/20 border-2 border-amber-400 text-amber-800 flex items-center justify-center text-2xl font-extrabold shadow-inner">
                  {getInitials(data.name)}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-600 mb-2 font-medium">
                Unggah foto formal atau foto profil untuk tanda pengenal sistem dan data pegawai.
              </p>
              <p className="text-[11px] text-slate-400 mb-3">
                Format yang didukung: JPG, PNG, atau WEBP. Ukuran maksimal 2MB.
              </p>

              <div className="flex flex-wrap items-center gap-2.5">
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:border-amber-500 text-slate-800 text-xs font-bold rounded-xl cursor-pointer shadow-xs transition hover:bg-amber-50/50">
                  <Upload className="w-4 h-4 text-amber-600" />
                  <span>{fotoPreview ? 'Ganti Foto' : 'Unggah Foto Baru'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    className="hidden"
                    onChange={handleFotoChange}
                  />
                </label>

                {fotoPreview && (
                  <button
                    type="button"
                    onClick={handleHapusFoto}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition border border-transparent hover:border-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Hapus Foto</span>
                  </button>
                )}
              </div>
              {errors.foto && (
                <p className="mt-2 text-xs text-red-600 font-medium">{errors.foto}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 1: Data Akun Login */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-amber-600" />
            <span>Data Akun Pengguna</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap & Gelar *
              </label>
              <input
                id="name"
                type="text"
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="Contoh: Alfrian S, S.Kom."
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Email Login *
              </label>
              <input
                id="email"
                type="email"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="nama@kemlu.go.id"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>
          </div>
        </div>

        {/* Section 2: Data Kepegawaian Pusdiklat */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-600" />
            <span>Data Kepegawaian Pusdiklat</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="nip" className="block text-xs font-semibold text-slate-700 mb-1">
                NIP (Nomor Induk Pegawai)
              </label>
              <input
                id="nip"
                type="text"
                value={data.nip}
                onChange={(e) => setData('nip', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="199304022022051001"
              />
              {errors.nip && <p className="mt-1 text-xs text-red-600">{errors.nip}</p>}
            </div>

            <div>
              <label htmlFor="upt_bidang_id" className="block text-xs font-semibold text-slate-700 mb-1">
                UPT / Bidang Kerja
              </label>
              <select
                id="upt_bidang_id"
                value={data.upt_bidang_id}
                onChange={(e) => setData('upt_bidang_id', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
              >
                <option value="">-- Pilih UPT / Bidang --</option>
                {uptBidangList.map((upt) => (
                  <option key={upt.id} value={upt.id}>
                    {upt.nama} {upt.kode ? `(${upt.kode})` : ''}
                  </option>
                ))}
              </select>
              {errors.upt_bidang_id && <p className="mt-1 text-xs text-red-600">{errors.upt_bidang_id}</p>}
            </div>

            <div>
              <label htmlFor="status_kepegawaian" className="block text-xs font-semibold text-slate-700 mb-1">
                Status Kepegawaian
              </label>
              <input
                id="status_kepegawaian"
                type="text"
                value={data.status_kepegawaian}
                onChange={(e) => setData('status_kepegawaian', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="PNS Arunika / PPPK / Honorer"
              />
            </div>

            <div>
              <label htmlFor="jabatan" className="block text-xs font-semibold text-slate-700 mb-1">
                Jabatan Utama
              </label>
              <input
                id="jabatan"
                type="text"
                value={data.jabatan}
                onChange={(e) => setData('jabatan', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="Penata Kanselerai Ahli Pertama"
              />
            </div>

            <div>
              <label htmlFor="pangkat" className="block text-xs font-semibold text-slate-700 mb-1">
                Pangkat
              </label>
              <input
                id="pangkat"
                type="text"
                value={data.pangkat}
                onChange={(e) => setData('pangkat', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="Penata Muda"
              />
            </div>

            <div>
              <label htmlFor="golongan" className="block text-xs font-semibold text-slate-700 mb-1">
                Golongan
              </label>
              <input
                id="golongan"
                type="text"
                value={data.golongan}
                onChange={(e) => setData('golongan', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="III/a"
              />
            </div>

            <div>
              <label htmlFor="jenis_kelamin" className="block text-xs font-semibold text-slate-700 mb-1">
                Jenis Kelamin
              </label>
              <select
                id="jenis_kelamin"
                value={data.jenis_kelamin}
                onChange={(e) => setData('jenis_kelamin', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
              >
                <option value="">-- Pilih --</option>
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>

            <div>
              <label htmlFor="agama" className="block text-xs font-semibold text-slate-700 mb-1">
                Agama
              </label>
              <input
                id="agama"
                type="text"
                value={data.agama}
                onChange={(e) => setData('agama', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="Islam / Kristen / dsb."
              />
            </div>

            <div>
              <label htmlFor="keterangan" className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan / Keterangan
              </label>
              <input
                id="keterangan"
                type="text"
                value={data.keterangan}
                onChange={(e) => setData('keterangan', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="Keterangan tambahan"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Data Rekening Bank */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-600" />
            <span>Data Rekening Pembayaran Dinas</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="bank" className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Bank
              </label>
              <input
                id="bank"
                type="text"
                value={data.bank}
                onChange={(e) => setData('bank', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="Bank Mandiri / BNI / BRI"
              />
            </div>

            <div>
              <label htmlFor="no_rekening" className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Rekening
              </label>
              <input
                id="no_rekening"
                type="text"
                value={data.no_rekening}
                onChange={(e) => setData('no_rekening', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="1230009876543"
              />
            </div>

            <div>
              <label htmlFor="nama_rekening" className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Pemilik Rekening
              </label>
              <input
                id="nama_rekening"
                type="text"
                value={data.nama_rekening}
                onChange={(e) => setData('nama_rekening', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="Sesuai buku tabungan"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            {recentlySuccessful && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Data profil & foto berhasil disimpan!
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={processing}
            className="inline-flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl shadow-md shadow-amber-500/20 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{processing ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
        </div>
      </form>
    </section>
  );
}
