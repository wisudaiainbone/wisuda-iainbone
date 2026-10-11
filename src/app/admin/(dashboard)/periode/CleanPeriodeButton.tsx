'use client';

import { useState } from 'react';
import { UserX, AlertTriangle, Loader2 } from 'lucide-react';
import { cleanWisudawanPeriode } from '@/actions/wisudawan';
import { useToast } from '@/components/ui/Toast';

type Props = {
  namaPeriode: string;
};

export default function CleanPeriodeButton({ namaPeriode }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { showToast } = useToast();

  const handleClean = async () => {
    setIsPending(true);
    try {
      const res = await cleanWisudawanPeriode(namaPeriode);
      if (res.success) {
        showToast('Data wisudawan berhasil dibersihkan dari periode ini.', 'success');
        setIsOpen(false);
      } else {
        showToast(res.error || 'Gagal membersihkan data.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan sistem.', 'error');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:hover:bg-orange-900/40 dark:text-orange-400 font-medium transition-colors"
        title="Bersihkan Data Wisudawan"
      >
        <UserX size={14} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4 text-orange-600 dark:text-orange-400">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Bersihkan Data Wisudawan?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Anda akan menghapus SELURUH data wisudawan untuk periode <strong>{namaPeriode}</strong> dari database lokal. Pastikan Anda sudah mengarsipkannya ke Google Sheets. Tindakan ini tidak dapat dibatalkan.
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleClean}
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-sm disabled:opacity-50 shadow-orange-600/20"
                >
                  {isPending ? <Loader2 size={16} className="animate-spin" /> : <UserX size={16} />}
                  Ya, Bersihkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
