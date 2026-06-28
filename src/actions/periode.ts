'use server';

import { supabase } from "@/lib/supabase";
import { getAllWisudawan } from "./wisudawan";
import { redis } from '@/lib/redis';
import { revalidatePath } from 'next/cache';
import { getFakultasData } from '@/lib/fakultas';

const CACHE_KEY = 'active_periode_pengaturan';
const CACHE_TTL = 3600; // 1 hour

export async function getActivePeriode() {
  const { data, error } = await supabase
    .from('periode_wisuda')
    .select('*')
    .eq('status', 'Sedang Dibuka')
    .single();

  if (error || !data) {
    return null;
  }

    // Hitung pendaftar khusus periode ini langsung dari DB
    const { count: pendaftar } = await supabase
      .from('wisudawan')
      .select('nim', { count: 'exact', head: true })
      .eq('periode', data.nama_periode)
      .in('status', ['Terdaftar', 'Proses', 'Selesai']);
    const totalPendaftar = pendaftar ?? 0;
    const sisaKuota = Math.max(0, data.kuota - totalPendaftar);
  
    // Format ke bentuk yang dibutuhkan frontend
    const result = {
      id: data.id,
      nama_periode: data.nama_periode,
      status: data.status,
      kuota: data.kuota,
      tanggal_pendaftaran: data.tanggal_pendaftaran,
      tanggal_pelaksanaan: data.tanggal_pelaksanaan,
      tempat_pelaksanaan: data.tempat_pelaksanaan,
      waktu_sesi_1: data.waktu_sesi_1,
      waktu_sesi_2: data.waktu_sesi_2,
      jadwal_gladi: data.jadwal_gladi,
      pengumuman: data.pengumuman,
      hint_pendaftaran: data.hint_pendaftaran,
      wagLink: data.waglink,
      themeImage: data.theme,
      statusColor: data.status_color,
      tempat_pengambilan_toga: data.tempat_pengambilan_toga,
      waktu_pengambilan_toga: data.waktu_pengambilan_toga,
      link_pengumuman: data.link_pengumuman,
      stats: [
        { bg: "bg-emerald-800/20", icon: "Users", color: "text-emerald-700", label: "Kuota Total", value: data.kuota.toString() },
        { bg: "bg-blue-500/20", icon: "UserCheck", color: "text-blue-400", label: "Pendaftar", value: totalPendaftar.toString() },
        { bg: "bg-amber-500/20", icon: "UserMinus", color: "text-amber-400", label: "Sisa Kuota", value: sisaKuota.toString() }
      ]
    };
  
    return result;
  }
  
  export async function updateTogaPeriodeSettings(id: string, updates: { tempat_pengambilan_toga: string, waktu_pengambilan_toga: any }) {
    try {
      const { error } = await supabase
        .from('periode_wisuda')
        .update({
          tempat_pengambilan_toga: updates.tempat_pengambilan_toga,
          waktu_pengambilan_toga: updates.waktu_pengambilan_toga
        })
        .eq('id', id);
  
      if (error) throw error;
  
      await redis.del(CACHE_KEY);
      revalidatePath('/admin/toga');
      revalidatePath('/');
      
      return { success: true };
    } catch (error: any) {
      console.error('Error updating toga settings:', error);
      return { success: false, error: error.message };
    }
  }

  export async function getAllPeriode() {
  const { data, error } = await supabase
    .from('periode_wisuda')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all periode:', error);
    return [];
  }
  
  const wisudawanList = await getAllWisudawan();

  // Transform data
  const result = data.map(p => {
    // Hitung pendaftar untuk periode spesifik ini
    const pendaftarAktifList = wisudawanList.filter(w =>
      w.periode === p.nama_periode &&
      ['Terdaftar', 'Proses', 'Selesai'].includes(w.status)
    );
    const pendaftarAktif = pendaftarAktifList.length;

    const fakultasBreakdownMap: Record<string, number> = {};
    pendaftarAktifList.forEach(w => {
      const fak = w.fakultas || 'Lainnya';
      fakultasBreakdownMap[fak] = (fakultasBreakdownMap[fak] || 0) + 1;
    });

    const pendaftarDetails = Object.entries(fakultasBreakdownMap).map(([fak, count]) => {
      const { singkatan } = getFakultasData(fak);
      return { label: singkatan, value: `${count} Pendaftar` };
    });

    const sisaKuota = Math.max(0, p.kuota - pendaftarAktif);

    return {
      ...p,
      pendaftarAktif,
      stats: [
        { bg: "bg-emerald-800/20", icon: "Users", color: "text-emerald-700", label: "Kuota Total", value: p.kuota.toString() },
        { bg: "bg-blue-500/20", icon: "UserCheck", color: "text-blue-400", label: "Pendaftar", value: pendaftarAktif.toString(), details: pendaftarDetails },
        { bg: "bg-amber-500/20", icon: "UserMinus", color: "text-amber-400", label: "Sisa Kuota", value: sisaKuota.toString() }
      ],
      hint_pendaftaran: p.hint_pendaftaran,
      wagLink: p.waglink,
      themeImage: p.theme,
      statusColor: p.status_color,
      link_pengumuman: p.link_pengumuman
    };
  });

  // Urutkan agar periode aktif berada paling atas
  result.sort((a, b) => {
    if (a.status === 'Sedang Dibuka' && b.status !== 'Sedang Dibuka') return -1;
    if (a.status !== 'Sedang Dibuka' && b.status === 'Sedang Dibuka') return 1;
    return 0;
  });

  return result;
}

