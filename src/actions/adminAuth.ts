'use server';

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { type AdminRole } from '@/lib/permissions';

/**
 * Mendapatkan data admin yang sedang login (untuk server components).
 * Mengembalikan null jika tidak ada session NextAuth yang valid.
 */
export async function getAdminSession() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) return null;

  return {
    id: (session.user as any).id,
    email: session.user.email!,
    nama: session.user.name || "Admin",
    role: (session.user as any).role as AdminRole,
    unit_kerja: (session.user as any).unit_kerja as string | null,
  };
}
