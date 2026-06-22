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
  prestasi_akd?: string;
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

async function generateGradientCircleBase64(hexColor: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const size = 1500;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
      ctx.closePath();

      const gradient = ctx.createLinearGradient(0, 0, 0, size);
      gradient.addColorStop(0, hexColor.startsWith('#') ? hexColor : `#${hexColor}`);
      gradient.addColorStop(1, '#000000');

      ctx.fillStyle = gradient;
      ctx.fill();

      resolve(canvas.toDataURL('image/png'));
    } catch (e) {
      console.error("Gagal generate gradient circle", e);
      resolve(null);
    }
  });
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

export default function SlidePrestasiPptxDialog({ data, prodiData }: Props) {
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
      w.urut != null &&
      Boolean(w.prestasi_akd && w.prestasi_akd.trim() !== '')
    );

    // Urutkan: fakultas, lalu urutan prodi di DB, lalu urut
    filtered.sort((a, b) => {
      const fakA = a.fakultas || '';
      const fakB = b.fakultas || '';
      if (fakA !== fakB) return fakA.localeCompare(fakB);

      const prodiObjA = prodiData.find(p => p.prodi === a.prodi);
      const prodiObjB = prodiData.find(p => p.prodi === b.prodi);
      const prodiAOrder = prodiObjA?.urutan ?? 999;
      const prodiBOrder = prodiObjB?.urutan ?? 999;
      if (prodiAOrder !== prodiBOrder) return prodiAOrder - prodiBOrder;

      return (a.urut || 0) - (b.urut || 0);
    });

    return filtered;
  }, [data, prodiData]);

  const handleGenerate = async () => {
    if (targetWisudawan.length === 0) return;
    setIsGenerating(true);
    setProgress(0);
    setProgressMsg('Memuat library...');

    try {
      // Ambil semua pengaturan bingkai fakultas
      const framesCache: Record<string, { frameBase64: string | null; frameWarnaHex: string }> = {};
      const fakKeys = ['fak1', 'fak2', 'fak3', 'fak4', 'fak5'];
      for (const key of fakKeys) {
        const frameUrl = await getSetting(`slide_frame_${key}_url`, '', true);
        const frameWarnaHex = await getSetting(`slide_frame_${key}_warna`, '', true);
        let frameBase64: string | null = null;
        if (frameUrl) {
          try { frameBase64 = await fetchImageAsBase64(frameUrl); } catch {}
        }
        framesCache[key] = { frameBase64, frameWarnaHex };
      }

      // Ambil semua badge prestasi
      const badgePrestasiCache: Record<string, string | null> = {};
      const badgeKeys = ['badge_prestasi_1', 'badge_prestasi_2', 'badge_prestasi_3'];
      for (const key of badgeKeys) {
        const badgeUrl = await getSetting(`slide_${key}_url`, '', true);
        let badgeBase64: string | null = null;
        if (badgeUrl) {
          try { badgeBase64 = await fetchImageAsBase64(badgeUrl); } catch {}
        }
        badgePrestasiCache[key] = badgeBase64;
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

        let fakKey = 'fak1';
        const fLow = (w.fakultas || '').toLowerCase();
        if (fLow.includes('syariah')) fakKey = 'fak1';
        else if (fLow.includes('tarbiyah')) fakKey = 'fak2';
        else if (fLow.includes('ekonomi')) fakKey = 'fak3';
        else if (fLow.includes('ushuluddin')) fakKey = 'fak4';
        else if (fLow.includes('pasca')) fakKey = 'fak5';

        const { frameBase64, frameWarnaHex } = framesCache[fakKey] || { frameBase64: null, frameWarnaHex: '' };

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

        // ─── Koordinat Foto ───
        const fotoW = 6.35; // 16.13 cm
        const fotoH = 8.89; // 22.58 cm
        const fotoX = 2.45; // (11.25 - 6.35) / 2
        const fotoY = 1.5; // Diturunkan dari 0.8 agar ada jarak di atas

        // ─── Shape Setengah Lingkaran Bawah (Gradient Murni via Canvas) ───
        const circleD = 17.716; // 45 cm
        const circleX = (11.25 - circleD) / 2; // Center horizontally
        const circleY = 8.0; // Digeser sedikit lagi ke atas
        
        const gradientBase64 = await generateGradientCircleBase64(warna.bg);
        if (gradientBase64) {
          slide.addImage({
            data: gradientBase64,
            x: circleX, y: circleY, w: circleD, h: circleD
          });
        } else {
          // Fallback jika canvas gagal
          slide.addShape(pptx.ShapeType.ellipse, {
            x: circleX, y: circleY, w: circleD, h: circleD,
            fill: { color: warna.bg }
          });
        }



        // ─── Foto Wisudawan ───
        let fotoBase64: string | null = null;
        if (w.foto) {
          try {
            fotoBase64 = await fetchImageAsBase64(w.foto);
          } catch {
            fotoBase64 = null;
          }
        }

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
          color: 'ffffff', // Diubah jadi putih karena background lingkaran
          fontFace: 'Inter',
          align: 'center',
          valign: 'middle',
          wrap: true,
        });

        // ─── NIM ───
        slide.addText(w.nim, {
          x: 0.5, y: 12.0, w: 10.25, h: 0.6,
          fontSize: 40,
          color: 'ffffff', 
          fontFace: 'Inter',
          align: 'center',
        });

        // ─── Separator (Ornament) ───
        slide.addText('◈ ━━━━━━ ◈', {
          x: 0.5, y: 13.0, w: 10.25, h: 0.4,
          fontSize: 30,
          color: 'ffffff',
          fontFace: 'Inter',
          align: 'center',
        });

        // ─── Sebutan Prestasi ───
        const parts = (w.prestasi_akd || '').split(',').map(s => s.trim()).filter(Boolean);
        let rankStr = parts[0] || '';
        let sebutanText = rankStr ? `TERBAIK ${rankStr.toUpperCase()}` : '';
        if (parts.includes("Institut")) {
          sebutanText += " INSTITUT";
        }

        const rankLower = rankStr.toLowerCase();
        let badgeBase64ToUse: string | null = null;
        if (rankLower.includes('kesatu') || rankLower.includes('1') || rankLower.includes('satu')) {
          badgeBase64ToUse = badgePrestasiCache['badge_prestasi_1'];
        } else if (rankLower.includes('kedua') || rankLower.includes('2') || rankLower.includes('dua')) {
          badgeBase64ToUse = badgePrestasiCache['badge_prestasi_2'];
        } else if (rankLower.includes('ketiga') || rankLower.includes('3') || rankLower.includes('tiga')) {
          badgeBase64ToUse = badgePrestasiCache['badge_prestasi_3'];
        } else if (rankStr) {
          // Default fallback if there's a rank but didn't explicitly match
          badgeBase64ToUse = badgePrestasiCache['badge_prestasi_1'];
        }

        // Tampilkan Sebutan di posisi aslinya
        if (sebutanText) {
          slide.addText(sebutanText, {
            x: 0.5, y: 15.0, w: 10.25, h: 1.0,
            fontSize: 60,
            bold: true,
            color: 'ffffff',
            fontFace: 'Inter',
            align: 'center',
          });
        }

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
          const ipkY = 16.2;
          const ipkH = 0.8;
          // Perkirakan lebar yang dibutuhkan teks (tiap karakter ~0.24 inch) ditambah margin 1.5 inch
          const labelW = Math.max(7.5, (ipkPredikatText.length * 0.24) + 1.5);
          
          // Label Background (Putih agar kontras dengan lingkaran gelap)
          slide.addShape(pptx.ShapeType.roundRect, {
            x: (11.25 - labelW) / 2, y: ipkY, w: labelW, h: ipkH,
            fill: { color: 'ffffff', transparency: 10 }, // Putih translusen sedikit
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

        // ─── Badge Prestasi Overlay Paling Atas (Z-Index Tertinggi) ───
        if (badgeBase64ToUse) {
          const badgeD = 3.15; // 8 cm
          // "kanan bingkai middle center" -> kanan frame foto, tinggi tengah foto
          const fotoX = 2.45;
          const fotoW = 6.35;
          const fotoY = 1.5;
          const fotoH = 8.89;
          
          const badgeX = (fotoX + fotoW) - (badgeD / 2); // Overlap di garis kanan foto
          const badgeY = fotoY + (fotoH / 2) - (badgeD / 2); // Middle center secara vertikal
          
          slide.addImage({
            data: badgeBase64ToUse,
            x: badgeX, y: badgeY, w: badgeD, h: badgeD
          });
        }
      }

      setProgressMsg('Menyimpan file...');
      setProgress(95);

      const namaFile = `Slide_Prestasi_Wisuda_${new Date().toISOString().slice(0, 10)}.pptx`;

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
        className="flex items-center justify-center sm:w-32 gap-1.5 px-3 sm:px-4 h-8 sm:h-10 rounded-lg sm:rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-normal sm:font-semibold transition-colors shadow-sm shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
      >
        <MonitorPlay size={16} className="shrink-0" />
        <span className="inline">Slide</span>
      </button>

      {/* Dialog Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">

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
              {/* Preview count */}
              <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium border ${
                targetWisudawan.length > 0
                  ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400'
                  : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
              }`}>
                {targetWisudawan.length > 0 ? (
                  <>
                    <MonitorPlay size={16} />
                    <span><strong>{targetWisudawan.length}</strong> wisudawan berprestasi akan di-generate menjadi <strong>{targetWisudawan.length} slide</strong></span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={16} />
                    <span>Tidak ada wisudawan berprestasi yang terdaftar</span>
                  </>
                )}
              </div>

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
                disabled={targetWisudawan.length === 0 || isGenerating}
                className="flex items-center gap-2 px-6 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-bold transition-colors shadow-md shadow-violet-900/20"
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
