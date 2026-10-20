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
  PenTool,
  Sparkles,
  Stamp,
  UserCog,
  History,
  ScrollText,
  Copy,
  Check
} from 'lucide-react';

export default function Show({ suratTugas, userRole, authUserId, attachments = {}, logs = [], runningNumber = { lastSt: null, lastSpd: null } }) {
  const actorDrafts = suratTugas.draft_data || {};
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  // Kapus Disposisi Form
  const kapusForm = useForm({
    actor: 'kapus',
    kapus_decision: actorDrafts.kapus?.kapus_decision || suratTugas.kapus_decision || 'YA',
    catatan_kapus: actorDrafts.kapus?.catatan_kapus || suratTugas.catatan_kapus || '',
  });

  // TU Penomoran Form
  const tuForm = useForm({
    actor: 'tu',
    nomor_st: actorDrafts.tu?.nomor_st || suratTugas.nomor_st || '',
    nomor_spd: actorDrafts.tu?.nomor_spd || suratTugas.nomor_spd || '',
    tanggal_surat: actorDrafts.tu?.tanggal_surat || suratTugas.tanggal_surat || new Date().toISOString().split('T')[0],
  });

  // PPK Signature Form
  const ppkForm = useForm({
    actor: 'ppk',
    is_ppk_signed: actorDrafts.ppk?.is_ppk_signed ?? !suratTugas.is_ppk_signed,
    catatan_ppk: actorDrafts.ppk?.catatan_ppk || '',
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

  const workflowStatus = {
    MENUNGGU_DISPOSISI_KAPUS: {
      label: 'Nota masuk ke Kapus',
      message: 'Nota/undangan sudah dikirim Sespalu ke Kapus dan sedang menunggu persetujuan.',
    },
    DISPOSISI_KAPUS_YA: {
      label: 'Disetujui Kapus',
      message: 'Kapus menyetujui penugasan. Sespalu dapat melanjutkan draft Surat Tugas dan SPD pada Tahap 3.',
    },
    DISPOSISI_KAPUS_REVISI: {
      label: 'Perlu revisi Sespalu',
      message: 'Kapus meminta perbaikan nota. Perbarui draft lalu kirim kembali untuk persetujuan.',
    },
    DISPOSISI_KAPUS_STOP: {
      label: 'Dihentikan Kapus',
      message: 'Kapus menghentikan proses surat ini.',
    },
    DRAFT: {
      label: 'Draft Sespalu',
      message: 'Isian masih disimpan sebagai draft dan belum dikirim ke Kapus.',
    },
    MENUNGGU_PENOMORAN_TU: {
      label: 'Menunggu verifikasi dan nomor TU',
      message: 'Draft Sespalu sudah dikirim. TU sedang memeriksa dan mengisi nomor resmi Surat Tugas serta SPD.',
    },
    SELESAI_TERBIT: {
      label: 'Selesai diterbitkan TU',
      message: 'Nomor resmi sudah diterbitkan TU. Dokumen siap digunakan; TTD PPK dipantau terpisah.',
    },
  }[suratTugas.status] || { label: suratTugas.status, message: 'Status proses surat.' };

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

        <div className="flex flex-wrap items-center gap-2">
          {(userRole === 'admin' || (
            (userRole === 'pemohon' || userRole === 'sespalu')
            && suratTugas.user_id === authUserId
          )) && ['DISPOSISI_KAPUS_YA', 'DISPOSISI_KAPUS_REVISI'].includes(suratTugas.status) && (
            <Link
              href={`/surat-tugas/${suratTugas.id}/draft`}
              className="inline-flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow transition text-sm"
            >
              <PenTool className="w-4 h-4" />
              <span>{suratTugas.status === 'DISPOSISI_KAPUS_REVISI' ? 'Perbaiki Nota' : 'Lanjutkan Draft ST & SPD'}</span>
            </Link>
          )}

          {(userRole === 'tu' || userRole === 'admin') && ['MENUNGGU_PENOMORAN_TU', 'SELESAI_TERBIT'].includes(suratTugas.status) && (
            <Link
              href={`/surat-tugas/${suratTugas.id}/cetak`}
              className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 transition text-sm"
            >
              <Printer className="w-4 h-4" />
              <span>{suratTugas.status === 'SELESAI_TERBIT' ? 'Cetak Dokumen Resmi PDF' : 'Pratinjau Dokumen'}</span>
            </Link>
          )}

          {/* Cetak luas: kapus/ppk/pemilik saat sudah terbit */}
          {['kapus','ppk','pemohon','sespalu'].includes(userRole) && suratTugas.status === 'SELESAI_TERBIT' && (
            ((userRole === 'pemohon' || userRole === 'sespalu') ? suratTugas.user_id === authUserId : true) && (
              <a
                href={`/surat-tugas/${suratTugas.id}/cetak`}
                target="_blank"
                className="inline-flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-700 text-white font-bold px-5 py-2.5 rounded-xl shadow transition text-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak PDF</span>
              </a>
            )
          )}
        </div>
      </div>

      {/* Grid: Document Summary & Workflow Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Document Info Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Detail Ringkasan</span>
                <span className="bg-slate-100 text-slate-700 text-xs font-mono font-bold px-2.5 py-0.5 rounded">
                  Kategori: {suratTugas.kategori_perjalanan}
                </span>
              </div>
              <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                Diajukan oleh: <strong className="text-slate-800">{suratTugas.user?.name || 'Sistem'}</strong>
                <span className="ml-1 text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase font-bold">({suratTugas.user?.role || 'user'})</span>
              </div>
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

          {(attachments.invitation || attachments.setneg) && (
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Lampiran Nota / Izin Setneg</h3>
                <p className="mt-1 text-xs text-slate-500">Dokumen yang dikirim Sespalu untuk ditinjau dalam proses surat.</p>
              </div>
              {[{ key: 'invitation', label: 'Nota / Undangan' }, { key: 'setneg', label: 'Izin Setneg / Keppres' }]
                .filter(({ key }) => attachments[key])
                .map(({ key, label }) => {
                  const file = attachments[key];
                  const extension = file.name.split('.').pop()?.toLowerCase();

                  return (
                    <div key={key} className="overflow-hidden rounded-xl border border-slate-200">
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 px-4 py-3">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{label}</p>
                          <p className="mt-0.5 break-all text-xs text-slate-500">{file.name}</p>
                        </div>
                        <a href={file.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue-700 hover:text-blue-900">
                          Buka / Unduh
                        </a>
                      </div>
                      {extension === 'pdf' ? (
                        <iframe title={`Pratinjau ${label}`} src={file.url} className="h-[32rem] w-full bg-slate-100" />
                      ) : ['jpg', 'jpeg', 'png'].includes(extension) ? (
                        <div className="flex max-h-[32rem] justify-center overflow-auto bg-slate-100 p-4">
                          <img src={file.url} alt={`Pratinjau ${label}`} className="h-auto max-w-full object-contain" />
                        </div>
                      ) : (
                        <p className="p-4 text-xs text-slate-500">Buka atau unduh dokumen untuk meninjau isinya.</p>
                      )}
                    </div>
                  );
                })}
            </section>
          )}
        </div>

        {/* Workflow Action Cards for Roles */}
        <div className="space-y-6">
          {/* Status Overview Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Status Workflow</h3>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Status Proses:</span>
                <span className="font-bold text-amber-600">{workflowStatus.label}</span>
              </div>
              <p className="leading-relaxed text-slate-700">{workflowStatus.message}</p>
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
                  <option value="YA">Setuju (Lanjut ke Draft Sespalu)</option>
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

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => kapusForm.post(`/surat-tugas/${suratTugas.id}/actor-draft`, { preserveScroll: true })}
                  disabled={kapusForm.processing}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Simpan Draft Kapus
                </button>
                <button
                  type="submit"
                  disabled={kapusForm.processing}
                  className="w-full bg-[#0F2C59] hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition shadow disabled:opacity-60"
                >
                  Proses Disposisi Kapus
                </button>
              </div>
            </form>
          </div>
          )}

          {/* Action Box 2: Penomoran TU */}
          {(userRole === 'tu' || userRole === 'admin') && suratTugas.status === 'MENUNGGU_PENOMORAN_TU' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-purple-700 font-bold text-sm">
                <Hash className="w-5 h-5 text-purple-600" />
                <span>Aksi Penomoran Resmi TU</span>
              </div>
              <span className="text-[11px] font-semibold bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-200">
                Khusus Petugas TU
              </span>
            </div>

            {/* Rujukan Nomor Surat Terakhir yang Diterbitkan */}
            {runningNumber && (runningNumber.lastSt || runningNumber.lastSpd) && (
              <div className="rounded-xl bg-purple-50/70 border border-purple-200/80 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Rujukan Nomor Terakhir Terbit</span>
                  </span>
                  <span className="text-[10px] text-purple-600">Panduan penomoran berurutan</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* ST Terakhir */}
                  <div className="bg-white rounded-lg p-2.5 border border-purple-100 shadow-2xs">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                      No. ST Terakhir:
                    </span>
                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <span className="font-mono font-bold text-slate-900 text-xs truncate">
                        {runningNumber.lastSt?.nomor_st || '-'}
                      </span>
                      {runningNumber.lastSt?.nomor_st && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => tuForm.setData('nomor_st', runningNumber.lastSt.nomor_st)}
                            className="text-[10px] font-semibold text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-1.5 py-0.5 rounded border border-purple-200 transition"
                            title="Salin nomor ini ke isian form"
                          >
                            Pakai Format
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(runningNumber.lastSt.nomor_st, 'st')}
                            className="p-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 border border-slate-200 transition"
                            title="Salin ke clipboard"
                          >
                            {copiedKey === 'st' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SPD Terakhir */}
                  <div className="bg-white rounded-lg p-2.5 border border-purple-100 shadow-2xs">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                      No. SPD Terakhir:
                    </span>
                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <span className="font-mono font-bold text-slate-900 text-xs truncate">
                        {runningNumber.lastSpd?.nomor_spd || '-'}
                      </span>
                      {runningNumber.lastSpd?.nomor_spd && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => tuForm.setData('nomor_spd', runningNumber.lastSpd.nomor_spd)}
                            className="text-[10px] font-semibold text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-1.5 py-0.5 rounded border border-purple-200 transition"
                            title="Salin nomor ini ke isian form"
                          >
                            Pakai Format
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(runningNumber.lastSpd.nomor_spd, 'spd')}
                            className="p-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 border border-slate-200 transition"
                            title="Salin ke clipboard"
                          >
                            {copiedKey === 'spd' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Surat Tugas & SPD</label>
                <input
                  type="date"
                  required
                  value={tuForm.data.tanggal_surat}
                  onChange={(e) => tuForm.setData('tanggal_surat', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
                <p className="text-[10px] text-slate-500 mt-1">Tanggal yang dicantumkan pada dokumen resmi</p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => tuForm.post(`/surat-tugas/${suratTugas.id}/actor-draft`, { preserveScroll: true })}
                  disabled={tuForm.processing}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Simpan Draft TU
                </button>
                <button
                  type="submit"
                  disabled={tuForm.processing}
                  className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs py-2.5 rounded-xl transition shadow disabled:opacity-60"
                >
                  Simpan Penomoran TU & Terbitkan
                </button>
              </div>
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

            <form onSubmit={handlePpkSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan review PPK (opsional)</label>
                <textarea
                  rows="2"
                  value={ppkForm.data.catatan_ppk}
                  onChange={(e) => ppkForm.setData('catatan_ppk', e.target.value)}
                  placeholder="Simpan catatan sebelum menyematkan TTD"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => ppkForm.post(`/surat-tugas/${suratTugas.id}/actor-draft`, { preserveScroll: true })}
                  disabled={ppkForm.processing}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Simpan Draft PPK
                </button>
                <button
                  type="submit"
                  disabled={ppkForm.processing}
                  className={`w-full font-bold text-xs py-2.5 rounded-xl transition shadow flex items-center justify-center space-x-2 disabled:opacity-60 ${
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
              </div>
            </form>
          </div>
          )}
        </div>
      </div>

      {/* Audit Trail / Riwayat Proses */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
        <div className="flex items-center space-x-2 mb-1">
          <History className="w-5 h-5 text-slate-700" />
          <h3 className="font-bold text-slate-900 text-sm">Jejak Audit Proses</h3>
          <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">{logs?.length || 0} aktivitas</span>
        </div>
        <p className="text-xs text-slate-500 mb-4 flex items-center gap-1">
          <ScrollText className="w-3.5 h-3.5" /> Setiap perubahan status, disposisi, penomoran, TTD, cetak, dan hapus tercatat otomatis.
        </p>
        {(!logs || logs.length === 0) ? (
          <div className="text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 text-center">
            Belum ada riwayat tercatat untuk surat ini.
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200" />
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="relative pl-6">
                  <span className={`absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full border-2 border-white shadow ring-1 ring-slate-200 ${
                    log.aksi?.includes('HAPUS') ? 'bg-red-500' :
                    log.aksi?.includes('TTD') ? 'bg-emerald-500' :
                    log.aksi?.includes('CETAK') ? 'bg-blue-500' :
                    log.aksi?.includes('DISPOSISI') || log.aksi?.includes('PENOMORAN') ? 'bg-amber-500' : 'bg-slate-400'
                  }`} />
                  <div className="bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900">{log.aksi}</span>
                      <span className="text-[11px] text-slate-500 font-mono">{log.created_at ? new Date(log.created_at).toLocaleString('id-ID') : '-'}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1">
                      {(log.dari_status || log.ke_status) && (
                        <span className="font-mono bg-white border border-slate-200 rounded px-1.5 py-0.5 mr-2">
                          {log.dari_status || '-'} → {log.ke_status || '-'}
                        </span>
                      )}
                      <span>oleh <strong className="text-slate-800">{log.user?.name || 'Sistem'} ({log.user?.role || '-'})</strong></span>
                    </div>
                    {(log.catatan || log.keterangan) && (
                      <p className="text-[11px] text-slate-500 mt-1 italic">“{log.catatan || log.keterangan}”</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
