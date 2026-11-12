import React, { useEffect, useRef, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import "@/../css/rekapitulasi-pegawai.css";
import {
    Plus,
    Search,
    Eye,
    Printer,
    CheckCircle2,
    Clock,
    AlertCircle,
    FileText,
    MapPin,
    Calendar,
    ArrowRight,
    Trash2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    User,
    UserCheck,
} from "lucide-react";

const formatDisplayValue = (value) => {
    if (value == null) {
        return "–";
    }

    const text = String(value).trim();
    return !text || text.toLowerCase() === "null" ? "–" : text;
};

const formatDisplayDate = (value) => {
    const text = formatDisplayValue(value);
    if (text === "–") {
        return null;
    }

    const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) {
        return text;
    }

    const [, year, month, day] = match;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    if (Number.isNaN(date.getTime())) {
        return text;
    }

    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    })
        .format(date)
        .replace(/\./g, "");
};

const formatDateRange = (startDate, endDate, duration) => {
    const start = formatDisplayDate(startDate);
    const end = formatDisplayDate(endDate);
    if (!start && !end) {
        return "–";
    }

    const range = `${start || "–"} – ${end || "–"}`;
    const durationLabel = formatDisplayValue(duration).replace(/\s*hari$/i, "");
    return durationLabel === "–"
        ? range
        : `${range}, ${durationLabel} hari`;
};

