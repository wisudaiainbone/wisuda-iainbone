"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";

export default function AdminLogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    // Bersihkan cookie absensi token jika ada
    const { logoutAbsensi } = await import('@/actions/absensiAuth');
    await logoutAbsensi();
    
    // Signout NextAuth
    await signOut({ callbackUrl: '/admin/login' });
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-full sm:rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
      title="Keluar"
    >
      <LogOut size={16} />
      <span className="hidden sm:inline sm:ml-1.5">{isLoading ? "Keluar..." : "Keluar"}</span>
    </button>
  );
}
