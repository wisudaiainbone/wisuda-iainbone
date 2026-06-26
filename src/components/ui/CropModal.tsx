import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { motion, AnimatePresence } from "framer-motion";
import { X, Crop as CropIcon, AlertCircle, CheckCircle2 } from "lucide-react";

type CropModalProps = {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onApply: (croppedAreaPixels: any) => void;
  isLoading?: boolean;
};

export default function CropModal({ isOpen, imageSrc, onClose, onApply, isLoading = false }: CropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CropIcon size={18} className="text-[var(--color-text-muted)]" />
                <h3 className="text-base font-bold text-[var(--color-text)]">Sesuaikan Foto</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-rose-50 dark:bg-rose-900/15 border-b border-rose-100 dark:border-rose-900/30 flex items-start gap-3">
              <AlertCircle size={16} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed font-medium">
                <strong>Geser gambar dengan sentuhan/mouse</strong> untuk mengatur agar wajah berada tepat di tengah. Area yang terang adalah hasil potong dengan rasio 3:4.
              </div>
            </div>

            <div className="relative w-full h-[400px] sm:h-[450px] bg-slate-100 dark:bg-slate-900">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={3 / 4}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                showGrid={true}
                restrictPosition={true}
              />

              {/* Area Aman Overlay */}
              <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                <div className="relative aspect-[3/4] h-[80%] max-h-[360px] flex flex-col items-center justify-center opacity-50">
                  <svg viewBox="0 0 100 133" className="w-full h-full">
                    {/* Kepala */}
                    <ellipse cx="50" cy="50" rx="18" ry="24" fill="none" stroke="#34d399" strokeWidth="1.5" strokeDasharray="4 4" />
                    {/* Pundak */}
                    <path d="M15 133 C 15 95, 85 95, 85 133" fill="none" stroke="#34d399" strokeWidth="1.5" strokeDasharray="4 4" />
                  </svg>
                  <span className="absolute bottom-[15%] text-emerald-400 text-[9px] font-bold uppercase tracking-widest text-center px-2 bg-slate-900/40 rounded backdrop-blur-sm py-0.5">
                    Area Wajah & Pundak
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-[var(--color-text-muted)]">Perbesar</span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-1.5 bg-emerald-200 dark:bg-emerald-900/50 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>
            </div>

            <div className="p-4 border-t border-[var(--color-border)] flex items-center justify-end gap-3 bg-[var(--color-bg-secondary)]/50">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] text-sm font-semibold transition-colors border border-transparent hover:border-[var(--color-border)]"
              >
                Batal
              </button>
              <button
                onClick={() => !isLoading && onApply(croppedAreaPixels)}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Mengupload...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Terapkan Foto
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