const formatCategoryLabel = (value) => {
    const category = formatDisplayValue(value);
    if (category === "–") {
        return category;
    }

    return category
        .replace(/_/g, " ")
        .split(" ")
        .map(
            (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join(" ");
};

export default function Index({ suratTugas, filters, userRole, authUserId }) {
    const searchTimeout = useRef(null);
    const [search, setSearch] = useState(filters?.search || "");
    const [selectedStatus, setSelectedStatus] = useState(filters?.status || "");
    const [deletingId, setDeletingId] = useState(null);
    const [expandedRow, setExpandedRow] = useState(null);
    const [openMenu, setOpenMenu] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [theme, setTheme] = useState(() => {
        if (typeof window === "undefined") {
            return "light";
        }

        const savedTheme = window.localStorage.getItem("rekap-jaldis-theme");
        const initialTheme =
            savedTheme ||
            (window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light");
        document.documentElement.dataset.theme = initialTheme;
        return initialTheme;
    });

    useEffect(() => () => clearTimeout(searchTimeout.current), []);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        window.localStorage.setItem("rekap-jaldis-theme", theme);
    }, [theme]);

    // Close kebab menu on outside click
    useEffect(() => {
        if (!openMenu) return;
        const handler = (e) => {
            if (!e.target.closest("[data-kebab-menu]")) {
                setOpenMenu(null);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [openMenu]);

    const searchSuratTugas = (value) => {
        setSearch(value);
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            router.get(
                "/surat-tugas",
                { search: value, status: selectedStatus },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    onStart: () => setIsLoading(true),
                    onFinish: () => setIsLoading(false),
                },
            );
        }, 350);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        clearTimeout(searchTimeout.current);
        router.get(
            "/surat-tugas",
            { search, status: selectedStatus },
            {
                preserveState: true,
                preserveScroll: true,
                onStart: () => setIsLoading(true),
                onFinish: () => setIsLoading(false),
            },
        );
    };

    const handleDelete = (surat) => {
        if (deletingId) return;
        const identifier =
            surat.status === "DRAFT"
                ? `Draft #${surat.id}`
                : surat.nomor_st || `Surat #${surat.id}`;
        if (
            !window.confirm(
                `Hapus ${identifier} beserta histori proses dan lampirannya? Tindakan ini tidak dapat dibatalkan.`,
            )
        )
            return;

        setDeletingId(surat.id);
        router.delete(`/surat-tugas/${surat.id}`, {
            preserveScroll: true,
            onFinish: () => setDeletingId(null),
        });
    };

    const getPegawaiList = (st) =>
        st.pegawaiList ?? st.pegawai_list ?? st.pegawai_list_data ?? [];

    const getActorPosition = (status) => {
        switch (status) {
            case "DRAFT":
                return {
                    label: "Sesparlu / Pemohon",
                    role: "Konseptor",
                    color: "st-workflow-tag st-workflow-tag--neutral",
                };
            case "MENUNGGU_DISPOSISI_KAPUS":
                return {
                    label: "Kapus (Kepala Pusat)",
                    role: "Disposisi Tahap 3",
                    color: "st-workflow-tag st-workflow-tag--accent",
                };
            case "DISPOSISI_KAPUS_YA":
                return {
                    label: "Sesparlu / Pemohon",
                    role: "Draft Personel & SPD",
                    color: "st-workflow-tag st-workflow-tag--accent",
                };
            case "DISPOSISI_KAPUS_REVISI":
                return {
                    label: "Sesparlu / Pemohon",
                    role: "Perlu Revisi Draft ST & SPD",
                    color: "st-workflow-tag st-workflow-tag--warning",
                };
            case "DISPOSISI_KAPUS_STOP":
                return {
                    label: "Selesai (Stop)",
                    role: "Dihentikan",
                    color: "st-workflow-tag st-workflow-tag--warning",
                };
            case "MENUNGGU_PENOMORAN_TU":
                return {
                    label: "Tata Usaha (TU)",
                    role: "Penomoran",
                    color: "st-workflow-tag st-workflow-tag--accent",
                };
            case "SELESAI_TERBIT":
                return {
                    label: "PPK / Terbit Resmi",
                    role: "Selesai",
                    color: "st-workflow-tag st-workflow-tag--success",
                };
            default:
                return {
                    label: "Sistem",
                    role: "-",
                    color: "st-workflow-tag st-workflow-tag--neutral",
                };
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "DRAFT":
                return (
                    <span className="st-status st-status--draft">
                        <FileText className="w-3.5 h-3.5 mr-1" /> Draft
                    </span>
                );
            case "MENUNGGU_DISPOSISI_KAPUS":
                return (
                    <span className="st-status st-status--warning">
                        <Clock className="w-3.5 h-3.5 mr-1" /> Menunggu Kapus
                    </span>
                );
            case "DISPOSISI_KAPUS_YA":
                return (
                    <span className="st-status st-status--accent">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Disetujui
                        Kapus
                    </span>
                );
            case "SELESAI_TERBIT":
                return (
                    <span className="st-status st-status--success">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Selesai
                        Terbit
                    </span>
                );
            case "MENUNGGU_PENOMORAN_TU":
                return (
                    <span className="st-status st-status--accent">
                        <Clock className="w-3.5 h-3.5 mr-1" /> Menunggu TU
                    </span>
                );
            case "DISPOSISI_KAPUS_REVISI":
                return (
                    <span className="st-status st-status--warning">
                        <AlertCircle className="w-3.5 h-3.5 mr-1" /> Minta
                        Revisi
                    </span>
                );
            case "DISPOSISI_KAPUS_STOP":
                return (
                    <span className="st-status st-status--warning">
                        <AlertCircle className="w-3.5 h-3.5 mr-1" /> Dihentikan
                    </span>
                );
            default:
                return (
                    <span className="st-status st-status--warning">
                        <Clock className="w-3.5 h-3.5 mr-1" /> Menunggu Proses
                    </span>
                );
        }
    };

    const isPrintable = (st) =>
        st.status === "SELESAI_TERBIT" ||
        (st.status === "MENUNGGU_PENOMORAN_TU" &&
            ["tu", "admin", "kapus", "ppk"].includes(userRole));

    return (
        <AdminLayout
            title="Daftar Surat Tugas & SPD"
            variant="analytics"
            theme={theme}
            onThemeToggle={() => {
                const nextTheme = theme === "dark" ? "light" : "dark";
                document.documentElement.dataset.theme = nextTheme;
                setTheme(nextTheme);
            }}
        >
            <Head title="Daftar Surat Tugas & SPD - Pusdiklat Kemlu" />

            <div className="surat-tugas-page" data-theme={theme}>
                <header className="st-page-header">
                    <div className="st-page-heading">
                        <div className="st-title-icon">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div className="st-title-copy">
                            <h1 className="st-title">
                                Daftar Surat Tugas &amp; SPD
                            </h1>
                            <p className="st-subtitle">
                                Pengelolaan dokumen perjalanan dinas
                            </p>
                        </div>
                    </div>
                    <div className="st-count-chip">
                        <span className="st-count-dot" />
                        {suratTugas.data?.length || 0} dokumen di halaman ini
                    </div>
                </header>

                <form onSubmit={handleSearch} className="st-toolbar">
                    <div className="st-search-field">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => searchSuratTugas(e.target.value)}
                            placeholder="Cari nomor ST, nomor nota, perihal..."
                            aria-label="Cari nomor ST, nomor nota, atau perihal"
                            className="st-search-input"
                        />
                        <button
                            type="submit"
                            className="st-search-submit"
                            aria-label="Cari surat tugas"
                            title="Cari"
                        >
                            <Search className="h-4 w-4" />
                        </button>
                    </div>

                    <select
                        value={selectedStatus}
                        onChange={(e) => {
                            clearTimeout(searchTimeout.current);
                            setSelectedStatus(e.target.value);
                            router.get(
                                "/surat-tugas",
                                { search, status: e.target.value },
                                {
                                    preserveState: true,
                                    preserveScroll: true,
                                    replace: true,
                                    onStart: () => setIsLoading(true),
                                    onFinish: () => setIsLoading(false),
                                },
                            );
                        }}
                        className="st-status-filter"
                        aria-label="Filter status"
                    >
                        <option value="">Semua Status</option>
                        <option value="DRAFT">Draft Saya</option>
                        <option value="MENUNGGU_DISPOSISI_KAPUS">
                            Menunggu Kapus
                        </option>
                        <option value="MENUNGGU_PENOMORAN_TU">
                            Menunggu TU
                        </option>
                        <option value="SELESAI_TERBIT">Selesai Terbit</option>
                    </select>

                    {(userRole === "pemohon" ||
                        userRole === "sespalu" ||
                        userRole === "admin") && (
                        <Link
                            href="/surat-tugas/create"
                            className="st-create-button"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Buat Surat Tugas Baru</span>
                        </Link>
                    )}
                </form>

                <section className="st-table-card">
                    <div className="st-table-wrap">
                    <table className="st-table">
                        <thead className="st-table-head">
                            <tr>
                                <th aria-label="Detail" />
                                <th>Perihal</th>
                                <th>Tujuan &amp; Tanggal</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="st-table-body">
                            {isLoading ? (
                                Array.from({ length: 3 }, (_, idx) => (
                                    <tr
                                        className="st-skeleton-row"
                                        key={`loading-${idx}`}
                                    >
                                        <td>
                                            <span className="st-skeleton-line st-skeleton-line--icon" />
                                        </td>
                                        <td>
                                            <span className="st-skeleton-line st-skeleton-line--subject" />
                                        </td>
                                        <td>
                                            <span className="st-skeleton-line st-skeleton-line--trip" />
                                        </td>
                                        <td>
                                            <span className="st-skeleton-line st-skeleton-line--status" />
                                        </td>
                                        <td>
                                            <span className="st-skeleton-line st-skeleton-line--action" />
                                        </td>
                                    </tr>
                                ))
                            ) : suratTugas.data && suratTugas.data.length > 0 ? (
                                suratTugas.data.map((st) => {
                                    const isExpanded = expandedRow === st.id;
                                    const pegawaiList = getPegawaiList(st);
                                    const actor = getActorPosition(st.status);
                                    const subject =
                                        st.status === "DRAFT"
                                            ? st.draft_data?.perihal_nota ||
                                              "Draft belum lengkap"
                                            : st.perihal_nota;
                                    const destination =
                                        st.status === "DRAFT"
                                            ? st.draft_data?.tempat_tujuan
                                            : st.tempat_tujuan;
                                    const departureDate =
                                        st.status === "DRAFT"
                                            ? st.draft_data?.tanggal_berangkat
                                            : st.tanggal_berangkat;
                                    const returnDate =
                                        st.status === "DRAFT"
                                            ? st.draft_data?.tanggal_kembali
                                            : st.tanggal_kembali;
                                    const duration =
                                        st.status === "DRAFT"
                                            ? null
                                            : st.durasi_hari;

                                    return (
                                        <React.Fragment key={st.id}>
                                            <tr
                                                className={`st-data-row ${isExpanded ? "is-expanded" : ""}`}
                                            >
                                                {/* Chevron toggle */}
                                                <td className="st-expand-cell">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setExpandedRow(
                                                                isExpanded
                                                                    ? null
                                                                    : st.id,
                                                            )
                                                        }
                                                        className="st-expand-button"
                                                        aria-label={
                                                            isExpanded
                                                                ? "Tutup detail"
                                                                : "Buka detail"
                                                        }
                                                        aria-expanded={isExpanded}
                                                    >
                                                        <ChevronDown
                                                            className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                                                        />
                                                    </button>
                                                </td>

                                                {/* Perihal */}
                                                <td className="st-subject-cell">
                                                    <div
                                                        className="st-subject"
                                                        title={formatDisplayValue(
                                                            subject,
                                                        )}
                                                    >
                                                        {formatDisplayValue(
                                                            subject,
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Tujuan & Tanggal */}
                                                <td className="st-trip-cell">
                                                    <div className="st-trip-line">
                                                        <MapPin className="st-place-icon h-3.5 w-3.5" />
                                                        <span className="st-trip-value">
                                                            {formatDisplayValue(
                                                                destination,
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="st-trip-line st-trip-date tabular-nums">
                                                        <Calendar className="st-date-icon h-3.5 w-3.5" />
                                                        <span className="st-trip-value">
                                                            {formatDateRange(
                                                                departureDate,
                                                                returnDate,
                                                                duration,
                                                            )}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td className="st-status-cell">
                                                    {getStatusBadge(st.status)}
                                                </td>

                                                {/* Aksi */}
                                                <td className="st-action-cell">
                                                    <div
                                                        className="st-action-group"
                                                        data-kebab-menu
                                                    >
                                                        {st.status ===
                                                        "DRAFT" ? (
                                                            <>
                                                                {(userRole ===
                                                                    "admin" ||
                                                                    st.user_id ===
                                                                        authUserId) && (
                                                                    <Link
                                                                        href={`/surat-tugas/${st.id}/draft`}
                                                                        className="st-continue-button"
                                                                        title="Lanjutkan draft"
                                                                    >
                                                                        <ArrowRight className="w-3.5 h-3.5" />
                                                                        <span>
                                                                            Lanjutkan
                                                                        </span>
                                                                    </Link>
                                                                )}
                                                                {userRole ===
                                                                    "admin" && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleDelete(
                                                                                st,
                                                                            )
                                                                        }
                                                                        className="st-delete-button"
                                                                        title="Hapus surat tugas"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                        <span>
                                                                            Hapus
                                                                        </span>
                                                                    </button>
                                                                )}
                                                                {/* Kebab menu for DRAFT */}
                                                                <div className="relative">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setOpenMenu(
                                                                                openMenu ===
                                                                                    st.id
                                                                                    ? null
                                                                                    : st.id,
                                                                            )
                                                                        }
                                                                        className="st-menu-trigger"
                                                                        aria-label="Opsi lainnya"
                                                                        title="Opsi lainnya"
                                                                    >
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </button>
                                                                    {openMenu ===
                                                                        st.id && (
                                                                        <div className="st-menu">
                                                                            <Link
                                                                                href={`/surat-tugas/${st.id}`}
                                                                                className="st-menu-item"
                                                                                aria-label="Buka detail surat tugas"
                                                                                onClick={() =>
                                                                                    setOpenMenu(
                                                                                        null,
                                                                                    )
                                                                                }
                                                                            >
                                                                                <Eye className="w-3.5 h-3.5" />{" "}
                                                                                Detail
                                                                            </Link>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Link
                                                                    href={`/surat-tugas/${st.id}`}
                                                                    className="st-detail-button"
                                                                    aria-label="Buka detail surat tugas"
                                                                    title="Detail / Ruang Kerja Workflow"
                                                                >
                                                                    <Eye className="w-3.5 h-3.5" />
                                                                    <span>
                                                                        Detail
                                                                    </span>
                                                                </Link>
                                                                {userRole ===
                                                                    "admin" && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleDelete(
                                                                                st,
                                                                            )
                                                                        }
                                                                        className="st-delete-button"
                                                                        title="Hapus surat tugas"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                        <span>
                                                                            Hapus
                                                                        </span>
                                                                    </button>
                                                                )}
                                                                {/* Kebab menu for non-DRAFT */}
                                                                <div
                                                                    className="relative"
                                                                    data-kebab-menu
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setOpenMenu(
                                                                                openMenu ===
                                                                                    st.id
                                                                                    ? null
                                                                                    : st.id,
                                                                            )
                                                                        }
                                                                        className="st-menu-trigger"
                                                                        aria-label="Opsi lainnya"
                                                                        title="Opsi lainnya"
                                                                    >
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </button>
                                                                    {openMenu ===
                                                                        st.id && (
                                                                        <div className="st-menu">
                                                                            {isPrintable(
                                                                                st,
                                                                            ) && (
                                                                                <Link
                                                                                    href={`/surat-tugas/${st.id}/cetak`}
                                                                                    className="st-menu-item"
                                                                                    aria-label={
                                                                                        st.status ===
                                                                                        "SELESAI_TERBIT"
                                                                                            ? "Cetak surat tugas"
                                                                                            : "Pratinjau surat tugas"
                                                                                    }
                                                                                    onClick={() =>
                                                                                        setOpenMenu(
                                                                                            null,
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <Printer className="w-3.5 h-3.5" />
                                                                                    {st.status ===
                                                                                    "SELESAI_TERBIT"
                                                                                        ? "Cetak Surat"
                                                                                        : "Pratinjau"}
                                                                                </Link>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Expandable detail row */}
                                            {isExpanded && (
                                                <tr className="st-expanded-row">
                                                    <td
                                                        colSpan={5}
                                                        className="st-expanded-cell"
                                                    >
                                                        <div className="st-expanded-content">
                                                            {/* Nomor Dokumen */}
                                                            <div className="st-detail-column">
                                                                <div className="st-detail-label">
                                                                    Nomor
                                                                    Dokumen
                                                                </div>
                                                                {st.status ===
                                                                "DRAFT" ? (
                                                                    <div className="st-detail-value st-detail-number">
                                                                        Draft #
                                                                        {st.id}
                                                                    </div>
                                                                ) : st.nomor_st ? (
                                                                    <div className="st-detail-value st-detail-number">
                                                                        {
                                                                            st.nomor_st
                                                                        }
                                                                    </div>
                                                                ) : (
                                                                    <div className="st-detail-placeholder is-italic">
                                                                        [Belum
                                                                        Diisi
                                                                        TU]
                                                                    </div>
                                                                )}
                                                                {st.nomor_spd && (
                                                                    <div className="st-detail-secondary st-detail-number">
                                                                        SPD:{" "}
                                                                        {
                                                                            st.nomor_spd
                                                                        }
                                                                    </div>
                                                                )}
                                                                <div className="st-detail-secondary st-detail-category">
                                                                    Kategori:{" "}
                                                                    <span>
                                                                        {formatCategoryLabel(
                                                                            st.status ===
                                                                                "DRAFT"
                                                                                ? st
                                                                                      .draft_data
                                                                                      ?.kategori_perjalanan ||
                                                                                  "Belum dipilih"
                                                                                : st.kategori_perjalanan,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Asal Surat */}
                                                            <div className="st-detail-column">
                                                                <div className="st-detail-label">
                                                                    Asal Surat
                                                                </div>
                                                                <div className="st-detail-value">
                                                                    {st.status ===
                                                                    "DRAFT"
                                                                        ? st
                                                                              .draft_data
                                                                              ?.pengirim_nota ||
                                                                          "Belum diisi"
                                                                        : st.pengirim_nota ||
                                                                          "—"}
                                                                </div>
                                                                <div className="st-detail-secondary st-detail-number">
                                                                    {st.status ===
                                                                    "DRAFT"
                                                                        ? st
                                                                              .draft_data
                                                                              ?.nomor_nota ||
                                                                          "Belum diisi"
                                                                        : st.nomor_nota ||
                                                                          "—"}
                                                                </div>
                                                            </div>

                                                            {/* Diajukan oleh */}
                                                            <div className="st-detail-column">
                                                                <div className="st-detail-label">
                                                                    Diajukan
                                                                    Oleh
                                                                </div>
                                                                <div className="st-detail-value st-detail-applicant">
                                                                    <User className="h-3.5 w-3.5 shrink-0" />
                                                                    <span className="st-detail-applicant-name">
                                                                        {st.user
                                                                            ?.name ||
                                                                            "Sistem"}
                                                                    </span>
                                                                </div>
                                                                <div className="st-detail-role">
                                                                    {st.user
                                                                        ?.role ===
                                                                    "sespalu"
                                                                        ? "sesparlu"
                                                                        : st.user
                                                                              ?.role ||
                                                                          "USER"}
                                                                </div>
                                                            </div>

                                                            {/* Posisi Workflow */}
                                                            <div className="st-detail-column">
                                                                <div className="st-detail-label">
                                                                    Posisi
                                                                    Workflow
                                                                </div>
                                                                <span
                                                                    className={`st-workflow-pill ${actor.color}`}
                                                                >
                                                                    <UserCheck className="h-3 w-3" />
                                                                    {
                                                                        actor.label
                                                                    }
                                                                </span>
                                                                <div className="st-detail-secondary st-detail-workflow-role">
                                                                    {actor.role}
                                                                </div>
                                                            </div>

                                                            {/* Personel Pelaksana */}
                                                            <div className="st-detail-column">
                                                                <div className="st-detail-label">
                                                                    Personel
                                                                    Pelaksana
                                                                </div>
                                                                {pegawaiList &&
                                                                pegawaiList.length >
                                                                    0 ? (
                                                                    <div className="space-y-1">
                                                                        {pegawaiList.map(
                                                                            (
                                                                                peg,
                                                                                idx,
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        peg.id ||
                                                                                        peg.nip ||
                                                                                        idx
                                                                                    }
                                                                                    className="st-detail-value st-detail-personnel"
                                                                                >
                                                                                    <span className="st-detail-personnel-dot" />
                                                                                    {
                                                                                        peg.nama
                                                                                    }
                                                                                </div>
                                                                            ),
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <span className="st-detail-placeholder">
                                                                        —
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="st-empty-cell"
                                    >
                                        <div className="st-empty-state">
                                            <FileText className="h-5 w-5" />
                                            <p>
                                                Belum ada usulan Surat Tugas /
                                                SPD yang dibuat.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    </div>
                </section>

                {/* Pagination */}
                {suratTugas.links && suratTugas.last_page > 1 && (
                    <nav
                        className="st-pagination"
                        aria-label="Paginasi daftar surat tugas"
                    >
                    {suratTugas.links.map((link, idx) =>
                        link.url ? (
                            <Link
                                key={idx}
                                href={link.url}
                                preserveScroll
                                preserveState
                                onStart={() => setIsLoading(true)}
                                onFinish={() => setIsLoading(false)}
                                className={`st-page-button ${link.active ? "is-active" : ""} ${idx === 0 || idx === suratTugas.links.length - 1 ? "st-page-direction" : ""}`}
                                aria-label={
                                    idx === 0
                                        ? "Halaman sebelumnya"
                                        : idx === suratTugas.links.length - 1
                                          ? "Halaman berikutnya"
                                          : `Halaman ${link.label}`
                                }
                                aria-current={link.active ? "page" : undefined}
                            >
                                {idx === 0 ? (
                                    <ChevronLeft className="h-4 w-4" />
                                ) : idx === suratTugas.links.length - 1 ? (
                                    <ChevronRight className="h-4 w-4" />
                                ) : (
                                    link.label
                                )}
                            </Link>
                        ) : (
                            <span
                                key={idx}
                                className={`st-page-button is-disabled ${idx === 0 || idx === suratTugas.links.length - 1 ? "st-page-direction" : ""}`}
                                aria-disabled="true"
                                aria-label={
                                    idx === 0
                                        ? "Halaman sebelumnya"
                                        : idx === suratTugas.links.length - 1
                                          ? "Halaman berikutnya"
                                          : `Halaman ${link.label}`
                                }
                            >
                                {idx === 0 ? (
                                    <ChevronLeft className="h-4 w-4" />
                                ) : idx === suratTugas.links.length - 1 ? (
                                    <ChevronRight className="h-4 w-4" />
                                ) : (
                                    link.label
                                )}
                            </span>
                        ),
                    )}
                    </nav>
                )}
            </div>
        </AdminLayout>
    );
}
