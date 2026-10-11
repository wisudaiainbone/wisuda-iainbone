'use server';

import { supabase } from '@/lib/supabase';
import { redis } from '@/lib/redis';
import { Ratelimit } from '@upstash/ratelimit';
import bcrypt from 'bcryptjs';

// Rate limiter: maks 3 permintaan OTP per 10 menit per NIM
const otpRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '10 m'),
  analytics: false,
});

const OTP_TTL = 10 * 60; // 10 menit (detik)
const OTP_PREFIX = 'otp:reset:';

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!domain) return email;
  const visible = user.length <= 3 ? user[0] : user.substring(0, 2);
  const masked = '*'.repeat(Math.min(user.length - visible.length, 5));
  return `${visible}${masked}@${domain}`;
}

// ─────────────────────────────────────────────
// STEP 1: Minta OTP — validasi NIM & kirim email
// ─────────────────────────────────────────────
export async function requestPasswordReset(nim: string): Promise<{
  success: boolean;
  maskedEmail?: string;
  error?: string;
}> {
  const trimmedNim = nim.trim();
  if (!trimmedNim) return { success: false, error: 'NIM tidak boleh kosong.' };

  // Rate limit
  const { success: allowed } = await otpRateLimit.limit(`otp_req:${trimmedNim}`);
  if (!allowed) {
    return {
      success: false,
      error: 'Terlalu banyak permintaan. Tunggu beberapa menit sebelum mencoba lagi.',
    };
  }

  // Cari wisudawan
  const { data: w, error: wErr } = await supabase
    .from('wisudawan')
    .select('nim, email, nama_mahasiswa')
    .eq('nim', trimmedNim)
    .single();

  if (wErr || !w) {
    return { success: false, error: 'NIM tidak ditemukan dalam sistem.' };
  }

  if (!w.email || !w.email.includes('@')) {
    return {
      success: false,
      error: 'Akun ini tidak memiliki email terdaftar. Hubungi Admin untuk bantuan.',
    };
  }

  // Buat OTP
  const otp = generateOtp();
  const key = `${OTP_PREFIX}${trimmedNim}`;

  // Simpan OTP di Redis dengan TTL 10 menit
  await redis.set(key, JSON.stringify({ otp, nim: trimmedNim, attempts: 0 }), { ex: OTP_TTL });

  // Kirim email
  const sendResult = await sendOtpEmail(w.email, w.nama_mahasiswa ?? 'Wisudawan', otp);
  if (!sendResult.success) {
    await redis.del(key);
    return { success: false, error: sendResult.error };
  }

  return { success: true, maskedEmail: maskEmail(w.email) };
}

// ─────────────────────────────────────────────
// STEP 2: Verifikasi OTP yang dimasukkan
// ─────────────────────────────────────────────
export async function verifyResetOtp(nim: string, inputOtp: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const trimmedNim = nim.trim();
  const key = `${OTP_PREFIX}${trimmedNim}`;

  const raw = await redis.get<string>(key);
  if (!raw) {
    return { success: false, error: 'Kode OTP sudah kadaluarsa atau tidak ditemukan. Minta ulang.' };
  }

  let stored: { otp: string; nim: string; attempts: number };
  try {
    stored = typeof raw === 'string' ? JSON.parse(raw) : raw as any;
  } catch {
    return { success: false, error: 'Data OTP tidak valid. Minta ulang.' };
  }

  // Cek batas percobaan (maks 5x)
  if (stored.attempts >= 5) {
    await redis.del(key);
    return { success: false, error: 'Terlalu banyak percobaan salah. Minta OTP baru.' };
  }

  if (inputOtp.trim() !== stored.otp) {
    // Tambah attempts
    stored.attempts += 1;
    const ttl = await redis.ttl(key);
    await redis.set(key, JSON.stringify(stored), { ex: ttl > 0 ? ttl : OTP_TTL });
    const sisa = 5 - stored.attempts;
    return {
      success: false,
      error: `Kode OTP salah. ${sisa} percobaan tersisa.`,
    };
  }

  // OTP benar — tandai verified dengan mengganti value
  const ttl = await redis.ttl(key);
  await redis.set(key, JSON.stringify({ ...stored, verified: true }), {
    ex: ttl > 0 ? ttl : 300,
  });

  return { success: true };
}

// ─────────────────────────────────────────────
// STEP 3: Reset password setelah OTP terverifikasi
// ─────────────────────────────────────────────
export async function resetPasswordWithOtp(nim: string, newPassword: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const trimmedNim = nim.trim();

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'Password minimal 6 karakter.' };
  }

  const key = `${OTP_PREFIX}${trimmedNim}`;
  const raw = await redis.get<string>(key);
  if (!raw) {
    return { success: false, error: 'Sesi reset sudah berakhir. Mulai ulang proses.' };
  }

  let stored: { otp: string; nim: string; verified?: boolean };
  try {
    stored = typeof raw === 'string' ? JSON.parse(raw) : raw as any;
  } catch {
    return { success: false, error: 'Sesi tidak valid. Mulai ulang proses.' };
  }

  if (!stored.verified) {
    return { success: false, error: 'OTP belum diverifikasi.' };
  }

  // Hash password baru
  const hashedPassword = bcrypt.hashSync(newPassword, 10);

  const { error } = await supabase
    .from('wisudawan')
    .update({ password: hashedPassword })
    .eq('nim', trimmedNim);

  if (error) {
    return { success: false, error: 'Gagal menyimpan password baru. Coba lagi.' };
  }

  // Hapus OTP dari Redis
  await redis.del(key);

  // Invalidate wisudawan cache
  try {
    await redis.del(`wisudawan:${trimmedNim}`);
  } catch {}

  return { success: true };
}

// ─────────────────────────────────────────────
// Helper: Kirim email via Google Apps Script (GAS)
// ─────────────────────────────────────────────
async function sendOtpEmail(
  to: string,
  nama: string,
  otp: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const gasUrl = process.env.NEXT_PUBLIC_GAS_WEBAPP_URL;
    if (!gasUrl) {
      return { success: false, error: 'NEXT_PUBLIC_GAS_WEBAPP_URL belum dikonfigurasi.' };
    }

    const payload = {
      action: 'send_otp_email',
      to,
      nama,
      otp
    };

    const res = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    
    if (json.status !== 'success') {
      console.error('[sendOtpEmail] GAS error:', json.message);
      return { success: false, error: 'Gagal mengirim email. Coba beberapa saat lagi.' };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[sendOtpEmail] Error:', err);
    return { success: false, error: 'Terjadi kesalahan saat menghubungi server email.' };
  }
}
