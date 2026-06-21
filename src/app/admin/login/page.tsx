"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ArrowLeft, AlertTriangle } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { signIn } from "next-auth/react";

import Image from "next/image";

function AdminLoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const searchParams = useSearchParams();

  // Pesan error dari middleware atau NextAuth
  const urlError = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";

  useEffect(() => {
    if (urlError === "unauthorized" || urlError === "AccessDenied" || urlError === "OAuthCallback") {
      setErrorMsg("Akun anda tidak terdaftar sebagai Admin Wisuda IAIN Bone, hubungi Admin Utama Wisuda IAIN Bone.");
    } else if (urlError) {
      setErrorMsg(`Gagal login: ${urlError}`);
    }
  }, [urlError]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      await signIn("google", { callbackUrl });
    } catch (error) {
      setErrorMsg("Terjadi kesalahan saat menghubungi Google.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--color-bg)]">
      {/* Background Grid */}
      <div
        className="absolute inset-0 text-slate-900 dark:text-white opacity-[0.03] dark:opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute top-1/4 left-[15%] w-80 h-80 rounded-full bg-slate-500/10 dark:bg-slate-500/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-[15%] w-96 h-96 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 blur-[120px] pointer-events-none" />

      {/* Top Bar */}
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
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-6"
      >
        {/* Card Container */}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] backdrop-blur-3xl rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">

          {/* Decorative stripe */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-600 to-emerald-600" />

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 relative drop-shadow-sm">
              <Image
                src="/logo.png"
                alt="Logo IAIN Bone"
                fill
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-lg sm:text-2xl font-bold font-[var(--font-outfit)] text-[var(--color-text)] mb-2">
              Admin Wisuda IAIN Bone
            </h1>
          </div>

          {/* Warning Message */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-start gap-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-400 text-sm px-4 py-3 rounded-xl mb-5"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Google Login Button */}
          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                  <path fill="none" d="M1 1h22v22H1z" />
                </svg>
              )}
              <span>Login dengan Google</span>
            </button>
          </div>

          {/* Security note */}
          <p className="text-center text-xs text-[var(--color-text-subtle)] mt-6">
            🔒 Dilindungi oleh autentikasi yang aman
          </p>
        </div>
      </motion.div>
    </div>
  );
}


import { Suspense } from "react";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <AdminLoginForm />
    </Suspense>
  );
}
