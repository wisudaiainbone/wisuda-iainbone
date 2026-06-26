import { getAllPeriode } from "@/actions/periode";
import { getAdminSession } from "@/actions/adminAuth";
import Link from "next/link";
import { Calendar, Users, Edit3, Plus, UserCheck, Activity } from "lucide-react";
import DeletePeriodeButton from "./DeletePeriodeButton";

export default async function AdminPeriodePage() {
  const [allPeriode, session] = await Promise.all([
    getAllPeriode(),
    getAdminSession()
  ]);
  const role = session?.role;

  return (
    <div className="space-y-6 w-full">

      {allPeriode.length === 0 ? (
        <div className="p-8 text-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl text-[var(--color-text-muted)]">
          Tidak ada data periode wisuda yang ditemukan.
        </div>
      ) : (
        <>
          {/* Mobile View: Cards */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {allPeriode.map((periode: any) => {
              const tahunMatch = periode.nama_periode.match(/Tahun\s+(\d{4})/i);
              const tahun = tahunMatch ? tahunMatch[1] : '-';

              return (
                <div
                  key={periode.id}
                  className={`relative p-5 rounded-2xl border transition-all ${periode.status === 'Sedang Dibuka'
                    ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800/50'
                    : 'bg-[var(--color-surface)] border-[var(--color-border)] hover:border-emerald-300 dark:hover:border-emerald-800'
                    }`}
                >
                  {/* Badge Absolute Dihapus */}

                  <h3 className="text-lg font-bold text-[var(--color-text)]">{periode.nama_periode}</h3>

                  <div className="mt-3 grid grid-cols-2 gap-y-2 text-sm text-[var(--color-text-muted)]">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-emerald-500" />
                      <span>Tahun: {tahun}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-amber-500" />
                      <span>Kuota: {periode.kuota || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity size={14} className="text-blue-500" />
                      <span>Total: {periode.totalPendaftar || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserCheck size={14} className="text-emerald-500" />
                      <span>Terdaftar: {periode.pendaftarAktif || 0}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-semibold text-[var(--color-text-muted)]">Status Periode:</span>
                      {periode.status === 'Sedang Dibuka' ? (
                        <div className="px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 text-xs uppercase font-bold tracking-wider rounded-full flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Aktif
                        </div>
                      ) : (
                        <div className="px-2.5 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 text-xs uppercase font-bold tracking-wider rounded-full flex items-center gap-1.5">
                          Selesai
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 w-full">
                      <Link
                        href={`/admin/periode/${periode.id}`}
                        className={`flex items-center justify-center gap-2 flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${periode.status === 'Sedang Dibuka'
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 dark:text-emerald-400'
                          }`}
                      >
                        <Edit3 size={16} />
                        Edit
                      </Link>
                      {role === 'superadmin' && (
                        <DeletePeriodeButton id={periode.id} nama={periode.nama_periode} isActive={periode.status === 'Sedang Dibuka'} />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
                  <tr>
                    <th className="px-6 py-4 font-normal text-[var(--color-text-muted)]">Periode</th>
                    <th className="px-6 py-4 font-normal text-[var(--color-text-muted)]">Tahun</th>
                    <th className="px-6 py-4 font-normal text-[var(--color-text-muted)]">Kuota</th>
                    <th className="px-6 py-4 font-normal text-[var(--color-text-muted)]">Total</th>
                    <th className="px-6 py-4 font-normal text-[var(--color-text-muted)]">Terdaftar</th>
                    <th className="px-6 py-4 font-normal text-[var(--color-text-muted)]">Status</th>
                    <th className="px-6 py-4 font-normal text-[var(--color-text-muted)] text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {allPeriode.map((periode: any) => {
                    const tahunMatch = periode.nama_periode.match(/Tahun\s+(\d{4})/i);
                    const tahun = tahunMatch ? tahunMatch[1] : '-';
                    return (
                      <tr key={periode.id} className="hover:bg-[var(--color-bg-secondary)]/50 transition-colors">
                        <td className="px-6 py-4 font-normal text-[var(--color-text)]">
                          {periode.nama_periode}
                        </td>
                        <td className="px-6 py-4 text-[var(--color-text-muted)]">
                          {tahun}
                        </td>
                        <td className="px-6 py-4 text-[var(--color-text-muted)]">
                          <div className="flex items-center gap-2">
                            <Users size={14} className="text-amber-500" />
                            {periode.kuota || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[var(--color-text-muted)]">
                          {periode.totalPendaftar || 0}
                        </td>
                        <td className="px-6 py-4 text-[var(--color-text-muted)]">
                          {periode.pendaftarAktif || 0}
                        </td>
                        <td className="px-6 py-4">
                          {periode.status === 'Sedang Dibuka' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 text-xs font-semibold">
                              Selesai
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/periode/${periode.id}`}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 dark:text-emerald-400 font-medium transition-colors"
                              title="Edit Periode"
                            >
                              <Edit3 size={14} />
                            </Link>
                            {role === 'superadmin' && (
                              <DeletePeriodeButton id={periode.id} nama={periode.nama_periode} isActive={periode.status === 'Sedang Dibuka'} />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Floating Action Button (Tambah) */}
      <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50">
        <Link
          href="/admin/periode/tambah"
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] shadow-emerald-600/30 transition-transform hover:scale-105 active:scale-95"
          title="Tambah Periode"
        >
          <Plus size={24} />
        </Link>
      </div>
    </div>
  );
}
