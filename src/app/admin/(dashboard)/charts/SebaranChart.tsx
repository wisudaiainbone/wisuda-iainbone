'use client';

import type { FakultasRow, ProdiRow } from '@/actions/dashboard';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Building2, BookOpen, ChevronRight, MousePointerClick } from 'lucide-react';

type Props = {
  data: (FakultasRow | ProdiRow)[];
  isDrillingFakultas: boolean;
  isDrillingProdi?: boolean;
  drillFakultas: string | null;
  onDrillDownFakultas: (fakultas: string) => void;
  onDrillDownProdi: (prodi: string) => void;
};

const COLORS = [
  '#059669', '#10b981', '#34d399', '#6ee7b7',
  '#0ea5e9', '#38bdf8', '#7dd3fc',
  '#f59e0b', '#fbbf24', '#fcd34d',
  '#8b5cf6', '#a78bfa', '#c4b5fd',
  '#f43f5e', '#fb7185', '#fda4af',
];

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.04) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
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

export default function SebaranChart({ data, isDrillingFakultas, isDrillingProdi, drillFakultas, onDrillDownFakultas, onDrillDownProdi }: Props) {
  const scopeTotal = data.reduce((s, d) => s + (d.total || 0), 0);
  const scopeTerdaftar = data.reduce((s, d) => s + (d.terdaftar || 0), 0);
  const scopeBelum = scopeTotal - scopeTerdaftar;

  // Lapis Paling Atas: Persentase Per Fakultas
  const pieDataFakultas = data.slice(0, 15).map((d, i) => ({
    name: d.label,
    value: d.terdaftar,
    total: d.total,
    fill: COLORS[i % COLORS.length],
  })).filter(d => d.value > 0);

  // Lapis Drilldown (Fakultas / Prodi): Sudah Terdaftar vs Belum Terdaftar
  const pieDataStatus = [
    { name: 'Sudah Mendaftar', value: scopeTerdaftar, fill: '#10b981' },
    { name: 'Belum Mendaftar', value: scopeBelum > 0 ? scopeBelum : 0, fill: '#f43f5e' },
  ].filter(d => d.value > 0);

  const pieData = (!isDrillingFakultas && !isDrillingProdi) ? pieDataFakultas : pieDataStatus;

  const title = isDrillingProdi
    ? `Status Pendaftaran — ${data[0]?.label || ''}`
    : isDrillingFakultas
      ? `Status Pendaftaran — ${drillFakultas}`
      : 'Sebaran Pendaftar Per Fakultas';

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--color-border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isDrillingFakultas ? (
            <BookOpen size={15} className="text-[var(--color-text-subtle)]" />
          ) : (
            <Building2 size={15} className="text-[var(--color-text-subtle)]" />
          )}
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-subtle)]">{title}</h2>
        </div>
        {!isDrillingProdi && (
          <span className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1">
            <MousePointerClick size={11} /> Klik {isDrillingFakultas ? 'prodi' : 'fakultas'} pada tabel untuk detail
          </span>
        )}
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Donut */}
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={110}
              dataKey="value"
              labelLine={false}
              label={renderCustomLabel}
              onClick={(entry) => {
                if (entry?.name && !isDrillingFakultas && !isDrillingProdi) {
                  onDrillDownFakultas(entry.name as string);
                }
              }}
              style={{ cursor: (!isDrillingFakultas && !isDrillingProdi) ? 'pointer' : 'default' }}
            >
              {pieData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Tabel ringkas — baris klikable */}
        <div className="overflow-auto max-h-[260px]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[var(--color-surface)]">
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left py-2 pr-3 font-semibold text-[var(--color-text-muted)]">
                  {isDrillingFakultas ? 'Prodi' : 'Fakultas'}
                </th>
                <th className="text-right py-2 px-2 font-semibold text-[var(--color-text-muted)] whitespace-nowrap">Total</th>
                <th className="text-right py-2 font-semibold text-[var(--color-text-muted)] whitespace-nowrap">Daftar</th>
                <th className="w-6" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {data.map((row, i) => (
                <tr
                  key={i}
                  onClick={() => {
                    if (!isDrillingProdi) {
                      isDrillingFakultas ? onDrillDownProdi(row.label) : onDrillDownFakultas(row.label);
                    }
                  }}
                  className={`transition-colors ${isDrillingProdi ? 'hover:bg-[var(--color-bg-secondary)]/50' : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/10 cursor-pointer'}`}
                >
                  <td className="py-1.5 pr-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-[var(--color-text)] break-words leading-snug">{row.label}</span>
                    </div>
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono font-bold text-[var(--color-text)]">{row.total}</td>
                  <td className="py-1.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">{row.terdaftar}</td>
                  {!isDrillingProdi && (
                    <td className="py-1.5 pl-1 text-right">
                      <ChevronRight size={13} className="text-[var(--color-text-muted)] inline" />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && (
            <p className="text-center text-xs text-[var(--color-text-muted)] py-8">Tidak ada data</p>
          )}
        </div>
      </div>
    </div>
  );
}
