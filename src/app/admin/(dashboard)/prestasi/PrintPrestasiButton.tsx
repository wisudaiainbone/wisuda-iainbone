"use client";

import { Printer, Loader2 } from "lucide-react";
import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { CertificateDocument, CertData, CertSettings } from "@/components/pdf/CertificateDocument";
import { useToast } from "@/components/ui/Toast";

type Props = {
  data: any[];
  periode: string;
  settings: CertSettings;
  tempatWisuda: string;
  tanggalWisuda: string;
  /** 'akademik' (default): gunakan prestasi_akd & konteks Fakultas. 'prodi': gunakan prestasi_prodi & konteks Prodi */
  mode?: 'akademik' | 'prodi';
};

export default function PrintPrestasiButton({ data, periode, settings, tempatWisuda, tanggalWisuda, mode = 'akademik' }: Props) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const { showToast } = useToast();

  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      
      // Filter dan map data berdasarkan mode
      const isProdiMode = mode === 'prodi';
      const certDataList: CertData[] = data
        .filter(w => {
          const val = isProdiMode ? w.prestasi_prodi : w.prestasi_akd;
          return val && val.trim() !== '';
        })
        .map(w => ({
          nim: w.nim,
          namaMahasiswa: w.nama_mahasiswa,
          namaGelar: w.nama_gelar || w.nama_mahasiswa,
          prodi: w.prodi || "",
          fakultas: w.fakultas || "",
          ipk: w.ipk || "0",
          predikat: w.predikat || "-",
          prestasiAkd: isProdiMode ? w.prestasi_prodi : w.prestasi_akd,
          periode: w.periode || periode,
          // Mode Prodi: set konteks ke "Prodi {nama_prodi}" agar sertifikat berbunyi
          // "Terbaik Kedua Prodi Ekonomi Syariah" bukan "Terbaik Kedua Fakultas ..."
          konteks: isProdiMode && w.prodi ? `Prodi ${w.prodi}` : undefined,
        }));

      if (certDataList.length === 0) {
        showToast("Tidak ada wisudawan berprestasi untuk dicetak.", "error");
        setIsPrinting(false);
        return;
      }

      setTotal(certDataList.length);
      setProgress(0);

      const zip = new JSZip();
      
      // Load logo as base64 (to avoid CORS/rendering issues in pdf generator)
      let logoBase64 = "";
      try {
        const logoUrl = window.location.origin + "/logo.png";
        const response = await fetch(logoUrl);
        const blob = await response.blob();
        logoBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.warn("Failed to load logo for PDF", e);
      }

      // Generate PDF for each student sequentially
      for (let i = 0; i < certDataList.length; i++) {
        const certInfo = certDataList[i];
        
        // Pisahkan jika ada lebih dari satu penghargaan, misal: "Kesatu, Institut"
        const parts = certInfo.prestasiAkd.split(',').map(s => s.trim()).filter(Boolean);
        
        for (const part of parts) {
          const safeNama = certInfo.namaMahasiswa.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
          const konteksSlug = (certInfo.konteks || certInfo.fakultas || 'Fakultas').replace(/[^a-zA-Z0-9_\-\.]/g, '_');
          const prefix = mode === 'prodi' ? 'Sertifikat-PRODI' : 'Sertifikat-AKD';
          const fileName = `${prefix}_${konteksSlug}_${part}_${certInfo.nim}_${safeNama}.pdf`
            .replace(/[^a-zA-Z0-9_\-\.]/g, '_'); // sanitize

          // Buat salinan certInfo dengan prestasiAkd yang spesifik untuk halaman ini
          const specificCertInfo = { ...certInfo, prestasiAkd: part };

          // Create PDF instance
          const doc = <CertificateDocument 
            cert={specificCertInfo} 
            settings={settings} 
            logoBase64={logoBase64} 
            tempatWisuda={tempatWisuda} 
            tanggalWisuda={tanggalWisuda} 
          />;
          const asPdf = pdf(doc);
          const pdfBlob = await asPdf.toBlob();

          zip.file(fileName, pdfBlob);
        }
        
        setProgress(i + 1);
      }

      const zipLabel = mode === 'prodi' ? 'Prestasi_Prodi' : 'Prestasi';
      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `Sertifikat_${zipLabel}_${periode || 'Semua'}.zip`);
      
      showToast("Berhasil mendownload sertifikat!", "success");

    } catch (error) {
      console.error("Error generating certificates:", error);
      showToast("Terjadi kesalahan saat membuat sertifikat.", "error");
    } finally {
      setIsPrinting(false);
      setProgress(0);
      setTotal(0);
    }
  };

  return (
    <div className="flex-auto sm:flex-none flex items-center gap-2">
      {isPrinting && total > 0 && (
        <span className="text-xs font-bold text-emerald-600 hidden sm:inline-block animate-pulse">
          Memproses {progress}/{total} PDF...
        </span>
      )}
      <button
        onClick={handlePrint}
        disabled={isPrinting}
        title="Download ZIP Sertifikat Prestasi"
        className="w-full flex items-center justify-center sm:w-32 gap-1.5 px-3 sm:px-4 h-8 sm:h-10 rounded-lg sm:rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-normal sm:font-semibold transition-colors-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
      >
        {isPrinting ? <Loader2 size={16} className="animate-spin shrink-0" /> : <Printer size={16} className="shrink-0" />}
        <span className="inline">
          {isPrinting ? "Generate PDF..." : "Sertifikat"}
        </span>
      </button>
    </div>
  );
}
