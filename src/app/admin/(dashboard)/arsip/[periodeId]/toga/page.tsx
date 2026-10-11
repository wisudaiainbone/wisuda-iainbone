import { getArsipStatistik } from "@/actions/arsip";
import { GraduationCap } from "lucide-react";
import { supabase } from "@/lib/supabase";

type PageProps = {
  params: Promise<{ periodeId: string }>;
};

export default async function ArsipTogaPage({ params }: PageProps) {
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
        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <GraduationCap size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text)]">Data Toga Arsip</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            Rekapitulasi ukuran toga untuk periode {periode.nama_periode}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[var(--color-text)] mb-4">Distribusi Ukuran Toga</h3>
          <div className="space-y-3">
            {Object.entries(stats.togaDist).map(([ukuran, jumlah]) => (
              <div key={ukuran} className="flex justify-between items-center p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50">
                <span className="font-semibold text-[var(--color-text)]">
                  {ukuran === '-' ? 'Belum Input Ukuran' : `Ukuran ${ukuran}`}
                </span>
                <span className="px-3 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold font-mono">
                  {jumlah as number}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm h-fit">
          <h3 className="text-lg font-bold text-[var(--color-text)] mb-4">Status Pengambilan Toga</h3>
          
          <div className="flex justify-between items-center p-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-900/10 mb-3">
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">Sudah Mengambil</span>
            <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">{stats.sudahToga}</span>
          </div>
          
          <div className="flex justify-between items-center p-4 rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-800/50 dark:bg-rose-900/10">
            <span className="font-semibold text-rose-700 dark:text-rose-400">Belum Mengambil</span>
            <span className="text-xl font-bold font-mono text-rose-700 dark:text-rose-400">{stats.belumToga}</span>
          </div>
        </div>
      </div>
    </div>
  );
}