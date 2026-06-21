import { getAllPeriode } from "@/actions/periode";
import PeriodeForm from "../PeriodeForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

export default async function EditPeriodePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const allPeriode = await getAllPeriode();
  const periode = allPeriode.find((p: any) => p.id.toString() === id);

  if (!periode) {
    return notFound();
  }

  // Rekonstruksi data agar cocok dengan format Form
  const formInitialData = {
    ...periode,
    title: periode.nama_periode,
    date: periode.tanggal_pelaksanaan,
    location: periode.tempat_pelaksanaan,
    session1: periode.waktu_sesi_1,
    session2: periode.waktu_sesi_2,
    gladi: periode.jadwal_gladi,
    pengumuman: periode.pengumuman,
    hint_pendaftaran: periode.hint_pendaftaran,
    waglink: periode.wagLink || periode.waglink,
    theme: periode.themeImage || periode.theme,
    status_color: periode.statusColor || periode.status_color
  };

  return (
    <div className="space-y-6 w-full">
      <PeriodeForm initialData={formInitialData} />
    </div>
  );
}
