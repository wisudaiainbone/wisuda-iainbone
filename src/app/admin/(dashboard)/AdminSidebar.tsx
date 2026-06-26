"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Users, Settings,
  ShieldCheck, ClipboardList, ChevronLeft, ChevronRight, Calendar, Shirt, Building2, FileEdit, Trophy, UserCheck, Ticket, BookOpen,
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

type Props = {
  namaAdmin: string;
  role: AdminRole;
  roleMeta: { label: string; description: string; color: string; icon: string; };
  pendingPerbaikanCount?: number;
};

export default function AdminSidebar({ namaAdmin, role, roleMeta, pendingPerbaikanCount }: Props) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const navLinks = [
    { href: "/admin/informasi", icon: Info, label: "Informasi", show: canViewInformasi(role) },
    { href: "/admin", icon: LayoutDashboard, label: "Statistik", show: true, exact: true },
    { href: "/admin/periode", icon: Calendar, label: "Periode", show: canManagePeriode(role) },
    { href: "/admin/wisudawan", icon: User, label: "Wisudawan", show: canManageWisudawan(role) },
    { href: "/admin/toga", icon: GraduationCap, label: "Toga", show: canManageToga(role) },
    { href: "/admin/prestasi", icon: Trophy, label: "Prestasi", show: canManageWisudawan(role) },
    { href: "/admin/kehadiran", icon: QrCode, label: "Kehadiran", show: canDoAbsensi(role) },
    { href: "/admin/tamu", icon: Ticket, label: "Tamu", show: canManageTamu(role) },
    { href: "/admin/perbaikan", icon: Hammer, label: "Perbaikan", show: canManageWisudawan(role), badge: pendingPerbaikanCount },
    { href: "/admin/fakultas", icon: Building2, label: "Fakultas", show: canManageFakultas(role) },
    { href: "/admin/manajemen-admin", icon: ShieldCheck, label: "Admin", show: canManageAdmins(role) },
    { href: "/admin/pengaturan", icon: Settings, label: "Pengaturan", show: canManagePengaturan(role) },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 200 }}
      className="bg-[var(--color-surface)] border-r border-[var(--color-border)] hidden md:flex flex-col relative z-20 shrink-0 h-screen sticky top-0"
    >
      {/* Header */}
      <div className={`px-5 border-b border-[var(--color-border)] flex flex-col ${isCollapsed ? 'items-center px-2' : ''} h-14 justify-center`}>
        <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
          <Image
            src="/logo.png"
            alt="Logo IAIN Bone"
            width={isCollapsed ? 28 : 24}
            height={isCollapsed ? 28 : 24}
            className="shrink-0"
          />
          {!isCollapsed && (
            <h2 className="text-base font-medium font-[var(--font-outfit)] truncate text-[var(--color-text)]">
              Admin Wisuda
            </h2>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className={`flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1 ${isCollapsed ? 'px-2' : ''}`}>
        {navLinks.filter(link => link.show).map((link) => {
          const isActive = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              prefetch={true}
              title={isCollapsed ? link.label : undefined}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text)]'
                } ${isCollapsed ? 'justify-center' : ''}`}
            >
              <div className="relative flex items-center justify-center">
                <link.icon size={18} className="shrink-0" />
                {isCollapsed && link.badge && link.badge > 0 ? (
                   <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[var(--color-surface)]"></span>
                ) : null}
              </div>
              {!isCollapsed && <span className="truncate flex-1">{link.label}</span>}
              {!isCollapsed && link.badge && link.badge > 0 ? (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white shrink-0">
                  {link.badge > 99 ? '99+' : link.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Toggle Sidebar Button di Bawah */}
      <div className={`p-3 mt-auto border-t border-[var(--color-border)] flex ${isCollapsed ? 'justify-center' : 'justify-end'}`}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Perluas Sidebar" : "Ciutkan Sidebar"}
          className="w-8 h-8 bg-emerald-500 hover:bg-emerald-600 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110 active:scale-95"
        >
          {isCollapsed ? <ChevronRight size={16} className="ml-0.5" /> : <ChevronLeft size={16} className="mr-0.5" />}
        </button>
      </div>
    </motion.aside>
  );
}

