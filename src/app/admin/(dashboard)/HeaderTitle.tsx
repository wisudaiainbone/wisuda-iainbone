"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getWisudawanByNim } from "@/actions/wisudawan";

export default function HeaderTitle() {
  const pathname = usePathname();
  const [dynamicTitle, setDynamicTitle] = useState("");

  useEffect(() => {
    const editMatch = pathname.match(/^\/admin\/wisudawan\/(\w+)\/edit$/);
    const detailMatch = pathname.match(/^\/admin\/wisudawan\/(\w+)$/);
    const nim = (editMatch || detailMatch)?.[1];
    if (nim) {
      getWisudawanByNim(nim).then((data: any) => {
        if (data) {
          const nama = data["NAMA GELAR"] || data["NAMA MAHASISWA"] || data["NAMA LENGKAP"];
          if (nama) {
            setDynamicTitle(editMatch ? `Edit ${nim} \u2013 ${nama}` : `${nim} - ${nama}`);
            return;
          }
        }
        setDynamicTitle(editMatch ? `Edit ${nim}` : `${nim}`);
      }).catch(() => {
        setDynamicTitle(editMatch ? `Edit ${nim}` : `${nim}`);
      });
    } else {
      setDynamicTitle("");
    }
  }, [pathname]);

  let title = "Beranda";

  if (pathname.startsWith("/admin/wisudawan")) {
    const editMatch = pathname.match(/^\/admin\/wisudawan\/(\w+)\/edit$/);
    const detailMatch = pathname.match(/^\/admin\/wisudawan\/(\w+)$/);
    if (editMatch) {
      title = dynamicTitle || `Edit ${editMatch[1]}...`;
    } else if (detailMatch) {
      title = dynamicTitle || `Memuat ${detailMatch[1]}...`;
    } else {
      title = "Data Wisudawan";
    }
  } else if (pathname.startsWith("/admin/periode")) {
    if (pathname !== "/admin/periode") {
      title = "Edit Periode Wisuda";
    } else {
      title = "Periode Wisuda";
    }
  } else if (pathname.startsWith("/admin/toga")) {
    title = "Data Toga";
  } else if (pathname.startsWith("/admin/fakultas")) {
    title = "Master Fakultas & Prodi";
  } else if (pathname.startsWith("/admin/pengaturan")) {
    title = "Pengaturan Sistem";
  } else if (pathname.startsWith("/admin/manajemen-admin")) {
    title = "Manajemen Admin";
  } else if (pathname.startsWith("/admin/absensi")) {
    title = "Absensi Wisudawan";
  } else if (pathname.startsWith("/admin/perbaikan")) {
    title = "Perbaikan Data Wisudawan";
  }

  return (
    <div className="hidden md:flex flex-col justify-center">
      <h1 className="text-sm font-medium text-[var(--color-text)] leading-tight">{title}</h1>
    </div>
  );
}
