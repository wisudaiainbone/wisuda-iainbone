"use client";

import { useState, useMemo } from "react";
import { type ArsipWisudawan } from "@/lib/arsipUtils";
import { Search, Filter, GraduationCap, X } from "lucide-react";

type Props = {
  data: ArsipWisudawan[];
};

export default function ArsipWisudawanTable({ data }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [fakultasFilter, setFakultasFilter] = useState("Semua");
  const [prodiFilter, setProdiFilter] = useState("Semua");
  const [sesiFilter, setSesiFilter] = useState("Semua");

  const listFakultas = ["Semua", ...Array.from(new Set(data.map(w => w.fakultas).filter((f): f is string => Boolean(f)))).sort()];
  const listProdi = ["Semua", ...Array.from(new Set(data.map(w => w.prodi).filter((p): p is string => Boolean(p)))).sort()];
  const listSesi = ["Semua", ...Array.from(new Set(data.map(w => w.sesi).filter((s): s is string => Boolean(s)))).sort()];

  const filteredData = useMemo(() => {
    return data.filter(w => {
      const matchSearch =
        (w.nim?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (w.nama_mahasiswa?.toLowerCase() || "").includes(searchQuery.toLowerCase());
      const matchFakultas = fakultasFilter === "Semua" || w.fakultas === fakultasFilter;
      const matchProdi = prodiFilter === "Semua" || w.prodi === prodiFilter;
      const matchSesi = sesiFilter === "Semua" || w.sesi === sesiFilter;
      return matchSearch && matchFakultas && matchProdi && matchSesi;
    });
  }, [data, searchQuery, fakultasFilter, prodiFilter, sesiFilter]);

  return (
    <div className="space-y-4">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Cari NIM atau Nama..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <select value={fakultasFilter} onChange={e => setFakultasFilter(e.target.value)} className="px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl text-sm focus:outline-none">
            {listFakultas.map(f => <option key={f} value={f}>{f === 'Semua' ? 'Semua Fakultas' : f}</option>)}
          </select>
          <select value={prodiFilter} onChange={e => setProdiFilter(e.target.value)} className="px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl text-sm focus:outline-none">
            {listProdi.map(p => <option key={p} value={p}>{p === 'Semua' ? 'Semua Prodi' : p}</option>)}
          </select>
          <select value={sesiFilter} onChange={e => setSesiFilter(e.target.value)} className="px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl text-sm focus:outline-none">
            {listSesi.map(s => <option key={s} value={s}>{s === 'Semua' ? 'Semua Sesi' : s}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[var(--color-text-muted)] uppercase bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
              <tr>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">NIM & Nama</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Prodi</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Sesi</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Waktu Hadir</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Waktu Toga</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredData.map((w) => (
                <tr key={w.nim} className="hover:bg-[var(--color-bg-secondary)]/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-[var(--color-text)]">{w.nama_mahasiswa}</div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-0.5 font-mono">{w.nim}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[var(--color-text)]">{w.prodi_singkat || w.prodi}</div>
                  </td>
                  <td className="px-6 py-4">
                    {w.sesi ? (
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-xs font-semibold">
                        {w.sesi}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 text-[var(--color-text-muted)] text-xs">
                    {w.waktu_hadir || '-'}
                  </td>
                  <td className="px-6 py-4 text-[var(--color-text-muted)] text-xs">
                    {w.waktu_toga || '-'}
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[var(--color-text-muted)]">
                    Tidak ada data wisudawan yang sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="text-sm text-[var(--color-text-muted)] text-right">
        Menampilkan <strong>{filteredData.length}</strong> dari <strong>{data.length}</strong> data.
      </div>
    </div>
  );
}