'use client';

import { useState } from 'react';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import type { DashboardStats } from '@/actions/dashboard';

type Props = {
  stats: DashboardStats;
  periode?: string;
};

export default function ExportStatsButton({ stats, periode }: Props) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      // 1. Sheet Ringkasan
      const summaryData = [
        ['Indikator', 'Nilai'],
        ['Total Data Wisudawan', stats.summary.totalWisudawan],
        ['Sudah Mendaftar', stats.summary.terdaftar],
        ['Belum Mendaftar', stats.summary.calonWisudawan],
        ['Persentase Terdaftar', `${stats.summary.persentaseTerdaftar.toFixed(1)}%`],
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      wsSummary['!cols'] = [{ wch: 25 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

      // Helper function to auto-size columns
      const autoSize = (data: any[][]) => {
        return data[0].map((_, colIndex) => {
          const max = Math.max(...data.map(row => String(row[colIndex] ?? '').length));
          return { wch: Math.min(Math.max(max + 2, 10), 50) };
        });
      };

      // 2. Sheet Sebaran Fakultas & Prodi
      const sebaranHeaders = ['Fakultas', 'Prodi', 'Total Wisudawan', 'Terdaftar'];
      const sebaranRows = stats.byProdi.map(p => [
        p.fakultas || 'Tidak Diketahui',
        p.label,
        p.total,
        p.terdaftar
      ]);
      // Append Fakultas totals at the top
      const fakRows = stats.byFakultas.map(f => [
        f.label,
        'SEMUA PRODI (Total Fakultas)',
        f.total,
        f.terdaftar
      ]);
      const sebaranData = [sebaranHeaders, ...fakRows, [], ...sebaranRows];
      const wsSebaran = XLSX.utils.aoa_to_sheet(sebaranData);
      wsSebaran['!cols'] = autoSize(sebaranData);
      XLSX.utils.book_append_sheet(wb, wsSebaran, 'Sebaran Pendaftar');

      // 3. Sheet Jenis Kelamin
      const jkHeaders = ['Fakultas', 'Prodi', 'Laki-Laki', 'Perempuan'];
      const jkRows = stats.jenisKelaminProdi.map(p => [
        p.fakultas || 'Tidak Diketahui',
        p.label,
        p.L,
        p.P
      ]);
      const jkFakRows = stats.jenisKelaminFakultas.map(f => [
        f.label,
        'SEMUA PRODI',
        f.L,
        f.P
      ]);
      const jkData = [jkHeaders, ...jkFakRows, [], ...jkRows];
      const wsJk = XLSX.utils.aoa_to_sheet(jkData);
      wsJk['!cols'] = autoSize(jkData);
      XLSX.utils.book_append_sheet(wb, wsJk, 'Jenis Kelamin');

      // 4. Sheet Predikat
      const predikatHeaders = ['Fakultas', 'Prodi', 'Cumlaude', 'Sangat Memuaskan', 'Memuaskan', 'Lainnya'];
      const predikatRows = stats.predikatProdi.map(p => [
        p.fakultas || 'Tidak Diketahui',
        p.label,
        p.Cumlaude,
        p['Sangat Memuaskan'],
        p.Memuaskan,
        p.Lainnya
      ]);
      const predFakRows = stats.predikatFakultas.map(f => [
        f.label,
        'SEMUA PRODI',
        f.Cumlaude,
        f['Sangat Memuaskan'],
        f.Memuaskan,
        f.Lainnya
      ]);
      const predData = [predikatHeaders, ...predFakRows, [], ...predikatRows];
      const wsPred = XLSX.utils.aoa_to_sheet(predData);
      wsPred['!cols'] = autoSize(predData);
      XLSX.utils.book_append_sheet(wb, wsPred, 'Predikat');

      // 5. Sheet Toga
      const togaHeaders = ['Fakultas', 'Prodi', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
      const togaRows = stats.togaProdi.map(p => [
        p.fakultas || 'Tidak Diketahui',
        p.label,
        p.S || 0, p.M || 0, p.L || 0, p.XL || 0, p.XXL || 0, p.XXXL || 0
      ]);
      const togaFakRows = stats.togaFakultas.map(f => [
        f.label,
        'SEMUA PRODI',
        f.S || 0, f.M || 0, f.L || 0, f.XL || 0, f.XXL || 0, f.XXXL || 0
      ]);
      const togaData = [togaHeaders, ...togaFakRows, [], ...togaRows];
      const wsToga = XLSX.utils.aoa_to_sheet(togaData);
      wsToga['!cols'] = autoSize(togaData);
      XLSX.utils.book_append_sheet(wb, wsToga, 'Ukuran Toga');

      // 6. Sheet Ormawa
      const ormawaHeaders = ['Fakultas', 'Prodi', 'Aktif Ormawa', 'Tidak Aktif'];
      const ormawaRows = (stats.ormawaProdi.byLabel as any[]).map(p => [
        p.fakultas || 'Tidak Diketahui',
        p.label,
        p.aktif,
        p.tidakAktif
      ]);
      const ormFakRows = (stats.ormawaFakultas.byLabel as any[]).map(f => [
        f.label,
        'SEMUA PRODI',
        f.aktif,
        f.tidakAktif
      ]);
      const ormawaData = [ormawaHeaders, ...ormFakRows, [], ...ormawaRows];
      const wsOrmawa = XLSX.utils.aoa_to_sheet(ormawaData);
      wsOrmawa['!cols'] = autoSize(ormawaData);
      XLSX.utils.book_append_sheet(wb, wsOrmawa, 'Partisipasi Ormawa');

      // 7. Sheet Kehadiran
      const hadirHeaders = ['Fakultas', 'Prodi', 'Hadir', 'Belum Hadir'];
      const hadirRows = (stats.kehadiranProdi?.byLabel || []).map(p => [
        p.fakultas || 'Tidak Diketahui',
        p.label,
        p.sudah,
        p.belum
      ]);
      const hadirFakRows = (stats.kehadiranFakultas?.byLabel || []).map(f => [
        f.label,
        'SEMUA PRODI',
        f.sudah,
        f.belum
      ]);
      const hadirData = [hadirHeaders, ...hadirFakRows, [], ...hadirRows];
      const wsHadir = XLSX.utils.aoa_to_sheet(hadirData);
      wsHadir['!cols'] = autoSize(hadirData);
      XLSX.utils.book_append_sheet(wb, wsHadir, 'Status Kehadiran');

      // 8. Sheet Pengambilan Toga
      const ambilTogaHeaders = ['Fakultas', 'Prodi', 'Sudah Ambil', 'Belum Ambil'];
      const ambilTogaRows = (stats.ambilTogaProdi?.byLabel || []).map(p => [
        p.fakultas || 'Tidak Diketahui',
        p.label,
        p.sudah,
        p.belum
      ]);
      const ambilTogaFakRows = (stats.ambilTogaFakultas?.byLabel || []).map(f => [
        f.label,
        'SEMUA PRODI',
        f.sudah,
        f.belum
      ]);
      const ambilTogaData = [ambilTogaHeaders, ...ambilTogaFakRows, [], ...ambilTogaRows];
      const wsAmbilToga = XLSX.utils.aoa_to_sheet(ambilTogaData);
      wsAmbilToga['!cols'] = autoSize(ambilTogaData);
      XLSX.utils.book_append_sheet(wb, wsAmbilToga, 'Pengambilan Toga');

      // 9. Sheet IPK
      const ipkHeaders = ['Fakultas', 'Prodi', '3.50 - 4.00 (Pujian)', '3.01 - 3.49 (Sangat Memuaskan)', '2.76 - 3.00 (Memuaskan)', '2.00 - 2.75 (Baik)'];
      const ipkRows = (stats.ipkProdi || []).map(p => [
        p.fakultas || 'Tidak Diketahui',
        p.label,
        p.pujian,
        p.sangatMemuaskan,
        p.memuaskan,
        p.baik
      ]);
      const ipkFakRows = (stats.ipkFakultas || []).map(f => [
        f.label,
        'SEMUA PRODI',
        f.pujian,
        f.sangatMemuaskan,
        f.memuaskan,
        f.baik
      ]);
      const ipkData = [ipkHeaders, ...ipkFakRows, [], ...ipkRows];
      const wsIpk = XLSX.utils.aoa_to_sheet(ipkData);
      wsIpk['!cols'] = autoSize(ipkData);
      XLSX.utils.book_append_sheet(wb, wsIpk, 'Sebaran IPK');

      // 10. Sheet Sesi
      // Karena sesi dinamis, kita ambil semua key unik dari byLabel
      const sesiKeysSet = new Set<string>();
      (stats.sesiFakultas?.byLabel || []).forEach(f => Object.keys(f).forEach(k => { if (k !== 'label' && k !== 'fakultas') sesiKeysSet.add(k); }));
      const sesiKeys = Array.from(sesiKeysSet);
      
      const sesiHeaders = ['Fakultas', 'Prodi', ...sesiKeys];
      const sesiRows = (stats.sesiProdi?.byLabel || []).map(p => [
        p.fakultas || 'Tidak Diketahui',
        p.label,
        ...sesiKeys.map(k => p[k] || 0)
      ]);
      const sesiFakRows = (stats.sesiFakultas?.byLabel || []).map(f => [
        f.label,
        'SEMUA PRODI',
        ...sesiKeys.map(k => f[k] || 0)
      ]);
      const sesiSheetData = [sesiHeaders, ...sesiFakRows, [], ...sesiRows];
      const wsSesi = XLSX.utils.aoa_to_sheet(sesiSheetData);
      wsSesi['!cols'] = autoSize(sesiSheetData);
      XLSX.utils.book_append_sheet(wb, wsSesi, 'Keterisian Sesi');

      // 11. Sheet Prestasi
      const prestasiHeaders = ['Fakultas', 'Prodi', 'Ada Prestasi', 'Tidak Ada'];
      const prestasiRows = (stats.prestasiProdi?.byLabel || []).map(p => [
        p.fakultas || 'Tidak Diketahui',
        p.label,
        p.sudah,
        p.belum
      ]);
      const prestasiFakRows = (stats.prestasiFakultas?.byLabel || []).map(f => [
        f.label,
        'SEMUA PRODI',
        f.sudah,
        f.belum
      ]);
      const prestasiData = [prestasiHeaders, ...prestasiFakRows, [], ...prestasiRows];
      const wsPrestasi = XLSX.utils.aoa_to_sheet(prestasiData);
      wsPrestasi['!cols'] = autoSize(prestasiData);
      XLSX.utils.book_append_sheet(wb, wsPrestasi, 'Status Prestasi');

      // 12. Sheet Survei
      const surveiHeaders = ['Fakultas', 'Prodi', 'Sudah Mengisi', 'Belum Mengisi'];
      const surveiRows = (stats.surveiProdi?.byLabel || []).map(p => [
        p.fakultas || 'Tidak Diketahui',
        p.label,
        p.sudah,
        p.belum
      ]);
      const surveiFakRows = (stats.surveiFakultas?.byLabel || []).map(f => [
        f.label,
        'SEMUA PRODI',
        f.sudah,
        f.belum
      ]);
      const surveiData = [surveiHeaders, ...surveiFakRows, [], ...surveiRows];
      const wsSurvei = XLSX.utils.aoa_to_sheet(surveiData);
      wsSurvei['!cols'] = autoSize(surveiData);
      XLSX.utils.book_append_sheet(wb, wsSurvei, 'Kepatuhan Survei');

      // Save file
      const date = new Date().toISOString().slice(0, 10);
      const filename = `Statistik-Dashboard-${periode || 'Semua-Periode'}-${date}.xlsx`;
      XLSX.writeFile(wb, filename);

    } catch (err) {
      console.error('Export error:', err);
      alert('Gagal mengekspor data statistik. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      title="Export Statistik ke Excel"
      className="flex items-center gap-1.5 px-3 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-sm shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <FileSpreadsheet size={14} />
      )}
      <span className="hidden sm:inline">{loading ? 'Mengekspor...' : 'Export XLSX'}</span>
    </button>
  );
}
