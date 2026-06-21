'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useTransition, useState } from 'react';
import type { DashboardStats } from '@/actions/dashboard';
import SummaryCards from './charts/SummaryCards';
import PeriodeChart from './charts/PeriodeChart';
import SebaranChart from './charts/SebaranChart';
import JenisKelaminChart from './charts/JenisKelaminChart';
import PredikatChart from './charts/PredikatChart';
import OrmawatChart from './charts/OrmawatChart';
import TogaChart from './charts/TogaChart';
import KehadiranChart from './charts/KehadiranChart';
import AmbilTogaChart from './charts/AmbilTogaChart';
import IpkChart from './charts/IpkChart';
import SesiChart from './charts/SesiChart';
import PrestasiChart from './charts/PrestasiChart';
import SurveiChart from './charts/SurveiChart';
import TrenHarianChart from './charts/TrenHarianChart';
import ExportStatsButton from './charts/ExportStatsButton';
import { RefreshCw, LayoutDashboard, Filter, ChevronRight, X } from 'lucide-react';

type Props = {
  stats: DashboardStats;
  periodeOptions: { id: any; nama: string }[];
  selectedPeriode?: string;
  viewBy: 'fakultas' | 'prodi';
  adminName: string;
};

export default function DashboardClient({ stats, periodeOptions, selectedPeriode, adminName }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // Drilldown state — null = tampil per Fakultas, string = tampil Prodi dari Fakultas tersebut
  const [drillFakultas, setDrillFakultas] = useState<string | null>(null);
  const [drillProdi, setDrillProdi] = useState<string | null>(null);

  const updateParams = (key: string, value: string | undefined) => {
    const params = new URLSearchParams();
    if (selectedPeriode) params.set('periode', selectedPeriode);
    if (value !== undefined) params.set(key, value);
    else params.delete(key);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  const handleDrillDownFakultas = (fakultas: string) => {
    setDrillFakultas(fakultas);
    setDrillProdi(null);
  };

  const handleDrillDownProdi = (prodi: string) => {
    setDrillProdi(prodi);
  };

  const handleDrillUpFakultas = () => {
    setDrillFakultas(null);
    setDrillProdi(null);
  };

  const handleDrillUpProdi = () => {
    setDrillProdi(null);
  };

  const cachedAt = stats.cachedAt
    ? new Date(stats.cachedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    : null;

  // Hitung data untuk chart berdasarkan drilldown state
  const isDrillingFakultas = drillFakultas !== null;
  const isDrillingProdi = drillProdi !== null;

  const sebaranData = isDrillingProdi
    ? stats.byProdi.filter(d => d.label === drillProdi)
    : isDrillingFakultas
      ? stats.byProdi.filter(d => d.fakultas === drillFakultas)
      : stats.byFakultas;

  const jenisKelaminData = isDrillingProdi
    ? stats.jenisKelaminProdi.filter(d => d.label === drillProdi)
    : isDrillingFakultas
      ? stats.jenisKelaminProdi.filter(d => d.fakultas === drillFakultas)
      : stats.jenisKelaminFakultas;

  const predikatData = isDrillingProdi
    ? stats.predikatProdi.filter(d => d.label === drillProdi)
    : isDrillingFakultas
      ? stats.predikatProdi.filter(d => d.fakultas === drillFakultas)
      : stats.predikatFakultas;

  const togaData = isDrillingProdi
    ? stats.togaProdi.filter(d => d.label === drillProdi)
    : isDrillingFakultas
      ? stats.togaProdi.filter(d => d.fakultas === drillFakultas)
      : stats.togaFakultas;

  const kehadiranData = isDrillingProdi
    ? {
        sudah: stats.kehadiranProdi?.byLabel?.find(d => d.label === drillProdi)?.sudah || 0,
        belum: stats.kehadiranProdi?.byLabel?.find(d => d.label === drillProdi)?.belum || 0,
        byLabel: []
      }
    : isDrillingFakultas
      ? {
          sudah: (stats.kehadiranProdi?.byLabel || []).filter(d => d.fakultas === drillFakultas).reduce((s, d) => s + d.sudah, 0),
          belum: (stats.kehadiranProdi?.byLabel || []).filter(d => d.fakultas === drillFakultas).reduce((s, d) => s + d.belum, 0),
          byLabel: []
        }
      : (stats.kehadiranFakultas || { sudah: 0, belum: 0, byLabel: [] });

  const ambilTogaData = isDrillingProdi
    ? {
        sudah: stats.ambilTogaProdi?.byLabel?.find(d => d.label === drillProdi)?.sudah || 0,
        belum: stats.ambilTogaProdi?.byLabel?.find(d => d.label === drillProdi)?.belum || 0,
        byLabel: []
      }
    : isDrillingFakultas
      ? {
          sudah: (stats.ambilTogaProdi?.byLabel || []).filter(d => d.fakultas === drillFakultas).reduce((s, d) => s + d.sudah, 0),
          belum: (stats.ambilTogaProdi?.byLabel || []).filter(d => d.fakultas === drillFakultas).reduce((s, d) => s + d.belum, 0),
          byLabel: []
        }
      : (stats.ambilTogaFakultas || { sudah: 0, belum: 0, byLabel: [] });

  const ipkData = isDrillingProdi
    ? (stats.ipkProdi || []).filter(d => d.label === drillProdi)
    : isDrillingFakultas
      ? (stats.ipkProdi || []).filter(d => d.fakultas === drillFakultas)
      : (stats.ipkFakultas || []);

  const sesiData = isDrillingProdi
    ? {
        topSesi: Object.entries(stats.sesiProdi?.byLabel?.find(d => d.label === drillProdi) || {}).filter(([k]) => k !== 'label' && k !== 'fakultas').map(([name, value]) => ({ name, value: Number(value) })),
        bySesi: [],
        byLabel: []
      }
    : isDrillingFakultas
      ? {
          topSesi: (stats.sesiFakultas?.bySesi || []).map(s => ({ name: s.sesi, value: s.jumlah })),
          bySesi: [],
          byLabel: []
        }
      : { topSesi: (stats.sesiFakultas?.bySesi || []).slice(0, 6).map(s => ({ name: s.sesi, value: s.jumlah })), ...(stats.sesiFakultas || { bySesi: [], byLabel: [] }) };

  // Manual merge for Sesi Fakultas drilldown
  if (isDrillingFakultas && !isDrillingProdi) {
    const fakProdis = (stats.sesiProdi?.byLabel || []).filter(d => d.fakultas === drillFakultas);
    const mergedSesi: Record<string, number> = {};
    fakProdis.forEach(p => {
      Object.entries(p).forEach(([k, v]) => {
        if (k !== 'label' && k !== 'fakultas') mergedSesi[k] = (mergedSesi[k] || 0) + Number(v);
      });
    });
    sesiData.topSesi = Object.entries(mergedSesi).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }

  const prestasiData = isDrillingProdi
    ? { sudah: stats.prestasiProdi?.byLabel?.find(d => d.label === drillProdi)?.sudah || 0, belum: stats.prestasiProdi?.byLabel?.find(d => d.label === drillProdi)?.belum || 0, byLabel: [] }
    : isDrillingFakultas
      ? { sudah: (stats.prestasiProdi?.byLabel || []).filter(d => d.fakultas === drillFakultas).reduce((s, d) => s + d.sudah, 0), belum: (stats.prestasiProdi?.byLabel || []).filter(d => d.fakultas === drillFakultas).reduce((s, d) => s + d.belum, 0), byLabel: [] }
      : (stats.prestasiFakultas || { sudah: 0, belum: 0, byLabel: [] });

  const surveiData = isDrillingProdi
    ? { sudah: stats.surveiProdi?.byLabel?.find(d => d.label === drillProdi)?.sudah || 0, belum: stats.surveiProdi?.byLabel?.find(d => d.label === drillProdi)?.belum || 0, byLabel: [] }
    : isDrillingFakultas
      ? { sudah: (stats.surveiProdi?.byLabel || []).filter(d => d.fakultas === drillFakultas).reduce((s, d) => s + d.sudah, 0), belum: (stats.surveiProdi?.byLabel || []).filter(d => d.fakultas === drillFakultas).reduce((s, d) => s + d.belum, 0), byLabel: [] }
      : (stats.surveiFakultas || { sudah: 0, belum: 0, byLabel: [] });

  // Ormawa — untuk drilldown filter byLabel per prodi dalam fakultas yang dipilih
  const ormawaData = isDrillingProdi
    ? {
        ...stats.ormawaProdi,
        byLabel: (stats.ormawaProdi.byLabel as any[]).filter(d => d.label === drillProdi),
      }
    : isDrillingFakultas
      ? {
          ...stats.ormawaProdi,
          byLabel: (stats.ormawaProdi.byLabel as any[]).filter(d => d.fakultas === drillFakultas),
        }
      : stats.ormawaFakultas;

  const activeDrillScope = isDrillingProdi ? drillProdi : drillFakultas;
  const isDrillingActive = isDrillingFakultas || isDrillingProdi;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard size={18} className="text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-lg font-bold text-[var(--color-text)]">Dashboard Statistik</h1>
          </div>
          {cachedAt && (
            <p className="text-xs text-[var(--color-text-muted)]">
              Data di-cache pukul {cachedAt} · diperbarui setiap 15 menit
            </p>
          )}
        </div>

        {/* Filter Periode */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 h-9">
            <Filter size={13} className="text-[var(--color-text-muted)] shrink-0" />
            <select
              value={selectedPeriode ?? ''}
              onChange={e => updateParams('periode', e.target.value || undefined)}
              className="text-xs font-medium bg-transparent text-[var(--color-text)] outline-none min-w-[140px]"
            >
              <option value="">Semua Periode</option>
              {periodeOptions.map(p => (
                <option key={p.id} value={p.nama}>{p.nama}</option>
              ))}
            </select>
          </div>
          <ExportStatsButton stats={stats} periode={selectedPeriode} />
          {isPending && <RefreshCw size={16} className="text-emerald-600 animate-spin" />}
        </div>
      </div>

      {/* Drilldown Breadcrumb */}
      {isDrillingFakultas && (
        <div className="sticky top-[72px] mt-4 z-30 flex flex-wrap items-center gap-2 px-4 py-2.5 bg-emerald-50/90 dark:bg-emerald-900/60 backdrop-blur-md border border-emerald-200 dark:border-emerald-800/50 rounded-xl shadow-sm">
          <button
            onClick={handleDrillUpFakultas}
            className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            Per Fakultas
          </button>
          <ChevronRight size={13} className="text-emerald-500 shrink-0" />
          
          {isDrillingProdi ? (
            <>
              <button
                onClick={handleDrillUpProdi}
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline truncate max-w-[150px]"
              >
                {drillFakultas}
              </button>
              <ChevronRight size={13} className="text-emerald-500 shrink-0" />
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 truncate max-w-[200px]">{drillProdi}</span>
              <button
                onClick={handleDrillUpProdi}
                className="ml-auto p-1 rounded-full text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                title="Kembali ke Fakultas"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <>
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 truncate">{drillFakultas}</span>
              <button
                onClick={handleDrillUpFakultas}
                className="ml-auto p-1 rounded-full text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                title="Kembali ke Fakultas"
              >
                <X size={14} />
              </button>
            </>
          )}
        </div>
      )}

      {/* 1. Summary Cards */}
      <SummaryCards summary={stats.summary} />

      {/* 2. Kuota & Pendaftar Per Periode */}
      {stats.periodes.length > 0 && (
        <PeriodeChart data={stats.periodes} />
      )}

      {/* 3. Sebaran Statistik */}
      <SebaranChart
        data={sebaranData}
        isDrillingFakultas={isDrillingFakultas}
        isDrillingProdi={isDrillingProdi}
        drillFakultas={drillFakultas}
        onDrillDownFakultas={handleDrillDownFakultas}
        onDrillDownProdi={handleDrillDownProdi}
      />

      {/* Grid 2-col: JK + Predikat */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <JenisKelaminChart data={jenisKelaminData} isDrilling={isDrillingActive} drillFakultas={activeDrillScope} />
        <PredikatChart data={predikatData} isDrilling={isDrillingActive} drillFakultas={activeDrillScope} />
      </div>

      {/* Grid 2-col: Ormawa + Toga */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <OrmawatChart data={ormawaData} isDrilling={isDrillingActive} drillFakultas={activeDrillScope} />
        <TogaChart data={togaData} isDrilling={isDrillingFakultas || isDrillingProdi} drillFakultas={drillFakultas} />
      </div>

      {/* Grid 2-col: Kehadiran + Ambil Toga */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <KehadiranChart data={kehadiranData} isDrilling={isDrillingFakultas || isDrillingProdi} drillFakultas={drillFakultas} />
        <AmbilTogaChart data={ambilTogaData} isDrilling={isDrillingFakultas || isDrillingProdi} drillFakultas={drillFakultas} />
      </div>

      {/* Grid 2-col: IPK + Sesi */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <IpkChart data={ipkData} isDrilling={isDrillingFakultas || isDrillingProdi} drillFakultas={drillFakultas} />
        <SesiChart data={sesiData} isDrilling={isDrillingFakultas || isDrillingProdi} drillFakultas={drillFakultas} />
      </div>

      {/* Grid 2-col: Prestasi + Survei */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <PrestasiChart data={prestasiData} isDrilling={isDrillingFakultas || isDrillingProdi} drillFakultas={drillFakultas} />
        <SurveiChart data={surveiData} isDrilling={isDrillingFakultas || isDrillingProdi} drillFakultas={drillFakultas} />
      </div>

      {/* 5. Tren Pendaftaran Harian */}
      {stats.trenHarian.length > 0 && (
        <TrenHarianChart data={stats.trenHarian} />
      )}
    </div>
  );
}
