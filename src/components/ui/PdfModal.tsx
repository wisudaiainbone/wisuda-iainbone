import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';

type PdfModalProps = {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  title?: string;
};

export function PdfModal({ isOpen, onClose, pdfUrl, title = 'Pengumuman Resmi' }: PdfModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl h-[85vh] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl rounded-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
              <h3 className="font-semibold text-[var(--color-text)] truncate pr-4">{title}</h3>
              <div className="flex items-center gap-2">

                <button
                  onClick={onClose}
                  className="p-2 text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 w-full h-full bg-slate-100 dark:bg-slate-900">
              <iframe
                src={pdfUrl.includes('drive.google.com') ? pdfUrl.replace(/\/view.*$/, '/preview') : pdfUrl}
                className="w-full h-full border-none"
                title={title}
                allow="autoplay"
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
