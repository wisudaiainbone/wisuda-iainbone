"use client";

import { useState } from "react";
import { FileSpreadsheet, Printer, Loader2, Filter } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import UndanganDocument, { TamuItem } from "./UndanganDocument";
import { useToast } from "@/components/ui/Toast";
import * as XLSX from "xlsx";

type Props = {
  data: TamuItem[];
  settings: any;
  activePeriodes: { id: string; nama_periode: string }[];
  currentPeriode: string;
};

export default function TamuHeaderActions({ data, settings, activePeriodes, currentPeriode }: Props) {
  const { showToast } = useToast();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const generatePDF = async () => {
    if (data.length === 0) {
      showToast("Tidak ada data tamu untuk diprint.", "info");
      return;
    }
    
    setIsGeneratingPdf(true);
    try {
      const blob = await pdf(
        <UndanganDocument data={data} settings={settings} periode={currentPeriode} />
      ).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Undangan_Tamu_Batch.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      
      showToast("PDF berhasil dibuat!", "success");
    } catch (err) {
      console.error(err);
      showToast("Gagal membuat PDF", "error");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleExportXlsx = () => {
    if (data.length === 0) {
      showToast("Tidak ada data tamu untuk diexport.", "info");
      return;
    }
    
    setIsExporting(true);
    try {
      const exportData = data.map((t, idx) => ({
        "No": idx + 1,
        "ID Tamu": t.id,
        "Nama": t.nama,
        "Jabatan": t.jabatan,
        "Alamat": t.alamat,
        "Sesi": t.sesi,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Daftar Tamu");
      XLSX.writeFile(wb, `Daftar_Tamu_${currentPeriode || "All"}.xlsx`);
    } catch (err) {
      console.error(err);
      showToast("Gagal mengekspor data.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
      <div className="flex items-center gap-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 h-10 sm:h-9 flex-1 min-w-0">
        <Filter size={13} className="text-[var(--color-text-muted)] shrink-0" />
        <select 
          value={currentPeriode}
          disabled
          className="text-sm sm:text-xs font-medium bg-transparent text-[var(--color-text)] outline-none flex-1 min-w-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {activePeriodes.map(p => (
            <option key={p.id} value={p.nama_periode}>{p.nama_periode}</option>
          ))}
          {activePeriodes.length === 0 && <option value="">Tidak ada periode aktif</option>}
        </select>
      </div>
      
      <div className="shrink-0 flex gap-2 h-10 sm:h-9">
        <button
          onClick={generatePDF}
          disabled={isGeneratingPdf || data.length === 0}
          title="Print Undangan"
          className="flex items-center justify-center w-10 sm:w-auto gap-1.5 px-0 sm:px-4 h-full rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-normal sm:font-semibold transition-colors-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isGeneratingPdf ? <Loader2 size={16} className="animate-spin shrink-0" /> : <Printer size={16} className="shrink-0" />}
          <span className="hidden sm:inline">{isGeneratingPdf ? 'Memproses...' : 'Print Undangan'}</span>
        </button>
        
        <button
          onClick={handleExportXlsx}
          disabled={isExporting || data.length === 0}
          title="Export XLSX"
          className="flex items-center justify-center w-10 sm:w-auto gap-1.5 px-0 sm:px-4 h-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-normal sm:font-semibold transition-colors-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isExporting ? <Loader2 size={16} className="animate-spin shrink-0" /> : <FileSpreadsheet size={16} className="shrink-0" />}
          <span className="hidden sm:inline">{isExporting ? 'Mengekspor...' : 'Export'}</span>
        </button>
      </div>
    </div>
  );
}
