'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { redis } from '@/lib/redis';

/**
 * Set sesi for all wisudawan within a specific fakultas.
 * @param fakultas - The facultas name
 * @param sesi - 'Sesi Satu' | 'Sesi Dua' | null (hapus sesi)
 */
export async function setSesiByFakultas(
  fakultas: string,
  sesi: string | null
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    // 1. Update sesi di tabel wisudawan
    const { data, error } = await supabase
      .from('wisudawan')
      .update({ sesi })
      .eq('fakultas', fakultas)
      .select('nim');

    if (error) {
      return { success: false, error: error.message };
    }

    // 2. Update sesi di tabel prodi
    const { error: prodiError } = await supabase
      .from('prodi')
      .update({ sesi })
      .eq('fakultas', fakultas);

    if (prodiError) {
      console.error("Gagal mengupdate sesi di tabel prodi:", prodiError);
      // Lanjut saja, tidak usah return error agar tidak mengganggu flow wisudawan
    }

    // Hapus cache masing-masing wisudawan agar data sesi baru muncul di halaman profil
    if (data && data.length > 0) {
      const pipeline = redis.pipeline();
      data.forEach(w => {
        pipeline.del(`wisudawan:${w.nim}`);  // key benar: wisudawan:NIM
      });
      await pipeline.exec();
    }

    revalidatePath('/admin/wisudawan');
    revalidatePath('/admin');
    revalidatePath('/', 'layout');

    return { success: true, count: data?.length ?? 0 };
  } catch (err: any) {
    return { success: false, error: err.message || 'Terjadi kesalahan.' };
  }
}

/**
 * Get current sesi grouped by fakultas.
 */
export async function getSesiPerFakultas(): Promise<
  { fakultas: string; sesi: string | null }[]
> {
  const { data, error } = await supabase
    .from('wisudawan')
    .select('fakultas, sesi')
    .order('fakultas');

  if (error || !data) return [];

  // Deduplicate: per fakultas ambil sesi yang paling banyak dipakai
  const map = new Map<string, Record<string, number>>();
  for (const row of data) {
    const fak = row.fakultas;
    if (!fak) continue;
    if (!map.has(fak)) map.set(fak, {});
    const key = row.sesi || '__none__';
    map.get(fak)![key] = (map.get(fak)![key] || 0) + 1;
  }

  const result: { fakultas: string; sesi: string | null }[] = [];
  for (const [fak, counts] of map.entries()) {
    const topEntry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    const topSesi = topEntry?.[0] === '__none__' ? null : topEntry?.[0] ?? null;
    result.push({ fakultas: fak, sesi: topSesi });
  }

  return result.sort((a, b) => a.fakultas.localeCompare(b.fakultas));
}
