import React, { useEffect, useMemo, useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import SearchableSelect from '@/Components/SearchableSelect';
import InfoTooltip from '@/Components/InfoTooltip';
import RpdStepForm from './Partials/RpdStepForm';
import {
  DEPARTURE_OPTIONS,
  WORLD_COUNTRIES,
  formatTempatTujuan,
  getCityOptions,
  getProvinceOptions,
  parseDestination,
} from '@/Data/locations';
import { 
  FileSignature, 
  Upload, 
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
  Save,
  Coins,
  Truck
} from 'lucide-react';

export default function Create({ pegawaiList, ppkList, bendaharaList = [], unitKerjaList, tingkatBiayaList, jenisAngkutanList, userRole, draft = null, draftData = {}, draftStep = 1, draftAttachments = {} }) {
  const [activeStep, setActiveStep] = useState(draftStep || 1);
  const [selectedPegawaiIds, setSelectedPegawaiIds] = useState((draftData.pegawai_ids || []).map(Number));
  const [selectedMasterId, setSelectedMasterId] = useState('');
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitNotice, setSubmitNotice] = useState('');
  const [pegawaiSearch, setPegawaiSearch] = useState('');
  const [pegawaiDropdownOpen, setPegawaiDropdownOpen] = useState(false);
  const pegawaiDropdownRef = React.useRef(null);
  // Jadwal mode: 'sama' = semua pegawai pakai tanggal yang sama, 'per_pegawai' = per-individu
  const [jadwalMode, setJadwalMode] = useState('sama');
  const [jadwalPerPegawai, setJadwalPerPegawai] = useState({});

  // Tutup dropdown pegawai saat klik di luar
  useEffect(() => {
    function handleClickOutside(e) {
      if (pegawaiDropdownRef.current && !pegawaiDropdownRef.current.contains(e.target)) {
        setPegawaiDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toDateInput = (val) => (typeof val === 'string' && val.includes('T') ? val.slice(0, 10) : val || '');

  const initialParsedDestination = useMemo(
    () => parseDestination(draftData.kategori_perjalanan, draftData.tempat_tujuan, draftData.negara_tujuan),
    [draftData.kategori_perjalanan, draftData.tempat_tujuan, draftData.negara_tujuan]
  );
  const [provinsiTujuan, setProvinsiTujuan] = useState(initialParsedDestination.provinsi || '');
  const [kotaTujuan, setKotaTujuan] = useState(initialParsedDestination.kota || '');

  const { data, setData, post, transform, processing, errors } = useForm({
    kategori_perjalanan: draftData.kategori_perjalanan || '',
    sumber_asal: draftData.sumber_asal || '',
    nomor_nota: draftData.nomor_nota || '',
    pengirim_nota: draftData.pengirim_nota || '',
    tanggal_nota: toDateInput(draftData.tanggal_nota),
    perihal_nota: draftData.perihal_nota || '',
    
    // Tahap 2
    ppk_id: draftData.ppk_id || '',
    bendahara_id: draftData.bendahara_id || '',
    tingkat_biaya_kode: draftData.tingkat_biaya_kode || '',
    jenis_angkutan_nama: draftData.jenis_angkutan_nama || '',
    tempat_berangkat: draftData.tempat_berangkat || 'Jakarta',
    tempat_tujuan: draftData.tempat_tujuan || '',
    is_multi_trip: Boolean(draftData.is_multi_trip),
    rute_perjalanan: Array.isArray(draftData.rute_perjalanan) ? draftData.rute_perjalanan : [],
    negara_tujuan: draftData.negara_tujuan || '',
    no_setneg: draftData.no_setneg || '',
    tanggal_berangkat: toDateInput(draftData.tanggal_berangkat),
    tanggal_kembali: toDateInput(draftData.tanggal_kembali),
    tanggal_surat: toDateInput(draftData.tanggal_surat),
    tanggal_rpd: toDateInput(draftData.tanggal_rpd),
    durasi_hari: draftData.durasi_hari || 1,
    pegawai_ids: draftData.pegawai_ids || [],

    // Tahap 3 (RPD & Daftar Nominatif)
    rpd_data: draftData.rpd_data || {},
    
    // Files always null on init
    file_undangan: null,
    file_izin_setneg: null,
    draft_id: draft?.id || null,
    draft_step: draftStep || 1,
  });

  useEffect(() => {
    if (!draft) return;

    setActiveStep(draftStep || 1);
    setData((currentData) => ({
      ...currentData,
      draft_id: draft.id,
      draft_step: draftStep || 1,
    }));
  }, [draft?.id, draftStep]);

  const handleAddPegawai = () => {
    if (!selectedMasterId) return;
    const id = parseInt(selectedMasterId);
    if (!selectedPegawaiIds.includes(id)) {
      const updated = [...selectedPegawaiIds, id];
      setSelectedPegawaiIds(updated);
      setData('pegawai_ids', updated);
      // Inisialisasi jadwal per pegawai baru dengan tanggal global (jika sudah diisi)
      setJadwalPerPegawai((prev) => ({
        ...prev,
        [id]: { tanggal_berangkat: data.tanggal_berangkat || '', tanggal_kembali: data.tanggal_kembali || '' },
      }));
    }
  };

  const handleRemovePegawai = (id) => {
    const updated = selectedPegawaiIds.filter(item => item !== id);
    setSelectedPegawaiIds(updated);
    setData('pegawai_ids', updated);
    setJadwalPerPegawai((prev) => { const next = { ...prev }; delete next[id]; return next; });
  };

  const handleJadwalPerPegawaiChange = (pegId, field, value) => {
    setJadwalPerPegawai((prev) => ({
      ...prev,
      [pegId]: { ...prev[pegId], [field]: value },
    }));
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

  // Helper sinkronisasi Multi-Trip ke field utama ST & SPD
  const syncMultiTripState = (nextRoutes, nextIsMulti = true) => {
    const normalized = nextRoutes.map((leg) => ({
      ...leg,
      durasi_hari: leg.tanggal_berangkat && leg.tanggal_kembali
        ? calcDays(leg.tanggal_berangkat, leg.tanggal_kembali)
        : (Number(leg.durasi_hari) || 1),
    }));

    const destinations = normalized
      .map((leg) => (leg.tujuan || '').trim())
      .filter(Boolean);
    const countries = [...new Set(
      normalized.map((leg) => (leg.negara || '').trim()).filter(Boolean)
    )];

    const starts = normalized.map((l) => l.tanggal_berangkat).filter(Boolean).sort();
    const ends = normalized.map((l) => l.tanggal_kembali).filter(Boolean).sort();
    const firstStart = starts[0] || data.tanggal_berangkat || '';
    const lastEnd = ends[ends.length - 1] || data.tanggal_kembali || '';
    const totalDays = firstStart && lastEnd
      ? calcDays(firstStart, lastEnd)
      : normalized.reduce((sum, l) => sum + (Number(l.durasi_hari) || 1), 0);

    setData((prev) => ({
      ...prev,
      is_multi_trip: nextIsMulti,
      rute_perjalanan: normalized,
      tempat_tujuan: destinations.join(' → '),
      ...(prev.kategori_perjalanan === 'LUAR_NEGERI' && countries.length > 0
        ? { negara_tujuan: countries.join(', ') }
        : {}),
      tanggal_berangkat: firstStart,
      tanggal_kembali: lastEnd,
      durasi_hari: Math.max(1, totalDays),
    }));
  };

  const handleToggleMultiTrip = (enableMulti) => {
    if (enableMulti) {
      const existing = Array.isArray(data.rute_perjalanan) && data.rute_perjalanan.length >= 2
        ? data.rute_perjalanan
        : [
            {
              tujuan: data.tempat_tujuan || '',
              negara: data.kategori_perjalanan === 'LUAR_NEGERI' ? (data.negara_tujuan || '') : '',
              tanggal_berangkat: data.tanggal_berangkat || '',
              tanggal_kembali: data.tanggal_berangkat || '',
              durasi_hari: 1,
            },
            {
              tujuan: '',
              negara: '',
              tanggal_berangkat: data.tanggal_kembali || '',
              tanggal_kembali: data.tanggal_kembali || '',
              durasi_hari: 1,
            },
          ];
      syncMultiTripState(existing, true);
    } else {
      const firstLeg = data.rute_perjalanan?.[0];
      setData((prev) => ({
        ...prev,
        is_multi_trip: false,
        tempat_tujuan: firstLeg?.tujuan || prev.tempat_tujuan,
      }));
    }
  };

  const handleMultiTripLegChange = (idx, field, value) => {
    const nextRoutes = [...(data.rute_perjalanan || [])];
    const current = { ...nextRoutes[idx], [field]: value };

    // Jika tanggal_berangkat diisi & tanggal_kembali kosong/lebih awal, samakan
    if (field === 'tanggal_berangkat' && (!current.tanggal_kembali || current.tanggal_kembali < value)) {
      current.tanggal_kembali = value;
    }
    nextRoutes[idx] = current;

    // Otomatis sarankan tanggal mulai tujuan berikutnya bila masih kosong
    if (field === 'tanggal_kembali' && nextRoutes[idx + 1] && !nextRoutes[idx + 1].tanggal_berangkat) {
      nextRoutes[idx + 1] = {
        ...nextRoutes[idx + 1],
        tanggal_berangkat: value,
        tanggal_kembali: nextRoutes[idx + 1].tanggal_kembali || value,
      };
    }

    syncMultiTripState(nextRoutes, true);
  };

  const handleAddMultiTripLeg = () => {
    const current = data.rute_perjalanan || [];
    if (current.length >= 4) return;
    const prevEnd = current[current.length - 1]?.tanggal_kembali || '';
    syncMultiTripState([
      ...current,
      {
        tujuan: '',
        negara: '',
        tanggal_berangkat: prevEnd,
        tanggal_kembali: prevEnd,
        durasi_hari: 1,
      },
    ], true);
  };

  const handleRemoveMultiTripLeg = (idx) => {
    const current = data.rute_perjalanan || [];
    if (current.length <= 2) return;
    syncMultiTripState(current.filter((_, i) => i !== idx), true);
  };

  const handleTravelCategoryChange = (value) => {
    setProvinsiTujuan('');
    setKotaTujuan('');
    setData({
      ...data,
      kategori_perjalanan: value,
      tempat_tujuan: '',
      ...(value === 'DALAM_NEGERI' ? { negara_tujuan: '', no_setneg: '' } : { negara_tujuan: '' }),
    });
  };

  const activeNegara = data.kategori_perjalanan === 'LUAR_NEGERI' ? data.negara_tujuan : 'Indonesia';

  const provinceOptions = useMemo(
    () => getProvinceOptions(data.kategori_perjalanan, activeNegara),
    [data.kategori_perjalanan, activeNegara]
  );

  const cityOptions = useMemo(
    () => getCityOptions(data.kategori_perjalanan, activeNegara, provinsiTujuan),
    [data.kategori_perjalanan, activeNegara, provinsiTujuan]
  );

  const handleNegaraTujuanChange = (nextNegara) => {
    setProvinsiTujuan('');
    setKotaTujuan('');
    setData({
      ...data,
      negara_tujuan: nextNegara,
      tempat_tujuan: '',
    });
  };

  const handleProvinsiTujuanChange = (nextProvinsi, meta) => {
    const inferredCountry =
      data.kategori_perjalanan === 'LUAR_NEGERI' && meta?.country
        ? meta.country
        : data.negara_tujuan;

    // Reset kota jika provinsi diganti
    const nextKota = nextProvinsi === provinsiTujuan ? kotaTujuan : '';
    setProvinsiTujuan(nextProvinsi);
    setKotaTujuan(nextKota);
    setData({
      ...data,
      negara_tujuan: inferredCountry,
      tempat_tujuan: formatTempatTujuan(nextKota, nextProvinsi),
    });
  };

  const handleKotaTujuanChange = (nextKota, meta) => {
    const nextProvinsi = meta?.province || provinsiTujuan;
    const inferredCountry =
      data.kategori_perjalanan === 'LUAR_NEGERI' && meta?.country
        ? meta.country
        : data.negara_tujuan;

    setKotaTujuan(nextKota);
    if (nextProvinsi && nextProvinsi !== provinsiTujuan) {
      setProvinsiTujuan(nextProvinsi);
    }
    setData({
      ...data,
      negara_tujuan: inferredCountry,
      tempat_tujuan: formatTempatTujuan(nextKota, nextProvinsi),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (processing || savingDraft) {
      return;
    }
    setSubmitNotice('');
    if (activeStep >= 2 && selectedPegawaiIds.length === 0) {
      alert('Pilih setidaknya 1 pegawai untuk ditugaskan!');
      return;
    }

    // Nota/undangan dan draft ST/SPD dikirim bersama setelah tahap 2 lengkap.
    transform((formData) => {
      let tanggalBerangkat = formData.tanggal_berangkat;
      let tanggalKembali = formData.tanggal_kembali;
      let durasiHari = formData.durasi_hari;

      if (activeStep >= 2 && jadwalMode === 'per_pegawai') {
        const jadwalList = selectedPegawaiIds
          .map((id) => jadwalPerPegawai[id])
          .filter((j) => j?.tanggal_berangkat && j?.tanggal_kembali);

        if (jadwalList.length > 0) {
          const starts = jadwalList.map((j) => j.tanggal_berangkat).sort();
          const ends = jadwalList.map((j) => j.tanggal_kembali).sort();
          tanggalBerangkat = starts[0];
          tanggalKembali = ends[ends.length - 1];
          durasiHari = calcDays(tanggalBerangkat, tanggalKembali);
        }
      }

      return {
        ...formData,
        tanggal_berangkat: tanggalBerangkat,
        tanggal_kembali: tanggalKembali,
        durasi_hari: durasiHari,
        draft_step: activeStep,
        pegawai_ids: selectedPegawaiIds,
      };
    });
    post('/surat-tugas');
  };

  const handleInvalidCapture = (event) => {
    const fieldLabel = event.target.closest('label')?.innerText
      || event.target.closest('div')?.querySelector('label')?.innerText
      || event.target.placeholder
      || 'kolom wajib';
    setSubmitNotice(`Lengkapi ${fieldLabel.replace(/\*/g, '').trim()} sebelum mengirim ke Kapus.`);
  };

  const validationErrorEntries = Object.entries(errors).filter(([, message]) => Boolean(message));

  const handleSaveDraft = () => {
    if (savingDraft || processing) {
      return;
    }
    router.post(
      draft ? `/surat-tugas/${draft.id}/draft` : '/surat-tugas/draft',
      { ...data, pegawai_ids: selectedPegawaiIds, draft_step: activeStep },
      {
        onStart: () => setSavingDraft(true),
        onFinish: () => setSavingDraft(false),
      }
    );
  };

  const workflowSteps = [
    { id: 1, label: 'Upload Nota / Undangan' },
    { id: 2, label: 'Draft Personel & SPD' },
    { id: 3, label: 'RPD & Daftar Nominatif' },
    { id: 4, label: 'Disposisi Kapus' },
    { id: 5, label: 'Penomoran TU' },
    { id: 6, label: 'Output & Cetak PDF' },
  ];

  return (
    <AdminLayout title="Generate Surat Tugas & SPD Baru">
      <Head title="Generate Surat Tugas & SPD Baru - e-SPD Pusdiklat Kemlu" />

      {/* Header Minimalis */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {draft ? 'Lanjutkan Draft Surat Tugas' : 'Generate Surat Tugas & SPD Online'}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Alur Operasional Pusdiklat Kemlu
            <span className="mx-1.5 text-slate-300">•</span>
            <span className="font-semibold text-[#0F2C59]">Tahap {activeStep} dari {workflowSteps.length}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={savingDraft || processing}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
        >
          <Save className="h-3.5 w-3.5 text-slate-500" />
          <span>{savingDraft ? 'Menyimpan Draft...' : 'Simpan Draft & Keluar'}</span>
        </button>
      </div>

      {/* Minimalist Stepper Bar */}
      <nav aria-label="Tahapan Generate Surat" className="mb-5 overflow-x-auto rounded-xl border border-slate-200/80 bg-white px-4 py-3">
        <ol className="flex min-w-[740px] items-center justify-between gap-2">
          {workflowSteps.map((step, index) => {
            const isActive = activeStep === step.id;
            const isCompleted = activeStep > step.id;

            return (
              <React.Fragment key={step.id}>
                <li
                  aria-current={isActive ? 'step' : undefined}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-2 py-1 transition ${
                    isActive ? 'bg-[#0F2C59]/[0.06]' : ''
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isActive
                          ? 'bg-[#0F2C59] text-white ring-4 ring-[#0F2C59]/10'
                          : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="h-3 w-3 stroke-[3]" /> : step.id}
                  </span>
                  <span
                    className={`text-xs transition ${
                      isActive
                        ? 'font-bold text-[#0F2C59]'
                        : isCompleted
                          ? 'font-semibold text-slate-700'
                          : 'font-medium text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </li>

                {index < workflowSteps.length - 1 && (
                  <li aria-hidden="true" className="flex-1 min-w-[16px]">
                    <div
                      className={`h-px w-full transition ${
                        isCompleted ? 'bg-emerald-400' : 'bg-slate-200'
                      }`}
                    />
                  </li>
                )}
              </React.Fragment>
            );
          })}
        </ol>
      </nav>

      <form onSubmit={handleSubmit} onInvalidCapture={handleInvalidCapture} onChangeCapture={() => setSubmitNotice('')}>
        {(submitNotice || validationErrorEntries.length > 0) && (
          <div role="alert" className="mb-4 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <p className="font-bold">{activeStep >= 2 ? 'Draft ST & SPD belum terkirim' : 'Nota belum lengkap'}</p>
            <p className="mt-1">
              {submitNotice || (activeStep >= 2
              ? 'Periksa kembali kolom wajib berikut sebelum dikirim ke Kapus.'
                : 'Periksa kembali kolom wajib sebelum melanjutkan ke draft ST & SPD.')}
            </p>
            {validationErrorEntries.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                {validationErrorEntries.map(([field, message]) => <li key={field}>{message}</li>)}
              </ul>
            )}
          </div>
        )}
        {/* ================= TAHAP 1: INPUT NOTA / UNDANGAN ================= */}
        {activeStep === 1 && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  <span>Tahap 1: Registrasi Nota / Undangan Masuk</span>
                </h2>
                <p className="text-xs text-slate-500">Pemicu awal usulan penugasan dinas (Input oleh Pemohon / Sesparlu)</p>
              </div>
              <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full">
                Aktor: Pemohon / Sesparlu
              </span>
            </div>

            {/* Kategori Perjalanan Dinas */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4">
              <label className="block text-xs font-bold text-blue-900 mb-2">
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
                  <option value="INTERNAL">Pihak Internal</option>
                  <option value="EKSTERNAL">Pihak Eksternal</option>
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
                  <span>{data.file_undangan?.name || draftAttachments.invitation?.name || 'Klik untuk mengunggah scan undangan'}</span>
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
                      required={!draftAttachments.setneg?.url && !data.file_izin_setneg}
                      onChange={(e) => setData('file_izin_setneg', e.target.files[0] || null)}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                    <Upload className="h-5 w-5 text-amber-600" />
                    <span>{data.file_izin_setneg?.name || draftAttachments.setneg?.name || 'Klik untuk mengunggah Surat Persetujuan Setneg'}</span>
                    <span className="text-[10px] text-amber-700">PDF atau DOCX, maks. 10 MB</span>
                  </label>
                  {errors.file_izin_setneg && <p className="mt-1 text-xs text-red-600">{errors.file_izin_setneg}</p>}
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={processing || savingDraft}
                className="inline-flex items-center space-x-2 bg-[#0F2C59] hover:bg-slate-800 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>{processing ? 'Menyimpan Nota...' : 'Simpan Nota & Lanjutkan ke Draft Personel & SPD'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= TAHAP 2: DRAFT PERSONEL & DETAIL PERJALANAN ================= */}
        {activeStep === 2 && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  <span>Tahap 2: Draft Personel Ditugaskan & Rincian SPD</span>
                </h2>
                <p className="text-xs text-slate-500">Pilih Pejabat Komitmen (PPK) & Personel Pegawai yang ditugaskan</p>
              </div>
              <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full">
                Aktor: Sesparlu / Konseptor
              </span>
            </div>

            {/* Select PPK */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
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
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    <span>Pegawai Ditugaskan (Snapshot Data Protection)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Profil pangkat & golongan pegawai dikunci saat dokumen dibuat</p>
                </div>
                <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {selectedPegawaiIds.length} Pegawai Dipilih
                </span>
              </div>

              {/* Searchable Combobox Pegawai */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div ref={pegawaiDropdownRef} className="relative flex-1">
                  <input
                    type="text"
                    value={pegawaiSearch}
                    onChange={(e) => { setPegawaiSearch(e.target.value); setSelectedMasterId(''); setPegawaiDropdownOpen(true); }}
                    onFocus={() => setPegawaiDropdownOpen(true)}
                    placeholder="Ketik nama atau NIP untuk cari pegawai..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  {pegawaiDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                      <ul className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                        {(pegawaiList || [])
                          .filter((peg) => {
                            const q = pegawaiSearch.toLowerCase();
                            return !q || peg.nama.toLowerCase().includes(q) || (peg.nip || '').includes(q);
                          })
                          .slice(0, 30)
                          .map((peg) => (
                            <li
                              key={peg.id}
                              onClick={() => {
                                setSelectedMasterId(String(peg.id));
                                setPegawaiSearch(`${peg.nama} (NIP: ${peg.nip})`);
                                setPegawaiDropdownOpen(false);
                              }}
                              className="px-3 py-2 cursor-pointer hover:bg-amber-50 text-xs"
                            >
                              <span className="font-semibold text-slate-800">{peg.nama}</span>
                              <span className="text-slate-500 ml-1">— NIP: {peg.nip}</span>
                              <div className="text-[10px] text-slate-400 truncate">{peg.jabatan}</div>
                            </li>
                          ))}
                        {(pegawaiList || []).filter((peg) => {
                          const q = pegawaiSearch.toLowerCase();
                          return !q || peg.nama.toLowerCase().includes(q) || (peg.nip || '').includes(q);
                        }).length === 0 && (
                          <li className="px-3 py-3 text-xs text-slate-400 text-center">Pegawai tidak ditemukan</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleAddPegawai();
                    setPegawaiSearch('');
                    setSelectedMasterId('');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center justify-center space-x-1 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah</span>
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
                      {jadwalMode === 'per_pegawai' && (
                        <>
                          <th className="py-2.5 px-3 min-w-[130px]">Tgl. Berangkat</th>
                          <th className="py-2.5 px-3 min-w-[130px]">Tgl. Kembali</th>
                          <th className="py-2.5 px-3 text-center w-16">Hari</th>
                        </>
                      )}
                      <th className="py-2.5 px-3 text-center w-16">Hapus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedPegawaiIds.length > 0 ? (
                      selectedPegawaiIds.map((id, index) => {
                        const peg = pegawaiList.find((p) => p.id === id);
                        if (!peg) return null;
                        const jadwal = jadwalPerPegawai[id] || { tanggal_berangkat: '', tanggal_kembali: '' };
                        const hariPeg = calcDays(jadwal.tanggal_berangkat, jadwal.tanggal_kembali);
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
                            {jadwalMode === 'per_pegawai' && (
                              <>
                                <td className="py-2 px-3">
                                  <input
                                    type="date"
                                    value={jadwal.tanggal_berangkat}
                                    onChange={(e) => handleJadwalPerPegawaiChange(peg.id, 'tanggal_berangkat', e.target.value)}
                                    className="w-full px-2 py-1 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                  />
                                </td>
                                <td className="py-2 px-3">
                                  <input
                                    type="date"
                                    value={jadwal.tanggal_kembali}
                                    min={jadwal.tanggal_berangkat || undefined}
                                    onChange={(e) => handleJadwalPerPegawaiChange(peg.id, 'tanggal_kembali', e.target.value)}
                                    className="w-full px-2 py-1 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                  />
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <span className="inline-block bg-blue-50 text-blue-800 font-bold text-[11px] px-2 py-0.5 rounded-full">
                                    {jadwal.tanggal_berangkat && jadwal.tanggal_kembali ? `${hariPeg}h` : '—'}
                                  </span>
                                </td>
                              </>
                            )}
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
                        <td colSpan={jadwalMode === 'per_pegawai' ? 8 : 5} className="py-6 text-center text-slate-400">
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  <span>Lokasi &amp; Waktu Perjalanan Dinas</span>
                </h3>

                {/* Toggle Single/Multi-Trip & mode jadwal */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-200 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => handleToggleMultiTrip(false)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                        !data.is_multi_trip
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Single Trip (1 Tujuan)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleMultiTrip(true)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                        data.is_multi_trip
                          ? 'bg-[#0F2C59] text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Multi-Trip (Beberapa Kota)
                    </button>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-200 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => setJadwalMode('sama')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                        jadwalMode === 'sama'
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Jadwal Sama
                    </button>
                    <button
                      type="button"
                      onClick={() => setJadwalMode('per_pegawai')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                        jadwalMode === 'per_pegawai'
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Jadwal per Pegawai
                    </button>
                  </div>
                </div>
              </div>

              {jadwalMode === 'per_pegawai' && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-800">
                  <Calendar className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
                  <span>Mode <strong>Jadwal per Pegawai</strong> aktif — isi tanggal berangkat &amp; kembali langsung di tabel pegawai di atas. Tempat berangkat &amp; tujuan tetap berlaku untuk semua.</span>
                </div>
              )}

              {data.is_multi_trip ? (
                <div className="space-y-3">
                  {/* Kota Asal & Izin Setneg (jika LN) */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Tempat Berangkat (Asal &amp; Kembali) *</label>
                      <SearchableSelect
                        name="tempat_berangkat"
                        required
                        value={data.tempat_berangkat}
                        onChange={(val) => setData('tempat_berangkat', val)}
                        options={DEPARTURE_OPTIONS}
                        placeholder="Pilih kota keberangkatan"
                        searchPlaceholder="Cari kota/kabupaten keberangkatan..."
                      />
                    </div>
                    {data.kategori_perjalanan === 'LUAR_NEGERI' && (
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
                    )}
                  </div>

                  {/* Daftar Tahap Rute Multi-Trip */}
                  <div className="rounded-xl border border-blue-200/80 bg-white p-3.5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-800">
                          Rute Perjalanan Multi-Trip
                        </p>
                        <InfoTooltip
                          label="Contoh"
                          title="Panduan Perjalanan Multi-Trip"
                          text="Susun hingga 4 kota tujuan berurutan (misal: Jakarta → Bali 2 hari → Yogyakarta 3 hari → Kembali ke Jakarta). Setiap rute otomatis mengisi kotak II–V pada Lembar Visum Rampungan."
                        />
                      </div>
                      {(data.rute_perjalanan || []).length < 4 && (
                        <button
                          type="button"
                          onClick={handleAddMultiTripLeg}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#0F2C59] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1a3e7a] transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah Kota Tujuan</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      {(data.rute_perjalanan || []).map((leg, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-1 gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 p-3 sm:grid-cols-12 items-end"
                        >
                          <div className={data.kategori_perjalanan === 'LUAR_NEGERI' ? 'sm:col-span-3' : 'sm:col-span-5'}>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Tujuan {idx + 1} (Kota / Lokasi) *
                            </label>
                            <input
                              type="text"
                              required
                              value={leg.tujuan || ''}
                              onChange={(e) => handleMultiTripLegChange(idx, 'tujuan', e.target.value)}
                              placeholder={idx === 0 ? 'Contoh: Denpasar, Bali' : 'Contoh: Yogyakarta'}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                            />
                          </div>

                          {data.kategori_perjalanan === 'LUAR_NEGERI' && (
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-bold text-amber-800 mb-1">Negara *</label>
                              <input
                                type="text"
                                required
                                value={leg.negara || ''}
                                onChange={(e) => handleMultiTripLegChange(idx, 'negara', e.target.value)}
                                placeholder="Negara"
                                className="w-full rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs"
                              />
                            </div>
                          )}

                          <div className="sm:col-span-3">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Tanggal Mulai / Tiba *
                            </label>
                            <input
                              type="date"
                              required
                              value={leg.tanggal_berangkat || ''}
                              min={idx > 0 ? (data.rute_perjalanan[idx - 1]?.tanggal_kembali || undefined) : undefined}
                              onChange={(e) => handleMultiTripLegChange(idx, 'tanggal_berangkat', e.target.value)}
                              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Tanggal Selesai / Lanjut *
                            </label>
                            <input
                              type="date"
                              required
                              value={leg.tanggal_kembali || ''}
                              min={leg.tanggal_berangkat || undefined}
                              onChange={(e) => handleMultiTripLegChange(idx, 'tanggal_kembali', e.target.value)}
                              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                            />
                          </div>

                          <div className="sm:col-span-1 flex items-center justify-between sm:justify-end gap-1.5 pb-0.5">
                            <span className="rounded-md bg-blue-100 px-2 py-1 text-[10px] font-extrabold text-blue-900 whitespace-nowrap">
                              {leg.durasi_hari || 1} hr
                            </span>
                            {(data.rute_perjalanan || []).length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMultiTripLeg(idx)}
                                title="Hapus tujuan ini"
                                className="rounded-lg p-1 text-rose-500 hover:bg-rose-100"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Visual Alur Rute Multi-Trip */}
                    <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-[11px] text-slate-700">
                      <span className="font-bold text-slate-900">{data.tempat_berangkat || 'Jakarta'}</span>
                      {(data.rute_perjalanan || []).map((leg, i) => (
                        <React.Fragment key={i}>
                          <span className="text-amber-600 font-bold">→</span>
                          <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 font-semibold text-slate-800">
                            {leg.tujuan || `Tujuan ${i + 1}`} <span className="text-blue-700">({leg.durasi_hari || 1} hr)</span>
                          </span>
                        </React.Fragment>
                      ))}
                      <span className="text-amber-600 font-bold">→</span>
                      <span className="font-bold text-emerald-700">{data.tempat_berangkat || 'Jakarta'} (Kembali)</span>
                    </div>
                  </div>
                </div>
              ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tempat Berangkat *</label>
                  <SearchableSelect
                    name="tempat_berangkat"
                    required
                    value={data.tempat_berangkat}
                    onChange={(val) => setData('tempat_berangkat', val)}
                    options={DEPARTURE_OPTIONS}
                    placeholder="Pilih kota keberangkatan"
                    searchPlaceholder="Cari kota/kabupaten keberangkatan..."
                  />
                </div>

                <div>
                  <label
                    className={`block text-xs font-semibold mb-1 ${
                      data.kategori_perjalanan === 'LUAR_NEGERI' ? 'text-amber-800' : 'text-slate-700'
                    }`}
                  >
                    Negara Tujuan *
                  </label>
                  {data.kategori_perjalanan === 'LUAR_NEGERI' ? (
                    <SearchableSelect
                      name="negara_tujuan"
                      required
                      variant="amber"
                      value={data.negara_tujuan}
                      onChange={handleNegaraTujuanChange}
                      options={WORLD_COUNTRIES}
                      placeholder="Pilih atau cari negara tujuan"
                      searchPlaceholder="Cari negara tujuan..."
                    />
                  ) : (
                    <SearchableSelect
                      name="negara_tujuan_domestik"
                      value="Indonesia"
                      onChange={() => {}}
                      options={[{ value: 'Indonesia', label: 'Indonesia', sublabel: 'Perjalanan Dinas Dalam Negeri' }]}
                      placeholder="Indonesia"
                      searchPlaceholder="Cari negara..."
                      allowCustom={false}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {data.kategori_perjalanan === 'LUAR_NEGERI'
                      ? 'Provinsi / Negara Bagian / Wilayah *'
                      : 'Provinsi Tujuan *'}
                  </label>
                  <SearchableSelect
                    name="provinsi_tujuan"
                    required={!kotaTujuan}
                    value={provinsiTujuan}
                    onChange={handleProvinsiTujuanChange}
                    options={provinceOptions}
                    placeholder={
                      data.kategori_perjalanan === 'LUAR_NEGERI'
                        ? 'Pilih provinsi / wilayah / state'
                        : 'Pilih provinsi tujuan'
                    }
                    searchPlaceholder={
                      data.kategori_perjalanan === 'LUAR_NEGERI'
                        ? 'Cari wilayah / negara bagian / prefektur...'
                        : 'Cari provinsi di Indonesia...'
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {data.kategori_perjalanan === 'LUAR_NEGERI'
                      ? 'Kota Tujuan *'
                      : 'Kota / Kabupaten Tujuan *'}
                  </label>
                  <SearchableSelect
                    name="tempat_tujuan"
                    required
                    value={kotaTujuan}
                    onChange={handleKotaTujuanChange}
                    options={cityOptions}
                    placeholder={
                      data.kategori_perjalanan === 'LUAR_NEGERI'
                        ? 'Pilih atau cari kota tujuan'
                        : 'Pilih kota / kabupaten tujuan'
                    }
                    searchPlaceholder={
                      data.kategori_perjalanan === 'LUAR_NEGERI'
                        ? 'Cari kota tujuan luar negeri...'
                        : 'Cari kota atau kabupaten...'
                    }
                  />
                </div>

                {data.kategori_perjalanan === 'LUAR_NEGERI' && (
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
                )}

                {jadwalMode === 'sama' && (
                  <>
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
                        min={data.tanggal_berangkat || undefined}
                        onChange={(e) => handleDateChange('tanggal_kembali', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>
                  </>
                )}
              </div>
              )}

              {data.tempat_tujuan && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                  <span>Tujuan tercatat pada dokumen ST &amp; SPD:</span>
                  <strong className="font-bold text-slate-900">
                    {data.tempat_tujuan}
                    {data.kategori_perjalanan === 'LUAR_NEGERI' && data.negara_tujuan
                      ? ` (${data.negara_tujuan})`
                      : ''}
                  </strong>
                </div>
              )}

              {/* Kalkulasi durasi */}
              {jadwalMode === 'sama' ? (
                <div className="flex items-center justify-between text-xs text-blue-900 bg-blue-50 p-3 rounded-xl border border-blue-200">
                  <span>Kalkulasi Otomatis Durasi Dinas:</span>
                  <strong className="text-sm font-extrabold text-blue-950">{data.durasi_hari} Hari Perjalanan</strong>
                </div>
              ) : selectedPegawaiIds.length > 0 ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-blue-800 mb-2">Ringkasan Durasi per Pegawai:</p>
                  <div className="divide-y divide-blue-100">
                    {selectedPegawaiIds.map((id) => {
                      const peg = pegawaiList.find((p) => p.id === id);
                      const jadwal = jadwalPerPegawai[id] || {};
                      const hari = calcDays(jadwal.tanggal_berangkat, jadwal.tanggal_kembali);
                      return (
                        <div key={id} className="flex items-center justify-between py-1.5 text-xs">
                          <span className="text-blue-900 font-medium">{peg?.nama}</span>
                          <span className="font-bold text-blue-950">
                            {jadwal.tanggal_berangkat && jadwal.tanggal_kembali
                              ? `${hari} Hari`
                              : <span className="text-amber-600">Belum diisi</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="inline-flex items-center space-x-1 text-slate-600 hover:text-slate-800 font-semibold text-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Kembali ke Nota / Undangan</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSubmitNotice('');
                  if (selectedPegawaiIds.length === 0) {
                    setSubmitNotice('Pilih setidaknya 1 pegawai pelaksana terlebih dahulu.');
                    return;
                  }
                  if (!data.ppk_id || !data.tingkat_biaya_kode || !data.jenis_angkutan_nama || !data.tempat_tujuan) {
                    setSubmitNotice('Lengkapi PPK, Tingkat Biaya, Jenis Angkutan, dan Tujuan Perjalanan terlebih dahulu.');
                    return;
                  }
                  if (jadwalMode === 'sama' && (!data.tanggal_berangkat || !data.tanggal_kembali)) {
                    setSubmitNotice('Lengkapi Tanggal Berangkat dan Tanggal Kembali terlebih dahulu.');
                    return;
                  }
                  setActiveStep(3);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={processing || savingDraft || selectedPegawaiIds.length === 0}
                className="inline-flex items-center space-x-2 bg-[#0F2C59] hover:bg-[#1a3e7a] text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-lg transition transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>Lanjut ke RPD &amp; Daftar Nominatif</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: RPD & DAFTAR NOMINATIF ================= */}
        {activeStep === 3 && (
          <RpdStepForm
            data={data}
            setData={setData}
            selectedPegawaiIds={selectedPegawaiIds}
            pegawaiList={pegawaiList}
            bendaharaList={bendaharaList}
            onBack={() => {
              setActiveStep(2);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            processing={processing}
            savingDraft={savingDraft}
          />
        )}

        {/* Tahap berikutnya (Disposisi Kapus & Penomoran TU) dilakukan di halaman Show.jsx */}
      </form>
    </AdminLayout>
  );
}
