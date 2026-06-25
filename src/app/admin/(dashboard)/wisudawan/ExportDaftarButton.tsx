'use client';

import { useState } from 'react';
import { ClipboardList, Loader2 } from 'lucide-react';

type WisudawanRow = {
  nim: string;
  nama_mahasiswa: string;
  nama_gelar?: string;
  fakultas?: string;
  prodi?: string;
  ipk?: number | null;
  predikat?: string;
  sesi?: string;
  urut?: number | null;
  terdaftar?: string;
};

type Props = {
  data: WisudawanRow[];
  filename?: string;
};

export default function ExportDaftarButton({ data, filename = 'daftar-wisudawan' }: Props) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!data.length) return;
    setLoading(true);
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      // Hanya proses wisudawan yang terdaftar
      const terdaftarData = data.filter(w => w.terdaftar && w.terdaftar !== 'false' && w.terdaftar !== '0');

      ['Sesi Satu', 'Sesi Dua'].forEach(sesi => {
        const sesiData = terdaftarData.filter(w => w.sesi === sesi);
        if (sesiData.length === 0) return;

        // Urutkan berdasarkan kolom urut
        sesiData.sort((a, b) => (a.urut || 0) - (b.urut || 0));

        const rows: any[][] = [];

        // Kelompokkan berdasarkan Fakultas
        const byFakultas: Record<string, WisudawanRow[]> = {};
        sesiData.forEach(w => {
          const fak = w.fakultas || 'Tanpa Fakultas';
          if (!byFakultas[fak]) byFakultas[fak] = [];
          byFakultas[fak].push(w);
        });

        // Iterasi per fakultas berdasarkan urutan kemunculan dari sorting `urut`
        const processedFakultas = new Set<string>();

        sesiData.forEach(w => {
          const fak = w.fakultas || 'Tanpa Fakultas';
          if (!processedFakultas.has(fak)) {
            processedFakultas.add(fak);

            // Tambahkan baris kosong sebelum fakultas baru jika bukan yang pertama
            if (rows.length > 0) {
              rows.push([]);
            }

            // Baris Nama Fakultas
            rows.push([fak.toUpperCase()]);

            // Baris Header
            rows.push(['No', 'NAMA', 'NIM', 'IPK', 'Predikat', 'Prodi']);

            // Baris Data untuk Fakultas ini
            byFakultas[fak].forEach(mahasiswa => {
              rows.push([
                mahasiswa.urut || '',
                mahasiswa.nama_gelar || mahasiswa.nama_mahasiswa,
                mahasiswa.nim,
                mahasiswa.ipk != null ? Number(mahasiswa.ipk).toFixed(2) : '',
                mahasiswa.predikat || '',
                mahasiswa.prodi || '',
              ]);
            });
          }
        });

        const ws = XLSX.utils.aoa_to_sheet(rows);

        // Styling dan Lebar Kolom
        ws['!cols'] = [
          { wch: 8 },   // No
          { wch: 45 },  // NAMA
          { wch: 20 },  // NIM
          { wch: 8 },   // IPK
          { wch: 15 },  // Predikat
          { wch: 40 },  // Prodi
        ];

        // Merge cells untuk baris Fakultas
        const merges = [];
        for (let i = 0; i < rows.length; i++) {
          if (rows[i].length === 1 && rows[i][0] && rows[i][0] !== '') {
            merges.push({ s: { r: i, c: 0 }, e: { r: i, c: 5 } });
          }
        }
        if (merges.length > 0) ws['!merges'] = merges;

        XLSX.utils.book_append_sheet(wb, ws, sesi);
      });

      if (wb.SheetNames.length === 0) {
        // Jika tidak ada data di Sesi Satu atau Sesi Dua
        const ws = XLSX.utils.aoa_to_sheet([['Tidak ada data wisudawan terdaftar pada sesi mana pun']]);
        XLSX.utils.book_append_sheet(wb, ws, 'Data Kosong');
      }

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
      title="Export Daftar Wisudawan"
      className="flex items-center justify-center gap-1.5 px-3 sm:px-4 h-8 sm:h-10 rounded-lg sm:rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-normal sm:font-semibold transition-colors-teal-900/20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <ClipboardList size={16} />
      )}
      <span>{loading ? 'Mengekspor...' : 'Daftar'}</span>
    </button>
  );
}
