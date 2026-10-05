import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
  Users, 
  UserCheck, 
  Building2, 
  Layers, 
  Truck, 
  ArrowRight, 
  FileCheck2, 
  Clock, 
  CheckCircle2, 
  Database,
  Plus,
  Workflow,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

export default function Dashboard({ stats, recentPegawai }) {
  return (
    <AdminLayout title="Dashboard Master Admin">
      <Head title="Dashboard Master Admin - e-SPD Pusdiklat Kemlu" />

      {/* Banner / Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0F2C59] via-[#163c78] to-[#0F2C59] text-white p-6 sm:p-8 shadow-xl mb-8 border border-slate-700/50">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-amber-500/20 text-amber-300 text-xs font-medium px-3 py-1 rounded-full mb-3 border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sistem Informasi E-SPD & Surat Tugas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Panel Pengelolaan Master Database SPD
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            Selamat datang di Portal Administrator e-SPD Pusdiklat Kementerian Luar Negeri. Di sini Anda dapat mengelola Master Data Pegawai, PPK, Unit Kerja, serta Tarif/Biaya dan Angkutan perjalanan dinas.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/pegawai"
              className="inline-flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition transform hover:-translate-y-0.5 text-xs sm:text-sm"
            >
              <Users className="w-4 h-4" />
              <span>Kelola Master Pegawai</span>
            </Link>

            <Link
              href="/admin/ppk"
              className="inline-flex items-center space-x-2 bg-slate-800/90 hover:bg-slate-700 text-white font-semibold px-4 py-2.5 rounded-xl border border-slate-600 transition text-xs sm:text-sm"
            >
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>Kelola PPK</span>
            </Link>
          </div>
        </div>

        {/* Decorative Graphic Element */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-10 translate-y-10">
          <Database className="w-96 h-96 text-white" />
        </div>
      </div>

      {/* Grid Summary Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {/* Total Pegawai */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pegawai</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900">{stats.totalPegawai}</span>
            <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
              {stats.pegawaiAktif} Aktif
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Pegawai terdaftar di DB</p>
        </div>

        {/* Total PPK */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pejabat PPK</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalPpk}</div>
          <p className="text-xs text-slate-500 mt-2">Pejabat Pembuat Komitmen</p>
        </div>

        {/* Unit Kerja */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit Kerja</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalUnitKerja}</div>
          <p className="text-xs text-slate-500 mt-2">Satker / Bagian Pusdiklat</p>
        </div>

        {/* Tingkat Biaya */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tingkat Biaya</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalTingkatBiaya}</div>
          <p className="text-xs text-slate-500 mt-2">Kategori Tingkat Perjalanan</p>
        </div>

        {/* Jenis Angkutan */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Angkutan</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalJenisAngkutan}</div>
          <p className="text-xs text-slate-500 mt-2">Moda Transportasi SPD</p>
        </div>
      </div>

      {/* Workflow Visualization Section (Alur Data e-SPD Pusdiklat Kemlu) */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2 text-amber-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Workflow className="w-4 h-4" />
              <span>Arsitektur & Alur Sistem</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Alur Data Pengelolaan Surat Tugas & SPD</h2>
            <p className="text-xs text-slate-500">Berdasarkan Alur Operasional Pusdiklat Kemlu</p>
          </div>

          <div className="mt-3 md:mt-0 flex items-center space-x-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Master Data Active & Synchronized</span>
          </div>
        </div>

        {/* Workflow Steps Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Step 1 */}
          <div className="relative bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-amber-400 transition group">
            <div className="flex items-center justify-between mb-3">
              <span className="w-7 h-7 rounded-lg bg-[#0F2C59] text-amber-400 font-bold text-xs flex items-center justify-center">
                01
              </span>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">Admin DB</span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-amber-600 transition">Master Data Setup</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pengisian DB Pegawai, PPK, Unit Kerja, Tingkat Biaya & Angkutan.
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-blue-400 transition group">
            <div className="flex items-center justify-between mb-3">
              <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                02
              </span>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">Pemohon</span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-blue-600 transition">Pengajuan Surat Tugas</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Penginputan usulan tugas, lokasi tujuan, tanggal & daftar pelaksana.
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-indigo-400 transition group">
            <div className="flex items-center justify-between mb-3">
              <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                03
              </span>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">PPK & Pimpinan</span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-indigo-600 transition">Verifikasi & Approval</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Penelaahan pembebanan anggaran & persetujuan Pejabat PPK.
            </p>
          </div>

          {/* Step 4 */}
          <div className="relative bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-emerald-400 transition group">
            <div className="flex items-center justify-between mb-3">
              <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                04
              </span>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">Bendahara</span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-emerald-600 transition">Penerbitan ST & SPD</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cetak fisik ST, Lembar SPD, Rincian Biaya & Uang Muka Perjalanan.
            </p>
          </div>

          {/* Step 5 */}
          <div className="relative bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-purple-400 transition group">
            <div className="flex items-center justify-between mb-3">
              <span className="w-7 h-7 rounded-lg bg-purple-600 text-white font-bold text-xs flex items-center justify-center">
                05
              </span>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">Subbag KSP</span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-purple-600 transition">Pelaporan & SPJ</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Verifikasi pertanggungjawaban riil, tiket, visum, dan kwitansi akhir.
            </p>
          </div>
        </div>
      </div>

      {/* Two column section: Quick Manage & Recent Master Pegawai */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Database Management Options */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
            <h2 className="font-bold text-slate-900 text-base mb-4 flex items-center space-x-2">
              <Database className="w-5 h-5 text-amber-500" />
              <span>Akses Cepat Master DB</span>
            </h2>

            <div className="space-y-3">
              <Link
                href="/admin/pegawai"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm group-hover:text-amber-700 transition">Master Data Pegawai</h4>
                    <p className="text-xs text-slate-500">NIP, Jabatan, Pangkat & Golongan</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition" />
              </Link>

              <Link
                href="/admin/ppk"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm group-hover:text-amber-700 transition">Master Data PPK</h4>
                    <p className="text-xs text-slate-500">Pejabat Pembuat Komitmen</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition" />
              </Link>

              <Link
                href="/admin/unit-kerja"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm group-hover:text-amber-700 transition">Master Unit Kerja</h4>
                    <p className="text-xs text-slate-500">Kode & Nama Unit Pusdiklat</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition" />
              </Link>

              <Link
                href="/admin/referensi"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm group-hover:text-amber-700 transition">Tingkat Biaya & Angkutan</h4>
                    <p className="text-xs text-slate-500">Referensi Kode SPD & Transport</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition" />
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Master Pegawai list */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-slate-900 text-base">Pegawai Terkini</h2>
                <p className="text-xs text-slate-500">Daftar pegawai yang baru saja ditambahkan / diperbarui</p>
              </div>
              <Link
                href="/admin/pegawai"
                className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center space-x-1"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Nama / NIP</th>
                    <th className="py-3 px-4">Pangkat / Gol.</th>
                    <th className="py-3 px-4">Jabatan</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentPegawai && recentPegawai.length > 0 ? (
                    recentPegawai.map((peg) => (
                      <tr key={peg.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{peg.nama}</div>
                          <div className="text-[11px] text-slate-500 font-mono">NIP: {peg.nip}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-800">{peg.pangkat}</div>
                          <div className="text-[11px] text-slate-500">Gol. {peg.golongan}</div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">{peg.jabatan}</td>
                        <td className="py-3 px-4 text-center">
                          {peg.is_active ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-800">
                              Non-aktif
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-6 text-center text-slate-400">
                        Belum ada data pegawai.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
