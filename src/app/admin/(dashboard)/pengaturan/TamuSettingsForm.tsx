"use client";

import { useState, useEffect, useRef } from "react";
import { updateSetting, getAllSettingsAdmin } from "@/actions/settings";
import { Loader2, CheckCircle2, Upload, ImageIcon, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { uploadTamuBackground, uploadTamuSignature, extractSupabasePath, deleteCertAsset } from "@/lib/uploadCertBg";

export default function TamuSettingsForm({ initialData }: { initialData?: Record<string, string> }) {
  const { showToast } = useToast();

  const [tamuNomor, setTamuNomor] = useState(initialData?.tamu_nomor || "");
  const [tamuTanggal, setTamuTanggal] = useState(initialData?.tamu_tanggal || "");
  const [tamuJabatan, setTamuJabatan] = useState(initialData?.tamu_jabatan || "Rektor");
  const [tamuNama, setTamuNama] = useState(initialData?.tamu_nama || "");
  const [tamuNip, setTamuNip] = useState(initialData?.tamu_nip || "");
  const [tamuAcara, setTamuAcara] = useState(initialData?.tamu_acara || "");

  const [tamuBgDepanUrl, setTamuBgDepanUrl] = useState(initialData?.tamu_bg_depan_url || "");
  const [isUploadingBgDepan, setIsUploadingBgDepan] = useState(false);
  const bgDepanFileInputRef = useRef<HTMLInputElement>(null);

  const [tamuBgBelakangUrl, setTamuBgBelakangUrl] = useState(initialData?.tamu_bg_belakang_url || "");
  const [isUploadingBgBelakang, setIsUploadingBgBelakang] = useState(false);
  const bgBelakangFileInputRef = useRef<HTMLInputElement>(null);

  const [tamuTtdUrl, setTamuTtdUrl] = useState(initialData?.tamu_ttd_url || "");
  const [isUploadingTtd, setIsUploadingTtd] = useState(false);
  const ttdFileInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const results = await Promise.all([
        updateSetting('tamu_nomor', tamuNomor),
        updateSetting('tamu_tanggal', tamuTanggal),
        updateSetting('tamu_jabatan', tamuJabatan),
        updateSetting('tamu_nama', tamuNama),
        updateSetting('tamu_nip', tamuNip),
        updateSetting('tamu_acara', tamuAcara),
        updateSetting('tamu_bg_depan_url', tamuBgDepanUrl),
        updateSetting('tamu_bg_belakang_url', tamuBgBelakangUrl),
        updateSetting('tamu_ttd_url', tamuTtdUrl)
      ]);

      if (results.every(r => r.success)) {
        showToast("Pengaturan Undangan Tamu berhasil diperbarui!", "success");
      } else {
        showToast("Gagal memperbarui pengaturan undangan tamu.", "error");
      }
    } catch (err) {
      console.error("Gagal menyimpan:", err);
      showToast("Gagal menyimpan pengaturan.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBgDepanUpload = async (file: File) => {
    setIsUploadingBgDepan(true);
    try {
      const oldPath = extractSupabasePath(tamuBgDepanUrl);
      const result = await uploadTamuBackground(file, oldPath);
      setTamuBgDepanUrl(result.publicUrl);
      showToast("Gambar latar depan berhasil diupload!", "success");
    } catch (err: any) {
      showToast(err.message || "Upload gagal.", "error");
    } finally {
      setIsUploadingBgDepan(false);
    }
  };

  const handleRemoveBgDepan = async () => {
    const oldPath = extractSupabasePath(tamuBgDepanUrl);
    if (oldPath) await deleteCertAsset(oldPath);
    setTamuBgDepanUrl("");
    showToast("Gambar latar depan dihapus.", "success");
  };

  const handleBgBelakangUpload = async (file: File) => {
    setIsUploadingBgBelakang(true);
    try {
      const oldPath = extractSupabasePath(tamuBgBelakangUrl);
      const result = await uploadTamuBackground(file, oldPath);
      setTamuBgBelakangUrl(result.publicUrl);
      showToast("Gambar latar belakang berhasil diupload!", "success");
    } catch (err: any) {
      showToast(err.message || "Upload gagal.", "error");
    } finally {
      setIsUploadingBgBelakang(false);
    }
  };

  const handleRemoveBgBelakang = async () => {
    const oldPath = extractSupabasePath(tamuBgBelakangUrl);
    if (oldPath) await deleteCertAsset(oldPath);
    setTamuBgBelakangUrl("");
    showToast("Gambar latar belakang dihapus.", "success");
  };

  const handleTtdUpload = async (file: File) => {
    setIsUploadingTtd(true);
    try {
      const oldPath = extractSupabasePath(tamuTtdUrl);
      const result = await uploadTamuSignature(file, oldPath);
      setTamuTtdUrl(result.publicUrl);
      showToast("Gambar tanda tangan berhasil diupload!", "success");
    } catch (err: any) {
      showToast(err.message || "Upload gagal.", "error");
    } finally {
      setIsUploadingTtd(false);
    }
  };

  const handleRemoveTtd = async () => {
    const oldPath = extractSupabasePath(tamuTtdUrl);
    if (oldPath) await deleteCertAsset(oldPath);
    setTamuTtdUrl("");
    showToast("Gambar tanda tangan dihapus.", "success");
  };


  return (
    <form onSubmit={handleSave} className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm overflow-hidden flex flex-col">

        {/* === Upload Latar Depan === */}
        <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-start justify-between gap-6 hover:bg-[var(--color-bg-secondary)]/50 transition-colors">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-[var(--color-text)]">Background Halaman 1 (Depan)</h3>
            <p className="text-xs text-[var(--color-text-subtle)] mt-1.5 leading-relaxed">
              Upload gambar format PNG/JPG/WEBP (maks 5 MB) ukuran <strong>A4 Landscape</strong>. Gambar ini akan menjadi kop & latar isi surat undangan.
            </p>
          </div>

          <div className="w-full sm:w-auto shrink-0 flex flex-col items-center gap-3">
            <div className="relative group">
              {tamuBgDepanUrl ? (
                <div className="relative w-48 h-32 rounded-xl overflow-hidden border-2 border-emerald-400 shadow-md group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={tamuBgDepanUrl} alt="Preview Background Depan" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button type="button" onClick={() => bgDepanFileInputRef.current?.click()} disabled={isUploadingBgDepan} className="p-2 rounded-full bg-white/90 text-emerald-700 hover:bg-white transition-colors" title="Ganti">
                      <Upload size={14} />
                    </button>
                    <button type="button" onClick={handleRemoveBgDepan} disabled={isUploadingBgDepan} className="p-2 rounded-full bg-white/90 text-red-600 hover:bg-white transition-colors" title="Hapus">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => bgDepanFileInputRef.current?.click()} disabled={isUploadingBgDepan}
                  className="w-48 h-32 border-2 border-dashed border-[var(--color-border)] rounded-xl flex flex-col items-center justify-center gap-2 text-[var(--color-text-muted)] hover:border-emerald-400 hover:text-emerald-600 transition-colors cursor-pointer bg-[var(--color-bg)]">
                  {isUploadingBgDepan ? <Loader2 size={24} className="animate-spin text-emerald-500" /> : <ImageIcon size={24} />}
                  <span className="text-xs font-medium">{isUploadingBgDepan ? 'Mengupload...' : 'Pilih Latar Depan'}</span>
                </button>
              )}
            </div>
            <input ref={bgDepanFileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBgDepanUpload(f); e.target.value = ''; }} />
          </div>
        </div>

        {/* === Upload Latar Belakang === */}
        <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-start justify-between gap-6 hover:bg-[var(--color-bg-secondary)]/50 transition-colors border-t border-[var(--color-border)]">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-[var(--color-text)]">Background Halaman 2 (Susunan Acara)</h3>
            <p className="text-xs text-[var(--color-text-subtle)] mt-1.5 leading-relaxed">
              Upload gambar format PNG/JPG/WEBP (maks 5 MB) ukuran <strong>A4 Landscape</strong> untuk latar bagian halaman dua.
            </p>
          </div>

          <div className="w-full sm:w-auto shrink-0 flex flex-col items-center gap-3">
            <div className="relative group">
              {tamuBgBelakangUrl ? (
                <div className="relative w-48 h-32 rounded-xl overflow-hidden border-2 border-emerald-400 shadow-md group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={tamuBgBelakangUrl} alt="Preview Background Belakang" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button type="button" onClick={() => bgBelakangFileInputRef.current?.click()} disabled={isUploadingBgBelakang} className="p-2 rounded-full bg-white/90 text-emerald-700 hover:bg-white transition-colors" title="Ganti">
                      <Upload size={14} />
                    </button>
                    <button type="button" onClick={handleRemoveBgBelakang} disabled={isUploadingBgBelakang} className="p-2 rounded-full bg-white/90 text-red-600 hover:bg-white transition-colors" title="Hapus">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => bgBelakangFileInputRef.current?.click()} disabled={isUploadingBgBelakang}
                  className="w-48 h-32 border-2 border-dashed border-[var(--color-border)] rounded-xl flex flex-col items-center justify-center gap-2 text-[var(--color-text-muted)] hover:border-emerald-400 hover:text-emerald-600 transition-colors cursor-pointer bg-[var(--color-bg)]">
                  {isUploadingBgBelakang ? <Loader2 size={24} className="animate-spin text-emerald-500" /> : <ImageIcon size={24} />}
                  <span className="text-xs font-medium">{isUploadingBgBelakang ? 'Mengupload...' : 'Pilih Latar Belakang'}</span>
                </button>
              )}
            </div>
            <input ref={bgBelakangFileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBgBelakangUpload(f); e.target.value = ''; }} />
          </div>
        </div>

        {/* === Upload Tanda Tangan === */}
        <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-start justify-between gap-6 hover:bg-[var(--color-bg-secondary)]/50 transition-colors border-t border-[var(--color-border)]">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-[var(--color-text)]">Tanda Tangan Pejabat</h3>
            <p className="text-xs text-[var(--color-text-subtle)] mt-1.5 leading-relaxed">
              PNG transparan direkomendasikan. Akan di-overlay di atas nama pada halaman pertama. (Maks 2 MB).
            </p>
          </div>

          <div className="w-full sm:w-auto shrink-0 flex flex-col items-center gap-3">
            <div className="relative group">
              {tamuTtdUrl ? (
                <div className="relative w-48 h-32 rounded-xl overflow-hidden border-2 border-emerald-400 shadow-sm group bg-[var(--color-bg)] bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%3E%3Crect%20width%3D%228%22%20height%3D%228%22%20fill%3D%22%23e5e7eb%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%228%22%20width%3D%228%22%20height%3D%228%22%20fill%3D%22%23e5e7eb%22%2F%3E%3C%2Fsvg%3E')]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={tamuTtdUrl} alt="Preview TTD" className="w-full h-full object-contain p-2" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button type="button" onClick={() => ttdFileInputRef.current?.click()} disabled={isUploadingTtd} className="p-2 rounded-full bg-white/90 text-emerald-700 hover:bg-white transition-colors" title="Ganti"><Upload size={14} /></button>
                    <button type="button" onClick={handleRemoveTtd} disabled={isUploadingTtd} className="p-2 rounded-full bg-white/90 text-red-600 hover:bg-white transition-colors" title="Hapus"><X size={14} /></button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => ttdFileInputRef.current?.click()} disabled={isUploadingTtd}
                  className="w-48 h-32 border-2 border-dashed border-[var(--color-border)] rounded-xl flex flex-col items-center justify-center gap-2 text-[var(--color-text-muted)] hover:border-emerald-400 hover:text-emerald-600 transition-colors cursor-pointer bg-[var(--color-bg)]">
                  {isUploadingTtd ? <Loader2 size={24} className="animate-spin text-emerald-500" /> : <Upload size={24} />}
                  <span className="text-xs font-medium">{isUploadingTtd ? 'Mengupload...' : 'Upload TTD'}</span>
                </button>
              )}
            </div>
            <input ref={ttdFileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleTtdUpload(f); e.target.value = ''; }} />
          </div>
        </div>

        {/* === Text Settings === */}
        <div className="px-6 py-4 bg-[var(--color-bg-secondary)] border-y border-[var(--color-border)] mt-2">
          <h2 className="text-base font-bold text-[var(--color-text)]">Informasi Surat Undangan</h2>
        </div>

        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-[var(--color-bg-secondary)]/50 transition-colors">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-[var(--color-text)]">Nomor Undangan</h3>
          </div>
          <div className="w-full sm:w-80 shrink-0">
            <input
              type="text"
              value={tamuNomor}
              onChange={(e) => setTamuNomor(e.target.value)}
              className="w-full px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
              placeholder="Contoh: B-123/In.34/1/PP.00.9/06/2026"
            />
          </div>
        </div>

        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-[var(--color-bg-secondary)]/50 transition-colors border-t border-[var(--color-border)]">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-[var(--color-text)]">Tanggal Surat</h3>
          </div>
          <div className="w-full sm:w-80 shrink-0">
            <input
              type="text"
              value={tamuTanggal}
              onChange={(e) => setTamuTanggal(e.target.value)}
              className="w-full px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
              placeholder="Contoh: Watampone, 20 Juni 2026"
            />
          </div>
        </div>

        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-[var(--color-bg-secondary)]/50 transition-colors border-t border-[var(--color-border)]">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-[var(--color-text)]">Jabatan Penandatangan</h3>
          </div>
          <div className="w-full sm:w-80 shrink-0">
            <input
              type="text"
              value={tamuJabatan}
              onChange={(e) => setTamuJabatan(e.target.value)}
              className="w-full px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
              placeholder="Contoh: Rektor"
            />
          </div>
        </div>

        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-[var(--color-bg-secondary)]/50 transition-colors border-t border-[var(--color-border)]">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-[var(--color-text)]">Nama Penandatangan</h3>
          </div>
          <div className="w-full sm:w-80 shrink-0">
            <input
              type="text"
              value={tamuNama}
              onChange={(e) => setTamuNama(e.target.value)}
              className="w-full px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
              placeholder="Nama Lengkap beserta Gelar"
            />
          </div>
        </div>

        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-[var(--color-bg-secondary)]/50 transition-colors border-t border-[var(--color-border)]">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-[var(--color-text)]">NIP Penandatangan</h3>
          </div>
          <div className="w-full sm:w-80 shrink-0">
            <input
              type="text"
              value={tamuNip}
              onChange={(e) => setTamuNip(e.target.value)}
              className="w-full px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
              placeholder="NIP. xxxxxxxxxx"
            />
          </div>
        </div>

        <div className="px-6 py-4 flex flex-col gap-4 hover:bg-[var(--color-bg-secondary)]/50 transition-colors border-t border-[var(--color-border)]">
          <div>
            <h3 className="text-sm font-bold text-[var(--color-text)]">Susunan Acara (Halaman 2)</h3>
            <p className="text-xs text-[var(--color-text-subtle)] mt-1.5 leading-relaxed">
              Pisahkan setiap acara dengan baris baru (Enter).
            </p>
          </div>
          <div className="w-full">
            <textarea
              value={tamuAcara}
              onChange={(e) => setTamuAcara(e.target.value)}
              rows={20}
              className="w-full min-h-[300] px-4 py-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all resize-y"
              placeholder={`08.00 - Registrasi\n09.00 - Pembukaan\n10.00 - Orasi Ilmiah`}
            />
          </div>
        </div>

      </div>

      {/* Action Bar */}
      <div className="pt-6 mt-8 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full"></div>
        <button
          type="submit"
          disabled={isSaving}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-emerald-900/20 active:scale-95"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          {isSaving ? "Menyimpan..." : "Simpan Pengaturan Tamu"}
        </button>
      </div>
    </form>
  );
}
