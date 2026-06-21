'use server';

import { getSetting, updateSetting } from "./settings";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabase } from "@/lib/supabase";
import { redis } from "@/lib/redis";

export type PrestasiOverride = {
  [tab: string]: { 
    [fakultasOrInstitut: string]: {
      [rankIndex: string]: string; // index '0', '1', '2' -> nim
    }
  }
};

export async function getPrestasiOverrides(periode: string): Promise<PrestasiOverride> {
  if (!periode) return {};
  const val = await getSetting(`prestasi_override_${periode}`, '{}', true);
  try {
    return JSON.parse(val);
  } catch (e) {
    return {};
  }
}

// ─── Helper: hitung ranking dan tulis prestasi_akd ke DB ──────────────────
async function syncPrestasiAkdToDb(periode: string, overrides: PrestasiOverride) {
  // Ambil semua wisudawan terdaftar di periode ini
  const { data: allWisudawan, error } = await supabase
    .from('wisudawan')
    .select('nim, nama_mahasiswa, ipk, tanggal_yudisium, fakultas, prestasi_akd')
    .eq('periode', periode)
    .eq('status', 'Terdaftar');

  if (error || !allWisudawan) return;

  const parseIpk = (ipkStr: any) => {
    if (!ipkStr) return 0;
    const parsed = parseFloat(ipkStr.toString().replace(',', '.'));
    return isNaN(parsed) ? 0 : parsed;
  };

  const parseDate = (dateStr: any) => {
    if (!dateStr) return new Date(8640000000000000).getTime();
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? new Date(8640000000000000).getTime() : date.getTime();
  };

  const parsedData = allWisudawan.map(w => ({
    ...w,
    parsedIpk: parseIpk(w.ipk),
    parsedDate: parseDate(w.tanggal_yudisium),
  }));

  // === Hitung Institut terbaik ===
  const sortedOverall = [...parsedData]
    .filter(w => w.fakultas !== "Pascasarjana" && w.fakultas?.toLowerCase() !== "pascasarjana")
    .sort((a, b) => {
      if (b.parsedIpk !== a.parsedIpk) return b.parsedIpk - a.parsedIpk;
      return a.parsedDate - b.parsedDate;
    });

  let bestOverallNim: string | null = sortedOverall.length > 0 ? sortedOverall[0].nim : null;
  const institutOverrides = overrides?.akademik?.['Institut'] || {};
  if (institutOverrides['0']) {
    const oUser = parsedData.find(x => x.nim === institutOverrides['0']);
    if (oUser) bestOverallNim = oUser.nim;
  }

  // === Top 3 per Fakultas ===
  const byFakultas: Record<string, typeof parsedData> = {};
  parsedData.forEach(w => {
    const f = w.fakultas || "Tanpa Fakultas";
    if (!byFakultas[f]) byFakultas[f] = [];
    byFakultas[f].push(w);
  });

  // Map: nim -> label prestasi_akd
  const prestasiMap: Record<string, string> = {};

  Object.keys(byFakultas).forEach(f => {
    const sorted = byFakultas[f].sort((a, b) => {
      if (b.parsedIpk !== a.parsedIpk) return b.parsedIpk - a.parsedIpk;
      return a.parsedDate - b.parsedDate;
    });

    let top3 = sorted.slice(0, 3);
    const fakultasOverrides = overrides?.akademik?.[f] || {};

    top3 = top3.map((w, idx) => {
      if (fakultasOverrides[idx.toString()]) {
        const oUser = parsedData.find(x => x.nim === fakultasOverrides[idx.toString()]);
        if (oUser) return { ...oUser };
      }
      return w;
    });

    const sebutanMap = ['Kesatu', 'Kedua', 'Ketiga'];

    top3.forEach((w, idx) => {
      const isInstitut = w.nim === bestOverallNim;
      const sebutan = sebutanMap[idx] || `Ke-${idx + 1}`;
      if (idx === 0 && isInstitut) {
        // Kesatu sekaligus Institut terbaik
        prestasiMap[w.nim] = 'Kesatu, Institut';
      } else if (isInstitut) {
        // Institut terbaik tapi bukan peringkat 1 Fakultas (kasus override manual)
        prestasiMap[w.nim] = `${sebutan}, Institut`;
      } else {
        prestasiMap[w.nim] = sebutan;
      }
    });
  });

  // Jika bestOverall bukan dalam top3 manapun (kasus override Institut ekstrem)
  if (bestOverallNim && !prestasiMap[bestOverallNim]) {
    prestasiMap[bestOverallNim] = 'Institut';
  }

  // === Batch update ke Supabase ===
  const updates: any[] = [];
  const nimsToInvalidateCache = new Set<string>();

  allWisudawan.forEach(w => {
    const newPrestasi = prestasiMap[w.nim] || null;
    const oldPrestasi = w.prestasi_akd || null;
    
    // Hanya update jika ada perubahan nilai (dari null ke ada isi, atau dari ada isi ke null, atau ganti sebutan)
    if (newPrestasi !== oldPrestasi) {
      updates.push({
        nim: w.nim,
        prestasi_akd: newPrestasi,
      });
      nimsToInvalidateCache.add(w.nim);
    }
  });

  if (updates.length > 0) {
    await supabase
      .from('wisudawan')
      .upsert(updates, { onConflict: 'nim' });

    // Hapus Redis cache per-wisudawan agar data terbaru
    try {
      const pipeline = redis.pipeline();
      nimsToInvalidateCache.forEach(nim => {
        pipeline.del(`wisudawan:${nim}`);
      });
      pipeline.del('dashboard:stats:all');
      await pipeline.exec();
    } catch (err) {
      console.error('Redis pipeline error on syncPrestasiAkdToDb:', err);
    }
  }
}

