'use client';

import type { BinaryStatSummary } from '@/actions/dashboard';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';
import { UserCheck } from 'lucide-react';

type Props = {
  data: BinaryStatSummary;
  isDrilling: boolean;
  drillFakultas: string | null;
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2 shadow-lg text-xs max-w-[200px]">
      <p className="font-bold text-[var(--color-text)] mb-1 break-words">{item.name}</p>
      <p style={{ color: item.payload.fill }}>Total: <span className="font-bold">{item.value.toLocaleString('id-ID')}</span></p>
    </div>
  );
};

export default function KehadiranChart({ data, isDrilling, drillFakultas }: Props) {
  const title = isDrilling
    ? `Kehadiran Prodi — ${drillFakultas}`
    : 'Kehadiran';
  
  const pieData = [
    { name: 'Hadir', value: data.sudah, fill: '#10b981' }, // emerald-500
    { name: 'Belum Hadir', value: data.belum, fill: '#f43f5e' }, // rose-500
  ].filter(d => d.value > 0);

  const totalAll = data.sudah + data.belum;

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--color-border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCheck size={15} className="text-[var(--color-text-subtle)]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-subtle)]">{title}</h2>
        </div>
        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-800/50">
          Total: {totalAll.toLocaleString('id-ID')}
        </span>
      </div>
      <div className="p-4 flex flex-col items-center">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie 
              data={pieData} 
              cx="50%" 
              cy="50%" 
              innerRadius={45}
              outerRadius={80} 
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
        <div className="flex gap-4 justify-center mt-2">
          {pieData.map(d => (
            <div key={d.name} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }} />
              <div className="flex flex-col">
                <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide">{d.name}</span>
                <span className="text-sm font-bold text-[var(--color-text)]">{d.value.toLocaleString('id-ID')}</span>
              </div>
            </div>
          ))}
          {pieData.length === 0 && (
            <p className="text-xs text-[var(--color-text-muted)]">Belum ada data</p>
          )}
        </div>
      </div>
    </div>
  );
}
