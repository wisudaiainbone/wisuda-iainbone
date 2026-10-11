import { getArsipWisudawan } from "@/actions/arsip";
import ArsipWisudawanTable from "./ArsipWisudawanTable";
import { Users } from "lucide-react";
import { supabase } from "@/lib/supabase";

type PageProps = {
  params: Promise<{ periodeId: string }>;
};

export default async function ArsipWisudawanPage({ params }: PageProps) {
  const { periodeId } = await params;

  // Dapatkan nama_periode dari ID
  const { data: periode } = await supabase
    .from('periode_wisuda')
    .select('nama_periode')
    .eq('id', periodeId)
    .single();

  if (!periode) return <div>Periode tidak ditemukan</div>;

  const data = await getArsipWisudawan(periode.nama_periode);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <Users size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text)]">Data Wisudawan Arsip</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            Menampilkan data final yang diarsipkan
          </p>
        </div>
      </div>

      <ArsipWisudawanTable data={data} />
    </div>
  );
}