"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Hash, X, Loader2, CheckCircle2, AlertTriangle, ChevronDown, ChevronRight,
  GraduationCap, Layers, BookOpen
} from "lucide-react";
import { generateNomorUndangan, type GenerateNomorResult } from "@/actions/nomorUndangan";
import { getFakultasData } from "@/lib/fakultas";

type Phase = "confirm" | "loading" | "result" | "error";

export default function NomorDialog() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("confirm");
  const [result, setResult] = useState<GenerateNomorResult | null>(null);
  const [expandedFakultas, setExpandedFakultas] = useState<Set<string>>(new Set());

  const handleOpen = () => {
    setOpen(true);
    setPhase("confirm");
    setResult(null);
    setExpandedFakultas(new Set());
  };

  const handleClose = () => {
    if (phase === "loading") return;
    setOpen(false);
  };

  const handleGenerate = async () => {
    setPhase("loading");
    const res = await generateNomorUndangan();
    setResult(res);
    setPhase(res.success ? "result" : "error");
    // Auto-expand semua fakultas di hasil
    if (res.success) {
      const allFak = new Set<string>();
      res.sesiResults.forEach(s => s.byFakultas.forEach(f => allFak.add(`${s.sesi}::${f.fakultas}`)));
      setExpandedFakultas(allFak);
    }
  };

  const toggleFakultas = (key: string) => {
    setExpandedFakultas(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const sesiColor = (sesi: string) =>
    sesi === "Sesi Satu"
      ? "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800/40"
      : "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/40";

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={handleOpen}
        className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-4 h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors shadow-sm shadow-amber-900/20 whitespace-nowrap"
      >
        <Hash size={16} />
        Nomor
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
              className="w-full sm:max-w-xl bg-[var(--color-bg)] rounded-t-2xl sm:rounded-2xl border border-[var(--color-border)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Hash size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-text)]">Generate Nomor & ID Undangan</h3>
                    <p className="text-[11px] text-[var(--color-text-muted)]">Wisudawan aktif · berstatus Terdaftar · sesi terisi</p>
                  </div>
                </div>
                {phase !== "loading" && (
                  <button
                    onClick={handleClose}
                    className="w-8 h-8 rounded-full bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex items-center justify-center transition-colors"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto">
                {/* === PHASE: CONFIRM === */}
                {phase === "confirm" && (
                  <div className="p-6 flex flex-col gap-4">
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4 flex gap-3">
                      <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                          Proses ini akan men-generate Nomor dan ID Undangan untuk wisudawan. Lanjutkan?
                        </p>
                        <p className="text-xs text-amber-700/70 dark:text-amber-400/70 mt-1.5 leading-relaxed">
                          Nomor lama akan <strong>direset</strong> dan digenerate ulang dari awal berdasarkan urutan: <strong>Sesi → Urutan Prodi → Tanggal Yudisium</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Syarat wisudawan yang diproses:</p>
                      {[
                        { icon: GraduationCap, label: "Status Terdaftar", color: "text-emerald-500" },
                        { icon: Layers, label: "Periode Aktif (Sedang Dibuka)", color: "text-blue-500" },
                        { icon: Hash, label: "Sesi sudah diatur (Sesi Satu / Sesi Dua)", color: "text-violet-500" },
                      ].map(({ icon: Icon, label, color }) => (
                        <div key={label} className="flex items-center gap-2.5 text-sm text-[var(--color-text)]">
                          <Icon size={15} className={color} />
                          {label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* === PHASE: LOADING === */}
                {phase === "loading" && (
                  <div className="flex flex-col items-center justify-center py-16 gap-5 px-8">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-amber-100 dark:border-amber-900/30" />
                      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-amber-500 animate-spin" />
                      <Hash size={20} className="absolute inset-0 m-auto text-amber-500" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-sm font-semibold text-[var(--color-text)]">Sedang memproses...</p>
                      <p className="text-xs text-[var(--color-text-muted)]">Mereset nomor lama, mengurutkan, dan mengisi ulang data wisudawan.</p>
                      <p className="text-xs text-[var(--color-text-subtle)] italic mt-2">Harap tunggu, jangan tutup jendela ini.</p>
                    </div>

                    {/* Skeleton untuk progress */}
                    <div className="w-full space-y-2 mt-2 max-w-sm">
                      {[60, 80, 50, 70].map((w, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                          <div className={`h-2 rounded-full bg-[var(--color-bg-secondary)] animate-pulse`} style={{ width: `${w}%`, animationDelay: `${i * 150}ms` }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* === PHASE: RESULT === */}
                {phase === "result" && result?.success && (
                  <div className="p-5 space-y-4">
                    {/* Summary */}
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-4 flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                          ✓ Berhasil! {result.totalProcessed} wisudawan telah diberi nomor urut.
                        </p>
                        <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70 mt-0.5">
                          Periode: <strong>{result.periode}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Per Sesi & Fakultas */}
                    <div className="space-y-3">
                      {result.sesiResults.map((sesi) => (
                        <div key={sesi.sesi} className="border border-[var(--color-border)] rounded-xl overflow-hidden">
                          {/* Sesi Header */}
                          <div className={`px-4 py-3 flex items-center justify-between border-b border-[var(--color-border)] ${sesiColor(sesi.sesi)}`}>
                            <div className="flex items-center gap-2">
                              <Layers size={14} />
                              <span className="font-bold text-sm">{sesi.sesi}</span>
                            </div>
                            <span className="text-xs font-bold bg-white/50 dark:bg-black/20 px-2.5 py-1 rounded-full">
                              {sesi.count} wisudawan · nomor 1 – {sesi.count}
                            </span>
                          </div>

                          {/* Per Fakultas */}
                          <div className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
                            {sesi.byFakultas.map((fak) => {
                              const key = `${sesi.sesi}::${fak.fakultas}`;
                              const isOpen = expandedFakultas.has(key);
                              const fakData = getFakultasData(fak.fakultas);

                              return (
                                <div key={fak.fakultas}>
                                  <button
                                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--color-bg-secondary)] transition-colors text-left"
                                    onClick={() => toggleFakultas(key)}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      {isOpen ? <ChevronDown size={14} className="text-[var(--color-text-muted)] shrink-0" /> : <ChevronRight size={14} className="text-[var(--color-text-muted)] shrink-0" />}
                                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${fakData.colorClass}`}>
                                        {fakData.singkatan}
                                      </span>
                                      <span className="text-xs font-semibold text-[var(--color-text)] truncate max-w-[180px]">{fak.fakultas}</span>
                                    </div>
                                    <span className="text-xs font-bold text-[var(--color-text-muted)] shrink-0">{fak.count} orang</span>
                                  </button>

                                  {isOpen && (
                                    <div className="bg-[var(--color-bg)] border-t border-[var(--color-border)]">
                                      {fak.prodis.map((prod) => (
                                        <div key={prod.prodi} className="px-10 py-2.5 flex items-center justify-between gap-3 border-b border-[var(--color-border)]/50 last:border-0">
                                          <div className="flex items-center gap-2">
                                            <BookOpen size={11} className="text-[var(--color-text-subtle)] shrink-0" />
                                            <span className="text-xs text-[var(--color-text)]">{prod.prodi}</span>
                                          </div>
                                          <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[10px] font-mono bg-[var(--color-bg-secondary)] border border-[var(--color-border)] px-1.5 py-0.5 rounded text-[var(--color-text-muted)]">
                                              #{String(prod.nomor_dari).padStart(3, '0')} – #{String(prod.nomor_sampai).padStart(3, '0')}
                                            </span>
                                            <span className="text-xs font-bold text-[var(--color-text)]">{prod.count} org</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* === PHASE: ERROR === */}
                {phase === "error" && (
                  <div className="p-6 flex flex-col items-center gap-4 text-center">
                    <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
                      <AlertTriangle size={24} className="text-rose-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--color-text)]">Proses Gagal</p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1.5 max-w-xs">{result?.error || "Terjadi kesalahan yang tidak diketahui."}</p>
                    </div>
                    <button
                      onClick={() => setPhase("confirm")}
                      className="px-4 py-2 text-sm font-semibold bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-border)] transition-colors text-[var(--color-text)]"
                    >
                      Coba Lagi
                    </button>
                  </div>
                )}
              </div>

              {/* Footer */}
              {phase !== "loading" && (
                <div className="px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-end gap-2 shrink-0">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text)] text-sm font-semibold rounded-xl hover:bg-[var(--color-border)] transition-colors"
                  >
                    {phase === "result" ? "Tutup" : "Batal"}
                  </button>
                  {phase === "confirm" && (
                    <button
                      onClick={handleGenerate}
                      className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
                    >
                      <Hash size={14} />
                      Lanjutkan
                    </button>
                  )}
                  {phase === "result" && (
                    <button
                      onClick={() => { setPhase("confirm"); setResult(null); }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
                    >
                      <Hash size={14} />
                      Generate Ulang
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
