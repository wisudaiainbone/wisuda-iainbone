'use server';

import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { redis } from '@/lib/redis';
import { revalidatePath } from 'next/cache';

const CACHE_TTL = 3600; // 1 hour

export async function getSetting(key: string, defaultValue: string = '', skipCache: boolean = false) {
  const cacheKey = `setting_${key}`;
  
  // Cek cache Redis
  if (!skipCache) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return cached;
    } catch (error) {
      console.error('Redis Error:', error);
    }
  }

  const supabaseAdmin = await createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .single();

  if (error || !data) {
    return defaultValue;
  }

  // Simpan ke cache
  if (!skipCache) {
    try {
      await redis.setex(cacheKey, CACHE_TTL, data.value);
    } catch (error) {
      console.error('Redis Error:', error);
    }
  }

  return data.value;
}

export async function getAllSettingsAdmin() {
  const supabaseAdmin = await createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('app_settings')
    .select('key, value, description');
  
  if (error || !data) {
    return [];
  }
  return data;
}

export async function updateSetting(key: string, value: string) {
  try {
    const supabaseAdmin = await createSupabaseAdminClient();
    const { error } = await supabaseAdmin
      .from('app_settings')
      .upsert({ 
        key, 
        value, 
        updated_at: new Date().toISOString() 
      }, { onConflict: 'key' });

    if (error) {
      return { success: false, error: error.message };
    }

    // Bersihkan cache
    const cacheKey = `setting_${key}`;
    try {
      await redis.del(cacheKey);
    } catch (error) {
      console.error('Redis Delete Error:', error);
    }
    
    revalidatePath('/admin/pengaturan');

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Terjadi kesalahan' };
  }
}

// ==========================================
// MANAJEMEN AKUN UJI COBA (DUMMY)
// ==========================================

export async function checkAkunDummy() {
  const supabaseAdmin = await createSupabaseAdminClient();
  const { data } = await supabaseAdmin
    .from('wisudawan')
    .select('nim')
    .eq('nim', 'DUMMY999')
    .single();
  
  return !!data;
}

export async function createAkunDummy() {
  try {
    const supabaseAdmin = await createSupabaseAdminClient();
    
    // Ambil periode aktif
    const { data: periodeAktif } = await supabaseAdmin
      .from('periode_wisuda')
      .select('nama_periode')
      .eq('status', 'Sedang Dibuka')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!periodeAktif) {
      return { success: false, error: 'Tidak ada periode wisuda yang sedang aktif.' };
    }

    const { error } = await supabaseAdmin
      .from('wisudawan')
      .upsert({
        nim: 'DUMMY999',
        nama_mahasiswa: 'Wisudawan Uji Coba',
        status: 'Calon Wisudawan',
        fakultas: 'Dummy Fakultas',
        prodi: 'Dummy Prodi',
        password: null, // Agar harus lewat /setup dan isDefaultPassword = true
        periode: periodeAktif.nama_periode
      }, { onConflict: 'nim' });

    if (error) throw error;
    
    revalidatePath('/admin/pengaturan');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal membuat akun dummy' };
  }
}

export async function deleteAkunDummy() {
  try {
    const supabaseAdmin = await createSupabaseAdminClient();
    const { error } = await supabaseAdmin
      .from('wisudawan')
      .delete()
      .eq('nim', 'DUMMY999');

    if (error) throw error;
    
    revalidatePath('/admin/pengaturan');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal menghapus akun dummy' };
  }
}

// ==========================================
// VALIDASI SURVEI
// ==========================================

/**
 * Terapkan validasi survei secara replace-total:
 * 1. Reset kolom `survei` menjadi NULL/kosong untuk semua wisudawan di periode aktif
 * 2. Set `survei = 'TRUE'` untuk NIM yang ada di nimList
 * 
 * Returns: { processed, notFound, total }
 */
export async function applySurveiValidation(nimList: string[]): Promise<{
  success: boolean;
  processed?: number;
  notFound?: string[];
  total?: number;
  error?: string;
}> {
  try {
    const supabaseAdmin = await createSupabaseAdminClient();

    // Ambil periode aktif
    const { data: periodeAktif } = await supabaseAdmin
      .from('periode_wisuda')
      .select('nama_periode')
      .eq('status', 'Sedang Dibuka')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!periodeAktif) {
      return { success: false, error: 'Tidak ada periode wisuda yang sedang aktif.' };
    }

    const namaPeriode = periodeAktif.nama_periode;

    // Step 1: Reset semua survei untuk periode aktif
    const { error: resetError } = await supabaseAdmin
      .from('wisudawan')
      .update({ survei: null })
      .eq('periode', namaPeriode)
      .neq('nim', 'DUMMY999');

    if (resetError) {
      return { success: false, error: `Gagal reset survei: ${resetError.message}` };
    }

    if (nimList.length === 0) {
      revalidatePath('/admin');
      revalidatePath('/admin/wisudawan');
      return { success: true, processed: 0, notFound: [], total: 0 };
    }

    // Step 2: Ambil NIM yang ada di DB periode aktif
    const { data: existingRows, error: fetchError } = await supabaseAdmin
      .from('wisudawan')
      .select('nim')
      .eq('periode', namaPeriode)
      .in('nim', nimList);

    if (fetchError) {
      return { success: false, error: `Gagal membaca data wisudawan: ${fetchError.message}` };
    }

    const foundNims = new Set((existingRows || []).map((r: any) => r.nim));
    const notFound = nimList.filter(n => !foundNims.has(n));

    if (foundNims.size > 0) {
      // Step 3: Update survei = 'TRUE' untuk NIM yang ditemukan
      const { error: updateError } = await supabaseAdmin
        .from('wisudawan')
        .update({ survei: 'TRUE' })
        .eq('periode', namaPeriode)
        .in('nim', Array.from(foundNims));

      if (updateError) {
        return { success: false, error: `Gagal update survei: ${updateError.message}` };
      }
    }

    // Invalidate cache
    try {
      const { redis: redisClient } = await import('@/lib/redis');
      const pipeline = redisClient.pipeline();
      Array.from(foundNims).forEach(nim => pipeline.del(`wisudawan:${nim}`));
      await pipeline.exec();
    } catch (_) {}

    revalidatePath('/admin');
    revalidatePath('/admin/wisudawan');

    return {
      success: true,
      processed: foundNims.size,
      notFound,
      total: nimList.length,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Terjadi kesalahan tidak terduga' };
  }
}
