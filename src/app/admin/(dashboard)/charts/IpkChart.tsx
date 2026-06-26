'use client';

import type { IpkRow } from '@/actions/dashboard';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';
import { LineChart } from 'lucide-react'; // use LineChart icon as indicator

type Props = {
  data: IpkRow[];
  isDrilling: boolean;
  drillFakultas: string | null;
};

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

export default function IpkChart({ data, isDrilling, drillFakultas }: Props) {
  const totalPujian = data.reduce((s, d) => s + d.pujian, 0);
  const totalSangatMemuaskan = data.reduce((s, d) => s + d.sangatMemuaskan, 0);
  const totalMemuaskan = data.reduce((s, d) => s + d.memuaskan, 0);
  const totalBaik = data.reduce((s, d) => s + d.baik, 0);
  
  const totalAll = totalPujian + totalSangatMemuaskan + totalMemuaskan + totalBaik;

  const pieData = [
    { name: '3.50 - 4.00 (Cum Laude)', value: totalPujian, fill: '#059669' }, // emerald
    { name: '3.01 - 3.49 (Sangat Memuaskan)', value: totalSangatMemuaskan, fill: '#0ea5e9' }, // sky
    { name: '2.76 - 3.00 (Memuaskan)', value: totalMemuaskan, fill: '#f59e0b' }, // amber
    { name: '2.00 - 2.75 (Baik)', value: totalBaik, fill: '#94a3b8' }, // slate
  ].filter(d => d.value > 0);

  const title = isDrilling
    ? `Sebaran IPK Prodi — ${drillFakultas}`
    : 'Sebaran IPK';

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--color-border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LineChart size={15} className="text-[var(--color-text-subtle)]" />
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
