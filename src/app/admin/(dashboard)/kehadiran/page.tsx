import { getScanMeta } from "@/actions/scanCache";
import ScanKehadiranClient from "./ScanKehadiranClient";
import AbsensiLogin from "./AbsensiLogin";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { getSetting } from "@/actions/settings";

export default async function AdminKehadiranPage() {
  const [session, cookieStore, allowAbsensiLogin] = await Promise.all([
    getServerSession(authOptions),
    cookies(),
    getSetting('allow_absensi_login', 'true', true)
  ]);
  const absensiToken = cookieStore.get('absensi_token')?.value;

  // Jika pengaturan login absensi dinonaktifkan dan user tidak memiliki NextAuth session
  if (!session && allowAbsensiLogin !== 'true') {
    const { ShieldAlert } = await import('lucide-react');
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center h-[80vh] animate-in fade-in zoom-in-95 duration-500">
        <div className="mb-6 p-6 bg-red-100/50 dark:bg-red-900/20 rounded-full border border-red-200/50 dark:border-red-800/30">
          <ShieldAlert size={64} className="text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-4 font-[var(--font-outfit)]">
          Akses Ditutup
        </h2>
        <p className="text-[var(--color-text-subtle)] max-w-md mx-auto leading-relaxed text-lg">
          Akses Perekaman Kehadiran Wisuda belum diberikan, silakan hubungi admin.
        </p>
      </div>
    );
  }

  // Jika diizinkan tapi tidak login NextAuth dan tidak ada cookie khusus absensi, render Form Login
  if (!session && !absensiToken) {
    return <AbsensiLogin />;
  }

  const meta = await getScanMeta('undangan');
  const isPresensiOnly = !session && !!absensiToken;

  return (
    <div className="space-y-6">
      <ScanKehadiranClient initialMeta={meta} isPresensiOnly={isPresensiOnly} />
    </div>
  );
}
