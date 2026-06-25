"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Search, Loader2, User, Check, X, RefreshCw, Undo2 } from "lucide-react";
import { searchWisudawanByNimAndPeriode, setPrestasiOverride, removePrestasiOverride } from "@/actions/prestasiOverrides";
import { useToast } from "@/components/ui/Toast";
import { motion, AnimatePresence } from "framer-motion";

type SwitchProps = {
  periode: string;
  tab: string;
  fakultasOrInstitut: string;
  rankIndex: number;
  isOverridden: boolean;
  currentNim?: string;
  currentName?: string;
};

export default function SwitchWisudawanButton({
  periode, tab, fakultasOrInstitut, rankIndex, isOverridden, currentNim, currentName
}: SwitchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 3) {
      setIsSearching(true);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(async () => {
        const res = await searchWisudawanByNimAndPeriode(periode, searchQuery);
        if (res.success && res.data) {
          setSearchResults(res.data);
        } else {
          setSearchResults([]);
        }
        setIsSearching(false);
      }, 500);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, periode]);

  const handleSelect = (nim: string) => {
    startTransition(async () => {
      const res = await setPrestasiOverride(periode, tab, fakultasOrInstitut, rankIndex, nim);
      if (res.success) {
        showToast("Wisudawan berhasil diganti!", "success");
        setIsOpen(false);
      } else {
        showToast(res.error || "Gagal mengganti wisudawan.", "error");
      }
    });
  };

  const handleReset = () => {
    startTransition(async () => {
      const res = await removePrestasiOverride(periode, tab, fakultasOrInstitut, rankIndex);
      if (res.success) {
        showToast("Posisi dikembalikan ke sistem otomatis.", "success");
      } else {
        showToast(res.error || "Gagal mengembalikan posisi.", "error");
      }
    });
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(true)}
          title="Ganti Wisudawan secara manual"
          className="p-1.5 rounded-lg bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          <RefreshCw size={14} />
        </button>
        {isOverridden && (
          <button
            onClick={handleReset}
            disabled={isPending}
            title="Kembalikan ke urutan otomatis sistem"
            className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800/50 text-amber-600 dark:text-amber-500 transition-colors disabled:opacity-50"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Undo2 size={14} />}
          </button>
        )}
      </div>

      {mounted && isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]"
          >
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] shrink-0">
              <h2 className="text-lg font-bold text-[var(--color-text)]">Ganti Posisi Wisudawan</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors p-1 rounded-lg hover:bg-[var(--color-bg)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              <div className="mb-4">
                <p className="text-sm text-[var(--color-text-muted)] mb-2">
                  Posisi ini saat ini ditempati oleh <span className="font-bold text-[var(--color-text)]">{currentName}</span> ({currentNim}).<br/>
                  Cari berdasarkan NIM atau Nama untuk menimpa posisi ini secara spesifik.
                </p>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    type="text"
                    placeholder="Ketik NIM atau Nama (min. 3 karakter)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:ring-2 focus:ring-emerald-500/40 outline-none transition-all"
                    autoFocus
                  />
                  {isSearching && (
                    <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 animate-spin" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {searchResults.map((w) => (
                  <button
                    key={w.nim}
                    onClick={() => handleSelect(w.nim)}
                    disabled={isPending}
                    className="w-full text-left flex items-start gap-3 p-3 rounded-xl border border-[var(--color-border)] hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <User size={18} className="text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[var(--color-text)] truncate">{w.nama_mahasiswa}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">NIM: {w.nim}</p>
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">IPK: {w.ipk}</p>
                    </div>
                    {isPending && <Loader2 size={16} className="animate-spin text-[var(--color-text-muted)]" />}
                  </button>
                ))}
                {searchQuery.length >= 3 && searchResults.length === 0 && !isSearching && (
                  <p className="text-center text-sm text-[var(--color-text-muted)] py-4">
                    Tidak ada wisudawan terdaftar yang cocok.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </>
  );
}
