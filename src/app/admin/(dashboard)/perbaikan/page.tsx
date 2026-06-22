"use client";

import { useState, useEffect, useCallback } from "react";
import { getAllPerbaikan, updateStatusPerbaikan, type Perbaikan, type PerbaikanStatus } from "@/actions/perbaikan";
import {
  FileEdit, Check, X, Filter, Loader2, ChevronDown,
  MessageSquare, Calendar, Search, AlertCircle, CheckCircle2, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  proses: {
    label: "Proses",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800/50",
    icon: <Clock size={12} />,
  },
  diterima: {
    label: "Diterima",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-800/50",
    icon: <CheckCircle2 size={12} />,
  },
  ditolak: {
    label: "Ditolak",
    color: "text-rose-700 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-900/20",
    border: "border-rose-200 dark:border-rose-800/50",
    icon: <X size={12} />,
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.proses;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function fDT(s: string) {
  return new Date(s).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

export default function AdminPerbaikanPage() {
  const [data, setData] = useState<Perbaikan[]>([]);
  const [filtered, setFiltered] = useState<Perbaikan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<PerbaikanStatus | "semua">("semua");
  const [search, setSearch] = useState("");

  // Modal state (Detail & Action)
  const [detailModal, setDetailModal] = useState<{
    open: boolean;
    item: Perbaikan | null;
  }>({ open: false, item: null });
  const [catatan, setCatatan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const result = await getAllPerbaikan(statusFilter);
    setData(result);
    setIsLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(data);
    } else {
      const q = search.toLowerCase();
      setFiltered(data.filter(d =>
        d.nim.toLowerCase().includes(q) ||
        (d.wisudawan?.nama_mahasiswa || "").toLowerCase().includes(q) ||
        d.detail_perbaikan.toLowerCase().includes(q)
      ));
    }
  }, [data, search]);

  const handleAction = async (action: "diterima" | "ditolak") => {
    if (!detailModal.item) return;
    setIsSubmitting(true);
    const res = await updateStatusPerbaikan(detailModal.item.id, action, catatan);
    setIsSubmitting(false);

    if (res.success) {
      showToast(`✓ Pengajuan berhasil di${action === "diterima" ? "terima" : "tolak"}.`);
      setDetailModal({ open: false, item: null });
      setCatatan("");
      await loadData();
    } else {
      showToast(res.error || "Gagal memproses.", "error");
    }
  };

  const counts = {
    semua: data.length,
    proses: data.filter(d => d.status === "proses").length,
    diterima: data.filter(d => d.status === "diterima").length,
    ditolak: data.filter(d => d.status === "ditolak").length,
  };

  return (
    <div className="w-full space-y-6 pb-12">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-bold ${toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
              }`}
          >
            {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Status tabs */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {(["semua", "proses", "diterima", "ditolak"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`shrink-0 px-3 h-8 rounded-full text-xs font-semibold border transition-all ${statusFilter === s
                ? s === "proses" ? "bg-blue-600 text-white border-blue-600"
                  : s === "diterima" ? "bg-emerald-600 text-white border-emerald-600"
                    : s === "ditolak" ? "bg-rose-600 text-white border-rose-600"
                      : "bg-[var(--color-text)] text-[var(--color-bg)] border-[var(--color-text)]"
                : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-subtle)] hover:text-[var(--color-text)]"
                }`}
            >
              {s === "semua" ? "Semua" : STATUS_CONFIG[s]?.label}
              <span className="ml-1.5 opacity-70">({counts[s]})</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64 ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari NIM atau nama..."
            className="w-full pl-8 pr-3 h-9 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-emerald-500" size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center">
            <FileEdit size={28} className="text-[var(--color-text-muted)]" />
          </div>
          <div>
            <p className="font-bold text-[var(--color-text)]">Tidak ada pengajuan</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">Belum ada pengajuan perbaikan data dari wisudawan.</p>
          </div>
        </div>
      ) : (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
          <div className="divide-y divide-[var(--color-border)]">
            {filtered.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => {
                  setDetailModal({ open: true, item });
                  setCatatan(item.status === "proses" ? "Data telah diperbaiki sesuai pengajuan." : "");
                }}
                className="group px-4 py-3 sm:px-5 sm:py-4 hover:bg-[var(--color-bg-secondary)] transition-colors flex items-center gap-4 cursor-pointer"
              >
                {/* Avatar */}
                <div className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                  {(item.wisudawan?.nama_mahasiswa || item.nim).charAt(0).toUpperCase()}
                </div>

                {/* Info Text (Email Style) */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`font-bold text-sm truncate ${item.status === "proses" ? "text-[var(--color-text)]" : "text-[var(--color-text-subtle)]"}`}>
                      {item.wisudawan?.nama_mahasiswa || "—"}
                    </p>
                    <span className="text-[10px] text-[var(--color-text-muted)] font-mono hidden sm:inline-block">({item.nim})</span>
                  </div>
                  <p className={`text-xs truncate ${item.status === "proses" ? "text-[var(--color-text-muted)] font-medium" : "text-[var(--color-text-subtle)]"}`}>
                    {item.detail_perbaikan}
                  </p>
                </div>

                {/* Status & Date */}
                <div className="shrink-0 flex flex-col items-end gap-1.5 ml-2">
                  <StatusBadge status={item.status} />
                  <span className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1">
                    <Calendar size={10} />
                    <span className="hidden sm:inline">{fDT(item.created_at)}</span>
                    <span className="sm:hidden">{new Date(item.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}</span>
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {detailModal.open && detailModal.item && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
            onClick={() => { setDetailModal({ open: false, item: null }); setCatatan(""); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.97 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full sm:max-w-xl bg-[var(--color-bg)] rounded-t-2xl sm:rounded-2xl border border-[var(--color-border)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Modal */}
              <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                    {(detailModal.item.wisudawan?.nama_mahasiswa || detailModal.item.nim).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[var(--color-text)] truncate">
                      {detailModal.item.wisudawan?.nama_mahasiswa || "—"}
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)] font-mono truncate">
                      {detailModal.item.nim} • {detailModal.item.wisudawan?.prodi || "—"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setDetailModal({ open: false, item: null }); setCatatan(""); }}
                  className="shrink-0 w-8 h-8 rounded-full bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex items-center justify-center transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body Modal */}
              <div className="p-6 overflow-y-auto flex flex-col gap-6">
                
                {/* Status & Waktu */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]">
                  <div>
                    <p className="text-[10px] font-bold text-[var(--color-text-subtle)] uppercase tracking-wider mb-1.5">Status Pengajuan</p>
                    <StatusBadge status={detailModal.item.status} />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-[var(--color-text-subtle)] uppercase tracking-wider mb-1.5">Waktu Pengajuan</p>
                    <p className="text-xs text-[var(--color-text)] font-medium flex items-center gap-1.5">
                      <Clock size={12} className="text-[var(--color-text-muted)]" />
                      {fDT(detailModal.item.created_at)}
                    </p>
                  </div>
                </div>

                {/* Detail Pengajuan */}
                <div>
                  <h4 className="text-xs font-bold text-[var(--color-text-subtle)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <MessageSquare size={14} /> Detail Perbaikan
                  </h4>
                  <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
                    <p className="text-[13px] text-[var(--color-text)] leading-relaxed whitespace-pre-wrap">
                      {detailModal.item.detail_perbaikan}
                    </p>
                  </div>
                </div>

                {/* Catatan Admin Area */}
                {detailModal.item.status === "proses" ? (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-[var(--color-text)] flex items-center gap-1.5">
                      <FileEdit size={14} className="text-amber-500" />
                      Catatan Admin <span className="text-[var(--color-text-muted)] font-normal">(opsional)</span>
                    </label>
                    <textarea
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      placeholder="Tulis alasan jika ditolak, atau pesan konfirmasi jika diterima..."
                      rows={3}
                      className="w-full px-4 py-3 text-[13px] bg-[var(--color-surface)] border border-amber-500/30 focus:border-amber-500/60 rounded-xl text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none transition-all"
                    />
                  </div>
                ) : detailModal.item.catatan_admin ? (
                  <div>
                    <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FileEdit size={14} /> Catatan Admin
                    </h4>
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-800/30 rounded-xl">
                      <p className="text-[13px] text-amber-900 dark:text-amber-200 leading-relaxed whitespace-pre-wrap">
                        {detailModal.item.catatan_admin}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Footer Modal / Actions */}
              <div className="px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface)] sticky bottom-0 z-10 flex items-center justify-end gap-2">
                {detailModal.item.status === "proses" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleAction("ditolak")}
                      disabled={isSubmitting}
                      className="px-5 py-2.5 bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 dark:text-rose-400 text-sm font-bold rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <X size={16} /> Tolak Pengajuan
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction("diterima")}
                      disabled={isSubmitting}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      Terima Pengajuan
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setDetailModal({ open: false, item: null }); setCatatan(""); }}
                    className="px-5 py-2.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-border)] text-sm font-bold rounded-xl transition-colors"
                  >
                    Tutup
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
