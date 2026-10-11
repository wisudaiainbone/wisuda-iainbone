"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, KeyRound, Mail, Lock, Eye, EyeOff,
  CheckCircle2, Loader2, ShieldCheck, RefreshCw
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  requestPasswordReset,
  verifyResetOtp,
  resetPasswordWithOtp,
} from "@/actions/resetPassword";

type Step = "nim" | "otp" | "newpass" | "done";

export default function LupaPasswordPage() {
  const [step, setStep] = useState<Step>("nim");

  // Step 1
  const [nim, setNim] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [isLoadingNim, setIsLoadingNim] = useState(false);
  const [errorNim, setErrorNim] = useState("");

  // Step 2
  const [otp, setOtp] = useState("");
  const [isLoadingOtp, setIsLoadingOtp] = useState(false);
  const [errorOtp, setErrorOtp] = useState("");
  const [isResending, setIsResending] = useState(false);

  // Step 3
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isLoadingPass, setIsLoadingPass] = useState(false);
  const [errorPass, setErrorPass] = useState("");

  // ── Step 1: Request OTP ──
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNim("");
    setIsLoadingNim(true);
    const res = await requestPasswordReset(nim.trim());
    setIsLoadingNim(false);
    if (res.success && res.maskedEmail) {
      setMaskedEmail(res.maskedEmail);
      setStep("otp");
    } else {
      setErrorNim(res.error ?? "Terjadi kesalahan.");
    }
  };

  // ── Step 2: Verify OTP ──
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorOtp("");
    setIsLoadingOtp(true);
    const res = await verifyResetOtp(nim.trim(), otp.trim());
    setIsLoadingOtp(false);
    if (res.success) {
      setStep("newpass");
    } else {
      setErrorOtp(res.error ?? "OTP salah.");
    }
  };

  // ── Step 2: Kirim Ulang OTP ──
  const handleResendOtp = async () => {
    setIsResending(true);
    setErrorOtp("");
    const res = await requestPasswordReset(nim.trim());
    setIsResending(false);
    if (res.success) {
      setOtp("");
      setErrorOtp("");
    } else {
      setErrorOtp(res.error ?? "Gagal mengirim ulang.");
    }
  };

  // ── Step 3: Reset Password ──
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorPass("");
    if (newPassword.length < 6) {
      setErrorPass("Password minimal 6 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorPass("Konfirmasi password tidak cocok.");
      return;
    }
    setIsLoadingPass(true);
    const res = await resetPasswordWithOtp(nim.trim(), newPassword);
    setIsLoadingPass(false);
    if (res.success) {
      setStep("done");
    } else {
      setErrorPass(res.error ?? "Gagal menyimpan password.");
    }
  };

  const STEPS = [
    { key: "nim", label: "Masukkan NIM" },
    { key: "otp", label: "Verifikasi OTP" },
    { key: "newpass", label: "Password Baru" },
  ];
  const currentStepIdx = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--color-bg)]">
      {/* Background grid */}
      <div
        className="absolute inset-0 text-slate-900 dark:text-white opacity-[0.04] dark:opacity-[0.05]"
        style={{
          backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute top-20 left-[10%] w-72 h-72 rounded-full bg-emerald-800/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-20 right-[10%] w-80 h-80 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
        <Link
          href="/auth"
          className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors bg-[var(--color-surface)] px-4 py-2 rounded-full border border-[var(--color-border)] backdrop-blur-md"
        >
          <ArrowLeft size={16} />
          Kembali ke Login
        </Link>
        <ThemeToggle isScrolled={false} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] backdrop-blur-2xl rounded-3xl p-8 sm:p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />

          {/* Logo + Title */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mx-auto mb-4">
              <Image src="/logo.png" alt="Logo" width={48} height={48} />
            </div>
            <h1 className="text-xl font-bold text-[var(--color-text)]">
              Lupa Password
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Wisudawan IAIN Bone
            </p>
          </div>

          <AnimatePresence mode="wait">
            {/* ── STEP 1: NIM ── */}
            {step === "nim" && (
              <motion.div key="nim" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-5">
                  <h2 className="font-bold text-[var(--color-text)] text-sm">Masukkan NIM Anda</h2>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Kode OTP akan dikirim ke email yang terdaftar.
                  </p>
                </div>
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <input
                    type="text"
                    id="nim-reset"
                    value={nim}
                    onChange={(e) => setNim(e.target.value)}
                    placeholder="Masukkan NIM Anda"
                    required
                    className="w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none"
                  />
                  {errorNim && <ErrorBox msg={errorNim} />}
                  <button
                    type="submit"
                    disabled={isLoadingNim}
                    className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isLoadingNim ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                    {isLoadingNim ? "Mengirim OTP..." : "Kirim Kode OTP"}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ── STEP 2: OTP ── */}
            {step === "otp" && (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-5">
                  <h2 className="font-bold text-[var(--color-text)] text-sm">Masukkan Kode OTP</h2>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Kode 6-digit dikirim ke <span className="font-semibold text-[var(--color-text)]">{maskedEmail}</span>. Berlaku 10 menit.
                  </p>
                </div>
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <input
                    type="text"
                    id="otp-input"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    required
                    className="w-full px-4 py-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] text-center text-3xl font-mono font-bold tracking-[0.5em] focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none"
                  />
                  {errorOtp && <ErrorBox msg={errorOtp} />}
                  <button
                    type="submit"
                    disabled={isLoadingOtp || otp.length < 6}
                    className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isLoadingOtp ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                    {isLoadingOtp ? "Memverifikasi..." : "Verifikasi OTP"}
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isResending}
                    className="w-full py-2 text-xs text-[var(--color-text-muted)] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isResending ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                    {isResending ? "Mengirim ulang..." : "Kirim ulang kode OTP"}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ── STEP 3: Password Baru ── */}
            {step === "newpass" && (
              <motion.div key="newpass" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-5">
                  <h2 className="font-bold text-[var(--color-text)] text-sm">Buat Password Baru</h2>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">Minimal 6 karakter.</p>
                </div>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      id="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Password baru"
                      required
                      minLength={6}
                      className="w-full pl-4 pr-10 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <input
                    type={showPass ? "text" : "password"}
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Konfirmasi password"
                    required
                    className="w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none"
                  />
                  {errorPass && <ErrorBox msg={errorPass} />}
                  <button
                    type="submit"
                    disabled={isLoadingPass}
                    className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isLoadingPass ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                    {isLoadingPass ? "Menyimpan..." : "Simpan Password Baru"}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ── DONE ── */}
            {step === "done" && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="font-bold text-[var(--color-text)] text-lg mb-2">Password Berhasil Diubah!</h2>
                <p className="text-sm text-[var(--color-text-muted)] mb-6">
                  Silakan login menggunakan password baru Anda.
                </p>
                <Link
                  href="/auth"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm transition-colors"
                >
                  <ArrowLeft size={16} />
                  Kembali ke Halaman Login
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-400 text-xs px-4 py-3 rounded-xl">
      <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{msg}</span>
    </div>
  );
}
