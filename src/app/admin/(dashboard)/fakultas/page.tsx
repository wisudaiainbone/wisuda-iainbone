import { Suspense } from "react";
import { getProdiList } from "@/actions/prodi";
import { Plus } from "lucide-react";
import ProdiTableClient from "./ProdiTableClient";
import ProdiDialog from "./ProdiDialog";

export default async function AdminFakultasPage() {
  const prodiList = await getProdiList();

  return (
    <div className="space-y-6">
      <ProdiTableClient initialProdiList={prodiList} />

      {/* FAB Tambah Data */}
      <div className="fixed bottom-8 right-8 z-40">
        <ProdiDialog trigger={
          <button 
            title="Tambah Data Prodi"
            className="flex items-center justify-center w-14 h-14 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(16,185,129,0.3)] transition-all"
          >
            <Plus size={24} />
          </button>
        } />
      </div>
    </div>
  );
}
