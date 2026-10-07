import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
  FileSignature, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Printer, 
  UserCheck, 
  Hash, 
  ShieldCheck, 
  ArrowLeft, 
  Building, 
  MapPin, 
  Calendar, 
  Users, 
  FileText,
  Sparkles,
  Stamp,
  UserCog
} from 'lucide-react';

export default function Show({ suratTugas, userRole }) {
  // Kapus Disposisi Form
  const kapusForm = useForm({
    kapus_decision: suratTugas.kapus_decision || 'YA',
    catatan_kapus: suratTugas.catatan_kapus || '',
  });

  // TU Penomoran Form
  const tuForm = useForm({
    nomor_st: suratTugas.nomor_st || '',
    nomor_spd: suratTugas.nomor_spd || '',
    tanggal_surat: suratTugas.tanggal_surat || new Date().toISOString().split('T')[0],
  });

  // PPK Signature Form
  const ppkForm = useForm({
    is_ppk_signed: !suratTugas.is_ppk_signed,
  });

  const handleKapusSubmit = (e) => {
    e.preventDefault();
    kapusForm.post(`/surat-tugas/${suratTugas.id}/disposisi`);
  };

  const handleTuSubmit = (e) => {
    e.preventDefault();
    tuForm.post(`/surat-tugas/${suratTugas.id}/penomoran`);
  };

  const handlePpkSubmit = (e) => {
    e.preventDefault();
    ppkForm.post(`/surat-tugas/${suratTugas.id}/sign-ppk`);
  };

  return (
    <AdminLayout title={`Detail Surat Tugas #${suratTugas.id}`}>
      <Head title={`Detail ST #${suratTugas.id} - Pusdiklat Kemlu`} />

      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <Link
            href="/surat-tugas"
            className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Surat</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Ruang Kerja Surat Tugas</span>
            <span className="text-amber-600 font-mono text-lg">#{suratTugas.id}</span>
          </h1>
          <p className="text-xs text-slate-500">Monitoring status persetujuan, penomoran resmi, dan TTD digital PPK</p>
        </div>

        {(userRole === 'tu' || userRole === 'admin') && suratTugas.status === 'SELESAI_TERBIT' && (
          <Link
            href={`/surat-tugas/${suratTugas.id}/cetak`}
            className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 transition text-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Dokumen Resmi PDF</span>
          </Link>
        )}
      </div>

      {/* Grid: Document Summary & Workflow Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Document Info Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Detail Ringkasan</span>
              <span className="bg-slate-100 text-slate-700 text-xs font-mono font-bold px-2.5 py-0.5 rounded">
                Kategori: {suratTugas.kategori_perjalanan}
              </span>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase">Perihal Undangan / Kegiatan</span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">{suratTugas.perihal_nota}</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500">Nomor Nota Masuk:</span>
                <p className="font-mono font-bold text-slate-900 mt-0.5">{suratTugas.nomor_nota}</p>
                <p className="text-slate-500 mt-1">Pengirim: <strong className="text-slate-800">{suratTugas.pengirim_nota}</strong></p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500">Nomor Surat Tugas Resmi:</span>
                <p className="font-mono font-bold text-amber-600 mt-0.5">{suratTugas.nomor_st || '[Belum diisi TU]'}</p>
                <p className="text-slate-500 mt-1">Nomor SPD: <strong className="text-slate-800">{suratTugas.nomor_spd || '[Belum diisi TU]'}</strong></p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500">Tujuan Perjalanan:</span>
                  <p className="font-bold text-slate-900">{suratTugas.tempat_tujuan}</p>
                  <p className="text-slate-500 text-[11px]">Dari: {suratTugas.tempat_berangkat}</p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Calendar className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500">Waktu & Durasi:</span>
                  <p className="font-bold text-slate-900">{suratTugas.tanggal_berangkat} s/d {suratTugas.tanggal_kembali}</p>
                  <p className="text-amber-600 font-bold text-[11px]">{suratTugas.durasi_hari} Hari Dinas</p>
                </div>
              </div>
            </div>

            {/* List of Officers */}
            <div className="pt-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Personel Pelaksana Surat Tugas ({suratTugas.pegawai_list?.length || 0} Pegawai)
              </span>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 font-bold text-slate-800">
                    <tr>
                      <th className="py-2 px-3 w-10 text-center">No</th>
                      <th className="py-2 px-3">Nama / NIP</th>
                      <th className="py-2 px-3">Pangkat / Gol.</th>
                      <th className="py-2 px-3">Jabatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {suratTugas.pegawai_list && suratTugas.pegawai_list.map((peg, idx) => (
                      <tr key={peg.id}>
                        <td className="py-2 px-3 text-center font-bold">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <div className="font-bold text-slate-900">{peg.nama}</div>
                          <div className="font-mono text-[11px] text-slate-500">NIP: {peg.nip}</div>
                        </td>
                        <td className="py-2 px-3">
                          <div>{peg.pangkat}</div>
                          <div className="text-[11px] text-slate-500">Gol. {peg.golongan}</div>
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-700">{peg.jabatan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Action Cards for Roles */}
        <div className="space-y-6">
          {/* Status Overview Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Status Workflow</h3>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Tahap Terakhir:</span>
                <span className="font-bold text-amber-600">{suratTugas.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Digital TTD PPK:</span>
                {suratTugas.is_ppk_signed ? (
                  <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">Tersematkan</span>
                ) : (
                  <span className="text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded">Belum TTD</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Box 1: Disposisi Kapus */}
          {(userRole === 'kapus' || userRole === 'admin') && suratTugas.status === 'MENUNGGU_DISPOSISI_KAPUS' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex items-center space-x-2 text-purple-700 font-bold text-sm">
              <UserCheck className="w-5 h-5 text-amber-500" />
              <span>Aksi Disposisi Kapus</span>
            </div>

            <form onSubmit={handleKapusSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Keputusan Kapus</label>
                <select
                  value={kapusForm.data.kapus_decision}
                  onChange={(e) => kapusForm.setData('kapus_decision', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                >
                  <option value="YA">Persetujuan / Ya (Lanjut TU)</option>
                  <option value="REVISI">Minta Revisi ke Sespalu</option>
                  <option value="STOP">Hentikan (Stop)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Disposisi</label>
                <textarea
                  rows="2"
                  value={kapusForm.data.catatan_kapus}
                  onChange={(e) => kapusForm.setData('catatan_kapus', e.target.value)}
                  placeholder="Instruksi Kapus..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={kapusForm.processing}
                className="w-full bg-[#0F2C59] hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition shadow"
              >
                Simpan Disposisi Kapus
              </button>
            </form>
          </div>
          )}

          {/* Action Box 2: Penomoran TU */}
          {(userRole === 'tu' || userRole === 'admin') && suratTugas.status === 'MENUNGGU_PENOMORAN_TU' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex items-center space-x-2 text-blue-700 font-bold text-sm">
              <Hash className="w-5 h-5 text-amber-500" />
              <span>Aksi Penomoran Resmi TU</span>
            </div>

            <form onSubmit={handleTuSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Surat Tugas</label>
                <input
                  type="text"
                  required
                  value={tuForm.data.nomor_st}
                  onChange={(e) => tuForm.setData('nomor_st', e.target.value)}
                  placeholder="Masukkan nomor surat tugas"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor SPD</label>
                <input
                  type="text"
                  required
                  value={tuForm.data.nomor_spd}
                  onChange={(e) => tuForm.setData('nomor_spd', e.target.value)}
                  placeholder="Masukkan nomor SPD"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={tuForm.processing}
                className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs py-2.5 rounded-xl transition shadow"
              >
                Simpan Penomoran TU & Terbitkan
              </button>
            </form>
          </div>
          )}

          {/* Action Box 3: PPK Digital Signature */}
          {(userRole === 'ppk' || userRole === 'admin') && suratTugas.status === 'SELESAI_TERBIT' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex items-center space-x-2 text-emerald-700 font-bold text-sm">
              <Stamp className="w-5 h-5 text-emerald-600" />
              <span>Sematkan TTD Digital PPK</span>
            </div>

            <form onSubmit={handlePpkSubmit}>
              <button
                type="submit"
                disabled={ppkForm.processing}
                className={`w-full font-bold text-xs py-2.5 rounded-xl transition shadow flex items-center justify-center space-x-2 ${
                  suratTugas.is_ppk_signed
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                <Stamp className="w-4 h-4" />
                <span>
                  {suratTugas.is_ppk_signed ? 'Batalkan TTD Digital PPK' : 'Sematkan TTD Digital PPK'}
                </span>
              </button>
            </form>
          </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
