'use server';

import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { type AdminRole } from '@/lib/permissions';
import { getAdminSession } from '@/actions/adminAuth';

export type AdminUser = {
  id: string;
  nama_lengkap: string;
  email: string;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
  unit_kerja?: string | null;
};

/**
 * Mengambil semua daftar admin dari tabel admin_users.
 */
export async function getAdminUsers(): Promise<AdminUser[]> {
  const session = await getAdminSession();
  if (!session || session.role !== 'superadmin') return [];

  const supabase = await createSupabaseAdminClient();

  const { data, error } = await supabase
    .from('admin_users')
    .select('id, nama_lengkap, email, role, is_active, created_at, last_login, unit_kerja')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching admin users:', error);
    return [];
  }

  return (data as AdminUser[]) ?? [];
}

/**
 * Mengundang admin baru — membuat akun Supabase Auth lalu insert ke admin_users.
 * Hanya bisa dilakukan oleh superadmin.
 */
export async function inviteAdminUser(
  email: string,
  namaLengkap: string,
  role: AdminRole,
  unitKerja?: string
) {
  const session = await getAdminSession();
  if (!session || session.role !== 'superadmin') return { success: false, error: 'Unauthorized' };

  const supabaseAdmin = await createSupabaseAdminClient();

  const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10) + "A1!";

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: randomPassword,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return {
      success: false,
      error: authError?.message ?? 'Gagal membuat akun admin.',
    };
  }

  const { error: insertError } = await supabaseAdmin
    .from('admin_users')
    .insert({
      id: authData.user.id,
      email,
      nama_lengkap: namaLengkap,
      role,
      unit_kerja: unitKerja || null,
      is_active: true,
    });

  if (insertError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return {
      success: false,
      error: 'Gagal menyimpan data admin: ' + insertError.message,
    };
  }

  return { success: true, userId: authData.user.id };
}

/**
 * Mengaktifkan atau menonaktifkan admin.
 */
export async function toggleAdminStatus(adminId: string, isActive: boolean) {
  const session = await getAdminSession();
  if (!session || session.role !== 'superadmin') return { success: false, error: 'Unauthorized' };

  const supabase = await createSupabaseAdminClient();

  const { error } = await supabase
    .from('admin_users')
    .update({ is_active: isActive })
    .eq('id', adminId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Menghapus admin secara permanen.
 */
export async function deleteAdminUser(adminId: string) {
  const session = await getAdminSession();
  if (!session || session.role !== 'superadmin') return { success: false, error: 'Unauthorized' };

  const supabaseAdmin = await createSupabaseAdminClient();

  const { error } = await supabaseAdmin.auth.admin.deleteUser(adminId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Mengubah role admin.
 */
export async function updateAdminRole(adminId: string, role: AdminRole) {
  const session = await getAdminSession();
  if (!session || session.role !== 'superadmin') return { success: false, error: 'Unauthorized' };

  const supabase = await createSupabaseAdminClient();

  const { error } = await supabase
    .from('admin_users')
    .update({ role })
    .eq('id', adminId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Mengubah data profil admin (nama, role, unit_kerja).
 */
export async function editAdminUser(
  adminId: string,
  namaLengkap: string,
  role: AdminRole,
  unitKerja?: string
) {
  const session = await getAdminSession();
  if (!session || session.role !== 'superadmin') return { success: false, error: 'Unauthorized' };

  const supabase = await createSupabaseAdminClient();

  const { error } = await supabase
    .from('admin_users')
    .update({
      nama_lengkap: namaLengkap,
      role,
      unit_kerja: unitKerja || null,
    })
    .eq('id', adminId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
