'use server';

import { createSupabaseAdminClient } from '@/lib/supabase-server';

/**
 * Cek apakah sudah ada admin yang terdaftar di sistem.
 * Digunakan halaman setup untuk memutuskan apakah form setup perlu ditampilkan.
 */
export async function cekAdminSudahAda(): Promise<boolean> {
  try {
    const supabase = await createSupabaseAdminClient();
    const { count } = await supabase
      .from('admin_users')
      .select('*', { count: 'exact', head: true });
    return (count ?? 0) > 0;
  } catch {
    return false;
  }
}

/**
 * Membuat superadmin pertama.
 * Hanya berjalan jika belum ada admin sama sekali di tabel admin_users.
 */
export async function buatAdminPertama(
  email: string,
  namaLengkap: string
): Promise<{ success: boolean; error?: string }> {
  // Keamanan: pastikan belum ada admin sebelum membuat yang pertama
  const sudahAda = await cekAdminSudahAda();
  if (sudahAda) {
    return {
      success: false,
      error: 'Admin sudah ada. Gunakan halaman login untuk masuk.',
    };
  }

  try {
    const supabase = await createSupabaseAdminClient();
    
    // Generate random password karena admin akan login menggunakan NextAuth Google
    const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10) + "A1!";

    // Buat user di Supabase Auth (diperlukan karena foreign key admin_users.id references auth.users(id))
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: randomPassword,
      email_confirm: true, // Langsung aktif tanpa verifikasi email
    });

    if (authError || !authData.user) {
      return {
        success: false,
        error: authError?.message ?? 'Gagal membuat referensi akun di database.',
      };
    }

    // Simpan ke tabel admin_users sebagai superadmin
    const { error: insertError } = await supabase
      .from('admin_users')
      .insert({
        id: authData.user.id,
        email,
        nama_lengkap: namaLengkap,
        role: 'superadmin',
        is_active: true,
      });

    if (insertError) {
      // Rollback: hapus user dari Auth jika insert gagal
      await supabase.auth.admin.deleteUser(authData.user.id);
      return {
        success: false,
        error: 'Gagal menyimpan ke database: ' + insertError.message,
      };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: 'Terjadi kesalahan sistem: ' + String(err),
    };
  }
}
