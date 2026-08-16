'use client';

import { useState, useMemo } from 'react';
import { Armchair, X, Loader2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { saveAs } from 'file-saver';
// @ts-ignore
import ExcelJS from 'exceljs';

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
  disabled?: boolean;
};

export default function LabelKursiDialog({ data, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');

  const targetWisudawan = useMemo(() => {
    return data.filter(w => Boolean(w.terdaftar && w.terdaftar !== 'false' && w.terdaftar !== '0') && w.urut != null);
  }, [data]);

  const generateLabelKursi = async () => {
    setIsGenerating(true);
    try {
      setProgressMsg('Memuat template excel...');
      
      const response = await fetch('/template_label_kursi.xlsx');
      if (!response.ok) {
        throw new Error('File template_label_kursi.xlsx tidak ditemukan di folder public. Harap copy file Anda ke folder public dengan nama tersebut.');
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      
      const sheet = workbook.getWorksheet('Daftar');
      if (!sheet) {
        throw new Error('Sheet "Daftar" tidak ditemukan di dalam template. Harap pastikan nama sheet adalah "Daftar"');
      }

      setProgressMsg('Menyusun data...');

      // Memisahkan berdasarkan Sesi & urutkan
      const sesi1List = targetWisudawan.filter(w => w.sesi === 'Sesi Satu').sort((a, b) => (a.urut || 0) - (b.urut || 0));
      const sesi2List = targetWisudawan.filter(w => w.sesi === 'Sesi Dua').sort((a, b) => (a.urut || 0) - (b.urut || 0));

      // Membuat header otomatis sesuai permintaan (background kuning)
      const headerRow = sheet.getRow(1);
      headerRow.values = ['NO', 'SESI 1', 'NIM', 'SESI 2', 'NIM'];
      for (let c = 1; c <= 5; c++) {
        const cell = headerRow.getCell(c);
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFF00' } // Warna kuning pekat
        };
      }
      // Set lebar kolom agar rapi
      sheet.getColumn(1).width = 5;
      sheet.getColumn(2).width = 35;
      sheet.getColumn(3).width = 25;
      sheet.getColumn(4).width = 35;
      sheet.getColumn(5).width = 25;
      headerRow.commit();

      const maxLength = Math.max(sesi1List.length, sesi2List.length);

      // Mulai mengisi dari baris ke-2 (karena baris 1 adalah header)
      for (let i = 0; i < maxLength; i++) {
        const rowNum = i + 2;
        const row = sheet.getRow(rowNum);
        
        // Kolom A: NO
        row.getCell(1).value = i + 1;

        // Sesi 1
        if (i < sesi1List.length) {
          const w1 = sesi1List[i];
          // Sesuai revisi: "[Urut] | [NAMA TANPA GELAR]" (UPPERCASE)
          row.getCell(2).value = `${w1.urut} | ${w1.nama_mahasiswa.toUpperCase()}`;
          row.getCell(3).value = `${w1.nim} ( SESI 1 )`;
        } else {
          row.getCell(2).value = '';
          row.getCell(3).value = '';
        }

        // Sesi 2
        if (i < sesi2List.length) {
          const w2 = sesi2List[i];
          // Sesuai revisi: "[Urut] | [NAMA TANPA GELAR]" (UPPERCASE)
          row.getCell(4).value = `${w2.urut} | ${w2.nama_mahasiswa.toUpperCase()}`;
          row.getCell(5).value = `${w2.nim} ( SESI 2 )`;
        } else {
          row.getCell(4).value = '';
          row.getCell(5).value = '';
        }
        
        row.commit();
      }

      setProgressMsg('Menyimpan file...');
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Label_Kursi_Wisuda.xlsx`);
      
      setProgressMsg('Selesai!');
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Terjadi kesalahan saat membuat label kursi');
      setProgressMsg('Terjadi kesalahan!');
    } finally {
      setTimeout(() => setIsGenerating(false), 2000);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={disabled}
        className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 h-8 sm:h-10 rounded-lg sm:rounded-xl text-white text-xs sm:text-sm font-normal sm:font-semibold transition-colors whitespace-nowrap ${disabled ? 'bg-slate-400 cursor-not-allowed opacity-50' : 'bg-cyan-600 hover:bg-cyan-700'}`}
        title="Generate Label Kursi (Excel)"
      >
        <Armchair size={18} />
        <span>Kursi</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[var(--color-text)] flex items-center gap-2">
                <Armchair className="text-cyan-600" size={24} />
                Generate Label Kursi
              </h3>
              <button onClick={() => !isGenerating && setOpen(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800/30 flex items-start gap-3">
                <AlertCircle className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" size={16} />
                <div className="text-xs text-amber-700 dark:text-amber-400 font-medium space-y-1">
                  <p>Pastikan Anda telah memasukkan file <strong>template_label_kursi.xlsx</strong> ke dalam folder <strong>public</strong>.</p>
                  <p>Sistem akan memuat template tersebut, mengisikan data otomatis ke tab <strong>Daftar</strong>, dan memberikan unduhan Excel jadinya kepada Anda.</p>
                </div>
              </div>

              {isGenerating ? (
                <div className="space-y-3 pt-4 border-t border-[var(--color-border)]">
                  <div className="flex items-center justify-center gap-2 text-sm font-medium text-cyan-600">
                    <Loader2 size={16} className="animate-spin" />
                    {progressMsg}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 pt-4 border-t border-[var(--color-border)]">
                  <button
                    onClick={generateLabelKursi}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl transition-colors"
                  >
                    <FileSpreadsheet size={18} />
                    Ekspor Excel Label Kursi
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
