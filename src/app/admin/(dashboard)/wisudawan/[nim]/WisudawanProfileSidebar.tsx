"use client";

import { useState } from "react";
import Image from "next/image";
import { User, X, ZoomIn, Pencil } from "lucide-react";
import Link from "next/link";
import ResetPasswordButton from "../ResetPasswordButton";
import DeleteWisudawanButton from "../DeleteWisudawanButton";

interface Props {
  nim: string;
  nama: string;
  namaGelar: string;
  status: string;
  fotoUrl: string | null;
  qrTogaUrl: string | null;
  qrUndanganUrl: string | null;
  idWisuda: string | null;
  idUndangan: string | null;
  userRole?: string;
  allowDeleteWisudawan?: boolean;
}

export default function WisudawanProfileSidebar({
  nim,
  nama,
  namaGelar,
  status,
  fotoUrl,
  qrTogaUrl,
  qrUndanganUrl,
  idWisuda,
  idUndangan,
  userRole,
  allowDeleteWisudawan,
}: Props) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <div className="space-y-4">

      {/* Card Foto */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 flex flex-col items-center text-center">
        {/* Foto — klik untuk lightbox */}
        <div
          className="relative w-32 shrink-0 rounded-xl overflow-hidden ring-4 ring-[var(--color-bg-secondary)] bg-[var(--color-surface)] flex items-center justify-center mb-4 group cursor-pointer"
          style={{ aspectRatio: "3/4" }}
          onClick={() => fotoUrl && setLightboxOpen(true)}
          title={fotoUrl ? "Klik untuk perbesar" : undefined}
        >
          {fotoUrl ? (
            <>
              <Image
                src={fotoUrl}
                alt={nama}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                unoptimized
                referrerPolicy="no-referrer"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <ZoomIn size={28} className="text-white drop-shadow" />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[var(--color-text-muted)] bg-emerald-50 dark:bg-emerald-900/10">
              <User size={40} opacity={0.5} />
            </div>
          )}
        </div>

        <h2 className="font-bold text-lg text-[var(--color-text)] leading-tight mb-1">
          {namaGelar || nama || "-"}
        </h2>
        <p className="text-sm font-medium text-[var(--color-text-muted)] mb-3">{nim}</p>

        <div className={`px-3 py-1 rounded-full text-xs font-bold mb-4 ${
          status === "Terdaftar"
            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
            : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
        }`}>
          {status || "Calon Wisudawan"}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 mt-2">
          <Link
            href={`/admin/wisudawan/${nim}/edit`}
            title="Edit Data"
            className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
          >
            <Pencil size={16} />
          </Link>
          <ResetPasswordButton nim={nim} nama={nama} />
          <DeleteWisudawanButton nim={nim} nama={nama} userRole={userRole} allowDeleteWisudawan={allowDeleteWisudawan} />
        </div>
      </div>

      {/* Card QR Toga */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 flex flex-col items-center text-center">
        <p className="text-xs font-bold text-[var(--color-text-subtle)] uppercase tracking-wider mb-3">
          QR Toga
        </p>
        {qrTogaUrl ? (
          <>
            {/* QR + Logo overlay */}
            <div className="relative rounded-xl overflow-hidden border border-[var(--color-border)] p-1.5 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrTogaUrl} alt="QR Toga" width={140} height={140} className="block" />
            </div>
            <p className="text-[10px] font-mono text-[var(--color-text-muted)] mt-2 break-all">
              {idWisuda}
            </p>
          </>
        ) : (
          <div className="w-[140px] h-[140px] rounded-xl border border-dashed border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-subtle)] text-xs">
            Belum ada ID
          </div>
        )}
      </div>

      {/* Card QR Undangan */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 flex flex-col items-center text-center">
        <p className="text-xs font-bold text-[var(--color-text-subtle)] uppercase tracking-wider mb-3">
          QR Undangan
        </p>
        {qrUndanganUrl ? (
          <>
            <div className="relative rounded-xl overflow-hidden border border-[var(--color-border)] p-1.5 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUndanganUrl} alt="QR Undangan" width={140} height={140} className="block" />
            </div>
            <p className="text-[10px] font-mono text-[var(--color-text-muted)] mt-2 break-all">
              {idUndangan}
            </p>
          </>
        ) : (
          <div className="w-[140px] h-[140px] rounded-xl border border-dashed border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-subtle)] text-xs">
            Belum ada ID
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && fotoUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={() => setLightboxOpen(false)}
            title="Tutup"
          >
            <X size={22} />
          </button>
          <div
            className="relative max-h-[90vh] max-w-[80vw] rounded-2xl overflow-hidden shadow-2xl"
            style={{ aspectRatio: "3/4" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fotoUrl}
              alt="Foto Wisudawan"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
