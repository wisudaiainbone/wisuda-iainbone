"use client";

import { useState, useTransition } from "react";
import { RotateCcw, Loader2 } from "lucide-react";
import { restoreWisudawan } from "@/actions/wisudawan";
import { useToast } from "@/components/ui/Toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function RestoreWisudawanButton({ nim, nama, userRole }: { nim: string, nama: string, userRole?: string }) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const { showToast } = useToast();

  const canRestore = 
    userRole === 'superadmin' || 
    userRole === 'admin_institut' || 
    userRole === 'admin_unit';

  if (!canRestore) return null;

  const handleRestore = () => {
    startTransition(async () => {
      const res = await restoreWisudawan(nim);
      if (res.success) {
        showToast(`Berhasil memulihkan data wisudawan ${nama}`, "success");
      } else {
        showToast(`Gagal memulihkan: ${res.error}`, "error");
      }
      setShowConfirm(false);
    });
  };

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }}
        disabled={isPending}
        className="p-1.5 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors disabled:opacity-50"
        title="Pulihkan Data"
      >
        {isPending ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
      </button>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleRestore}
        title="Pulihkan Data Wisudawan"
        message={`Yakin ingin memulihkan data wisudawan atas nama ${nama} (${nim})? Data akan kembali berstatus Calon Wisudawan.`}
        confirmText="Pulihkan"
        isLoading={isPending}
      />
    </>
  );
}
