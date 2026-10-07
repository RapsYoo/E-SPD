import React, { useEffect, useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import mammoth from 'mammoth';
import { 
  FileSignature, 
  Upload, 
  UserCheck, 
  PenTool, 
  Hash, 
  FileDigit,
  Printer, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  Trash2, 
  Globe, 
  Building, 
  Calendar, 
  MapPin, 
  Users, 
  Sparkles,
  ShieldCheck,
  Coins,
  Truck,
  FileText
} from 'lucide-react';

export default function Create({ pegawaiList, ppkList, unitKerjaList, tingkatBiayaList, jenisAngkutanList, userRole }) {
  const [activeStep, setActiveStep] = useState(1);
  const [selectedPegawaiIds, setSelectedPegawaiIds] = useState([]);
  const [selectedMasterId, setSelectedMasterId] = useState('');
  const [attachmentUrls, setAttachmentUrls] = useState({});
  const [docxPreviews, setDocxPreviews] = useState({});

  const { data, setData, post, processing, errors } = useForm({
    kategori_perjalanan: '',
    sumber_asal: '',
    nomor_nota: '',
    pengirim_nota: '',
    tanggal_nota: '',
    perihal_nota: '',
    file_undangan: null,
    file_izin_setneg: null,
    
    // Step 3
    ppk_id: '',
    tingkat_biaya_kode: '',
    jenis_angkutan_nama: '',
    tempat_berangkat: '',
    tempat_tujuan: '',
    negara_tujuan: '',
    no_setneg: '',
    tanggal_berangkat: '',
    tanggal_kembali: '',
    tanggal_surat: '',
    durasi_hari: 1,
    pegawai_ids: [],
  });

  useEffect(() => {
    const files = {
      invitation: data.file_undangan,
      setneg: data.file_izin_setneg,
    };
    const urls = Object.fromEntries(
      Object.entries(files)
        .filter(([, file]) => file)
        .map(([key, file]) => [key, URL.createObjectURL(file)])
    );
    let cancelled = false;

    setAttachmentUrls(urls);
    setDocxPreviews({});

    Object.entries(files).forEach(async ([key, file]) => {
      if (!file?.name.toLowerCase().endsWith('.docx')) return;

      try {
        const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        if (!cancelled) setDocxPreviews((previews) => ({ ...previews, [key]: result.value }));
      } catch {
        if (!cancelled) setDocxPreviews((previews) => ({ ...previews, [key]: 'Isi DOCX tidak dapat dipratinjau. Buka atau unduh berkas asli untuk memeriksanya.' }));
      }
    });

    return () => {
      cancelled = true;
      Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [data.file_undangan, data.file_izin_setneg]);

  const handleAddPegawai = () => {
    if (!selectedMasterId) return;
    const id = parseInt(selectedMasterId);
    if (!selectedPegawaiIds.includes(id)) {
      const updated = [...selectedPegawaiIds, id];
      setSelectedPegawaiIds(updated);
      setData('pegawai_ids', updated);
    }
  };

  const handleRemovePegawai = (id) => {
    const updated = selectedPegawaiIds.filter(item => item !== id);
    setSelectedPegawaiIds(updated);
    setData('pegawai_ids', updated);
  };

  const calcDays = (start, end) => {
    if (!start || !end) return 1;
    const d1 = new Date(start);
    const d2 = new Date(end);
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
  };

  const handleDateChange = (field, value) => {
    const newData = { ...data, [field]: value };
    const days = calcDays(
      field === 'tanggal_berangkat' ? value : data.tanggal_berangkat,
      field === 'tanggal_kembali' ? value : data.tanggal_kembali
    );
    setData({
      ...newData,
      durasi_hari: days,
    });
  };

  const handleTravelCategoryChange = (value) => {
    setData({
      ...data,
      kategori_perjalanan: value,
      ...(value === 'DALAM_NEGERI' ? { negara_tujuan: '', no_setneg: '' } : {}),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedPegawaiIds.length === 0) {
      alert('Pilih setidaknya 1 pegawai untuk ditugaskan!');
      return;
    }
    post('/surat-tugas');
  };

  return (
    <AdminLayout title="Generate Surat Tugas & SPD Baru">
      <Head title="Generate Surat Tugas & SPD Baru - e-SPD Pusdiklat Kemlu" />

      {/* Title */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
          <FileSignature className="w-4 h-4" />
          <span>Formulir 5-Tahap Terintegrasi</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Generate Surat Tugas & SPD Online</h1>
        <p className="text-xs text-slate-500">Isi Formulir 5-Tahap sesuai Alur Operasional Pusdiklat Kemlu</p>
      </div>

      {/* 5-Step Interactive Step Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 mb-6 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[700px] text-xs">
          {/* Step 1 */}
          <div
            aria-current={activeStep === 1 ? 'step' : undefined}
            className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl border font-bold transition ${
              activeStep === 1
                ? 'bg-[#0F2C59] text-white border-amber-500 shadow-md'
                : 'bg-slate-50 text-slate-600 border-slate-200 cursor-default'
            }`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-xs ${
              activeStep === 1 ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-700'
            }`}>
              1
            </span>
            <span>1. Upload Nota / Undangan</span>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-300" />

          {/* Step 2 */}
          <div
            aria-current={activeStep === 2 ? 'step' : undefined}
            className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl border font-bold transition ${
              activeStep === 2
                ? 'bg-[#0F2C59] text-white border-amber-500 shadow-md'
                : 'bg-slate-50 text-slate-600 border-slate-200 cursor-default'
            }`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-xs ${
              activeStep === 2 ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-700'
            }`}>
              2
            </span>
            <span>2. Disposisi Kapus</span>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-300" />

          {/* Step 3 */}
          <div
            aria-current={activeStep === 3 ? 'step' : undefined}
            className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl border font-bold transition ${
              activeStep === 3
                ? 'bg-[#0F2C59] text-white border-amber-500 shadow-md'
                : 'bg-slate-50 text-slate-600 border-slate-200 cursor-default'
            }`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-xs ${
              activeStep === 3 ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-700'
            }`}>
              3
            </span>
            <span>3. Draft Personel & SPD</span>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-300" />

          {/* Step 4 */}
          <div
            aria-current={activeStep === 4 ? 'step' : undefined}
            className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl border font-bold transition ${
              activeStep === 4
                ? 'bg-[#0F2C59] text-white border-amber-500 shadow-md'
                : 'bg-slate-50 text-slate-600 border-slate-200 cursor-default'
            }`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-xs ${
              activeStep === 4 ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-700'
            }`}>
              4
            </span>
            <span>4. Penomoran TU</span>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-300" />

          {/* Step 5 */}
          <div
            aria-current={activeStep === 5 ? 'step' : undefined}
            className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl border font-bold transition ${
              activeStep === 5
                ? 'bg-[#0F2C59] text-white border-amber-500 shadow-md'
                : 'bg-slate-50 text-slate-600 border-slate-200 cursor-default'
            }`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-xs ${
              activeStep === 5 ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-700'
            }`}>
              5
            </span>
            <span>5. Output & Cetak PDF</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ================= TAHAP 1: INPUT NOTA / UNDANGAN ================= */}
        {activeStep === 1 && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <Upload className="w-5 h-5 text-amber-500" />
                  <span>Tahap 1: Registrasi Nota / Undangan Masuk</span>
                </h2>
                <p className="text-xs text-slate-500">Pemicu awal usulan penugasan dinas (Input oleh Pemohon / Sespalu)</p>
              </div>
              <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full">
                Aktor: Pemohon / Sespalu
              </span>
            </div>

            {/* Kategori Perjalanan Dinas */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4">
              <label className="block text-xs font-bold text-blue-900 mb-2 flex items-center space-x-1.5">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>Kategori Perjalanan Dinas *</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`border-2 p-3 rounded-xl flex items-center space-x-3 cursor-pointer transition ${
                  data.kategori_perjalanan === 'DALAM_NEGERI' ? 'border-amber-500 bg-white shadow-sm' : 'border-slate-200 bg-slate-50'
                }`}>
                  <input
                    type="radio"
                    name="kategori_perjalanan"
                    value="DALAM_NEGERI"
                    required
                    checked={data.kategori_perjalanan === 'DALAM_NEGERI'}
                    onChange={(e) => handleTravelCategoryChange(e.target.value)}
                    className="text-amber-500 focus:ring-amber-500"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-900">Perjalanan Dalam Negeri</span>
                    <span className="text-[10px] text-slate-500">Wilayah Indonesia (Provinsi / Kabupaten / Kota)</span>
                  </div>
                </label>

                <label className={`border-2 p-3 rounded-xl flex items-center space-x-3 cursor-pointer transition ${
                  data.kategori_perjalanan === 'LUAR_NEGERI' ? 'border-amber-500 bg-white shadow-sm' : 'border-slate-200 bg-slate-50'
                }`}>
                  <input
                    type="radio"
                    name="kategori_perjalanan"
                    value="LUAR_NEGERI"
                    checked={data.kategori_perjalanan === 'LUAR_NEGERI'}
                    onChange={(e) => handleTravelCategoryChange(e.target.value)}
                    className="text-amber-500 focus:ring-amber-500"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-900">Perjalanan Luar Negeri (LN)</span>
                    <span className="text-[10px] text-slate-500">Memerlukan Izin Setneg & Paspor Dinas</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sumber Nota / Undangan *</label>
                <select
                  value={data.sumber_asal}
                  onChange={(e) => setData('sumber_asal', e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="" disabled>Pilih sumber nota / undangan</option>
                  <option value="EKSTERNAL">Pihak Eksternal (Instansi Luar / Universitas / Lembaga)</option>
                  <option value="INTERNAL">Internal Sespalu / Pusdiklat Kemlu</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Nota / Undangan Masuk *</label>
                <input
                  type="text"
                  required
                  value={data.nomor_nota}
                  onChange={(e) => setData('nomor_nota', e.target.value)}
                  placeholder="Masukkan nomor nota / undangan"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Instansi / Unit Pengirim Undangan *</label>
                <input
                  type="text"
                  required
                  value={data.pengirim_nota}
                  onChange={(e) => setData('pengirim_nota', e.target.value)}
                  placeholder="Masukkan instansi / unit pengirim"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Undangan *</label>
                <input
                  type="date"
                  required
                  value={data.tanggal_nota}
                  onChange={(e) => setData('tanggal_nota', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Perihal Undangan / Uraian Tugas *</label>
              <textarea
                rows="3"
                required
                value={data.perihal_nota}
                onChange={(e) => setData('perihal_nota', e.target.value)}
                placeholder="Masukkan perihal undangan / uraian tugas"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              ></textarea>
            </div>

            <div className={`grid grid-cols-1 ${data.kategori_perjalanan === 'LUAR_NEGERI' ? 'sm:grid-cols-2' : ''} gap-4`}>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Upload File PDF Scan Undangan (Maks. 10 MB)</label>
                <label className="relative flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-center text-xs text-slate-600 transition hover:border-blue-400 hover:bg-blue-50">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={(e) => setData('file_undangan', e.target.files[0] || null)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                  <Upload className="h-5 w-5 text-slate-400" />
                  <span>{data.file_undangan?.name || 'Klik untuk mengunggah scan undangan'}</span>
                  <span className="text-[10px] text-slate-400">PDF, JPG, atau PNG</span>
                </label>
                {errors.file_undangan && <p className="mt-1 text-xs text-red-600">{errors.file_undangan}</p>}
              </div>

              {data.kategori_perjalanan === 'LUAR_NEGERI' && (
                <div>
                  <label className="block text-xs font-semibold text-amber-800 mb-1">Upload Izin Setneg / Keppres (Wajib untuk Dinas LN) *</label>
                  <label className="relative flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 px-4 py-4 text-center text-xs text-amber-900 transition hover:bg-amber-100">
                    <input
                      type="file"
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      required
                      onChange={(e) => setData('file_izin_setneg', e.target.files[0] || null)}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                    <Upload className="h-5 w-5 text-amber-600" />
                    <span>{data.file_izin_setneg?.name || 'Klik untuk mengunggah Surat Persetujuan Setneg'}</span>
                    <span className="text-[10px] text-amber-700">PDF atau DOCX, maks. 10 MB</span>
                  </label>
                  {errors.file_izin_setneg && <p className="mt-1 text-xs text-red-600">{errors.file_izin_setneg}</p>}
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="inline-flex items-center space-x-2 bg-[#0F2C59] hover:bg-slate-800 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-lg transition"
              >
                <span>Lanjut ke Disposisi Kapus (Tahap 2)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= TAHAP 2: DISPOSISI KAPUS ================= */}
        {activeStep === 2 && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <UserCheck className="w-5 h-5 text-amber-500" />
                  <span>Tahap 2: Meninjau Nota & Simulasi Disposisi Kapus</span>
                </h2>
                <p className="text-xs text-slate-500">Persetujuan & Instruksi Kepala Pusat Pendidikan dan Pelatihan</p>
              </div>
              <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full">
                Aktor: Kapus (Kepala Pusat)
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
              <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Ringkasan Nota / Undangan:</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                <div>Nomor Nota: <strong className="font-mono text-slate-900">{data.nomor_nota}</strong></div>
                <div>Pengirim: <strong>{data.pengirim_nota}</strong></div>
                <div className="sm:col-span-2">Perihal: <p className="font-medium text-slate-900 mt-0.5">{data.perihal_nota}</p></div>
              </div>
            </div>

            <section className="space-y-3" aria-labelledby="kapus-attachments-title">
              <div className="flex items-center justify-between">
                <h3 id="kapus-attachments-title" className="text-sm font-bold text-slate-900">Lampiran untuk Ditinjau Kapus</h3>
                <span className="text-xs text-slate-500">Berkas yang diunggah pada Tahap 1</span>
              </div>

              {[
                { key: 'invitation', label: 'Nota / Undangan', file: data.file_undangan },
                ...(data.kategori_perjalanan === 'LUAR_NEGERI'
                  ? [{ key: 'setneg', label: 'Izin Setneg / Keppres', file: data.file_izin_setneg }]
                  : []),
              ].filter(({ file }) => file).length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { key: 'invitation', label: 'Nota / Undangan', file: data.file_undangan },
                    ...(data.kategori_perjalanan === 'LUAR_NEGERI'
                      ? [{ key: 'setneg', label: 'Izin Setneg / Keppres', file: data.file_izin_setneg }]
                      : []),
                  ].filter(({ file }) => file).map(({ key, label, file }) => {
                    const extension = file.name.split('.').pop().toLowerCase();

                    return (
                      <div key={key} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
                          <div>
                            <p className="text-xs font-bold text-slate-800">{label}</p>
                            <p className="mt-0.5 break-all text-xs text-slate-500">{file.name}</p>
                          </div>
                          {attachmentUrls[key] && (
                            <a
                              href={attachmentUrls[key]}
                              target="_blank"
                              rel="noreferrer"
                              download={file.name}
                              className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                            >
                              Buka / Unduh
                            </a>
                          )}
                        </div>

                        {extension === 'pdf' && attachmentUrls[key] ? (
                          <iframe title={`Pratinjau ${label}`} src={attachmentUrls[key]} className="h-[32rem] w-full bg-slate-100" />
                        ) : ['jpg', 'jpeg', 'png'].includes(extension) && attachmentUrls[key] ? (
                          <div className="flex max-h-[32rem] justify-center overflow-auto bg-slate-100 p-4">
                            <img src={attachmentUrls[key]} alt={`Pratinjau ${label}`} className="h-auto max-w-full object-contain" />
                          </div>
                        ) : extension === 'docx' ? (
                          <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap p-4 text-xs leading-6 text-slate-700">
                            {docxPreviews[key] ?? 'Memuat pratinjau dokumen...'}
                          </pre>
                        ) : (
                          <p className="p-4 text-xs text-slate-500">Gunakan tombol Buka / Unduh untuk melihat berkas ini.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-xs text-slate-500">
                  Belum ada lampiran yang diunggah pada Tahap 1.
                </p>
              )}
            </section>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">Disposisi Instruksi Kapus *</label>
              <textarea
                rows="3"
                value=""
                readOnly
                placeholder="Instruksi disposisi Kapus akan tercatat pada tahap ini"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-amber-50/50 font-medium text-slate-800 focus:outline-none"
              ></textarea>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="inline-flex items-center space-x-1 text-slate-600 hover:text-slate-800 font-semibold text-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Kembali ke Tahap 1</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="inline-flex items-center space-x-2 bg-[#0F2C59] hover:bg-slate-800 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-lg transition"
              >
                <span>Lanjut ke Draft Personel (Tahap 3)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= TAHAP 3: DRAFT PERSONEL & DETAIL PERJALANAN ================= */}
        {activeStep === 3 && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <PenTool className="w-5 h-5 text-amber-500" />
                  <span>Tahap 3: Draft Personel Ditugaskan & Rincian SPD</span>
                </h2>
                <p className="text-xs text-slate-500">Pilih Pejabat Komitmen (PPK) & Personel Pegawai yang ditugaskan</p>
              </div>
              <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full">
                Aktor: Sespalu / Konseptor
              </span>
            </div>

            {/* Select PPK */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>Penetapan Pejabat Pembuat Komitmen (PPK)</span>
              </h3>
              <select
                value={data.ppk_id}
                onChange={(e) => setData('ppk_id', e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold uppercase focus:ring-2 focus:ring-amber-500"
              >
                <option value="" disabled>Pilih PPK</option>
                {ppkList && ppkList.map((ppk) => (
                  <option key={ppk.id} value={ppk.id}>
                    {ppk.nama} — NIP: {ppk.nip} ({ppk.jabatan || 'PPK Pusdiklat'})
                  </option>
                ))}
              </select>
            </div>

            {/* Multi-Pegawai Selection */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Pegawai Ditugaskan (Snapshot Data Protection)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Profil pangkat & golongan pegawai dikunci saat dokumen dibuat</p>
                </div>
                <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {selectedPegawaiIds.length} Pegawai Dipilih
                </span>
              </div>

              {/* Control Select */}
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedMasterId}
                  onChange={(e) => setSelectedMasterId(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-amber-500"
                >
                  <option value="">-- Pilih Pegawai dari Master DB Pusdiklat Kemlu --</option>
                  {pegawaiList && pegawaiList.map((peg) => (
                    <option key={peg.id} value={peg.id}>
                      {peg.nama} (NIP: {peg.nip}) — {peg.jabatan}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddPegawai}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center justify-center space-x-1 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Pegawai</span>
                </button>
              </div>

              {/* Table of Selected Pegawai */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">No</th>
                      <th className="py-2.5 px-3">Nama / NIP</th>
                      <th className="py-2.5 px-3">Pangkat / Gol.</th>
                      <th className="py-2.5 px-3">Jabatan</th>
                      <th className="py-2.5 px-3 text-center w-16">Hapus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedPegawaiIds.length > 0 ? (
                      selectedPegawaiIds.map((id, index) => {
                        const peg = pegawaiList.find((p) => p.id === id);
                        if (!peg) return null;
                        return (
                          <tr key={peg.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 text-center font-bold text-slate-500">{index + 1}</td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900">{peg.nama}</div>
                              <div className="text-[11px] text-slate-500 font-mono">NIP: {peg.nip}</div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="text-slate-800">{peg.pangkat}</div>
                              <div className="text-[11px] text-slate-500">Gol. {peg.golongan}</div>
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-700">{peg.jabatan}</td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemovePegawai(peg.id)}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-6 text-center text-slate-400">
                          Belum ada pegawai ditambahkan. Silakan pilih dari dropdown di atas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Tingkat Biaya SPD *</label>
                  <select
                    value={data.tingkat_biaya_kode}
                    onChange={(e) => setData('tingkat_biaya_kode', e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="" disabled>Pilih tingkat biaya</option>
                    {tingkatBiayaList?.map((tingkatBiaya) => (
                      <option key={tingkatBiaya.id} value={tingkatBiaya.kode}>
                        {tingkatBiaya.nama} ({tingkatBiaya.kode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Angkutan *</label>
                  <select
                    value={data.jenis_angkutan_nama}
                    onChange={(e) => setData('jenis_angkutan_nama', e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="" disabled>Pilih jenis angkutan</option>
                    {jenisAngkutanList?.map((jenisAngkutan) => (
                      <option key={jenisAngkutan.id} value={jenisAngkutan.nama}>
                        {jenisAngkutan.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Travel Parameters */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <MapPin className="w-4 h-4 text-amber-500" />
                <span>Lokasi & Waktu Perjalanan Dinas</span>
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tempat Berangkat *</label>
                  <input
                    type="text"
                    required
                    value={data.tempat_berangkat}
                    onChange={(e) => setData('tempat_berangkat', e.target.value)}
                    placeholder="Masukkan tempat berangkat"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tempat Tujuan *</label>
                  <input
                    type="text"
                    required
                    value={data.tempat_tujuan}
                    onChange={(e) => setData('tempat_tujuan', e.target.value)}
                    placeholder="Masukkan tempat tujuan"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs placeholder:text-slate-400"
                  />
                </div>

                {data.kategori_perjalanan === 'LUAR_NEGERI' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-amber-800 mb-1">Negara Tujuan *</label>
                      <input
                        type="text"
                        required
                        value={data.negara_tujuan}
                        onChange={(e) => setData('negara_tujuan', e.target.value)}
                        placeholder="Contoh: Jepang (Tokyo)"
                        className="w-full rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs placeholder:text-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-amber-800 mb-1">Nomor Surat Izin Setneg *</label>
                      <input
                        type="text"
                        required
                        value={data.no_setneg}
                        onChange={(e) => setData('no_setneg', e.target.value)}
                        placeholder="Masukkan nomor surat izin Setneg"
                        className="w-full rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs placeholder:text-slate-400"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Berangkat *</label>
                  <input
                    type="date"
                    required
                    value={data.tanggal_berangkat}
                    onChange={(e) => handleDateChange('tanggal_berangkat', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Kembali *</label>
                  <input
                    type="date"
                    required
                    value={data.tanggal_kembali}
                    onChange={(e) => handleDateChange('tanggal_kembali', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-blue-900 bg-blue-50 p-3 rounded-xl border border-blue-200">
                <span>Kalkulasi Otomatis Durasi Dinas:</span>
                <strong className="text-sm font-extrabold text-blue-950">{data.durasi_hari} Hari Perjalanan</strong>
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="inline-flex items-center space-x-1 text-slate-600 hover:text-slate-800 font-semibold text-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Kembali ke Tahap 2</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveStep(4)}
                className="inline-flex items-center space-x-2 bg-[#0F2C59] hover:bg-slate-800 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-lg transition"
              >
                <span>Lanjut ke Penomoran TU (Tahap 4)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= TAHAP 4: PENOMORAN REGISTRASI TU ================= */}
        {activeStep === 4 && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <FileDigit className="w-5 h-5 text-amber-500" />
                  <span>Tahap 4: Registrasi & Penomoran Resmi Naskah Dinas TU</span>
                </h2>
                <p className="text-xs text-slate-500">Penomoran resmi Surat Tugas dan Lembar SPD oleh Tata Usaha</p>
              </div>
              <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full">
                Aktor: Tata Usaha (TU)
              </span>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-amber-900 flex items-center space-x-1.5">
                <Hash className="w-4 h-4 text-amber-600" />
                <span>Nomor Surat Resmi & Tanggal Registrasi</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Surat Tugas Resmi (Diisi TU)</label>
                  <input
                    type="text"
                    value=""
                    readOnly
                    placeholder="Diisi oleh Tata Usaha"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold bg-white text-slate-900 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Format: ST/KP/[NO_URUT]/[BULAN]/[TAHUN]/[KODE]</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor SPD Resmi (Diisi TU)</label>
                  <input
                    type="text"
                    value=""
                    readOnly
                    placeholder="Diisi oleh Tata Usaha"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold bg-white text-slate-900 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Format: [NO_URUT]/DL-SPD/[ROMAWI]/[TAHUN]/[KODE]</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Surat Tugas & SPD *</label>
                  <input
                    type="date"
                    required
                    value={data.tanggal_surat}
                    onChange={(e) => setData('tanggal_surat', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  {errors.tanggal_surat && <p className="mt-1 text-xs text-red-600">{errors.tanggal_surat}</p>}
                  <span className="text-[10px] text-slate-500 mt-1 block">Tanggal yang dicantumkan pada Surat Tugas dan SPD</span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="inline-flex items-center space-x-1 text-slate-600 hover:text-slate-800 font-semibold text-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Kembali ke Tahap 3</span>
              </button>

              <button
                type="submit"
                disabled={processing || selectedPegawaiIds.length === 0}
                className="inline-flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm px-6 py-2.5 rounded-xl shadow-lg transition transform hover:-translate-y-0.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Simpan & Generate Dokumen Resmi</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </AdminLayout>
  );
}
