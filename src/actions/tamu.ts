"use server";

import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { getAdminSession } from "./adminAuth";
import { revalidatePath } from "next/cache";
import { tamuPayloadSchema } from "@/lib/validations";

export async function getTamuList() {
  const session = await getAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const supabaseAdmin = await createSupabaseAdminClient();
    let query = supabaseAdmin.from("tamu").select("*").order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createTamu(payload: { nama: string; jabatan: string; alamat: string; sesi: string }) {
  const session = await getAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const validation = tamuPayloadSchema.safeParse(payload);
  if (!validation.success) return { success: false, error: validation.error.issues[0].message };

  try {
    // Generate ID: Tamu_yyyyMMddHHmmss_[sesi]
    const now = new Date();
    const ts = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, "0") +
      now.getDate().toString().padStart(2, "0") +
      now.getHours().toString().padStart(2, "0") +
      now.getMinutes().toString().padStart(2, "0") +
      now.getSeconds().toString().padStart(2, "0");
      
    const sesiSlug = payload.sesi.replace(/\s+/g, "");
    const id = `Tamu_${ts}_${sesiSlug}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(id)}`;

    const supabaseAdmin = await createSupabaseAdminClient();
    const { error } = await supabaseAdmin.from("tamu").insert({
      id: id,
      nama: payload.nama,
      jabatan: payload.jabatan,
      alamat: payload.alamat,
      sesi: payload.sesi,
      qr_code: qrUrl
    });

    if (error) throw error;
    
    revalidatePath("/admin/(dashboard)/tamu");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateTamu(id: string, payload: { nama: string; jabatan: string; alamat: string; sesi: string }) {
  const session = await getAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const validation = tamuPayloadSchema.safeParse(payload);
  if (!validation.success) return { success: false, error: validation.error.issues[0].message };

  try {
    const supabaseAdmin = await createSupabaseAdminClient();
    const { error } = await supabaseAdmin.from("tamu").update({
      nama: payload.nama,
      jabatan: payload.jabatan,
      alamat: payload.alamat,
      sesi: payload.sesi
    }).eq("id", id);

    if (error) throw error;
    
    revalidatePath("/admin/(dashboard)/tamu");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteTamu(id: string) {
  const session = await getAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const supabaseAdmin = await createSupabaseAdminClient();
    const { error } = await supabaseAdmin.from("tamu").delete().eq("id", id);
    if (error) throw error;
    
    revalidatePath("/admin/(dashboard)/tamu");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function scanTamu(qrCode: string, targetSesi: string) {
  const session = await getAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    // We will do validation in Client Component using Redis cache if possible,
    // but here we just update the DB directly as fire-and-forget
    const now = new Date().toISOString();
    
    const supabaseAdmin = await createSupabaseAdminClient();
    const { error } = await supabaseAdmin
      .from('tamu')
      .update({ hadir: now })
      .eq('id', qrCode);

    if (error) throw error;
    return { success: true, waktu_hadir: now };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
