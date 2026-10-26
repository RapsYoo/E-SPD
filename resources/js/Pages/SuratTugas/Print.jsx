import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Printer, ArrowLeft } from 'lucide-react';
import { formatDate } from './Partials/printHelpers';
import SuratTugasSheet from './Partials/SuratTugasSheet';
import SpdSheet from './Partials/SpdSheet';
import LampiranMatriksSheet from './Partials/LampiranMatriksSheet';
import VisumRampunganSheet from './Partials/VisumRampunganSheet';

export default function Print({ suratTugas, kapus = {} }) {
  const [activeDocument, setActiveDocument] = useState('st');
  const pegawaiList = Array.isArray(suratTugas.pegawai_list) ? suratTugas.pegawai_list : [];
  const tujuanPerjalanan = [
    suratTugas.tempat_tujuan,
    suratTugas.kategori_perjalanan === 'LUAR_NEGERI' ? suratTugas.negara_tujuan : null,
  ]
    .filter(Boolean)
    .join(', ') || '-';

  const tuDraft = suratTugas.draft_data?.tu || {};
  const nomorST = suratTugas.nomor_st || tuDraft.nomor_st || '-';
  const nomorSPD = suratTugas.nomor_spd || tuDraft.nomor_spd || '-';
  const tanggalSuratRaw = suratTugas.tanggal_surat || tuDraft.tanggal_surat;
  const tanggalSurat = formatDate(tanggalSuratRaw);
  const tanggalBerangkat = formatDate(suratTugas.tanggal_berangkat);
  const tanggalKembali = formatDate(suratTugas.tanggal_kembali);
  const ppkNama = suratTugas.ppk_nama_snapshot || suratTugas.ppk?.pegawai?.nama || suratTugas.ppk?.name || suratTugas.ppk?.nama || '-';
  const ppkNip = suratTugas.ppk_nip_snapshot || suratTugas.ppk?.pegawai?.nip || suratTugas.ppk?.nip || '-';
  const tahunAnggaran = tanggalSuratRaw?.slice(0, 4) || suratTugas.tanggal_berangkat?.slice(0, 4) || '-';

  const documentTabs = [
    { id: 'st', label: '1. Surat Tugas (ST)' },
    { id: 'spd', label: '2. SPD Lembar 1' },
    { id: 'lampiran', label: '3. Lampiran Matriks SPD' },
    { id: 'visum', label: '4. Lembar Visum Rampungan' },
  ];

  const commonProps = {
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
    kapusNama: kapus?.nama,
    kapusNip: kapus?.nip,
  };

  return (
    <div className="print-document-flow min-h-screen bg-slate-200 font-sans text-black">
      <Head title={`Pratinjau ST & SPD - ${nomorST}`} />
      <style>{`
        @media screen {
          .print-preview-sheet table td,
          .print-preview-sheet table th {
            padding: 0.6rem !important;
          }
          .print-sheet-lampiran {
            box-sizing: border-box;
            padding: 10mm;
          }
          .print-sheet-visum {
            box-sizing: border-box;
            padding: 15mm 20mm;
          }
          .print-sheet-lampiran .lampiran-date {
            padding-right: 0.15rem !important;
            padding-left: 0.15rem !important;
          }
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
        .print-sheet-st, .print-sheet-spd, .print-sheet-lampiran, .print-sheet-visum {
          box-sizing: border-box;
          width: 100%;
          max-width: 210mm;
          margin: 1.5rem auto;
          background: white;
          border: 1px solid #cbd5e1;
          box-shadow: 0 20px 25px -5px rgb(15 23 42 / 0.12);
          font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
        }
        @media print {
          @page { size: A4 portrait; margin: 15mm 20mm 15mm 20mm; }
          @page surat-tugas { size: A4 portrait; margin: 0; }
          @page spd { size: A4 portrait; margin: 0; }
          @page lampiran { size: A4 portrait; margin: 0; }
          @page visum { size: A4 portrait; margin: 0; }
          .no-print { display: none !important; }
          .hidden,
          .print-sheet-st.hidden,
          .print-sheet-spd.hidden,
          .print-sheet-lampiran.hidden,
          .print-sheet-visum.hidden,
          .spd-document.hidden,
          div.hidden,
          section.hidden {
            display: none !important;
          }
          .print-document-flow { display: block !important; background: white !important; }
          .print-sheet-st, .print-sheet-spd, .print-sheet-lampiran, .print-sheet-visum {
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
          }
          .print-sheet-st { page: surat-tugas; }
          .print-sheet-spd { page: spd; }
          .print-sheet-lampiran {
            page: lampiran;
            box-sizing: border-box;
            width: 210mm !important;
            max-width: 210mm !important;
            padding: 10mm !important;
          }
          .print-sheet-visum {
            page: visum;
            box-sizing: border-box;
            width: 210mm !important;
            max-width: 210mm !important;
            min-height: 297mm;
            padding: 15mm 20mm !important;
          }
          .print-sheet-st { width: 170mm !important; max-width: 170mm !important; margin: 0 auto !important; }
          .spd-document:not(.hidden) {
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 2mm;
            width: 170mm !important;
            max-width: 170mm !important;
            margin: 0 auto !important;
            height: 265mm;
            max-height: 265mm;
            overflow: hidden;
            font-size: 7.8pt;
            line-height: 1.05;
          }
          .spd-document > :not([hidden]) ~ :not([hidden]) { margin-top: 0 !important; }
          .spd-letterhead { height: 34mm; flex: 0 0 34mm; }
          .spd-brand { display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1; }
          .spd-info { min-height: 11mm; flex: 0 0 11mm; }
          .spd-title { min-height: 8mm; flex: 0 0 8mm; padding: 0 !important; }
          .spd-title h2 { font-size: 11pt; font-weight: 700; }
          .spd-table { width: 100%; min-height: 0; flex: 1 1 0; table-layout: fixed; font-size: 7pt; line-height: 1.05; }
          .spd-table td { padding: 0.5mm !important; line-height: 1 !important; }
          .spd-table .h-20 { height: auto !important; min-height: 7mm; }
          .spd-footer { height: 34mm; min-height: 34mm; flex: 0 0 34mm; padding-top: 0.5mm !important; }
          .spd-footer .space-y-3 > :not([hidden]) ~ :not([hidden]) { margin-top: 1mm !important; }
          .spd-stamp-space { height: 14mm !important; min-height: 14mm; flex: 0 0 14mm; }
          .spd-stamp-space .border-dashed { width: 14mm; height: 14mm; font-size: 5pt; }
          .print-page-break { display: none !important; }
          .print-hide-border { border: 0 !important; }
        }
      `}</style>

      {/* Top Floating Control Bar (Hidden on Print) */}
      <div className="no-print bg-[#0F2C59] text-white p-4 shadow-lg border-b-4 border-amber-500 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href={`/surat-tugas/${suratTugas.id}`}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Ruang Kerja</span>
          </Link>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.print()}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-5 py-2 rounded-xl shadow-lg transition flex items-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Dokumen Ini / Simpan PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation (Hidden on Print) */}
      <div className="no-print mx-auto mb-4 flex w-full max-w-5xl gap-2 overflow-x-auto border-b border-slate-300 px-4">
        {documentTabs.map((document) => (
          <button
            key={document.id}
            type="button"
            role="tab"
            aria-selected={activeDocument === document.id}
            onClick={() => setActiveDocument(document.id)}
            className={`shrink-0 border-b-2 px-4 py-2 text-xs font-bold transition ${
              activeDocument === document.id
                ? 'border-[#0F2C59] bg-[#0F2C59] text-white'
                : 'border-transparent bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            {document.label}
          </button>
        ))}
      </div>

      {/* 1. SURAT TUGAS (ST) */}
      <SuratTugasSheet
        {...commonProps}
        isActive={activeDocument === 'st'}
      />

      {/* 2. SURAT PERJALANAN DINAS (SPD LEMBAR 1) */}
      <SpdSheet
        {...commonProps}
        isActive={activeDocument === 'spd'}
      />

      {/* 3. LAMPIRAN MATRIKS SPD */}
      <LampiranMatriksSheet
        {...commonProps}
        isActive={activeDocument === 'lampiran'}
      />

      {/* 4. VISUM RAMPUNGAN */}
      <VisumRampunganSheet
        {...commonProps}
        isActive={activeDocument === 'visum'}
      />
    </div>
  );
}
