"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { motion } from "framer-motion";
import { Home, ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 pointer-events-none hero-mesh opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[100px] -z-10" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center pt-16"
        >
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
            className="mb-8 p-6 bg-emerald-100/50 dark:bg-emerald-900/20 rounded-full border border-emerald-200/50 dark:border-emerald-800/30 shadow-glow"
          >
            <SearchX size={64} className="text-emerald-700 dark:text-emerald-400" />
          </motion.div>

          <h1 className="text-8xl md:text-9xl font-bold font-[var(--font-outfit)] gradient-text select-none drop-shadow-sm mb-4">
            404
          </h1>
          
          <h2 className="text-2xl md:text-3xl font-semibold text-[var(--color-text)] mb-4 font-[var(--font-outfit)]">
            Halaman Tidak Ditemukan
          </h2>

          <p className="text-[var(--color-text-subtle)] max-w-md mx-auto mb-10 leading-relaxed text-lg">
            Maaf, halaman yang Anda cari mungkin telah dihapus, namanya diubah, atau sementara tidak tersedia.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 items-center"
          >
            <button
              onClick={() => window.history.back()}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] rounded-xl font-medium hover:bg-[var(--color-surface-hover)] transition-all duration-300 shadow-sm"
            >
              <ArrowLeft size={18} />
              Kembali
            </button>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-medium transition-all duration-300 shadow-md shadow-emerald-900/20"
            >
              <Home size={18} />
              Beranda Utama
            </Link>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
