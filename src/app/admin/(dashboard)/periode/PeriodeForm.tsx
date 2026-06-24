"use client";

import { useState } from "react";
import { updatePeriodePengaturan, createPeriode } from "@/actions/periode";
import { Save } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function PeriodeForm({ initialData }: { initialData: any }) {
  const [formData, setFormData] = useState<any>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { id, created_at, updated_at, stats, title, date, location, venue, day, session1, session2, gladi, ...cleanData } = formData;
      
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
            <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Tempat Pelaksanaan</label>
            <input
              type="text"
              placeholder="Contoh: Gedung Serbaguna IAIN Bone, Watampone"
              value={formData.tempat_pelaksanaan || ''}
              onChange={(e) => setFormData({ ...formData, tempat_pelaksanaan: e.target.value })}
              className="w-full px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Jadwal Gladi Bersih</label>
            <input
              type="text"
              placeholder="Contoh: Senin, 9 Juni 2026 (Sesi 1: 14.00, Sesi 2: 19.00)"
              value={formData.jadwal_gladi || ''}
              onChange={(e) => setFormData({ ...formData, jadwal_gladi: e.target.value })}
              className="w-full px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none"
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Waktu Sesi 1</label>
            <input
              type="text"
              value={formData.waktu_sesi_1 || ''}
              onChange={(e) => setFormData({ ...formData, waktu_sesi_1: e.target.value })}
              className="w-full px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Waktu Sesi 2</label>
            <input
              type="text"
              value={formData.waktu_sesi_2 || ''}
              onChange={(e) => setFormData({ ...formData, waktu_sesi_2: e.target.value })}
              className="w-full px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none"
              required
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
          <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Link Pengumuman Resmi (Opsional)</label>
          <input
            type="url"
            value={formData.link_pengumuman || ''}
            onChange={(e) => setFormData({ ...formData, link_pengumuman: e.target.value })}
            placeholder="Contoh: https://iainbone.ac.id/pengumuman-wisuda"
            className="w-full px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:ring-2 focus:ring-orange-500/50 outline-none"
          />
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
          {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </form>
  );
}
