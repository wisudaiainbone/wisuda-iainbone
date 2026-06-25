"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { BookOpen, Download } from "lucide-react";

export function PetunjukSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section id="petunjuk" className="py-8 sm:py-10 bg-[var(--color-bg)]">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">


        {/* Content removed per user request */}

        {/* Download Action */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="w-full bg-gradient-to-r from-[#1e3a5f] to-[#1a2e4a] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 border border-emerald-800/15-[0_8px_32px_rgba(30,58,95,0.15)]"
        >
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-full bg-emerald-800/15 flex items-center justify-center shrink-0 hidden sm:flex">
              <BookOpen size={24} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg font-[var(--font-outfit)]">Buku Panduan Lengkap</h3>
              <p className="text-white/60 text-sm mt-1">Unduh buku petunjuk format PDF untuk informasi lebih detail.</p>
            </div>
          </div>
          <button className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-800 text-white font-semibold text-sm hover:bg-emerald-950 hover: transition-all duration-300 w-full sm:w-auto justify-center">
            <Download size={16} />
            Lihat & Unduh Buku Panduan
          </button>
        </motion.div>
      </div>
    </section>
  );
}
