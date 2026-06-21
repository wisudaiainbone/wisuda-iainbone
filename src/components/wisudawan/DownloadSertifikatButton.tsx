"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import { CertificateDocument, CertData, CertSettings } from "@/components/pdf/CertificateDocument";
import { useToast } from "@/components/ui/Toast";

type Props = {
  w: any;
};

export default function DownloadSertifikatButton({ w }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { showToast } = useToast();

  const handleDownload = async () => {
    try {
      setIsGenerating(true);

      const { getSetting } = await import('@/actions/settings');
      
      // Fetch settings
      const settings: CertSettings = {
        nomor: await getSetting('cert_akd_nomor', '', true),
        tanggal: await getSetting('cert_akd_tanggal', '', true),
        jabatan: await getSetting('cert_akd_jabatan', '', true),
        nip: await getSetting('cert_akd_nip', '', true),
        nama: await getSetting('cert_akd_nama', '', true),
        bgUrl: await getSetting('cert_bg_url', '', true),
        ttdUrl: await getSetting('cert_akd_ttd_url', '', true)
      };
      const tempatWisuda = await getSetting('tempat_wisuda', 'Watampone', true);
      const tanggalWisuda = await getSetting('tanggal_wisuda', '', true);

      // Fetch logo
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
        console.warn("Failed to load logo", e);
      }

      const certInfo: CertData = {
        nim: w["NIM"] || "",
        namaMahasiswa: w["NAMA MAHASISWA"] || "",
        namaGelar: w["NAMA GELAR"] || w["NAMA MAHASISWA"] || "",
        prodi: w["PRODI"] || "",
        fakultas: w["FAKULTAS"] || "",
        ipk: w["IPK"] || "0",
        predikat: w["PREDIKAT"] || "-",
        prestasiAkd: w["PRESTASI AKD"] || "",
        periode: w["PERIODE"] || ""
      };

      // Generate filename
      const parts = certInfo.prestasiAkd.split(',').map((s: string) => s.trim()).filter(Boolean);
      let rankStr = parts[0] || "Sertifikat"; 
      if (parts.includes("Institut")) {
        rankStr = rankStr !== "Institut" ? `${rankStr}_Institut` : "Institut";
      }
      
      const safeNama = certInfo.namaMahasiswa.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
      const fileName = `Sertifikat_${rankStr}_${certInfo.nim}_${safeNama}.pdf`
        .replace(/[^a-zA-Z0-9_\-\.]/g, '_');

      const doc = <CertificateDocument 
        cert={certInfo} 
        settings={settings} 
        logoBase64={logoBase64} 
        tempatWisuda={tempatWisuda} 
        tanggalWisuda={tanggalWisuda} 
      />;
      
      const asPdf = pdf(doc);
      const pdfBlob = await asPdf.toBlob();

      saveAs(pdfBlob, fileName);
      showToast("Berhasil mendownload sertifikat!", "success");

    } catch (error) {
      console.error("Error generating certificate:", error);
      showToast("Terjadi kesalahan saat membuat sertifikat.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-all shadow-md w-full sm:w-auto"
    >
      {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
      <span>{isGenerating ? "Menyiapkan PDF..." : "Download Sertifikat PDF"}</span>
    </button>
  );
}
