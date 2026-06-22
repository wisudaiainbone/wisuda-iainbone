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
      <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50">
        <ProdiDialog trigger={
          <button 
            title="Tambah Data Prodi"
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] shadow-emerald-600/30 transition-transform hover:scale-105 active:scale-95"
          >
            <Plus size={24} />
          </button>
        } />
      </div>
    </div>
  );
}
