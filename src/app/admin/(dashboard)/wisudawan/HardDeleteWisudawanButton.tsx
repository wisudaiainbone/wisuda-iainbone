"use client";

import { useState, useTransition } from "react";
import { Trash, Loader2 } from "lucide-react";
import { hardDeleteWisudawan } from "@/actions/wisudawan";
import { useToast } from "@/components/ui/Toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function HardDeleteWisudawanButton({ nim, nama, userRole }: { nim: string, nama: string, userRole?: string }) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const { showToast } = useToast();

  const canHardDelete = userRole === 'superadmin';

  if (!canHardDelete) return null;

  const handleHardDelete = () => {
    startTransition(async () => {
      const res = await hardDeleteWisudawan(nim);
      if (res.success) {
        showToast(`Berhasil menghapus permanen data wisudawan ${nama}`, "success");
      } else {
        showToast(`Gagal menghapus permanen: ${res.error}`, "error");
      }
      setShowConfirm(false);
    });
  };

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }}
        disabled={isPending}
        className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-50"
        title="Hapus Permanen"
      >
        {isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash size={16} />}
      </button>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleHardDelete}
        title="Hapus Permanen Data"
        message={`Yakin ingin menghapus PERMANEN data wisudawan atas nama ${nama} (${nim})? Data dan foto yang terlampir akan dihapus dan tidak dapat dikembalikan.`}
        confirmText="Hapus Permanen"
        isLoading={isPending}
      />
    </>
  );
}
