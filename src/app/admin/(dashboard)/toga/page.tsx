import { Suspense } from "react";
import { getAllWisudawan } from "@/actions/wisudawan";
import { getActivePeriode, getAllPeriode } from "@/actions/periode";
import { getAdminSession } from "@/actions/adminAuth";
import { Shirt, Info, Table2, FileSpreadsheet, AlertCircle, Filter } from "lucide-react";
import ExportTogaButton from "./ExportTogaButton";
import ScanTogaClient from "./ScanTogaClient";
import { getScanMeta } from "@/actions/scanCache";

import Link from "next/link";
import TogaClientWrapper from "./TogaClientWrapper";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
};

export default async function AdminTogaPage(props: PageProps) {
  const resolvedSearchParams = await props.searchParams;
  const tab = (typeof resolvedSearchParams?.tab === 'string' ? resolvedSearchParams.tab : 'rekapitulasi') as string;

  const [adminSession, activePeriode, scanMeta, allPeriode] = await Promise.all([
    getAdminSession(),
    getActivePeriode(),
    getScanMeta('toga'),
    getAllPeriode()
  ]);

  const allWisudawan = await getAllWisudawan({
    role: adminSession?.role,
    unitKerja: adminSession?.unit_kerja
  });
  const activePeriodes = allPeriode.filter(p => p.status === 'Sedang Dibuka');

  // Ambil semua data wisudawan untuk periode aktif, tanpa memedulikan status terdaftar
  const periodeWisudawan = allWisudawan.filter(w => 
    w.periode === activePeriode?.nama_periode
  );

  // Wisudawan yang sudah memilih ukuran toga
  const togaWisudawan = periodeWisudawan.filter(w => w.toga && w.toga.trim() !== "");

  // Target Progress: Semua data wisudawan di periode aktif
  const targetWisudawan = periodeWisudawan;

  // Progress Pengisian Toga per Fakultas
  const progressFakultas: Record<string, { total: number; sudah: number; belum: number }> = {};
  let totalDataSemua = 0;
  let totalSudahSemua = 0;
  let totalBelumSemua = 0;

  targetWisudawan.forEach(w => {
    const f = w.fakultas || "Tanpa Fakultas";
    if (!progressFakultas[f]) {
      progressFakultas[f] = { total: 0, sudah: 0, belum: 0 };
    }
    progressFakultas[f].total += 1;
    totalDataSemua += 1;

    if (w.toga && w.toga.trim() !== "") {
      progressFakultas[f].sudah += 1;
      totalSudahSemua += 1;
    } else {
      progressFakultas[f].belum += 1;
      totalBelumSemua += 1;
    }
  });

  // Rekapitulasi per Fakultas
  const fakultasSet = Array.from(new Set(togaWisudawan.map(w => w.fakultas).filter(Boolean))).sort();
  const sizes = ["S", "M", "L", "XL", "XXL"];

  // Initialize recap structure
  const recap: Record<string, Record<string, number>> = {};
  fakultasSet.forEach(f => {
    recap[f!] = {};
    sizes.forEach(s => { recap[f!][s] = 0; });
    recap[f!]["Total"] = 0;
  });

  // Hitung total keseluruhan
  const grandTotal: Record<string, number> = { Total: 0 };
  sizes.forEach(s => { grandTotal[s] = 0; });

  togaWisudawan.forEach(w => {
    const f = w.fakultas || "Tanpa Fakultas";
    const s = w.toga ? w.toga.toUpperCase() : "";
    
    // Jika fakultas belum ada di recap, buat (untuk kasus "Tanpa Fakultas" jika ada)
    if (!recap[f]) {
      recap[f] = {};
      sizes.forEach(sz => { recap[f][sz] = 0; });
      recap[f]["Total"] = 0;
      if (f !== "Tanpa Fakultas" && !fakultasSet.includes(f)) {
        fakultasSet.push(f);
      }
    }

    if (sizes.includes(s)) {
      recap[f][s] += 1;
      recap[f]["Total"] += 1;
      grandTotal[s] += 1;
      grandTotal["Total"] += 1;
    }
  });

  const canScan = adminSession?.role === 'superadmin' || adminSession?.role === 'admin_institut';

  return (
    <TogaClientWrapper
      initialTab={tab}
      canScan={canScan}
      rekapControlsNode={
        <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 h-10 sm:h-9 flex-1 min-w-0">
            <Filter size={13} className="text-[var(--color-text-muted)] shrink-0" />
            <select className="text-sm sm:text-xs font-medium bg-transparent text-[var(--color-text)] outline-none flex-1 min-w-0">
              {activePeriodes.map(p => (
                <option key={p.id} value={p.nama_periode}>{p.nama_periode}</option>
              ))}
              {activePeriodes.length === 0 && <option value="">Tidak ada periode aktif</option>}
            </select>
          </div>
          <div className="shrink-0 flex h-10 sm:h-9">
            <ExportTogaButton data={togaWisudawan} filename={`Data-Toga-${activePeriode?.nama_periode || "All"}`} />
          </div>
        </div>
      }
      rekapContentNode={
        <>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--color-border)] bg-amber-50/50 dark:bg-amber-900/10 flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-600 dark:text-amber-500" />
              <h2 className="text-sm font-bold text-amber-900 dark:text-amber-300">Progress Pengisian Data Toga</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-[var(--color-text-subtle)] bg-[var(--color-bg)] border-b border-[var(--color-border)]">
                  <tr>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Fakultas</th>
                    <th className="px-4 py-3 font-semibold text-center w-32">Total Data</th>
                    <th className="px-4 py-3 font-semibold text-center w-32">Sudah Isi</th>
                    <th className="px-4 py-3 font-semibold text-center w-32">Belum Isi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {Object.keys(progressFakultas).length > 0 ? (
                    Object.keys(progressFakultas).sort().map((fakultas, idx) => (
                      <tr key={idx} className="hover:bg-[var(--color-bg-secondary)]/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-[var(--color-text)] whitespace-nowrap">{fakultas}</td>
                        <td className="px-4 py-3 text-center text-[var(--color-text-muted)] font-mono">
                          {progressFakultas[fakultas].total}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          {progressFakultas[fakultas].sudah}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-amber-600 dark:text-amber-400 font-mono">
                          {progressFakultas[fakultas].belum}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
                        Belum ada data pendaftar
                      </td>
                    </tr>
                  )}
                </tbody>
                {Object.keys(progressFakultas).length > 0 && (
                  <tfoot className="bg-[var(--color-bg-secondary)]/50 border-t border-[var(--color-border)] font-bold">
                    <tr>
                      <td className="px-4 py-3 text-[var(--color-text)]">TOTAL KESELURUHAN</td>
                      <td className="px-4 py-3 text-center text-[var(--color-text)] font-mono">{totalDataSemua}</td>
                      <td className="px-4 py-3 text-center text-emerald-600 dark:text-emerald-500 font-mono">{totalSudahSemua}</td>
                      <td className="px-4 py-3 text-center text-amber-600 dark:text-amber-500 font-mono">{totalBelumSemua}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex items-center gap-2">
              <Table2 size={16} className="text-[var(--color-text-subtle)]" />
              <h2 className="text-sm font-bold text-[var(--color-text)]">Rekapitulasi per Fakultas</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-[var(--color-text-subtle)] bg-[var(--color-bg)] border-b border-[var(--color-border)]">
                  <tr>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Fakultas</th>
                    {sizes.map(s => <th key={s} className="px-3 py-3 font-semibold text-center w-12">{s}</th>)}
                    <th className="px-4 py-3 font-semibold text-center w-16">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {Object.keys(recap).length > 0 ? (
                    Object.keys(recap).map((fakultas, idx) => (
                      <tr key={idx} className="hover:bg-[var(--color-bg-secondary)]/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-[var(--color-text)] whitespace-nowrap">{fakultas}</td>
                        {sizes.map(s => (
                          <td key={s} className="px-3 py-3 text-center text-[var(--color-text-muted)] font-mono">
                            {recap[fakultas][s]}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-center font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          {recap[fakultas]["Total"]}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={sizes.length + 2} className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
                        Belum ada data rekapitulasi toga
                      </td>
                    </tr>
                  )}
                </tbody>
                {Object.keys(recap).length > 0 && (
                  <tfoot className="bg-[var(--color-bg-secondary)]/50 border-t border-[var(--color-border)] font-bold">
                    <tr>
                      <td className="px-4 py-3 text-[var(--color-text)]">TOTAL KESELURUHAN</td>
                      {sizes.map(s => (
                        <td key={s} className="px-3 py-3 text-center text-[var(--color-text)] font-mono">{grandTotal[s]}</td>
                      ))}
                      <td className="px-4 py-3 text-center text-emerald-600 dark:text-emerald-500 font-mono">{grandTotal["Total"]}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      }
      scanNode={<ScanTogaClient initialMeta={scanMeta} />}
    />
  );
}
