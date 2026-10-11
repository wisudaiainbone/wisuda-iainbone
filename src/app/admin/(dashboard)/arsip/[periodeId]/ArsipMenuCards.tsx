"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Users, GraduationCap, Trophy, BarChart3 } from "lucide-react";

type Props = {
  periodeId: string;
};

export default function ArsipMenuCards({ periodeId }: Props) {
  const cards = [
    {
      href: `/admin/arsip/${periodeId}/wisudawan`,
      icon: <Users size={32} className="text-blue-500" />,
      title: "Data Wisudawan",
      description: "Daftar lengkap wisudawan, filter, dan ekspor excel",
      color: "border-blue-200 bg-blue-50/50 hover:bg-blue-50 dark:border-blue-900/50 dark:bg-blue-900/10 dark:hover:bg-blue-900/20",
    },
    {
      href: `/admin/arsip/${periodeId}/toga`,
      icon: <GraduationCap size={32} className="text-emerald-500" />,
      title: "Data Toga",
      description: "Rekapitulasi ukuran toga dan status pengambilan",
      color: "border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-900/10 dark:hover:bg-emerald-900/20",
    },
    {
      href: `/admin/arsip/${periodeId}/prestasi`,
      icon: <Trophy size={32} className="text-amber-500" />,
      title: "Data Prestasi",
      description: "Daftar peraih predikat terbaik tingkat Fakultas dan Prodi",
      color: "border-amber-200 bg-amber-50/50 hover:bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/10 dark:hover:bg-amber-900/20",
    },
    {
      href: `/admin/arsip/${periodeId}/statistik`,
      icon: <BarChart3 size={32} className="text-purple-500" />,
      title: "Statistik Periode",
      description: "Laporan lengkap metrik dan demografi wisudawan",
      color: "border-purple-200 bg-purple-50/50 hover:bg-purple-50 dark:border-purple-900/50 dark:bg-purple-900/10 dark:hover:bg-purple-900/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, idx) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: idx * 0.1 }}
        >
          <Link
            href={card.href}
            className={`block p-6 h-full rounded-3xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${card.color}`}
          >
            <div className="mb-4">{card.icon}</div>
            <h2 className="text-lg font-bold text-[var(--color-text)] mb-2">
              {card.title}
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
              {card.description}
            </p>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}