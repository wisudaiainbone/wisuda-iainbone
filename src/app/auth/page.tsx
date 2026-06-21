"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { GraduationCap, ArrowLeft, Lock, User } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { getWisudawanByNim } from "@/actions/wisudawan";

export default function AuthPage() {
  const [nim, setNim] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [showCheckModal, setShowCheckModal] = useState(false);
  const [checkNim, setCheckNim] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [waLink, setWaLink] = useState("628119429035");

  useEffect(() => {
    async function fetchWa() {
      try {
        const { getSetting } = await import('@/actions/settings');
        const wa = await getSetting('contact_wa', '+62 811 9429 035');
        setWaLink(wa.replace(/\D/g, ''));
      } catch (error) {
        console.error("Failed to fetch wa link", error);
      }
    }
    fetchWa();
  }, []);

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { loginWisudawan } = await import('@/actions/wisudawan');
      const result = await loginWisudawan(nim.trim(), password);

      if (result.success && result.data) {
        if (result.isDefaultPassword) {
          // Password masih default → wajib setup akun dulu
          router.push(`/setup/${result.data.nim}`);
        } else {
          // Password sudah dikustomisasi → langsung ke profil
          router.push(`/wisudawan/${result.data.nim}`);
        }
      } else {
        setIsLoading(false);
        setError(result.error || "Login gagal.");
      }
    } catch (err) {
      setIsLoading(false);
      setError("Terjadi kesalahan pada server. Coba lagi.");
    }
  };

  const handleCheckNim = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckResult(null);
    setIsChecking(true);

    try {
      const { cekStatusNim } = await import('@/actions/wisudawan');
      const res = await cekStatusNim(checkNim.trim());
      setCheckResult({
        type: res.success ? 'success' : 'error',
        message: res.error || res.message || ''
      });
    } catch (err) {
      setCheckResult({ type: 'error', message: 'Terjadi kesalahan. Coba lagi.' });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--color-bg)]">
      {/* Mesh Gradient Background sama seperti Hero */}
      <div
        className="absolute inset-0 text-slate-900 dark:text-white opacity-[0.04] dark:opacity-[0.05]"
        style={{
          backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute top-20 left-[10%] w-72 h-72 rounded-full bg-emerald-800/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-20 right-[10%] w-80 h-80 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />

      {/* Top Bar for Back button and Theme Toggle */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors bg-[var(--color-surface)] px-4 py-2 rounded-full border border-[var(--color-border)] shadow-sm backdrop-blur-md"
        >
          <ArrowLeft size={16} />
          Kembali ke Beranda
        </Link>
        <ThemeToggle isScrolled={false} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md px-6"
      >
        {/* Card Container */}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] backdrop-blur-2xl rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">

          {/* Decorative element */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mx-auto mb-4">
              <Image src="/logo.png" alt="Logo" width={56} height={56} className="drop-shadow-sm" />
            </div>
            <h1 className="text-2xl font-bold font-[var(--font-outfit)] text-[var(--color-text)] mb-2">
              Wisudawan IAIN Bone
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-[var(--color-text-muted)] opacity-70" />
              </div>
              <input
                type="text"
                id="nim"
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none"
                placeholder="Masukkan NIM Anda"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-[var(--color-text-muted)] opacity-70" />
              </div>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none"
                placeholder="Masukkan Password Anda"
                required
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-400 text-sm px-4 py-3 rounded-xl">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 group relative flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-white text-sm font-bold transition-all duration-300 shadow-lg shadow-emerald-900/20 bg-emerald-800 hover:bg-emerald-900 overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span className="relative z-10 flex items-center gap-2">
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Memproses...
                  </>
                ) : (
                  <>
                    Masuk Portal
                    <ArrowLeft className="w-4 h-4 rotate-180 transform group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
              {!isLoading && (
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              )}
            </button>
          </form>

          {/* Check NIM Feature */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => { setShowCheckModal(true); setCheckResult(null); setCheckNim(""); }}
              className="w-full py-3 px-4 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 text-sm font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors flex items-center justify-center gap-2"
            >
              Cek Status Pendaftaran kamu
            </button>
          </div>

          {/* Footer Card */}
          <div className="mt-8 pt-6 border-t border-[var(--color-border)] text-center">
            <p className="text-xs text-[var(--color-text-subtle)]">
              Mengalami kendala? <a href={`https://wa.me/${waLink}`} className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium">Hubungi Layanan Akademik</a>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Check NIM Modal / Toast Modal */}
      {showCheckModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-2xl shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-[var(--color-border)] pb-3">
              <h3 className="font-bold text-lg text-[var(--color-text)]">Cek Status Pendaftaran</h3>
              <button onClick={() => setShowCheckModal(false)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 opacity-70 hover:opacity-100 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleCheckNim} className="flex flex-col gap-3">
              <label htmlFor="checkNim" className="text-sm font-medium text-[var(--color-text-muted)]">Masukkan NIM Anda:</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  id="checkNim"
                  value={checkNim}
                  onChange={(e) => setCheckNim(e.target.value)}
                  className="w-full sm:flex-1 px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none"
                  placeholder="Contoh: 19010..."
                  required
                />
                <button
                  type="submit"
                  disabled={isChecking}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold disabled:opacity-70 flex items-center justify-center min-w-[140px]"
                >
                  {isChecking ? <span className="animate-spin text-xl leading-none">⟳</span> : "Cek Pendaftaran"}
                </button>
              </div>
            </form>

            {checkResult && (
              <div className={`mt-2 p-4 rounded-xl border flex gap-3 text-sm animate-in slide-in-from-top-2 ${checkResult.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                }`}>
                <div className="mt-0.5 shrink-0">
                  {checkResult.type === 'success'
                    ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                    : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>}
                </div>
                <p className="leading-relaxed">{checkResult.message}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
