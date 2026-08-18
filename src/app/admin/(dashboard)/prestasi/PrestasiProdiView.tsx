import { Award, Medal, Star, Zap } from "lucide-react";
import { Fragment } from "react";
import SwitchWisudawanButton from "./SwitchWisudawanButton";

type WisudawanData = any;

export default function PrestasiProdiView({
  data, periode, overrides, isGenerated, role
}: {
  data: WisudawanData[], periode: string, overrides: any, isGenerated: boolean, role?: string
}) {
  const formatIpk = (ipk: string | undefined | null) => ipk ? parseFloat(ipk.replace(',', '.')).toFixed(2) : '-';

  // ─── Empty state jika belum pernah di-generate ────────────────────────────
  if (!isGenerated) {
    return (
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden p-12 flex flex-col items-center justify-center min-h-[360px] gap-5">
        <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <Zap size={40} className="text-indigo-500" />
        </div>
        <div className="text-center max-w-sm">
          <p className="text-lg font-bold text-[var(--color-text)] mb-2">Belum Ada Data Prestasi Prodi</p>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
            Klik tombol <span className="font-bold text-indigo-600 dark:text-indigo-400">Generate</span> untuk menghitung peringkat terbaik per Program Studi dan menyimpannya ke dalam database.
          </p>
        </div>
      </div>
    );
  }

  // Parsing helpers
  const parseIpk = (ipkStr: string | null) => {
    if (!ipkStr) return 0;
    const parsed = parseFloat(ipkStr.replace(',', '.'));
    return isNaN(parsed) ? 0 : parsed;
  };

  const parseDate = (dateStr: string | null) => {
    if (!dateStr) return new Date(8640000000000000).getTime();
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? new Date(8640000000000000).getTime() : date.getTime();
  };

  const formatDateStr = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
    } catch {
      return dateStr;
    }
  };

  const parsedData = data.map(w => ({
    ...w,
    parsedIpk: parseIpk(w.ipk),
    parsedDate: parseDate(w.tanggal_yudisium)
  }));

  if (parsedData.length === 0) {
    return (
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden p-8 flex flex-col items-center justify-center min-h-[300px]">
        <Award size={48} className="text-[var(--color-text-muted)] opacity-20 mb-4" />
        <p className="text-[var(--color-text-muted)] font-medium text-sm">Belum ada data wisudawan terdaftar di periode ini.</p>
      </div>
    );
  }

  // Group by Prodi
  const byProdi: Record<string, typeof parsedData> = {};
  parsedData.forEach(w => {
    const p = w.prodi || "Tanpa Prodi";
    if (!byProdi[p]) byProdi[p] = [];
    byProdi[p].push(w);
  });

  // Top 3 per Prodi (dengan override)
  const topProdi = Object.keys(byProdi).map(prodi => {
    const sorted = [...byProdi[prodi]].sort((a, b) => {
      if (b.parsedIpk !== a.parsedIpk) return b.parsedIpk - a.parsedIpk;
      if (a.parsedDate !== b.parsedDate) return a.parsedDate - b.parsedDate;
      return a.nim.localeCompare(b.nim);
    });

    let top3 = sorted.slice(0, 3);
    const prodiOverrides = overrides?.prodi?.[prodi] || {};

    top3 = top3.map((w, idx) => {
      if (prodiOverrides[idx.toString()]) {
        const oUser = parsedData.find(x => x.nim === prodiOverrides[idx.toString()]);
        if (oUser) return { ...oUser, isOverridden: true };
      }
      return w;
    });

    // Ambil nama Fakultas dari anggota prodi (semua dari prodi yang sama pasti satu fakultas)
    const fakultas = byProdi[prodi][0]?.fakultas || "Tanpa Fakultas";

    return { prodi, fakultas, top3 };
  }).sort((a, b) => {
    // Sort by fakultas first, then prodi name
    const fCmp = a.fakultas.localeCompare(b.fakultas);
    if (fCmp !== 0) return fCmp;
    return a.prodi.localeCompare(b.prodi);
  });

  // Badge label berdasarkan posisi (idx) — tidak bergantung pada field DB
  const getPositionBadge = (idx: number) => {
    const labels = ['Kesatu', 'Kedua', 'Ketiga'];
    const label = labels[idx];
    if (!label) return null;
    const colorClass =
      idx === 0
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700'
        : idx === 1
          ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-700';
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colorClass}`}>
        {label}
      </span>
    );
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Medal className="text-amber-400" size={24} />;
    if (index === 1) return <Medal className="text-slate-400" size={24} />;
    if (index === 2) return <Medal className="text-amber-700" size={24} />;
    return null;
  };

  // Group topProdi by fakultas for section headers
  const byFakultasProdi: Record<string, typeof topProdi> = {};
  topProdi.forEach(item => {
    if (!byFakultasProdi[item.fakultas]) byFakultasProdi[item.fakultas] = [];
    byFakultasProdi[item.fakultas].push(item);
  });
  const sortedFakultas = Object.keys(byFakultasProdi).sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
              <tr>
                <th className="px-5 py-4 font-semibold w-16 text-center">Peringkat</th>
                <th className="px-5 py-4 font-semibold">NIM</th>
                <th className="px-5 py-4 font-semibold">Wisudawan</th>
                <th className="px-5 py-4 font-semibold">Capaian Akademik</th>
                <th className="px-5 py-4 font-semibold">Tgl Yudisium</th>
                <th className="px-5 py-4 font-semibold">Prestasi Prodi</th>
                <th className="px-5 py-4 font-semibold text-right">
                  {role !== 'admin_unit' && "Opsi"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {sortedFakultas.map(fak => (
                <Fragment key={fak}>
                  {/* Fakultas Header */}
                  <tr className="bg-indigo-50/60 dark:bg-indigo-950/30">
                    <td colSpan={7} className="px-5 py-3 font-black text-indigo-700 dark:text-indigo-400 text-xs uppercase tracking-wider border-y border-indigo-200/60 dark:border-indigo-800/40">
                      {fak}
                    </td>
                  </tr>

                  {byFakultasProdi[fak].map(({ prodi, top3 }) => (
                    <Fragment key={prodi}>
                      {/* Prodi Sub-header */}
                      <tr className="bg-[var(--color-bg-secondary)]/50">
                        <td colSpan={7} className="px-8 py-2.5 font-bold text-emerald-700 dark:text-emerald-400 text-[11px] uppercase tracking-wider border-y border-[var(--color-border)]">
                          ↳ {prodi}
                        </td>
                      </tr>

                      {top3.map((w, idx) => {
                        const rowBg =
                          idx === 0
                            ? 'bg-amber-50/40 dark:bg-amber-900/10'
                            : idx === 1
                              ? 'bg-slate-50/60 dark:bg-slate-800/20'
                              : 'bg-orange-50/30 dark:bg-orange-900/8';
                        const hoverBg =
                          idx === 0
                            ? 'hover:bg-amber-100/50 dark:hover:bg-amber-900/20'
                            : idx === 1
                              ? 'hover:bg-slate-100/60 dark:hover:bg-slate-700/30'
                              : 'hover:bg-orange-100/40 dark:hover:bg-orange-900/15';
                        const leftBorderColor =
                          idx === 0
                            ? 'border-l-2 border-l-amber-400 dark:border-l-amber-500'
                            : idx === 1
                              ? 'border-l-2 border-l-slate-400 dark:border-l-slate-500'
                              : 'border-l-2 border-l-amber-700/50 dark:border-l-amber-700';

                        return (
                          <tr key={w.nim + idx} className={`transition-colors ${rowBg} ${hoverBg} ${leftBorderColor}`}>
                            <td className="px-5 py-4 text-center">
                              <div className="flex justify-center">
                                {getRankIcon(idx)}
                              </div>
                            </td>
                            <td className="px-5 py-4 font-medium text-[var(--color-text-muted)]">
                              {w.nim}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-[var(--color-text)] uppercase">
                                  {w.nama_gelar || w.nama_mahasiswa}
                                  {w.isOverridden && <span className="text-[10px] text-amber-600 bg-amber-100 px-1 py-0.5 rounded ml-1.5 font-normal relative -top-0.5">*</span>}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">
                                  IPK {formatIpk(w.ipk)}
                                </span>
                                {w.predikat && (
                                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">
                                    {w.predikat}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-4 text-[var(--color-text-muted)]">
                              {formatDateStr(w.tanggal_yudisium)}
                            </td>
                            <td className="px-5 py-4">
                              {getPositionBadge(idx)}
                            </td>
                            {role !== 'admin_unit' ? (
                              <td className="px-5 py-4 text-right">
                                <div className="flex justify-end">
                                  <SwitchWisudawanButton
                                    periode={periode}
                                    tab="prodi"
                                    fakultasOrInstitut={prodi}
                                    rankIndex={idx}
                                    isOverridden={!!w.isOverridden}
                                    currentNim={w.nim}
                                    currentName={w.nama_mahasiswa}
                                  />
                                </div>
                              </td>
                            ) : (
                              <td className="px-5 py-4"></td>
                            )}
                          </tr>
                        );
                      })}
                    </Fragment>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
