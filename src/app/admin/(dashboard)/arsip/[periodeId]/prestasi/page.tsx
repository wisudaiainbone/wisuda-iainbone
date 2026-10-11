import { getArsipWisudawan } from "@/actions/arsip";
import { Trophy, Award, Medal } from "lucide-react";
import { supabase } from "@/lib/supabase";

type PageProps = {
  params: Promise<{ periodeId: string }>;
};

export default async function ArsipPrestasiPage({ params }: PageProps) {
  const { periodeId } = await params;

  const { data: periode } = await supabase
    .from('periode_wisuda')
    .select('nama_periode')
    .eq('id', periodeId)
    .single();

  if (!periode) return <div>Periode tidak ditemukan</div>;

  const data = await getArsipWisudawan(periode.nama_periode);

  const prestasiAkd = data.filter(w => w.prestasi_akd);
  const prestasiProdi = data.filter(w => w.prestasi_prodi);
  const prestasiOrg = data.filter(w => w.prestasi_org);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <Trophy size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text)]">Data Prestasi Arsip</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            Daftar peraih prestasi periode {periode.nama_periode}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prestasi Akademik */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-amber-600 dark:text-amber-400">
            <Trophy size={20} />
            <h3 className="text-lg font-bold">Prestasi Akademik</h3>
          </div>
          <div className="space-y-4">
            {prestasiAkd.length > 0 ? prestasiAkd.map(w => (
              <div key={w.nim} className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50">
                <p className="font-bold text-[var(--color-text)]">{w.nama_mahasiswa}</p>
                <p className="text-xs text-[var(--color-text-muted)] font-mono">{w.nim}</p>
                <div className="mt-2 text-sm text-[var(--color-text)]">
                  <span className="font-semibold text-amber-600">{w.prestasi_akd}</span> - {w.fakultas}
                </div>
              </div>
            )) : <p className="text-sm text-[var(--color-text-muted)]">Belum ada data prestasi akademik.</p>}
          </div>
        </div>

        {/* Prestasi Prodi */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-emerald-600 dark:text-emerald-400">
            <Award size={20} />
            <h3 className="text-lg font-bold">Prestasi Prodi</h3>
          </div>
          <div className="space-y-4">
            {prestasiProdi.length > 0 ? prestasiProdi.map(w => (
              <div key={w.nim} className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50">
                <p className="font-bold text-[var(--color-text)]">{w.nama_mahasiswa}</p>
                <p className="text-xs text-[var(--color-text-muted)] font-mono">{w.nim}</p>
                <div className="mt-2 text-sm text-[var(--color-text)]">
                  <span className="font-semibold text-emerald-600">{w.prestasi_prodi}</span> - {w.prodi}
                </div>
              </div>
            )) : <p className="text-sm text-[var(--color-text-muted)]">Belum ada data prestasi prodi.</p>}
          </div>
        </div>

        {/* Prestasi Organisasi */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-purple-600 dark:text-purple-400">
            <Medal size={20} />
            <h3 className="text-lg font-bold">Prestasi Organisasi</h3>
          </div>
          <div className="space-y-4">
            {prestasiOrg.length > 0 ? prestasiOrg.map(w => (
              <div key={w.nim} className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50">
                <p className="font-bold text-[var(--color-text)]">{w.nama_mahasiswa}</p>
                <p className="text-xs text-[var(--color-text-muted)] font-mono">{w.nim}</p>
                <div className="mt-2 text-sm text-[var(--color-text)]">
                  <span className="font-semibold text-purple-600">{w.prestasi_org}</span> - {w.ormawa}
                </div>
              </div>
            )) : <p className="text-sm text-[var(--color-text-muted)]">Belum ada data prestasi organisasi.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}