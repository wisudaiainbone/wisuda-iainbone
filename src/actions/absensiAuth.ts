"use server";

import { cookies } from "next/headers";
import { getSetting } from "@/actions/settings";

export async function verifyAbsensiPassword(password: string) {
  try {
    // 1. Cek apakah fitur login absensi diizinkan
    const allowAbsensiLogin = await getSetting('allow_absensi_login', 'true', true);
    if (allowAbsensiLogin !== 'true') {
      return { success: false, error: 'Akses Panitia Absensi saat ini ditutup oleh Administrator.' };
    }

    // 2. Cek password
    const defaultPassword = await getSetting('default_password', 'wisuda2026', true);
    if (password !== defaultPassword) {
      return { success: false, error: 'Password salah!' };
    }

    // 3. Set cookie absensi_token berlaku 12 jam
    const token = Buffer.from(`absensi_ok_${Date.now()}`).toString('base64');
    const cookieStore = await cookies();
    cookieStore.set('absensi_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 12 * 60 * 60, // 12 jam
      path: '/',
    });

    return { success: true };
  } catch (err: any) {
    console.error("Error verifyAbsensiPassword:", err);
    return { success: false, error: 'Terjadi kesalahan sistem.' };
  }
}

export async function logoutAbsensi() {
  const cookieStore = await cookies();
  cookieStore.delete('absensi_token');
  return { success: true };
}
