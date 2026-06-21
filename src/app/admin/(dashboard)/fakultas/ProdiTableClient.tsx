"use client";

import { useState, useTransition, useEffect } from "react";
import type { ProdiItem } from "@/actions/prodi";
import { updateProdiOrder } from "@/actions/prodi";
import ProdiTableRow from "./ProdiTableRow";
import { useToast } from "@/components/ui/Toast";
import { Save, X, Loader2 } from "lucide-react";

interface Props {
  initialProdiList: ProdiItem[];
}

export default function ProdiTableClient({ initialProdiList }: Props) {
  const [items, setItems] = useState(initialProdiList);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  // Memastikan sinkronisasi jika props berubah dari server (misal: habis edit via dialog)
  useEffect(() => {
    if (!isDirty) {
      setItems(initialProdiList);
    }
  }, [initialProdiList, isDirty]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItemIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      // Workaround firefox
      e.dataTransfer.setData("text/plain", index.toString());
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null) return;
    if (draggedItemIndex === index) return;

    const newItems = [...items];
    const draggedItem = newItems[draggedItemIndex];
    newItems.splice(draggedItemIndex, 1);
    newItems.splice(index, 0, draggedItem);

    setItems(newItems);
    setDraggedItemIndex(index);
    setIsDirty(true);
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
  };

  const handleSave = () => {
    startTransition(async () => {
      const orderedIds = items.map((p) => p.id);
      const result = await updateProdiOrder(orderedIds);
      if (result.success) {
        showToast("✓ Urutan prodi berhasil disimpan!", "success");
        setIsDirty(false);
      } else {
        showToast(result.error || "Gagal menyimpan urutan.", "error");
      }
    });
  };

  const handleCancel = () => {
    setItems(initialProdiList);
    setIsDirty(false);
  };

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden flex flex-col">
      {/* Sticky Save/Cancel Bar */}
      {isDirty && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-800/30 p-3 flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="text-sm font-medium text-emerald-800 dark:text-emerald-300 px-3 flex items-center gap-2">
            Urutan tabel telah diubah. Simpan perubahan?
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="px-3 py-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg transition-colors disabled:opacity-50"
            >
              <div className="flex items-center gap-1.5">
                <X size={16} /> Batal
              </div>
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="px-4 py-1.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Simpan
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-[var(--color-bg-secondary)] text-[var(--color-text-subtle)] font-bold">
            <tr>
              <th className="px-4 py-4 w-12 text-center">Urut</th>
              <th className="px-6 py-4">Fakultas</th>
              <th className="px-6 py-4">Program Studi</th>
              <th className="px-6 py-4">Singkatan</th>
              <th className="px-6 py-4">Gelar</th>
              <th className="px-6 py-4">Sesi</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-[var(--color-text-muted)]">
                  Belum ada data referensi Fakultas & Prodi.
                </td>
              </tr>
            ) : (
              items.map((prodi, index) => (
                <ProdiTableRow 
                  key={prodi.id} 
                  prodi={prodi} 
                  index={index}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
