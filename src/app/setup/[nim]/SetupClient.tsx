"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Lock, Mail, GraduationCap, CheckCircle2, ArrowRight, Eye, EyeOff } from "lucide-react";
import { setupAkunWisudawan } from "@/actions/wisudawan";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const TOGA_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"];

export default function SetupClient({ nim, nama, initialToga }: { nim: string; nama: string; initialToga?: string }) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [toga, setToga] = useState(initialToga?.trim().toUpperCase() || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isDone, setIsDone] = useState(false);

  // Use effect to ensure state is synced, especially during fast refresh or if props change
  useEffect(() => {
    if (initialToga) {
      setToga(initialToga.trim().toUpperCase());
    }
  }, [initialToga]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validasi
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Format email tidak valid.");
      return;
    }
    if (!toga) {
      setError("Ukuran toga wajib dipilih.");
      return;
    }
    if (password.length < 6) {
      setError("Password baru minimal 6 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await setupAkunWisudawan(nim, email, toga, password);
      if (!res.success) {
        setError(res.error || "Gagal menyimpan. Coba lagi.");
      } else {
        setIsDone(true);
        // Redirect ke /auth setelah 3 detik
        setTimeout(() => router.push("/auth"), 3000);
      }
    } catch {
      setError("Terjadi kesalahan pada server. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--color-bg)] px-4">
      {/* Background decorations */}
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.05] text-slate-900 dark:text-white"
        style={{
          backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute top-20 left-[10%] w-72 h-72 rounded-full bg-emerald-800/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-20 right-[10%] w-80 h-80 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />

      {/* Theme toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle isScrolled={false} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] backdrop-blur-2xl rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />

          {isDone ? (
            /* ── Success State ── */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center gap-4 py-6"
            >
              <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--color-text)] mb-1">Akun Berhasil Disiapkan!</h2>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                  Data Anda telah disimpan. Anda akan diarahkan ke halaman login dalam beberapa detik untuk masuk menggunakan password baru.
                </p>
              </div>
              <button
                onClick={() => router.push("/auth")}
                className="mt-2 flex items-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-sm transition-colors"
              >
                Ke Halaman Login <ArrowRight size={16} />
              </button>
            </motion.div>
          ) : (
            /* ── Form State ── */
            <>
              {/* Header */}
              <div className="text-center mb-6">
                <div className="flex items-center justify-center mb-4">
                  <Image src="/logo.png" alt="Logo IAIN Bone" width={56} height={56} className="drop-shadow-sm" />
                </div>
                <h1 className="text-xl font-bold font-[var(--font-outfit)] text-[var(--color-text)] mb-1">
                  Lengkapi Akun Anda
                </h1>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                  Halo, <span className="font-semibold text-[var(--color-text)]">{nama}</span>!<br />
                  Sebelum masuk, silakan lengkapi data berikut
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--color-text-subtle)] uppercase tracking-wide">Email Aktif</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-[var(--color-text-muted)] opacity-70" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@email.com"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none text-sm"
                    />
                  </div>
                </div>

                {/* Ukuran Toga */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[var(--color-text-subtle)] uppercase tracking-wide">Ukuran Toga</label>
                  <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3">
                    <div className="flex flex-wrap gap-4">
                      {TOGA_OPTIONS.map((opt) => (
                        <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="toga_size_setup"
                            required
                            value={opt}
                            checked={toga === opt}
                            onChange={(e) => setToga(e.target.value)}
                            className="w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500 border-gray-300 dark:border-gray-600 bg-[var(--color-surface)]"
                          />
                          <span className="text-sm font-semibold text-[var(--color-text)]">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Password Baru */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--color-text-subtle)] uppercase tracking-wide">Password Baru</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-[var(--color-text-muted)] opacity-70" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-10 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Konfirmasi Password */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--color-text-subtle)] uppercase tracking-wide">Konfirmasi Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-[var(--color-text-muted)] opacity-70" />
                    </div>
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi password baru"
                      required
                      className="w-full pl-10 pr-10 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute inset-y-0 right-3 flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {/* Password match indicator */}
                  {confirmPassword && (
                    <p className={`text-xs mt-1 ${password === confirmPassword ? "text-emerald-600" : "text-rose-500"}`}>
                      {password === confirmPassword ? "✓ Password cocok" : "✗ Password tidak cocok"}
                    </p>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-400 text-sm px-4 py-3 rounded-xl">
                    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 group relative flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-white text-sm font-bold transition-all duration-300 shadow-lg shadow-emerald-900/20 bg-emerald-800 hover:bg-emerald-900 overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Menyimpan...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Simpan & Lanjutkan
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
