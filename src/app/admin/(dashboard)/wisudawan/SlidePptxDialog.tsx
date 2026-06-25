'use client';

import { useState, useMemo } from 'react';
import { MonitorPlay, X, Loader2, ChevronRight, AlertCircle } from 'lucide-react';
import { extractGDriveFileId } from '@/lib/uploadFoto';
import { getSetting } from '@/actions/settings';
import { getFakultasData } from '@/lib/fakultas';

type WisudawanRow = {
  nim: string;
  nama_mahasiswa: string;
  nama_gelar?: string;
  fakultas?: string;
  prodi?: string;
  ipk?: number | null;
  predikat?: string;
  sesi?: string;
  urut?: number | null;
  terdaftar?: string;
  foto?: string;
  tanggal_yudisium?: string;
  judul_skripsi?: string;
};

type ProdiItem = {
  id: number;
  fakultas: string;
  prodi: string;
  singkatan: string;
  urutan: number;
};

type Props = {
  data: WisudawanRow[];
  prodiData: ProdiItem[];
};

async function fetchImageAsBase64(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    let fetchUrl = url;
    if (url.includes('drive.google.com')) {
      const fileId = extractGDriveFileId(url);
      if (fileId) {
        fetchUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
      }
    }
    
    // Gunakan proxy/no-referrer untuk fetch (meskipun browser mungkin membatasi)
    let res = await fetch(fetchUrl, { mode: 'cors', referrerPolicy: 'no-referrer' });
    
    // Jika gagal pakai lh3, fallback ke URL asli
    if (!res.ok && fetchUrl !== url) {
      console.warn('Gagal fetch lh3, fallback ke URL asli:', fetchUrl);
      res = await fetch(url, { mode: 'cors', referrerPolicy: 'no-referrer' });
    }
    
    if (!res.ok) {
      console.error('Fetch image gagal:', res.status, res.statusText);
      return null;
    }
    
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = (err) => {
        console.error('FileReader error:', err);
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('fetchImageAsBase64 error:', err);
    return null;
  }
}

// ─── Warna Fakultas ───
const WARNA_FAKULTAS: Record<string, { bg: string; accent: string; text: string }> = {
  'Fakultas Ekonomi dan Bisnis Islam': { bg: '1a2744', accent: 'd4af37', text: 'ffffff' },
  'Fakultas Syariah dan Hukum Islam':  { bg: '1a3a2a', accent: 'c9a227', text: 'ffffff' },
  'Fakultas Tarbiyah':                 { bg: '1a2c44', accent: '4a9eff', text: 'ffffff' },
  'Fakultas Dakwah dan Komunikasi':    { bg: '2d1a44', accent: 'b07bff', text: 'ffffff' },
  'Fakultas Ushuluddin dan Filsafat':  { bg: '44281a', accent: 'ff9f4a', text: 'ffffff' },
  'Pascasarjana':                       { bg: '0d1f2d', accent: '60efff', text: 'ffffff' },
};

const DEFAULT_COLORS = { bg: '1a2744', accent: 'd4af37', text: 'ffffff' };

function getWarna(fakultas: string) {
  for (const key of Object.keys(WARNA_FAKULTAS)) {
    if (fakultas.toLowerCase().includes(key.toLowerCase().split(' ')[1] || key)) {
      return WARNA_FAKULTAS[key];
    }
  }
  return DEFAULT_COLORS;
}

