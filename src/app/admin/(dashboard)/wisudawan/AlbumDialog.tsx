'use client';

import { useState, useMemo } from 'react';
import { BookOpen, X, Loader2, AlertCircle, FileSpreadsheet, Image as ImageIcon, Download } from 'lucide-react';
import { extractGDriveFileId } from '@/lib/uploadFoto';
import { saveAs } from 'file-saver';
// @ts-ignore
import ExcelJS from 'exceljs';
// @ts-ignore
import JSZip from 'jszip';

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
  foto?: string;
};

type ProdiItem = {
  id: number;
  fakultas: string;
  prodi: string;
  singkatan: string;
  urutan: number;
};

type Props = {
  data: WisudawanRow[];
  prodiData: ProdiItem[];
  disabled?: boolean;
};

async function fetchImageBlob(url: string): Promise<{ blob: Blob; ext: string } | null> {
  if (!url) return null;
  try {
    let fetchUrl = url;
    if (url.includes('drive.google.com')) {
      const fileId = extractGDriveFileId(url);
      if (fileId) {
        fetchUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
      }
    }
    let res = await fetch(fetchUrl, { mode: 'cors', referrerPolicy: 'no-referrer' });
    if (!res.ok && fetchUrl !== url) {
      res = await fetch(url, { mode: 'cors', referrerPolicy: 'no-referrer' });
    }
    if (!res.ok) return null;
    const blob = await res.blob();
    const ext = blob.type === 'image/png' ? 'png' : 'jpg';
    return { blob, ext };
  } catch {
    return null;
  }
}

async function fetchImageAsBase64(url: string): Promise<{ base64: string; ext: string } | null> {
  const result = await fetchImageBlob(url);
  if (!result) return null;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve({ base64: reader.result as string, ext: result.ext });
    reader.readAsDataURL(result.blob);
  });
}

