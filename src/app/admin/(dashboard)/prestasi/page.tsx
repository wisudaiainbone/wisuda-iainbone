import { getActivePeriode, getAllPeriode } from "@/actions/periode";
import { getAllWisudawan } from "@/actions/wisudawan";
import { getAdminSession } from "@/actions/adminAuth";
import { getPrestasiOverrides } from "@/actions/prestasiOverrides";
import { getSetting } from "@/actions/settings";
import { Trophy } from "lucide-react";
import Link from "next/link";
import PrestasiAkademikView from "./PrestasiAkademikView";
import ExportPrestasiButton from "./ExportPrestasiButton";
import GeneratePrestasiButton from "./GeneratePrestasiButton";
import PrintPrestasiButton from "./PrintPrestasiButton";
import SlidePrestasiPptxDialog from "./SlidePrestasiPptxDialog";
import { supabase } from "@/lib/supabase";
import { getProdiList } from "@/actions/prodi";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
};

export default async function AdminPrestasiPage(props: PageProps) {
  const resolvedSearchParams = await props.searchParams;
  const tab = typeof resolvedSearchParams?.tab === 'string' ? resolvedSearchParams.tab : 'akademik';

  const allPeriode = await getAllPeriode();
  const activePeriodes = allPeriode.filter(p => p.status === 'Sedang Dibuka');

  const adminSession = await getAdminSession();
  const allWisudawan = await getAllWisudawan({
    role: adminSession?.role,
    unitKerja: adminSession?.unit_kerja
  });

  const allProdi = await getProdiList();

  const filterPeriode = typeof resolvedSearchParams?.periode === 'string' 
    ? resolvedSearchParams.periode 
    : (activePeriodes[0]?.nama_periode || '');

  const overrides = await getPrestasiOverrides(filterPeriode);

  const targetWisudawan = allWisudawan.filter(w => 
    w.periode === filterPeriode && w.status === 'Terdaftar'
  );

  // Cek apakah prestasi_akd sudah pernah digenerate untuk periode ini
  // dengan melihat apakah ada minimal satu wisudawan yang memiliki nilai prestasi_akd
  let isGenerated = false;
  if (filterPeriode) {
    const { data: checkData } = await supabase
      .from('wisudawan')
      .select('nim')
      .eq('periode', filterPeriode)
      .eq('status', 'Terdaftar')
      .not('prestasi_akd', 'is', null)
      .not('prestasi_akd', 'eq', '')
      .limit(1);
    
    isGenerated = !!(checkData && checkData.length > 0);
  }

  // Ambil pengaturan sertifikat akademik
  const certSettings = {
    nomor: await getSetting('cert_akd_nomor', ''),
    tanggal: await getSetting('cert_akd_tanggal', ''),
    jabatan: await getSetting('cert_akd_jabatan', ''),
    nip: await getSetting('cert_akd_nip', ''),
    nama: await getSetting('cert_akd_nama', ''),
    bgUrl: await getSetting('cert_bg_url', ''),
    ttdUrl: await getSetting('cert_akd_ttd_url', '')
  };

  const currentPeriodeObj = allPeriode.find(p => p.nama_periode === filterPeriode) || activePeriodes[0];
  const tempatWisuda = currentPeriodeObj?.tempat_pelaksanaan || "Watampone";
  const tanggalWisuda = currentPeriodeObj?.tanggal_pelaksanaan 
    ? new Date(currentPeriodeObj.tanggal_pelaksanaan).toLocaleDateString("id-ID", {
        day: "numeric", month: "long", year: "numeric"
      })
    : "";

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <Link 
            href="?tab=akademik" 
            className={`flex items-center justify-center px-4 h-[38px] text-sm font-bold rounded-full transition-colors ${tab === 'akademik' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-border)]'}`}
          >
            Prestasi Akademik
          </Link>
          <Link 
            href="?tab=organisasi" 
            className={`flex items-center justify-center px-4 h-[38px] text-sm font-bold rounded-full transition-colors ${tab === 'organisasi' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-border)]'}`}
          >
            Pengalaman Organisasi
          </Link>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select className="flex-1 md:flex-none h-[38px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 text-sm font-medium text-[var(--color-text)] outline-none focus:ring-2 focus:ring-emerald-500/50 min-w-[180px]">
            {activePeriodes.map(p => (
              <option key={p.id} value={p.nama_periode}>{p.nama_periode}</option>
            ))}
            {activePeriodes.length === 0 && <option value="">Tidak ada periode aktif</option>}
          </select>

          {/* Tombol Generate — tampil hanya di tab akademik (hidden untuk admin_unit) */}
          {tab === 'akademik' && adminSession?.role !== 'admin_unit' && (
            <div className="shrink-0 h-[38px] flex">
              <GeneratePrestasiButton periode={filterPeriode} isGenerated={isGenerated} />
            </div>
          )}

          {tab === 'akademik' && adminSession?.role !== 'admin_unit' && (
            <div className="shrink-0 h-[38px] flex items-center gap-2">
              <SlidePrestasiPptxDialog data={targetWisudawan} prodiData={allProdi} />
              <PrintPrestasiButton 
                data={targetWisudawan} 
                periode={filterPeriode} 
                settings={certSettings} 
                tempatWisuda={tempatWisuda} 
                tanggalWisuda={tanggalWisuda} 
              />
            </div>
          )}

          <div className="shrink-0 h-[38px] flex">
            <ExportPrestasiButton data={targetWisudawan} overrides={overrides} periode={filterPeriode} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {tab === 'akademik' && (
          <PrestasiAkademikView
            data={targetWisudawan}
            periode={filterPeriode}
            overrides={overrides}
            isGenerated={isGenerated}
            role={adminSession?.role}
          />
        )}

        {tab === 'organisasi' && (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm p-8 flex flex-col items-center justify-center min-h-[300px]">
            <Trophy size={48} className="text-[var(--color-text-muted)] opacity-20 mb-4" />
            <p className="text-[var(--color-text-muted)] font-medium text-sm">Data pengalaman organisasi belum tersedia.</p>
          </div>
        )}
      </div>
    </div>
  );
}
