"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { User, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getOptimizedGDriveUrl } from "@/lib/uploadFoto";

export default function ImageModal({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!src) {
    return (
      <div className="w-9 h-12 rounded-md bg-emerald-600 flex items-center justify-center text-white">
        <User size={20} />
      </div>
    );
  }

  const optimizedSrc = getOptimizedGDriveUrl(src);

  return (
    <>
      <img
        src={optimizedSrc}
        alt={alt}
        referrerPolicy="no-referrer"
        onClick={() => setIsOpen(true)}
        className="w-9 h-12 rounded-md object-cover bg-emerald-600 cursor-pointer hover:opacity-80 transition-opacity"
        onError={(e) => {
          // Fallback ke src asli jika gagal
          (e.target as HTMLImageElement).src = src;
        }}
      />

      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={24} />
              </button>
              <motion.img
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                src={optimizedSrc}
                alt={alt}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[90vh] rounded-xl object-contain"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
                onError={(e) => {
                  // Fallback ke src asli jika gagal
                  (e.target as HTMLImageElement).src = src;
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
