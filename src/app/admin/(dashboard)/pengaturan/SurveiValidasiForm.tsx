"use client";

import { useState } from "react";
import { updateSetting, applySurveiValidation } from "@/actions/settings";
import { Loader2, CheckCircle2, ClipboardList, AlertTriangle, Zap } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

type Props = {
  initialData?: Record<string, string>;
};

type ApplyResult = {
  processed: number;
  notFound: string[];
  total: number;
};

export default function SurveiValidasiForm({ initialData }: Props) {
  const { showToast } = useToast();
  const [nimListText, setNimListText] = useState(initialData?.survei_nim_list || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [result, setResult] = useState<ApplyResult | null>(null);

  const parseNimList = (text: string): string[] => {
    return text
      .split("\n")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const res = await updateSetting("survei_nim_list", nimListText);
    if (res.success) {
      showToast("Daftar NIM survei berhasil disimpan!", "success");
    } else {
      showToast(res.error || "Gagal menyimpan.", "error");
    }
    setIsSaving(false);
  };

  const handleApply = async () => {
    const nimList = parseNimList(nimListText);
    setIsApplying(true);
    setResult(null);

    const res = await applySurveiValidation(nimList);

    if (res.success) {
      setResult({
        processed: res.processed ?? 0,
        notFound: res.notFound ?? [],
        total: res.total ?? 0,
      });
      showToast(
        `Berhasil! ${res.processed} NIM diperbarui.${(res.notFound?.length ?? 0) > 0 ? ` ${res.notFound?.length} NIM tidak ditemukan.` : ""}`,
        "success"
      );
    } else {
      showToast(res.error || "Terjadi kesalahan saat menerapkan validasi.", "error");
    }
    setIsApplying(false);
  };

  const nimCount = parseNimList(nimListText).length;

  return (
    <form onSubmit={handleSave} className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-24 sm:pb-0">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
          <h2 className="text-base font-bold text-[var(--color-text)] flex items-center gap-2">
            <ClipboardList size={18} className="text-emerald-500" />
            Validasi Survei
          </h2>
          <p className="text-xs text-[var(--color-text-subtle)] mt-1 leading-relaxed">
            Masukkan daftar NIM wisudawan yang telah mengisi survei (satu NIM per baris). Klik <strong>Terapkan ke Wisudawan</strong> untuk memperbarui data — kolom survei akan di-replace total (hanya NIM yang ada di daftar yang bernilai TRUE, sisanya dikosongkan).
          </p>
        </div>

        {/* How it works */}
        <div className="px-6 py-4 border-b border-[var(--color-border)]">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">1</div>
                <span className="text-sm font-semibold text-[var(--color-text)]">Input NIM</span>
              </div>
              <p className="text-xs text-[var(--color-text-subtle)]">Ketik atau paste NIM di area teks di bawah, satu NIM per baris.</p>
            </div>
            <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">2</div>
                <span className="text-sm font-semibold text-[var(--color-text)]">Simpan Daftar</span>
              </div>
              <p className="text-xs text-[var(--color-text-subtle)]">Simpan daftar NIM ke pengaturan agar tidak hilang saat refresh halaman.</p>
            </div>
            <div className="flex-1 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-violet-500 text-white text-xs font-bold flex items-center justify-center">3</div>
                <span className="text-sm font-semibold text-[var(--color-text)]">Terapkan</span>
              </div>
              <p className="text-xs text-[var(--color-text-subtle)]">Klik Terapkan untuk mengupdate kolom survei di database (replace total).</p>
            </div>
          </div>
        </div>

        {/* Textarea */}
        <div className="px-6 py-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-[var(--color-text)]">
              Daftar NIM
            </label>
            <span className="text-xs font-mono bg-[var(--color-bg)] border border-[var(--color-border)] px-2 py-1 rounded-lg text-[var(--color-text-muted)]">
              {nimCount} NIM
            </span>
          </div>
          <textarea
            value={nimListText}
            onChange={(e) => setNimListText(e.target.value)}
            rows={20}
            className="w-full px-4 py-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm font-mono text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all resize-y"
            placeholder={"19.01.1234\n19.01.1235\n19.01.1236"}
          />
          <p className="text-xs text-[var(--color-text-subtle)]">
            Satu NIM per baris. Baris kosong akan diabaikan secara otomatis.
          </p>
        </div>

        {/* Result Summary */}
        {result !== null && (
          <div className="px-6 pb-5">
            <div className={`rounded-xl p-4 border ${result.notFound.length > 0 ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40" : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/40"}`}>
              <div className="flex items-start gap-3">
                {result.notFound.length > 0 ? (
                  <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-bold text-[var(--color-text)] mb-1">Hasil Penerapan</p>
                  <div className="flex flex-wrap gap-4 text-xs">
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                      ✓ {result.processed} NIM berhasil diperbarui
                    </span>
                    <span className="text-[var(--color-text-subtle)]">
                      dari {result.total} total input
                    </span>
                    {result.notFound.length > 0 && (
                      <span className="text-amber-700 dark:text-amber-400 font-semibold">
                        ✗ {result.notFound.length} NIM tidak ditemukan
                      </span>
                    )}
                  </div>
                  {result.notFound.length > 0 && (
                    <details className="mt-3">
                      <summary className="text-xs text-[var(--color-text-muted)] cursor-pointer hover:text-[var(--color-text)] transition-colors">
                        Lihat NIM yang tidak ditemukan ({result.notFound.length})
                      </summary>
                      <div className="mt-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-3 font-mono text-xs text-[var(--color-text-muted)] max-h-40 overflow-y-auto">
                        {result.notFound.map((nim) => (
                          <div key={nim}>{nim}</div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="fixed sm:static bottom-20 sm:bottom-auto left-0 right-0 sm:left-auto sm:right-auto px-4 sm:px-0 z-40 flex sm:block pointer-events-none sm:pointer-events-auto sm:mt-6">
        <div className="flex w-full sm:w-auto items-center pointer-events-auto gap-3">
          <button
            type="button"
            onClick={handleApply}
            disabled={isApplying || isSaving}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 h-[42px] sm:h-auto sm:py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-70 text-white rounded-full sm:rounded-xl text-sm font-bold transition-all active:scale-95 whitespace-nowrap"
          >
            {isApplying ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Zap size={16} />
            )}
            {isApplying ? "Menerapkan..." : "Terapkan ke Wisudawan"}
          </button>

          <button
            type="submit"
            disabled={isSaving || isApplying}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 h-[42px] sm:h-auto sm:py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white rounded-full sm:rounded-xl text-sm font-bold transition-all active:scale-95 whitespace-nowrap"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            {isSaving ? "Menyimpan..." : "Simpan Daftar"}
          </button>
        </div>
      </div>
    </form>
  );
}