export default function SlidePptxDialog({ data, prodiData }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedFakultas, setSelectedFakultas] = useState('');
  const [selectedProdi, setSelectedProdi] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');

  // ─── Daftar Fakultas unik dari data ───
  const fakultasList = useMemo(() => {
    return Array.from(new Set(data.map(w => w.fakultas).filter(Boolean) as string[])).sort();
  }, [data]);

  // ─── Daftar Prodi sesuai Fakultas yang dipilih (terurut sesuai DB) ───
  const prodiList = useMemo(() => {
    if (!selectedFakultas) return [];
    const forFak = prodiData.filter(p => p.fakultas === selectedFakultas).sort((a, b) => a.urutan - b.urutan);
    return forFak.map(p => p.prodi);
  }, [selectedFakultas, prodiData]);

  // ─── Wisudawan yang akan di-generate ───
  const targetWisudawan = useMemo(() => {
    let filtered = data.filter(w =>
      Boolean(w.terdaftar && w.terdaftar !== 'false' && w.terdaftar !== '0') &&
      w.urut != null
    );
    if (selectedFakultas) filtered = filtered.filter(w => w.fakultas === selectedFakultas);
    if (selectedProdi) filtered = filtered.filter(w => w.prodi === selectedProdi);

    // Urutkan: sesuai urutan prodi di DB, lalu urut ascending
    const prodiOrder: Record<string, number> = {};
    prodiData.filter(p => p.fakultas === selectedFakultas).sort((a, b) => a.urutan - b.urutan).forEach((p, i) => {
      prodiOrder[p.prodi] = i;
    });

    filtered.sort((a, b) => {
      const prodiA = prodiOrder[a.prodi || ''] ?? 999;
      const prodiB = prodiOrder[b.prodi || ''] ?? 999;
      if (prodiA !== prodiB) return prodiA - prodiB;
      return (a.urut || 0) - (b.urut || 0);
    });

    return filtered;
  }, [data, selectedFakultas, selectedProdi, prodiData]);

  const handleGenerate = async () => {
    if (!selectedFakultas || targetWisudawan.length === 0) return;
    setIsGenerating(true);
    setProgress(0);
    setProgressMsg('Memuat library...');

    try {
      // Ambil pengaturan bingkai
      let fakKey = 'fak1';
      const fLow = selectedFakultas.toLowerCase();
      if (fLow.includes('syariah')) fakKey = 'fak1';
      else if (fLow.includes('tarbiyah')) fakKey = 'fak2';
      else if (fLow.includes('ekonomi')) fakKey = 'fak3';
      else if (fLow.includes('ushuluddin')) fakKey = 'fak4';
      else if (fLow.includes('pasca')) fakKey = 'fak5';

      const frameUrl = await getSetting(`slide_frame_${fakKey}_url`, '', true);
      const frameWarnaHex = await getSetting(`slide_frame_${fakKey}_warna`, '', true);
      
      let frameBase64: string | null = null;
      if (frameUrl) {
        try {
          frameBase64 = await fetchImageAsBase64(frameUrl);
        } catch {}
      }

      const PptxGenJS = (await import('pptxgenjs')).default;
      const pptx = new PptxGenJS();

      // Ukuran 1080×1920px → dalam inch (1in = 96px pada 96dpi)
      // 1080/96 = 11.25in, 1920/96 = 20in
      pptx.defineLayout({ name: 'PORTRAIT_1080x1920', width: 11.25, height: 20 });
      pptx.layout = 'PORTRAIT_1080x1920';

      const total = targetWisudawan.length;

      for (let i = 0; i < total; i++) {
        const w = targetWisudawan[i];
        setProgressMsg(`Memproses ${i + 1}/${total}: ${w.nama_mahasiswa}`);
        setProgress(Math.round(((i + 1) / total) * 90));

        const warna = getWarna(w.fakultas || '');
        if (frameWarnaHex) {
          warna.bg = frameWarnaHex.replace('#', '');
        }

        const slide = pptx.addSlide();

        // ─── Background solid (Putih) ───
        slide.addShape(pptx.ShapeType.rect, {
          x: 0, y: 0, w: '100%', h: '100%',
          fill: { color: 'ffffff' },
          line: { color: 'ffffff', width: 0 }
        });



        // ─── Foto Wisudawan ───
        let fotoBase64: string | null = null;
        if (w.foto) {
          try {
            fotoBase64 = await fetchImageAsBase64(w.foto);
          } catch {
            fotoBase64 = null;
          }
        }

        const fotoW = 6.35; // 16.13 cm
        const fotoH = 8.89; // 22.58 cm
        const fotoX = 2.45; // (11.25 - 6.35) / 2
        const fotoY = 1.5; // Diturunkan dari 0.8 agar ada jarak di atas

        if (fotoBase64) {
          slide.addImage({
            data: fotoBase64,
            x: fotoX, y: fotoY, w: fotoW, h: fotoH,
            sizing: { type: 'cover', w: fotoW, h: fotoH },
          });
        } else {
          // Placeholder foto jika tidak ada
          slide.addShape(pptx.ShapeType.rect, {
            x: fotoX, y: fotoY, w: fotoW, h: fotoH,
            fill: { color: 'e2e8f0' },
            line: { color: 'cbd5e1', width: 2 }
          });
          slide.addText('📷', {
            x: fotoX, y: fotoY + 2.2, w: fotoW, h: 1.5,
            fontSize: 48, align: 'center',
          });
        }

        // ─── Bingkai Custom (Overlay tepat seukuran foto) ───
        if (frameBase64) {
          slide.addImage({
            data: frameBase64,
            x: fotoX, y: fotoY, w: fotoW, h: fotoH,
            sizing: { type: 'cover', w: fotoW, h: fotoH },
          });
        }

        // ─── Badge Bulat (Top Left) ───
        const fakData = getFakultasData(w.fakultas);
        let prodiSingkatan = '';
        if (w.prodi) {
          const prodiObj = prodiData.find(p => p.prodi === w.prodi);
          if (prodiObj && prodiObj.singkatan) {
            prodiSingkatan = prodiObj.singkatan;
          } else {
            prodiSingkatan = w.prodi.split(' ').filter(word => word.length > 0).map(word => word[0].toUpperCase()).join('');
          }
        }
        const badgeText = `${fakData.singkatan}-\n${prodiSingkatan}`;

        const badgeD = 1.97; // 5 cm
        const badgeX = fotoX - 0.6; // Digeser sedikit ke kanan (sebelumnya: fotoX - (badgeD / 2) yang setara dengan -0.985)
        const badgeY = fotoY - 0.5; // Diturunkan lebih ke bawah (sebelumnya -0.65)

        slide.addShape(pptx.ShapeType.ellipse, {
          x: badgeX, y: badgeY, w: badgeD, h: badgeD,
          fill: { color: warna.bg || '333333' }
        });

        slide.addText(badgeText, {
          x: badgeX, y: badgeY, w: badgeD, h: badgeD,
          color: 'ffffff',
          fontSize: 28,
          bold: true,
          align: 'center',
          valign: 'middle',
          fontFace: 'Inter'
        });

        // ─── Nama Lengkap ───
        const namaRaw = w.nama_gelar || w.nama_mahasiswa || '';
        const namaFormatted = namaRaw.toLowerCase().replace(/(?:^|[\s.,])\w/g, match => match.toUpperCase());
        slide.addText(namaFormatted, {
          x: 0.5, y: 10.7, w: 10.25, h: 1.2,
          fontSize: 48,
          bold: true,
          color: '000000', // Sesuai referensi (hitam)
          fontFace: 'Inter',
          align: 'center',
          valign: 'middle',
          wrap: true,
        });

        // ─── NIM ───
        slide.addText(w.nim, {
          x: 0.5, y: 12.0, w: 10.25, h: 0.6,
          fontSize: 40,
          color: '000000',
          fontFace: 'Inter',
          align: 'center',
        });

        // ─── Separator (Ornament) ───
        slide.addText('◈ ━━━━━━ ◈', {
          x: 0.5, y: 12.8, w: 10.25, h: 0.4,
          fontSize: 30,
          color: warna.bg || '000000',
          fontFace: 'Inter',
          align: 'center',
        });

        // ─── IPK & Predikat ───
        const ipkStr = w.ipk != null ? Number(w.ipk).toFixed(2).replace('.', ',') : '';
        const predikatStr = w.predikat 
          ? w.predikat.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
          : '';
        let ipkPredikatText = '';
        if (ipkStr && predikatStr) {
          ipkPredikatText = `IPK ${ipkStr} / ${predikatStr}`;
        } else if (ipkStr) {
          ipkPredikatText = `IPK ${ipkStr}`;
        } else if (predikatStr) {
          ipkPredikatText = predikatStr;
        }

        if (ipkPredikatText) {
          const ipkY = 13.5;
          const ipkH = 0.8;
          // Perkirakan lebar yang dibutuhkan teks (tiap karakter ~0.24 inch) ditambah margin 1.5 inch
          const labelW = Math.max(7.5, (ipkPredikatText.length * 0.24) + 1.5);
          
          // Label Background (Pastel)
          slide.addShape(pptx.ShapeType.roundRect, {
            x: (11.25 - labelW) / 2, y: ipkY, w: labelW, h: ipkH,
            fill: { color: warna.bg, transparency: 85 }, // Transparansi 85% membuat warna menjadi pastel di atas background putih
            rectRadius: 0.4
          });

          slide.addText(ipkPredikatText, {
            x: 0.5, y: ipkY, w: 10.25, h: ipkH,
            fontSize: 38,
            bold: true,
            color: warna.bg, // Teks dengan warna hex asli yang lebih pekat
            fontFace: 'Inter',
            align: 'center',
          });
        }

        // ─── Label Judul Penelitian ───
        slide.addText('JUDUL PENELITIAN', {
          x: 0.5, y: 14.6, w: 10.25, h: 0.6,
          fontSize: 28,
          bold: true,
          color: '000000',
          fontFace: 'Inter',
          align: 'center',
        });

        // ─── Judul Penelitian ───
        const judul = w.judul_skripsi || '-';
        slide.addText(judul, {
          x: 0.5, y: 15.3, w: 10.25, h: 4.0,
          fontSize: 35,
          color: '000000',
          fontFace: 'Inter',
          align: 'center',
          valign: 'top',
          wrap: true,
        });
      }

      setProgressMsg('Menyimpan file...');
      setProgress(95);

      const namaFak = selectedFakultas.replace(/^Fakultas\s+/i, '').replace(/\s+/g, '_');
      const namaProdi = selectedProdi ? `_${selectedProdi.replace(/\s+/g, '_')}` : '';
      const namaFile = `Slide_Wisuda_${namaFak}${namaProdi}_${new Date().toISOString().slice(0, 10)}.pptx`;

      await pptx.writeFile({ fileName: namaFile });
      setProgress(100);
      setProgressMsg('Selesai!');

      setTimeout(() => {
        setIsGenerating(false);
        setProgress(0);
        setProgressMsg('');
        setOpen(false);
      }, 1500);

    } catch (err) {
      console.error('Generate PPTX error:', err);
      setProgressMsg('Terjadi kesalahan. Coba lagi.');
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* Tombol Slide */}
      <button
        onClick={() => setOpen(true)}
        disabled={!data.length}
        title="Generate Slide PPTX"
        className="flex items-center justify-center gap-1.5 px-3 sm:px-4 h-8 sm:h-10 rounded-lg sm:rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs sm:text-sm font-normal sm:font-semibold transition-colors-fuchsia-900/20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
      >
        <MonitorPlay size={16} />
        Slide
      </button>

      {/* Dialog Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                  <MonitorPlay size={18} />
                </div>
                <h2 className="text-lg font-bold text-[var(--color-text)]">Generate Slide PPTX</h2>
              </div>
              <button
                onClick={() => { if (!isGenerating) setOpen(false); }}
                className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors rounded-lg hover:bg-[var(--color-bg-secondary)]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Fakultas */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Fakultas <span className="text-rose-500">*</span></label>
                <select
                  value={selectedFakultas}
                  onChange={e => { setSelectedFakultas(e.target.value); setSelectedProdi(''); }}
                  disabled={isGenerating}
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:ring-2 focus:ring-violet-500/40 outline-none transition-all disabled:opacity-60"
                >
                  <option value="" disabled>Pilih Fakultas...</option>
                  {fakultasList.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              {/* Prodi */}
              {selectedFakultas && prodiList.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Prodi <span className="text-[var(--color-text-muted)] font-normal normal-case">(Kosongkan untuk semua prodi)</span></label>
                  <select
                    value={selectedProdi}
                    onChange={e => setSelectedProdi(e.target.value)}
                    disabled={isGenerating}
                    className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:ring-2 focus:ring-violet-500/40 outline-none transition-all disabled:opacity-60"
                  >
                    <option value="">Semua Prodi</option>
                    {prodiList.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Preview count */}
              {selectedFakultas && (
                <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium border ${
                  targetWisudawan.length > 0
                    ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400'
                    : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
                }`}>
                  {targetWisudawan.length > 0 ? (
                    <>
                      <MonitorPlay size={16} />
                      <span><strong>{targetWisudawan.length}</strong> wisudawan akan di-generate menjadi <strong>{targetWisudawan.length} slide</strong></span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={16} />
                      <span>Tidak ada wisudawan terdaftar untuk pilihan ini</span>
                    </>
                  )}
                </div>
              )}

              {/* Progress bar */}
              {isGenerating && (
                <div className="space-y-2">
                  <div className="w-full bg-[var(--color-bg-secondary)] rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 bg-violet-500 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] text-center">{progressMsg}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
              <button
                onClick={() => setOpen(false)}
                disabled={isGenerating}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleGenerate}
                disabled={!selectedFakultas || targetWisudawan.length === 0 || isGenerating}
                className="flex items-center gap-2 px-6 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-bold transition-colors-violet-900/20"
              >
                {isGenerating ? (
                  <><Loader2 size={15} className="animate-spin" /> Memproses...</>
                ) : (
                  <><ChevronRight size={15} /> Generate PPTX</>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
