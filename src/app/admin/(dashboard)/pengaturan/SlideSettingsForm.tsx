"use client";

import { useState, useEffect, useRef } from "react";
import { getSetting, updateSetting } from "@/actions/settings";
import { Loader2, CheckCircle2, Upload, ImageIcon, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { uploadSlideFrame, extractSupabasePath, deleteCertAsset } from "@/lib/uploadCertBg";

// 5 slot bingkai — sesuaikan nama dengan urutan fakultas di database
const FRAME_SLOTS = [
  { key: 'fak1', label: 'Fakultas Syariah' },
  { key: 'fak2', label: 'Fakultas Tarbiyah' },
  { key: 'fak3', label: 'Fakultas Ekonomi dan Bisnis Islam' },
  { key: 'fak4', label: 'Fakultas Ushuluddin' },
  { key: 'fak5', label: 'Pascasarjana' },
];

const BADGE_PRESTASI_SLOTS = [
  { key: 'badge_prestasi_1', label: 'Badge Prestasi 1' },
  { key: 'badge_prestasi_2', label: 'Badge Prestasi 2' },
  { key: 'badge_prestasi_3', label: 'Badge Prestasi 3' },
];

type FrameState = {
  url: string;
  warna: string;
  isUploading: boolean;
};

type FrameMap = Record<string, FrameState>;

export default function SlideSettingsForm() {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [frames, setFrames] = useState<FrameMap>(() => {
    const init: FrameMap = {};
    FRAME_SLOTS.forEach(s => {
      init[s.key] = { url: '', warna: '#1a2744', isUploading: false };
    });
    BADGE_PRESTASI_SLOTS.forEach(s => {
      init[s.key] = { url: '', warna: '#ffffff', isUploading: false };
    });
    return init;
  });

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const loaded: FrameMap = {};
        for (const slot of FRAME_SLOTS) {
          const url = await getSetting(`slide_frame_${slot.key}_url`, '', true);
          const warna = await getSetting(`slide_frame_${slot.key}_warna`, '#1a2744', true);
          loaded[slot.key] = { url, warna, isUploading: false };
        }
        for (const slot of BADGE_PRESTASI_SLOTS) {
          const url = await getSetting(`slide_${slot.key}_url`, '', true);
          loaded[slot.key] = { url, warna: '#ffffff', isUploading: false };
        }
        setFrames(loaded);
      } catch (err) {
        console.error('Gagal memuat pengaturan slide', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleUpload = async (key: string, file: File) => {
    setFrames(prev => ({ ...prev, [key]: { ...prev[key], isUploading: true } }));
    try {
      const oldPath = extractSupabasePath(frames[key].url);
      const result = await uploadSlideFrame(file, key, oldPath);
      // Simpan langsung ke DB
      const settingKey = key.includes('badge') ? `slide_${key}_url` : `slide_frame_${key}_url`;
      await updateSetting(settingKey, result.publicUrl);
      setFrames(prev => ({ ...prev, [key]: { ...prev[key], url: result.publicUrl } }));
      showToast('Bingkai berhasil diupload!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Upload gagal.', 'error');
    } finally {
      setFrames(prev => ({ ...prev, [key]: { ...prev[key], isUploading: false } }));
    }
  };

  const handleRemove = async (key: string) => {
    const oldPath = extractSupabasePath(frames[key].url);
    if (oldPath) await deleteCertAsset(oldPath);
    const settingKey = key.includes('badge') ? `slide_${key}_url` : `slide_frame_${key}_url`;
    await updateSetting(settingKey, '');
    setFrames(prev => ({ ...prev, [key]: { ...prev[key], url: '' } }));
    showToast('Bingkai dihapus.', 'success');
  };

  const handleSaveWarna = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const results = await Promise.all(
        FRAME_SLOTS.map(slot =>
          updateSetting(`slide_frame_${slot.key}_warna`, frames[slot.key].warna)
        )
      );
      if (results.every(r => r.success)) {
        showToast('Warna tema berhasil disimpan!', 'success');
      } else {
        showToast('Sebagian warna gagal disimpan.', 'error');
      }
    } catch {
      showToast('Gagal menyimpan.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveWarna} className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm overflow-hidden flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
          <h2 className="text-base font-bold text-[var(--color-text)]">Bingkai Foto Slide</h2>
          <p className="text-xs text-[var(--color-text-subtle)] mt-1">
            Upload bingkai (frame) PNG transparan berukuran <strong>1080×1920px</strong> untuk setiap fakultas. Bingkai akan di-overlay di atas foto wisudawan saat generate slide PPTX.
          </p>
        </div>

        {FRAME_SLOTS.map((slot, idx) => {
          const frame = frames[slot.key];
          const inputRef = (el: HTMLInputElement | null) => { fileInputRefs.current[slot.key] = el; };

          return (
            <div
              key={slot.key}
              className={`px-6 py-5 flex flex-col sm:flex-row sm:items-start justify-between gap-6 hover:bg-[var(--color-bg-secondary)]/50 transition-colors ${idx > 0 ? 'border-t border-[var(--color-border)]' : ''}`}
            >
              {/* Kiri: Label + Warna */}
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-text)]">{slot.label}</h3>
                  <p className="text-xs text-[var(--color-text-subtle)] mt-1">
                    PNG transparan (maks 5 MB). Ukuran 1080×1920px portrait.
                  </p>
                </div>

                {/* Warna Hex */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg border-2 border-[var(--color-border)] shrink-0 shadow-sm"
                    style={{ backgroundColor: frame.warna }}
                  />
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                      Warna Tema (Hex)
                    </label>
                    <input
                      type="text"
                      value={frame.warna}
                      onChange={e => {
                        const val = e.target.value;
                        setFrames(prev => ({ ...prev, [slot.key]: { ...prev[slot.key], warna: val } }));
                      }}
                      placeholder="#1a2744"
                      pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                      maxLength={7}
                      className="w-28 px-3 py-1.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-sm font-mono text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                    />
                  </div>
                  <input
                    type="color"
                    value={frame.warna.startsWith('#') && frame.warna.length === 7 ? frame.warna : '#1a2744'}
                    onChange={e => setFrames(prev => ({ ...prev, [slot.key]: { ...prev[slot.key], warna: e.target.value } }))}
                    className="w-8 h-8 rounded-lg border border-[var(--color-border)] cursor-pointer bg-transparent p-0.5"
                    title="Pilih Warna"
                  />
                </div>
              </div>

              {/* Kanan: Upload Bingkai */}
              <div className="w-full sm:w-auto shrink-0 flex flex-col items-center gap-3">
                <div className="relative group">
                  {frame.url ? (
                    <div className="relative w-28 h-48 rounded-xl overflow-hidden border-2 border-emerald-400 shadow-md group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={frame.url}
                        alt={`Preview ${slot.label}`}
                        className="w-full h-full object-contain"
                        style={{ background: 'repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 0 0 / 12px 12px' }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[slot.key]?.click()}
                          disabled={frame.isUploading}
                          className="p-2 rounded-full bg-white/90 text-emerald-700 hover:bg-white transition-colors"
                          title="Ganti"
                        >
                          <Upload size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(slot.key)}
                          disabled={frame.isUploading}
                          className="p-2 rounded-full bg-white/90 text-red-600 hover:bg-white transition-colors"
                          title="Hapus"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[slot.key]?.click()}
                      disabled={frame.isUploading}
                      className="w-28 h-48 border-2 border-dashed border-[var(--color-border)] rounded-xl flex flex-col items-center justify-center gap-2 text-[var(--color-text-muted)] hover:border-emerald-400 hover:text-emerald-600 transition-colors cursor-pointer bg-[var(--color-bg)]"
                    >
                      {frame.isUploading
                        ? <Loader2 size={24} className="animate-spin text-emerald-500" />
                        : <ImageIcon size={24} />
                      }
                      <span className="text-xs font-medium text-center leading-tight px-1">
                        {frame.isUploading ? 'Mengupload...' : 'Pilih Bingkai'}
                      </span>
                    </button>
                  )}
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(slot.key, f);
                    e.target.value = '';
                  }}
                />
              </div>
            </div>
          );
        })}

        {/* Header Badge Prestasi */}
        <div className="px-6 py-4 bg-[var(--color-bg-secondary)] border-b border-t border-[var(--color-border)] mt-8">
          <h2 className="text-base font-bold text-[var(--color-text)]">Badge Prestasi</h2>
          <p className="text-xs text-[var(--color-text-subtle)] mt-1">
            Upload icon/gambar badge (PNG transparan) untuk menandakan prestasi mahasiswa di slide.
          </p>
        </div>

        {BADGE_PRESTASI_SLOTS.map((slot, idx) => {
          const frame = frames[slot.key];
          const inputRef = (el: HTMLInputElement | null) => { fileInputRefs.current[slot.key] = el; };

          return (
            <div
              key={slot.key}
              className={`px-6 py-5 flex flex-col sm:flex-row sm:items-start justify-between gap-6 hover:bg-[var(--color-bg-secondary)]/50 transition-colors ${idx > 0 ? 'border-t border-[var(--color-border)]' : ''}`}
            >
              {/* Kiri: Label */}
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-text)]">{slot.label}</h3>
                  <p className="text-xs text-[var(--color-text-subtle)] mt-1">
                    PNG transparan (maks 5 MB).
                  </p>
                </div>
              </div>

              {/* Kanan: Upload Bingkai */}
              <div className="w-full sm:w-auto shrink-0 flex flex-col items-center gap-3">
                <div className="relative group">
                  {frame.url ? (
                    <div className="relative w-28 h-28 rounded-xl overflow-hidden border-2 border-emerald-400 shadow-md group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={frame.url}
                        alt={`Preview ${slot.label}`}
                        className="w-full h-full object-contain p-2"
                        style={{ background: 'repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 0 0 / 12px 12px' }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[slot.key]?.click()}
                          disabled={frame.isUploading}
                          className="p-2 rounded-full bg-white/90 text-emerald-700 hover:bg-white transition-colors"
                          title="Ganti"
                        >
                          <Upload size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(slot.key)}
                          disabled={frame.isUploading}
                          className="p-2 rounded-full bg-white/90 text-red-600 hover:bg-white transition-colors"
                          title="Hapus"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[slot.key]?.click()}
                      disabled={frame.isUploading}
                      className="w-28 h-28 border-2 border-dashed border-[var(--color-border)] rounded-xl flex flex-col items-center justify-center gap-2 text-[var(--color-text-muted)] hover:border-emerald-400 hover:text-emerald-600 transition-colors cursor-pointer bg-[var(--color-bg)]"
                    >
                      {frame.isUploading
                        ? <Loader2 size={24} className="animate-spin text-emerald-500" />
                        : <ImageIcon size={24} />
                      }
                      <span className="text-xs font-medium text-center leading-tight px-1">
                        {frame.isUploading ? 'Mengupload...' : 'Pilih Gambar'}
                      </span>
                    </button>
                  )}
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(slot.key, f);
                    e.target.value = '';
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Bar */}
      <div className="pt-6 mt-4 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full" />
        <button
          type="submit"
          disabled={isSaving}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-emerald-900/20 active:scale-95"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          {isSaving ? "Menyimpan..." : "Simpan Warna Tema"}
        </button>
      </div>
    </form>
  );
}
