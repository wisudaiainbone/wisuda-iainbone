"use client";

import { useState, useCallback } from "react";
import {
  Archive,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Download,
  BarChart3,
  Users,
} from "lucide-react";
import {
  getArsipWisudawan,
  migrasiChunkKeGSheets,
  migrasiStatistikKeGSheets,
} from "@/actions/arsip";
import {
  ARSIP_HEADERS,
  mapRowToColumns,
  type ArsipWisudawan,
} from "@/lib/arsipUtils";
import { useToast } from "@/components/ui/Toast";

const CHUNK_SIZE = 200;

type Phase = "idle" | "confirm" | "migrating" | "done" | "error";

type MigrasiStep = {
  label: string;
  status: "pending" | "loading" | "done" | "error";
  detail?: string;
};

type Props = {
  periodeId: string;
  namaPeriode: string;
};

export default function ArchivePeriodeButton({ periodeId, namaPeriode }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [steps, setSteps] = useState<MigrasiStep[]>([]);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [totalWisudawan, setTotalWisudawan] = useState(0);
  const { showToast } = useToast();

  const sanitizeSheetName = (name: string) =>
    name.replace(/[\\/:*?[\]]/g, "_").substring(0, 80);

  const match = namaPeriode.match(/Angkatan (.*?) Tahun (\d+)/);
  const sheetNameWisudawan = match
    ? `${match[2]}-${match[1]}`
    : sanitizeSheetName(`${namaPeriode}`);
  const sheetNameStatistik = "Statistik";

  const updateStep = (index: number, patch: Partial<MigrasiStep>) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s))
    );
  };

  const runMigrasi = useCallback(async () => {
    setPhase("migrating");
    const initialSteps: MigrasiStep[] = [
      { label: "Mengambil data wisudawan dari database...", status: "loading" },
      { label: `Migrasi Tab Wisudawan ke Google Sheets`, status: "pending" },
      { label: `Migrasi Tab Statistik ke Google Sheets`, status: "pending" },
      { label: "Menyiapkan unduhan XLSX arsip lokal...", status: "pending" },
    ];
    setSteps(initialSteps);
    setProgress(5);
    setSheetUrl(null);
    setErrorMsg("");

    try {
      // STEP 0: Ambil data wisudawan
      const wisudawanData = await getArsipWisudawan(namaPeriode);
      setTotalWisudawan(wisudawanData.length);
      updateStep(0, { status: "done", detail: `${wisudawanData.length} data ditemukan` });
      setProgress(15);

      // STEP 1: Migrasi Tab Wisudawan (chunked)
      updateStep(1, { status: "loading" });
      const totalChunks = Math.ceil((wisudawanData.length + 1) / CHUNK_SIZE);
      let finalSheetUrl: string | null = null;
      let chunksDone = 0;

      // Kirim header dulu (overwrite: true)
      setProgressLabel("Mengirim header ke Google Sheets...");
      const headerResult = await migrasiChunkKeGSheets({
        sheetName: sheetNameWisudawan,
        rows: [ARSIP_HEADERS],
        overwrite: true,
      });
      if (!headerResult.success) throw new Error(headerResult.error);
      if (headerResult.sheetUrl) finalSheetUrl = headerResult.sheetUrl;
      chunksDone++;
      setProgress(15 + Math.round((chunksDone / (totalChunks + 1)) * 40));

      // Kirim data per chunk
      for (let i = 0; i < wisudawanData.length; i += CHUNK_SIZE) {
        const chunk = wisudawanData.slice(i, i + CHUNK_SIZE);
        const rows = chunk.map((w: ArsipWisudawan) => mapRowToColumns(w));
        const from = i + 1;
        const to = Math.min(i + CHUNK_SIZE, wisudawanData.length);
        setProgressLabel(`Mengirim baris ${from}–${to} dari ${wisudawanData.length}...`);

        const result = await migrasiChunkKeGSheets({
          sheetName: sheetNameWisudawan,
          rows,
          overwrite: false,
        });
        if (!result.success) throw new Error(result.error);
        if (result.sheetUrl) finalSheetUrl = result.sheetUrl;
        chunksDone++;
        setProgress(15 + Math.round((chunksDone / (totalChunks + 1)) * 40));
      }

      updateStep(1, {
        status: "done",
        detail: `${wisudawanData.length} baris → tab "${sheetNameWisudawan}"`,
      });
      setProgress(55);

      // STEP 2: Migrasi Tab Statistik
      updateStep(2, { status: "loading" });
      setProgressLabel("Menghitung dan mengirim statistik...");
      const statResult = await migrasiStatistikKeGSheets({
        sheetName: sheetNameStatistik,
        namaPeriode,
      });
      if (!statResult.success) throw new Error(statResult.error);
      if (statResult.sheetUrl) finalSheetUrl = statResult.sheetUrl;
      updateStep(2, {
        status: "done",
        detail: `Statistik → tab "${sheetNameStatistik}"`,
      });
      setProgress(75);
      if (finalSheetUrl) setSheetUrl(finalSheetUrl);

      // STEP 3: Download XLSX lokal
      updateStep(3, { status: "loading" });
      setProgressLabel("Membuat file XLSX arsip...");
      await downloadArsipXlsx(wisudawanData, namaPeriode);
      updateStep(3, { status: "done", detail: "File XLSX berhasil diunduh" });
      setProgress(100);
      setProgressLabel("Selesai!");
      setPhase("done");
      showToast("Migrasi arsip berhasil diselesaikan!", "success");
    } catch (err: any) {
      setErrorMsg(err.message ?? "Terjadi kesalahan tidak diketahui");
      setSteps((prev) =>
        prev.map((s) => (s.status === "loading" ? { ...s, status: "error" } : s))
      );
      setPhase("error");
    }
  }, [namaPeriode, sheetNameWisudawan, sheetNameStatistik, showToast]);

  const handleDownloadUlang = useCallback(async () => {
    try {
      showToast("Mengunduh ulang data arsip...", "info");
      const wisudawanData = await getArsipWisudawan(namaPeriode);
      await downloadArsipXlsx(wisudawanData, namaPeriode);
      showToast("File XLSX berhasil diunduh!", "success");
    } catch {
      showToast("Gagal mengunduh file XLSX", "error");
    }
  }, [namaPeriode, showToast]);

  return (
    <>
      {/* Tombol Arsip */}
      <button
        onClick={() => setPhase("confirm")}
        title="Migrasi Arsip ke Google Sheets"
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 dark:text-amber-400 font-medium transition-colors"
      >
        <Archive size={14} />
      </button>

      {/* Modal Dialog */}
      {phase !== "idle" && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              if (["confirm", "done", "error"].includes(phase)) setPhase("idle");
            }}
          />
          <div className="relative z-10 w-full max-w-lg bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--color-border)] bg-amber-50/50 dark:bg-amber-900/10">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <Archive size={20} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-[var(--color-text)] text-base leading-tight">
                  Migrasi Arsip Periode
                </h2>
                <p className="text-xs text-[var(--color-text-muted)] truncate mt-0.5">
                  {namaPeriode}
                </p>
              </div>
              {["confirm", "done", "error"].includes(phase) && (
                <button
                  onClick={() => setPhase("idle")}
                  className="p-1.5 rounded-lg hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* ── CONFIRM ── */}
              {phase === "confirm" && (
                <>
                  <p className="text-sm text-[var(--color-text)] text-left">
                    Proses ini akan migrasi data ke{" "}
                    <strong>Google Sheets</strong> dan membuat{" "}
                    <strong>unduhan arsip XLSX</strong>:
                  </p>
                  <div className="space-y-2">
                    {[
                      { icon: <Users size={15} className="text-blue-500" />, label: "Tab Wisudawan", desc: "Seluruh data wisudawan (36 kolom, tanpa password)", bg: "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50" },
                      { icon: <BarChart3 size={15} className="text-purple-500" />, label: "Tab Statistik", desc: "Ringkasan lengkap statistik periode", bg: "bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800/50" },
                      { icon: <Download size={15} className="text-emerald-500" />, label: "Unduhan Lokal", desc: "File XLSX arsip diunduh otomatis ke komputer Anda", bg: "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50" },
                    ].map((item) => (
                      <div key={item.label} className={`flex items-start gap-3 p-3 rounded-xl border ${item.bg}`}>
                        <div className="mt-0.5 shrink-0">{item.icon}</div>
                        <div className="text-left min-w-0">
                          <p className="text-sm font-semibold text-[var(--color-text)]">{item.label}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50">
                    <p className="text-xs text-amber-700 dark:text-amber-400 text-left">
                      ⚠️ Tab di Google Sheets akan ditimpa jika sudah ada. Pastikan{" "}
                      <code className="font-mono">SPREADSHEET_ID</code> sudah dikonfigurasi di Google Apps Script.
                    </p>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => setPhase("idle")}
                      className="flex-1 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      onClick={runMigrasi}
                      className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <Archive size={15} />
                      Mulai Migrasi
                    </button>
                  </div>
                </>
              )}

              {/* ── MIGRATING ── */}
              {phase === "migrating" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                      <span className="truncate pr-2">{progressLabel || "Memproses..."}</span>
                      <span className="font-semibold text-amber-600 shrink-0">{progress}%</span>
                    </div>
                    <div className="h-2 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="mt-0.5 shrink-0">
                          {step.status === "pending" && <div className="w-4 h-4 rounded-full border-2 border-[var(--color-border)]" />}
                          {step.status === "loading" && <Loader2 size={16} className="animate-spin text-amber-500" />}
                          {step.status === "done" && <CheckCircle2 size={16} className="text-emerald-500" />}
                          {step.status === "error" && <AlertCircle size={16} className="text-rose-500" />}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className={`text-sm ${step.status === "pending" ? "text-[var(--color-text-muted)]" : step.status === "error" ? "text-rose-600 dark:text-rose-400" : "text-[var(--color-text)]"}`}>
                            {step.label}
                          </p>
                          {step.detail && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{step.detail}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-left text-xs text-[var(--color-text-muted)]">
                    Harap tunggu, jangan tutup halaman ini...
                  </p>
                </div>
              )}

              {/* ── DONE ── */}
              {phase === "done" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 py-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={26} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-[var(--color-text)] text-base">Migrasi Berhasil!</h3>
                      <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{totalWisudawan} wisudawan berhasil diarsipkan</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {steps.map((step, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                        <span className="text-xs text-[var(--color-text-muted)] flex-1 text-left">{step.detail || step.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2 pt-1">
                    <button onClick={handleDownloadUlang}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] text-sm font-medium text-[var(--color-text)] transition-colors">
                      <Download size={15} />
                      Unduh Ulang XLSX
                    </button>
                    <button onClick={() => setPhase("idle")}
                      className="py-2 rounded-xl text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
                      Tutup
                    </button>
                  </div>
                </div>
              )}

              {/* ── ERROR ── */}
              {phase === "error" && (
                <div className="space-y-4">
                  <div className="flex flex-col items-center py-3 gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                      <AlertCircle size={32} className="text-rose-600 dark:text-rose-400" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-bold text-[var(--color-text)] text-base">Migrasi Gagal</h3>
                      <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-mono bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 rounded-lg">{errorMsg}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setPhase("idle")}
                      className="flex-1 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-bg-secondary)] transition-colors">
                      Tutup
                    </button>
                    <button onClick={runMigrasi}
                      className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                      <Loader2 size={15} />
                      Coba Lagi
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────
// Helper: Download XLSX arsip lokal (client-side)
// ─────────────────────────────────────────────────────────
async function downloadArsipXlsx(wisudawanData: ArsipWisudawan[], namaPeriode: string) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();

  const match = namaPeriode.match(/Angkatan (.*?) Tahun (\d+)/);
  const sheetNameWisudawan = match
    ? `${match[2]}-${match[1]}`
    : namaPeriode.replace(/[\\/:*?[\]]/g, "_").substring(0, 80);

  const sheets = [
    { name: "Sesi Satu", data: wisudawanData.filter((w) => w.sesi === "Sesi Satu") },
    { name: "Sesi Dua", data: wisudawanData.filter((w) => w.sesi === "Sesi Dua") },
    { name: sheetNameWisudawan, data: wisudawanData },
  ];

  for (const { name, data } of sheets) {
    const ws = wb.addWorksheet(name);
    ws.addRow(ARSIP_HEADERS);
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF059669" } };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    for (const w of data) {
      ws.addRow(mapRowToColumns(w));
    }
    ws.columns.forEach((col) => {
      let maxLen = 10;
      col.eachCell?.({ includeEmpty: false }, (cell) => {
        const len = String(cell.value ?? "").length;
        if (len > maxLen) maxLen = len;
      });
      col.width = Math.min(maxLen + 2, 50);
    });
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const safeNama = namaPeriode.replace(/[^a-zA-Z0-9\s]/g, "_");
  const date = new Date().toISOString().substring(0, 10);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Arsip_${safeNama}_${date}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
