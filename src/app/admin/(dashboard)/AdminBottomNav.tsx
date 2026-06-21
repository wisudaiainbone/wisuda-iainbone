"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/admin", icon: LayoutDashboard, label: "Beranda", show: true, exact: true },
    { href: "/admin/informasi", icon: Info, label: "Informasi", show: canViewInformasi(role) },
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
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {visibleLinks.map((link) => {
                const isActive = link.exact
                  ? pathname === link.href
                  : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all ${
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

      {/* Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[var(--color-surface)] border-t border-[var(--color-border)] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center h-[60px] max-w-md mx-auto relative px-2">
          {/* Beranda Button - Left */}
          <Link
            href="/admin"
            className={`flex-1 flex flex-col items-center justify-center gap-1 h-full relative transition-colors active:scale-95 ${
              isBerandaActive
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            {isBerandaActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-[3px] bg-emerald-500 rounded-b-full shadow-[0_2px_8px_rgba(16,185,129,0.5)]" />
            )}
            <LayoutDashboard size={22} className={isBerandaActive ? "animate-in zoom-in duration-300" : ""} />
            <span className="text-[10px] font-semibold leading-none">Beranda</span>
          </Link>

          {/* Divider */}
          <div className="w-[1px] h-8 bg-[var(--color-border)]" />
          
          {/* Menu Button - Right */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-1 h-full text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors active:scale-95"
          >
            <Menu size={22} />
            <span className="text-[10px] font-semibold leading-none">Menu</span>
          </button>
        </div>
      </nav>
    </>
  );
}
