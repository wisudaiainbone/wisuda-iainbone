"use server";

import { supabase } from "@/lib/supabase";

export async function getRecentScans(type: 'undangan' | 'toga' | 'tamu') {
  try {
    if (type === 'undangan') {
      const { data, error } = await supabase
        .from('wisudawan')
        .select('nim, nama_mahasiswa, fakultas, prodi_singkat, waktu_hadir')
        .not('waktu_hadir', 'is', null)
        .order('waktu_hadir', { ascending: false })
        .limit(20);

      if (error) throw error;
      return { success: true, data };
    } else if (type === 'toga') {
      const { data, error } = await supabase
        .from('wisudawan')
        .select('nim, nama_mahasiswa, fakultas, prodi_singkat, waktu_toga')
        .not('waktu_toga', 'is', null)
        .order('waktu_toga', { ascending: false })
        .limit(20);

      if (error) throw error;
      return { success: true, data };
    } else {
      const { data, error } = await supabase
        .from('tamu')
        .select('id, nama, jabatan, alamat, sesi, hadir')
        .not('hadir', 'is', null)
        .order('hadir', { ascending: false })
        .limit(20);

      if (error) throw error;
      return { success: true, data };
    }
  } catch (err: any) {
    console.error("Error getRecentScans:", err.message);
    return { success: false, error: err.message };
  }
}

/** Mengambil SEMUA data kehadiran (tanpa limit) untuk keperluan export */
export async function getAllKehadiranScans() {
  try {
    const { data, error } = await supabase
      .from('wisudawan')
      .select('nim, nama_mahasiswa, fakultas, prodi, prodi_singkat, sesi, waktu_hadir')
      .not('waktu_hadir', 'is', null)
      .order('waktu_hadir', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error("Error getAllKehadiranScans:", err.message);
    return { success: false, error: err.message };
  }
}

/** Mengambil SEMUA data toga (tanpa limit) untuk keperluan export */
export async function getAllTogaScans() {
  try {
    const { data, error } = await supabase
      .from('wisudawan')
      .select('nim, nama_mahasiswa, fakultas, prodi, toga, waktu_toga')
      .not('waktu_toga', 'is', null)
      .order('waktu_toga', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error("Error getAllTogaScans:", err.message);
    return { success: false, error: err.message };
  }
}

/** Mengambil SEMUA data tamu untuk keperluan export */
export async function getAllTamuScans(periode?: string) {
  try {
    let query = supabase
      .from('tamu')
      .select('id, nama, jabatan, alamat, sesi, hadir')
      .order('nama', { ascending: true });
      
    if (periode) {
      query = query.eq('periode', periode);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error("Error getAllTamuScans:", err.message);
    return { success: false, error: err.message };
  }
}
