"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Layers, Check, Loader2, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { setSesiByFakultas, getSesiPerFakultas } from "@/actions/sesi";
import { FAKULTAS_MAP, getFakultasData } from "@/lib/fakultas";
import { useToast } from "@/components/ui/Toast";

const SESI_OPTIONS = [
  { value: "Sesi Satu", label: "Sesi Satu" },
  { value: "Sesi Dua", label: "Sesi Dua" },
];

type FakSesi = { fakultas: string; sesi: string | null };

export default function SesiDialog() {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<FakSesi[]>([]);
  const [draft, setDraft] = useState<Record<string, string | null>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);


  const loadData = useCallback(async () => {
    setIsLoading(true);
    const result = await getSesiPerFakultas();
    const allFakultas = Object.keys(FAKULTAS_MAP);
    const merged: FakSesi[] = allFakultas.map((fak) => {
      const found = result.find((r) => r.fakultas === fak);
      return { fakultas: fak, sesi: found?.sesi ?? null };
    });
    for (const r of result) {
      if (!merged.find((m) => m.fakultas === r.fakultas)) merged.push(r);
    }
    setRows(merged);
    const initDraft: Record<string, string | null> = {};
    merged.forEach((r) => { initDraft[r.fakultas] = r.sesi; });
    setDraft(initDraft);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (open) loadData();
  }, [open, loadData]);

  const handleSelect = (fakultas: string, sesi: string) => {
    setDraft((prev) => ({
      ...prev,
      [fakultas]: prev[fakultas] === sesi ? null : sesi,
    }));
  };

  const hasChanges = rows.some((r) => draft[r.fakultas] !== r.sesi);

  const handleSave = async () => {
    setIsSaving(true);
    const toUpdate = rows.filter((r) => draft[r.fakultas] !== r.sesi);
    let errorOccured = false;

    for (const row of toUpdate) {
      const newSesi = draft[row.fakultas] ?? null;
      const res = await setSesiByFakultas(row.fakultas, newSesi);
      if (!res.success) {
        showToast(res.error || "Gagal menyimpan.", "error");
        errorOccured = true;
        break;
      }
    }

    if (!errorOccured) {
      showToast(`✓ Pengaturan sesi berhasil disimpan untuk ${toUpdate.length} fakultas.`, "success");
      setRows((prev) =>
        prev.map((r) => ({ ...r, sesi: draft[r.fakultas] ?? null }))
      );
      setOpen(false);
    }
    setIsSaving(false);
  };

  const handleClose = () => {
    setOpen(false);
    const resetDraft: Record<string, string | null> = {};
    rows.forEach((r) => { resetDraft[r.fakultas] = r.sesi; });
    setDraft(resetDraft);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-1.5 px-3 sm:px-4 h-8 sm:h-10 rounded-lg sm:rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs sm:text-sm font-normal sm:font-semibold transition-colors shadow-sm shadow-violet-900/20 whitespace-nowrap"
      >
        <Layers size={16} />
        Sesi
      </button>

      <AnimatePresence>
        {open && (
          <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.97 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="w-full sm:max-w-lg bg-[var(--color-bg)] rounded-t-2xl sm:rounded-2xl border border-[var(--color-border)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center">
                    <Layers size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-text)]">Pengaturan Sesi per Fakultas</h3>
                    <p className="text-[11px] text-[var(--color-text-muted)]">Pilih sesi untuk setiap fakultas, lalu klik Simpan.</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex items-center justify-center transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto flex flex-col gap-3">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-violet-500" size={28} />
                  </div>
                ) : (
                  rows.map((row) => {
                    const fakData = getFakultasData(row.fakultas);
                    const currentDraft = draft[row.fakultas] ?? null;
                    const isChanged = currentDraft !== row.sesi;
                    return (
                      <div
                        key={row.fakultas}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-colors ${
                          isChanged
                            ? "bg-violet-50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-800/40"
                            : "bg-[var(--color-surface)] border-[var(--color-border)]"
                        }`}
                      >
                        {/* Fakultas Info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold tracking-wider whitespace-nowrap border ${fakData.colorClass}`}>
                            {fakData.singkatan}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[var(--color-text)] truncate">{row.fakultas}</p>
                            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                              {currentDraft ? (
                                <span className={`font-medium ${isChanged ? "text-violet-600 dark:text-violet-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                                  {isChanged ? "→ " : "✓ "}{currentDraft}
                                </span>
                              ) : (
                                <span className="text-[var(--color-text-subtle)] italic">Belum diatur</span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Sesi Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          {SESI_OPTIONS.map((opt) => {
                            const isActive = currentDraft === opt.value;
                            return (
                              <button
                                key={opt.value}
                                onClick={() => handleSelect(row.fakultas, opt.value)}
                                className={`flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-semibold border transition-all ${
                                  isActive
                                    ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                                    : "bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-subtle)] hover:text-[var(--color-text)] hover:border-violet-400"
                                }`}
                              >
                                {isActive && <Check size={11} strokeWidth={3} />}
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-end gap-2">
                {hasChanges && (
                  <p className="text-[11px] text-violet-600 dark:text-violet-400 mr-auto font-medium">
                    Ada perubahan yang belum disimpan.
                  </p>
                )}
                <button
                  onClick={handleClose}
                  disabled={isSaving}
                  className="px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text)] text-sm font-semibold rounded-xl hover:bg-[var(--color-border)] transition-colors disabled:opacity-50"
                >
                  Tutup
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !hasChanges || isLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {isSaving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
