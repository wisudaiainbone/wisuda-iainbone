"use client";

import { LogOut } from "lucide-react";
import { logoutAbsensi } from "@/actions/absensiAuth";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AbsensiLogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    await logoutAbsensi();
    // Refresh agar token dihapus dan diarahkan ke form login/error
    window.location.reload();
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
    >
      <LogOut size={16} />
      {isLoading ? "Keluar..." : "Keluar"}
    </button>
  );
}
