import { createServerClient } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';

/**
 * Supabase client khusus untuk Next.js Middleware.
 * Memperbarui session JWT (refresh token) otomatis sebelum setiap request diproses.
 * Mengembalikan supabaseClient dan response yang sudah diupdate headernya.
 */
export function createSupabaseMiddlewareClient(
  request: NextRequest,
  response: NextResponse
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Set cookie di request (agar server components bisa baca session baru)
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          // Set cookie di response (agar browser menyimpan session baru)
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );
}
