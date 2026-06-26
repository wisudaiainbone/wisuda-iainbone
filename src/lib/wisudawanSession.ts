/**
 * Wisudawan Session Utility
 *
 * Mengelola sesi wisudawan menggunakan JWT yang di-sign dengan NEXTAUTH_SECRET.
 * - Token disimpan sebagai httpOnly cookie oleh server action (loginWisudawan).
 * - Verifikasi dilakukan di middleware (Edge Runtime) menggunakan `jose`.
 * - Kompatibel dengan Edge Runtime Next.js — tidak ada Node.js-only API.
 */

import { SignJWT, jwtVerify } from 'jose';

const getSecret = () => {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('NEXTAUTH_SECRET tidak dikonfigurasi.');
  return new TextEncoder().encode(secret);
};

export const WISUDAWAN_COOKIE_NAME = 'wisudawan_token';

export interface WisudawanTokenPayload {
  nim: string;
  isDefaultPassword: boolean;
}

/**
 * Sign JWT token untuk sesi wisudawan.
 * Token expire dalam 24 jam.
 */
export async function signWisudawanToken(
  nim: string,
  isDefaultPassword: boolean
): Promise<string> {
  return new SignJWT({ nim, isDefaultPassword })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getSecret());
}

/**
 * Verifikasi dan decode JWT token wisudawan.
 * Mengembalikan payload jika valid, null jika tidak valid atau expired.
 */
export async function verifyWisudawanToken(
  token: string
): Promise<WisudawanTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.nim !== 'string') return null;
    return {
      nim: payload.nim,
      isDefaultPassword: payload.isDefaultPassword === true,
    };
  } catch {
    return null;
  }
}
