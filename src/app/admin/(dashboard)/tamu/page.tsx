import { Suspense } from "react";
import { getTamuList } from "@/actions/tamu";
import { getActivePeriode, getAllPeriode } from "@/actions/periode";
import { getScanMeta } from "@/actions/scanCache";
import { getSetting } from "@/actions/settings";
import TamuListClient from "./TamuListClient";
import ScanTamuClient from "./ScanTamuClient";
import TamuHeaderActions from "./TamuHeaderActions";
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
  let tab = typeof resolvedSearchParams?.tab === 'string' ? resolvedSearchParams.tab : 'daftar';

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

  const activePeriode = await getActivePeriode();
  const scanMeta = await getScanMeta('tamu');
  
  const tamuListRes = await getTamuList();
  const tamuList = tamuListRes.success ? (tamuListRes.data || []) : [];

  const allPeriode = await getAllPeriode();
  const activePeriodes = allPeriode.filter(p => p.status === 'Sedang Dibuka');

  // Ambil pengaturan tamu
  const bgDepanUrl = await getSetting('tamu_bg_depan_url', '', true);
  const bgBelakangUrl = await getSetting('tamu_bg_belakang_url', '', true);
  const ttdUrl = await getSetting('tamu_ttd_url', '', true);
  const nomor = await getSetting('tamu_nomor', '', true);
  const tanggal = await getSetting('tamu_tanggal', '', true);
  const jabatan = await getSetting('tamu_jabatan', 'Rektor', true);
  const nama = await getSetting('tamu_nama', '', true);
  const nip = await getSetting('tamu_nip', '', true);
  const acara = await getSetting('tamu_acara', '', true);

  const tamuSettings = {
    bgDepanUrl,
    bgBelakangUrl,
    ttdUrl,
    nomor,
    tanggal,
    jabatan,
    nama,
    nip,
    acara
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      {tab === 'daftar' && (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          {/* Tabs */}
          {!isPresensiOnly && (
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="?tab=daftar"
                className={`flex items-center justify-center px-4 h-[38px] text-sm font-bold rounded-full transition-colors ${
                  tab === 'daftar' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-border)]'
                }`}
              >
                Daftar Tamu
              </Link>
              <Link
                href="?tab=scan"
                className={`flex items-center justify-center px-4 h-[38px] text-sm font-bold rounded-full transition-colors ${
                  tab === 'scan' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-border)]'
                }`}
              >
                Scan Kehadiran
              </Link>
            </div>
          )}

          <TamuHeaderActions 
            data={tamuList} 
            settings={tamuSettings} 
            activePeriodes={activePeriodes} 
            currentPeriode={activePeriode?.nama_periode || ''} 
          />
        </div>
      )}

      <div className="flex flex-col gap-6">
        <Suspense fallback={<div className="h-48 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>}>
          {tab === 'daftar' ? (
            <TamuListClient 
              initialData={tamuList} 
              periode={activePeriode?.nama_periode || ''} 
              settings={tamuSettings}
            />
          ) : (
            <ScanTamuClient initialMeta={scanMeta} isPresensiOnly={isPresensiOnly} />
          )}
        </Suspense>
      </div>
    </div>
  );
}
