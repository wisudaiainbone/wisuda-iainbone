"use client";

import { FileSpreadsheet, Loader2 } from "lucide-react";
import { useState } from "react";
import * as XLSX from "xlsx";

type Props = {
  data: any[];
  overrides: any;
  periode: string;
};

export default function ExportPrestasiButton({ data, overrides, periode }: Props) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    
    // Use setTimeout to allow UI to render the loading state
    setTimeout(() => {
      try {
        const parseIpk = (ipkStr: string | null) => {
          if (!ipkStr) return 0;
          const parsed = parseFloat(ipkStr.replace(',', '.'));
          return isNaN(parsed) ? 0 : parsed;
        };

        const parseDate = (dateStr: string | null) => {
          if (!dateStr) return new Date(8640000000000000).getTime();
          const date = new Date(dateStr);
          return isNaN(date.getTime()) ? new Date(8640000000000000).getTime() : date.getTime();
        };

        const parsedData = data.map(w => ({
          ...w,
          parsedIpk: parseIpk(w.ipk),
          parsedDate: parseDate(w.tanggal_yudisium)
        }));

        // === 1. Logika Akademik ===
        // Kecualikan Pascasarjana untuk Terbaik Institut
        const sortedAkademik = [...parsedData]
          .filter(w => w.fakultas !== "Pascasarjana" && w.fakultas?.toLowerCase() !== "pascasarjana")
          .sort((a, b) => {
            if (b.parsedIpk !== a.parsedIpk) return b.parsedIpk - a.parsedIpk;
            return a.parsedDate - b.parsedDate;
          });

        let bestOverall = sortedAkademik.length > 0 ? sortedAkademik[0] : null;
        const institutOverrides = overrides?.akademik?.['Institut'] || {};
        if (institutOverrides['0']) {
          const oUser = parsedData.find(x => x.nim === institutOverrides['0']);
          if (oUser) bestOverall = oUser;
        }

        const byFakultas: Record<string, typeof parsedData> = {};
        parsedData.forEach(w => {
          const f = w.fakultas || "Tanpa Fakultas";
          if (!byFakultas[f]) byFakultas[f] = [];
          byFakultas[f].push(w);
        });

        const topFakultas = Object.keys(byFakultas).map(f => {
          const sorted = byFakultas[f].sort((a, b) => {
            if (b.parsedIpk !== a.parsedIpk) return b.parsedIpk - a.parsedIpk;
            return a.parsedDate - b.parsedDate;
          });
          
          let top3 = sorted.slice(0, 3);
          const fOverrides = overrides?.akademik?.[f] || {};
          top3 = top3.map((w, idx) => {
            if (fOverrides[idx.toString()]) {
              const oUser = parsedData.find(x => x.nim === fOverrides[idx.toString()]);
              if (oUser) return { ...oUser, isOverridden: true };
            }
            return w;
          });
          return { fakultas: f, top3 };
        }).sort((a, b) => a.fakultas.localeCompare(b.fakultas));

        const getSebutan = (idx: number) => {
          if (idx === 0) return "Wisudawan Terbaik Kesatu";
          if (idx === 1) return "Wisudawan Terbaik Kedua";
          if (idx === 2) return "Wisudawan Terbaik Ketiga";
          return `Wisudawan Terbaik Ke-${idx + 1}`;
        };

        const formatIpkForExcel = (ipkStr: string | null) => {
          if (!ipkStr) return 0;
          const parsed = parseFloat(ipkStr.replace(',', '.'));
          return isNaN(parsed) ? 0 : parsed;
        };

        const sheetAkademikData: any[] = [];
        if (bestOverall) {
          sheetAkademikData.push({
            "NAMA GELAR": bestOverall.nama_gelar || bestOverall.nama_mahasiswa,
            "NIM": bestOverall.nim,
            "IPK": formatIpkForExcel(bestOverall.ipk),
            "TGL YUDISIUM": bestOverall.tanggal_yudisium || "-",
            "PREDIKAT": bestOverall.predikat || "-",
            "SEBUTAN": "Wisudawan Terbaik Institut",
            "FAKULTAS": bestOverall.fakultas,
            "PRODI": bestOverall.prodi
          });
        }

        topFakultas.forEach(f => {
          f.top3.forEach((w, idx) => {
            sheetAkademikData.push({
              "NAMA GELAR": w.nama_gelar || w.nama_mahasiswa,
              "NIM": w.nim,
              "IPK": formatIpkForExcel(w.ipk),
              "TGL YUDISIUM": w.tanggal_yudisium || "-",
              "PREDIKAT": w.predikat || "-",
              "SEBUTAN": getSebutan(idx),
              "FAKULTAS": f.fakultas,
              "PRODI": w.prodi
            });
          });
        });

        // === 2. Logika Organisasi ===
        // Sementara kita filter semua yang punya prestasi_org
        const sheetOrganisasiData = parsedData
          .filter(w => w.prestasi_org && w.prestasi_org.trim() !== '' && w.prestasi_org.trim() !== '-')
          .map(w => ({
            "NAMA GELAR": w.nama_gelar || w.nama_mahasiswa,
            "NIM": w.nim,
            "FAKULTAS": w.fakultas,
            "PRODI": w.prodi,
            "PENGALAMAN ORGANISASI": w.prestasi_org,
            "JABATAN": w.jabatan_dalam_ormawa || "-"
          }));

        // === Buat Excel ===
        const wb = XLSX.utils.book_new();
        
        const wsAkademik = XLSX.utils.json_to_sheet(sheetAkademikData);

        // Format kolom IPK (Column C / index 2) agar menjadi angka dengan 2 desimal
        if (wsAkademik['!ref']) {
          const range = XLSX.utils.decode_range(wsAkademik['!ref']);
          for (let R = range.s.r + 1; R <= range.e.r; ++R) { // skip header
            const cellAddress = XLSX.utils.encode_cell({ c: 2, r: R });
            if (wsAkademik[cellAddress]) {
              wsAkademik[cellAddress].t = 'n'; // Type Number
              wsAkademik[cellAddress].z = "0.00"; // Format 2 decimal places
            }
          }
        }

        XLSX.utils.book_append_sheet(wb, wsAkademik, "Prestasi Akademik");

        if (sheetOrganisasiData.length > 0) {
          const wsOrg = XLSX.utils.json_to_sheet(sheetOrganisasiData);
          XLSX.utils.book_append_sheet(wb, wsOrg, "Pengalaman Organisasi");
        }

        // Adjust column widths for Akademik
        wsAkademik['!cols'] = [
          { wch: 40 }, // NAMA GELAR
          { wch: 15 }, // NIM
          { wch: 10 }, // IPK
          { wch: 15 }, // TGL YUDISIUM
          { wch: 20 }, // PREDIKAT
          { wch: 30 }, // SEBUTAN
          { wch: 30 }, // FAKULTAS
          { wch: 30 }, // PRODI
        ];

        // Adjust column widths for Organisasi
        if (sheetOrganisasiData.length > 0) {
          wb.Sheets["Pengalaman Organisasi"]['!cols'] = [
            { wch: 40 }, // NAMA GELAR
            { wch: 15 }, // NIM
            { wch: 30 }, // FAKULTAS
            { wch: 30 }, // PRODI
            { wch: 50 }, // PENGALAMAN ORGANISASI
            { wch: 30 }, // JABATAN
          ];
        }

        XLSX.writeFile(wb, `Rekap_Prestasi_${periode || 'Semua'}.xlsx`);

      } catch (error) {
        console.error(error);
        alert("Terjadi kesalahan saat mengekspor data.");
      } finally {
        setIsExporting(false);
      }
    }, 100);
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting || data.length === 0}
      title="Export XLSX"
      className="flex items-center justify-center w-10 sm:w-32 gap-1.5 px-3 sm:px-4 h-10 rounded-lg sm:rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-normal sm:font-semibold transition-colors-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
    >
      {isExporting ? <Loader2 size={16} className="animate-spin shrink-0" /> : <FileSpreadsheet size={16} className="shrink-0" />}
      <span className="hidden sm:inline">{isExporting ? "Memproses..." : "Export"}</span>
    </button>
  );
}
