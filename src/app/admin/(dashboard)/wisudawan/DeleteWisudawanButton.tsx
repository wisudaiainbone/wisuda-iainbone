"use client";

import { Trash2, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { deleteWisudawan } from "@/actions/wisudawan";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function DeleteWisudawanButton({ nim, nama, userRole, allowDeleteWisudawan }: { nim: string, nama: string, userRole?: string, allowDeleteWisudawan?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  // Superadmin & Admin Institut can always delete
  // Admin Unit can delete ONLY IF allowDeleteWisudawan is true
  const canDelete = 
    userRole === 'superadmin' || 
    userRole === 'admin_institut' || 
    (userRole === 'admin_unit' && allowDeleteWisudawan);

  if (!canDelete) {
    return null;
  }

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteWisudawan(nim);
      if (!res.success) {
        alert(`Gagal menghapus: ${res.error}`);
      }
      setShowConfirm(false);
    });
  };

  return (
    <>
      <button 
        onClick={() => setShowConfirm(true)}
        disabled={isPending}
        className="text-rose-500 hover:text-rose-600 transition-colors disabled:opacity-50"
        title="Hapus Data"
      >
        {isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
      </button>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Hapus Data Wisudawan"
        message={`Yakin ingin menghapus data wisudawan atas nama ${nama} (${nim})? Data yang dihapus tidak dapat dikembalikan.`}
        confirmText="Hapus Permanen"
        isLoading={isPending}
      />
    </>
  );
}
