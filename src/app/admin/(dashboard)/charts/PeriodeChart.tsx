'use client';

import type { PeriodeData } from '@/actions/dashboard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import { Calendar } from 'lucide-react';

type Props = { data: PeriodeData[] };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-bold text-[var(--color-text)] mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: <span className="font-bold">{entry.value.toLocaleString('id-ID')}</span>
        </p>
      ))}
    </div>
  );
};

export default function PeriodeChart({ data }: Props) {
  const chartData = data.map(p => ({
    name: p.nama.length > 20 ? p.nama.slice(0, 20) + '…' : p.nama,
    fullName: p.nama,
    Kuota: p.kuota,
    Pendaftar: p.total,
    Terdaftar: p.terdaftar,
  }));

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--color-border)] flex items-center gap-2">
        <Calendar size={15} className="text-[var(--color-text-subtle)]" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-subtle)]">Kuota & Pendaftar Per Periode</h2>
      </div>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} width={36} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-bg-secondary)', opacity: 0.5 }} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            {chartData[0]?.Kuota > 0 && (
              <Bar dataKey="Kuota" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={40} />
            )}
            <Bar dataKey="Pendaftar" fill="#6ee7b7" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="Terdaftar" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
