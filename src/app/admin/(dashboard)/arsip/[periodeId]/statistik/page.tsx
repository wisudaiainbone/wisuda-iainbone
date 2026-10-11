import { getArsipStatistik } from "@/actions/arsip";
import { BarChart3, Users, BookOpen, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";

type PageProps = {
  params: Promise<{ periodeId: string }>;
};

export default async function ArsipStatistikPage({ params }: PageProps) {
  const { periodeId } = await params;

  const { data: periode } = await supabase
    .from('periode_wisuda')
    .select('nama_periode')
    .eq('id', periodeId)
    .single();

  if (!periode) return <div>Periode tidak ditemukan</div>;

  const stats = await getArsipStatistik(periode.nama_periode);

  if (!stats) return <div>Gagal memuat statistik</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
          <BarChart3 size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text)]">Statistik Arsip</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            Laporan lengkap periode {periode.nama_periode}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 shadow-sm text-center">
          <p className="text-sm text-[var(--color-text-muted)] mb-1">Total Wisudawan</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 font-mono">{stats.total}</p>
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 shadow-sm text-center">
          <p className="text-sm text-[var(--color-text-muted)] mb-1">Laki-Laki</p>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">{stats.jkDist.L}</p>
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 shadow-sm text-center">
          <p className="text-sm text-[var(--color-text-muted)] mb-1">Perempuan</p>
          <p className="text-3xl font-bold text-rose-600 dark:text-rose-400 font-mono">{stats.jkDist.P}</p>
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 shadow-sm text-center">
          <p className="text-sm text-[var(--color-text-muted)] mb-1">Hadir (Sesi)</p>
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 font-mono">{stats.sudahHadir}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={20} className="text-indigo-500" />
            <h3 className="text-lg font-bold text-[var(--color-text)]">Distribusi Fakultas</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(stats.byFakultas).map(([fakultas, jumlah]) => (
              <div key={fakultas} className="flex justify-between items-center p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50">
                <span className="font-semibold text-[var(--color-text)] text-sm">{fakultas || 'Tidak Diketahui'}</span>
                <span className="px-3 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 font-bold font-mono text-sm">
                  {jumlah as number}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Star size={20} className="text-amber-500" />
            <h3 className="text-lg font-bold text-[var(--color-text)]">Distribusi Predikat IPK</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(stats.ipkDist).map(([predikat, jumlah]) => (
              <div key={predikat} className="flex justify-between items-center p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50">
                <span className="font-semibold text-[var(--color-text)] text-sm">{predikat || 'Tidak Diketahui'}</span>
                <span className="px-3 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 font-bold font-mono text-sm">
                  {jumlah as number}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}