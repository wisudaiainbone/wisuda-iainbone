'use server';

import { supabase } from '@/lib/supabase';

export interface ProdiItem {
  id: number;
  fakultas: string;
  prodi: string;
  singkatan: string;
  gelar: string;
  sesi: string | null;
  urutan: number;
}

/**
 * Ambil semua data prodi dari Supabase, diurutkan berdasarkan fakultas lalu prodi.
 */
export async function getProdiList(): Promise<ProdiItem[]> {
  const { data, error } = await supabase
    .from('prodi')
    .select('*')
    .order('urutan', { ascending: true })
    .order('fakultas', { ascending: true })
    .order('prodi', { ascending: true });

  if (error) {
    console.error('Error fetching prodi list:', error);
    return [];
  }

  return data as ProdiItem[];
}

export async function createProdi(data: Omit<ProdiItem, 'id'>) {
  try {
    const { createSupabaseAdminClient } = await import('@/lib/supabase-server');
    const supabaseAdmin = await createSupabaseAdminClient();
    
    const { error } = await supabaseAdmin
      .from('prodi')
      .insert(data);
      
    if (error) throw error;
    
    const { revalidatePath } = await import('next/cache');
    revalidatePath('/admin/fakultas');
    revalidatePath('/admin/wisudawan');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Terjadi kesalahan saat menambah prodi' };
  }
}

export async function updateProdi(id: number, data: Omit<ProdiItem, 'id'>) {
  try {
    const { createSupabaseAdminClient } = await import('@/lib/supabase-server');
    const supabaseAdmin = await createSupabaseAdminClient();
    
    const { error } = await supabaseAdmin
      .from('prodi')
      .update(data)
      .eq('id', id);
      
    if (error) throw error;
    
    const { revalidatePath } = await import('next/cache');
    revalidatePath('/admin/fakultas');
    revalidatePath('/admin/wisudawan');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Terjadi kesalahan saat mengupdate prodi' };
  }
}

export async function deleteProdi(id: number) {
  try {
    const { createSupabaseAdminClient } = await import('@/lib/supabase-server');
    const supabaseAdmin = await createSupabaseAdminClient();
    
    const { error } = await supabaseAdmin
      .from('prodi')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    const { revalidatePath } = await import('next/cache');
    revalidatePath('/admin/fakultas');
    revalidatePath('/admin/wisudawan');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Terjadi kesalahan saat menghapus prodi' };
  }
}

export async function updateProdiOrder(orderedIds: number[]) {
  try {
    const { createSupabaseAdminClient } = await import('@/lib/supabase-server');
    const supabaseAdmin = await createSupabaseAdminClient();
    
    // Update urutan secara paralel, dimulai dari 1
    await Promise.all(
      orderedIds.map(async (id, index) => {
        await supabaseAdmin
          .from('prodi')
          .update({ urutan: index + 1 })
          .eq('id', id);
      })
    );
    
    const { revalidatePath } = await import('next/cache');
    revalidatePath('/admin/fakultas');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating prodi order:', error);
    return { success: false, error: error.message };
  }
}
