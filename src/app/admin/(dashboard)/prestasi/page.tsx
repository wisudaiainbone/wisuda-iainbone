import { getActivePeriode, getAllPeriode } from "@/actions/periode";
import { getAllWisudawan } from "@/actions/wisudawan";
import { getAdminSession } from "@/actions/adminAuth";
import { getPrestasiOverrides } from "@/actions/prestasiOverrides";
import { getSetting, getAllSettingsAdmin } from "@/actions/settings";
import { Trophy, Filter } from "lucide-react";
import Link from "next/link";
import PrestasiAkademikView from "./PrestasiAkademikView";
import ExportPrestasiButton from "./ExportPrestasiButton";
import GeneratePrestasiButton from "./GeneratePrestasiButton";
import PrintPrestasiButton from "./PrintPrestasiButton";
import SlidePrestasiPptxDialog from "./SlidePrestasiPptxDialog";
import PrestasiClientWrapper from "./PrestasiClientWrapper";
import { supabase } from "@/lib/supabase";
import { getProdiList } from "@/actions/prodi";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
};

export default async function AdminPrestasiPage(props: PageProps) {
  const resolvedSearchParams = await props.searchParams;
  const tab = typeof resolvedSearchParams?.tab === 'string' ? resolvedSearchParams.tab : 'akademik';

  const [allPeriode, adminSession, allProdi] = await Promise.all([
    getAllPeriode(),
    getAdminSession(),
    getProdiList()
  ]);
  const activePeriodes = allPeriode.filter(p => p.status === 'Sedang Dibuka');

  const filterPeriode = typeof resolvedSearchParams?.periode === 'string' 
    ? resolvedSearchParams.periode 
    : (activePeriodes[0]?.nama_periode || '');

  const [allWisudawan, overrides, allSettings] = await Promise.all([
    getAllWisudawan({
      role: adminSession?.role,
      unitKerja: adminSession?.unit_kerja
    }),
    getPrestasiOverrides(filterPeriode),
    getAllSettingsAdmin()
  ]);

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
  const settingsMap: Record<string, string> = {};
  allSettings.forEach((s: any) => { settingsMap[s.key] = s.value; });
  const getVal = (key: string, def: string) => settingsMap[key] ?? def;

  const certSettings = {
    nomor: getVal('cert_akd_nomor', ''),
    tanggal: getVal('cert_akd_tanggal', ''),
    jabatan: getVal('cert_akd_jabatan', ''),
    nip: getVal('cert_akd_nip', ''),
    nama: getVal('cert_akd_nama', ''),
    bgUrl: getVal('cert_bg_url', ''),
    ttdUrl: getVal('cert_akd_ttd_url', '')
  };

  const currentPeriodeObj = allPeriode.find(p => p.nama_periode === filterPeriode) || activePeriodes[0];
  const tempatWisuda = currentPeriodeObj?.tempat_pelaksanaan || "Watampone";
  const tanggalWisuda = currentPeriodeObj?.tanggal_pelaksanaan 
    ? new Date(currentPeriodeObj.tanggal_pelaksanaan).toLocaleDateString("id-ID", {
        day: "numeric", month: "long", year: "numeric"
      })
    : "";

  return (
    <PrestasiClientWrapper
      initialTab={tab}
      akademikControlsNode={
        <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
          {/* Periode Dropdown */}
          <div className="flex items-center gap-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 h-10 flex-1 min-w-0">
            <Filter size={13} className="text-[var(--color-text-muted)] shrink-0" />
            <select className="text-sm sm:text-xs font-medium bg-transparent text-[var(--color-text)] outline-none flex-1 min-w-0">
              {activePeriodes.map(p => (
                <option key={p.id} value={p.nama_periode}>{p.nama_periode}</option>
              ))}
              {activePeriodes.length === 0 && <option value="">Tidak ada periode aktif</option>}
            </select>
          </div>

          {/* Export XLSX Button */}
          <div className="shrink-0 flex h-10">
            <ExportPrestasiButton data={targetWisudawan} overrides={overrides} periode={filterPeriode} />
          </div>
        </div>
      }
      akademikActionButtonsNode={
        adminSession?.role !== 'admin_unit' ? (
          <div className="flex flex-row flex-wrap items-stretch gap-2 w-full sm:w-auto mt-1 sm:mt-0 [&>*]:flex-auto [&>*]:sm:flex-none">
            <GeneratePrestasiButton periode={filterPeriode} isGenerated={isGenerated} />
            <SlidePrestasiPptxDialog data={targetWisudawan} prodiData={allProdi} />
            <PrintPrestasiButton 
              data={targetWisudawan} 
              periode={filterPeriode} 
              settings={certSettings} 
              tempatWisuda={tempatWisuda} 
              tanggalWisuda={tanggalWisuda} 
            />
          </div>
        ) : undefined
      }
      akademikContentNode={
        <PrestasiAkademikView
          data={targetWisudawan}
          periode={filterPeriode}
          overrides={overrides}
          isGenerated={isGenerated}
          role={adminSession?.role}
        />
      }
      organisasiContentNode={
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm p-8 flex flex-col items-center justify-center min-h-[300px]">
          <Trophy size={48} className="text-[var(--color-text-muted)] opacity-20 mb-4" />
          <p className="text-[var(--color-text-muted)] font-medium text-sm">Data pengalaman organisasi belum tersedia.</p>
        </div>
      }
    />
  );
}
