"use client";

import { useState } from "react";
import { updateTogaPeriodeSettings } from "@/actions/periode";
import { Plus, Trash2, Clock, MapPin, Save, Loader2, AlertCircle } from "lucide-react";

export default function TogaSettingsForm({ activePeriode }: { activePeriode: any }) {
  const [tempat, setTempat] = useState(activePeriode?.tempat_pengambilan_toga || "");
  const AVAILABLE_FAKULTAS = [
    "Fakultas Syariah dan Hukum Islam",
    "Fakultas Tarbiyah",
    "Fakultas Ushuluddin dan Dakwah",
    "Fakultas Ekonomi dan Bisnis Islam",
    "Pascasarjana"
  ];

  // Pastikan semua fakultas ada di map
  const initialWaktuMap: Record<string, string> = {};
  AVAILABLE_FAKULTAS.forEach(f => {
    initialWaktuMap[f] = activePeriode?.waktu_pengambilan_toga?.[f] || "";
  });

  const [waktuMap, setWaktuMap] = useState<Record<string, string>>(initialWaktuMap);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleUpdateWaktu = (key: string, value: string) => {
    setWaktuMap(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    try {
      const cleanWaktuMap: Record<string, string> = {};
      Object.entries(waktuMap).forEach(([k, v]) => {
        if (v.trim() !== "") {
          cleanWaktuMap[k] = v;
        }
      });

      const res = await updateTogaPeriodeSettings(activePeriode.id, {
        tempat_pengambilan_toga: tempat,
        waktu_pengambilan_toga: cleanWaktuMap
      });

      if (res.success) {
        setMessage({ type: 'success', text: 'Pengaturan pengambilan Toga berhasil disimpan!' });
      } else {
        setMessage({ type: 'error', text: res.error || 'Gagal menyimpan pengaturan.' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Terjadi kesalahan.' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (!activePeriode) return null;

  return (
    <form onSubmit={handleSave} className="w-full space-y-8 pb-24 sm:pb-0">
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-2 text-sm font-bold ${message.type === 'success' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'}`}>
          <AlertCircle size={16} />
          {message.text}
        </div>
      )}

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden flex flex-col">
        {/* Tempat Pengambilan */}
        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-[var(--color-bg-secondary)]/50 transition-colors">
          <div className="flex-1">
            <h2 className="text-sm font-bold text-[var(--color-text)] flex items-center gap-2">
              Tempat Pengambilan
            </h2>
          </div>
          <div className="w-full sm:w-80 shrink-0">
            <input
              type="text"
              value={tempat}
              onChange={(e) => setTempat(e.target.value)}
              placeholder="Contoh: Gedung Fakultas Tarbiyah"
              className="w-full px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
            />
          </div>
        </div>

        {/* Waktu Pengambilan Label */}
        <div className="px-6 py-4 bg-[var(--color-bg-secondary)] border-y border-[var(--color-border)]">
          <h2 className="text-sm font-bold text-[var(--color-text)] flex items-center gap-2">
            Waktu Pengambilan per Fakultas
          </h2>
        </div>

        {/* List Fakultas */}
        {AVAILABLE_FAKULTAS.map((fakultas, index) => (
          <div key={fakultas} className={`px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-[var(--color-bg-secondary)]/50 transition-colors ${index !== 0 ? 'border-t border-[var(--color-border)]' : ''}`}>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-[var(--color-text)]">{fakultas}</h3>
            </div>
            <div className="w-full sm:w-80 shrink-0">
              <input
                type="text"
                value={waktuMap[fakultas] || ""}
                onChange={(e) => handleUpdateWaktu(fakultas, e.target.value)}
                placeholder="Waktu (contoh: Senin, 08:00 - 12:00 WITA)"
                className="w-full px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Action Bar */}
      <div className="fixed sm:static bottom-20 sm:bottom-auto left-0 right-0 sm:left-auto sm:right-auto px-4 sm:px-0 z-40 flex sm:block pointer-events-none sm:pointer-events-auto sm:mt-8 sm:pt-6 sm:border-t sm:border-[var(--color-border)]">
        <div className="flex w-full sm:w-auto items-center sm:justify-end pointer-events-auto">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 h-[42px] sm:h-auto sm:py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white rounded-full sm:rounded-xl text-sm font-bold transition-all-emerald-900/20 active:scale-95"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isLoading ? "Menyimpan..." : "Simpan Pengaturan Toga"}
          </button>
        </div>
      </div>
    </form>
  );
}
