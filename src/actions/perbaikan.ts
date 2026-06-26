'use server';

import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/actions/adminAuth";
import { redis } from "@/lib/redis";

export type PerbaikanStatus = 'proses' | 'diterima' | 'ditolak';

export type Perbaikan = {
  id: string;
  nim: string;
  detail_perbaikan: string;
  status: PerbaikanStatus;
  catatan_admin: string | null;
  created_at: string;
  updated_at: string;
  wisudawan?: {
    nama_mahasiswa: string;
    fakultas: string;
    prodi: string;
  };
};

/**
 * Ambil semua pengajuan perbaikan milik seorang wisudawan berdasarkan NIM.
 */
export async function getPerbaikanByNim(nim: string): Promise<Perbaikan[]> {
  const supabase = await createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('perbaikan_data')
    .select('*')
    .eq('nim', nim)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getPerbaikanByNim error:', error);
    return [];
  }
  return (data || []) as Perbaikan[];
}

/**
 * Buat pengajuan perbaikan baru.
 * Aturan: hanya boleh 1 pengajuan aktif (status='proses') per wisudawan.
 * Harus menunggu Diterima/Ditolak sebelum bisa mengajukan lagi.
 */
export async function createPerbaikan(
  nim: string,
  detail_perbaikan: string
): Promise<{ success: boolean; error?: string; data?: Perbaikan }> {
  try {
    const supabase = await createSupabaseAdminClient();

    // Cek apakah ada pengajuan aktif (status='proses')
    const { data: existing, error: checkError } = await supabase
      .from('perbaikan_data')
      .select('id, status')
      .eq('nim', nim)
      .eq('status', 'proses')
      .maybeSingle();

    if (checkError) {
      return { success: false, error: checkError.message };
    }

    if (existing) {
      return {
        success: false,
        error: 'Anda masih memiliki pengajuan perbaikan yang sedang diproses. Tunggu hingga pengajuan sebelumnya direspons oleh admin.',
      };
    }

    const { data, error } = await supabase
      .from('perbaikan_data')
      .insert({
        nim,
        detail_perbaikan: detail_perbaikan.trim(),
        status: 'proses',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/wisudawan/${nim}`);
    revalidatePath('/admin/perbaikan');

    return { success: true, data: data as Perbaikan };
  } catch (err: any) {
    return { success: false, error: err.message || 'Terjadi kesalahan.' };
  }
}

/**
 * (Admin) Ambil semua pengajuan perbaikan dari semua wisudawan.
 * Disertai data wisudawan (nama, fakultas, prodi).
 */
export async function getAllPerbaikan(
  statusFilter?: PerbaikanStatus | 'semua'
): Promise<Perbaikan[]> {
  const supabase = await createSupabaseAdminClient();
  const session = await getAdminSession();

  let query = supabase
    .from('perbaikan_data')
    .select(`
      *,
      wisudawan!inner (
        nama_mahasiswa,
        fakultas,
        prodi
      )
    `)
    .order('created_at', { ascending: false });

  if (statusFilter && statusFilter !== 'semua') {
    query = query.eq('status', statusFilter);
  }

  if (session?.role === 'admin_unit' && session?.unit_kerja) {
    query = query.eq('wisudawan.fakultas', session.unit_kerja);
  }

  const { data, error } = await query;

  if (error) {
    console.error('getAllPerbaikan error:', error);
    return [];
  }
  return (data || []) as Perbaikan[];
}

/**
 * (Admin) Update status pengajuan perbaikan + opsional catatan admin.
 */
export async function updateStatusPerbaikan(
  id: string,
  status: 'diterima' | 'ditolak',
  catatan_admin?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseAdminClient();

    const updatePayload: Record<string, any> = { status };
    if (catatan_admin !== undefined) {
      updatePayload.catatan_admin = catatan_admin.trim() || null;
    }

    // Ambil nim terlebih dahulu agar bisa invalidate cache wisudawan
    const { data: perbaikanData } = await supabase
      .from('perbaikan_data')
      .select('nim')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('perbaikan_data')
      .update(updatePayload)
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    // Invalidate cache wisudawan agar data terbaru tampil di profil
    if (perbaikanData?.nim) {
      try {
        await redis.del(`wisudawan:${perbaikanData.nim}`);
      } catch (err) {
        console.error('Redis del error (perbaikan):', err);
      }
      revalidatePath(`/wisudawan/${perbaikanData.nim}`);
      revalidatePath(`/admin/wisudawan/${perbaikanData.nim}`);
    }

    revalidatePath('/admin/perbaikan');
    revalidatePath('/admin'); // Revalidate admin layout for sidebar badge

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Terjadi kesalahan.' };
  }
}

/**
 * (Admin) Menghitung jumlah pengajuan perbaikan yang berstatus 'proses'.
 * Mempertimbangkan hak akses (jika admin_unit, hanya menghitung di fakultasnya).
 */
export async function getPendingPerbaikanCount(): Promise<number> {
  try {
    const supabase = await createSupabaseAdminClient();
    const session = await getAdminSession();

    if (!session) return 0;

    if (session.role === 'admin_unit' && session.unit_kerja) {
      const { data } = await supabase
        .from('perbaikan_data')
        .select('id, wisudawan!inner(fakultas)')
        .eq('status', 'proses')
        .eq('wisudawan.fakultas', session.unit_kerja);
      return data?.length || 0;
    }

    const { count } = await supabase
      .from('perbaikan_data')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'proses');

    return count || 0;
  } catch (err) {
    console.error('getPendingPerbaikanCount error:', err);
    return 0;
  }
}

