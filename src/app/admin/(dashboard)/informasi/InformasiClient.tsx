"use client";

import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";

type Props = {
  registrationDateLabel: string;
  isActive?: boolean;
};

function parseDeadline(label: string): number {
  const MONTHS: Record<string, number> = {
    'januari': 0, 'februari': 1, 'maret': 2, 'april': 3,
    'mei': 4, 'juni': 5, 'juli': 6, 'agustus': 7,
    'september': 8, 'oktober': 9, 'november': 10, 'desember': 11
  };
  const str = label.toLowerCase();
  const allMatches = [...str.matchAll(/(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?/g)];
  const yearMatch = str.match(/(\d{4})/);
  const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
  if (allMatches.length === 0) return 0;
  const last = allMatches[allMatches.length - 1];
  const day = parseInt(last[1]);
  const month = MONTHS[last[2]];
  const y = last[3] ? parseInt(last[3]) : year;
  if (isNaN(day) || month === undefined || isNaN(y)) return 0;
  return new Date(y, month, day, 23, 59, 59).getTime();
}

export function CountdownBadge({ registrationDateLabel, isActive }: Props) {
  const [timeLeft, setTimeLeft] = useState({ Hari: 0, Jam: 0, Menit: 0, Detik: 0 });
  const [mounted, setMounted] = useState(false);
  const [expired, setExpired] = useState(false);

  const deadline = parseDeadline(registrationDateLabel);

  useEffect(() => {
    setMounted(true);
    if (!deadline) return;
    const tick = () => {
      const distance = deadline - Date.now();
      if (distance <= 0) {
        setExpired(true);
        setTimeLeft({ Hari: 0, Jam: 0, Menit: 0, Detik: 0 });
        return;
      }
      setTimeLeft({
        Hari: Math.floor(distance / 86400000),
        Jam: Math.floor((distance % 86400000) / 3600000),
        Menit: Math.floor((distance % 3600000) / 60000),
        Detik: Math.floor((distance % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  if (!mounted) return null;

  const accent = isActive
    ? { wrap: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50', head: 'bg-emerald-100/60 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/40', label: 'text-emerald-700 dark:text-emerald-300', icon: 'text-emerald-500', box: 'bg-emerald-600 text-white', sep: 'text-emerald-400' }
    : { wrap: 'bg-[var(--color-bg-secondary)] border-[var(--color-border)]', head: 'bg-[var(--color-bg-secondary)] border-[var(--color-border)]', label: 'text-[var(--color-text-muted)]', icon: 'text-[var(--color-text-muted)]', box: 'bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)]', sep: 'text-[var(--color-text-subtle)]' };

  return (
    <div className={`rounded-xl border overflow-hidden ${accent.wrap}`}>
      {/* Header row */}
      <div className={`px-4 py-2.5 flex items-center justify-between border-b ${accent.head}`}>
        <div className="flex items-center gap-1.5">
          <Calendar size={12} className={accent.icon} />
          <span className={`text-[10px] font-bold uppercase tracking-widest ${accent.label}`}>Jadwal Pendaftaran</span>
        </div>
        <span className={`text-xs font-semibold ${accent.label}`}>{registrationDateLabel}</span>
      </div>

      {/* Countdown */}
      <div className="px-4 py-3">
        {expired ? (
          <p className="text-xs text-center text-[var(--color-text-muted)]">Masa pendaftaran telah berakhir</p>
        ) : !deadline ? (
          <p className="text-xs text-center text-[var(--color-text-muted)]">Format tanggal tidak dikenali</p>
        ) : (
          <div className="flex items-center justify-center gap-2">
            {Object.entries(timeLeft).map(([unit, value], idx, arr) => (
              <div key={unit} className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-11 rounded-lg flex items-center justify-center font-mono font-bold text-lg shadow-sm ${accent.box}`}>
                    {value.toString().padStart(2, '0')}
                  </div>
                  <span className="text-[9px] font-bold text-[var(--color-text-subtle)] uppercase tracking-widest mt-1">{unit}</span>
                </div>
                {idx < arr.length - 1 && (
                  <span className={`text-base font-light pb-4 ${accent.sep}`}>:</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
