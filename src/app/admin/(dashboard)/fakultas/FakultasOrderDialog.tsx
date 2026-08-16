"use client";

import { useState, useTransition, useEffect } from "react";
import { X, GripVertical, Loader2, ListOrdered, Save } from "lucide-react";
import type { ProdiItem } from "@/actions/prodi";
import { updateProdiOrder } from "@/actions/prodi";
import { useToast } from "@/components/ui/Toast";

interface Props {
  prodiList: ProdiItem[];
}

export default function FakultasOrderDialog({ prodiList }: Props) {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [sesiSatu, setSesiSatu] = useState<string[]>([]);
  const [sesiDua, setSesiDua] = useState<string[]>([]);
  const [tanpaSesi, setTanpaSesi] = useState<string[]>([]);

  // Local drag state
  const [draggedItem, setDraggedItem] = useState<{ list: "satu" | "dua" | "tanpa"; index: number } | null>(null);

  useEffect(() => {
    if (open) {
      // Kelompokkan fakultas ke masing-masing sesi saat dibuka
      const s1 = new Set<string>();
      const s2 = new Set<string>();
      const st = new Set<string>();

      prodiList.forEach((p) => {
        if (!p.fakultas) return;
        if (p.sesi === "Sesi Satu") s1.add(p.fakultas);
        else if (p.sesi === "Sesi Dua") s2.add(p.fakultas);
        else st.add(p.fakultas);
      });

      setSesiSatu(Array.from(s1));
      setSesiDua(Array.from(s2));
      setTanpaSesi(Array.from(st));
    }
  }, [open, prodiList]);

  const handleDragStart = (e: React.DragEvent, list: "satu" | "dua" | "tanpa", index: number) => {
    setDraggedItem({ list, index });
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", `${list}-${index}`);
    }
  };

  const handleDragOver = (e: React.DragEvent, targetList: "satu" | "dua" | "tanpa", index: number) => {
    e.preventDefault();
    if (!draggedItem) return;
    if (draggedItem.list !== targetList) return; // Hanya izinkan reorder di dalam sesi yang sama
    if (draggedItem.index === index) return;

    const setListFn = targetList === "satu" ? setSesiSatu : targetList === "dua" ? setSesiDua : setTanpaSesi;
    const currentList = targetList === "satu" ? sesiSatu : targetList === "dua" ? sesiDua : tanpaSesi;

    const newArr = [...currentList];
    const item = newArr[draggedItem.index];
    newArr.splice(draggedItem.index, 1);
    newArr.splice(index, 0, item);

    setListFn(newArr);
    setDraggedItem({ list: targetList, index });
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleSave = () => {
    startTransition(async () => {
      // 1. Kumpulkan prodi berdasarkan Fakultas
      const fakMap = new Map<string, ProdiItem[]>();
      prodiList.forEach(p => {
        if (!p.fakultas) return;
        if (!fakMap.has(p.fakultas)) fakMap.set(p.fakultas, []);
        fakMap.get(p.fakultas)!.push(p);
      });

      // 2. Susun ulang ID berdasarkan urutan Fakultas
      const newOrderedIds: number[] = [];
      const pushFakultas = (fakList: string[]) => {
        fakList.forEach(fak => {
          const prodis = fakMap.get(fak) || [];
          prodis.forEach(p => newOrderedIds.push(p.id));
        });
      };

      pushFakultas(sesiSatu);
      pushFakultas(sesiDua);
      pushFakultas(tanpaSesi);

      // 3. Panggil API update
      const result = await updateProdiOrder(newOrderedIds);
      if (result.success) {
        showToast("✓ Urutan fakultas berhasil disimpan!", "success");
        setOpen(false);
      } else {
        showToast(result.error || "Gagal menyimpan urutan.", "error");
      }
    });
  };

  const renderDraggableList = (title: string, colorClass: string, items: string[], listType: "satu" | "dua" | "tanpa") => {
    if (items.length === 0) return null;
    return (
      <div className="flex flex-col gap-2">
        <h4 className={`text-xs font-bold uppercase tracking-wider ${colorClass}`}>{title}</h4>
        <div className="flex flex-col gap-1.5">
          {items.map((fak, i) => (
            <div
              key={fak}
              draggable
              onDragStart={(e) => handleDragStart(e, listType, i)}
              onDragOver={(e) => handleDragOver(e, listType, i)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] cursor-grab active:cursor-grabbing hover:border-[var(--color-border-hover)] transition-colors ${
                draggedItem?.list === listType && draggedItem.index === i ? "opacity-50 bg-[var(--color-bg-secondary)]" : ""
              }`}
            >
              <GripVertical size={16} className="text-[var(--color-text-subtle)]" />
              <span className="text-sm font-semibold text-[var(--color-text)]">{fak}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Urutkan Fakultas per Sesi"
        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full w-12 h-12 md:w-14 md:h-14 flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] shadow-indigo-600/30 transition-transform hover:scale-105 active:scale-95"
      >
        <ListOrdered size={24} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in"
            onClick={() => !isPending && setOpen(false)}
          />
          <div className="relative bg-[var(--color-bg)] w-full max-w-lg rounded-2xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-200 max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <ListOrdered size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[var(--color-text)]">Urutkan Fakultas</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">Geser untuk mengatur urutan per sesi.</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="w-8 h-8 rounded-full bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex items-center justify-center transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto flex flex-col gap-6 bg-[var(--color-bg)]">
              {renderDraggableList("Sesi Satu", "text-teal-600 dark:text-teal-400", sesiSatu, "satu")}
              {renderDraggableList("Sesi Dua", "text-violet-600 dark:text-violet-400", sesiDua, "dua")}
              {renderDraggableList("Tanpa Sesi", "text-slate-500", tanpaSesi, "tanpa")}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="px-4 py-2 h-10 rounded-xl text-sm font-semibold text-[var(--color-text)] bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border)] transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="flex items-center gap-2 px-6 py-2 h-10 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Simpan Urutan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
