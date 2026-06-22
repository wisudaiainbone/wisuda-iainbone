"use client";

import { useState, useTransition } from "react";
import { X, Save, Loader2 } from "lucide-react";
import { createProdi, updateProdi, type ProdiItem } from "@/actions/prodi";

interface Props {
  trigger: React.ReactNode;
  prodi?: ProdiItem;
  existingFakultas?: string[];
}

export default function ProdiDialog({ trigger, prodi, existingFakultas = [] }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fakultas: prodi?.fakultas || "",
    prodi: prodi?.prodi || "",
    singkatan: prodi?.singkatan || "",
    gelar: prodi?.gelar || "",
    sesi: prodi?.sesi || "Sesi Satu",
    urutan: prodi?.urutan || 0,
  });

  const isEdit = !!prodi;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    startTransition(async () => {
      let result;
      if (isEdit) {
        result = await updateProdi(prodi!.id, formData);
      } else {
        result = await createProdi(formData);
      }

      if (result?.success) {
        setIsOpen(false);
        if (!isEdit) {
          // Reset form on success for create
          setFormData({ fakultas: "", prodi: "", singkatan: "", gelar: "", sesi: "Sesi Satu", urutan: 0 });
        }
      } else {
        setError(result?.error || "Terjadi kesalahan");
      }
    });
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)}>{trigger}</div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !isPending && setIsOpen(false)}
          />
          <div className="relative w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
              <h2 className="text-lg font-bold font-[var(--font-outfit)] text-[var(--color-text)]">
                {isEdit ? "Edit Prodi" : "Tambah Prodi Baru"}
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="p-1 text-[var(--color-text-muted)] hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              {error && (
                <div className="p-3 text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200 dark:border-rose-800/50">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[var(--color-text)]">Nama Fakultas</label>
                <input
                  list="fakultas-list"
                  type="text"
                  required
                  value={formData.fakultas}
                  onChange={e => setFormData({ ...formData, fakultas: e.target.value })}
                  placeholder="Misal: Fakultas Tarbiyah"
                  className="w-full px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                  disabled={isPending}
                />
                {existingFakultas.length > 0 && (
                  <datalist id="fakultas-list">
                    {existingFakultas.map(fak => (
                      <option key={fak} value={fak} />
                    ))}
                  </datalist>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[var(--color-text)]">Program Studi</label>
                <input
                  type="text"
                  required
                  value={formData.prodi}
                  onChange={e => setFormData({ ...formData, prodi: e.target.value })}
                  placeholder="Misal: Pendidikan Agama Islam"
                  className="w-full px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                  disabled={isPending}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[var(--color-text)]">Singkatan</label>
                  <input
                    type="text"
                    required
                    value={formData.singkatan}
                    onChange={e => setFormData({ ...formData, singkatan: e.target.value })}
                    placeholder="Misal: PAI"
                    className="w-full px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all uppercase"
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[var(--color-text)]">Gelar</label>
                  <input
                    type="text"
                    required
                    value={formData.gelar}
                    onChange={e => setFormData({ ...formData, gelar: e.target.value })}
                    placeholder="Misal: S.Pd."
                    className="w-full px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 mt-2 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text)] transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                >
                  {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
