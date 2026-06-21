import { Suspense } from "react";
import { getAllWisudawan } from "@/actions/wisudawan";
import { getProdiList } from "@/actions/prodi";
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
import Pagination from "@/components/ui/Pagination";
import SesiDialog from "./SesiDialog";
import NomorDialog from "./NomorDialog";
import { getAdminSession } from "@/actions/adminAuth";
import { getFakultasData } from "@/lib/fakultas";

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
  const [allWisudawan, dbProdiList] = await Promise.all([
    getAllWisudawan({
      role: adminSession?.role,
      unitKerja: adminSession?.unit_kerja
    }),
    getProdiList(),
  ]);

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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <UserCheck size={20} />
          </div>
          <div>
            <p className="text-xs uppercase font-bold tracking-wider text-[var(--color-text-subtle)]">Total Data Periode Ini</p>
            <p className="text-xl font-bold text-[var(--color-text)] font-mono">{allWisudawan.length}</p>
          </div>
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <GraduationCap size={20} />
          </div>
          <div>
            <p className="text-xs uppercase font-bold tracking-wider text-[var(--color-text-subtle)]">Total Pendaftar</p>
            <p className="text-xl font-bold text-[var(--color-text)] font-mono">{totalPendaftar}</p>
          </div>
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs uppercase font-bold tracking-wider text-[var(--color-text-subtle)]">Belum Mendaftar</p>
            <p className="text-xl font-bold text-[var(--color-text)] font-mono">{belumMendaftar}</p>
          </div>
        </div>
      </div>

      {/* Search Bar & Filters (Detached) */}
      <div className="flex flex-col gap-4 w-full">
        <div className="w-full">
          <Suspense fallback={<div className="h-10 w-full bg-[var(--color-bg-secondary)] animate-pulse rounded-xl"></div>}>
            <WisudawanSearch fakultasList={fakultasList} prodiList={prodiList} statusList={statusList}>
              <ExportXlsxButton data={wisudawanList} filename="data-wisudawan" />
              <ImportWisudawanDialog userRole={adminSession?.role || ''} unitKerja={adminSession?.unit_kerja} dbProdiList={dbProdiList} />
              <SesiDialog />
              <NomorDialog />
              <ExportDaftarButton data={wisudawanList} filename="daftar-wisudawan" />
              <TagDialog data={wisudawanList} />
              <SlidePptxDialog data={wisudawanList} prodiData={dbProdiList} />
              <AlbumDialog data={wisudawanList} prodiData={dbProdiList} />
            </WisudawanSearch>
          </Suspense>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
              <tr>
                <th className="px-3 py-4 font-normal text-[var(--color-text-muted)] w-10 text-center">No</th>
                <th className="px-3 py-4 font-normal text-[var(--color-text-muted)] w-12 text-center">Urut</th>
                <th className="px-3 py-4 font-normal text-[var(--color-text-muted)] w-14 text-center">Foto</th>
                <th className="px-4 py-4 font-normal text-[var(--color-text-muted)]">NIM</th>
                <th className="px-6 py-4 font-normal text-[var(--color-text-muted)] whitespace-nowrap">Nama Lengkap</th>
                <th className="px-4 py-4 font-normal text-[var(--color-text-muted)] text-center">Fakultas</th>
                <th className="px-4 py-4 font-normal text-[var(--color-text-muted)]">Prodi</th>
                {showSesi && (
                  <th className="px-3 py-4 font-normal text-[var(--color-text-muted)] text-center">Sesi</th>
                )}
                <th className="px-3 py-4 font-normal text-[var(--color-text-muted)] text-center">Yudisium & IPK</th>
                {showToga && (
                  <th className="px-3 py-4 font-normal text-[var(--color-text-muted)] text-center">Uk Toga</th>
                )}
                <th className="px-1 py-4 font-normal text-[var(--color-text-muted)] text-center w-12">Daftar</th>
                <th className="px-1 py-4 font-normal text-[var(--color-text-muted)] text-center w-12">Toga</th>
                <th className="px-1 py-4 font-normal text-[var(--color-text-muted)] text-center w-12">Hadir</th>
                <th className="px-3 py-4 font-normal text-[var(--color-text-muted)] text-right w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {paginatedList.map((w, index) => (
                <WisudawanTableRow key={w.nim} href={`/admin/wisudawan/${w.nim}`} className="hover:bg-[var(--color-bg-secondary)] transition-colors group">
                  <td className="px-3 py-4 text-[var(--color-text-muted)] font-medium text-center">
                    {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                  </td>
                  <td className="px-3 py-4 text-[var(--color-text-muted)] text-xs font-mono text-center">{w.urut || '-'}</td>
                  <td className="px-3 py-4">
                    <div className="flex justify-center">
                      <ImageModal src={w.foto} alt={w.nama_mahasiswa} />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-mono text-[var(--color-text-muted)] text-xs font-normal">{w.nim}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-[var(--color-text)] font-bold text-xs">{w.nama_gelar || w.nama_mahasiswa}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {(() => {
                      const fakData = getFakultasData(w.fakultas);
                      return (
                        <span className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold tracking-wider whitespace-nowrap border ${fakData.colorClass}`}>
                          {fakData.singkatan}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-[var(--color-text-muted)] text-xs font-medium">{w.prodi}</span>
                  </td>
                  {showSesi && (
                    <td className="px-3 py-4 text-center">
                      <span className={`inline-flex items-center justify-center px-2 py-1 rounded text-[10px] font-bold tracking-wider whitespace-nowrap border ${
                        w.sesi === 'Sesi Satu' ? 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800' :
                        w.sesi === 'Sesi Dua' ? 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-900/30 dark:text-fuchsia-400 dark:border-fuchsia-800' :
                        'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                      }`}>
                        {w.sesi || '-'}
                      </span>
                    </td>
                  )}
                  <td className="px-3 py-4 text-center">
                    <div className="flex flex-row flex-wrap items-center justify-center gap-1.5">
                      <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">
                        ({w.tanggal_yudisium || '-'})
                      </span>
                      <span className="font-mono text-xs font-bold text-[var(--color-text)]">
                        {w.ipk ? Number(w.ipk).toFixed(2) : '-'}
                      </span>
                      {w.predikat ? (
                        <>
                          <span className="text-xs text-[var(--color-text-muted)]">/</span>
                          <span className="text-xs font-bold text-[var(--color-text)] uppercase tracking-wider">
                            {w.predikat}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </td>
                  {showToga && (
                    <td className="px-3 py-4 text-center">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{w.toga || '-'}</span>
                    </td>
                  )}
                  <td className="px-1 py-4">
                    <div className="flex justify-center">
                      {Boolean(w.terdaftar && w.terdaftar !== 'false' && w.terdaftar !== '0') ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-sm">
                          <X size={12} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-1 py-4">
                    <div className="flex justify-center">
                      {Boolean(w.waktu_toga) ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-sm">
                          <X size={12} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-1 py-4">
                    <div className="flex justify-center">
                      {Boolean(w.waktu_hadir) ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-sm">
                          <X size={12} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/wisudawan/${w.nim}`}
                        className="text-blue-500 hover:text-blue-600 transition-colors"
                        title="Lihat Profil"
                      >
                        <Eye size={16} />
                      </Link>
                      {w.password && (
                        <ResetPasswordButton nim={w.nim} nama={w.nama_mahasiswa} />
                      )}
                      <DeleteWisudawanButton nim={w.nim} nama={w.nama_mahasiswa} />
                    </div>
                  </td>
                </WisudawanTableRow>
              ))}

              {paginatedList.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-6 py-12 text-center text-[var(--color-text-muted)]">
                    Belum ada data wisudawan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Control */}
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </div>

    </div>
  );
}
