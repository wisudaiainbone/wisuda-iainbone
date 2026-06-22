import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-[60vh] gap-4 animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center">
        <div className="absolute w-16 h-16 border-4 border-emerald-100 dark:border-emerald-900/30 rounded-full"></div>
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
      <p className="text-sm font-medium text-[var(--color-text-muted)] animate-pulse">
        Memuat halaman...
      </p>
    </div>
  );
}
