'use client';

import type { OrmawaSummary } from '@/actions/dashboard';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { Trophy } from 'lucide-react';

type Props = {
  data: OrmawaSummary & { byLabel: { label: string; fakultas?: string; aktif: number; tidakAktif: number }[] };
  isDrilling: boolean;
  drillFakultas: string | null;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2 shadow-lg text-xs max-w-[200px]">
      <p className="font-bold text-[var(--color-text)] mb-1 break-words">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: <span className="font-bold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function OrmawatChart({ data, isDrilling, drillFakultas }: Props) {
  const title = isDrilling
    ? `Ormawa Prodi — ${drillFakultas}`
    : 'Partisipasi Ormawa';
  const pieData = [
    { name: 'Aktif Ormawa', value: data.aktif, fill: '#059669' },
    { name: 'Tidak Aktif', value: data.tidakAktif, fill: '#94a3b8' },
  ];
  const totalAll = data.aktif + data.tidakAktif;

  const topData = data.topOrmawa.map(o => ({
    name: o.nama.length > 20 ? o.nama.slice(0, 20) + '…' : o.nama,
    jumlah: o.jumlah,
  }));

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--color-border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={15} className="text-[var(--color-text-subtle)]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-subtle)]">{title}</h2>
        </div>
        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-800/50">
          Total: {totalAll.toLocaleString('id-ID')}
        </span>
      </div>
      <div className="p-4 grid grid-cols-2 gap-4">
        {/* Pie Aktif vs Tidak */}
        <div>
          <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Aktif vs Tidak</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={65} dataKey="value" labelLine={false}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any, name: any) => [value, name]} contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex gap-3 justify-center mt-1">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
                <span className="text-[10px] text-[var(--color-text-muted)]">{d.name}: <strong>{d.value}</strong></span>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 Ormawa */}
        <div>
          <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Top 5 Ormawa</p>
          {topData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={topData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }} barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-bg-secondary)', opacity: 0.5 }} />
                <Bar dataKey="jumlah" fill="#059669" radius={[0, 4, 4, 0]} name="Anggota" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[160px] text-xs text-[var(--color-text-muted)]">
              Belum ada data ormawa
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
