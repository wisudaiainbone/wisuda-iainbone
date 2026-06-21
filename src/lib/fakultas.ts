export const FAKULTAS_MAP: Record<string, { singkatan: string; colorClass: string }> = {
  "Fakultas Syariah dan Hukum Islam": {
    singkatan: "FSHI",
    colorClass: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-700/50", // Abu-abu
  },
  "Fakultas Tarbiyah": {
    singkatan: "FT",
    colorClass: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700/50", // Hijau
  },
  "Fakultas Ushuluddin dan Dakwah": {
    singkatan: "FUD",
    colorClass: "bg-amber-100/50 text-amber-800 border-amber-300/50 dark:bg-amber-900/20 dark:text-amber-500/90 dark:border-amber-700/30", // Coklat (menggunakan amber gelap/brownish)
  },
  "Fakultas Ekonomi dan Bisnis Islam": {
    singkatan: "FEBI",
    colorClass: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-500 dark:border-yellow-700/50", // Kuning Emas
  },
  "Pascasarjana": {
    singkatan: "PS",
    colorClass: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50", // Maroon (menggunakan rose pekat)
  },
};

export function getFakultasData(namaFakultas: string | null | undefined) {
  if (!namaFakultas) return { singkatan: "-", colorClass: "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700" };
  
  // Mencari key yang cocok, mengabaikan case sensitive atau spasi berlebih
  const normalizedInput = namaFakultas.trim().toLowerCase();
  
  for (const [key, value] of Object.entries(FAKULTAS_MAP)) {
    if (key.toLowerCase() === normalizedInput) {
      return value;
    }
  }

  // Fallback jika tidak ditemukan (ambil inisial huruf besar)
  const fallbackSingkatan = namaFakultas
    .split(" ")
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return {
    singkatan: fallbackSingkatan || namaFakultas,
    colorClass: "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700", // Default Abu-abu
  };
}
