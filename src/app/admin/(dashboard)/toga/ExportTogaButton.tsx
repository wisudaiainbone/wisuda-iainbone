'use client';

import { useState } from 'react';
import { FileSpreadsheet, Loader2 } from 'lucide-react';

type TogaRow = {
  nama_mahasiswa: string;
  fakultas?: string;
  toga?: string;
};

type Props = {
  data: TogaRow[];
  filename?: string;
};

export default function ExportTogaButton({ data, filename = 'data-toga' }: Props) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!data.length) return;
    setLoading(true);
    try {
      const XLSX = await import('xlsx');

      const headers = ['No', 'Nama', 'Fakultas', 'Uk Toga'];

      const rows = data.map((w, i) => [
        i + 1,
        w.nama_mahasiswa,
        w.fakultas || '-',
        w.toga || '-',
      ]);

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

      // Auto column width
      ws['!cols'] = headers.map((h, i) => {
        const maxLen = Math.max(
          h.length,
          ...rows.map(r => String(r[i] ?? '').length)
        );
        return { wch: Math.min(maxLen + 2, 50) };
      });

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Toga');

      // Kalkulasi Rekapitulasi
      const sizes = ["S", "M", "L", "XL", "XXL"];
      const recap: Record<string, Record<string, number>> = {};
      const grandTotal: Record<string, number> = { Total: 0 };
      sizes.forEach(s => { grandTotal[s] = 0; });

      data.forEach(w => {
        const f = w.fakultas || "Tanpa Fakultas";
        const s = w.toga ? w.toga.toUpperCase() : "";
        if (!recap[f]) {
          recap[f] = { Total: 0 };
          sizes.forEach(sz => { recap[f][sz] = 0; });
        }
        if (sizes.includes(s)) {
          recap[f][s] += 1;
          recap[f].Total += 1;
          grandTotal[s] += 1;
          grandTotal.Total += 1;
        }
      });

      const recapHeaders = ["Fakultas", ...sizes, "Total"];
      const recapRows = Object.keys(recap).sort().map(f => [
        f,
        ...sizes.map(s => recap[f][s]),
        recap[f].Total
      ]);
      recapRows.push(["TOTAL KESELURUHAN", ...sizes.map(s => grandTotal[s]), grandTotal.Total]);

      const wsRecap = XLSX.utils.aoa_to_sheet([recapHeaders, ...recapRows]);
      wsRecap['!cols'] = recapHeaders.map((h, i) => {
        const maxLen = Math.max(
          h.length,
          ...recapRows.map(r => String(r[i] ?? '').length)
        );
        return { wch: Math.min(maxLen + 2, 50) };
      });

      XLSX.utils.book_append_sheet(wb, wsRecap, 'Rekapitulasi');

      const date = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `${filename}-${date}.xlsx`);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading || !data.length}
      title="Export Rekap Toga"
      className="flex items-center justify-center w-10 sm:w-auto gap-1.5 sm:px-3 h-10 sm:h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm sm:text-xs font-semibold transition-colors-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin shrink-0" />
      ) : (
        <FileSpreadsheet size={16} className="shrink-0" />
      )}
      <span className="hidden sm:inline">{loading ? 'Mengekspor...' : 'Export XLSX'}</span>
    </button>
  );
}
