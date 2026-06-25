"use client";

import { useState } from "react";
import { verifyAbsensiPassword } from "@/actions/absensiAuth";
import { Lock, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import Image from "next/image";

export default function AbsensiLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Password tidak boleh kosong");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await verifyAbsensiPassword(password);
      if (res.success) {
        window.location.reload();
      } else {
        setError(res.error || "Password salah");
      }
    } catch (err: any) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col relative bg-[var(--color-bg)]">
      {/* Grid Background */}
      <div
        className="absolute inset-0 text-slate-900 dark:text-white opacity-[0.04] dark:opacity-[0.05]"
        style={{
          backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute top-20 left-[10%] w-72 h-72 rounded-full bg-emerald-800/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-20 right-[10%] w-80 h-80 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-5 flex justify-between items-center z-50">
        <div className="flex items-center gap-2.5 text-sm font-bold text-[var(--color-text)] bg-[var(--color-surface)] px-4 py-2 rounded-full border border-[var(--color-border)] backdrop-blur-md">
          <Image src="/logo.png" alt="Logo" width={18} height={18} />
          Presensi Wisuda IAIN Bone
        </div>
        <ThemeToggle isScrolled={false} />
      </div>

      {/* Card — centered */}
      <div className="flex-1 flex items-center justify-center relative z-10 px-6">
        <div className="w-full max-w-md">
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] backdrop-blur-2xl rounded-3xl p-8 sm:p-10 relative overflow-hidden">
            {/* Green accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />

            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mx-auto mb-4">
                <Image src="/logo.png" alt="Logo IAIN Bone" width={56} height={56} />
              </div>
              <h1 className="text-2xl font-bold font-[var(--font-outfit)] text-[var(--color-text)] mb-2">
                Presensi Wisuda IAIN Bone
              </h1>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[var(--color-text-muted)] opacity-70" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none"
                  placeholder="Masukkan Password Absensi"
                  required
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-400 text-sm px-4 py-3 rounded-xl">
                  <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 group relative flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-white text-sm font-bold transition-all duration-300-emerald-900/20 bg-emerald-800 hover:bg-emerald-900 overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Memverifikasi...
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

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-[var(--color-border)] text-center">
              <p className="text-xs text-[var(--color-text-subtle)]">
                Hubungi Admin jika tidak mengetahui password akses.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
