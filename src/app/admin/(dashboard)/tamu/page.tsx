import { Suspense } from "react";
import { getTamuList } from "@/actions/tamu";
import { getActivePeriode, getAllPeriode } from "@/actions/periode";
import { getScanMeta } from "@/actions/scanCache";
import { getSetting, getAllSettingsAdmin } from "@/actions/settings";
import TamuListClient from "./TamuListClient";
import ScanTamuClient from "./ScanTamuClient";
import TamuHeaderActions from "./TamuHeaderActions";
import TamuClientWrapper from "./TamuClientWrapper";
import { Users, Info, QrCode } from "lucide-react";
import Link from "next/link";
import { getAdminSession } from "@/actions/adminAuth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isRouteAllowed, type AdminRole } from "@/lib/permissions";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
};

export default async function AdminTamuPage(props: PageProps) {
  const resolvedSearchParams = await props.searchParams;
  let tab: string = typeof resolvedSearchParams?.tab === 'string' ? resolvedSearchParams.tab : 'daftar';

  const session = await getAdminSession();
  const cookieStore = await cookies();
  const absensiToken = cookieStore.get('absensi_token')?.value;

  if (!session && !absensiToken) {
    redirect('/admin/login');
  }

  let roleAllowed = false;
  let isPresensiOnly = false;

  if (session) {
    const role = session.role as AdminRole;
    if (isRouteAllowed(role, '/admin/tamu')) {
      roleAllowed = true;
    }
  }

  if (!roleAllowed && absensiToken) {
    // Admin presensi only
    isPresensiOnly = true;
    if (tab !== 'scan') {
      redirect('/admin/tamu?tab=scan');
    }
  } else if (!roleAllowed && !absensiToken) {
    redirect('/admin');
  }

  const [activePeriode, scanMeta, tamuListRes, allPeriode, allSettings] = await Promise.all([
    getActivePeriode(),
    getScanMeta('tamu'),
    getTamuList(),
    getAllPeriode(),
    getAllSettingsAdmin()
  ]);

  const tamuList = tamuListRes.success ? (tamuListRes.data || []) : [];
  const activePeriodes = allPeriode.filter(p => p.status === 'Sedang Dibuka');

  // Ambil pengaturan tamu
  const settingsMap: Record<string, string> = {};
  allSettings.forEach((s: any) => { settingsMap[s.key] = s.value; });
  const getVal = (key: string, def: string) => settingsMap[key] ?? def;

  const tamuSettings = {
    bgDepanUrl: getVal('tamu_bg_depan_url', ''),
    bgBelakangUrl: getVal('tamu_bg_belakang_url', ''),
    ttdUrl: getVal('tamu_ttd_url', ''),
    nomor: getVal('tamu_nomor', ''),
    tanggal: getVal('tamu_tanggal', ''),
    jabatan: getVal('tamu_jabatan', 'Rektor'),
    nama: getVal('tamu_nama', ''),
    nip: getVal('tamu_nip', ''),
    acara: getVal('tamu_acara', '')
  };

  return (
    <TamuClientWrapper
      initialTab={tab}
      isPresensiOnly={isPresensiOnly}
      daftarControlsNode={
        <TamuHeaderActions 
          data={tamuList} 
          settings={tamuSettings} 
          activePeriodes={activePeriodes} 
          currentPeriode={activePeriode?.nama_periode || ''} 
        />
      }
      daftarContentNode={
        <Suspense fallback={<div className="h-48 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>}>
          <TamuListClient 
            initialData={tamuList} 
            periode={activePeriode?.nama_periode || ''} 
            settings={tamuSettings}
          />
        </Suspense>
      }
      scanNode={
        <Suspense fallback={<div className="h-48 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>}>
          <ScanTamuClient initialMeta={scanMeta} isPresensiOnly={isPresensiOnly} />
        </Suspense>
      }
    />
  );
}
