'use client';

import type { PredikatRow } from '@/actions/dashboard';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Award } from 'lucide-react';

type Props = {
  data: PredikatRow[];
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

export default function PredikatChart({ data, isDrilling, drillFakultas }: Props) {
  const totalCumlaude = data.reduce((s, d) => s + d.Cumlaude, 0);
  const totalSangatMemuaskan = data.reduce((s, d) => s + d['Sangat Memuaskan'], 0);
  const totalMemuaskan = data.reduce((s, d) => s + d.Memuaskan, 0);
  const totalLainnya = data.reduce((s, d) => s + d.Lainnya, 0);
  const totalAll = totalCumlaude + totalSangatMemuaskan + totalMemuaskan + totalLainnya;

  const pieData = [
    { name: 'Cumlaude', value: totalCumlaude, fill: '#059669' },
    { name: 'Sangat Memuaskan', value: totalSangatMemuaskan, fill: '#0ea5e9' },
    { name: 'Memuaskan', value: totalMemuaskan, fill: '#f59e0b' },
    { name: 'Lainnya', value: totalLainnya, fill: '#94a3b8' },
  ].filter(d => d.value > 0);

  const title = isDrilling
    ? `Predikat Prodi — ${drillFakultas}`
    : 'Predikat';

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--color-border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award size={15} className="text-[var(--color-text-subtle)]" />
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
        <div className="flex flex-col gap-2 justify-center pl-4">
          {pieData.map(d => (
            <div key={d.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: d.fill }} />
              <div className="flex flex-col">
                <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide leading-tight">{d.name}</span>
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
