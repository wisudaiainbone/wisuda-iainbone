/**
 * uploadFoto.ts
 * ─────────────────────────────────────────────────────────────────
 * Helper client-side untuk upload foto profil wisudawan ke Google
 * Drive via GAS Web App.
 *
 * Alur:
 *  1. Convert File/Blob → Base64 string
 *  2. POST ke GAS dengan action "upload_foto"
 *  3. GAS menghapus foto lama (jika old_file_id disertakan)
 *  4. GAS membuat/menemukan subfolder "Foto_[Periode]" lalu upload
 *  5. Return { fileId, fileUrl } untuk disimpan ke Supabase
 *
 * Nama file : FOTO_[timestamp]_[KODE_FAKULTAS]_[NIM].jpg
 * Contoh    : FOTO_1749820803456_FEBI_612062020120.jpg
 * Subfolder : Foto_[Nama Periode]  (dari tabel periode_wisuda status='Sedang Dibuka')
 * ─────────────────────────────────────────────────────────────────
 */

export interface UploadFotoResult {
  fileId: string;
  /** URL langsung untuk <img src="..."> — format: https://drive.google.com/uc?export=view&id=FILE_ID */
  fileUrl: string;
  /** URL Google Drive untuk dibuka di browser */
  viewUrl: string;
}

/** Metadata wisudawan untuk penentuan subfolder & kode dalam nama file */
export interface FotoUploadMeta {
  /** Nama lengkap fakultas (akan di-map ke kode singkat di GAS) */
  fakultas: string;
  /** Nama periode aktif dari tabel periode_wisuda (status='Sedang Dibuka') */
  periode: string;
}

/**
 * Ekstrak fileId dari URL Google Drive yang sudah tersimpan.
 * Format URL yang didukung:
 *   - https://drive.google.com/uc?export=view&id=FILE_ID
 *   - https://drive.google.com/uc?id=FILE_ID
 *   - https://drive.google.com/file/d/FILE_ID/view
 */
export function extractGDriveFileId(url: string): string | null {
  if (!url) return null;

  try {
    const idParam = new URL(url).searchParams.get("id");
    if (idParam) return idParam;
  } catch {
    // bukan URL valid, lanjut ke regex
  }

  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];

  return null;
}

/**
 * Mengubah URL Google Drive biasa menjadi URL lh3.googleusercontent.com
 * yang jauh lebih stabil untuk di-embed ke dalam <img src="...">
 * dan menghindari error 403 Forbidden / Redirect dari Google Drive.
 */
export function getOptimizedGDriveUrl(url: string | null | undefined): string {
  if (!url) return "";
  
  if (url.includes("drive.google.com")) {
    const fileId = extractGDriveFileId(url);
    if (fileId) {
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
  }
  return url;
}

/**
 * Convert File atau Blob ke Base64 string (tanpa prefix data URL).
 */
export function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Hapus prefix "data:image/jpeg;base64," → hanya data Base64
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Gagal membaca file."));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload file umum (seperti PDF) ke Google Drive via GAS Web App.
 */
export async function uploadGeneralFileToGDrive(
  file: File | Blob,
  namaFile: string,
  mimeType: string,
  oldFileUrl?: string | null
): Promise<{ fileId: string; fileUrl: string }> {
  const gasUrl = process.env.NEXT_PUBLIC_GAS_WEBAPP_URL;
  if (!gasUrl) throw new Error("Konfigurasi GAS Web App URL tidak ditemukan.");

  // Hapus file lama jika ada
  if (oldFileUrl) {
    const oldFileId = extractGDriveFileId(oldFileUrl);
    if (oldFileId) await deleteFotoFromGDrive(oldFileId);
  }

  const base64Data = await fileToBase64(file);

  const payload = {
    action: "upload",
    base64_data: base64Data,
    nama_file: namaFile,
    mime_type: mimeType
  };

  const response = await fetch(gasUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error(`Upload gagal: HTTP ${response.status}`);
  const result = await response.json();
  if (result.status !== "success") throw new Error(result.message || "Upload gagal");

  return {
    fileId: result.fileId,
    fileUrl: result.fileUrl
  };
}

/**
 * Upload foto profil wisudawan ke Google Drive via GAS Web App.
 *
 * @param file       - File/Blob hasil crop foto
 * @param nim        - NIM wisudawan
 * @param meta       - Metadata untuk subfolder & kode fakultas dalam nama file
 * @param oldFotoUrl - URL foto lama (jika ada) untuk dihapus dari Drive
 * @returns          - { fileId, fileUrl, viewUrl }
 * @throws           - Error jika GAS gagal atau network error
 */
export async function uploadFotoToGDrive(
  file: File | Blob,
  nim: string,
  meta: FotoUploadMeta,
  oldFotoUrl?: string | null
): Promise<UploadFotoResult> {
  const gasUrl = process.env.NEXT_PUBLIC_GAS_WEBAPP_URL;
  if (!gasUrl) {
    throw new Error("Konfigurasi GAS Web App URL tidak ditemukan.");
  }

  // Ekstrak fileId foto lama agar GAS bisa hapus file lama
  const oldFileId = oldFotoUrl ? extractGDriveFileId(oldFotoUrl) : null;

  // Convert file ke Base64
  const base64Data = await fileToBase64(file);

  const payload = {
    action: "upload_foto",
    base64_data: base64Data,
    nim,
    fakultas: meta.fakultas,
    periode: meta.periode,
    ...(oldFileId ? { old_file_id: oldFileId } : {}),
  };

  const response = await fetch(gasUrl, {
    method: "POST",
    // ⚠️ PENTING: GAS tidak merespons preflight CORS untuk "application/json".
    // Gunakan "text/plain" agar request dianggap "simple request" oleh browser
    // (tidak ada preflight OPTIONS). Body tetap JSON string — GAS baca via e.postData.contents.
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Upload gagal: HTTP ${response.status}`);
  }

  const result = await response.json();

  if (result.status !== "success") {
    throw new Error(result.message || "Upload foto gagal di sisi GAS.");
  }

  return {
    fileId: result.fileId,
    fileUrl: result.fileUrl,
    viewUrl: result.viewUrl,
  };
}

/**
 * Menghapus foto dari Google Drive via GAS Web App.
 *
 * @param fileId - ID file foto di Google Drive
 * @returns - { success: boolean, message?: string }
 */
export async function deleteFotoFromGDrive(fileId: string): Promise<{ success: boolean; message?: string }> {
  const gasUrl = process.env.NEXT_PUBLIC_GAS_WEBAPP_URL;
  if (!gasUrl) {
    throw new Error("Konfigurasi GAS Web App URL tidak ditemukan.");
  }

  const payload = {
    action: "delete_file",
    file_id: fileId,
  };

  try {
    const response = await fetch(gasUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return { success: false, message: `Gagal HTTP ${response.status}` };
    }

    const result = await response.json();
    return { success: result.status === "success", message: result.message };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
