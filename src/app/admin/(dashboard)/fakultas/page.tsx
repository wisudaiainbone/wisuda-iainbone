import { Suspense } from "react";
import { getProdiList } from "@/actions/prodi";
import { Plus } from "lucide-react";
import ProdiTableClient from "./ProdiTableClient";
import ProdiDialog from "./ProdiDialog";

export default async function AdminFakultasPage() {
  const prodiList = await getProdiList();
  const existingFakultas = Array.from(new Set(prodiList.map(p => p.fakultas).filter(Boolean)));

  return (
    <div className="space-y-6">
      <ProdiTableClient initialProdiList={prodiList} />

    </div>
  );
}
