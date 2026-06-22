"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Settings, Menu, X,
  ShieldCheck, Calendar, Shirt, Building2, FileEdit, Trophy, UserCheck, Ticket, BookOpen,
  Info, GraduationCap, QrCode, Hammer, User
} from "lucide-react";
import {
  canManageAdmins,
  canManagePengaturan,
  canManagePeriode,
  canManageWisudawan,
  canManageToga,
  canDoAbsensi,
  canManageFakultas,
  canManageTamu,
  canViewInformasi,
  type AdminRole,
} from "@/lib/permissions";
import Image from "next/image";

type Props = {
  role: AdminRole;
};

export default function AdminBottomNav({ role }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleOpenMenu = () => setIsMobileMenuOpen(true);
    window.addEventListener("openMobileMenu", handleOpenMenu);
    return () => window.removeEventListener("openMobileMenu", handleOpenMenu);
  }, []);

  const isScanTab = searchParams.get("tab") === "scan" || pathname.startsWith("/admin/kehadiran");

  const navLinks = [
    { href: "/admin/informasi", icon: Info, label: "Informasi", show: canViewInformasi(role) },
    { href: "/admin", icon: LayoutDashboard, label: "Statistik", show: true, exact: true },
    { href: "/admin/periode", icon: Calendar, label: "Periode", show: canManagePeriode(role) },
    { href: "/admin/wisudawan", icon: User, label: "Wisudawan", show: canManageWisudawan(role) },
    { href: "/admin/toga", icon: GraduationCap, label: "Toga", show: canManageToga(role) },
    { href: "/admin/prestasi", icon: Trophy, label: "Prestasi", show: canManageWisudawan(role) },
    { href: "/admin/kehadiran", icon: QrCode, label: "Kehadiran", show: canDoAbsensi(role) },
    { href: "/admin/tamu", icon: Ticket, label: "Tamu", show: canManageTamu(role) },
    { href: "/admin/perbaikan", icon: Hammer, label: "Perbaikan", show: canManageWisudawan(role) },
    { href: "/admin/fakultas", icon: Building2, label: "Fakultas", show: canManageFakultas(role) },
    { href: "/admin/manajemen-admin", icon: ShieldCheck, label: "Admin", show: canManageAdmins(role) },
    { href: "/admin/pengaturan", icon: Settings, label: "Pengaturan", show: canManagePengaturan(role) },
  ];

  const visibleLinks = navLinks.filter(link => link.show);
  const isWisudawanActive = pathname.startsWith("/admin/wisudawan");
  const isPerbaikanActive = pathname.startsWith("/admin/perbaikan");
  const isPengaturanActive = pathname.startsWith("/admin/pengaturan");
  const isBerandaActive = pathname === "/admin";

  return (
    <>
      {/* Overlay Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Sidebar Panel */}
          <div className="relative w-[75vw] max-w-[300px] bg-[var(--color-surface)] h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="flex-1 overflow-y-auto p-4 space-y-1 pb-20">
              {visibleLinks.map((link) => {
                const isActive = link.exact
                  ? pathname === link.href
                  : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch={true}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                        : "text-[var(--color-text-muted)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text)]"
                    }`}
                  >
                    <link.icon size={20} className={isActive ? "text-emerald-600 dark:text-emerald-400" : "opacity-70"} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className={`md:hidden ${isScanTab ? 'hidden' : 'fixed'} bottom-0 left-0 right-0 h-16 md:h-[72px] bg-[var(--color-surface)] border-t border-[var(--color-border)] z-50 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.04)]`}>
        <div className="flex items-center h-[60px] max-w-md mx-auto relative px-1">
          
          {canManageWisudawan(role) && (
            <Link
              href="/admin/wisudawan"
              prefetch={true}
              className={`flex-1 flex flex-col items-center justify-center gap-1 h-full relative transition-colors active:scale-95 ${
                isWisudawanActive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              {isWisudawanActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-emerald-500 rounded-b-full shadow-[0_2px_8px_rgba(16,185,129,0.5)]" />
              )}
              <User size={20} className={isWisudawanActive ? "animate-in zoom-in duration-300" : ""} />
              <span className="text-[10px] font-semibold leading-none">Wisudawan</span>
            </Link>
          )}

          {canManageWisudawan(role) && (
            <Link
              href="/admin/perbaikan"
              prefetch={true}
              className={`flex-1 flex flex-col items-center justify-center gap-1 h-full relative transition-colors active:scale-95 ${
                isPerbaikanActive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              {isPerbaikanActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-emerald-500 rounded-b-full shadow-[0_2px_8px_rgba(16,185,129,0.5)]" />
              )}
              <Hammer size={20} className={isPerbaikanActive ? "animate-in zoom-in duration-300" : ""} />
              <span className="text-[10px] font-semibold leading-none">Perbaikan</span>
            </Link>
          )}

          {canManagePengaturan(role) && (
            <Link
              href="/admin/pengaturan"
              prefetch={true}
              className={`flex-1 flex flex-col items-center justify-center gap-1 h-full relative transition-colors active:scale-95 ${
                isPengaturanActive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              {isPengaturanActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-emerald-500 rounded-b-full shadow-[0_2px_8px_rgba(16,185,129,0.5)]" />
              )}
              <Settings size={20} className={isPengaturanActive ? "animate-in zoom-in duration-300" : ""} />
              <span className="text-[10px] font-semibold leading-none">Pengaturan</span>
            </Link>
          )}

          {role === 'admin_unit' && (
            <Link
              href="/admin"
              prefetch={true}
              className={`flex-1 flex flex-col items-center justify-center gap-1 h-full relative transition-colors active:scale-95 ${
                isBerandaActive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              {isBerandaActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-emerald-500 rounded-b-full shadow-[0_2px_8px_rgba(16,185,129,0.5)]" />
              )}
              <LayoutDashboard size={20} className={isBerandaActive ? "animate-in zoom-in duration-300" : ""} />
              <span className="text-[10px] font-semibold leading-none">Statistik</span>
            </Link>
          )}

          {/* Menu Button - Right */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-1 h-full text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors active:scale-95"
          >
            <Menu size={20} />
            <span className="text-[10px] font-semibold leading-none">Menu</span>
          </button>
        </div>
      </nav>
    </>
  );
}
