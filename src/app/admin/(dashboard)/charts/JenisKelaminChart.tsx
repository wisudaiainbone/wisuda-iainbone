'use client';

import type { JenisKelaminRow } from '@/actions/dashboard';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Users } from 'lucide-react';

type Props = {
  data: JenisKelaminRow[];
  isDrilling: boolean;
  drillFakultas: string | null;
};

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function JenisKelaminChart({ data, isDrilling, drillFakultas }: Props) {
  const totalL = data.reduce((s, d) => s + d.L, 0);
  const totalP = data.reduce((s, d) => s + d.P, 0);
  const totalAll = totalL + totalP;

  const pieData = [
    { name: 'Laki-Laki', value: totalL, fill: '#3b82f6' },
    { name: 'Perempuan', value: totalP, fill: '#f43f5e' },
  ].filter(d => d.value > 0);

  const title = isDrilling
    ? `Jenis Kelamin Prodi — ${drillFakultas}`
    : 'Jenis Kelamin';

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--color-border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={15} className="text-[var(--color-text-subtle)]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-subtle)]">{title}</h2>
        </div>
        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-800/50">
          Total: {totalAll.toLocaleString('id-ID')}
        </span>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 items-center gap-2">
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
              label={renderCustomLabel}
            >
              {pieData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: any) => [value, 'Total']}
              contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="overflow-auto max-h-[260px] w-full pl-0 sm:pl-2 mt-4 sm:mt-0">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[var(--color-surface)] z-10">
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left py-2 pr-3 font-semibold text-[var(--color-text-muted)]">Kategori</th>
                <th className="text-right py-2 font-semibold text-[var(--color-text-muted)] whitespace-nowrap">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {pieData.map((d, i) => (
                <tr key={i} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors">
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.fill }} />
                      <span className="text-[var(--color-text)] break-words leading-snug">{d.name}</span>
                    </div>
                  </td>
                  <td className="py-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {d.value.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pieData.length === 0 && (
            <p className="text-center text-xs text-[var(--color-text-muted)] py-4">Belum ada data</p>
          )}
        </div>
      </div>
    </div>
  );
}
