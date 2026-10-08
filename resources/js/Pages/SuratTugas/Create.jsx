import React, { useEffect, useState, useRef } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
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
  FileText,
  Search,
  AlertCircle,
  X,
  Save,
  Clock,
  BookmarkCheck,
  FileClock
} from 'lucide-react';

export default function Create({ 
  pegawaiList, 
  ppkList, 
  unitKerjaList, 
  tingkatBiayaList, 
  jenisAngkutanList, 
  userRole, 
  draft, 
  activeDrafts 
}) {
  const [activeStep, setActiveStep] = useState(draft?.draft_step || 1);
  const [selectedPegawaiIds, setSelectedPegawaiIds] = useState(
    draft?.pegawai_list ? draft.pegawai_list.map((p) => p.pegawai_id) : []
  );
  const [selectedMasterId, setSelectedMasterId] = useState('');
  const [pegawaiSearchTerm, setPegawaiSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [stepValidationError, setStepValidationError] = useState('');
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftSuccessMsg, setDraftSuccessMsg] = useState('');
  const dropdownRef = useRef(null);
  const [attachmentUrls, setAttachmentUrls] = useState({});
  const [docxPreviews, setDocxPreviews] = useState({});

  const { data, setData, post, processing, errors } = useForm({
    draft_id: draft?.id || null,
    draft_step: draft?.draft_step || 1,
    kategori_perjalanan: draft?.kategori_perjalanan || '',
    sumber_asal: draft?.sumber_asal || '',
    nomor_nota: draft?.nomor_nota || '',
    pengirim_nota: draft?.pengirim_nota || '',
    tanggal_nota: draft?.tanggal_nota ? String(draft.tanggal_nota).split('T')[0] : '',
    perihal_nota: draft?.perihal_nota || '',
    file_undangan: null,
    file_izin_setneg: null,
    existing_file_undangan: draft?.file_undangan || null,
    existing_file_izin_setneg: draft?.file_izin_setneg || null,

    // Step 2 (Kapus)
    kapus_decision: draft?.kapus_decision || 'YA',
    catatan_kapus: draft?.catatan_kapus || '',
    
    // Step 3 (Personel & SPD)
    ppk_id: draft?.ppk_id || (ppkList && ppkList.length > 0 ? ppkList[0].id : ''),
    tingkat_biaya_kode: draft?.tingkat_biaya_kode || (tingkatBiayaList && tingkatBiayaList.length > 0 ? tingkatBiayaList[0].kode : 'C'),
    jenis_angkutan_nama: draft?.jenis_angkutan_nama || (jenisAngkutanList && jenisAngkutanList.length > 0 ? jenisAngkutanList[0].nama : 'Perjalanan Darat'),
    tempat_berangkat: draft?.tempat_berangkat || 'Jakarta',
    tempat_tujuan: draft?.tempat_tujuan || '',
    negara_tujuan: draft?.negara_tujuan || '',
    no_setneg: draft?.no_setneg || '',
    tanggal_berangkat: draft?.tanggal_berangkat ? String(draft.tanggal_berangkat).split('T')[0] : '',
    tanggal_kembali: draft?.tanggal_kembali ? String(draft.tanggal_kembali).split('T')[0] : '',
    tanggal_surat: draft?.tanggal_surat ? String(draft.tanggal_surat).split('T')[0] : new Date().toISOString().split('T')[0],
    durasi_hari: draft?.durasi_hari || 1,
    nomor_st: draft?.nomor_st || '',
    nomor_spd: draft?.nomor_spd || '',
    pegawai_ids: draft?.pegawai_list ? draft.pegawai_list.map((p) => p.pegawai_id) : [],
  });

  useEffect(() => {
    const urls = {};
    if (data.file_undangan instanceof File) {
      urls.invitation = URL.createObjectURL(data.file_undangan);
    } else if (data.existing_file_undangan) {
      urls.invitation = `/storage/${data.existing_file_undangan}`;
    }

    if (data.file_izin_setneg instanceof File) {
      urls.setneg = URL.createObjectURL(data.file_izin_setneg);
    } else if (data.existing_file_izin_setneg) {
      urls.setneg = `/storage/${data.existing_file_izin_setneg}`;
    }

    let cancelled = false;
    setAttachmentUrls(urls);
    setDocxPreviews({});

    const files = { invitation: data.file_undangan, setneg: data.file_izin_setneg };
    Object.entries(files).forEach(async ([key, file]) => {
      if (!file || !(file instanceof File) || !file.name.toLowerCase().endsWith('.docx')) return;

      try {
        const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        if (!cancelled) setDocxPreviews((previews) => ({ ...previews, [key]: result.value }));
      } catch {
        if (!cancelled) setDocxPreviews((previews) => ({ ...previews, [key]: 'Isi DOCX tidak dapat dipratinjau. Buka atau unduh berkas asli untuk memeriksanya.' }));
      }
    });

    return () => {
      cancelled = true;
      if (data.file_undangan instanceof File && urls.invitation) URL.revokeObjectURL(urls.invitation);
      if (data.file_izin_setneg instanceof File && urls.setneg) URL.revokeObjectURL(urls.setneg);
    };
  }, [data.file_undangan, data.file_izin_setneg, data.existing_file_undangan, data.existing_file_izin_setneg]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSaveDraft = () => {
    setIsSavingDraft(true);
    setDraftSuccessMsg('');
    setStepValidationError('');

    const formData = new FormData();
    formData.append('draft_step', activeStep);
    if (data.draft_id) formData.append('draft_id', data.draft_id);
    if (data.kategori_perjalanan) formData.append('kategori_perjalanan', data.kategori_perjalanan);
    if (data.sumber_asal) formData.append('sumber_asal', data.sumber_asal);
    if (data.nomor_nota) formData.append('nomor_nota', data.nomor_nota);
    if (data.pengirim_nota) formData.append('pengirim_nota', data.pengirim_nota);
    if (data.tanggal_nota) formData.append('tanggal_nota', data.tanggal_nota);
    if (data.perihal_nota) formData.append('perihal_nota', data.perihal_nota);
    if (data.file_undangan) formData.append('file_undangan', data.file_undangan);
    if (data.file_izin_setneg) formData.append('file_izin_setneg', data.file_izin_setneg);
    if (data.kapus_decision) formData.append('kapus_decision', data.kapus_decision);
    if (data.catatan_kapus) formData.append('catatan_kapus', data.catatan_kapus);
    if (data.ppk_id) formData.append('ppk_id', data.ppk_id);
    if (data.tingkat_biaya_kode) formData.append('tingkat_biaya_kode', data.tingkat_biaya_kode);
    if (data.jenis_angkutan_nama) formData.append('jenis_angkutan_nama', data.jenis_angkutan_nama);
    if (data.tempat_berangkat) formData.append('tempat_berangkat', data.tempat_berangkat);
    if (data.tempat_tujuan) formData.append('tempat_tujuan', data.tempat_tujuan);
    if (data.negara_tujuan) formData.append('negara_tujuan', data.negara_tujuan);
    if (data.no_setneg) formData.append('no_setneg', data.no_setneg);
    if (data.tanggal_berangkat) formData.append('tanggal_berangkat', data.tanggal_berangkat);
    if (data.tanggal_kembali) formData.append('tanggal_kembali', data.tanggal_kembali);
    if (data.durasi_hari) formData.append('durasi_hari', data.durasi_hari);
    if (data.nomor_st) formData.append('nomor_st', data.nomor_st);
    if (data.nomor_spd) formData.append('nomor_spd', data.nomor_spd);
    if (data.tanggal_surat) formData.append('tanggal_surat', data.tanggal_surat);
    selectedPegawaiIds.forEach((id) => formData.append('pegawai_ids[]', id));

    router.post('/surat-tugas/draft', formData, {
      onSuccess: () => {
        setIsSavingDraft(false);
        setDraftSuccessMsg(`Draft surat berhasil disimpan di Tahap ${activeStep}!`);
        setTimeout(() => setDraftSuccessMsg(''), 6000);
      },
      onError: () => {
        setIsSavingDraft(false);
      }
    });
  };

  const filteredPegawaiList = (pegawaiList || []).filter((peg) => {
    if (!pegawaiSearchTerm.trim()) return true;
    const term = pegawaiSearchTerm.toLowerCase();
    const matchNama = peg.nama?.toLowerCase().includes(term);
    const matchNip = peg.nip?.toLowerCase().includes(term);
    return matchNama || matchNip;
  });

  const handleAddPegawai = () => {
    if (!selectedMasterId) return;
    const id = parseInt(selectedMasterId);
    if (!selectedPegawaiIds.includes(id)) {
      const updated = [...selectedPegawaiIds, id];
      setSelectedPegawaiIds(updated);
      setData('pegawai_ids', updated);
    }
    setSelectedMasterId('');
    setPegawaiSearchTerm('');
    setIsDropdownOpen(false);
    setStepValidationError('');
  };

  const handleSelectPegawai = (peg) => {
    setSelectedMasterId(peg.id);
    setPegawaiSearchTerm(`${peg.nama} - NIP: ${peg.nip || '-'}`);
    setIsDropdownOpen(false);
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

  const validateStep1 = () => {
    if (!data.kategori_perjalanan) return 'Kategori Perjalanan Dinas wajib dipilih (Dalam Negeri / Luar Negeri).';
    if (!data.sumber_asal) return 'Sumber Nota / Undangan wajib dipilih (Eksternal / Internal).';
    if (!data.nomor_nota?.trim()) return 'Nomor Nota / Undangan Masuk wajib diisi.';
    if (!data.pengirim_nota?.trim()) return 'Instansi / Unit Pengirim Undangan wajib diisi.';
    if (!data.tanggal_nota) return 'Tanggal Undangan wajib diisi.';
    if (!data.perihal_nota?.trim()) return 'Perihal Undangan / Uraian Tugas wajib diisi.';
    if (!data.file_undangan && !data.existing_file_undangan) return 'File Lampiran Scan Nota / Undangan Masuk wajib diunggah.';
    if (data.kategori_perjalanan === 'LUAR_NEGERI' && !data.file_izin_setneg && !data.existing_file_izin_setneg) {
      return 'File Surat Persetujuan Setneg / Keppres wajib diunggah untuk Perjalanan Dinas Luar Negeri.';
    }
    return null;
  };

  const validateStep3 = () => {
    if (!data.ppk_id) return 'Pejabat Pembuat Komitmen (PPK) wajib dipilih.';
    if (selectedPegawaiIds.length === 0) return 'Daftar Pegawai Ditugaskan wajib diisi (minimal tambahkan 1 pegawai).';
    if (!data.tingkat_biaya_kode) return 'Tingkat Biaya SPD wajib dipilih.';
    if (!data.jenis_angkutan_nama) return 'Jenis Angkutan yang dipergunakan wajib dipilih.';
    if (!data.tempat_berangkat?.trim()) return 'Tempat Berangkat wajib diisi.';
    if (!data.tempat_tujuan?.trim()) return 'Tempat Tujuan wajib diisi.';
    if (data.kategori_perjalanan === 'LUAR_NEGERI') {
      if (!data.negara_tujuan?.trim()) return 'Negara Tujuan wajib diisi untuk dinas Luar Negeri.';
      if (!data.no_setneg?.trim()) return 'Nomor Surat Izin Setneg wajib diisi untuk dinas Luar Negeri.';
    }
    if (!data.tanggal_berangkat) return 'Tanggal Berangkat wajib diisi.';
    if (!data.tanggal_kembali) return 'Tanggal Kembali wajib diisi.';
    if (data.tanggal_kembali < data.tanggal_berangkat) return 'Tanggal Kembali tidak boleh lebih awal dari Tanggal Berangkat.';
    return null;
  };

  const validateStep4 = () => {
    if (!data.tanggal_surat) return 'Tanggal Surat Tugas & SPD resmi wajib diisi.';
    if (userRole === 'admin' || userRole === 'tu') {
      if (!data.nomor_st?.trim()) return 'Nomor Surat Tugas Resmi wajib diisi oleh Admin / TU.';
      if (!data.nomor_spd?.trim()) return 'Nomor SPD Resmi wajib diisi oleh Admin / TU.';
    }
    return null;
  };

  const goToStep = (targetStep) => {
    if (targetStep < activeStep) {
      setStepValidationError('');
      setActiveStep(targetStep);
      return;
    }
    if (targetStep >= 2) {
      const err1 = validateStep1();
      if (err1) {
        setStepValidationError(err1);
        setActiveStep(1);
        return;
      }
    }
    if (targetStep >= 4) {
      const err3 = validateStep3();
      if (err3) {
        setStepValidationError(err3);
        setActiveStep(3);
        return;
      }
    }
    setStepValidationError('');
    setActiveStep(targetStep);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const err1 = validateStep1();
    if (err1) {
      setStepValidationError(err1);
      setActiveStep(1);
      return;
    }
    const err3 = validateStep3();
    if (err3) {
      setStepValidationError(err3);
      setActiveStep(3);
      return;
    }
    const err4 = validateStep4();
    if (err4) {
      setStepValidationError(err4);
      setActiveStep(4);
      return;
    }
    setStepValidationError('');
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
          <button
            type="button"
            onClick={() => goToStep(1)}
            aria-current={activeStep === 1 ? 'step' : undefined}
            className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl border font-bold transition cursor-pointer text-left ${
              activeStep === 1
                ? 'bg-[#0F2C59] text-white border-amber-500 shadow-md'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-xs ${
              activeStep === 1 ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-700'
            }`}>
              1
            </span>
            <span>1. Upload Nota / Undangan</span>
          </button>

          <ChevronRight className="w-4 h-4 text-slate-300" />

          {/* Step 2 */}
          <button
            type="button"
            onClick={() => goToStep(2)}
            aria-current={activeStep === 2 ? 'step' : undefined}
            className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl border font-bold transition cursor-pointer text-left ${
              activeStep === 2
                ? 'bg-[#0F2C59] text-white border-amber-500 shadow-md'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-xs ${
              activeStep === 2 ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-700'
            }`}>
              2
            </span>
            <span>2. Disposisi Kapus</span>
          </button>

          <ChevronRight className="w-4 h-4 text-slate-300" />

          {/* Step 3 */}
          <button
            type="button"
            onClick={() => goToStep(3)}
            aria-current={activeStep === 3 ? 'step' : undefined}
            className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl border font-bold transition cursor-pointer text-left ${
              activeStep === 3
                ? 'bg-[#0F2C59] text-white border-amber-500 shadow-md'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-xs ${
              activeStep === 3 ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-700'
            }`}>
              3
            </span>
            <span>3. Draft Personel & SPD</span>
          </button>

          <ChevronRight className="w-4 h-4 text-slate-300" />

          {/* Step 4 */}
          <button
            type="button"
            onClick={() => goToStep(4)}
            aria-current={activeStep === 4 ? 'step' : undefined}
            className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl border font-bold transition cursor-pointer text-left ${
              activeStep === 4
                ? 'bg-[#0F2C59] text-white border-amber-500 shadow-md'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-xs ${
              activeStep === 4 ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-700'
            }`}>
              4
            </span>
            <span>4. Penomoran TU</span>
          </button>

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
            {stepValidationError && (
              <div className="p-4 rounded-xl bg-red-50 border-2 border-red-300 text-red-900 text-xs font-bold flex items-start space-x-2.5 shadow-sm">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-extrabold text-red-800 uppercase tracking-wide text-[10px]">Perhatian - Kolom Wajib Terisi:</p>
                  <p className="mt-0.5 text-xs text-red-700">{stepValidationError}</p>
                </div>
              </div>
            )}

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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Upload File PDF Scan Undangan (Maks. 10 MB) *</label>
                <label className="relative flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-center text-xs text-slate-600 transition hover:border-blue-400 hover:bg-blue-50">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    required
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
                onClick={() => goToStep(2)}
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
            {stepValidationError && (
              <div className="p-4 rounded-xl bg-red-50 border-2 border-red-300 text-red-900 text-xs font-bold flex items-start space-x-2.5 shadow-sm">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-extrabold text-red-800 uppercase tracking-wide text-[10px]">Perhatian - Kolom Wajib Terisi:</p>
                  <p className="mt-0.5 text-xs text-red-700">{stepValidationError}</p>
                </div>
              </div>
            )}

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
                onClick={() => goToStep(3)}
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
            {stepValidationError && (
              <div className="p-4 rounded-xl bg-red-50 border-2 border-red-300 text-red-900 text-xs font-bold flex items-start space-x-2.5 shadow-sm">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-extrabold text-red-800 uppercase tracking-wide text-[10px]">Perhatian - Kolom Wajib Terisi:</p>
                  <p className="mt-0.5 text-xs text-red-700">{stepValidationError}</p>
                </div>
              </div>
            )}

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
                <span>Penetapan Pejabat Pembuat Komitmen (PPK) *</span>
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

            {/* Multi-Pegawai Selection with Live Search */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Pegawai Ditugaskan * (Snapshot Data Protection)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Profil pangkat & golongan pegawai dikunci saat dokumen dibuat</p>
                </div>
                <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {selectedPegawaiIds.length} Pegawai Dipilih
                </span>
              </div>

              {/* Live Search & Select Pegawai */}
              <div className="relative" ref={dropdownRef}>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Search className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={pegawaiSearchTerm}
                      onChange={(e) => {
                        setPegawaiSearchTerm(e.target.value);
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      placeholder="Cari nama atau NIP pegawai (Live Search 760+ pegawai)..."
                      className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white shadow-sm"
                    />
                    {pegawaiSearchTerm && (
                      <button
                        type="button"
                        onClick={() => {
                          setPegawaiSearchTerm('');
                          setSelectedMasterId('');
                        }}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddPegawai}
                    disabled={!selectedMasterId}
                    className={`font-bold text-xs px-5 py-2.5 rounded-xl flex items-center justify-center space-x-1.5 transition shadow-sm ${
                      selectedMasterId
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Pegawai</span>
                  </button>
                </div>

                {/* Dropdown Hasil Pencarian: HANYA NAMA DAN NIP */}
                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto divide-y divide-slate-100">
                    <div className="p-2 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between font-semibold border-b border-slate-100 sticky top-0 z-10">
                      <span>Daftar Pegawai ({filteredPegawaiList.length} Ditemukan)</span>
                      <span className="text-[10px] text-slate-400">Pilih nama untuk ditambahkan</span>
                    </div>

                    {filteredPegawaiList.length > 0 ? (
                      filteredPegawaiList.map((peg) => {
                        const isAlreadySelected = selectedPegawaiIds.includes(peg.id);
                        const isPicked = selectedMasterId === peg.id;
                        return (
                          <div
                            key={peg.id}
                            onClick={() => {
                              handleSelectPegawai(peg);
                            }}
                            className={`px-3.5 py-2 text-xs cursor-pointer flex items-center justify-between transition ${
                              isPicked
                                ? 'bg-amber-100/70 text-amber-950 font-bold'
                                : isAlreadySelected
                                ? 'bg-slate-50/80 text-slate-400'
                                : 'hover:bg-amber-50 text-slate-800'
                            }`}
                          >
                            <div className="truncate">
                              <span className="font-semibold text-slate-900">{peg.nama}</span>
                              <span className="text-slate-500 font-mono text-[11px] ml-2">
                                - {peg.nip && peg.nip !== '-' ? `NIP. ${peg.nip}` : 'NIP. -'}
                              </span>
                            </div>
                            {isAlreadySelected ? (
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full ml-2 shrink-0">
                                Sudah Terpilih
                              </span>
                            ) : isPicked ? (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-200 px-2 py-0.5 rounded-full ml-2 shrink-0">
                                Siap Ditambah
                              </span>
                            ) : null}
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-400">
                        Tidak ada pegawai yang cocok dengan kata kunci &quot;{pegawaiSearchTerm}&quot;
                      </div>
                    )}
                  </div>
                )}
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
                onClick={() => goToStep(4)}
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
            {stepValidationError && (
              <div className="p-4 rounded-xl bg-red-50 border-2 border-red-300 text-red-900 text-xs font-bold flex items-start space-x-2.5 shadow-sm">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-extrabold text-red-800 uppercase tracking-wide text-[10px]">Perhatian - Kolom Wajib Terisi:</p>
                  <p className="mt-0.5 text-xs text-red-700">{stepValidationError}</p>
                </div>
              </div>
            )}

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
