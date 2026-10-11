'use server';

import { supabase } from '@/lib/supabase';
import { redis } from '@/lib/redis';
import { getAdminSession } from '@/actions/adminAuth';
import { getLatestPeriode } from '@/actions/periode';
import { cookies } from 'next/headers';

export async function warmUpTogaCache() {
  const session = await getAdminSession();
  const cookieStore = await cookies();
  const togaScanToken = cookieStore.get('toga_scan_token')?.value;
  if (!session && !togaScanToken) return { success: false, error: 'Unauthorized' };

  try {
    const start = Date.now();
    const activePeriode = await getLatestPeriode();

    if (!activePeriode) {
      return { success: false, error: 'Tidak ada periode aktif.' };
    }

    const { data: wisudawan, error } = await supabase
      .from('wisudawan')
      .select('nim, nama_mahasiswa, prodi_singkat, fakultas, toga, waktu_toga, id_wisuda')
      .eq('periode', activePeriode.nama_periode)
      .eq('status', 'Terdaftar')
      .not('id_wisuda', 'is', null)
      .not('toga', 'is', null);

    if (error) throw error;

    if (!wisudawan || wisudawan.length === 0) {
      return { success: true, total: 0, durationMs: Date.now() - start };
    }

    // Proses batch/chunking untuk menghindari limit payload Upstash 1MB
    const CHUNK_SIZE = 200;
    for (let i = 0; i < wisudawan.length; i += CHUNK_SIZE) {
      const chunk = wisudawan.slice(i, i + CHUNK_SIZE);
      const pipeline = redis.pipeline();
      
      for (const w of chunk) {
        pipeline.set(`scan:toga:${w.id_wisuda}`, JSON.stringify(w), { ex: 172800 });
      }
      
      if (i === 0) { // Set meta hanya di chunk pertama
        const meta = {
          cached_at: new Date().toISOString(),
          total: wisudawan.length,
          periode: activePeriode.nama_periode
        };
        pipeline.set('scan:meta:toga', JSON.stringify(meta), { ex: 172800 });
      }
      
      await pipeline.exec();
    }

    return { success: true, total: wisudawan.length, durationMs: Date.now() - start };
  } catch (err: any) {
    console.error('Error in warmUpTogaCache:', err);
    return { success: false, error: err.message };
  }
}

export async function warmUpUndanganCache() {
  const session = await getAdminSession();
  const cookieStore = await cookies();
  const absensiToken = cookieStore.get('absensi_token')?.value;
  if (!session && !absensiToken) return { success: false, error: 'Unauthorized' };

  try {
    const start = Date.now();
    const activePeriode = await getLatestPeriode();

    if (!activePeriode) {
      return { success: false, error: 'Tidak ada periode aktif.' };
    }

    const { data: wisudawan, error } = await supabase
      .from('wisudawan')
      .select('nim, nama_mahasiswa, prodi_singkat, fakultas, sesi, urut, waktu_hadir, id_undangan')
      .eq('periode', activePeriode.nama_periode)
      .eq('status', 'Terdaftar')
      .not('id_undangan', 'is', null);

    if (error) throw error;

    if (!wisudawan || wisudawan.length === 0) {
      return { success: true, total: 0, durationMs: Date.now() - start };
    }

    // Proses batch/chunking
    const CHUNK_SIZE = 200;
    for (let i = 0; i < wisudawan.length; i += CHUNK_SIZE) {
      const chunk = wisudawan.slice(i, i + CHUNK_SIZE);
      const pipeline = redis.pipeline();
      
      for (const w of chunk) {
        pipeline.set(`scan:undangan:${w.id_undangan}`, JSON.stringify(w), { ex: 172800 });
      }
      
      if (i === 0) {
        const meta = {
          cached_at: new Date().toISOString(),
          total: wisudawan.length,
          periode: activePeriode.nama_periode
        };
        pipeline.set('scan:meta:undangan', JSON.stringify(meta), { ex: 172800 });
      }
      
      await pipeline.exec();
    }

    return { success: true, total: wisudawan.length, durationMs: Date.now() - start };
  } catch (err: any) {
    console.error('Error in warmUpUndanganCache:', err);
    return { success: false, error: err.message };
  }
}

export async function warmUpTamuCache() {
  const session = await getAdminSession();
  if (!session) return { success: false, error: 'Unauthorized' };

  try {
    const start = Date.now();

    const { data: tamuList, error } = await supabase
      .from('tamu')
      .select('id, nama, jabatan, alamat, sesi, hadir, qr_code');

    if (error) throw error;

    if (!tamuList || tamuList.length === 0) {
      return { success: true, total: 0, durationMs: Date.now() - start };
    }

    // Proses batch/chunking
    const CHUNK_SIZE = 200;
    for (let i = 0; i < tamuList.length; i += CHUNK_SIZE) {
      const chunk = tamuList.slice(i, i + CHUNK_SIZE);
      const pipeline = redis.pipeline();
      
      for (const t of chunk) {
        pipeline.set(`scan:tamu:${t.id}`, JSON.stringify(t), { ex: 172800 });
      }
      
      if (i === 0) {
        const meta = {
          cached_at: new Date().toISOString(),
          total: tamuList.length
        };
        pipeline.set('scan:meta:tamu', JSON.stringify(meta), { ex: 172800 });
      }
      
      await pipeline.exec();
    }

    return { success: true, total: tamuList.length, durationMs: Date.now() - start };
  } catch (err: any) {
    console.error('Error in warmUpTamuCache:', err);
    return { success: false, error: err.message };
  }
}

export async function getScanMeta(type: 'toga' | 'undangan' | 'tamu') {
  try {
    const cached = await redis.get(`scan:meta:${type}`);
    if (cached) {
      return typeof cached === 'string' ? JSON.parse(cached) : cached;
    }
    return null;
  } catch (err) {
    console.error(`Error getting scan meta for ${type}:`, err);
    return null;
  }
}

export async function clearScanCache(type: 'toga' | 'undangan' | 'tamu') {
  const session = await getAdminSession();
  if (!session || !['superadmin', 'admin_institut', 'admin_unit', 'admin_absensi'].includes(session.role ?? '')) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Cari semua kunci yang berkaitan dengan tipe scan tersebut
    let cursor = '0';
    let keys: string[] = [];
    do {
      // redis.scan pada upstash menggunakan format { cursor, keys }
      const res = await redis.scan(cursor, { match: `scan:${type}:*`, count: 1000 });
      cursor = res[0];
      if (res[1] && res[1].length > 0) {
        keys = keys.concat(res[1]);
      }
    } while (cursor !== '0');

    // Hapus meta data-nya
    keys.push(`scan:meta:${type}`);

    if (keys.length > 0) {
      // Hapus dalam pipeline
      const pipeline = redis.pipeline();
      keys.forEach((k) => pipeline.del(k));
      await pipeline.exec();
    }

    return { success: true, deletedCount: keys.length };
  } catch (err: any) {
    console.error(`Error clearing scan cache for ${type}:`, err);
    return { success: false, error: err.message };
  }
}
