import { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Archive, Calendar, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ periodeId: string }>;
};

export default async function ArsipLayout({ children, params }: LayoutProps) {
  const { periodeId } = await params;

  // 1. Fetch periode details & verifikasi status Selesai
  const { data: periode } = await supabase
    .from('periode_wisuda')
    .select('id, nama_periode, status, tanggal_pelaksanaan, kuota')
    .eq('id', periodeId)
    .single();

  if (!periode || periode.status !== 'Selesai') {
    notFound(); // 404 jika periode tidak ditemukan atau belum selesai
  }

  // Format tanggal
  let formattedDate = '-';
  if (periode.tanggal_pelaksanaan) {
    const d = new Date(periode.tanggal_pelaksanaan);
    if (!isNaN(d.getTime())) {
      formattedDate = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(d);
    }
  }

  return (
    <div className="space-y-6">
      {/* ── HEADER ARSIP ── */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm overflow-hidden relative">
        {/* Background Decorative */}
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Archive size={120} />
        </div>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 relative z-10">
          <div className="space-y-4">
            <Link
              href="/admin/periode"
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-text-muted)] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              <ArrowLeft size={16} />
              Kembali ke Daftar Periode
            </Link>
            
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-lg">
                  <Archive size={20} />
                </div>
                <h1 className="text-2xl font-bold text-[var(--color-text)]">
                  Arsip: {periode.nama_periode}
                </h1>
              </div>
              <p className="text-sm text-[var(--color-text-muted)] flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  {formattedDate}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users size={14} />
                  Kuota: {periode.kuota || 0}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 text-[10px] uppercase font-bold tracking-wider">
                  Selesai
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT (Children) ── */}
      {children}
    </div>
  );
}