export default function AlbumDialog({ data, prodiData, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedFakultas, setSelectedFakultas] = useState('');
  const [includePhoto, setIncludePhoto] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');

  const fakultasList = useMemo(() => {
    return Array.from(new Set(data.map(w => w.fakultas).filter(Boolean) as string[])).sort();
  }, [data]);

  const targetWisudawan = useMemo(() => {
    let filtered = data.filter(w => Boolean(w.terdaftar && w.terdaftar !== 'false' && w.terdaftar !== '0') && w.urut != null);
    if (selectedFakultas) {
      filtered = filtered.filter(w => w.fakultas === selectedFakultas);
    }
    filtered.sort((a, b) => {
      const fakA = a.fakultas || '';
      const fakB = b.fakultas || '';
      if (fakA !== fakB) return fakA.localeCompare(fakB);
      const prodiObjA = prodiData.find(p => p.prodi === a.prodi);
      const prodiObjB = prodiData.find(p => p.prodi === b.prodi);
      const prodiAOrder = prodiObjA?.urutan ?? 999;
      const prodiBOrder = prodiObjB?.urutan ?? 999;
      if (prodiAOrder !== prodiBOrder) return prodiAOrder - prodiBOrder;
      return (a.urut || 0) - (b.urut || 0);
    });
    return filtered;
  }, [data, prodiData, selectedFakultas]);

  // Fetch & cache all photos. Returns map of nim -> { base64, ext }
  const loadPhotos = async (): Promise<Map<string, { base64: string; ext: string }>> => {
    const photoMap = new Map<string, { base64: string; ext: string }>();
    if (!includePhoto) return photoMap;
    for (let i = 0; i < targetWisudawan.length; i++) {
      const w = targetWisudawan[i];
      setProgressMsg(`Mengunduh foto ${i + 1}/${targetWisudawan.length}: ${w.nama_mahasiswa}`);
      setProgress(Math.round(((i + 1) / targetWisudawan.length) * 50));
      if (w.foto) {
        const result = await fetchImageAsBase64(w.foto);
        if (result) photoMap.set(w.nim, result);
      }
    }
    return photoMap;
  };

  const generateXLSX = async () => {
    setIsGenerating(true);
    try {
      const photoMap = await loadPhotos();
      setProgressMsg('Merender XLSX...');
      setProgress(60);

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Album');

      sheet.columns = [
        { header: 'No', key: 'no', width: 5 },
        { header: 'Area Foto', key: 'foto', width: 15 },
        { header: 'Detail Data', key: 'detail', width: 50 },
        { header: 'Tanda Tangan', key: 'ttd', width: 25 },
      ];

      targetWisudawan.forEach((w, i) => {
        const nama = w.nama_gelar || w.nama_mahasiswa;
        const row = sheet.addRow([
          i + 1,
          '',
          `NAMA: ${nama}\nNIM: ${w.nim}\nFAKULTAS: ${w.fakultas}\nPRODI: ${w.prodi}`,
          `${i + 1}. \n\n..........................`
        ]);

        row.height = 80;
        row.getCell(3).alignment = { wrapText: true, vertical: 'middle', horizontal: 'left' };
        row.getCell(4).alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
        row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

        const photoData = photoMap.get(w.nim);
        if (photoData) {
          try {
            const imageId = workbook.addImage({
              base64: photoData.base64,
              extension: photoData.ext === 'png' ? 'png' : 'jpeg' as any,
            });
            sheet.addImage(imageId, {
              tl: { col: 1, row: i + 1 },
              ext: { width: 80, height: 100 },
              editAs: 'oneCell'
            });
          } catch (e) {}
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Album_Wisudawan_${selectedFakultas || 'Semua'}.xlsx`);
      setProgress(75);
      setProgressMsg('Excel selesai!');

      // Download foto sebagai ZIP jika include foto diaktifkan
      if (includePhoto && photoMap.size > 0) {
        setProgressMsg('Membuat ZIP foto...');
        const zip = new JSZip();
        const fotoFolder = zip.folder('foto');
        let count = 0;
        for (const w of targetWisudawan) {
          const photoData = photoMap.get(w.nim);
          if (photoData && fotoFolder) {
            // Strip base64 header ("data:image/jpeg;base64,")
            const base64Data = photoData.base64.split(',')[1];
            fotoFolder.file(`${w.nim}.${photoData.ext}`, base64Data, { base64: true });
            count++;
          }
        }
        if (count > 0) {
          setProgress(90);
          setProgressMsg(`Mengemas ${count} foto ke ZIP...`);
          const zipBlob = await zip.generateAsync({ type: 'blob' });
          saveAs(zipBlob, `Foto_Wisudawan_${selectedFakultas || 'Semua'}.zip`);
        }
      }

      setProgress(100);
      setProgressMsg('Selesai!');
    } catch (e) {
      console.error(e);
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
        className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 h-8 sm:h-10 rounded-lg sm:rounded-xl text-white text-xs sm:text-sm font-normal sm:font-semibold transition-colors whitespace-nowrap ${disabled ? 'bg-slate-400 cursor-not-allowed opacity-50' : 'bg-pink-600 hover:bg-pink-700'}`}
      >
        <BookOpen size={18} />
        <span>Album</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[var(--color-text)] flex items-center gap-2">
                <BookOpen className="text-indigo-600" size={24} />
                Generate Buku Album
              </h3>
              <button onClick={() => !isGenerating && setOpen(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[var(--color-text)] mb-1">
                  Pilih Fakultas (Opsional)
                </label>
                <select
                  value={selectedFakultas}
                  onChange={(e) => setSelectedFakultas(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5 text-sm text-[var(--color-text)] focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  disabled={isGenerating}
                >
                  <option value="">Semua Fakultas</option>
                  {fakultasList.map((fak) => (
                    <option key={fak} value={fak}>{fak}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-start gap-3 p-3 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-secondary)] cursor-pointer hover:bg-[var(--color-border)] transition-colors">
                <input
                  type="checkbox"
                  checked={includePhoto}
                  onChange={(e) => setIncludePhoto(e.target.checked)}
                  disabled={isGenerating}
                  className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 bg-[var(--color-surface)] border-[var(--color-border)]"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-[var(--color-text)] flex items-center gap-1">
                    <ImageIcon size={14} /> Sertakan Foto Asli
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Jika dicentang, foto akan disertakan dalam Excel <strong>dan</strong> diunduh terpisah sebagai file ZIP dengan nama <code className="bg-[var(--color-border)] px-1 rounded">nim.jpg</code>.
                  </span>
                </div>
              </label>

              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800/30 flex items-start gap-3">
                <AlertCircle className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" size={16} />
                <div className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                  Ada {targetWisudawan.length} wisudawan yang valid untuk di-generate. Data diurutkan sesuai urutan prodi dan nomor urut.
                </div>
              </div>

              {isGenerating ? (
                <div className="space-y-3 pt-4 border-t border-[var(--color-border)]">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-indigo-600 flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Memproses...
                    </span>
                    <span className="font-mono font-bold text-indigo-600">{progress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-indigo-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] text-center animate-pulse">{progressMsg}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 pt-4 border-t border-[var(--color-border)]">
                  <button
                    onClick={generateXLSX}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors"
                  >
                    <FileSpreadsheet size={18} />
                    Export sebagai Excel (XLSX)
                    {includePhoto && (
                      <span className="ml-1 text-[10px] bg-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Download size={10} /> + ZIP Foto
                      </span>
                    )}
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
