import { Award, Medal, Star, Zap } from "lucide-react";
import { Fragment } from "react";
import SwitchWisudawanButton from "./SwitchWisudawanButton";

type WisudawanData = any;

export default function PrestasiAkademikView({ 
  data, periode, overrides, isGenerated, role
}: { 
  data: WisudawanData[], periode: string, overrides: any, isGenerated: boolean, role?: string
}) {
  const formatIpk = (ipk: string | undefined | null) => ipk ? parseFloat(ipk.replace(',', '.')).toFixed(2) : '-';

  // ─── Empty state jika belum pernah di-generate ────────────────────────────
  if (!isGenerated) {
    return (
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden p-12 flex flex-col items-center justify-center min-h-[360px] gap-5">
        <div className="w-20 h-20 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
          <Zap size={40} className="text-violet-500" />
        </div>
        <div className="text-center max-w-sm">
          <p className="text-lg font-bold text-[var(--color-text)] mb-2">Belum Ada Data Prestasi</p>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
            Klik tombol <span className="font-bold text-violet-600 dark:text-violet-400">Generate</span> untuk menghitung peringkat akademik dan menyimpannya ke dalam database.
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

  // Best Overall (Kecualikan Pascasarjana)
  const sortedOverall = [...parsedData]
    .filter(w => w.fakultas !== "Pascasarjana" && w.fakultas?.toLowerCase() !== "pascasarjana")
    .sort((a, b) => {
      if (b.parsedIpk !== a.parsedIpk) return b.parsedIpk - a.parsedIpk;
      return a.parsedDate - b.parsedDate;
    });
  
  let bestOverall = sortedOverall.length > 0 ? sortedOverall[0] : null;
  let isBestOverridden = false;
  const institutOverrides = overrides?.akademik?.['Institut'] || {};
  if (institutOverrides['0']) {
    const oUser = parsedData.find(x => x.nim === institutOverrides['0']);
    if (oUser) {
      bestOverall = oUser;
      isBestOverridden = true;
    }
  }

  // Group by Fakultas
  const byFakultas: Record<string, typeof parsedData> = {};
  parsedData.forEach(w => {
    const f = w.fakultas || "Tanpa Fakultas";
    if (!byFakultas[f]) byFakultas[f] = [];
    byFakultas[f].push(w);
  });

  // Top 3 per Fakultas
  const topFakultas = Object.keys(byFakultas).map(f => {
    const sorted = byFakultas[f].sort((a, b) => {
      if (b.parsedIpk !== a.parsedIpk) return b.parsedIpk - a.parsedIpk;
      return a.parsedDate - b.parsedDate;
    });
    
    let top3 = sorted.slice(0, 3);
    const fakultasOverrides = overrides?.akademik?.[f] || {};
    
    top3 = top3.map((w, idx) => {
      if (fakultasOverrides[idx.toString()]) {
        const oUser = parsedData.find(x => x.nim === fakultasOverrides[idx.toString()]);
        if (oUser) return { ...oUser, isOverridden: true };
      }
      return w;
    });

    return {
      fakultas: f,
      top3
    };
  }).sort((a, b) => a.fakultas.localeCompare(b.fakultas));

  const getRankIcon = (index: number, isBestOverall: boolean) => {
    if (isBestOverall) return <Medal className="text-amber-400" size={24} />;
    if (index === 0) return <Medal className="text-amber-400" size={24} />; // Gold
    if (index === 1) return <Medal className="text-slate-400" size={24} />; // Silver
    if (index === 2) return <Medal className="text-amber-700" size={24} />; // Bronze
    return null;
  };

  if (parsedData.length === 0) {
    return (
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden p-8 flex flex-col items-center justify-center min-h-[300px]">
        <Award size={48} className="text-[var(--color-text-muted)] opacity-20 mb-4" />
        <p className="text-[var(--color-text-muted)] font-medium text-sm">Belum ada data wisudawan terdaftar di periode ini.</p>
      </div>
    );
  }

  // Badge label untuk prestasi_akd
  const getPrestasiLabel = (prestasiAkd: string | null) => {
    if (!prestasiAkd) return null;
    const parts = prestasiAkd.split(',').map(s => s.trim()).filter(Boolean);
    return (
      <div className="flex flex-wrap items-center gap-1 mt-1">
        {parts.map((p, i) => (
          <span
            key={i}
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              p === 'Institut'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-700'
                : p === 'Kesatu'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700'
                  : p === 'Kedua'
                    ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-700'
            }`}
          >
            {p}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {bestOverall && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-4 right-4 z-20">
            {role !== 'admin_unit' && (
              <SwitchWisudawanButton
                periode={periode}
                tab="akademik"
                fakultasOrInstitut="Institut"
                rankIndex={0}
                isOverridden={isBestOverridden}
                currentNim={bestOverall.nim}
                currentName={bestOverall.nama_mahasiswa}
              />
            )}
          </div>
          <div className="absolute -right-4 -top-4 opacity-10">
            <Medal size={120} className="text-amber-600" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 relative z-10">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center shrink-0 border border-amber-300 dark:border-amber-700/50">
              <Medal className="text-amber-500" size={32} />
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-black tracking-widest text-amber-600 dark:text-amber-500 uppercase mb-1">
                Wisudawan Terbaik Institut {isBestOverridden && <span className="lowercase text-[10px] bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded ml-1">(dimodifikasi manual)</span>}
              </h3>
              <p className="text-2xl font-bold text-[var(--color-text)] mb-1">{bestOverall.nama_gelar || bestOverall.nama_mahasiswa}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm mt-1">
                <p className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded">
                  IPK: {formatIpk(bestOverall.ipk)}
                </p>
                {bestOverall.predikat && (
                  <p className="font-bold text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                    {bestOverall.predikat}
                  </p>
                )}
                <p className="text-[var(--color-text-muted)] font-medium">Yudisium: {formatDateStr(bestOverall.tanggal_yudisium)}</p>
                <p className="text-[var(--color-text-muted)] font-medium">NIM: {bestOverall.nim}</p>
                <p className="text-[var(--color-text-muted)] font-medium">{bestOverall.prodi}</p>
                <p className="text-[var(--color-text-muted)] font-medium">{bestOverall.fakultas}</p>
              </div>
              {bestOverall.prestasi_akd && (
                <div className="mt-2">
                  {getPrestasiLabel(bestOverall.prestasi_akd)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
              <tr>
                <th className="px-5 py-4 font-semibold w-16 text-center">Peringkat</th>
                <th className="px-5 py-4 font-semibold">NIM</th>
                <th className="px-5 py-4 font-semibold">Wisudawan</th>
                <th className="px-5 py-4 font-semibold">Program Studi</th>
                <th className="px-5 py-4 font-semibold">Capaian Akademik</th>
                <th className="px-5 py-4 font-semibold">Tgl Yudisium</th>
                <th className="px-5 py-4 font-semibold">Prestasi AKD</th>
                <th className="px-5 py-4 font-semibold text-right">
                  {role !== 'admin_unit' && "Opsi"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {topFakultas.map(f => (
                <Fragment key={f.fakultas}>
                  <tr className="bg-[var(--color-bg-secondary)]/30">
                    <td colSpan={8} className="px-5 py-3 font-bold text-emerald-700 dark:text-emerald-400 text-xs uppercase tracking-wider border-y border-[var(--color-border)]">
                      {f.fakultas}
                    </td>
                  </tr>
                  {f.top3.map((w, idx) => {
                    const isBestOverall = bestOverall?.nim === w.nim && !isBestOverridden;
                    const rowBg = isBestOverall
                      ? 'bg-amber-50/60 dark:bg-amber-900/15'
                      : idx === 0
                        ? 'bg-amber-50/40 dark:bg-amber-900/10'
                        : idx === 1
                          ? 'bg-slate-50/60 dark:bg-slate-800/20'
                          : 'bg-orange-50/30 dark:bg-orange-900/8';
                    const hoverBg = isBestOverall
                      ? 'hover:bg-amber-100/60 dark:hover:bg-amber-900/25'
                      : idx === 0
                        ? 'hover:bg-amber-100/50 dark:hover:bg-amber-900/20'
                        : idx === 1
                          ? 'hover:bg-slate-100/60 dark:hover:bg-slate-700/30'
                          : 'hover:bg-orange-100/40 dark:hover:bg-orange-900/15';
                    const leftBorderColor = isBestOverall || idx === 0
                      ? 'border-l-2 border-l-amber-400 dark:border-l-amber-500'
                      : idx === 1
                        ? 'border-l-2 border-l-slate-400 dark:border-l-slate-500'
                        : 'border-l-2 border-l-amber-700/50 dark:border-l-amber-700';
                    return (
                      <tr key={w.nim + idx} className={`transition-colors ${rowBg} ${hoverBg} ${leftBorderColor}`}>
                        <td className="px-5 py-4 text-center">
                          <div className="flex justify-center">
                            {getRankIcon(idx, isBestOverall)}
                          </div>
                        </td>
                        <td className="px-5 py-4 font-medium text-[var(--color-text-muted)]">
                          {w.nim}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-[var(--color-text)]">
                              {w.nama_gelar || w.nama_mahasiswa}
                              {w.isOverridden && <span className="text-[10px] text-amber-600 bg-amber-100 px-1 py-0.5 rounded ml-1.5 font-normal relative -top-0.5">*</span>}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-[var(--color-text-subtle)] truncate max-w-[200px] block" title={w.prodi}>
                            {w.prodi}
                          </span>
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
                          {getPrestasiLabel(w.prestasi_akd)}
                        </td>
                        {role !== 'admin_unit' ? (
                          <td className="px-5 py-4 text-right">
                            <div className="flex justify-end">
                              <SwitchWisudawanButton
                                periode={periode}
                                tab="akademik"
                                fakultasOrInstitut={f.fakultas}
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
