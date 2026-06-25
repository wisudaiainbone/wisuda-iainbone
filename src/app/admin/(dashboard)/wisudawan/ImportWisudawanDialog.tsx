"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { Plus, Download, AlertCircle, CheckCircle2, Loader2, X, UploadCloud, FileSpreadsheet } from "lucide-react";
import { importWisudawanBatch, checkExistingNims } from "@/actions/wisudawan";

type Props = {
  userRole: string;
  unitKerja?: string | null;
  dbProdiList?: any[];
};

// Levenshtein distance helper for fuzzy matching
function levenshteinDistance(a: string, b: string): number {
  const matrix = [];
  let i, j;
  for (i = 0; i <= b.length; i++) { matrix[i] = [i]; }
  for (j = 0; j <= a.length; j++) { matrix[0][j] = j; }
  for (i = 1; i <= b.length; i++) {
    for (j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
      }
    }
  }
  return matrix[b.length][a.length];
}

export default function ImportWisudawanDialog({ userRole, unitKerja, dbProdiList = [] }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | "warning"; message: string; failedData?: any[] } | null>(null);
  const [resultData, setResultData] = useState<{ type: "success" | "error" | "warning"; title: string; message: string; failedData?: any[] } | null>(null);

  const resetForm = () => {
    setFile(null);
    setPreviewData([]);
    setStatus(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => {
    if (loading) return;
    setIsOpen(false);
    setTimeout(resetForm, 300);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      { nim: "1234567890", nama_mahasiswa: "Ahmad Fauzi", ipk: "3.85", predikat: "Cumlaude", fakultas: "Fakultas Tarbiyah", prodi: "Pendidikan Agama Islam", toga: "XL", tanggal_yudisium: "2023-12-01" },
      { nim: "1234567891", nama_mahasiswa: "Budi Santoso", ipk: "3.50", predikat: "Cumlaude", fakultas: "Fakultas Syariah dan Hukum Islam", prodi: "Hukum Keluarga Islam", toga: "XL", tanggal_yudisium: "2023-12-01" },
      { nim: "1234567892", nama_mahasiswa: "Citra Kirana", ipk: "3.75", predikat: "Cumlaude", fakultas: "Fakultas Ushuluddin dan Dakwah", prodi: "Ilmu Al-Qur'an Dan Tafsir", toga: "XL", tanggal_yudisium: "2023-12-01" },
      { nim: "1234567893", nama_mahasiswa: "Dewi Lestari", ipk: "3.90", predikat: "Cumlaude", fakultas: "Fakultas Ekonomi dan Bisnis Islam", prodi: "Ekonomi Syariah", toga: "XL", tanggal_yudisium: "2023-12-01" },
      { nim: "1234567894", nama_mahasiswa: "Eko Prasetyo", ipk: "3.60", predikat: "Cumlaude", fakultas: "Pascasarjana", prodi: "S2 Pendidikan Agama Islam", toga: "XL", tanggal_yudisium: "2023-12-01" },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

    if (dbProdiList.length > 0) {
      const fakultasData = dbProdiList.map(p => ({
        Fakultas: p.fakultas,
        Prodi: p.prodi
      }));
      const wsFakultas = XLSX.utils.json_to_sheet(fakultasData);
      XLSX.utils.book_append_sheet(workbook, wsFakultas, "Fakultas");
    }

    XLSX.writeFile(workbook, "Template_Import_Wisudawan.xlsx");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    processFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    processFile(droppedFile);
  };

  const processFile = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      setStatus({ type: "error", message: "Hanya file Excel (.xlsx atau .xls) yang diperbolehkan." });
      return;
    }

    setFile(selectedFile);
    setStatus(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setLoading(true);
        const data = e.target?.result;
        // Gunakan raw: false agar membaca teks persis seperti yang terlihat di Excel
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: "" });

        const nims = jsonData.map((row: any) => row.nim?.toString()).filter(Boolean);
        const existingNims = await checkExistingNims(nims);

        const processedData = jsonData.map((row: any) => {
          let isValid = true;
          let reason = '';
          const nimStr = row.nim?.toString();

          if (!nimStr) {
            isValid = false;
            reason = 'NIM Kosong';
          } else if (existingNims.includes(nimStr)) {
            isValid = false;
            reason = 'NIM Sudah Terdaftar';
          } else if (!row.nama_mahasiswa?.toString().trim()) {
            isValid = false;
            reason = 'Nama Kosong';
          } else if (row.ipk === undefined || row.ipk === null || row.ipk === '') {
            isValid = false;
            reason = 'IPK Kosong';
          } else if (!row.predikat?.toString().trim()) {
            isValid = false;
            reason = 'Predikat Kosong';
          } else if (!row.fakultas?.toString().trim()) {
            isValid = false;
            reason = 'Fakultas Kosong';
          } else if (!row.prodi?.toString().trim()) {
            isValid = false;
            reason = 'Prodi Kosong';
          } else if (!row.tanggal_yudisium || row.tanggal_yudisium.toString().trim() === '') {
            isValid = false;
            reason = 'Tgl Yudisium Kosong';
          } else if (!/^\d{4}-\d{2}-\d{2}$/.test(row.tanggal_yudisium.toString().trim())) {
            isValid = false;
            reason = 'Format Tgl Yudisium harus YYYY-MM-DD';
          } else if (userRole === 'admin_unit' && unitKerja) {
            const f = row.fakultas ? row.fakultas.toString().toLowerCase().trim() : '';
            if (f !== unitKerja.toLowerCase().trim()) {
              isValid = false;
              reason = `Bukan ${unitKerja}`;
            }
          }

          if (isValid && dbProdiList.length > 0) {
            const fInput = row.fakultas ? row.fakultas.toString().trim() : '';
            const pInput = row.prodi ? row.prodi.toString().trim() : '';
            
            // Coba pencocokan persis (case-insensitive)
            let match = dbProdiList.find(p => p.fakultas.toLowerCase() === fInput.toLowerCase() && p.prodi.toLowerCase() === pInput.toLowerCase());
            
            // Jika tidak ada pencocokan persis, coba fuzzy matching (auto-correct)
            if (!match && fInput && pInput) {
              let bestMatch = null;
              let lowestScore = Infinity;
              
              for (const p of dbProdiList) {
                const fScore = levenshteinDistance(fInput.toLowerCase(), p.fakultas.toLowerCase());
                const pScore = levenshteinDistance(pInput.toLowerCase(), p.prodi.toLowerCase());
                
                // Izinkan maksimal 4 karakter typo di gabungan fakultas dan prodi
                if (fScore <= 3 && pScore <= 3) {
                  const totalScore = fScore + pScore;
                  if (totalScore < lowestScore && totalScore <= 4) {
                    lowestScore = totalScore;
                    bestMatch = p;
                  }
                }
              }
              
              if (bestMatch) {
                match = bestMatch;
                // Lakukan auto-correct pada data baris (memperbaiki typo)
                row.fakultas = bestMatch.fakultas;
                row.prodi = bestMatch.prodi;
              }
            }
            
            if (!match) {
              isValid = false;
              reason = 'Fakultas/Prodi tidak valid';
            }
          }
          let formattedDate = row.tanggal_yudisium ? row.tanggal_yudisium.toString().trim() : null;

          let formattedIpk = row.ipk;
          if (formattedIpk !== undefined && formattedIpk !== null && formattedIpk !== '') {
            let ipkStr = formattedIpk.toString().trim().replace(',', '.');
            const ipkNum = parseFloat(ipkStr);
            if (!isNaN(ipkNum)) {
              formattedIpk = ipkNum.toFixed(2);
            } else {
              formattedIpk = ipkStr;
            }
          }

          return { ...row, tanggal_yudisium: formattedDate, ipk: formattedIpk, _isValid: isValid, _reason: reason };
        });

        setPreviewData(processedData);
      } catch (err) {
        console.error("Error parsing excel:", err);
        setStatus({ type: "error", message: "Gagal membaca file Excel. Pastikan formatnya benar." });
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleSubmit = async () => {
    const validData = previewData.filter(row => row._isValid !== false);
    
    if (validData.length === 0) {
      setStatus({ type: "error", message: "Tidak ada data yang valid untuk diimpor. Silakan periksa kembali file Anda." });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const plainData = JSON.parse(JSON.stringify(validData));
      const res = await importWisudawanBatch(plainData);

      if (res.success) {
        setIsOpen(false);
        if (res.failedRows && res.failedRows.length > 0) {
          setResultData({
            type: "warning",
            title: `Berhasil mengimpor ${res.count} data`,
            message: `Terdapat ${res.failedRows.length} data ditolak/dilewati.`,
            failedData: res.failedRows
          });
        } else {
          setResultData({
            type: "success",
            title: "Selesai!",
            message: `Berhasil mengimpor ${res.count} data wisudawan!`
          });
          setTimeout(() => {
            setResultData(null);
          }, 5000);
        }
        setTimeout(resetForm, 300);
      } else {
        setIsOpen(false);
        setResultData({ type: "error", title: "Gagal Mengimpor", message: res.error || "Gagal mengimpor data." });
        setTimeout(resetForm, 300);
      }
    } catch (err: any) {
      setStatus({ type: "error", message: err.message || "Terjadi kesalahan." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center justify-center gap-1.5 px-3 sm:px-4 h-8 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-normal sm:font-semibold transition-colors-emerald-900/20 whitespace-nowrap"
      >
        <Plus size={16} />
        <span className="hidden sm:inline">Tambah</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-4xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)] shrink-0">
              <div>
                <h2 className="text-xl font-bold text-[var(--color-text)]">Import Batch Wisudawan</h2>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                  Unggah file Excel untuk mendaftarkan wisudawan massal.
                  <br />
                  <span className="font-semibold text-rose-500 dark:text-rose-400">Penting: Kolom IPK wajib diisi dan harus menggunakan pemisah titik (contoh: 3.72 atau 4.00).</span>
                </p>
              </div>
              <button
                onClick={handleClose}
                disabled={loading}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors p-1 rounded-lg hover:bg-[var(--color-bg-secondary)] disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              {userRole === 'admin_unit' && (
                <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800/50 rounded-xl p-4 flex items-start gap-3 text-sky-800 dark:text-sky-300">
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold mb-1">Pemberitahuan Hak Akses</p>
                    <p>Anda login sebagai Admin Unit. Anda <strong>hanya dapat mengunggah</strong> data mahasiswa untuk Fakultas/Unit: <strong>{unitKerja || 'Belum diatur'}</strong>.</p>
                  </div>
                </div>
              )}

              {status && (
                <div className={`p-4 rounded-xl flex items-start gap-3 text-sm font-medium ${status.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                    : status.type === 'warning'
                      ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50'
                      : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50'
                  }`}>
                  <div className="mt-0.5">
                    {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p>{status.message}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="font-semibold text-[var(--color-text)]">Upload File Excel</h3>
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg)] text-sm font-semibold transition-colors"
                >
                  <Download size={16} />
                  Download Template
                </button>
              </div>

              {!file ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-[var(--color-border)] hover:border-emerald-500/50 bg-[var(--color-bg)] rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
                    <UploadCloud size={28} />
                  </div>
                  <h4 className="text-base font-bold text-[var(--color-text)] mb-1">Klik atau Drag & Drop file disini</h4>
                  <p className="text-xs text-[var(--color-text-muted)] max-w-sm mx-auto">
                    Mendukung format .xlsx dan .xls. Pastikan kolom sesuai dengan template standar.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl flex items-center gap-3 w-full">
                  <FileSpreadsheet size={28} className="text-emerald-500 shrink-0" />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold text-[var(--color-text)] truncate">{file.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    onClick={resetForm}
                    disabled={loading}
                    className="p-2 text-[var(--color-text-muted)] hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors disabled:opacity-50"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}

              {previewData.length > 0 && (
                <div className="border border-[var(--color-border)] rounded-xl overflow-hidden flex flex-col">
                  <div className="p-3 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-[var(--color-text)]">Preview Data ({previewData.length} baris)</h3>
                    <div className="flex flex-wrap gap-3 text-xs font-medium">
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={14} /> {previewData.filter(r => r._isValid !== false).length} Siap Diunggah
                      </span>
                      {previewData.filter(r => r._isValid === false).length > 0 && (
                        <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                          <AlertCircle size={14} /> {previewData.filter(r => r._isValid === false).length} Ditolak/Dilewati
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="overflow-x-auto max-h-[300px]">
                    <table className="w-full text-xs text-left whitespace-nowrap">
                      <thead className="bg-[var(--color-bg)] border-b border-[var(--color-border)] sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">NIM</th>
                          <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">Nama</th>
                          <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">IPK</th>
                          <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">Fakultas</th>
                          <th className="px-4 py-3 font-medium text-[var(--color-text-muted)]">Prodi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border)]">
                        {previewData.map((row, idx) => (
                          <tr key={idx} className={`transition-colors ${row._isValid === false ? 'bg-rose-50 dark:bg-rose-900/10' : 'hover:bg-[var(--color-bg-secondary)]'}`}>
                            <td className={`px-4 py-2 font-mono ${row._isValid === false ? 'text-rose-500 line-through opacity-50' : ''}`}>{row.nim}</td>
                            <td className={`px-4 py-2 font-medium ${row._isValid === false ? 'text-rose-500 line-through opacity-50' : ''}`}>{row.nama_mahasiswa}</td>
                            <td className={`px-4 py-2 text-[var(--color-text-muted)] ${row._isValid === false ? 'opacity-50' : ''}`}>{row.ipk}</td>
                            <td className="px-4 py-2 text-[var(--color-text-muted)]">
                              <span className={row._isValid === false ? 'text-rose-500 font-semibold' : ''}>{row.fakultas}</span>
                              {row._isValid === false && <span className="block text-xs text-rose-500 font-bold mt-0.5">{row._reason}</span>}
                            </td>
                            <td className={`px-4 py-2 text-[var(--color-text-muted)] ${row._isValid === false ? 'opacity-50' : ''}`}>{row.prodi}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-[var(--color-border)] flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={handleClose}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] text-sm font-semibold transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || previewData.length === 0 || previewData.every(row => row._isValid === false)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold transition-all-emerald-900/20"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                {loading ? "Menyimpan Data..." : "Simpan Data"}
              </button>
            </div>
          </div>
        </div>
      )}

      {resultData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-md p-6 rounded-2xl border flex flex-col gap-4 animate-in zoom-in-95 duration-200 ${resultData.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-900/95 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : resultData.type === 'warning'
                ? 'bg-amber-50 dark:bg-amber-900/95 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                : 'bg-rose-50 dark:bg-rose-900/95 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
            }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {resultData.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                </div>
                <div>
                  <h4 className="font-bold text-base">{resultData.title}</h4>
                  <p className="text-sm opacity-90 mt-1">{resultData.message}</p>
                </div>
              </div>
              <button
                onClick={() => setResultData(null)}
                className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {resultData.failedData && resultData.failedData.length > 0 && (
              <div className="mt-2 flex flex-col gap-1 max-h-60 overflow-y-auto bg-white/60 dark:bg-black/40 p-3 rounded-xl border border-black/5 dark:border-white/10 text-xs font-mono">
                {resultData.failedData.map((fd: any, i: number) => (
                  <div key={i} className="flex gap-2 py-1 border-b border-black/5 dark:border-white/5 last:border-0">
                    <span className="font-bold w-20 shrink-0">{fd.nim}</span>
                    <span className="truncate flex-1 opacity-90">{fd.nama}</span>
                    <span className="shrink-0 text-amber-600 dark:text-amber-400">({fd.reason})</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-2">
              <button
                onClick={() => setResultData(null)}
                className="px-5 py-2.5 rounded-xl bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 text-sm font-semibold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
