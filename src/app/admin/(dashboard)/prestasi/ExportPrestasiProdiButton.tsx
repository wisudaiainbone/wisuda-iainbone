"use client";

import { FileSpreadsheet, Loader2 } from "lucide-react";
import { useState } from "react";
import * as XLSX from "xlsx";

type Props = {
  data: any[];
  overrides: any;
  periode: string;
};

export default function ExportPrestasiProdiButton({ data, overrides, periode }: Props) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);

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

        const formatIpkForExcel = (ipkStr: string | null) => {
          if (!ipkStr) return 0;
          const parsed = parseFloat(ipkStr.replace(',', '.'));
          return isNaN(parsed) ? 0 : parsed;
        };

        const getSebutan = (idx: number) => {
          if (idx === 0) return "Wisudawan Terbaik Kesatu";
          if (idx === 1) return "Wisudawan Terbaik Kedua";
          if (idx === 2) return "Wisudawan Terbaik Ketiga";
          return `Wisudawan Terbaik Ke-${idx + 1}`;
        };

        const parsedData = data.map(w => ({
          ...w,
          parsedIpk: parseIpk(w.ipk),
          parsedDate: parseDate(w.tanggal_yudisium)
        }));

        // === Grup by Prodi ===
        const byProdi: Record<string, typeof parsedData> = {};
        parsedData.forEach(w => {
          const p = w.prodi || "Tanpa Prodi";
          if (!byProdi[p]) byProdi[p] = [];
          byProdi[p].push(w);
        });

        // Top 3 per Prodi (dengan override prodi)
        const topProdi = Object.keys(byProdi).map(prodi => {
          const sorted = [...byProdi[prodi]].sort((a, b) => {
            if (b.parsedIpk !== a.parsedIpk) return b.parsedIpk - a.parsedIpk;
            if (a.parsedDate !== b.parsedDate) return a.parsedDate - b.parsedDate;
            return a.nim.localeCompare(b.nim);
          });

          let top3 = sorted.slice(0, 3);
          const prodiOverrides = overrides?.prodi?.[prodi] || {};

          top3 = top3.map((w, idx) => {
            if (prodiOverrides[idx.toString()]) {
              const oUser = parsedData.find(x => x.nim === prodiOverrides[idx.toString()]);
              if (oUser) return { ...oUser, isOverridden: true };
            }
            return w;
          });

          const fakultas = byProdi[prodi][0]?.fakultas || "Tanpa Fakultas";
          return { prodi, fakultas, top3 };
        }).sort((a, b) => {
          const fCmp = a.fakultas.localeCompare(b.fakultas);
          if (fCmp !== 0) return fCmp;
          return a.prodi.localeCompare(b.prodi);
        });

        // === Buat data sheet ===
        const sheetProdiData: any[] = [];
        topProdi.forEach(({ prodi, fakultas, top3 }) => {
          top3.forEach((w, idx) => {
            sheetProdiData.push({
              "FAKULTAS": fakultas,
              "PROGRAM STUDI": prodi,
              "SEBUTAN": getSebutan(idx),
              "NAMA GELAR": String(w.nama_gelar || w.nama_mahasiswa || "").toUpperCase(),
              "NIM": w.nim,
              "IPK": formatIpkForExcel(w.ipk),
              "TGL YUDISIUM": w.tanggal_yudisium || "-",
              "PREDIKAT": w.predikat || "-",
            });
          });
        });

        // === Buat Excel ===
        const wb = XLSX.utils.book_new();
        const wsProdi = XLSX.utils.json_to_sheet(sheetProdiData);

        // Format kolom IPK (Column F / index 5) sebagai angka 2 desimal
        if (wsProdi['!ref']) {
          const range = XLSX.utils.decode_range(wsProdi['!ref']);
          for (let R = range.s.r + 1; R <= range.e.r; ++R) {
            const cellAddress = XLSX.utils.encode_cell({ c: 5, r: R });
            if (wsProdi[cellAddress]) {
              wsProdi[cellAddress].t = 'n';
              wsProdi[cellAddress].z = "0.00";
            }
          }
        }

        // Column widths
        wsProdi['!cols'] = [
          { wch: 35 }, // FAKULTAS
          { wch: 35 }, // PROGRAM STUDI
          { wch: 28 }, // SEBUTAN
          { wch: 40 }, // NAMA GELAR
          { wch: 15 }, // NIM
          { wch: 8  }, // IPK
          { wch: 15 }, // TGL YUDISIUM
          { wch: 18 }, // PREDIKAT
        ];

        XLSX.utils.book_append_sheet(wb, wsProdi, "Prestasi Prodi");
        XLSX.writeFile(wb, `Rekap_Prestasi_Prodi_${periode || 'Semua'}.xlsx`);

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
      title="Export XLSX Prestasi Prodi"
      className="flex items-center justify-center w-10 sm:w-32 gap-1.5 px-3 sm:px-4 h-10 rounded-lg sm:rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-normal sm:font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
    >
      {isExporting ? <Loader2 size={16} className="animate-spin shrink-0" /> : <FileSpreadsheet size={16} className="shrink-0" />}
      <span className="hidden sm:inline">{isExporting ? "Memproses..." : "Export"}</span>
    </button>
  );
}
