import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Supabase client untuk Server Components & Server Actions.
 * Membaca dan menulis cookie session secara aman di sisi server.
 * JANGAN gunakan di Client Components — gunakan `supabase.ts` untuk itu.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll dipanggil dari Server Component — bisa diabaikan jika
            // ada middleware yang menangani refresh session.
          }
        },
      },
    }
  );
}

/**
 * Supabase client dengan Service Role Key untuk operasi admin
 * (bypass RLS). HANYA gunakan di server-side, JANGAN expose ke client!
 */
export async function createSupabaseAdminClient() {
  // Gunakan createClient standar tanpa cookie session, agar tidak terjadi downgrade
  // token menjadi 'authenticated' JWT yang bisa terkena blokir RLS.
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
