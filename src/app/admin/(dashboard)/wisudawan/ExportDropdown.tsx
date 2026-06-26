'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, Loader2, ChevronDown, FileSpreadsheet, FileJson, Database, FileText } from 'lucide-react';

type WisudawanRow = {
  [key: string]: any;
};

type Props = {
  data: WisudawanRow[];
  filename?: string;
  userRole?: string;
};

const ALL_COLUMNS = [
  'nim', 'nama_mahasiswa', 'ipk', 'predikat', 'fakultas', 'prodi', 'toga',
  'tanggal_yudisium', 'periode', 'status', 'sesi', 'email', 'password',
  'timestamp', 'terdaftar', 'id_wisuda', 'ttl', 'judul_skripsi', 'jenis_kelamin',
  'ormawa', 'jabatan_dalam_ormawa', 'foto', 'sertifikat', 'nama_gelar',
  'prodi_singkat', 'qr_toga', 'id_undangan', 'qr_undangan', 'urut', 'waktu_toga',
  'waktu_hadir', 'prestasi_akd', 'prestasi_org', 'survei', 'log_status'
];

export default function ExportDropdown({ data, filename = 'data-wisudawan', userRole }: Props) {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const downloadFile = (content: string, type: string, extension: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const escapeCSV = (val: any) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const escapeSQL = (val: any) => {
    if (val === null || val === undefined || val === '') return 'null';
    if (typeof val === 'number') return val;
    // Escape single quotes for SQL
    return `'${String(val).replace(/'/g, "''")}'`;
  };

  const handleExportXlsx = async () => {
    if (!data.length) return;
    setLoading(true);
    setIsOpen(false);
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
        w.nim ?? '',
        w.nama_mahasiswa ?? '',
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
        
        const toga = w.toga ? String(w.toga).toUpperCase().trim() : '';
        if (toga === 'S') r.togaS++;
        else if (toga === 'M') r.togaM++;
        else if (toga === 'L') r.togaL++;
        else if (toga === 'XL') r.togaXL++;
        else if (toga === 'XXL') r.togaXXL++;
        else if (toga === '') r.togaKosong++;
        else r.togaLain++;
        
        const jk = w.jenis_kelamin ? String(w.jenis_kelamin).toUpperCase().trim() : '';
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

  const handleExportCSV = async () => {
    if (!data.length) return;
    setLoading(true);
    setIsOpen(false);
    try {
      const headerRow = ALL_COLUMNS.join(',');
      const rows = data.map(w => {
        return ALL_COLUMNS.map(col => escapeCSV(w[col])).join(',');
      });
      const csvContent = [headerRow, ...rows].join('\n');
      downloadFile(csvContent, 'text/csv;charset=utf-8;', 'csv');
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = async () => {
    if (!data.length) return;
    setLoading(true);
    setIsOpen(false);
    try {
      const mappedData = data.map(w => {
        const obj: any = {};
        ALL_COLUMNS.forEach(col => {
          let val = w[col];
          if (val === undefined || val === '') {
            val = null;
          } else if (typeof val === 'object' && val !== null) {
            val = JSON.stringify(val);
          }
          obj[col] = val;
        });
        return obj;
      });
      const jsonContent = JSON.stringify(mappedData);
      downloadFile(jsonContent, 'application/json;charset=utf-8;', 'json');
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportSQL = async () => {
    if (!data.length) return;
    setLoading(true);
    setIsOpen(false);
    try {
      const columnsString = ALL_COLUMNS.map(col => `"${col}"`).join(', ');
      
      const valuesStatements = data.map(w => {
        const valuesString = ALL_COLUMNS.map(col => escapeSQL(w[col])).join(', ');
        return `(${valuesString})`;
      });
      
      const sqlContent = `INSERT INTO "public"."wisudawan" (${columnsString}) VALUES ${valuesStatements.join(', ')};`;
      downloadFile(sqlContent, 'application/sql;charset=utf-8;', 'sql');
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading || !data.length}
        title="Export Data"
        className="flex items-center justify-center gap-1.5 px-3 sm:px-4 h-8 sm:h-10 rounded-lg sm:rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-normal sm:font-semibold transition-colors-sky-900/20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Download size={16} />
        )}
        <span className="hidden sm:inline">{loading ? 'Mengekspor...' : 'Export'}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !loading && (
        <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-slate-800 dark:ring-slate-700">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            <button
              onClick={handleExportXlsx}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-slate-700 dark:hover:text-white whitespace-nowrap"
              role="menuitem"
            >
              <FileSpreadsheet size={16} />
              Export as .xlsx
            </button>
            {(userRole === 'superadmin' || userRole === 'admin_institut') && (
              <>
                <button
                  onClick={handleExportCSV}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-slate-700 dark:hover:text-white whitespace-nowrap"
                  role="menuitem"
                >
                  <FileText size={16} />
                  Export as CSV
                </button>
                <button
                  onClick={handleExportSQL}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-slate-700 dark:hover:text-white whitespace-nowrap"
                  role="menuitem"
                >
                  <Database size={16} />
                  Export as SQL
                </button>
                <button
                  onClick={handleExportJSON}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-slate-700 dark:hover:text-white whitespace-nowrap"
                  role="menuitem"
                >
                  <FileJson size={16} />
                  Export as JSON
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
