import React, { useEffect, useState } from 'react';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatDate } from './Partials/printHelpers';
import SuratTugasSheet from './Partials/SuratTugasSheet';
import SpdSheet from './Partials/SpdSheet';
import LampiranMatriksSheet from './Partials/LampiranMatriksSheet';
import VisumRampunganSheet from './Partials/VisumRampunganSheet';
import RpdSheet from './Partials/RpdSheet';
import DaftarNominatifSheet from './Partials/DaftarNominatifSheet';
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
  Check,
  RotateCcw,
  X,
} from 'lucide-react';

function DocxInlinePreview({ url, label }) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetch(url, { credentials: 'same-origin' })
      .then((res) => {
        if (!res.ok) throw new Error('Gagal memuat berkas dokumen.');
        return res.arrayBuffer();
      })
      .then((arrayBuffer) =>
        import('mammoth').then((mammoth) =>
          (mammoth.default || mammoth).convertToHtml({ arrayBuffer })
        )
      )
      .then((result) => {
        if (active) {
          setHtml(result.value || '<p>Dokumen kosong.</p>');
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Gagal menampilkan pratinjau DOCX.');
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [url]);

  if (loading) {
    return (
      <div className="p-6 text-center text-xs text-slate-500 bg-slate-50">
        Memuat pratinjau dokumen {label}...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-xs text-rose-600 bg-rose-50">
        {error} Silakan gunakan tombol Buka Tab Baru atau Unduh di atas.
      </div>
    );
  }

  return (
    <div className="max-h-[40rem] overflow-y-auto bg-slate-100 p-4 sm:p-6">
      <div
        className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 sm:p-8 text-xs leading-relaxed text-slate-800 shadow-sm prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

export default function Show({
  suratTugas,
  userRole,
  authUserId,
  attachments = {},
  logs = [],
  runningNumber = { lastSt: null, lastSpd: null },
  kapus = {},
  ppk = {},
  bendahara = {},
}) {
  const { auth } = usePage().props;
  const permissions = Array.isArray(auth?.permissions) ? auth.permissions : [];
  const can = (moduleKey) => userRole === 'admin' || permissions.includes(moduleKey);
  const actorDrafts = suratTugas.draft_data || {};
  const [copiedKey, setCopiedKey] = useState(null);
  const [activeDocTab, setActiveDocTab] = useState('st');

  // State modal Tarik Kembali
  const [showTarikModal, setShowTarikModal] = useState(false);
  const [alasanTarik, setAlasanTarik] = useState('');
  const [tarikProcessing, setTarikProcessing] = useState(false);

  // State modal Tarik Nomor Surat (TU)
  const [showTarikNomorModal, setShowTarikNomorModal] = useState(false);
  const [alasanTarikNomor, setAlasanTarikNomor] = useState('');
  const [tarikNomorProcessing, setTarikNomorProcessing] = useState(false);

  const canTarikKembali = suratTugas.status === 'MENUNGGU_PENOMORAN_TU'
    && (userRole === 'admin' || (can('surat_tugas.tarik_kembali') && suratTugas.user_id === authUserId));

  const canTarikNomor = suratTugas.status === 'SELESAI_TERBIT'
    && (userRole === 'admin' || can('surat_tugas.tarik_nomor'));

  const handleTarikKembali = () => {
    if (!alasanTarik.trim()) return;
    setTarikProcessing(true);
    router.post(`/surat-tugas/${suratTugas.id}/tarik-kembali`, { alasan: alasanTarik }, {
      onFinish: () => {
        setTarikProcessing(false);
        setShowTarikModal(false);
        setAlasanTarik('');
      },
    });
  };

  const handleTarikNomor = () => {
    if (!alasanTarikNomor.trim()) return;
    setTarikNomorProcessing(true);
    router.post(`/surat-tugas/${suratTugas.id}/tarik-nomor`, { alasan: alasanTarikNomor }, {
      onFinish: () => {
        setTarikNomorProcessing(false);
        setShowTarikNomorModal(false);
        setAlasanTarikNomor('');
      },
    });
  };

  const pegawaiList = Array.isArray(suratTugas.pegawai_list) ? suratTugas.pegawai_list : [];
  const tujuanPerjalanan = [
    suratTugas.tempat_tujuan,
    suratTugas.kategori_perjalanan === 'LUAR_NEGERI' ? suratTugas.negara_tujuan : null,
  ]
    .filter(Boolean)
    .join(', ') || '-';

  const tuDraft = actorDrafts.tu || {};
  const nomorST = suratTugas.nomor_st || tuDraft.nomor_st || '[Belum Diisi TU]';
  const nomorSPD = suratTugas.nomor_spd || tuDraft.nomor_spd || '[Belum Diisi TU]';
  const tanggalSuratRaw = suratTugas.tanggal_surat || tuDraft.tanggal_surat || suratTugas.tanggal_nota;
  const tanggalSurat = formatDate(tanggalSuratRaw);
  const tanggalBerangkat = formatDate(suratTugas.tanggal_berangkat);
  const tanggalKembali = formatDate(suratTugas.tanggal_kembali);
  const ppkNama =
    ppk?.nama ||
    suratTugas.ppk_nama_snapshot ||
    suratTugas.ppk?.pegawai?.nama ||
    suratTugas.ppk?.name ||
    '-';
  const ppkNip =
    ppk?.nip ||
    suratTugas.ppk_nip_snapshot ||
    suratTugas.ppk?.pegawai?.nip ||
    '-';
  const kapusNama = kapus?.nama || suratTugas.kapus_nama_snapshot || null;
  const kapusNip = kapus?.nip || suratTugas.kapus_nip_snapshot || null;
  const tahunAnggaran =
    tanggalSuratRaw?.slice(0, 4) ||
    suratTugas.tanggal_berangkat?.slice(0, 4) ||
    new Date().getFullYear().toString();

  const sheetCommonProps = {
    suratTugas,
    pegawaiList,
    nomorST,
    nomorSPD,
    tanggalSurat,
    tanggalSuratRaw,
    tanggalBerangkat,
    tanggalKembali,
    tujuanPerjalanan,
    tahunAnggaran,
    ppkNama,
    ppkNip,
    kapusNama,
    kapusNip,
    bendaharaNama: bendahara?.nama || suratTugas.bendahara_nama_snapshot || null,
    bendaharaNip: bendahara?.nip || suratTugas.bendahara_nip_snapshot || null,
  };

  const canViewRpd = can('pembiayaan.cetak_rpd_nominatif') || can('pembiayaan.manage_bendahara');

  const documentTabs = [
    { id: 'st', label: '1. Surat Tugas (ST)' },
    { id: 'spd', label: '2. Lembar SPD' },
    { id: 'lampiran', label: '3. Lampiran SPD' },
    { id: 'visum', label: '4. Lembar Visum' },
    ...(canViewRpd ? [
      { id: 'rpd', label: '5. RPD (Rincian Biaya)' },
      { id: 'nominatif', label: '6. Daftar Nominatif' },
    ] : []),
  ];

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
  const rawTanggalSurat = actorDrafts.tu?.tanggal_surat || suratTugas.tanggal_surat || new Date().toISOString().split('T')[0];
  const tuForm = useForm({
    actor: 'tu',
    nomor_st: actorDrafts.tu?.nomor_st || suratTugas.nomor_st || '',
    nomor_spd: actorDrafts.tu?.nomor_spd || suratTugas.nomor_spd || '',
    tanggal_surat: typeof rawTanggalSurat === 'string' && rawTanggalSurat.includes('T')
      ? rawTanggalSurat.slice(0, 10)
      : rawTanggalSurat,
  });

  // PPK Signature Form
  const ppkForm = useForm({
    actor: 'ppk',
    is_ppk_signed: actorDrafts.ppk?.is_ppk_signed ?? !suratTugas.is_ppk_signed,
    catatan_ppk: actorDrafts.ppk?.catatan_ppk || '',
  });

  const handleKapusSubmit = (e) => {
    e.preventDefault();
    if (kapusForm.processing) return;
    kapusForm.post(`/surat-tugas/${suratTugas.id}/disposisi`);
  };

  const handleTuSubmit = (e) => {
    e.preventDefault();
    if (tuForm.processing) return;
    tuForm.post(`/surat-tugas/${suratTugas.id}/penomoran`);
  };

  const handlePpkSubmit = (e) => {
    e.preventDefault();
    if (ppkForm.processing) return;
    ppkForm.post(`/surat-tugas/${suratTugas.id}/sign-ppk`);
  };

  return (
    <AdminLayout title="Detail Surat Tugas">
      <Head title="Detail Surat Tugas - Pusdiklat Kemlu" />

      {/* Modal Tarik Kembali */}
      {showTarikModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Tarik Kembali Surat</h3>
                <p className="text-xs text-slate-500 mt-0.5">Surat akan dikembalikan ke Draft. Anda harus mengajukan ulang setelah diperbaiki.</p>
              </div>
              <button
                type="button"
                onClick={() => { setShowTarikModal(false); setAlasanTarik(''); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 space-y-1">
              <p className="font-bold">⚠ Perhatian</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Persetujuan Kapus akan dibatalkan dan harus diproses ulang.</li>
                <li>Fitur ini hanya berlaku sebelum TU memberikan nomor resmi.</li>
                <li>Alasan penarikan akan tercatat dalam jejak audit.</li>
              </ul>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alasan Penarikan <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows="3"
                value={alasanTarik}
                onChange={(e) => setAlasanTarik(e.target.value)}
                placeholder="Contoh: Terdapat perubahan tanggal keberangkatan, perlu revisi personel, dll."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                maxLength={500}
              />
              <p className="text-[10px] text-slate-400 mt-0.5 text-right">{alasanTarik.length}/500</p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setShowTarikModal(false); setAlasanTarik(''); }}
                disabled={tarikProcessing}
                className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleTarikKembali}
                disabled={tarikProcessing || !alasanTarik.trim()}
                className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 py-2.5 text-xs font-bold transition shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                {tarikProcessing ? 'Memproses...' : 'Ya, Tarik Kembali'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tarik Nomor Surat (TU) */}
      {showTarikNomorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Tarik Nomor Surat (ST &amp; SPD)</h3>
                <p className="text-xs text-slate-500 mt-0.5">Nomor resmi akan dibatalkan dan surat dikembalikan ke Draft agar dapat direvisi menyeluruh.</p>
              </div>
              <button
                type="button"
                onClick={() => { setShowTarikNomorModal(false); setAlasanTarikNomor(''); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 space-y-1">
              <p className="font-bold">⚠ Perhatian Penarikan Nomor Surat</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Nomor ST (<strong>{suratTugas.nomor_st || '-'}</strong>) dan Nomor SPD (<strong>{suratTugas.nomor_spd || '-'}</strong>) akan dihapus.</li>
                <li>Status surat kembali ke <strong>Draft</strong> sehingga Sesparlu/pengusul dapat merevisi seluruh persuratan termasuk <strong>RPD &amp; Daftar Nominatif</strong>.</li>
                <li>TTD digital PPK dan status persetujuan pembiayaan Bendahara akan di-reset untuk peninjauan ulang.</li>
                <li>Riwayat penarikan nomor akan tercatat pada jejak audit.</li>
              </ul>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alasan Penarikan Nomor Surat <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows="3"
                value={alasanTarikNomor}
                onChange={(e) => setAlasanTarikNomor(e.target.value)}
                placeholder="Contoh: Perubahan tanggal keberangkatan, perubahan personel, atau revisi rincian biaya RPD/Nominatif."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400"
                maxLength={500}
              />
              <p className="text-[10px] text-slate-400 mt-0.5 text-right">{alasanTarikNomor.length}/500</p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setShowTarikNomorModal(false); setAlasanTarikNomor(''); }}
                disabled={tarikNomorProcessing}
                className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleTarikNomor}
                disabled={tarikNomorProcessing || !alasanTarikNomor.trim()}
                className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white py-2.5 text-xs font-bold transition shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                {tarikNomorProcessing ? 'Memproses...' : 'Ya, Tarik Nomor Surat'}
              </button>
            </div>
          </div>
        </div>
      )}

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
          </h1>
          <p className="text-xs text-slate-500">Monitoring status persetujuan, penomoran resmi, dan TTD digital PPK</p>
        </div>

        {suratTugas.status === 'DISPOSISI_KAPUS_STOP' && (
          <div className="w-full sm:max-w-md bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm font-bold text-red-700">Dihentikan oleh Kapus</p>
            {suratTugas.catatan_kapus && (
              <p className="text-xs text-red-600 mt-1">Catatan: {suratTugas.catatan_kapus}</p>
            )}
            {(userRole === 'admin' || (
              can('surat_tugas.create')
              && suratTugas.user_id === authUserId
            )) && (
              <button
                data-action-btn="true"
                onClick={() => {
                  if (confirm('Ajukan ulang surat ini sebagai draft baru?')) {
                    router.post(`/surat-tugas/${suratTugas.id}/ajukan-ulang`);
                  }
                }}
                className="mt-3 px-3 py-1.5 text-xs font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
              >
                Ajukan Ulang (kembalikan ke Draft)
              </button>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {(userRole === 'admin' || (
            can('surat_tugas.create')
            && suratTugas.user_id === authUserId
          )) && ['DRAFT', 'DISPOSISI_KAPUS_YA', 'DISPOSISI_KAPUS_REVISI'].includes(suratTugas.status) && (
            <Link
              href={`/surat-tugas/${suratTugas.id}/draft`}
              className="inline-flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow transition text-sm"
            >
              <PenTool className="w-4 h-4" />
              <span>{suratTugas.status === 'DISPOSISI_KAPUS_REVISI' ? 'Perbaiki Draft ST & SPD' : 'Lanjutkan Draft ST & SPD'}</span>
            </Link>
          )}

          {/* Tombol Tarik Kembali: hanya saat MENUNGGU_PENOMORAN_TU & pemilik/admin */}
          {canTarikKembali && (
            <button
              type="button"
              onClick={() => setShowTarikModal(true)}
              className="inline-flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold px-5 py-2.5 rounded-xl shadow-sm transition text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              <span>Tarik Kembali untuk Revisi</span>
            </button>
          )}

          {/* Tombol Tarik Nomor Surat: saat SELESAI_TERBIT & role memiliki RBAC surat_tugas.tarik_nomor (default TU) */}
          {canTarikNomor && (
            <button
              type="button"
              onClick={() => setShowTarikNomorModal(true)}
              className="inline-flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold px-5 py-2.5 rounded-xl shadow-sm transition text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              <span>Tarik Nomor Surat</span>
            </button>
          )}

          {can('surat_tugas.print') && (can('surat_tugas.penomoran') || can('surat_tugas.disposisi')) && ['MENUNGGU_DISPOSISI_KAPUS', 'MENUNGGU_PENOMORAN_TU'].includes(suratTugas.status) && (
            <Link
              href={`/surat-tugas/${suratTugas.id}/cetak`}
              className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 transition text-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Pratinjau Dokumen</span>
            </Link>
          )}

          {/* Semua user yang berkaitan dapat melihat & mencetak dokumen ketika sudah SELESAI_TERBIT */}
          {can('surat_tugas.print') && suratTugas.status === 'SELESAI_TERBIT' && (
            <Link
              href={`/surat-tugas/${suratTugas.id}/cetak`}
              className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 transition text-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Lihat & Cetak Surat (ST & SPD)</span>
            </Link>
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
                <span className="ml-1 text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase font-bold">({suratTugas.user?.role === 'sespalu' ? 'sesparlu' : (suratTugas.user?.role || 'user')})</span>
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
              <div>
                <span className="text-slate-500">Tujuan Perjalanan:</span>
                <p className="font-bold text-slate-900">{suratTugas.tempat_tujuan}</p>
                <p className="text-slate-500 text-[11px]">Dari: {suratTugas.tempat_berangkat}</p>
              </div>

              <div>
                <span className="text-slate-500">Waktu & Durasi:</span>
                <p className="font-bold text-slate-900">{suratTugas.tanggal_berangkat} s/d {suratTugas.tanggal_kembali}</p>
                <p className="text-amber-600 font-bold text-[11px]">{suratTugas.durasi_hari} Hari Dinas</p>
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

          {/* Pratinjau Draft / Naskah Surat Tugas & SPD */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    {suratTugas.nomor_st ? 'Naskah Resmi Surat Tugas & SPD' : 'Draft Surat Tugas & SPD'}
                  </h3>
                  {!suratTugas.nomor_st && (
                    <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                      Draft • Nomor Surat Belum Diisi TU
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Pratinjau langsung naskah Surat Tugas, SPD, Lampiran, Visum, RPD, dan Daftar Nominatif sesuai data usulan.
                </p>
              </div>

              {can('surat_tugas.print') && (
                suratTugas.status === 'SELESAI_TERBIT' ||
                can('surat_tugas.disposisi') ||
                can('surat_tugas.penomoran') ||
                (suratTugas.status === 'MENUNGGU_PENOMORAN_TU' && suratTugas.user_id === authUserId)
              ) && (
                <Link
                  href={
                    activeDocTab === 'rpd'
                      ? route('surat-tugas.cetak-rpd', suratTugas.id)
                      : activeDocTab === 'nominatif'
                        ? route('surat-tugas.cetak-nominatif', suratTugas.id)
                        : `/surat-tugas/${suratTugas.id}/cetak?doc=${activeDocTab}`
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Buka Layar Cetak Penuh</span>
                </Link>
              )}
            </div>

            {/* Tab Dokumen */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
              {documentTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveDocTab(tab.id)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    activeDocTab === tab.id
                      ? 'bg-[#0F2C59] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Lembar Pratinjau */}
            <div className="overflow-x-auto rounded-xl bg-slate-100 p-3 sm:p-5 border border-slate-200 text-black">
              <style>{`
                .print-preview-sheet table td,
                .print-preview-sheet table th {
                  padding: 0.5rem !important;
                }
                .print-sheet-lampiran {
                  box-sizing: border-box;
                  padding: 10mm;
                }
                .print-sheet-visum {
                  box-sizing: border-box;
                  padding: 15mm 20mm;
                }
                .spd-brand img { width: auto; height: 5rem; object-fit: contain; }
                .spd-brand-name { margin-top: 0.5mm; font-size: 8pt; font-weight: 800; line-height: 1.1; }
                .spd-brand-country { margin-top: 0.8mm; font-size: 6pt; letter-spacing: 1.5pt; line-height: 1; font-weight: 700; }
                .spd-annex { margin-left: 5mm; font-size: 5.5pt; line-height: 1.2; }
                .visum-entry-cell { position: relative; }
                .visum-signature { position: absolute; right: 0; bottom: 2mm; left: 0; display: flex; flex-direction: column; align-items: center; white-space: nowrap; }
                .visum-signature-brackets { display: flex; width: 100%; height: 6mm; align-items: flex-end; justify-content: space-between; padding: 0 12mm; line-height: 1; }
                .visum-signature-nip { margin: 1mm 0 0; line-height: 1; }
                .visum-ppk-cell { position: relative; }
                .visum-ppk-signature { position: absolute; right: 2mm; bottom: 2mm; left: 2mm; text-align: center; line-height: 1.15; }
                .print-sheet-st, .print-sheet-spd, .print-sheet-visum, .print-sheet-rpd {
                  box-sizing: border-box;
                  width: 100%;
                  max-width: 210mm;
                  margin: 0.5rem auto;
                  background: white;
                  border: 1px solid #cbd5e1;
                  box-shadow: 0 10px 15px -3px rgb(15 23 42 / 0.08);
                  font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
                }
                .print-sheet-lampiran {
                  box-sizing: border-box;
                  width: 100%;
                  max-width: 297mm;
                  margin: 0.5rem auto;
                  background: white;
                  border: 1px solid #cbd5e1;
                  box-shadow: 0 10px 15px -3px rgb(15 23 42 / 0.08);
                  font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
                }
              `}</style>
              <SuratTugasSheet {...sheetCommonProps} isActive={activeDocTab === 'st'} />
              <SpdSheet {...sheetCommonProps} isActive={activeDocTab === 'spd'} />
              <LampiranMatriksSheet {...sheetCommonProps} isActive={activeDocTab === 'lampiran'} />
              <VisumRampunganSheet {...sheetCommonProps} isActive={activeDocTab === 'visum'} />
              {canViewRpd && (
                <>
                  <RpdSheet {...sheetCommonProps} isActive={activeDocTab === 'rpd'} />
                  <DaftarNominatifSheet {...sheetCommonProps} isActive={activeDocTab === 'nominatif'} />
                </>
              )}
            </div>
          </section>

          {(attachments.invitation || attachments.setneg) && (
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Lampiran Nota / Izin Setneg</h3>
                <p className="mt-1 text-xs text-slate-500">Dokumen yang dikirim Sesparlu untuk ditinjau dalam proses surat.</p>
              </div>
              {[{ key: 'invitation', label: 'Nota / Undangan' }, { key: 'setneg', label: 'Izin Setneg / Keppres' }]
                .filter(({ key }) => attachments[key])
                .map(({ key, label }) => {
                  const file = attachments[key];
                  const extension = (file.name || file.url || '').split('?')[0].split('.').pop()?.toLowerCase();

                  return (
                    <div key={key} className="overflow-hidden rounded-xl border border-slate-200">
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 px-4 py-3 border-b border-slate-200">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{label}</p>
                          <p className="mt-0.5 break-all text-xs text-slate-500">{file.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
                          >
                            Buka Tab Baru
                          </a>
                          <a
                            href={file.download_url || `${file.url}?download=1`}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                          >
                            Unduh
                          </a>
                        </div>
                      </div>
                      {extension === 'pdf' ? (
                        <iframe
                          title={`Pratinjau ${label}`}
                          src={`${file.url}#toolbar=1&navpanes=0&view=FitH`}
                          className="h-[42rem] w-full bg-slate-100 border-0"
                        />
                      ) : ['jpg', 'jpeg', 'png', 'webp'].includes(extension) ? (
                        <div className="flex max-h-[42rem] justify-center overflow-auto bg-slate-100 p-4">
                          <img src={file.url} alt={`Pratinjau ${label}`} className="h-auto max-w-full object-contain rounded shadow-sm" />
                        </div>
                      ) : extension === 'docx' ? (
                        <DocxInlinePreview url={file.url} label={label} />
                      ) : (
                        <iframe
                          title={`Pratinjau ${label}`}
                          src={file.url}
                          className="h-[36rem] w-full bg-slate-100 border-0"
                        />
                      )}
                    </div>
                  );
                })}
            </section>
          )}
        </div>

        {/* Workflow Action Cards for Roles */}
        <div className="space-y-6">
          {/* Action Box 1: Disposisi Kapus */}
          {can('surat_tugas.disposisi') && suratTugas.status === 'MENUNGGU_DISPOSISI_KAPUS' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <div className="text-purple-700 font-bold text-sm">
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
                  <option value="YA">Setuju (Lanjut ke Penomoran TU)</option>
                  <option value="REVISI">Minta Revisi ke Sesparlu</option>
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
                  data-action-btn="true"
                  onClick={() => {
                    if (kapusForm.processing) return;
                    kapusForm.post(`/surat-tugas/${suratTugas.id}/actor-draft`, { preserveScroll: true });
                  }}
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
                  {kapusForm.processing ? 'Memproses...' : 'Proses Disposisi Kapus'}
                </button>
              </div>
            </form>
          </div>
          )}

          {/* Action Box 2: Penomoran TU */}
          {can('surat_tugas.penomoran') && suratTugas.status === 'MENUNGGU_PENOMORAN_TU' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="text-purple-700 font-bold text-sm">
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
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900">
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
              {Object.keys(tuForm.errors).length > 0 && (
                <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800 space-y-1">
                  <p className="font-bold">Penomoran belum dapat disimpan:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {Object.entries(tuForm.errors).map(([key, msg]) => (
                      <li key={key}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Surat Tugas</label>
                <input
                  type="text"
                  required
                  value={tuForm.data.nomor_st}
                  onChange={(e) => tuForm.setData('nomor_st', e.target.value)}
                  placeholder="Masukkan nomor surat tugas"
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${
                    tuForm.errors.nomor_st ? 'border-rose-400 bg-rose-50/40' : 'border-slate-300'
                  }`}
                />
                {tuForm.errors.nomor_st && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600">{tuForm.errors.nomor_st}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor SPD</label>
                <input
                  type="text"
                  required
                  value={tuForm.data.nomor_spd}
                  onChange={(e) => tuForm.setData('nomor_spd', e.target.value)}
                  placeholder="Masukkan nomor SPD"
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${
                    tuForm.errors.nomor_spd ? 'border-rose-400 bg-rose-50/40' : 'border-slate-300'
                  }`}
                />
                {tuForm.errors.nomor_spd && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600">{tuForm.errors.nomor_spd}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Surat Tugas & SPD</label>
                <input
                  type="date"
                  required
                  value={tuForm.data.tanggal_surat}
                  onChange={(e) => tuForm.setData('tanggal_surat', e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${
                    tuForm.errors.tanggal_surat ? 'border-rose-400 bg-rose-50/40' : 'border-slate-300'
                  }`}
                />
                {tuForm.errors.tanggal_surat && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600">{tuForm.errors.tanggal_surat}</p>
                )}
                <p className="text-[10px] text-slate-500 mt-1">Tanggal yang dicantumkan pada dokumen resmi</p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  data-action-btn="true"
                  onClick={() => {
                    if (tuForm.processing) return;
                    tuForm.post(`/surat-tugas/${suratTugas.id}/actor-draft`, { preserveScroll: true });
                  }}
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
                  {tuForm.processing ? 'Menyimpan...' : 'Simpan Penomoran TU & Terbitkan'}
                </button>
              </div>
            </form>
          </div>
          )}

          {/* Action Box 3: PPK Digital Signature */}
          {can('surat_tugas.sign_ppk') && suratTugas.status === 'SELESAI_TERBIT' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <div className="text-emerald-700 font-bold text-sm">
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
                  data-action-btn="true"
                  onClick={() => {
                    if (ppkForm.processing) return;
                    ppkForm.post(`/surat-tugas/${suratTugas.id}/actor-draft`, { preserveScroll: true });
                  }}
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
                    {ppkForm.processing
                      ? 'Memproses...'
                      : suratTugas.is_ppk_signed
                        ? 'Batalkan TTD Digital PPK'
                        : 'Sematkan TTD Digital PPK'}
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
          <h3 className="font-bold text-slate-900 text-sm">Jejak Audit Proses</h3>
          <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">{logs?.length || 0} aktivitas</span>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Setiap perubahan status, disposisi, penomoran, TTD, cetak, dan hapus tercatat otomatis.
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
                      <span>oleh <strong className="text-slate-800">{log.user?.name || 'Sistem'} ({log.user?.role === 'sespalu' ? 'sesparlu' : (log.user?.role || '-')})</strong></span>
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
