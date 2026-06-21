"use client";

import { Search, Filter, X } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect, useRef } from "react";

export default function WisudawanSearch({ fakultasList, prodiList, statusList = [], children }: { fakultasList: string[], prodiList: string[], statusList?: string[], children?: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [fakultas, setFakultas] = useState(searchParams.get("fakultas") || "");
  const [prodi, setProdi] = useState(searchParams.get("prodi") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [toga, setToga] = useState(searchParams.get("toga") || "");
  const [hadir, setHadir] = useState(searchParams.get("hadir") || "");
  const [ambilToga, setAmbilToga] = useState(searchParams.get("ambil_toga") || "");
  const [sesi, setSesi] = useState(searchParams.get("sesi") || "");

  // Gunakan useRef untuk mencegah efek berjalan pada render pertama
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      
      const currentQ = searchParams.get("q") || "";
      const currentF = searchParams.get("fakultas") || "";
      const currentP = searchParams.get("prodi") || "";
      const currentS = searchParams.get("status") || "";
      const currentToga = searchParams.get("toga") || "";
      const currentHadir = searchParams.get("hadir") || "";
      const currentAmbilToga = searchParams.get("ambil_toga") || "";
      const currentSesi = searchParams.get("sesi") || "";

      if (searchTerm === currentQ && fakultas === currentF && prodi === currentP && status === currentS && toga === currentToga && hadir === currentHadir && ambilToga === currentAmbilToga && sesi === currentSesi) {
        return;
      }

      if (searchTerm) params.set("q", searchTerm); else params.delete("q");
      if (fakultas) params.set("fakultas", fakultas); else params.delete("fakultas");
      if (prodi) params.set("prodi", prodi); else params.delete("prodi");
      if (status) params.set("status", status); else params.delete("status");
      if (toga) params.set("toga", toga); else params.delete("toga");
      if (hadir) params.set("hadir", hadir); else params.delete("hadir");
      if (ambilToga) params.set("ambil_toga", ambilToga); else params.delete("ambil_toga");
      if (sesi) params.set("sesi", sesi); else params.delete("sesi");
      
      // Reset page to 1 when filters change
      params.delete("page");
      
      // Keep existing sort params if any
      
      startTransition(() => {
        router.replace(`?${params.toString()}`);
      });
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, fakultas, prodi, status, toga, hadir, ambilToga, sesi]);

  const handleReset = () => {
    setSearchTerm("");
    setFakultas("");
    setProdi("");
    setStatus("");
    setToga("");
    setHadir("");
    setAmbilToga("");
    setSesi("");
    startTransition(() => {
      router.replace(pathname);
    });
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 w-full">
        <div className="flex items-center gap-2 flex-1 w-full">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className={`h-4 w-4 ${isPending ? 'text-emerald-500 animate-pulse' : 'text-[var(--color-text-muted)]'}`} />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari NIM atau Nama..."
              className="w-full pl-9 pr-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none h-10"
            />
          </div>
          {(searchTerm || fakultas || prodi || status || toga || hadir || ambilToga || sesi) && (
            <button
              onClick={handleReset}
              title="Reset Filter"
              className="w-10 h-10 shrink-0 flex items-center justify-center bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 text-rose-500 rounded-xl transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
        {children && (
          <div className="flex items-center gap-2 w-full xl:w-auto overflow-x-auto pb-1 xl:pb-0 hide-scrollbar shrink-0">
            {children}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 w-full">
        {fakultasList.length > 0 && (
          <select
            value={fakultas}
            onChange={(e) => setFakultas(e.target.value)}
            className="flex-1 min-w-[160px] pl-3 pr-10 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none h-10 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207l5%205%205-5%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.75rem_center] bg-no-repeat"
          >
            <option value="">Semua Fakultas</option>
            {fakultasList.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        )}

        {prodiList.length > 0 && (
          <select
            value={prodi}
            onChange={(e) => setProdi(e.target.value)}
            className="flex-1 min-w-[160px] pl-3 pr-10 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none h-10 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207l5%205%205-5%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.75rem_center] bg-no-repeat"
          >
            <option value="">Semua Prodi</option>
            {prodiList.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        )}

        {statusList.length > 0 && (
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="flex-1 min-w-[160px] pl-3 pr-10 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none h-10 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207l5%205%205-5%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.75rem_center] bg-no-repeat"
          >
            <option value="">Semua Status</option>
            {statusList.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}

        <select
          value={toga}
          onChange={(e) => setToga(e.target.value)}
            className="flex-1 min-w-[160px] pl-3 pr-10 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none h-10 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207l5%205%205-5%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.75rem_center] bg-no-repeat"
        >
          <option value="">Semua Data Toga</option>
          <option value="sudah">Sudah Isi Data Toga</option>
          <option value="belum">Belum Isi Data Toga</option>
        </select>

        <select
          value={ambilToga}
          onChange={(e) => setAmbilToga(e.target.value)}
            className="flex-1 min-w-[160px] pl-3 pr-10 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none h-10 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207l5%205%205-5%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.75rem_center] bg-no-repeat"
        >
          <option value="">Semua Status Pengambilan Toga</option>
          <option value="sudah">Sudah Ambil Toga</option>
          <option value="belum">Belum Ambil Toga</option>
        </select>

        <select
          value={hadir}
          onChange={(e) => setHadir(e.target.value)}
            className="flex-1 min-w-[160px] pl-3 pr-10 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none h-10 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207l5%205%205-5%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.75rem_center] bg-no-repeat"
        >
          <option value="">Semua Kehadiran</option>
          <option value="sudah">Hadir</option>
          <option value="belum">Belum/Tidak Hadir</option>
        </select>

        <select
          value={sesi}
          onChange={(e) => setSesi(e.target.value)}
            className="flex-1 min-w-[160px] pl-3 pr-10 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none h-10 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207l5%205%205-5%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.75rem_center] bg-no-repeat"
        >
          <option value="">Semua Sesi</option>
          <option value="Sesi Satu">Sesi Satu</option>
          <option value="Sesi Dua">Sesi Dua</option>
          <option value="Tanpa Sesi">Tanpa Sesi</option>
        </select>
      </div>
    </div>
  );
}
