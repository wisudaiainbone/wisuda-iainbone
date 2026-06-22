'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

type WisudawanRow = {
  nim: string;
  nama_mahasiswa: string;
  nama_gelar?: string;
  ttl?: string;
  jenis_kelamin?: string;
  email?: string;
  fakultas?: string;
  prodi?: string;
  prodi_singkat?: string;
  ipk?: number | null;
  predikat?: string;
  tanggal_yudisium?: string;
  judul_skripsi?: string;
  ormawa?: string;
  jabatan_dalam_ormawa?: string;
  prestasi_akd?: string;
  prestasi_org?: string;
  periode?: string;
  status?: string;
  sesi?: string;
  id_wisuda?: string;
  urut?: number | null;
  waktu_hadir?: string;
  id_undangan?: string;
  toga?: string;
  waktu_toga?: string;
  foto?: string;
  sertifikat?: string;
  timestamp?: string;
  terdaftar?: string;
  survei?: string;
};

type Props = {
  data: WisudawanRow[];
  filename?: string;
};

export default function ExportXlsxButton({ data, filename = 'data-wisudawan' }: Props) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!data.length) return;
    setLoading(true);
    try {
      const XLSX = await import('xlsx');

      const headers = [
        'No', 'Urut', 'NIM', 'Nama Mahasiswa', 'Nama Gelar', 'TTL', 'Jenis Kelamin',
        'Email', 'Fakultas', 'Prodi', 'IPK', 'Predikat',
        'Tanggal Yudisium', 'Judul Skripsi/Tesis', 'Ormawa', 'Jabatan Ormawa',
        'Prestasi Akademik', 'Periode', 'Status', 'Sesi',
        'Toga', 'Terdaftar'
      ];

      const rows = data.map((w, i) => [
        i + 1,
        w.urut ?? '',
        w.nim,
        w.nama_mahasiswa,
        w.nama_gelar ?? '',
        w.ttl ?? '',
        w.jenis_kelamin ?? '',
        w.email ?? '',
        w.fakultas ?? '',
        w.prodi ?? '',
        w.ipk != null ? Number(w.ipk).toFixed(2) : '',
        w.predikat ?? '',
        w.tanggal_yudisium ?? '',
        w.judul_skripsi ?? '',
        w.ormawa ?? '',
        w.jabatan_dalam_ormawa ?? '',
        w.prestasi_akd ?? '',
        w.periode ?? '',
        w.status ?? '',
        w.sesi ?? '',
        w.toga ?? '',
        Boolean(w.terdaftar && w.terdaftar !== 'false' && w.terdaftar !== '0') ? 'Ya' : 'Tidak',
      ]);

      // --- SHEET REKAP ---
      const rekapMap = new Map<string, any>();
      
      data.forEach(w => {
        const fak = w.fakultas || 'Tanpa Fakultas';
        const prd = w.prodi || 'Tanpa Prodi';
        const key = `${fak}|${prd}`;
        if (!rekapMap.has(key)) {
          rekapMap.set(key, {
            fakultas: fak, prodi: prd, total: 0, terdaftar: 0,
            togaS: 0, togaM: 0, togaL: 0, togaXL: 0, togaXXL: 0, togaLain: 0, togaKosong: 0,
            jkL: 0, jkP: 0, jkKosong: 0,
            ipkHigh: 0, ipkMid: 0, ipkLow: 0, ipkKosong: 0
          });
        }
        
        const r = rekapMap.get(key);
        r.total++;
        if (Boolean(w.terdaftar && w.terdaftar !== 'false' && w.terdaftar !== '0')) r.terdaftar++;
        
        const toga = w.toga ? w.toga.toUpperCase().trim() : '';
        if (toga === 'S') r.togaS++;
        else if (toga === 'M') r.togaM++;
        else if (toga === 'L') r.togaL++;
        else if (toga === 'XL') r.togaXL++;
        else if (toga === 'XXL') r.togaXXL++;
        else if (toga === '') r.togaKosong++;
        else r.togaLain++;
        
        const jk = w.jenis_kelamin ? w.jenis_kelamin.toUpperCase().trim() : '';
        if (jk === 'L' || jk === 'LAKI-LAKI') r.jkL++;
        else if (jk === 'P' || jk === 'PEREMPUAN') r.jkP++;
        else r.jkKosong++;
        
        const ipk = w.ipk ? Number(w.ipk) : null;
        if (ipk !== null && !isNaN(ipk)) {
          if (ipk >= 3.50) r.ipkHigh++;
          else if (ipk >= 3.00) r.ipkMid++;
          else r.ipkLow++;
        } else {
          r.ipkKosong++;
        }
      });

      const rekapHeaders = [
        'Fakultas', 'Prodi', 'Total Data', 'Terdaftar', 
        'Toga S', 'Toga M', 'Toga L', 'Toga XL', 'Toga XXL', 'Toga Lain/Kosong',
        'Laki-laki', 'Perempuan', 'JK Kosong',
        'IPK >= 3.50', 'IPK 3.00-3.49', 'IPK < 3.00', 'IPK Kosong'
      ];

      const rekapRows = Array.from(rekapMap.values())
        .sort((a, b) => a.fakultas.localeCompare(b.fakultas) || a.prodi.localeCompare(b.prodi))
        .map(r => [
          r.fakultas, r.prodi, r.total, r.terdaftar,
          r.togaS, r.togaM, r.togaL, r.togaXL, r.togaXXL, r.togaLain + r.togaKosong,
          r.jkL, r.jkP, r.jkKosong,
          r.ipkHigh, r.ipkMid, r.ipkLow, r.ipkKosong
        ]);

      const wsData = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      wsData['!cols'] = headers.map((h, i) => {
        const maxLen = Math.max(h.length, ...rows.map(r => String(r[i] ?? '').length));
        return { wch: Math.min(maxLen + 2, 50) };
      });

      const wsRekap = XLSX.utils.aoa_to_sheet([rekapHeaders, ...rekapRows]);
      wsRekap['!cols'] = rekapHeaders.map((h, i) => {
        const maxLen = Math.max(h.length, ...rekapRows.map(r => String(r[i] ?? '').length));
        return { wch: Math.min(maxLen + 2, 30) };
      });

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsData, 'Data Wisudawan');
      XLSX.utils.book_append_sheet(wb, wsRekap, 'Rekap');

      const date = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `${filename}-${date}.xlsx`);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading || !data.length}
      title="Export ke XLSX"
      className="flex items-center justify-center gap-1.5 px-3 sm:px-4 h-8 sm:h-10 rounded-lg sm:rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-normal sm:font-semibold transition-colors shadow-sm shadow-sky-900/20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Download size={16} />
      )}
      <span className="hidden sm:inline">{loading ? 'Mengekspor...' : 'Export'}</span>
    </button>
  );
}
