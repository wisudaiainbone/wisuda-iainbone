'use server';

import { supabase } from '@/lib/supabase';
import { redis } from '@/lib/redis';
import { getAdminSession } from '@/actions/adminAuth';

export async function warmUpTogaCache() {
  const session = await getAdminSession();
  if (!session) return { success: false, error: 'Unauthorized' };

  try {
    const start = Date.now();
    const { data: activePeriode, error: periodeError } = await supabase
      .from('periode_wisuda')
      .select('nama_periode')
      .eq('status', 'Sedang Dibuka')
      .single();

    if (periodeError || !activePeriode) {
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

    const pipeline = redis.pipeline();
    for (const w of wisudawan) {
      pipeline.set(`scan:toga:${w.id_wisuda}`, JSON.stringify(w));
    }
    
    const meta = {
      cached_at: new Date().toISOString(),
      total: wisudawan.length,
      periode: activePeriode.nama_periode
    };
    pipeline.set('scan:meta:toga', JSON.stringify(meta));
    
    await pipeline.exec();

    return { success: true, total: wisudawan.length, durationMs: Date.now() - start };
  } catch (err: any) {
    console.error('Error in warmUpTogaCache:', err);
    return { success: false, error: err.message };
  }
}

export async function warmUpUndanganCache() {
  const session = await getAdminSession();
  if (!session) return { success: false, error: 'Unauthorized' };

  try {
    const start = Date.now();
    const { data: activePeriode, error: periodeError } = await supabase
      .from('periode_wisuda')
      .select('nama_periode')
      .eq('status', 'Sedang Dibuka')
      .single();

    if (periodeError || !activePeriode) {
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

    const pipeline = redis.pipeline();
    for (const w of wisudawan) {
      pipeline.set(`scan:undangan:${w.id_undangan}`, JSON.stringify(w));
    }
    
    const meta = {
      cached_at: new Date().toISOString(),
      total: wisudawan.length,
      periode: activePeriode.nama_periode
    };
    pipeline.set('scan:meta:undangan', JSON.stringify(meta));
    
    await pipeline.exec();

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

    const pipeline = redis.pipeline();
    for (const t of tamuList) {
      pipeline.set(`scan:tamu:${t.id}`, JSON.stringify(t));
    }
    
    const meta = {
      cached_at: new Date().toISOString(),
      total: tamuList.length
    };
    pipeline.set('scan:meta:tamu', JSON.stringify(meta));
    
    await pipeline.exec();

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