export async function createPeriode(data: any) {
  try {
    const { 
      id: _id, nama_periode, status, kuota, 
      tanggal_pendaftaran, tanggal_pelaksanaan, tempat_pelaksanaan, 
      waktu_sesi_1, waktu_sesi_2, jadwal_gladi, pengumuman, hint_pendaftaran,
      ...data_pengaturan 
    } = data;

    const year = new Date().getFullYear();
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomPart = '';
    for (let i = 0; i < 6; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const customId = `${year}-${randomPart}`;

      const { data: inserted, error } = await supabase
        .from('periode_wisuda')
        .insert({
          id: customId,
          nama_periode: nama_periode || data.title || 'Periode Baru',
          status: status || 'Sedang Dibuka',
          kuota: parseInt(kuota) || 0,
          tanggal_pendaftaran,
          tanggal_pelaksanaan: tanggal_pelaksanaan || data.date,
          tempat_pelaksanaan: tempat_pelaksanaan || data.location,
          waktu_sesi_1: waktu_sesi_1 || data.session1,
          waktu_sesi_2: waktu_sesi_2 || data.session2,
          jadwal_gladi: jadwal_gladi || data.gladi,
          pengumuman: pengumuman || data.pengumuman,
          hint_pendaftaran: hint_pendaftaran || data.hint_pendaftaran,
          waglink: data.waglink || data.wagLink,
          theme: data.theme || data.themeImage,
          status_color: data.status_color || data.statusColor,
          link_pengumuman: data.link_pengumuman
        })
        .select('id')
        .single();

    if (error) throw error;

    // Bersihkan cache
    await redis.del(CACHE_KEY);
    revalidatePath('/');
    revalidatePath('/admin/periode');

    return { success: true, id: inserted.id };
  } catch (error: any) {
    console.error('Error creating periode:', error);
    return { success: false, error: error.message };
  }
}

export async function updatePeriodePengaturan(id: string, updates: any) {
  try {
    // Ekstrak properti JSON agar tidak masuk ke kolom root
    const { 
      id: _id, nama_periode, status, kuota, 
      tanggal_pendaftaran, tanggal_pelaksanaan, tempat_pelaksanaan, 
      waktu_sesi_1, waktu_sesi_2, jadwal_gladi, pengumuman, hint_pendaftaran,
      ...data_pengaturan 
    } = updates;

    const { error } = await supabase
      .from('periode_wisuda')
      .update({ 
        nama_periode: nama_periode || updates.title, 
        status,
        kuota: parseInt(kuota) || 0,
        tanggal_pendaftaran,
        tanggal_pelaksanaan: tanggal_pelaksanaan || updates.date,
        tempat_pelaksanaan: tempat_pelaksanaan || updates.location,
        waktu_sesi_1: waktu_sesi_1 || updates.session1,
        waktu_sesi_2: waktu_sesi_2 || updates.session2,
        jadwal_gladi: jadwal_gladi || updates.gladi,
        pengumuman: pengumuman || updates.pengumuman,
        hint_pendaftaran: hint_pendaftaran || updates.hint_pendaftaran,
        waglink: updates.waglink || updates.wagLink,
        theme: updates.theme || updates.themeImage,
        status_color: updates.status_color || updates.statusColor,
        link_pengumuman: updates.link_pengumuman
      })
      .eq('id', id);

    if (error) throw error;

    // Bersihkan cache jika ini adalah periode yang sedang dibuka
    if (status === 'Sedang Dibuka') {
      await redis.del(CACHE_KEY);
    }
    
    revalidatePath('/');
    revalidatePath('/admin/pengaturan');
    revalidatePath('/admin/periode');

    return { success: true };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: error.message };
  }
}

export async function deletePeriode(id: string) {
  try {
    const { error } = await supabase
      .from('periode_wisuda')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await redis.del(CACHE_KEY);
    revalidatePath('/');
    revalidatePath('/admin/periode');
    revalidatePath('/admin/informasi');

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting periode:', error);
    return { success: false, error: error.message };
  }
}
