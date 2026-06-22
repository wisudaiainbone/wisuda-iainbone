"use client";

import { useState } from "react";
import { Tag, Loader2, X, Download } from "lucide-react";
import { getFakultasData } from "@/lib/fakultas";
import TagDocument, { TagData } from "./TagDocument";
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";

type Props = {
  data: any[];
};

export default function TagDialog({ data }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFakultas, setSelectedFakultas] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Ambil daftar fakultas yang unik dari data yang ada
  const fakultasList = Array.from(new Set(data.map((w) => w.fakultas).filter(Boolean))).sort();

  // Hitung jumlah wisudawan terdaftar di fakultas yang dipilih
  const wisudawanTerdaftar = data.filter(
    (w) => w.fakultas === selectedFakultas && w.terdaftar && w.terdaftar !== "false" && w.terdaftar !== "0"
  );
  
  const totalData = wisudawanTerdaftar.length;

  const handleGenerate = async () => {
    if (!selectedFakultas || totalData === 0) return;
    setIsGenerating(true);

    try {
      // Siapkan data
      // Urutkan berdasarkan nomor urut (yang secara implisit sudah mengurutkan prodi jika generate nomor benar)
      const sortedData = [...wisudawanTerdaftar].sort((a, b) => (a.urut || 0) - (b.urut || 0));

      const tagDataList: TagData[] = sortedData.map((w) => {
        const fakData = getFakultasData(w.fakultas);
        return {
          nim: w.nim,
          namaLengkap: w.nama_mahasiswa,
          prodiSingkat: w.prodi_singkat || w.prodi || "-",
          fakultasSingkat: fakData.singkatan,
          nomorUrut: w.urut || 0,
        };
      });

      // Ambil string periode dari data pertama (semua harusnya sama)
      const periode = sortedData.length > 0 && sortedData[0].periode ? sortedData[0].periode : "Periode Aktif";

      // Fetch logo untuk PDF
      let base64Logo = "";
      try {
        const response = await fetch("/logo.png");
        const blob = await response.blob();
        base64Logo = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch (err) {
        console.error("Gagal memuat logo:", err);
      }

      // Kompilasi PDF
      const pdfBlob = await pdf(<TagDocument data={tagDataList} periode={periode} logoBase64={base64Logo} />).toBlob();
      
      // Unduh file
      const fileName = `Label-Nama-Dada_${selectedFakultas.replace(/\s+/g, "-")}.pdf`;
      saveAs(pdfBlob, fileName);
      
      setIsOpen(false);
    } catch (error) {
      console.error("Gagal men-generate PDF:", error);
      alert("Terjadi kesalahan saat memproses PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        title="Cetak Label Nama Dada"
        className="flex items-center justify-center gap-1.5 px-3 sm:px-4 h-8 sm:h-10 rounded-lg sm:rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-normal sm:font-semibold transition-colors shadow-sm shadow-indigo-900/20 whitespace-nowrap"
      >
        <Tag size={16} />
        Tag
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                  <Tag size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--color-text)]">Cetak Label Nama</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">Pilih fakultas untuk digenerate</p>
                </div>
              </div>
              <button
                onClick={() => !isGenerating && setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                disabled={isGenerating}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Fakultas
                </label>
                <select
                  value={selectedFakultas}
                  onChange={(e) => setSelectedFakultas(e.target.value)}
                  className="w-full h-11 px-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all appearance-none cursor-pointer"
                  disabled={isGenerating}
                >
                  <option value="">Pilih Fakultas...</option>
                  {fakultasList.map((fak) => (
                    <option key={fak} value={fak}>
                      {fak}
                    </option>
                  ))}
                </select>
              </div>

              {selectedFakultas && (
                <div className="flex flex-col items-center justify-center p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-xl">
                  <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tight">
                    {totalData}
                  </span>
                  <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 uppercase tracking-widest mt-1">
                    Wisudawan Terdaftar
                  </span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border)] flex justify-end gap-3">
              <button
                onClick={() => setIsOpen(false)}
                disabled={isGenerating}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-text)] transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleGenerate}
                disabled={!selectedFakultas || totalData === 0 || isGenerating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    <span>Generate PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
