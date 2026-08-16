"use client";

import { useState, useMemo } from "react";
import WisudawanSearch from "./WisudawanSearch";
import WisudawanTableClient from "./WisudawanTableClient";
import ImportWisudawanDialog from "./ImportWisudawanDialog";
import ExportDropdown from "./ExportDropdown";
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
  kuotaInfo?: any;
  periodeStatus?: string | null;
}

export default function WisudawanContainer({
  allWisudawan,
  dbProdiList,
  fakultasList,
  prodiList,
  statusList,
  adminSession,
  allowDeleteWisudawan,
  kuotaInfo,
  periodeStatus,
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
      // By default (if no status filter), hide 'Dihapus' data!
      let matchStatus = true;
      if (filters.status) {
        matchStatus = w.status === filters.status;
      } else {
        matchStatus = w.status !== 'Dihapus';
      }

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

  // Disable states berdasarkan kondisi data & periode
  const registeredWisudawan = useMemo(() => allWisudawan.filter(w => w.status === 'Terdaftar'), [allWisudawan]);
  const isSesiBelumDiisi = registeredWisudawan.length === 0 || registeredWisudawan.some(w => !w.sesi);
  const isNomorBelumDiisi = registeredWisudawan.length === 0 || registeredWisudawan.some(w => !w.urut);

  // Sesi hanya bisa diubah ketika periode sudah Ditutup
  const isSesiDisabled = periodeStatus !== 'Ditutup';

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="w-full">
        <WisudawanSearch 
          fakultasList={fakultasList} 
          prodiList={prodiList} 
          statusList={statusList.includes('Dihapus') ? statusList : [...statusList, 'Dihapus']}
          onSearch={handleSearch}
          filteredItems={totalItems}
          totalItems={allWisudawan.length}
        >
          <ImportWisudawanDialog userRole={adminSession?.role || ''} unitKerja={adminSession?.unit_kerja} dbProdiList={dbProdiList} kuotaInfo={kuotaInfo} />
          <ExportDropdown data={filteredList} filename="data-wisudawan" userRole={adminSession?.role} />
          
          {adminSession?.role !== 'admin_unit' && (
            <>
              <SesiDialog disabled={isSesiDisabled} />
              <NomorDialog disabled={isSesiBelumDiisi} />
              <ExportDaftarButton data={filteredList} filename="daftar-wisudawan" disabled={isNomorBelumDiisi} />
              <TagDialog data={filteredList} disabled={isNomorBelumDiisi} />
              <SlidePptxDialog data={filteredList} prodiData={dbProdiList} disabled={isNomorBelumDiisi} />
              <AlbumDialog data={filteredList} prodiData={dbProdiList} disabled={isNomorBelumDiisi} />
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
        currentStatusFilter={filters.status}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
