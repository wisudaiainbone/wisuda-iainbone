'use client';

import { useState } from 'react';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { saveAs } from 'file-saver';
import { pdf } from '@react-pdf/renderer';
// @ts-ignore
import ExcelJS from 'exceljs';
import TamuVipPDFDocument from './TamuVipPDFDocument';
import { useToast } from "@/components/ui/Toast";

type Props = {
  vipListText: string;
};

export default function TamuVipExportButtons({ vipListText }: Props) {
  const { showToast } = useToast();
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const getVipData = () => {
    return vipListText
      .split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0)
      .map((nama, index) => ({
        urut: index + 1,
        nama: nama
      }));
  };

  const handleExportExcel = async () => {
    const data = getVipData();
    if (data.length === 0) {
      showToast("Daftar Tamu VIP kosong.", "error");
      return;
    }

    setIsExportingExcel(true);
    try {
      const response = await fetch('/template_label_tamu.xlsx');
      if (!response.ok) {
        throw new Error('File template_label_tamu.xlsx tidak ditemukan di folder public.');
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      
      const sheet = workbook.getWorksheet('Daftar');
      if (!sheet) {
        throw new Error('Sheet "Daftar" tidak ditemukan di dalam template_label_tamu.xlsx.');
      }

      // Auto generate header just in case
      const headerRow = sheet.getRow(1);
      headerRow.values = ['NO', 'NAMA'];
      for (let c = 1; c <= 2; c++) {
        const cell = headerRow.getCell(c);
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFF00' }
        };
      }
      sheet.getColumn(1).width = 5;
      sheet.getColumn(2).width = 50;
      headerRow.commit();

      // Isi data
      for (let i = 0; i < data.length; i++) {
        const rowNum = i + 2;
        const row = sheet.getRow(rowNum);
        row.getCell(1).value = data[i].urut;
        row.getCell(2).value = data[i].nama.toUpperCase();
        row.commit();
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Label_Tamu_VIP.xlsx`);
      
      showToast("Excel Label Tamu VIP berhasil diunduh!", "success");
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "Gagal membuat Excel Label Tamu VIP.", "error");
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPdf = async () => {
    const data = getVipData();
    if (data.length === 0) {
      showToast("Daftar Tamu VIP kosong.", "error");
      return;
    }

    setIsExportingPdf(true);
    try {
      const pdfBlob = await pdf(<TamuVipPDFDocument data={data} />).toBlob();
      saveAs(pdfBlob, 'Label_Tamu_VIP.pdf');
      showToast("PDF Label Tamu VIP berhasil diunduh!", "success");
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "Gagal membuat PDF Label Tamu VIP.", "error");
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 mt-4">
      <button
        type="button"
        onClick={handleExportExcel}
        disabled={isExportingExcel}
        className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors disabled:opacity-70"
      >
        {isExportingExcel ? <Loader2 size={18} className="animate-spin" /> : <FileSpreadsheet size={18} />}
        Ekspor Label Excel
      </button>
      <button
        type="button"
        onClick={handleExportPdf}
        disabled={isExportingPdf}
        className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors disabled:opacity-70"
      >
        {isExportingPdf ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
        Cetak PDF Label (16x19,5 cm)
      </button>
    </div>
  );
}
