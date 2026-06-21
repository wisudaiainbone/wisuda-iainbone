'use client';

import type { SummaryCards as SummaryCardsType } from '@/actions/dashboard';
import { Users, GraduationCap, Clock, TrendingUp } from 'lucide-react';

type Props = { summary: SummaryCardsType };

const cards = [
  {
    key: 'totalWisudawan' as const,
    label: 'Total Wisudawan',
    icon: Users,
    color: 'text-slate-600 dark:text-slate-300',
    bg: 'bg-slate-50 dark:bg-slate-800/40',
    border: 'border-slate-200 dark:border-slate-700/50',
    iconBg: 'bg-slate-100 dark:bg-slate-700/50',
  },
  {
    key: 'terdaftar' as const,
    label: 'Sudah Terdaftar',
    icon: GraduationCap,
    color: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800/50',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
  },
  {
    key: 'calonWisudawan' as const,
    label: 'Belum Terdaftar',
    icon: Clock,
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800/50',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
  },
  {
    key: 'persentaseTerdaftar' as const,
    label: 'Tingkat Pendaftaran',
    icon: TrendingUp,
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800/50',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    suffix: '%',
  },
];

export default function SummaryCards({ summary }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(card => {
        const Icon = card.icon;
        const value = summary[card.key];
        return (
          <div key={card.key} className={`rounded-2xl border p-4 ${card.bg} ${card.border}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${card.iconBg}`}>
              <Icon size={18} className={card.color} />
            </div>
            <p className="text-xs font-medium text-[var(--color-text-muted)] mb-0.5">{card.label}</p>
            <p className={`text-2xl font-black font-mono ${card.color}`}>
              {value.toLocaleString('id-ID')}{card.suffix ?? ''}
            </p>
          </div>
        );
      })}
    </div>
  );
}
