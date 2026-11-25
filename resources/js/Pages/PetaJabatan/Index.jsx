import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import InfoTooltip from '@/Components/InfoTooltip';
import {
  Users,
  UserPlus,
  Trash2,
  Search,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  SlidersHorizontal,
} from 'lucide-react';

function AvatarBadge({ pegawai, size = 'sm' }) {
  const dim = size === 'lg' ? 'h-11 w-11 text-sm' : 'h-7 w-7 text-[10px]';
  if (pegawai?.foto_url) {
    return (
      <img
        src={pegawai.foto_url}
        alt={pegawai.nama}
        className={`${dim} shrink-0 rounded-md object-cover border border-slate-200 bg-slate-100`}
      />
    );
  }
  const initials = (pegawai?.nama || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className={`${dim} shrink-0 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600`}>
      {initials}
    </div>
  );
}

function LeaderCard({
  position,
  canManage,
  onSelect,
  headerBg = '#4f7c33',
  headerColor = '#ffffff',
  highlight = false,
}) {
  if (!position) return null;
  const assigned = position.assignments?.[0] || null;

  return (
    <div
      onClick={() => canManage && onSelect(position)}
      style={{ border: '1.5px solid #0f172a', backgroundColor: '#ffffff' }}
      className={`overflow-hidden transition ${canManage ? 'cursor-pointer hover:ring-2 hover:ring-amber-400' : ''
        } ${highlight ? 'ring-2 ring-amber-500' : ''}`}
    >
      <div
        style={{ backgroundColor: headerBg, color: headerColor, borderBottom: '1px solid #0f172a' }}
        className="px-2 py-1 text-center"
      >
        <p className="text-[9.5px] font-extrabold leading-tight uppercase tracking-tight">
          {position.nama_jabatan}
        </p>
      </div>
      <div className="px-2 py-2 text-center bg-white min-h-[54px] flex flex-col justify-center">
        {position.kelas && (
          <p className="text-[9.5px] font-bold text-slate-700 mb-1">(Kelas: {position.kelas})</p>
        )}
        {assigned?.pegawai ? (
          <div className="flex items-center justify-center gap-2">
            <AvatarBadge pegawai={assigned.pegawai} size="lg" />
            <div className="text-left min-w-0">
              <p className="text-[11px] font-extrabold text-slate-900 leading-tight truncate">
                {assigned.pegawai.nama}
              </p>
              {assigned.catatan && (
                <p className="text-[9.5px] font-semibold text-amber-700 leading-tight">({assigned.catatan})</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 py-0.5">
            {canManage ? (
              <>
                <UserPlus className="h-3 w-3 text-amber-600" />
                <span className="font-semibold text-slate-500">Klik isi jabatan</span>
              </>
            ) : (
              <span className="italic">— Belum diisi —</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DirekturUptCard({ positions = [], canManage, onSelect, searchLower }) {
  if (positions.length === 0) return null;

  return (
    <div style={{ border: '1.5px solid #0f172a', backgroundColor: '#ffffff' }}>
      <div
        style={{ backgroundColor: '#4f7c33', color: '#ffffff', borderBottom: '1px solid #0f172a' }}
        className="px-2.5 py-1.5 space-y-0.5"
      >
        {positions.map((pos, idx) => (
          <p key={pos.id} className="text-[9px] font-extrabold leading-tight uppercase">
            {idx + 1}. {pos.nama_jabatan}
          </p>
        ))}
      </div>
      <div
        style={{ borderBottom: '1px solid #0f172a', backgroundColor: '#f8fafc' }}
        className="py-0.5 text-center text-[9.5px] font-bold text-slate-800"
      >
        (Kelas: 14)
      </div>
      <div>
        {positions.map((pos, idx) => {
          const assigned = pos.assignments?.[0] || null;
          const isMatch = searchLower && (
            pos.nama_jabatan.toLowerCase().includes(searchLower) ||
            assigned?.pegawai?.nama?.toLowerCase().includes(searchLower)
          );
          return (
            <div
              key={pos.id}
              onClick={() => canManage && onSelect(pos)}
              style={{ borderBottom: idx < positions.length - 1 ? '1px solid #0f172a' : 'none' }}
              className={`px-2.5 py-1.5 flex items-center justify-between gap-2 transition ${canManage ? 'cursor-pointer hover:bg-amber-50' : ''
                } ${isMatch ? 'bg-amber-100' : 'bg-white'}`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-[8.5px] font-bold text-slate-500 uppercase leading-none">
                  {idx + 1}. {pos.nama_jabatan.replace('DIREKTUR UNIT PELAKSANA TEKNIS ', 'UPT ')}
                </p>
                {assigned?.pegawai ? (
                  <div className="mt-1 flex items-center gap-1.5">
                    <AvatarBadge pegawai={assigned.pegawai} size="sm" />
                    <div className="min-w-0">
                      <p className="text-[10.5px] font-bold text-slate-900 truncate">{assigned.pegawai.nama}</p>
                      {assigned.catatan && (
                        <p className="text-[9px] text-amber-700">({assigned.catatan})</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mt-0.5 text-[9.5px] italic text-slate-400">
                    {canManage ? '+ Klik isi Direktur UPT' : '— Belum diisi —'}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function JabatanTable({ positions = [], canManage, onSelect, searchLower }) {
  if (positions.length === 0) return null;

  return (
    <div style={{ border: '1.5px solid #0f172a', backgroundColor: '#ffffff' }}>
      <table className="w-full border-collapse text-[9.5px] leading-tight">
        <thead>
          <tr style={{ backgroundColor: '#f5b700', color: '#0f172a' }} className="font-extrabold text-center">
            <th style={{ border: '1px solid #0f172a' }} className="px-1.5 py-1.5 text-center w-[34%]">Jabatan</th>
            <th style={{ border: '1px solid #0f172a' }} className="px-1.5 py-1.5 text-center">Nama</th>
            <th style={{ border: '1px solid #0f172a' }} className="px-1 py-1.5 w-[28px]">KLS</th>
            <th style={{ border: '1px solid #0f172a' }} className="px-1 py-1.5 w-[22px]">B</th>
            <th style={{ border: '1px solid #0f172a' }} className="px-1 py-1.5 w-[22px]">K</th>
            <th style={{ border: '1px solid #0f172a' }} className="px-1 py-1.5 w-[26px]">-/+</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((pos) => {
            const assignments = pos.assignments || [];
            const isMatch = searchLower && (
              pos.nama_jabatan.toLowerCase().includes(searchLower) ||
              assignments.some((a) => a.pegawai?.nama?.toLowerCase().includes(searchLower))
            );
            const selisih = pos.selisih ?? (assignments.length - pos.kebutuhan);

            return (
              <tr
                key={pos.id}
                onClick={() => canManage && onSelect(pos)}
                className={`align-middle transition ${canManage ? 'cursor-pointer hover:bg-amber-50' : ''
                  } ${isMatch ? 'bg-amber-100' : 'bg-white'}`}
              >
                <td style={{ border: '1px solid #0f172a' }} className="px-1.5 py-1.5 text-center font-semibold text-slate-900">
                  {pos.nama_jabatan}
                </td>
                <td style={{ border: '1px solid #0f172a' }} className="px-1.5 py-1.5">
                  {assignments.length === 0 ? (
                    <span className="block text-center italic text-[9px] text-slate-400">
                      {canManage ? '+ Kosong' : '—'}
                    </span>
                  ) : (
                    <div className="space-y-1">
                      {assignments.map((a) => (
                        <div key={a.id} className="flex items-center gap-1.5">
                          <AvatarBadge pegawai={a.pegawai} size="sm" />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 leading-tight truncate">
                              {a.pegawai?.nama || '-'}
                            </p>
                            {a.catatan && (
                              <p className="text-[8.5px] font-semibold text-amber-700 leading-tight">({a.catatan})</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                <td style={{ border: '1px solid #0f172a' }} className="px-1 py-1.5 text-center font-mono text-slate-800">
                  {pos.kelas ?? '-'}
                </td>
                <td style={{ border: '1px solid #0f172a' }} className="px-1 py-1.5 text-center font-mono font-bold text-slate-900">
                  {assignments.length}
                </td>
                <td style={{ border: '1px solid #0f172a' }} className="px-1 py-1.5 text-center font-mono text-slate-800">
                  {pos.kebutuhan}
                </td>
                <td
                  style={{
                    border: '1px solid #0f172a',
                    backgroundColor: selisih < 0 ? '#fecdd3' : selisih > 0 ? '#dbeafe' : '#ffffff',
                  }}
                  className={`px-1 py-1.5 text-center font-mono font-bold ${selisih < 0 ? 'text-rose-700' : selisih > 0 ? 'text-blue-700' : 'text-slate-800'
                    }`}
                >
                  {selisih > 0 ? `+${selisih}` : selisih}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AlihDayaCard({ position, canManage, onSelect, searchLower }) {
  if (!position) return null;
  const assignments = position.assignments || [];
  const isMatch = searchLower && (
    'alih daya'.includes(searchLower) ||
    assignments.some((a) => a.pegawai?.nama?.toLowerCase().includes(searchLower))
  );

  return (
    <div
      onClick={() => canManage && onSelect(position)}
      style={{ border: '1.5px solid #0f172a', backgroundColor: '#ffffff' }}
      className={`overflow-hidden transition ${canManage ? 'cursor-pointer hover:ring-2 hover:ring-amber-400' : ''
        } ${isMatch ? 'ring-2 ring-amber-500' : ''}`}
    >
      <div
        style={{ backgroundColor: '#67e8f9', color: '#0f172a', borderBottom: '1px solid #0f172a' }}
        className="px-2.5 py-1.5 text-center"
      >
        <p className="text-[10px] font-extrabold uppercase tracking-wider">
          ALIH DAYA ({assignments.length}/{position.kebutuhan})
        </p>
      </div>
      <div className="p-2">
        {assignments.length === 0 ? (
          <p className="text-center text-[9.5px] italic text-slate-400 py-1">
            {canManage ? '+ Klik tambah alih daya' : '— Belum diisi —'}
          </p>
        ) : (
          <div className="divide-y divide-slate-300">
            {assignments.map((a) => (
              <div key={a.id} className="flex items-center gap-2 py-1">
                <AvatarBadge pegawai={a.pegawai} size="sm" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-900 truncate">{a.pegawai?.nama || '-'}</p>
                  {a.catatan && <p className="text-[8.5px] text-amber-700">({a.catatan})</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PetaJabatanIndex({
  positions = [],
  pegawaiOptions = [],
  canManage = false,
  summary = { total_jabatan: 0, total_kebutuhan: 0, total_bezetting: 0, selisih: 0 },
}) {
  const [zoom, setZoom] = useState(65);
  const [isPanning, setIsPanning] = useState(false);
  const viewportRef = useRef(null);
  const panStateRef = useRef({ active: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPositionId, setSelectedPositionId] = useState(null);
  const [pegawaiSearch, setPegawaiSearch] = useState('');
  const [selectedPegawaiId, setSelectedPegawaiId] = useState('');
  const [catatan, setCatatan] = useState('');
  const [kebutuhanInput, setKebutuhanInput] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Right-click (button 2) or middle-click (button 1) drag-to-pan
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!panStateRef.current.active || !viewportRef.current) return;
      e.preventDefault();
      const dx = e.clientX - panStateRef.current.startX;
      const dy = e.clientY - panStateRef.current.startY;
      viewportRef.current.scrollLeft = panStateRef.current.scrollLeft - dx;
      viewportRef.current.scrollTop = panStateRef.current.scrollTop - dy;
    };

    const handleMouseUp = () => {
      if (panStateRef.current.active) {
        panStateRef.current.active = false;
        setIsPanning(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleCanvasMouseDown = (e) => {
    // 2 = klik kanan, 1 = klik tengah
    if ((e.button === 2 || e.button === 1) && viewportRef.current) {
      e.preventDefault();
      panStateRef.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        scrollLeft: viewportRef.current.scrollLeft,
        scrollTop: viewportRef.current.scrollTop,
      };
      setIsPanning(true);
    }
  };

  const handleCanvasWheel = (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      setZoom((prev) => {
        const next = e.deltaY < 0 ? prev + 5 : prev - 5;
        return Math.min(150, Math.max(40, next));
      });
    }
  };

  const searchLower = searchQuery.trim().toLowerCase();

  const bySection = useMemo(() => {
    const map = {};
    positions.forEach((pos) => {
      if (!map[pos.section]) map[pos.section] = [];
      map[pos.section].push(pos);
    });
    return map;
  }, [positions]);

  const selectedPosition = useMemo(
    () => positions.find((p) => p.id === selectedPositionId) || null,
    [positions, selectedPositionId]
  );

  const openManageModal = (pos) => {
    setSelectedPositionId(pos.id);
    setKebutuhanInput(pos.kebutuhan);
    setSelectedPegawaiId('');
    setCatatan('');
    setPegawaiSearch('');
  };

  const filteredPegawaiOptions = useMemo(() => {
    const q = pegawaiSearch.trim().toLowerCase();
    const assignedIds = new Set((selectedPosition?.assignments || []).map((a) => a.pegawai_id));
    return pegawaiOptions.filter((p) => {
      if (assignedIds.has(p.id)) return false;
      if (!q) return true;
      return `${p.nama} ${p.nip} ${p.jabatan} ${p.upt_bidang}`.toLowerCase().includes(q);
    });
  }, [pegawaiOptions, pegawaiSearch, selectedPosition]);

  const handleAssign = (e) => {
    e.preventDefault();
    if (!selectedPosition || !selectedPegawaiId || submitting) return;
    router.post(
      route('peta-jabatan.assign', selectedPosition.id),
      { pegawai_id: selectedPegawaiId, catatan },
      {
        preserveScroll: true,
        onStart: () => setSubmitting(true),
        onSuccess: () => {
          setSelectedPegawaiId('');
          setCatatan('');
        },
        onFinish: () => setSubmitting(false),
      }
    );
  };

  const handleUnassign = (assignmentId) => {
    if (submitting) return;
    router.delete(route('peta-jabatan.unassign', assignmentId), {
      preserveScroll: true,
      onStart: () => setSubmitting(true),
      onFinish: () => setSubmitting(false),
    });
  };

  const handleUpdateKebutuhan = () => {
    if (!selectedPosition || submitting) return;
    router.put(
      route('peta-jabatan.update-position', selectedPosition.id),
      { kebutuhan: Number(kebutuhanInput) || 0, kelas: selectedPosition.kelas },
      {
        preserveScroll: true,
        onStart: () => setSubmitting(true),
        onFinish: () => setSubmitting(false),
      }
    );
  };

  const kapus = bySection.pimpinan?.[0] || null;
  const direkturUptList = bySection.direktur_upt || [];

  const bid1Head = bySection.bidang_1_head?.[0] || null;
  const bid1Rows = bySection.bidang_1 || [];

  const bid2Head = bySection.bidang_2_head?.[0] || null;
  const bid2Rows = bySection.bidang_2 || [];
  const bid2AlihDaya = bySection.bidang_2_alih_daya?.[0] || null;

  const bid3Head = bySection.bidang_3_head?.[0] || null;
  const bid3Rows = bySection.bidang_3 || [];
  const bid3JfMadya = bySection.bidang_3_jf_madya || [];

  const bid4Head = bySection.bidang_4_head?.[0] || null;
  const bid4Rows = bySection.bidang_4 || [];

  const tuHead = bySection.bagian_tu_head?.[0] || null;
  const tuKeuHead = bySection.tu_subbag_keuangan_head?.[0] || null;
  const tuKeuRows = bySection.tu_subbag_keuangan || [];
  const tuSdmHead = bySection.tu_subbag_sdm_head?.[0] || null;
  const tuSdmRows = bySection.tu_subbag_sdm || [];
  const tuAlihDaya = bySection.tu_alih_daya?.[0] || null;

  return (
    <AdminLayout title="Peta Jabatan Pusdiklat">
      <Head title="Peta Jabatan - E-Jaldis Pusdiklat Kemlu" />
      <style>{`
        @page { size: A3 landscape; margin: 8mm; }
        @media print {
          .no-print, header, aside, footer { display: none !important; }
          .peta-canvas-outer { overflow: visible !important; border: 0 !important; box-shadow: none !important; padding: 0 !important; }
          .peta-canvas-zoom { transform: none !important; width: 100% !important; }
        }
      `}</style>

      {/* Top Page Header */}
      <div className="no-print mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              Peta Jabatan Pusat Pendidikan dan Pelatihan
            </h1>
            <InfoTooltip
              label="Petunjuk"
              title="Panduan Peta Jabatan"
              text={
                canManage
                  ? 'Sesuai Kepmenlu No 7 Tahun 2025. Klik pada kotak jabatan atau baris tabel mana saja untuk menetapkan atau mengubah pegawai. Klik tahan kanan mouse untuk menggeser bagan, dan gunakan Ctrl + Scroll atau tombol -/+ untuk zoom.'
                  : 'Sesuai Kepmenlu No 7 Tahun 2025. Klik tahan kanan mouse untuk menggeser bagan, dan gunakan Ctrl + Scroll atau tombol -/+ untuk mengatur ukuran tampilan.'
              }
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 transition hover:bg-amber-400"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Cetak / PDF</span>
        </button>
      </div>

      {/* Compact KPI Summary */}
      <div className="no-print mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white px-4 py-2.5">
          <div>
            <p className="text-[11px] font-medium text-slate-500">Total Posisi Jabatan</p>
            <p className="text-lg font-extrabold text-slate-900">{summary.total_jabatan}</p>
          </div>
          <Briefcase className="h-4 w-4 text-indigo-500" />
        </div>
        <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white px-4 py-2.5">
          <div>
            <p className="text-[11px] font-medium text-slate-500">Total Kebutuhan (K)</p>
            <p className="text-lg font-extrabold text-slate-900">{summary.total_kebutuhan}</p>
          </div>
          <Users className="h-4 w-4 text-amber-500" />
        </div>
        <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white px-4 py-2.5">
          <div>
            <p className="text-[11px] font-medium text-slate-500">Terisi / Bezetting (B)</p>
            <p className="text-lg font-extrabold text-emerald-700">{summary.total_bezetting}</p>
          </div>
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        </div>
        <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white px-4 py-2.5">
          <div>
            <p className="text-[11px] font-medium text-slate-500">Selisih (-/+)</p>
            <p className={`text-lg font-extrabold ${summary.selisih < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              {summary.selisih > 0 ? `+${summary.selisih}` : summary.selisih}
            </p>
          </div>
          <AlertCircle className="h-4 w-4 text-rose-500" />
        </div>
      </div>

      {/* Org Chart Canvas Container */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100/90">
        {/* Single Unified Canvas Toolbar */}
        <div className="no-print flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-3.5 py-2">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sorot jabatan / pegawai..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-1.5 pl-8 pr-3 text-xs transition focus:border-amber-500 focus:bg-white focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <InfoTooltip
              align="right"
              label="Navigasi"
              title="Navigasi Kanvas"
              text="Klik tahan kanan mouse untuk menggeser bagan ke segala arah. Gunakan Ctrl + Scroll atau tombol -/+ untuk memperkecil/memperbesar ukuran bagan."
            />
            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50/70 p-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(40, z - 10))}
                className="rounded-md p-1.5 text-slate-600 transition hover:bg-white hover:text-slate-900"
                title="Perkecil (-)"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="w-11 text-center font-mono text-[11px] font-bold text-slate-700">{zoom}%</span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(150, z + 10))}
                className="rounded-md p-1.5 text-slate-600 transition hover:bg-white hover:text-slate-900"
                title="Perbesar (+)"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(65)}
                className="ml-0.5 rounded-md border-l border-slate-200 p-1.5 text-slate-500 transition hover:bg-white hover:text-slate-800"
                title="Reset Ukuran (65%)"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={viewportRef}
          onContextMenu={(e) => e.preventDefault()}
          onMouseDown={handleCanvasMouseDown}
          onWheel={handleCanvasWheel}
          className={`peta-canvas-outer overflow-auto bg-white p-6 select-none h-[76vh] ${isPanning ? 'cursor-grabbing' : 'cursor-grab'
            }`}
        >
          <div
            className="peta-canvas-zoom mx-auto"
            style={{
              width: '1750px',
              zoom: `${zoom}%`,
            }}
          >
            {/* Judul Resmi Bagan */}
            <div className="mb-5 text-center">
              <h2 className="text-xl font-extrabold tracking-wide text-slate-950 uppercase">
                PETA JABATAN PUSAT PENDIDIKAN DAN PELATIHAN
              </h2>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Sesuai Kepmenlu No 7 Tahun 2025 tentang Peta Jabatan di Lingkungan Kementerian Luar Negeri
              </p>
            </div>

            {/* LEVEL 1: KEPALA PUSAT (Centered) */}
            <div className="flex flex-col items-center">
              <div style={{ width: '430px' }}>
                <LeaderCard
                  position={kapus}
                  canManage={canManage}
                  onSelect={openManageModal}
                  highlight={Boolean(searchLower && kapus?.nama_jabatan.toLowerCase().includes(searchLower))}
                />
              </div>

              {/* LEVEL 1.5: TRUNK TENGAH + CABANG KANAN KE DIREKTUR UPT (Sejajar Kolom 5) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 336px)',
                  columnGap: '17px',
                  width: '1750px',
                  position: 'relative',
                }}
              >
                {/* Garis vertikal utama turun tepat dari tengah Kapus (x = 875px) sampai rail bawah */}
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: 0,
                    bottom: 0,
                    width: '1.5px',
                    backgroundColor: '#0f172a',
                    transform: 'translateX(-50%)',
                  }}
                />
                {/* Garis cabang horizontal dari tengah (50%) ke kanan sampai tepat di atas kotak Direktur UPT (tengah kolom 5 = 90.4%) */}
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    right: '168px',
                    top: '22px',
                    height: '1.5px',
                    backgroundColor: '#0f172a',
                  }}
                />
                {/* Drop pendek masuk ke atas kotak Direktur UPT */}
                <div
                  style={{
                    position: 'absolute',
                    right: '168px',
                    top: '22px',
                    width: '1.5px',
                    height: '14px',
                    backgroundColor: '#0f172a',
                  }}
                />

                <div style={{ gridColumn: '1 / span 4', minHeight: '210px' }} />
                <div style={{ gridColumn: '5 / span 1', paddingTop: '36px', paddingBottom: '18px' }}>
                  <DirekturUptCard
                    positions={direkturUptList}
                    canManage={canManage}
                    onSelect={openManageModal}
                    searchLower={searchLower}
                  />
                </div>
              </div>

              {/* HORIZONTAL RAIL MENGHUBUNGKAN 5 KOLOM BIDANG / BAGIAN */}
              <div style={{ width: '1750px', position: 'relative', height: '24px' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '168px',
                    right: '168px',
                    top: 0,
                    height: '1.5px',
                    backgroundColor: '#0f172a',
                  }}
                />
                {[0, 1, 2, 3, 4].map((colIdx) => (
                  <div
                    key={colIdx}
                    style={{
                      position: 'absolute',
                      left: `${colIdx * 353 + 168}px`,
                      top: 0,
                      width: '1.5px',
                      height: '24px',
                      backgroundColor: '#0f172a',
                    }}
                  />
                ))}
              </div>

              {/* LEVEL 2: 5 KOLOM BIDANG / BAGIAN SEJAJAR HORIZONTAL */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 336px)',
                  columnGap: '17px',
                  width: '1750px',
                  alignItems: 'start',
                }}
              >
                {/* KOLOM 1 */}
                <div>
                  <LeaderCard position={bid1Head} canManage={canManage} onSelect={openManageModal} />
                  <div style={{ position: 'relative', paddingLeft: '14px', paddingTop: '14px' }}>
                    <div style={{ position: 'absolute', left: '6px', top: 0, height: '28px', width: '1.5px', backgroundColor: '#0f172a' }} />
                    <div style={{ position: 'absolute', left: '6px', top: '28px', width: '8px', height: '1.5px', backgroundColor: '#0f172a' }} />
                    <JabatanTable positions={bid1Rows} canManage={canManage} onSelect={openManageModal} searchLower={searchLower} />
                  </div>
                </div>

                {/* KOLOM 2 */}
                <div>
                  <LeaderCard position={bid2Head} canManage={canManage} onSelect={openManageModal} />
                  <div style={{ position: 'relative', paddingLeft: '14px', paddingTop: '14px' }} className="space-y-4">
                    <div style={{ position: 'absolute', left: '6px', top: 0, height: '28px', width: '1.5px', backgroundColor: '#0f172a' }} />
                    <div style={{ position: 'absolute', left: '6px', top: '28px', width: '8px', height: '1.5px', backgroundColor: '#0f172a' }} />
                    <JabatanTable positions={bid2Rows} canManage={canManage} onSelect={openManageModal} searchLower={searchLower} />
                    <AlihDayaCard position={bid2AlihDaya} canManage={canManage} onSelect={openManageModal} searchLower={searchLower} />
                  </div>
                </div>

                {/* KOLOM 3 */}
                <div>
                  <LeaderCard position={bid3Head} canManage={canManage} onSelect={openManageModal} />
                  <div style={{ position: 'relative', paddingLeft: '14px', paddingTop: '14px' }} className="space-y-5">
                    <div style={{ position: 'absolute', left: '6px', top: 0, height: '28px', width: '1.5px', backgroundColor: '#0f172a' }} />
                    <div style={{ position: 'absolute', left: '6px', top: '28px', width: '8px', height: '1.5px', backgroundColor: '#0f172a' }} />
                    <JabatanTable positions={bid3Rows} canManage={canManage} onSelect={openManageModal} searchLower={searchLower} />
                    <div>
                      <p className="mb-1.5 text-center text-[9.5px] font-extrabold uppercase tracking-wider text-slate-700">
                        Kelompok Jabatan Fungsional Madya &amp; Widyaiswara
                      </p>
                      <JabatanTable positions={bid3JfMadya} canManage={canManage} onSelect={openManageModal} searchLower={searchLower} />
                    </div>
                  </div>
                </div>

                {/* KOLOM 4 */}
                <div>
                  <LeaderCard position={bid4Head} canManage={canManage} onSelect={openManageModal} />
                  <div style={{ position: 'relative', paddingLeft: '14px', paddingTop: '14px' }}>
                    <div style={{ position: 'absolute', left: '6px', top: 0, height: '28px', width: '1.5px', backgroundColor: '#0f172a' }} />
                    <div style={{ position: 'absolute', left: '6px', top: '28px', width: '8px', height: '1.5px', backgroundColor: '#0f172a' }} />
                    <JabatanTable positions={bid4Rows} canManage={canManage} onSelect={openManageModal} searchLower={searchLower} />
                  </div>
                </div>

                {/* KOLOM 5: BAGIAN TATA USAHA (2 SUBBAGIAN + ALIH DAYA) */}
                <div>
                  <LeaderCard position={tuHead} canManage={canManage} onSelect={openManageModal} />
                  <div style={{ position: 'relative', paddingLeft: '14px', paddingTop: '14px' }} className="space-y-4">
                    {/* Garis vertikal turun dari Kepala Bagian TU ke Subbag 1 & Subbag 2 */}
                    <div style={{ position: 'absolute', left: '6px', top: 0, bottom: '280px', width: '1.5px', backgroundColor: '#0f172a' }} />

                    {/* Subbagian 1: Perencanaan Kinerja & Keuangan */}
                    <div className="relative space-y-2">
                      <div style={{ position: 'absolute', left: '-8px', top: '18px', width: '8px', height: '1.5px', backgroundColor: '#0f172a' }} />
                      <LeaderCard
                        position={tuKeuHead}
                        canManage={canManage}
                        onSelect={openManageModal}
                        headerBg="#94a3b8"
                        headerColor="#0f172a"
                      />
                      <JabatanTable positions={tuKeuRows} canManage={canManage} onSelect={openManageModal} searchLower={searchLower} />
                    </div>

                    {/* Subbagian 2: SDM dan Umum */}
                    <div className="relative space-y-2 pt-2">
                      <div style={{ position: 'absolute', left: '-8px', top: '26px', width: '8px', height: '1.5px', backgroundColor: '#0f172a' }} />
                      <LeaderCard
                        position={tuSdmHead}
                        canManage={canManage}
                        onSelect={openManageModal}
                        headerBg="#94a3b8"
                        headerColor="#0f172a"
                      />
                      <JabatanTable positions={tuSdmRows} canManage={canManage} onSelect={openManageModal} searchLower={searchLower} />
                    </div>

                    {/* Alih Daya TU */}
                    <div className="pt-2">
                      <AlihDayaCard position={tuAlihDaya} canManage={canManage} onSelect={openManageModal} searchLower={searchLower} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ADMIN MODAL: KELOLA PENEMPATAN PEGAWAI PADA JABATAN */}
      {canManage && selectedPosition && (
        <div
          onClick={() => setSelectedPositionId(null)}
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  Pengaturan Posisi Peta Jabatan
                </p>
                <h3 className="text-base font-extrabold text-slate-900 leading-snug mt-0.5">
                  {selectedPosition.nama_jabatan}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedPosition.kelas ? `Kelas ${selectedPosition.kelas} • ` : ''}
                  Terisi: <strong>{selectedPosition.assignments?.length || 0}</strong> / Kebutuhan: <strong>{selectedPosition.kebutuhan}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPositionId(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Daftar Pegawai Saat Ini */}
            <div>
              <p className="text-xs font-bold text-slate-700 mb-2">
                Pegawai yang Menempati Jabatan Ini ({selectedPosition.assignments?.length || 0})
              </p>
              {!selectedPosition.assignments || selectedPosition.assignments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs italic text-slate-400">
                  Belum ada pegawai yang ditempatkan pada posisi ini.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                  {selectedPosition.assignments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between gap-3 px-3 py-2.5 bg-white">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <AvatarBadge pegawai={a.pegawai} size="sm" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{a.pegawai?.nama || '-'}</p>
                          <p className="text-[11px] text-slate-500 truncate">
                            NIP: {a.pegawai?.nip || '-'}
                            {a.catatan ? ` • (${a.catatan})` : ''}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleUnassign(a.id)}
                        title="Hapus dari jabatan ini"
                        className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Tambah / Tetapkan Pegawai */}
            <form onSubmit={handleAssign} className="space-y-3 rounded-xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <UserPlus className="h-4 w-4 text-emerald-600" />
                <span>Tambah / Tetapkan Pegawai</span>
              </p>

              <div>
                <input
                  type="text"
                  value={pegawaiSearch}
                  onChange={(e) => setPegawaiSearch(e.target.value)}
                  placeholder="Cari nama / NIP pegawai..."
                  className="mb-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs"
                />
                <select
                  required
                  value={selectedPegawaiId}
                  onChange={(e) => setSelectedPegawaiId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
                >
                  <option value="">-- Pilih Pegawai ({filteredPegawaiOptions.length} tersedia) --</option>
                  {filteredPegawaiOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama} — {p.upt_bidang} ({p.nip})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Catatan / Label Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Contoh: PPK, Bendahara, UPT Sesparlu, Tubel"
                  maxLength={120}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !selectedPegawaiId}
                className="w-full rounded-xl bg-[#0F2C59] py-2 text-xs font-bold text-white shadow hover:bg-[#1a3e7a] disabled:opacity-50 transition"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Penempatan Pegawai'}
              </button>
            </form>

            {/* Pengaturan Jumlah Kebutuhan (K) */}
            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <SlidersHorizontal className="h-4 w-4 text-amber-500" />
                <span>Ubah Jumlah Kebutuhan (K):</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={kebutuhanInput}
                  onChange={(e) => setKebutuhanInput(e.target.value)}
                  className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-center text-xs font-mono"
                />
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleUpdateKebutuhan}
                  className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
                >
                  Simpan K
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
