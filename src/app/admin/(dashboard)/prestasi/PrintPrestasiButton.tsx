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
};

export default function PrintPrestasiButton({ data, periode, settings, tempatWisuda, tanggalWisuda }: Props) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const { showToast } = useToast();

  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      
      // Filter data: we only want to print for students who actually have `prestasi_akd` assigned.
      // (This means they are in the top 3 or Institut best).
      const certDataList: CertData[] = data
        .filter(w => w.prestasi_akd && w.prestasi_akd.trim() !== '')
        .map(w => ({
          nim: w.nim,
          namaMahasiswa: w.nama_mahasiswa,
          namaGelar: w.nama_gelar || w.nama_mahasiswa,
          prodi: w.prodi || "",
          fakultas: w.fakultas || "",
          ipk: w.ipk || "0",
          predikat: w.predikat || "-",
          prestasiAkd: w.prestasi_akd,
          periode: w.periode || periode
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
        
        // Generate Sebutan for filename
        const parts = certInfo.prestasiAkd.split(',').map(s => s.trim()).filter(Boolean);
        let rankStr = parts[0] || "Sertifikat"; // e.g. "Kesatu"
        if (parts.includes("Institut")) {
          rankStr = rankStr !== "Institut" ? `${rankStr}_Institut` : "Institut";
        }
        
        const safeNama = certInfo.namaMahasiswa.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
        const fileName = `Sertifikat-AKD_${certInfo.fakultas || 'Fakultas'}_${rankStr}_${certInfo.nim}_${safeNama}.pdf`
          .replace(/[^a-zA-Z0-9_\-\.]/g, '_'); // sanitize

        // Create PDF instance
        const doc = <CertificateDocument 
          cert={certInfo} 
          settings={settings} 
          logoBase64={logoBase64} 
          tempatWisuda={tempatWisuda} 
          tanggalWisuda={tanggalWisuda} 
        />;
        const asPdf = pdf(doc);
        const pdfBlob = await asPdf.toBlob();

        zip.file(fileName, pdfBlob);
        
        setProgress(i + 1);
      }

      // Generate Zip
      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `Sertifikat_Prestasi_${periode || 'Semua'}.zip`);
      
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
    <div className="flex items-center gap-2">
      {isPrinting && total > 0 && (
        <span className="text-xs font-bold text-emerald-600 hidden sm:inline-block animate-pulse">
          Memproses {progress}/{total} PDF...
        </span>
      )}
      <button
        onClick={handlePrint}
        disabled={isPrinting}
        title="Download ZIP Sertifikat Prestasi"
        className="flex items-center justify-center sm:w-32 gap-1.5 px-3 sm:px-4 h-8 sm:h-10 rounded-lg sm:rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-normal sm:font-semibold transition-colors shadow-sm shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
      >
        {isPrinting ? <Loader2 size={16} className="animate-spin shrink-0" /> : <Printer size={16} className="shrink-0" />}
        <span className="inline">
          {isPrinting ? "Generate PDF..." : "Sertifikat"}
        </span>
      </button>
    </div>
  );
}
