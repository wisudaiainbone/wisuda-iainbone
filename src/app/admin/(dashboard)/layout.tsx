import { ReactNode } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { getAdminSession } from "@/actions/adminAuth";
import { ROLE_META, type AdminRole } from "@/lib/permissions";
import AdminSidebar from "./AdminSidebar";
import HeaderTitle from "./HeaderTitle";
import AdminProfileMenu from "./AdminProfileMenu";
import AdminLogoutButton from "./AdminLogoutButton";
import AbsensiLogoutButton from "./AbsensiLogoutButton";
import AdminBottomNav from "./AdminBottomNav";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const adminSession = await getAdminSession();
  const cookieStore = await cookies();
  const absensiToken = cookieStore.get('absensi_token')?.value;

  // JIKA ADMIN MEMILIKI SESSION (NextAuth) -> Layout Lengkap
  if (adminSession) {
    const role = (adminSession.role ?? "admin_unit") as AdminRole;
    const roleMeta = ROLE_META[role];
    const namaAdmin = adminSession.nama ?? "Admin";

    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col md:flex-row font-sans">
        {/* Sidebar — desktop only */}
        <AdminSidebar namaAdmin={namaAdmin} role={role} roleMeta={roleMeta} />

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center px-6 sticky top-0 z-10 gap-4">
            {/* Mobile brand */}
            <div className="md:hidden font-medium text-[var(--color-text)] flex items-center gap-2">
              <Image src="/logo.png" alt="Logo" width={22} height={22} className="drop-shadow-sm" />
              Admin Wisuda
            </div>
            <HeaderTitle />
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <span className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${roleMeta.color}`}>
                {roleMeta.icon} {roleMeta.label}
              </span>
              <AdminLogoutButton />
              <AdminProfileMenu namaAdmin={namaAdmin} roleMeta={roleMeta} />
              <ThemeToggle isScrolled={false} />
            </div>
          </header>
          <div className="flex-1 p-6 pb-24 md:pb-6">
            {children}
          </div>
        </main>

        {/* Bottom Nav — mobile only */}
        <AdminBottomNav role={role} />
      </div>
    );
  }

  // JIKA TANPA SESSION + TOKEN ADA -> Layout Minimalis (sudah login absensi)
  if (absensiToken) {
    const roleMeta = ROLE_META['admin_absensi'];
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col font-sans">
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center px-6 sticky top-0 z-10 gap-4">
            <div className="font-bold text-[var(--color-text)] flex items-center gap-2">
              <Image src="/logo.png" alt="Logo" width={24} height={24} className="drop-shadow-sm" />
              <span className="hidden sm:inline">Presensi Wisuda IAIN Bone</span>
              <span className="sm:hidden">Admin Presensi</span>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <span className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${roleMeta.color}`}>
                {roleMeta.icon} Admin Presensi
              </span>
              <Link href="/admin/tamu?tab=scan" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border)] text-[var(--color-text)] rounded-lg text-xs font-bold transition-colors">
                Tamu VIP
              </Link>
              <AbsensiLogoutButton />
              <ThemeToggle isScrolled={false} />
            </div>
          </header>
          <div className="flex-1 p-6">
            {children}
          </div>
        </main>
      </div>
    );
  }

  // JIKA TANPA SESSION + TANPA TOKEN -> Render langsung (AbsensiLogin/error punya layout sendiri)
  return <>{children}</>;
}
