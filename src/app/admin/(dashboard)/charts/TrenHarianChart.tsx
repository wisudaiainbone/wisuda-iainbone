'use client';

import type { TrenHarian } from '@/actions/dashboard';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

type Props = { data: TrenHarian[] };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const date = new Date(label + 'T00:00:00');
  const formatted = date.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs">
      <p className="font-bold text-[var(--color-text)] mb-1">{formatted}</p>
      <p className="text-emerald-600 dark:text-emerald-400">
        Pendaftar: <span className="font-bold">{payload[0].value}</span>
      </p>
    </div>
  );
};

export default function TrenHarianChart({ data }: Props) {
  const chartData = data.map(d => ({
    tanggal: d.tanggal,
    label: new Date(d.tanggal + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
    Pendaftar: d.jumlah,
  }));

  const maxVal = Math.max(...chartData.map(d => d.Pendaftar), 1);
  const totalTerdaftar = data.reduce((s, d) => s + d.jumlah, 0);

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--color-border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={15} className="text-[var(--color-text-subtle)]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-subtle)]">Tren Pendaftaran Harian</h2>
        </div>
        <span className="text-xs text-[var(--color-text-muted)]">
          Total: <span className="font-bold text-emerald-600 dark:text-emerald-400">{totalTerdaftar}</span> wisudawan terdaftar
        </span>
      </div>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPendaftar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
              axisLine={false}
              tickLine={false}
              interval={Math.max(0, Math.floor(chartData.length / 8) - 1)}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
              axisLine={false}
              tickLine={false}
              width={30}
              domain={[0, maxVal + 1]}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#059669', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area
              type="monotone"
              dataKey="Pendaftar"
              stroke="#059669"
              strokeWidth={2}
              fill="url(#colorPendaftar)"
              dot={{ fill: '#059669', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#059669', strokeWidth: 2, stroke: '#fff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
        <p className="text-[10px] text-[var(--color-text-muted)] text-center mt-2">
          Dihitung dari kolom <code className="bg-[var(--color-bg-secondary)] px-1 rounded">terdaftar</code> — waktu wisudawan menyelesaikan proses pendaftaran
        </p>
      </div>
    </div>
  );
}