// ─── Generate Prestasi: dipanggil tombol Generate ─────────────────────────
export async function generatePrestasi(periode: string) {
  if (!periode) return { success: false, error: 'Periode tidak valid' };

  try {
    // Hapus semua override manual dengan mengosongkan setting
    await updateSetting(`prestasi_override_${periode}`, '{}');
    
    const emptyOverrides = {};
    await syncPrestasiAkdToDb(periode, emptyOverrides);

    revalidatePath('/admin/prestasi');
    return { success: true };
  } catch (err: any) {
    console.error('Error in generatePrestasi:', err);
    return { success: false, error: err.message || 'Terjadi kesalahan' };
  }
}

export async function setPrestasiOverride(
  periode: string, 
  tab: string, 
  fakultasOrInstitut: string, 
  rankIndex: number, 
  nim: string
) {
  if (!periode) return { success: false, error: 'Periode tidak valid' };

  const current = await getPrestasiOverrides(periode);
  if (!current[tab]) current[tab] = {};
  if (!current[tab][fakultasOrInstitut]) current[tab][fakultasOrInstitut] = {};

  current[tab][fakultasOrInstitut][rankIndex.toString()] = nim;

  const res = await updateSetting(`prestasi_override_${periode}`, JSON.stringify(current));
  
  if (res.success) {
    // Sync prestasi_akd ke DB setelah override berubah
    await syncPrestasiAkdToDb(periode, current);
    revalidatePath('/admin/prestasi');
  }

  return res;
}

export async function removePrestasiOverride(
  periode: string, 
  tab: string, 
  fakultasOrInstitut: string, 
  rankIndex: number
) {
  if (!periode) return { success: false, error: 'Periode tidak valid' };

  const current = await getPrestasiOverrides(periode);
  if (current[tab] && current[tab][fakultasOrInstitut]) {
    delete current[tab][fakultasOrInstitut][rankIndex.toString()];
  }

  const res = await updateSetting(`prestasi_override_${periode}`, JSON.stringify(current));
  if (res.success) {
    // Sync prestasi_akd ke DB setelah override dihapus
    await syncPrestasiAkdToDb(periode, current);
    revalidatePath('/admin/prestasi');
  }
  return res;
}

export async function searchWisudawanByNimAndPeriode(periode: string, searchQuery: string) {
  if (!searchQuery || searchQuery.length < 3) return { success: true, data: [] };
  
  const supabaseServer = await createSupabaseServerClient();
  const { data, error } = await supabaseServer
    .from('wisudawan')
    .select('nim, nama_mahasiswa, prodi, fakultas, ipk, tanggal_yudisium, status, periode')
    .eq('periode', periode)
    .eq('status', 'Terdaftar')
    .or(`nim.ilike.%${searchQuery}%,nama_mahasiswa.ilike.%${searchQuery}%`)
    .limit(10);

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}
