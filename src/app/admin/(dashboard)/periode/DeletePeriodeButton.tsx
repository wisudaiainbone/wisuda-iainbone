'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { deletePeriode } from '@/actions/periode';
import { useToast } from '@/components/ui/Toast';

export default function DeletePeriodeButton({ id, nama, isActive }: { id: string, nama: string, isActive?: boolean }) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleDelete = async () => {
    if (isActive) {
      showToast('Periode aktif tidak dapat dihapus karena terhubung dengan data pendaftar.', 'error');
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus periode "${nama}"?\n\nPeringatan: Data terkait mungkin akan terpengaruh.`)) {
      return;
    }
    setLoading(true);
    const res = await deletePeriode(id);
    if (res.success) {
      showToast('Periode berhasil dihapus', 'success');
    } else {
      showToast(res.error || 'Gagal menghapus periode', 'error');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className={`flex flex-1 items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors md:flex-none md:w-8 md:h-8 md:p-0 md:rounded-lg ${
        isActive 
          ? 'bg-slate-100 text-slate-400 dark:bg-slate-800/50 dark:text-slate-500 cursor-not-allowed' 
          : 'bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400'
      }`}
      title={isActive ? "Periode aktif tidak dapat dihapus" : "Hapus Periode"}
    >
      {loading ? <Loader2 size={16} className="animate-spin md:w-3.5 md:h-3.5" /> : <Trash2 size={16} className="md:w-3.5 md:h-3.5" />}
      <span className="inline md:hidden">Hapus</span>
    </button>
  );
}
