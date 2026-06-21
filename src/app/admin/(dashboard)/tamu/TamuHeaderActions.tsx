"use client";

import { useState } from "react";
import { FileSpreadsheet, Printer, Loader2 } from "lucide-react";
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
    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
      <select 
        value={currentPeriode}
        disabled
        className="px-4 h-[38px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full text-sm font-bold text-[var(--color-text)] outline-none focus:ring-2 focus:ring-emerald-500/50 min-w-[180px] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {activePeriodes.map(p => (
          <option key={p.id} value={p.nama_periode}>{p.nama_periode}</option>
        ))}
        {activePeriodes.length === 0 && <option value="">Tidak ada periode aktif</option>}
      </select>
      
      <button
        onClick={generatePDF}
        disabled={isGeneratingPdf || data.length === 0}
        title="Print Undangan"
        className="inline-flex items-center gap-2 px-4 h-[38px] rounded-lg border border-indigo-600/40 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600/20 hover:border-indigo-500 active:scale-95 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
      >
        {isGeneratingPdf ? <Loader2 size={15} className="animate-spin" /> : <Printer size={15} />}
        {isGeneratingPdf ? 'Memproses...' : 'Print Undangan'}
      </button>
      
      <button
        onClick={handleExportXlsx}
        disabled={isExporting || data.length === 0}
        title="Export Daftar Tamu"
        className="inline-flex items-center gap-2 px-4 h-[38px] rounded-lg border border-emerald-600/40 bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600/20 hover:border-emerald-500 active:scale-95 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
      >
        {isExporting ? <Loader2 size={15} className="animate-spin" /> : <FileSpreadsheet size={15} />}
        {isExporting ? 'Mengekspor...' : 'Export XLSX'}
      </button>
    </div>
  );
}
