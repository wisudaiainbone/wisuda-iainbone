"use client";

import { useState, useTransition } from "react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { deleteProdi } from "@/actions/prodi";

interface Props {
  id: number;
  prodiName: string;
}

export default function DeleteProdiButton({ id, prodiName }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteProdi(id);
      setIsOpen(false);
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        title="Hapus Prodi"
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
      >
        <Trash2 size={14} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !isPending && setIsOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-500 mb-4">
              <AlertTriangle size={24} />
            </div>
            
            <h3 className="text-lg font-bold font-[var(--font-outfit)] text-[var(--color-text)] mb-2">
              Hapus Data Prodi?
            </h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-6">
              Anda yakin ingin menghapus prodi <span className="font-bold text-[var(--color-text)]">"{prodiName}"</span>? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex w-full gap-3">
              <button
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text)] transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-rose-500 hover:bg-rose-600 active:scale-95 text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPending ? <Loader2 size={16} className="animate-spin" /> : "Hapus Data"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
