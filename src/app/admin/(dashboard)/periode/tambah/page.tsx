import PeriodeForm from "../PeriodeForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TambahPeriodePage() {
  const formInitialData = {
    nama_periode: "",
    status: "Sedang Dibuka",
    kuota: 0,
    tanggal_pendaftaran: "",
    tanggal_pelaksanaan: "",
    tempat_pelaksanaan: "",
    waktu_sesi_1: "",
    waktu_sesi_2: "",
    jadwal_gladi: "",
    pengumuman: "",
    hint_pendaftaran: "",
    waglink: "",
    theme: "",
    status_color: "",
  };

  return (
    <div className="space-y-6 w-full">
      <PeriodeForm initialData={formInitialData} />
    </div>
  );
}
