"use client";

import { useState, useTransition, useEffect } from "react";
import type { ProdiItem } from "@/actions/prodi";
import { updateProdiOrder } from "@/actions/prodi";
import ProdiTableRow from "./ProdiTableRow";
import { useToast } from "@/components/ui/Toast";
import { Save, X, Loader2, Pencil, GripVertical } from "lucide-react";
import ProdiDialog from "./ProdiDialog";
import DeleteProdiButton from "./DeleteProdiButton";

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

  const existingFakultas = Array.from(new Set(items.map(p => p.fakultas).filter(Boolean)));

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
    <div className="bg-transparent md:bg-[var(--color-surface)] md:rounded-2xl border-none md:border md:border-[var(--color-border)] shadow-none md:shadow-sm overflow-hidden flex flex-col gap-4 md:gap-0">
      {/* Sticky/Floating Save/Cancel Bar */}
      {isDirty && (
        <div className="fixed md:static bottom-20 md:bottom-auto left-0 right-0 px-4 md:px-0 z-50 pointer-events-none md:pointer-events-auto">
          <div className="pointer-events-auto bg-emerald-50 dark:bg-[#06241a]/90 backdrop-blur-md md:backdrop-blur-none border border-emerald-200 dark:border-emerald-800/50 p-4 md:p-3 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0 animate-in slide-in-from-bottom-4 md:slide-in-from-top-2 rounded-2xl md:rounded-none shadow-xl md:shadow-none">
            <div className="text-sm font-medium text-emerald-800 dark:text-emerald-300 flex items-center text-center md:text-left w-full md:w-auto justify-center md:justify-start">
              Urutan tabel telah diubah. Simpan perubahan?
            </div>
            <div className="flex items-center justify-end gap-2 w-full md:w-auto">
              <button
                onClick={handleCancel}
                disabled={isPending}
                className="flex-1 md:flex-none px-3 py-2.5 md:py-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-xl md:rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <X size={16} /> Batal
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="flex-1 md:flex-none px-4 py-2.5 md:py-1.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl md:rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-900/20 active:scale-95"
              >
                {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto hidden md:block">
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
                  existingFakultas={existingFakultas}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 md:hidden pb-24">
        {items.length === 0 ? (
          <div className="text-center text-[var(--color-text-muted)] py-8">
            Belum ada data referensi Fakultas & Prodi.
          </div>
        ) : (
          items.map((prodi, index) => (
            <div 
              key={prodi.id} 
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-3 shadow-sm flex flex-col gap-2 relative cursor-grab active:cursor-grabbing"
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center justify-center mt-1 opacity-40 hover:opacity-100 transition-opacity">
                    <GripVertical size={16} />
                    <span className="font-bold text-[10px] mt-0.5">{index + 1}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">{prodi.fakultas}</span>
                    <span className="text-sm font-bold text-[var(--color-text)] mt-0.5">{prodi.prodi}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--color-border)]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--color-text)] bg-[var(--color-bg-secondary)] px-2 py-1 rounded-md border border-[var(--color-border)] inline-block">{prodi.singkatan}</span>
                  <span className="text-xs font-bold text-[var(--color-text)] bg-[var(--color-bg-secondary)] px-2 py-1 rounded-md border border-[var(--color-border)] inline-block">{prodi.gelar}</span>
                </div>

                <div className="flex items-center gap-2">
                  {prodi.sesi && (
                    <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                      {prodi.sesi}
                    </span>
                  )}
                  <ProdiDialog
                    prodi={prodi}
                    existingFakultas={existingFakultas}
                    trigger={
                      <button
                        title="Edit Prodi"
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                    }
                  />
                  <DeleteProdiButton id={prodi.id} prodiName={prodi.prodi} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
