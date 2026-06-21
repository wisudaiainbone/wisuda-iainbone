"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

type Props = {
  namaAdmin: string;
  roleMeta: { label: string; description: string; color: string; icon: string; };
};

export default function AdminProfileMenu({ namaAdmin, roleMeta }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    // Bersihkan cookie absensi token jika ada
    const { logoutAbsensi } = await import('@/actions/absensiAuth');
    await logoutAbsensi();
    
    // Signout NextAuth
    await signOut({ callbackUrl: '/admin/login' });
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-9 h-9 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:ring-2 hover:ring-emerald-500/50 transition-all font-bold text-sm overflow-hidden"
        title={namaAdmin}
      >
        <span className={roleMeta.color.split(' ').find(c => c.startsWith('text-') && !c.includes('dark:')) || 'text-[var(--color-text)]'}>
          {namaAdmin.charAt(0).toUpperCase()}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="px-4 py-3 border-b border-[var(--color-border)]">
            <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5">Login sebagai</p>
            <p className="text-sm font-bold text-[var(--color-text)] truncate">{namaAdmin}</p>
            <p className="text-xs text-[var(--color-text-subtle)] mt-1 leading-snug">{roleMeta.description}</p>
          </div>
          <div className="px-2 py-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-rose-600 font-bold rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
            >
              <LogOut size={16} />
              Keluar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
