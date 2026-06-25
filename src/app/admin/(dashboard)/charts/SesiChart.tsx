'use client';

import type { SesiSummary } from '@/actions/dashboard';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Clock } from 'lucide-react';

type Props = {
  data: SesiSummary & { topSesi: { name: string; value: number }[] };
  isDrilling: boolean;
  drillFakultas: string | null;
};

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9', '#64748b'];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs max-w-[200px]">
      <p className="font-bold text-[var(--color-text)] mb-1 break-words">{item.name}</p>
      <p style={{ color: item.payload.fill }}>Total: <span className="font-bold">{item.value.toLocaleString('id-ID')}</span></p>
    </div>
  );
};

export default function SesiChart({ data, isDrilling, drillFakultas }: Props) {
  const pieData = data.topSesi.map((d, i) => ({
    ...d,
    fill: COLORS[i % COLORS.length]
  })).filter(d => d.value > 0);

  const totalAll = pieData.reduce((s, d) => s + d.value, 0);

  const title = isDrilling
    ? `Keterisian Sesi Prodi — ${drillFakultas}`
    : 'Keterisian Sesi Wisuda';

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--color-border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={15} className="text-[var(--color-text-subtle)]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-subtle)]">{title}</h2>
        </div>
        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-800/50">
          Total: {totalAll.toLocaleString('id-ID')}
        </span>
      </div>
      <div className="p-4 grid grid-cols-[40%_60%] sm:grid-cols-2 items-center gap-2">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="80%"
              dataKey="value"
              labelLine={false}
            >
              {pieData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-3 justify-center pl-2">
          {pieData.map(d => (
            <div key={d.name} className="flex items-start gap-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-1" style={{ background: d.fill }} />
              <div className="flex flex-col">
                <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide leading-tight">{d.name}</span>
                <span className="text-sm font-bold text-[var(--color-text)]">{d.value.toLocaleString('id-ID')}</span>
              </div>
            </div>
          ))}
          {pieData.length === 0 && (
            <p className="text-xs text-[var(--color-text-muted)]">Belum ada data sesi</p>
          )}
        </div>
      </div>
    </div>
  );
}
