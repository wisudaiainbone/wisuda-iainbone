import { z } from "zod";
import { AdminRole } from "./permissions";

// Schemas untuk wisudawan
export const updateWisudawanSchema = z.object({
  nim: z.string().min(1, "NIM wajib diisi"),
  updates: z.record(z.any()).refine(data => Object.keys(data).length > 0, "Payload update tidak boleh kosong")
});

export const loginWisudawanSchema = z.object({
  nim: z.string().min(1, "NIM wajib diisi"),
  passwordInput: z.string().min(1, "Password wajib diisi")
});

export const daftarWisudaSchema = z.object({
  nim: z.string().min(1, "NIM wajib diisi"),
  newPassword: z.string().min(6, "Password minimal 6 karakter")
});

export const setupAkunSchema = z.object({
  nim: z.string().min(1, "NIM wajib diisi"),
  email: z.string().email("Format email tidak valid"),
  toga: z.string().min(1, "Ukuran Toga wajib diisi"),
  newPassword: z.string().min(6, "Password minimal 6 karakter")
});

export const changePasswordSchema = z.object({
  nim: z.string().min(1, "NIM wajib diisi"),
  newPassword: z.string().min(6, "Password minimal 6 karakter")
});

// Schemas untuk admin operations
export const roleFilterSchema = z.object({
  role: z.enum(["superadmin", "admin_institut", "admin_unit", "admin_absensi"]).optional(),
  unitKerja: z.string().nullable().optional()
});

// Schema Tamu
export const tamuPayloadSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi"),
  jabatan: z.string().min(1, "Jabatan wajib diisi"),
  alamat: z.string().min(1, "Alamat wajib diisi"),
  sesi: z.string().min(1, "Sesi wajib diisi")
});
