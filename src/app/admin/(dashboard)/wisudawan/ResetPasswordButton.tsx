"use client";

import { KeyRound, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { resetPasswordWisudawan } from "@/actions/wisudawan";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function ResetPasswordButton({ nim, nama }: { nim: string, nama: string }) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReset = () => {
    startTransition(async () => {
      const res = await resetPasswordWisudawan(nim);
      if (!res.success) {
        alert(`Gagal reset password: ${res.error}`);
      }
      setShowConfirm(false);
    });
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isPending}
        className="text-amber-500 hover:text-amber-600 transition-colors disabled:opacity-50"
        title="Reset Password ke Default"
      >
        {isPending ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
      </button>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleReset}
        title="Reset Password Wisudawan"
        message={`Reset password ${nama} (${nim}) ke password default? Wisudawan harus login menggunakan password default setelah ini.`}
        confirmText="Ya, Reset Password"
        isLoading={isPending}
      />
    </>
  );
}
