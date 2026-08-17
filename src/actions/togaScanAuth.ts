"use server";

import { cookies } from "next/headers";
import { getSetting } from "@/actions/settings";

export async function verifyTogaScanPassword(password: string) {
  try {
    // 1. Cek apakah fitur login scan toga diizinkan
    const allowTogaScanLogin = await getSetting('allow_toga_scan_login', 'true', true);
    if (allowTogaScanLogin !== 'true') {
      return { success: false, error: 'Akses Scan Toga saat ini ditutup oleh Administrator.' };
    }

    // 2. Cek password (menggunakan password default yang sama)
    const defaultPassword = await getSetting('default_password', 'wisuda2026', true);
    if (password !== defaultPassword) {
      return { success: false, error: 'Password salah!' };
    }

    // 3. Set cookie toga_scan_token berlaku 12 jam
    const token = Buffer.from(`toga_scan_ok_${Date.now()}`).toString('base64');
    const cookieStore = await cookies();
    cookieStore.set('toga_scan_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 12 * 60 * 60, // 12 jam
      path: '/',
    });

    return { success: true };
  } catch (err: any) {
    console.error("Error verifyTogaScanPassword:", err);
    return { success: false, error: 'Terjadi kesalahan sistem.' };
  }
}

export async function logoutTogaScan() {
  const cookieStore = await cookies();
  cookieStore.delete('toga_scan_token');
  return { success: true };
}
