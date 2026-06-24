import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Menggunakan Service Role Key jika tersedia (karena ini hanya dipakai di Server Actions/API)
// Ini memungkinkan kita mengaktifkan RLS di Supabase tanpa memblokir akses server.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Buat client Supabase tunggal
export const supabase = createClient(supabaseUrl, supabaseKey);
