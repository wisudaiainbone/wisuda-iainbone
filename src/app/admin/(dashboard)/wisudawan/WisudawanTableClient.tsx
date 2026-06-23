"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, Check, X, User, Trash2, Loader2 } from "lucide-react";
import ImageModal from "./ImageModal";
import ResetPasswordButton from "./ResetPasswordButton";
import DeleteWisudawanButton from "./DeleteWisudawanButton";
import WisudawanTableRow from "./WisudawanTableRow";
import WisudawanMobileCard from "./WisudawanMobileCard";
import Pagination from "@/components/ui/Pagination";
import { getFakultasData } from "@/lib/fakultas";
import { deleteWisudawanBulk } from "@/actions/wisudawan";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface WisudawanTableClientProps {
  paginatedList: any[];
  currentPage: number;
  ITEMS_PER_PAGE: number;
  totalPages: number;
  totalItems: number;
  showSesi: boolean;
  showToga: boolean;
  adminSession: any;
  allowDeleteWisudawan: boolean;
}

export default function WisudawanTableClient({
  paginatedList,
  currentPage,
  ITEMS_PER_PAGE,
  totalPages,
  totalItems,
  showSesi,
  showToga,
  adminSession,
  allowDeleteWisudawan,
}: WisudawanTableClientProps) {
  const [selectedNims, setSelectedNims] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [showConfirmBulk, setShowConfirmBulk] = useState(false);

  const canDelete = 
    adminSession?.role === 'superadmin' || 
    adminSession?.role === 'admin_institut' || 
    (adminSession?.role === 'admin_unit' && allowDeleteWisudawan);

  const isTerdaftar = (w: any) => Boolean(w.terdaftar && w.terdaftar !== 'false' && w.terdaftar !== '0');

  const selectableList = paginatedList.filter(w => !isTerdaftar(w));
  const allSelectedOnPage = selectableList.length > 0 && selectableList.every(w => selectedNims.includes(w.nim));

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const newNims = selectableList.map(w => w.nim).filter(nim => !selectedNims.includes(nim));
      setSelectedNims(prev => [...prev, ...newNims]);
    } else {
      const pageNims = selectableList.map(w => w.nim);
      setSelectedNims(prev => prev.filter(nim => !pageNims.includes(nim)));
    }
  };

  const handleSelectRow = (nim: string, checked: boolean) => {
    if (checked) {
      setSelectedNims(prev => [...prev, nim]);
    } else {
      setSelectedNims(prev => prev.filter(n => n !== nim));
    }
  };

  const handleBulkDelete = () => {
    startTransition(async () => {
      const res = await deleteWisudawanBulk(selectedNims);
      if (res.success) {
        setSelectedNims([]);
      } else {
        alert(`Gagal menghapus: ${res.error}`);
      }
      setShowConfirmBulk(false);
    });
  };

  return (
    <div className="space-y-4">
      {/* Floating Action Bar for Bulk Selection */}
      {selectedNims.length > 0 && canDelete && (
        <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center justify-between shadow-sm sticky top-20 z-50 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-500 text-white text-xs font-bold">
              {selectedNims.length}
            </span>
            <span className="text-sm font-medium text-rose-800">
              Data Terpilih
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedNims([])}
              className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
              disabled={isPending}
            >
              Batal
            </button>
            <button
              onClick={() => setShowConfirmBulk(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
              disabled={isPending}
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Hapus Terpilih
            </button>
          </div>
        </div>
      )}

      {/* Table Section (Desktop) */}
      <div className="hidden md:block bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
              <tr>
                {canDelete && (
                  <th className="px-4 py-4 w-10 text-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50 cursor-pointer"
                      checked={allSelectedOnPage}
                      disabled={selectableList.length === 0 || isPending}
                      onChange={handleSelectAll}
                    />
                  </th>
                )}
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
              {paginatedList.map((w, index) => {
                const terdaftar = isTerdaftar(w);
                const isSelected = selectedNims.includes(w.nim);
                
                return (
                  <WisudawanTableRow key={w.nim} href={`/admin/wisudawan/${w.nim}`} className={`hover:bg-[var(--color-bg-secondary)] transition-colors group ${isSelected ? 'bg-rose-50/50 dark:bg-rose-900/10' : ''}`}>
                    {canDelete && (
                      <td className="px-4 py-4 text-center relative z-10" onClick={(e) => e.stopPropagation()}>
                        {!terdaftar ? (
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            checked={isSelected}
                            onChange={(e) => handleSelectRow(w.nim, e.target.checked)}
                          />
                        ) : (
                          <div className="w-4 h-4 mx-auto opacity-0" />
                        )}
                      </td>
                    )}
                    <td className="px-3 py-4 text-[var(--color-text-muted)] font-medium text-center">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>
                    <td className="px-3 py-4 text-[var(--color-text-muted)] text-xs font-mono text-center">{w.urut || '-'}</td>
                    <td className="px-3 py-4 relative z-10" onClick={(e) => e.stopPropagation()}>
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
                        {terdaftar ? (
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
                    <td className="px-3 py-4 text-right relative z-10" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/wisudawan/${w.nim}`}
                          className="text-blue-500 hover:text-blue-600 transition-colors"
                          title="Lihat Profil"
                          prefetch={true}
                        >
                          <Eye size={16} />
                        </Link>
                        {w.password && (
                          <ResetPasswordButton nim={w.nim} nama={w.nama_mahasiswa} />
                        )}
                        <DeleteWisudawanButton nim={w.nim} nama={w.nama_mahasiswa} userRole={adminSession?.role || ''} allowDeleteWisudawan={allowDeleteWisudawan} />
                      </div>
                    </td>
                  </WisudawanTableRow>
                );
              })}

              {paginatedList.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-6 py-12 text-center text-[var(--color-text-muted)]">
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

      {/* Card Section (Mobile) */}
      <div className="md:hidden space-y-4">
        {canDelete && selectableList.length > 0 && (
          <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] flex items-center justify-between shadow-sm">
            <span className="text-sm font-medium text-[var(--color-text)]">Pilih Semua (Belum Terdaftar)</span>
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              checked={allSelectedOnPage}
              disabled={isPending}
              onChange={handleSelectAll}
            />
          </div>
        )}

        {paginatedList.map((w, index) => {
          const terdaftar = isTerdaftar(w);
          const isSelected = selectedNims.includes(w.nim);

          return (
            <WisudawanMobileCard 
              key={w.nim} 
              href={`/admin/wisudawan/${w.nim}`} 
              className={`block bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 shadow-sm hover:border-emerald-300 transition-colors group relative ${isSelected ? 'ring-2 ring-emerald-500 bg-emerald-50/20 dark:bg-emerald-900/10' : ''}`}
            >
              <div className="flex gap-3">
                {canDelete && !terdaftar && (
                  <div className="absolute top-4 right-4 z-10" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer shadow-sm"
                      checked={isSelected}
                      onChange={(e) => handleSelectRow(w.nim, e.target.checked)}
                    />
                  </div>
                )}

                <div className="w-16 h-20 shrink-0 overflow-hidden rounded-lg bg-[var(--color-bg-secondary)] flex items-center justify-center relative z-10" onClick={(e) => e.stopPropagation()}>
                  {w.foto ? (
                    <ImageModal src={w.foto} alt="Foto" />
                  ) : (
                    <User size={24} className="text-[var(--color-text-muted)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-[var(--color-text)] truncate">{w.nama_gelar || w.nama_mahasiswa}</p>
                      <p className="font-mono text-xs text-[var(--color-text-muted)]">{w.nim}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-[var(--color-bg-secondary)] shrink-0">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </span>
                  </div>
                  
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-medium">
                    {(() => {
                      const fakData = getFakultasData(w.fakultas);
                      return (
                        <span className={`px-1.5 py-0.5 rounded border ${fakData.colorClass}`}>
                          {fakData.singkatan}
                        </span>
                      );
                    })()}
                    <span className="px-1.5 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] truncate max-w-[120px]">
                      {w.prodi}
                    </span>
                    {showSesi && w.sesi && (
                      <span className={`px-1.5 py-0.5 rounded border ${
                          w.sesi === 'Sesi Satu' ? 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800' :
                          w.sesi === 'Sesi Dua' ? 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-900/30 dark:text-fuchsia-400 dark:border-fuchsia-800' :
                          'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                        }`}>
                        {w.sesi}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                    <span>IPK: <strong className="text-[var(--color-text)]">{w.ipk ? Number(w.ipk).toFixed(2) : '-'}</strong></span>
                    {w.predikat && <span>• <strong className="text-[var(--color-text)]">{w.predikat}</strong></span>}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center justify-between gap-2 relative z-10">
                <div className="flex gap-2 text-[10px]">
                  <div className={`flex flex-col items-center justify-center w-12 h-10 rounded-lg border ${terdaftar ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400' : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800/50 dark:text-rose-400'}`}>
                    {terdaftar ? <Check size={14} /> : <X size={14} />}
                    <span>Daftar</span>
                  </div>
                  <div className={`flex flex-col items-center justify-center w-12 h-10 rounded-lg border ${Boolean(w.waktu_toga) ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400' : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800/50 dark:text-rose-400'}`}>
                    {Boolean(w.waktu_toga) ? <Check size={14} /> : <X size={14} />}
                    <span>Toga</span>
                  </div>
                  <div className={`flex flex-col items-center justify-center w-12 h-10 rounded-lg border ${Boolean(w.waktu_hadir) ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400' : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800/50 dark:text-rose-400'}`}>
                    {Boolean(w.waktu_hadir) ? <Check size={14} /> : <X size={14} />}
                    <span>Hadir</span>
                  </div>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Link
                    href={`/admin/wisudawan/${w.nim}`}
                    className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Lihat Profil"
                    prefetch={true}
                  >
                    <Eye size={16} />
                  </Link>
                  {w.password && (
                    <ResetPasswordButton nim={w.nim} nama={w.nama_mahasiswa} />
                  )}
                  <DeleteWisudawanButton nim={w.nim} nama={w.nama_mahasiswa} userRole={adminSession?.role || ''} allowDeleteWisudawan={allowDeleteWisudawan} />
                </div>
              </div>
              
              {/* Link overlay over whole card except buttons */}
              <Link prefetch={true} href={`/admin/wisudawan/${w.nim}`} className="absolute inset-0 z-0"></Link>
              
            </WisudawanMobileCard>
          );
        })}

        {paginatedList.length === 0 && (
          <div className="p-8 text-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-muted)]">
            Belum ada data wisudawan.
          </div>
        )}

        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </div>

      <ConfirmDialog
        isOpen={showConfirmBulk}
        onClose={() => setShowConfirmBulk(false)}
        onConfirm={handleBulkDelete}
        title="Hapus Data Massal"
        message={`Yakin ingin menghapus ${selectedNims.length} data wisudawan yang belum mendaftar? Foto yang terlampir akan ikut terhapus permanen.`}
        confirmText="Hapus Permanen"
        isLoading={isPending}
      />
    </div>
  );
}
