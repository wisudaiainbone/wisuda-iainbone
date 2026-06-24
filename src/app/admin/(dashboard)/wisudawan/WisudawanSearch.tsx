"use client";

import { Search, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface WisudawanSearchProps {
  fakultasList: string[];
  prodiList: string[];
  statusList?: string[];
  onSearch?: (filters: any) => void;
  children?: React.ReactNode;
}

export default function WisudawanSearch({ fakultasList, prodiList, statusList = [], onSearch, children }: WisudawanSearchProps) {
  const [showFilters, setShowFilters] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [fakultas, setFakultas] = useState("");
  const [prodi, setProdi] = useState("");
  const [status, setStatus] = useState("");
  const [toga, setToga] = useState("");
  const [hadir, setHadir] = useState("");
  const [ambilToga, setAmbilToga] = useState("");
  const [sesi, setSesi] = useState("");

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    if (onSearch) {
      onSearch({
        q: searchTerm,
        fakultas,
        prodi,
        status,
        toga,
        hadir,
        ambilToga,
        sesi
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fakultas, prodi, status, toga, hadir, ambilToga, sesi]);

  const handleApply = () => {
    if (onSearch) {
      onSearch({
        q: searchTerm,
        fakultas,
        prodi,
        status,
        toga,
        hadir,
        ambilToga,
        sesi
      });
    }
  };

  const handleReset = () => {
    setSearchTerm("");
    setFakultas("");
    setProdi("");
    setStatus("");
    setToga("");
    setHadir("");
    setAmbilToga("");
    setSesi("");
    if (onSearch) {
      onSearch({
        q: "",
        fakultas: "",
        prodi: "",
        status: "",
        toga: "",
        hadir: "",
        ambilToga: "",
        sesi: ""
      });
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 w-full">
        <div className="flex items-center gap-2 flex-1 w-full">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-[var(--color-text-muted)]" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleApply();
                }
              }}
              placeholder="Cari NIM atau Nama..."
              className="w-full pl-9 pr-12 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none h-10"
            />
            <button
              onClick={handleApply}
              title="Cari"
              className="absolute inset-y-1 right-1 w-8 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-sm"
            >
              <Search size={14} />
            </button>
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
          <div className="hidden xl:flex flex-row flex-wrap items-center gap-2 shrink-0">
            {children}
          </div>
        )}
      </div>

      {/* Mobile Filter Toggle */}
      <button 
        onClick={() => setShowFilters(!showFilters)}
        className="xl:hidden flex items-center justify-between w-full px-4 h-10 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] transition-colors shadow-sm"
      >
        <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
          <Filter size={16} />
          <span className="text-[var(--color-text)]">Filter Data</span>
        </div>
        {showFilters ? <ChevronUp size={16} className="text-[var(--color-text-muted)]" /> : <ChevronDown size={16} className="text-[var(--color-text-muted)]" />}
      </button>

      {/* Filters Area */}
      <div className={`flex flex-col gap-3 ${showFilters ? 'flex' : 'hidden'} xl:flex w-full animate-in fade-in slide-in-from-top-2 duration-200`}>
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

      {/* Mobile Action Buttons (Below Filters) */}
      {children && (
        <div className="xl:hidden flex flex-row flex-wrap items-stretch gap-2 w-full shrink-0 [&>*]:flex-auto [&>*]:sm:flex-none">
          {children}
        </div>
      )}
    </div>
  );
}

