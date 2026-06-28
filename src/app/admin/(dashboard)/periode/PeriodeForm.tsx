"use client";

import { useState } from "react";
import { updatePeriodePengaturan, createPeriode } from "@/actions/periode";
import { Save } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function PeriodeForm({ initialData }: { initialData: any }) {
  const [formData, setFormData] = useState<any>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadText, setUploadText] = useState('');
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let finalLink = formData.link_pengumuman;

      if (selectedFile) {
        setUploadText('Mengunggah File...');
        const { uploadGeneralFileToGDrive } = await import('@/lib/uploadFoto');
        const res = await uploadGeneralFileToGDrive(
          selectedFile,
          `Pengumuman_${formData.nama_periode?.replace(/[^a-zA-Z0-9]/g, '_') || 'Wisuda'}.pdf`,
          'application/pdf',
          formData.link_pengumuman
        );
        finalLink = res.fileUrl;
        setUploadText('');
      }

      const { id, created_at, updated_at, stats, title, date, location, venue, day, session1, session2, gladi, ...cleanData } = formData;
      cleanData.link_pengumuman = finalLink;
      
      let res;
      if (formData.id) {
        res = await updatePeriodePengaturan(formData.id, cleanData);
      } else {
        res = await createPeriode(cleanData);
      }

      if (res.success) {
        showToast(formData.id ? 'Berhasil Disimpan' : 'Berhasil Ditambahkan', 'success', formData.id ? 'Pengaturan berhasil disimpan!' : 'Periode berhasil ditambahkan!');
        if (!formData.id && (res as any).id) {
          // Redirect ke halaman edit jika baru dibuat
          window.location.href = `/admin/periode/${(res as any).id}`;
        }
      } else {
        showToast('Gagal', 'error', res.error || 'Terjadi kesalahan.');
      }
    } catch (err: any) {
      showToast('Error', 'error', err.message);
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Nama Periode / Judul</label>
          <input
            type="text"
            value={formData.nama_periode || ''}
            onChange={(e) => setFormData({ ...formData, nama_periode: e.target.value })}
            className="w-full px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none"
              required
            >
              <option value="Sedang Dibuka">Sedang Dibuka</option>
              <option value="Akan Datang">Akan Datang</option>
              <option value="Ditutup">Ditutup</option>
              <option value="Selesai">Selesai</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Kuota Mahasiswa</label>
            <input
              type="number"
              value={formData.kuota || ''}
              onChange={(e) => setFormData({ ...formData, kuota: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none"
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Rentang Tanggal Pendaftaran</label>
            <input
              type="text"
              placeholder="Contoh: 20 Juni 2026 - 8 Agustus 2026"
              value={formData.tanggal_pendaftaran || ''}
              onChange={(e) => setFormData({ ...formData, tanggal_pendaftaran: e.target.value })}
              className="w-full px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none"
              required
            />
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-1.5">
              Wajib sesuai format, contoh: <b>20 Juni 2026 - 8 Agustus 2026</b> agar hitung mundur otomatis di halaman depan dapat berjalan.
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Tanggal Pelaksanaan (Hari & Tgl)</label>
            <input
              type="text"
              placeholder="Contoh: Selasa, 10 Juni 2026"
              value={formData.tanggal_pelaksanaan || ''}
              onChange={(e) => setFormData({ ...formData, tanggal_pelaksanaan: e.target.value })}
              className="w-full px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Tempat Pelaksanaan (Opsional)</label>
            <input
              type="text"
              placeholder="Contoh: Gedung Serbaguna IAIN Bone, Watampone"
              value={formData.tempat_pelaksanaan || ''}
              onChange={(e) => setFormData({ ...formData, tempat_pelaksanaan: e.target.value })}
              className="w-full px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Jadwal Gladi Bersih (Opsional)</label>
            <input
              type="text"
              placeholder="Contoh: Senin, 9 Juni 2026 (Sesi 1: 14.00, Sesi 2: 19.00)"
              value={formData.jadwal_gladi || ''}
              onChange={(e) => setFormData({ ...formData, jadwal_gladi: e.target.value })}
              className="w-full px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Waktu Sesi 1 (Opsional)</label>
            <input
              type="text"
              value={formData.waktu_sesi_1 || ''}
              onChange={(e) => setFormData({ ...formData, waktu_sesi_1: e.target.value })}
              className="w-full px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Waktu Sesi 2 (Opsional)</label>
            <input
              type="text"
              value={formData.waktu_sesi_2 || ''}
              onChange={(e) => setFormData({ ...formData, waktu_sesi_2: e.target.value })}
              className="w-full px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Pengumuman (Opsional)</label>
          <textarea
            value={formData.pengumuman || ''}
            onChange={(e) => setFormData({ ...formData, pengumuman: e.target.value })}
            placeholder="Tuliskan pengumuman penting untuk wisudawan di sini..."
            rows={4}
            className="w-full px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Hint Pendaftaran (Opsional)</label>
          <textarea
            value={formData.hint_pendaftaran || ''}
            onChange={(e) => setFormData({ ...formData, hint_pendaftaran: e.target.value })}
            placeholder="Contoh: Jadwal pelaksanaan wisuda dapat berubah sewaktu-waktu."
            rows={2}
            className="w-full px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Link Grup WhatsApp (Opsional)</label>
          <input
            type="url"
            value={formData.waglink || ''}
            onChange={(e) => setFormData({ ...formData, waglink: e.target.value })}
            placeholder="Contoh: https://chat.whatsapp.com/..."
            className="w-full px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">File Pengumuman Resmi (Opsional, PDF)</label>
          <div className="flex flex-col gap-2">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
              className="w-full px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:ring-2 focus:ring-orange-500/50 outline-none file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-orange-50 dark:file:bg-orange-500/10 file:text-orange-700 dark:file:text-orange-400 hover:file:bg-orange-100 dark:hover:file:bg-orange-500/20"
            />
            {formData.link_pengumuman && !selectedFile && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                ✅ File sudah diunggah: <a href={formData.link_pengumuman} target="_blank" className="underline hover:text-emerald-700 dark:hover:text-emerald-300" rel="noreferrer">Lihat File Saat Ini</a>
              </p>
            )}
            {selectedFile && (
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                File baru terpilih: {selectedFile.name} (Akan diunggah saat disimpan)
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">URL Gambar Tema (Opsional)</label>
            <input
              type="url"
              value={formData.theme || ''}
              onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
              placeholder="Contoh: https://example.com/image.jpg"
              className="w-full px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Warna Tema (Opsional)</label>
            <input
              type="text"
              value={formData.status_color || ''}
              onChange={(e) => setFormData({ ...formData, status_color: e.target.value })}
              placeholder="Contoh: #10b981 atau emerald"
              className="w-full px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all disabled:opacity-50"
        >
          <Save size={18} />
          {isLoading ? (uploadText || 'Menyimpan...') : 'Simpan Perubahan'}
        </button>
      </div>
    </form>
  );
}
