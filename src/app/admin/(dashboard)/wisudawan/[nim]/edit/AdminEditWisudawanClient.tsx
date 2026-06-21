"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateWisudawan } from "@/actions/wisudawan";
import { useToast } from "@/components/ui/Toast";
import {
  User,
  GraduationCap,
  FileText,
  Save,
  Loader2,
} from "lucide-react";
import type { ProdiItem } from "@/actions/prodi";

export default function AdminEditWisudawanClient({
  initialData,
  prodiList,
}: {
  initialData: Record<string, any>;
  prodiList: ProdiItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({ ...initialData });

  const nim = formData["NIM"];

  // Filter prodi berdasarkan fakultas yang dipilih
  const availableProdi = prodiList.filter(
    (p) => !formData["FAKULTAS"] || p.fakultas === formData["FAKULTAS"]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProdiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedProdi = e.target.value;
    const match = prodiList.find((p) => p.prodi === selectedProdi);
    
    setFormData((prev) => ({
      ...prev,
      "PRODI": selectedProdi,
      "PRODI SINGKAT": match ? match.singkatan : prev["PRODI SINGKAT"],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    startTransition(async () => {
      try {
        const res = await updateWisudawan(nim, formData);
        if (res.success) {
          showToast("Data berhasil disimpan.", "success");
          setTimeout(() => {
            router.push(`/admin/wisudawan/${nim}`);
            router.refresh();
          }, 800);
        } else {
          showToast("Gagal menyimpan perubahan.", "error");
        }
      } catch (error: any) {
        showToast(error.message || "Terjadi kesalahan.", "error");
      }
    });
  };

  return (
    <div className="space-y-6">

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section: Biodata Pribadi */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
          <div className="bg-[var(--color-bg-secondary)] px-5 py-3.5 border-b border-[var(--color-border)] flex items-center gap-2">
            <User size={16} className="text-emerald-500" />
            <h2 className="font-bold text-[var(--color-text)]">Biodata Pribadi</h2>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">Nama Mahasiswa</label>
              <input
                type="text"
                name="NAMA MAHASISWA"
                value={formData["NAMA MAHASISWA"] || ""}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:ring-2 focus:ring-emerald-500/40 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">Email</label>
              <input
                type="email"
                name="EMAIL"
                value={formData["EMAIL"] || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:ring-2 focus:ring-emerald-500/40 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">Tempat, Tanggal Lahir</label>
              <input
                type="text"
                name="TTL"
                value={formData["TTL"] || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:ring-2 focus:ring-emerald-500/40 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">Jenis Kelamin</label>
              <select
                name="JENIS KELAMIN"
                value={formData["JENIS KELAMIN"] || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:ring-2 focus:ring-emerald-500/40 outline-none"
              >
                <option value="">- Pilih -</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section: Data Akademik */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
          <div className="bg-[var(--color-bg-secondary)] px-5 py-3.5 border-b border-[var(--color-border)] flex items-center gap-2">
            <GraduationCap size={16} className="text-blue-500" />
            <h2 className="font-bold text-[var(--color-text)]">Data Akademik</h2>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">Nama Beserta Gelar</label>
              <input
                type="text"
                name="NAMA GELAR"
                value={formData["NAMA GELAR"] || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:ring-2 focus:ring-emerald-500/40 outline-none font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">Fakultas</label>
              <select
                name="FAKULTAS"
                value={formData["FAKULTAS"] || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:ring-2 focus:ring-emerald-500/40 outline-none"
              >
                <option value="">- Pilih Fakultas -</option>
                {Array.from(new Set(prodiList.map((p) => p.fakultas))).map((fakultas) => (
                  <option key={fakultas} value={fakultas}>
                    {fakultas}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">Program Studi</label>
              <select
                name="PRODI"
                value={formData["PRODI"] || ""}
                onChange={handleProdiChange}
                className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:ring-2 focus:ring-emerald-500/40 outline-none"
              >
                <option value="">- Pilih Prodi -</option>
                {availableProdi.map((p) => (
                  <option key={p.prodi} value={p.prodi}>
                    {p.prodi}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">Prodi Singkat</label>
              <input
                type="text"
                name="PRODI SINGKAT"
                value={formData["PRODI SINGKAT"] || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:ring-2 focus:ring-emerald-500/40 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">Tanggal Yudisium</label>
              <input
                type="text"
                name="TANGGAL YUDISIUM"
                value={formData["TANGGAL YUDISIUM"] || ""}
                onChange={handleChange}
                placeholder="DD/MM/YYYY"
                className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:ring-2 focus:ring-emerald-500/40 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">IPK</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="4"
                name="IPK"
                value={formData["IPK"] || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:ring-2 focus:ring-emerald-500/40 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">Predikat</label>
              <select
                name="PREDIKAT"
                value={formData["PREDIKAT"] || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:ring-2 focus:ring-emerald-500/40 outline-none"
              >
                <option value="">- Pilih -</option>
                <option value="Sangat Memuaskan">Sangat Memuaskan</option>
                <option value="Memuaskan">Memuaskan</option>
                <option value="Cukup">Cukup</option>
                <option value="Cumlaude">Cumlaude</option>
              </select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">Judul Skripsi / Tesis</label>
              <textarea
                name="JUDUL SKRIPSI / TESIS"
                value={formData["JUDUL SKRIPSI / TESIS"] || ""}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:ring-2 focus:ring-emerald-500/40 outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section: Data Kepesertaan Wisuda */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
          <div className="bg-[var(--color-bg-secondary)] px-5 py-3.5 border-b border-[var(--color-border)] flex items-center gap-2">
            <FileText size={16} className="text-amber-500" />
            <h2 className="font-bold text-[var(--color-text)]">Data Kepesertaan & Status</h2>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">Status</label>
              <select
                name="STATUS"
                value={formData["STATUS"] || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:ring-2 focus:ring-emerald-500/40 outline-none"
              >
                <option value="Calon Wisudawan">Calon Wisudawan</option>
                <option value="Terdaftar">Terdaftar</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">Periode</label>
              <input
                type="text"
                name="PERIODE"
                value={formData["PERIODE"] || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:ring-2 focus:ring-emerald-500/40 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">Sesi</label>
              <input
                type="text"
                name="SESI"
                value={formData["SESI"] || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:ring-2 focus:ring-emerald-500/40 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">Ukuran Toga</label>
              <select
                name="TOGA"
                value={formData["TOGA"] || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:ring-2 focus:ring-emerald-500/40 outline-none"
              >
                <option value="">- Pilih Toga -</option>
                {["S", "M", "L", "XL", "XXL", "XXXL"].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">Link Sertifikat</label>
              <input
                type="text"
                name="SERTIFIKAT"
                value={formData["SERTIFIKAT"] || ""}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:ring-2 focus:ring-emerald-500/40 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-4 flex justify-end gap-3 p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl shadow-black/5 z-40">
          <a
            href={`/admin/wisudawan/${nim}`}
            className="px-5 py-2.5 rounded-xl font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] transition-colors text-sm"
          >
            Batal
          </a>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-blue-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Simpan Perubahan
          </button>
        </div>
      </form>
    </div>
  );
}
