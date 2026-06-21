import { getAllPeriode } from "@/actions/periode";
import { Calendar, Info } from "lucide-react";
import { CountdownBadge } from "./InformasiClient";

export default async function AdminInformasiPage() {
  const allPeriode = await getAllPeriode();

  const sorted = [...allPeriode].sort((a, b) => {
    if (a.status === 'Sedang Dibuka' && b.status !== 'Sedang Dibuka') return -1;
    if (a.status !== 'Sedang Dibuka' && b.status === 'Sedang Dibuka') return 1;
    return 0;
  });

  const rows = (periode: any) => [
    { label: 'Periode',     value: periode.nama_periode },
    { label: 'Pelaksanaan', value: periode.tanggal_pelaksanaan },
    { label: 'Tempat',      value: periode.tempat_pelaksanaan },
    { label: 'Sesi 1',      value: periode.waktu_sesi_1 },
    { label: 'Sesi 2',      value: periode.waktu_sesi_2 },
    { label: 'Gladi',       value: periode.jadwal_gladi },
  ].filter(r => r.value);

  return (
    <div className="space-y-5">
      {sorted.length === 0 && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-3">
          <Info size={36} className="text-[var(--color-text-muted)] opacity-30" />
          <p className="text-sm text-[var(--color-text-muted)]">Belum ada periode wisuda.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {sorted.slice(0, 2).map((periode) => (
          <div
            key={periode.id}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm flex flex-col"
          >
            {/* Card Header */}
            <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center gap-2">
              <Calendar size={14} className="text-[var(--color-text-muted)]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                Jadwal Wisuda
              </span>
            </div>

            {/* Card Body */}
            <div className="px-5 pt-4 pb-5 flex flex-col gap-4 flex-1">
              {/* Title */}
              <h2 className="text-sm font-extrabold text-[var(--color-text)] uppercase leading-snug tracking-wide">
                {periode.nama_periode}
              </h2>

              {/* Info Rows */}
              <div className="flex flex-col divide-y divide-[var(--color-border)]">
                {rows(periode).map(({ label, value }) => (
                  <div key={label} className="flex items-start gap-3 py-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-subtle)] w-24 shrink-0 pt-0.5">
                      {label}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-subtle)] shrink-0">:</span>
                    <span className="text-xs font-bold text-[var(--color-text)] leading-relaxed">
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Pengumuman */}
              {periode.pengumuman && (
                <div className="px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/30">
                  <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">{periode.pengumuman}</p>
                </div>
              )}

              {/* Hint */}
              {periode.hint_pendaftaran && (
                <div className="px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800/30">
                  <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">{periode.hint_pendaftaran}</p>
                </div>
              )}

              {/* Countdown */}
              {periode.tanggal_pendaftaran && (
                <CountdownBadge
                  registrationDateLabel={periode.tanggal_pendaftaran}
                  isActive={periode.status === 'Sedang Dibuka'}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
