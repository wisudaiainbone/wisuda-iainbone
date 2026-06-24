"use client";

import { useState, useMemo } from "react";
import WisudawanSearch from "./WisudawanSearch";
import WisudawanTableClient from "./WisudawanTableClient";
import ImportWisudawanDialog from "./ImportWisudawanDialog";
import ExportXlsxButton from "./ExportXlsxButton";
import ExportDaftarButton from "./ExportDaftarButton";
import SlidePptxDialog from "./SlidePptxDialog";
import AlbumDialog from "./AlbumDialog";
import TagDialog from "./TagDialog";
import SesiDialog from "./SesiDialog";
import NomorDialog from "./NomorDialog";

interface WisudawanContainerProps {
  allWisudawan: any[];
  dbProdiList: any[];
  fakultasList: string[];
  prodiList: string[];
  statusList: string[];
  adminSession: any;
  allowDeleteWisudawan: boolean;
}

export default function WisudawanContainer({
  allWisudawan,
  dbProdiList,
  fakultasList,
  prodiList,
  statusList,
  adminSession,
  allowDeleteWisudawan,
}: WisudawanContainerProps) {
  const [filters, setFilters] = useState({
    q: "",
    fakultas: "",
    prodi: "",
    status: "",
    toga: "",
    hadir: "",
    ambilToga: "",
    sesi: ""
  });

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const handleSearch = (newFilters: any) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const filteredList = useMemo(() => {
    return allWisudawan.filter(w => {
      const matchQ = w.nama_mahasiswa.toLowerCase().includes(filters.q.toLowerCase()) || w.nim.toLowerCase().includes(filters.q.toLowerCase());
      const matchFakultas = filters.fakultas ? w.fakultas === filters.fakultas : true;
      const matchProdi = filters.prodi ? w.prodi === filters.prodi : true;
      const matchStatus = filters.status ? w.status === filters.status : true;
      const matchToga = !filters.toga ? true : filters.toga === 'sudah' ? !!w.toga : !w.toga;
      const matchHadir = !filters.hadir ? true : filters.hadir === 'sudah' ? !!w.waktu_hadir : !w.waktu_hadir;
      const matchAmbilToga = !filters.ambilToga ? true : filters.ambilToga === 'sudah' ? !!w.waktu_toga : !w.waktu_toga;
      const matchSesi = !filters.sesi ? true : filters.sesi === 'Tanpa Sesi' ? !w.sesi : w.sesi === filters.sesi;
      
      return matchQ && matchFakultas && matchProdi && matchStatus && matchToga && matchHadir && matchAmbilToga && matchSesi;
    }).sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    });
  }, [allWisudawan, filters]);

  const totalItems = filteredList.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedList = filteredList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const showToga = filters.toga !== '';
  const showSesi = filters.sesi !== '';

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="w-full">
        <WisudawanSearch 
          fakultasList={fakultasList} 
          prodiList={prodiList} 
          statusList={statusList}
          onSearch={handleSearch}
        >
          <ImportWisudawanDialog userRole={adminSession?.role || ''} unitKerja={adminSession?.unit_kerja} dbProdiList={dbProdiList} />
          <ExportXlsxButton data={filteredList} filename="data-wisudawan" />
          <ExportDaftarButton data={filteredList} filename="daftar-wisudawan" />
          
          {adminSession?.role !== 'admin_unit' && (
            <>
              <SesiDialog />
              <SlidePptxDialog data={filteredList} prodiData={dbProdiList} />
              <TagDialog data={filteredList} />
              <NomorDialog />
              <AlbumDialog data={filteredList} prodiData={dbProdiList} />
            </>
          )}
        </WisudawanSearch>
      </div>

      <WisudawanTableClient 
        paginatedList={paginatedList}
        currentPage={currentPage}
        ITEMS_PER_PAGE={ITEMS_PER_PAGE}
        totalPages={totalPages}
        totalItems={totalItems}
        showSesi={showSesi}
        showToga={showToga}
        adminSession={adminSession}
        allowDeleteWisudawan={allowDeleteWisudawan}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
