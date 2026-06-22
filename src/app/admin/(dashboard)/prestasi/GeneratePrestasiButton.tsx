"use client";

import { useState, useTransition } from "react";
import { Zap, Loader2, RefreshCw } from "lucide-react";
import { generatePrestasi } from "@/actions/prestasiOverrides";
import { useToast } from "@/components/ui/Toast";

type Props = {
  periode: string;
  isGenerated: boolean;
};

export default function GeneratePrestasiButton({ periode, isGenerated }: Props) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const handleGenerate = () => {
    startTransition(async () => {
      const res = await generatePrestasi(periode);
      if (res.success) {
        showToast(
          isGenerated
            ? "Prestasi berhasil di-generate ulang dan disimpan ke database."
            : "Prestasi berhasil di-generate dan disimpan ke database.",
          "success"
        );
      } else {
        showToast(res.error || "Gagal generate prestasi.", "error");
      }
    });
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={isPending || !periode}
      title={isGenerated ? "Generate ulang peringkat prestasi ke database" : "Generate peringkat prestasi ke database"}
      className={`flex-auto sm:flex-none flex items-center justify-center sm:w-32 gap-1.5 px-3 sm:px-4 h-8 sm:h-10 rounded-lg sm:rounded-xl text-xs sm:text-sm font-normal sm:font-semibold transition-colors shadow-sm shadow-amber-900/20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${
        isGenerated
          ? "bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white"
          : "bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white"
      }`}
    >
      {isPending ? (
        <Loader2 size={16} className="animate-spin" />
      ) : isGenerated ? (
        <RefreshCw size={16} />
      ) : (
        <Zap size={16} />
      )}
      <span className="inline">
        {isPending ? "Memproses..." : isGenerated ? "Generate Ulang" : "Generate"}
      </span>
    </button>
  );
}
