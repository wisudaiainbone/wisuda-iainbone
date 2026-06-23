import { Suspense } from "react";
import { getAllWisudawan } from "@/actions/wisudawan";
import { getProdiList } from "@/actions/prodi";
import { getSetting } from "@/actions/settings";
import { Search, UserCheck, GraduationCap, Clock, Eye, Trash2, User, Check, X, UploadCloud } from "lucide-react";
import Link from "next/link";
import ImageModal from "./ImageModal";
import ImportWisudawanDialog from "./ImportWisudawanDialog";
import DeleteWisudawanButton from "./DeleteWisudawanButton";
import ResetPasswordButton from "./ResetPasswordButton";
import WisudawanSearch from "./WisudawanSearch";
import ExportXlsxButton from "./ExportXlsxButton";
import ExportDaftarButton from "./ExportDaftarButton";
import SlidePptxDialog from "./SlidePptxDialog";
import AlbumDialog from "./AlbumDialog";
import TagDialog from "./TagDialog";
import WisudawanTableRow from "./WisudawanTableRow";
import WisudawanMobileCard from "./WisudawanMobileCard";
import Pagination from "@/components/ui/Pagination";
import SesiDialog from "./SesiDialog";
import NomorDialog from "./NomorDialog";
import { getAdminSession } from "@/actions/adminAuth";
import { getFakultasData } from "@/lib/fakultas";
import WisudawanTableClient from "./WisudawanTableClient";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
};

export default async function AdminWisudawanPage(props: PageProps) {
  // Await searchParams in Next.js 15+ (or use directly if Next < 15, await works for both if casted correctly, but let's safely read it)
  const resolvedSearchParams = await props.searchParams;
  const q = typeof resolvedSearchParams?.q === 'string' ? resolvedSearchParams.q.toLowerCase() : '';
  const filterFakultas = typeof resolvedSearchParams?.fakultas === 'string' ? resolvedSearchParams.fakultas : '';
  const filterProdi = typeof resolvedSearchParams?.prodi === 'string' ? resolvedSearchParams.prodi : '';
  const filterStatus = typeof resolvedSearchParams?.status === 'string' ? resolvedSearchParams.status : '';
  const filterToga = typeof resolvedSearchParams?.toga === 'string' ? resolvedSearchParams.toga : '';
  const filterHadir = typeof resolvedSearchParams?.hadir === 'string' ? resolvedSearchParams.hadir : '';
  const filterAmbilToga = typeof resolvedSearchParams?.ambil_toga === 'string' ? resolvedSearchParams.ambil_toga : '';
  const filterSesi = typeof resolvedSearchParams?.sesi === 'string' ? resolvedSearchParams.sesi : '';
  const showToga = filterToga !== '';
  const showSesi = filterSesi !== '';

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

  let wisudawanList = allWisudawan.filter(w => {
    const matchQ = w.nama_mahasiswa.toLowerCase().includes(q) || w.nim.toLowerCase().includes(q);
    const matchFakultas = filterFakultas ? w.fakultas === filterFakultas : true;
    const matchProdi = filterProdi ? w.prodi === filterProdi : true;
    const matchStatus = filterStatus ? w.status === filterStatus : true;
    const matchToga = !filterToga ? true : filterToga === 'sudah' ? !!w.toga : !w.toga;
    const matchHadir = !filterHadir ? true : filterHadir === 'sudah' ? !!w.waktu_hadir : !w.waktu_hadir;
    const matchAmbilToga = !filterAmbilToga ? true : filterAmbilToga === 'sudah' ? !!w.waktu_toga : !w.waktu_toga;
    const matchSesi = !filterSesi ? true : filterSesi === 'Tanpa Sesi' ? !w.sesi : w.sesi === filterSesi;
    return matchQ && matchFakultas && matchProdi && matchStatus && matchToga && matchHadir && matchAmbilToga && matchSesi;
  }).sort((a, b) => {
    // Urutkan berdasarkan waktu unggah terbaru (descending)
    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return timeB - timeA;
  });

  // Paginasi
  const ITEMS_PER_PAGE = 50;
  const currentPage = Math.max(1, Number(resolvedSearchParams?.page) || 1);
  const totalItems = wisudawanList.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedList = wisudawanList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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

      {/* Search Bar & Filters (Detached) */}
      <div className="flex flex-col gap-4 w-full">
        <div className="w-full">
          <Suspense fallback={<div className="h-10 w-full bg-[var(--color-bg-secondary)] animate-pulse rounded-xl"></div>}>
            <WisudawanSearch fakultasList={fakultasList} prodiList={prodiList} statusList={statusList}>
              <ImportWisudawanDialog userRole={adminSession?.role || ''} unitKerja={adminSession?.unit_kerja} dbProdiList={dbProdiList} />
              <ExportXlsxButton data={wisudawanList} filename="data-wisudawan" />
              <ExportDaftarButton data={wisudawanList} filename="daftar-wisudawan" />
              
              {adminSession?.role !== 'admin_unit' && (
                <>
                  <SesiDialog />
                  <SlidePptxDialog data={wisudawanList} prodiData={dbProdiList} />
                  <TagDialog data={wisudawanList} />
                  <NomorDialog />
                  <AlbumDialog data={wisudawanList} prodiData={dbProdiList} />
                </>
              )}
            </WisudawanSearch>
          </Suspense>
        </div>
      </div>

      <WisudawanTableClient 
        paginatedList={paginatedList}
        currentPage={currentPage}
        ITEMS_PER_PAGE={ITEMS_PER_PAGE}
        totalPages={totalPages}
        totalItems={totalItems}
        showSesi={showSesi}
        showToga={showToga}
        adminSession={adminSession}
        allowDeleteWisudawan={allowDeleteWisudawan}
      />
    </div>
  );
}
