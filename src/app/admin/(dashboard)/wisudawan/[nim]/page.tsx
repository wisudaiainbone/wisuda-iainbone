import { getWisudawanByNim } from "@/actions/wisudawan";
import { notFound } from "next/navigation";
import { getOptimizedGDriveUrl } from "@/lib/uploadFoto";
import { GraduationCap, FileText, Award, Clock } from "lucide-react";
import WisudawanProfileSidebar from "./WisudawanProfileSidebar";

export default async function AdminWisudawanDetail({ params }: { params: Promise<{ nim: string }> }) {
  const { nim } = await params;
  const data: any = await getWisudawanByNim(nim);

  if (!data) return notFound();

  const logs = Array.isArray(data["LOG STATUS"]) ? data["LOG STATUS"] : [];

  const qrTogaUrl = data["ID WISUDA"]
    ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(data["ID WISUDA"])}`
    : null;
  const qrUndanganUrl = data["ID UNDANGAN"]
    ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(data["ID UNDANGAN"])}`
    : null;

  return (
    <div className="w-full space-y-4 pb-10">

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <WisudawanProfileSidebar
          nim={nim}
          nama={data["NAMA MAHASISWA"]}
          namaGelar={data["NAMA GELAR"] || ""}
          status={data["STATUS"] || ""}
          fotoUrl={data["FOTO"] ? getOptimizedGDriveUrl(data["FOTO"] as string) : null}
          qrTogaUrl={qrTogaUrl}
          qrUndanganUrl={qrUndanganUrl}
          idWisuda={data["ID WISUDA"] || null}
          idUndangan={data["ID UNDANGAN"] || null}
        />

        {/* Right Column: Details */}
        <div className="lg:col-span-3 space-y-6">

          {/* Data Akademik */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
            <h3 className="text-sm font-bold text-[var(--color-text)] flex items-center gap-2 mb-4">
              <GraduationCap size={16} className="text-emerald-500" /> Data Akademik
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <p className="text-xs text-[var(--color-text-subtle)] mb-1">Fakultas</p>
                <p className="font-medium text-[var(--color-text)]">{data["FAKULTAS"] || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-subtle)] mb-1">Program Studi</p>
                <p className="font-medium text-[var(--color-text)]">{data["PRODI"] || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-subtle)] mb-1">Prodi Singkat</p>
                <p className="font-medium text-[var(--color-text)]">{data["PRODI SINGKAT"] || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-subtle)] mb-1">Tanggal Yudisium</p>
                <p className="font-medium text-[var(--color-text)]">{data["TANGGAL YUDISIUM"] || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-subtle)] mb-1">IPK</p>
                <p className="font-medium text-[var(--color-text)]">{data["IPK"] || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-subtle)] mb-1">Predikat</p>
                <p className="font-medium text-[var(--color-text)]">{data["PREDIKAT"] || "-"}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-[var(--color-text-subtle)] mb-1">Judul Skripsi / Tesis</p>
                <p className="font-medium text-[var(--color-text)] leading-relaxed">{data["JUDUL SKRIPSI / TESIS"] || "-"}</p>
              </div>
            </div>
          </div>

          {/* Data Ekstrakurikuler & Prestasi */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
            <h3 className="text-sm font-bold text-[var(--color-text)] flex items-center gap-2 mb-4">
              <Award size={16} className="text-violet-500" /> Ekstrakurikuler & Prestasi
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div className="sm:col-span-2">
                <p className="text-xs text-[var(--color-text-subtle)] mb-1">Organisasi Mahasiswa (Ormawa)</p>
                <p className="font-medium text-[var(--color-text)]">{data["ORMAWA"] || "-"}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-[var(--color-text-subtle)] mb-1">Jabatan dalam Ormawa</p>
                <p className="font-medium text-[var(--color-text)]">{data["JABATAN DALAM ORMAWA"] || "-"}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-[var(--color-text-subtle)] mb-1">Prestasi Akademik</p>
                <p className="font-medium text-[var(--color-text)]">{data["PRESTASI AKD"] || "-"}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-[var(--color-text-subtle)] mb-1">Prestasi Organisasi / Non-Akademik</p>
                <p className="font-medium text-[var(--color-text)]">{data["PRESTASI ORG"] || "-"}</p>
              </div>
            </div>
          </div>

          {/* Data Kepesertaan Wisuda (termasuk Biodata & Akun) */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
            <h3 className="text-sm font-bold text-[var(--color-text)] flex items-center gap-2 mb-4">
              <FileText size={16} className="text-amber-500" /> Data Kepesertaan Wisuda
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-sm">
              <div>
                <p className="text-xs text-[var(--color-text-subtle)] mb-1">Periode Wisuda</p>
                <p className="font-medium text-[var(--color-text)]">{data["PERIODE"] || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-subtle)] mb-1">ID Wisuda</p>
                <p className="font-mono text-xs text-[var(--color-text)]">{data["ID WISUDA"] || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-subtle)] mb-1">ID Undangan</p>
                <p className="font-mono text-xs text-[var(--color-text)]">{data["ID UNDANGAN"] || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-subtle)] mb-1">Sesi</p>
                <p className="font-medium text-[var(--color-text)]">{data["SESI"] || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-subtle)] mb-1">Nomor Urut</p>
                <p className="font-medium text-[var(--color-text)]">{data["URUT"] || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-subtle)] mb-1">Waktu Hadir</p>
                <p className="font-medium text-[var(--color-text)]">{data["WAKTU HADIR"] || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-subtle)] mb-1">Ukuran Toga</p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400">{data["TOGA"] || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-subtle)] mb-1">Waktu Ambil Toga</p>
                <p className="font-medium text-[var(--color-text)]">{data["WAKTU TOGA"] || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-subtle)] mb-1">Sertifikat</p>
                <p className="font-medium text-[var(--color-text)]">
                  {data["SERTIFIKAT"] ? <a href={data["SERTIFIKAT"]} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Lihat Sertifikat</a> : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-subtle)] mb-1">Status Terdaftar</p>
                <p className="font-medium text-[var(--color-text)]">{data["TERDAFTAR"] ? "Ya" : "Tidak"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-subtle)] mb-1">Mengisi Survei</p>
                <p className="font-medium text-[var(--color-text)]">{data["SURVEI"] ? "Ya" : "Belum"}</p>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-xs text-[var(--color-text-subtle)] mb-1">Waktu Pendaftaran (Timestamp)</p>
                <p className="font-medium text-[var(--color-text)]">{data["TIMESTAMP"] || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-subtle)] mb-1">Jenis Kelamin</p>
                <p className="font-medium text-[var(--color-text)]">
                  {data["JENIS KELAMIN"] === "L" ? "Laki-laki" : data["JENIS KELAMIN"] === "P" ? "Perempuan" : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-subtle)] mb-1">Tempat, Tanggal Lahir</p>
                <p className="font-medium text-[var(--color-text)]">{data["TTL"] || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-subtle)] mb-1">Email</p>
                <p className="font-medium text-[var(--color-text)]">{data["EMAIL"] || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-subtle)] mb-1">Setup Akun</p>
                <p className="font-medium text-[var(--color-text)]">
                  {data["PASSWORD"] && !data["PASSWORD"].includes("wisuda2026") ? "Sudah" : "Belum (Default)"}
                </p>
              </div>
            </div>

            {/* Log Status */}
            {logs.length > 0 && (
              <div className="mt-6 pt-5 border-t border-[var(--color-border)]">
                <p className="text-xs font-bold text-[var(--color-text-subtle)] mb-3 flex items-center gap-2">
                  <Clock size={14} /> Riwayat Log Status
                </p>
                <div className="space-y-3">
                  {logs.slice().reverse().map((log: any, i: number) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <div>
                        <p className="font-medium text-[var(--color-text)]">{log.status}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{log.catatan}</p>
                        <p className="text-[10px] text-[var(--color-text-subtle)] mt-0.5">{log.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
