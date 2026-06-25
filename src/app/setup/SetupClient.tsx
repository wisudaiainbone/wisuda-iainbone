"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, User, Mail,
  CheckCircle2, ArrowRight, AlertTriangle, Loader2
} from "lucide-react";
import { buatAdminPertama } from "@/actions/setup";

export default function SetupClient() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "success">("form");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const res = await buatAdminPertama(email, nama);

    if (res.success) {
      setStep("success");
    } else {
      setError(res.error ?? "Terjadi kesalahan.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--color-bg)] px-6">
      {/* Background dekoratif */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <AnimatePresence mode="wait">
          {step === "form" ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-3xl p-8 relative overflow-hidden"
            >
              {/* Stripe dekoratif atas */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-purple-500 to-emerald-500" />

              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-200 dark:border-emerald-800/50">
                  <ShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h1 className="text-2xl font-bold font-[var(--font-outfit)] text-[var(--color-text)] mb-2">
                  Setup Admin Pertama
                </h1>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                  Buat akun <strong className="text-[var(--color-text)]">Superadmin</strong> pertama untuk mengakses dashboard. Halaman ini hanya muncul sekali selama belum ada admin.
                </p>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-300 text-xs px-4 py-3 rounded-xl mb-6">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>
                  Pastikan <strong>SUPABASE_SERVICE_ROLE_KEY</strong> sudah diisi di <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">.env.local</code> sebelum lanjut.
                </span>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nama Lengkap */}
                <div className="space-y-1.5">
                  <label htmlFor="setup-nama" className="text-sm font-semibold text-[var(--color-text)]">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-[var(--color-text-muted)] opacity-70" />
                    </div>
                    <input
                      type="text"
                      id="setup-nama"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      placeholder="Nama Superadmin"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] text-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="setup-email" className="text-sm font-semibold text-[var(--color-text)]">
                    Email Admin (Akun Google)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-[var(--color-text-muted)] opacity-70" />
                    </div>
                    <input
                      type="email"
                      id="setup-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@gmail.com"
                      required
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] text-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Info Text */}
                <p className="text-xs text-[var(--color-text-muted)] italic">
                  Password tidak diperlukan karena Anda akan login menggunakan tombol "Lanjutkan dengan Google" pada halaman berikutnya.
                </p>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="flex items-start gap-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-400 text-sm px-4 py-3 rounded-xl"
                    >
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  id="btn-setup-submit"
                  disabled={isLoading}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors-emerald-900/20"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Membuat akun...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      Buat Superadmin
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            /* Halaman sukses */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[var(--color-bg-secondary)] border border-emerald-200 dark:border-emerald-800/50 rounded-3xl p-8 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1, stiffness: 200 }}
                className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-emerald-300 dark:border-emerald-700"
              >
                <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              </motion.div>

              <h2 className="text-2xl font-bold font-[var(--font-outfit)] text-[var(--color-text)] mb-3">
                Berhasil! 🎉
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] mb-2 leading-relaxed">
                Akun superadmin untuk <strong className="text-[var(--color-text)]">{email}</strong> berhasil dibuat.
              </p>
              <p className="text-xs text-[var(--color-text-subtle)] mb-8">
                Halaman setup ini tidak akan muncul lagi setelah ada admin terdaftar.
              </p>

              <button
                onClick={() => router.push("/admin/login")}
                id="btn-goto-login"
                className="w-full flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors-emerald-900/20"
              >
                Lanjut ke Halaman Login Google
                <ArrowRight size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
