"use client";

import { useState, useEffect } from "react";
import { Plus, Search, FileSpreadsheet, Printer, Edit2, Trash2, X, Check, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { createTamu, updateTamu, deleteTamu } from "@/actions/tamu";
import { pdf } from "@react-pdf/renderer";
import UndanganDocument from "./UndanganDocument";

export type TamuItem = {
  id: string;
  nama: string;
  jabatan: string;
  alamat: string;
  sesi: string;
  hadir?: string;
  qr_code?: string;
};

type Props = {
  initialData: TamuItem[];
  periode: string;
  settings: any;
};

export default function TamuListClient({ initialData, periode, settings }: Props) {
  const { showToast } = useToast();
  const [data, setData] = useState<TamuItem[]>(initialData);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nama: "", jabatan: "", alamat: "", sesi: "Sesi Satu" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPrintingSingle, setIsPrintingSingle] = useState<string | null>(null);

  // QR Modal State
  const [qrModalId, setQrModalId] = useState<string | null>(null);



  const handleOpenModal = (tamu?: TamuItem) => {
    if (tamu) {
      setEditingId(tamu.id);
      setFormData({ nama: tamu.nama, jabatan: tamu.jabatan || "", alamat: tamu.alamat || "", sesi: tamu.sesi });
    } else {
      setEditingId(null);
      setFormData({ nama: "", jabatan: "", alamat: "", sesi: "Sesi Satu" });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (editingId) {
        const res = await updateTamu(editingId, { ...formData });
        if (!res.success) throw new Error(res.error);
        
        setData(prev => prev.map(t => t.id === editingId ? { ...t, ...formData } : t));
        showToast("Tamu berhasil diperbarui!", "success");
      } else {
        const res = await createTamu({ ...formData });
        if (!res.success) throw new Error(res.error);
        
        // We do a simple reload to get the new ID from DB, since we generate ID in server
        window.location.reload();
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await deleteTamu(deleteId);
      if (!res.success) throw new Error(res.error);
      setData(prev => prev.filter(t => t.id !== deleteId));
      showToast("Tamu dihapus.", "success");
      setDeleteId(null);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const generateSinglePDF = async (tamu: TamuItem) => {
    setIsPrintingSingle(tamu.id);
    try {
      const blob = await pdf(
        <UndanganDocument data={[tamu]} settings={settings} periode={periode} />
      ).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Undangan_Tamu_${tamu.nama.replace(/\s+/g, '_')}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      
      showToast("Undangan berhasil diprint!", "success");
    } catch (err: any) {
      showToast("Gagal memproses PDF: " + err.message, "error");
    } finally {
      setIsPrintingSingle(null);
    }
  };

  return (
    <div className="space-y-6">


      {/* Tabel */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
              <tr>
                <th className="px-6 py-4 font-semibold">QR Code</th>
                <th className="px-6 py-4 font-semibold">Nama Lengkap</th>
                <th className="px-6 py-4 font-semibold">Jabatan</th>
                <th className="px-6 py-4 font-semibold">Alamat</th>
                <th className="px-6 py-4 font-semibold">Sesi</th>
                <th className="px-6 py-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--color-text-muted)]">
                    Belum ada data tamu
                  </td>
                </tr>
              ) : (
                data.map((tamu) => (
                  <tr key={tamu.id} className="hover:bg-[var(--color-bg-secondary)]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div 
                        className="w-12 h-12 bg-white p-1 rounded-lg border border-[var(--color-border)] shadow-sm shrink-0 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => setQrModalId(tamu.id)}
                        title="Perbesar QR Code"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={tamu.qr_code || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${tamu.id}`} alt="QR Code" className="w-full h-full object-contain mix-blend-multiply" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-[var(--color-text)]">{tamu.nama}</div>
                    </td>
                    <td className="px-6 py-4 text-[var(--color-text-subtle)]">
                      {tamu.jabatan || "-"}
                    </td>
                    <td className="px-6 py-4 text-[var(--color-text-subtle)]">
                      {tamu.alamat || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                        tamu.sesi === "Sesi Satu" ? "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400" : "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400"
                      }`}>
                        {tamu.sesi}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex items-center justify-center gap-2">
                      <button
                        onClick={() => generateSinglePDF(tamu)}
                        disabled={isPrintingSingle === tamu.id}
                        className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-400 rounded-lg transition-colors disabled:opacity-50"
                        title="Print Undangan"
                      >
                        {isPrintingSingle === tamu.id ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                      </button>
                      <button
                        onClick={() => handleOpenModal(tamu)}
                        className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 rounded-lg transition-colors"
                        title="Edit Tamu"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteId(tamu.id)}
                        className="p-2 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-lg transition-colors"
                        title="Hapus Tamu"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAB Tambah */}
      <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50">
        <button
          onClick={() => handleOpenModal()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] shadow-emerald-600/30 transition-transform hover:scale-105 active:scale-95"
          title="Tambah Tamu"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--color-surface)] w-full max-w-md rounded-2xl shadow-xl border border-[var(--color-border)] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
              <h3 className="text-lg font-bold text-[var(--color-text)]">
                {editingId ? "Edit Tamu" : "Tambah Tamu"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--color-text)]">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={e => setFormData({...formData, nama: e.target.value})}
                  className="w-full px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none"
                  placeholder="Nama tamu..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--color-text)]">Jabatan / Instansi (Opsional)</label>
                <input
                  type="text"
                  value={formData.jabatan}
                  onChange={e => setFormData({...formData, jabatan: e.target.value})}
                  className="w-full px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none"
                  placeholder="Contoh: Bupati Bone"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--color-text)]">Alamat (Opsional)</label>
                <input
                  type="text"
                  value={formData.alamat}
                  onChange={e => setFormData({...formData, alamat: e.target.value})}
                  className="w-full px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none"
                  placeholder="Contoh: Watampone"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--color-text)]">Sesi</label>
                <select
                  value={formData.sesi}
                  onChange={e => setFormData({...formData, sesi: e.target.value})}
                  className="w-full px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none"
                >
                  <option value="Sesi Satu">Sesi Satu</option>
                  <option value="Sesi Dua">Sesi Dua</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border)] text-[var(--color-text)] font-semibold rounded-xl text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--color-surface)] w-full max-w-sm rounded-2xl shadow-xl border border-[var(--color-border)] overflow-hidden animate-in zoom-in-95 duration-200 p-6 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 mx-auto rounded-full flex items-center justify-center mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-text)] mb-2">Hapus Tamu?</h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-6">
              Apakah Anda yakin ingin menghapus tamu ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border)] text-[var(--color-text)] rounded-xl font-bold transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : null}
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrModalId && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setQrModalId(null)}
        >
          <div 
            className="bg-white p-6 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col items-center relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setQrModalId(null)}
              className="absolute top-2 right-2 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
            >
              <X size={16} />
            </button>
            <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider">Scan Kehadiran Tamu</h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrModalId}`} 
              alt="QR Code" 
              className="w-64 h-64 object-contain" 
            />
            <p className="mt-4 text-xs font-mono text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">{qrModalId}</p>
          </div>
        </div>
      )}
    </div>
  );
}
