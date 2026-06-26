/**
 * uploadCertBg.ts
 * ─────────────────────────────────────────────────────────────────
 * Helper client-side untuk upload aset sertifikat ke Supabase
 * Storage bucket "cert-assets":
 *   - backgrounds/  → latar belakang sertifikat
 *   - signatures/   → gambar tanda tangan (TTD)
 *   - stamps/       → gambar stempel
 * ─────────────────────────────────────────────────────────────────
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Gunakan client anon — bucket "cert-assets" dikonfigurasi public
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BUCKET = 'cert-assets';
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export interface CertBgUploadResult {
  publicUrl: string;
  path: string;
}

// ─── Generic upload helper ─────────────────────────────────────────────────────
async function uploadCertAsset(
  file: File,
  folder: string,
  prefix: string,
  maxMb: number,
  oldPath?: string | null
): Promise<CertBgUploadResult> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Format file tidak didukung. Gunakan PNG, JPG, atau WEBP.');
  }
  if (file.size > maxMb * 1024 * 1024) {
    throw new Error(`Ukuran file melebihi ${maxMb} MB.`);
  }

  const ext = file.name.split('.').pop() || 'png';
  const fileName = `${prefix}_${Date.now()}.${ext}`;
  const filePath = `${folder}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    throw new Error(`Upload gagal: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

  // Hapus file lama jika ada
  if (oldPath) {
    try {
      await supabase.storage.from(BUCKET).remove([oldPath]);
    } catch {
      console.warn('Gagal menghapus file lama:', oldPath);
    }
  }

  return { publicUrl: urlData.publicUrl, path: filePath };
}

// ─── Background sertifikat ────────────────────────────────────────────────────
/**
 * Upload gambar background sertifikat (A4 landscape, maks 5 MB).
 */
export async function uploadCertBackground(
  file: File,
  oldPath?: string | null
): Promise<CertBgUploadResult> {
  return uploadCertAsset(file, 'backgrounds', 'cert_bg', 5, oldPath);
}

// ─── Tanda Tangan (TTD) ───────────────────────────────────────────────────────
/**
 * Upload gambar tanda tangan pejabat (PNG transparan direkomendasikan, maks 2 MB).
 */
export async function uploadCertSignature(file: File, oldPath?: string | null) {
  return uploadCertAsset(file, 'signatures', 'ttd', 2, oldPath);
}

export async function uploadTamuBackground(file: File, oldPath?: string | null) {
  return uploadCertAsset(file, 'backgrounds', 'tamu_bg', 5, oldPath);
}

export async function uploadTamuSignature(file: File, oldPath?: string | null) {
  return uploadCertAsset(file, 'signatures', 'tamu_ttd', 2, oldPath);
}

export async function uploadSlideFrame(file: File, key: string, oldPath?: string | null) {
  return uploadCertAsset(file, 'slide-frames', `frame_${key}`, 5, oldPath);
}

export async function uploadContohFoto(file: File, oldPath?: string | null) {
  return uploadCertAsset(file, 'contoh-foto', 'contoh', 5, oldPath);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
/**
 * Ekstrak path storage dari public URL Supabase.
 * Berguna untuk mendapatkan path lama sebelum upload baru.
 */
export function extractSupabasePath(publicUrl: string): string | null {
  if (!publicUrl) return null;
  try {
    const url = new URL(publicUrl);
    // URL format: /storage/v1/object/public/cert-assets/<folder>/...
    const marker = `/object/public/${BUCKET}/`;
    const idx = url.pathname.indexOf(marker);
    if (idx === -1) return null;
    return url.pathname.substring(idx + marker.length);
  } catch {
    return null;
  }
}

/**
 * Hapus file dari Supabase Storage berdasarkan path.
 */
export async function deleteCertAsset(path: string): Promise<void> {
  try {
    await supabase.storage.from(BUCKET).remove([path]);
  } catch {
    console.warn('Gagal menghapus asset:', path);
  }
}
