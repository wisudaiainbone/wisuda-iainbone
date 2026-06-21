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
      const sizes = ["S", "M", "L", "XL", "XXL", "XXXL"];
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
      className="inline-flex items-center gap-2 px-4 h-[38px] rounded-lg border border-emerald-600/40 bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600/20 hover:border-emerald-500 active:scale-95 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
    >
      {loading ? (
        <Loader2 size={15} className="animate-spin" />
      ) : (
        <FileSpreadsheet size={15} />
      )}
      {loading ? 'Mengekspor...' : 'Export XLSX'}
    </button>
  );
}
