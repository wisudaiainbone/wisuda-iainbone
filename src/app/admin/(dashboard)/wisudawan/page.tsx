import { Suspense } from "react";
import { getAllWisudawan } from "@/actions/wisudawan";
import { getProdiList } from "@/actions/prodi";
import { getSetting } from "@/actions/settings";
import { UserCheck, GraduationCap, Clock } from "lucide-react";
import { getAdminSession } from "@/actions/adminAuth";
import WisudawanContainer from "./WisudawanContainer";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
};

export default async function AdminWisudawanPage(props: PageProps) {
  const adminSession = await getAdminSession();
  const [allWisudawan, dbProdiList, allowDeleteSetting] = await Promise.all([
    getAllWisudawan({
      role: adminSession?.role,
      unitKerja: adminSession?.unit_kerja
    }),
    getProdiList(),
    getSetting('allow_delete_wisudawan', 'false'),
  ]);

  const allowDeleteWisudawan = allowDeleteSetting === 'true';

  // Extract unique lists for dropdowns
  const fakultasList = Array.from(new Set(allWisudawan.map(w => w.fakultas).filter(Boolean))).sort();
  const prodiList = Array.from(new Set(allWisudawan.map(w => w.prodi).filter(Boolean))).sort();
  const statusList = Array.from(new Set(allWisudawan.map(w => w.status).filter(Boolean))).sort();

  const totalPendaftar = allWisudawan.filter(w => Boolean(w.terdaftar && w.terdaftar !== 'false' && w.terdaftar !== '0')).length;
  const belumMendaftar = allWisudawan.length - totalPendaftar;

  return (
    <div className="space-y-6">

      {/* Stats Quick View */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-blue-50 border border-blue-100 dark:bg-blue-900/10 dark:border-blue-800/30 p-2 sm:p-4 rounded-xl flex items-center justify-center sm:justify-start gap-4 shadow-sm">
          <div className="hidden sm:flex w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 items-center justify-center shrink-0">
            <UserCheck size={20} />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-blue-600/80 dark:text-blue-400/80">
              <span className="sm:hidden">Data</span>
              <span className="hidden sm:inline">Total Data Periode Ini</span>
            </p>
            <p className="text-lg sm:text-xl font-bold text-blue-700 dark:text-blue-300 font-mono">{allWisudawan.length}</p>
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800/30 p-2 sm:p-4 rounded-xl flex items-center justify-center sm:justify-start gap-4 shadow-sm">
          <div className="hidden sm:flex w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 items-center justify-center shrink-0">
            <GraduationCap size={20} />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-emerald-600/80 dark:text-emerald-400/80">
              <span className="sm:hidden">Daftar</span>
              <span className="hidden sm:inline">Total Pendaftar</span>
            </p>
            <p className="text-lg sm:text-xl font-bold text-emerald-700 dark:text-emerald-300 font-mono">{totalPendaftar}</p>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-100 dark:bg-amber-900/10 dark:border-amber-800/30 p-2 sm:p-4 rounded-xl flex items-center justify-center sm:justify-start gap-4 shadow-sm">
          <div className="hidden sm:flex w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-amber-600/80 dark:text-amber-400/80">
              <span className="sm:hidden">Belum</span>
              <span className="hidden sm:inline">Belum Mendaftar</span>
            </p>
            <p className="text-lg sm:text-xl font-bold text-amber-700 dark:text-amber-300 font-mono">{belumMendaftar}</p>
          </div>
        </div>
      </div>

      <Suspense fallback={<div className="h-40 w-full bg-[var(--color-bg-secondary)] animate-pulse rounded-xl"></div>}>
        <WisudawanContainer 
          allWisudawan={allWisudawan}
          dbProdiList={dbProdiList}
          fakultasList={fakultasList}
          prodiList={prodiList}
          statusList={statusList}
          adminSession={adminSession}
          allowDeleteWisudawan={allowDeleteWisudawan}
        />
      </Suspense>

    </div>
  );
}
