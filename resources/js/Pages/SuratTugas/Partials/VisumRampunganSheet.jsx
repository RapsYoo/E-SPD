import React from "react";

function VisumSignatureBlock() {
    return (
        <div className="visum-signature">
            <div className="visum-signature-brackets">
                <span>(</span>
                <span>)</span>
            </div>
            <p className="visum-signature-nip">NIP. ____________________</p>
        </div>
    );
}

export default function VisumRampunganSheet({
    suratTugas,
    pegawaiList = [],
    tanggalBerangkat = "-",
    tanggalKembali = "-",
    tujuanPerjalanan = "-",
    ppkNama = "-",
    ppkNip = "-",
    isActive = true,
}) {
    const visumParticipants = pegawaiList.length > 0 ? pegawaiList : [null];

    return (
        <>
            {visumParticipants.map((pegawai, index) => (
                <section
                    key={pegawai?.id || pegawai?.nip || index}
                    className={`print-preview-sheet print-sheet-visum space-y-4 text-[10px] leading-snug ${
                        isActive ? "" : "hidden"
                    }`}
                    style={{
                        breakAfter:
                            index < visumParticipants.length - 1
                                ? "page"
                                : "auto",
                    }}
                >
                    <header className="text-center text-black">
                        <img
                            src="/images/kemlu-logo.webp"
                            alt="Lambang Kementerian Luar Negeri"
                            className="mx-auto h-20 w-auto object-contain"
                        />
                        <h2 className="font-bold tracking-wide text-blue-900">
                            KEMENTERIAN LUAR NEGERI
                        </h2>
                        <p className="text-[9px] font-bold tracking-[0.2em] text-red-700">
                            REPUBLIK INDONESIA
                        </p>
                        <p className="mt-3 font-bold">- 2 -</p>
                    </header>

                    <table className="w-full table-fixed border-collapse text-[9px] leading-snug">
                        <colgroup>
                            <col className="w-[6%]" />
                            <col className="w-[47%]" />
                            <col className="w-[47%]" />
                        </colgroup>
                        <tbody>
                            <tr className="h-32">
                                <td
                                    colSpan="2"
                                    className="border border-black p-2 text-center align-middle font-bold"
                                >
                                    {pegawai?.nama || ""}
                                </td>
                                <td className="border border-black p-2 align-top">
                                    <div className="grid grid-cols-[25mm_2mm_1fr] gap-x-1">
                                        <span>I. Berangkat dari</span>
                                        <span>:</span>
                                        <span>
                                            {suratTugas.tempat_berangkat || "-"}
                                        </span>
                                        <span>Ke</span>
                                        <span>:</span>
                                        <span>{tujuanPerjalanan}</span>
                                        <span>Pada tanggal</span>
                                        <span>:</span>
                                        <span>{tanggalBerangkat}</span>
                                    </div>
                                    <div className="mt-2 text-center">
                                        Pejabat Pembuat Komitmen
                                    </div>
                                    <div className="h-10" />
                                    <p className="text-center font-bold underline">
                                        {ppkNama}
                                    </p>
                                    <p className="text-center">NIP. {ppkNip}</p>
                                </td>
                            </tr>
                            <tr className="h-28">
                                <td className="border border-black p-2 text-center">
                                    II
                                </td>
                                <td className="visum-entry-cell border border-black p-2 align-top">
                                    <div className="grid grid-cols-[25mm_2mm_1fr] gap-x-1">
                                        <span>Tiba di</span>
                                        <span>:</span>
                                        <span>{tujuanPerjalanan}</span>
                                        <span>Pada tanggal</span>
                                        <span>:</span>
                                        <span>{tanggalBerangkat}</span>
                                        <span>Kepala</span>
                                        <span>:</span>
                                        <span>____________________</span>
                                    </div>
                                    <VisumSignatureBlock />
                                </td>
                                <td className="visum-entry-cell border border-black p-2 align-top">
                                    <div className="grid grid-cols-[25mm_2mm_1fr] gap-x-1">
                                        <span>Berangkat dari</span>
                                        <span>:</span>
                                        <span>{tujuanPerjalanan}</span>
                                        <span>Ke</span>
                                        <span>:</span>
                                        <span>
                                            {suratTugas.tempat_berangkat || "-"}
                                        </span>
                                        <span>Pada tanggal</span>
                                        <span>:</span>
                                        <span>{tanggalKembali}</span>
                                        <span>Kepala</span>
                                        <span>:</span>
                                        <span>____________________</span>
                                    </div>
                                    <VisumSignatureBlock />
                                </td>
                            </tr>
                            {["III", "IV", "V"].map((nomor) => (
                                <tr key={nomor} className="h-24">
                                    <td className="border border-black p-2 text-center">
                                        {nomor}
                                    </td>
                                    <td className="visum-entry-cell border border-black p-2 align-top">
                                        <div className="grid grid-cols-[25mm_2mm_1fr] gap-x-1">
                                            <span>Tiba di</span>
                                            <span>:</span>
                                            <span>____________________</span>
                                            <span>Pada tanggal</span>
                                            <span>:</span>
                                            <span>______________</span>
                                            <span>Kepala</span>
                                            <span>:</span>
                                            <span>___________________</span>
                                        </div>
                                        <VisumSignatureBlock />
                                    </td>
                                    <td className="visum-entry-cell border border-black p-2 align-top">
                                        <div className="grid grid-cols-[25mm_2mm_1fr] gap-x-1">
                                            <span>Berangkat dari</span>
                                            <span>:</span>
                                            <span>______________</span>
                                            <span>Ke</span>
                                            <span>:</span>
                                            <span>_____________________</span>
                                            <span>Pada tanggal</span>
                                            <span>:</span>
                                            <span>______________</span>
                                            <span>Kepala</span>
                                            <span>:</span>
                                            <span>___________________</span>
                                        </div>
                                        <VisumSignatureBlock />
                                    </td>
                                </tr>
                            ))}
                            <tr className="h-32">
                                <td className="border border-black p-2 text-center">
                                    VI
                                </td>
                                <td className="visum-ppk-cell border border-black p-2 align-top">
                                    <div className="grid grid-cols-[25mm_2mm_1fr] gap-x-1">
                                        <span>Tiba di</span>
                                        <span>:</span>
                                        <span>
                                            {suratTugas.tempat_berangkat || "-"}
                                        </span>
                                        <span>Pada tanggal</span>
                                        <span>:</span>
                                        <span>{tanggalKembali}</span>
                                    </div>
                                    <div className="visum-ppk-signature">
                                        <div>Pejabat Pembuat Komitmen</div>
                                        <div className="h-8" />
                                        <p className="font-bold underline">
                                            {ppkNama}
                                        </p>
                                        <p>NIP. {ppkNip}</p>
                                    </div>
                                </td>
                                <td className="visum-ppk-cell border border-black p-2 align-top">
                                    <p>
                                        Telah diperiksa dengan keterangan bahwa
                                        perjalanan tersebut atas perintahnya dan
                                        semata-mata untuk kepentingan jabatan
                                        dalam waktu yang sesingkat-singkatnya.
                                    </p>
                                    <div className="visum-ppk-signature">
                                        <div>Pejabat Pembuat Komitmen</div>
                                        <div className="h-8" />
                                        <p className="font-bold underline">
                                            {ppkNama}
                                        </p>
                                        <p>NIP. {ppkNip}</p>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-black p-2 text-center">
                                    VII
                                </td>
                                <td
                                    colSpan="2"
                                    className="border border-black p-2"
                                >
                                    Catatan Lain-lain:
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-black p-2 text-center align-top">
                                    VIII
                                </td>
                                <td
                                    colSpan="2"
                                    className="border border-black p-2"
                                >
                                    PERHATIAN: PPK yang menerbitkan SPD, pegawai
                                    yang melakukan perjalanan dinas, para
                                    pejabat yang mengesahkan tanggal
                                    berangkat/tiba, serta bendahara pengeluaran
                                    bertanggung jawab berdasarkan
                                    peraturan-peraturan Keuangan negara apabila
                                    negara menderita rugi akibat kesalahan,
                                    kelalaian, dan kealpaannya.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </section>
            ))}
        </>
    );
}
