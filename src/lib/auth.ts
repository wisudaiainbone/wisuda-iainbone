import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createSupabaseAdminClient } from "@/lib/supabase-server";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 hari
  },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) {
        return false;
      }

      try {
        const supabase = await createSupabaseAdminClient();
        
        // Cek apakah email terdaftar di tabel admin_users
        const { data: adminUser, error } = await supabase
          .from("admin_users")
          .select("is_active, role, unit_kerja, nama_lengkap")
          .eq("email", user.email)
          .single();

        if (error || !adminUser) {
          // Tidak ada akses jika email tidak ditemukan
          console.warn(`Akses ditolak untuk email: ${user.email}`);
          return "/admin/login?error=unauthorized";
        }

        if (!adminUser.is_active) {
          console.warn(`Akun dinonaktifkan untuk email: ${user.email}`);
          return "/admin/login?error=unauthorized";
        }

        if (adminUser.role === 'admin_absensi') {
          console.warn(`Akses login NextAuth ditolak untuk admin_absensi: ${user.email}`);
          return "/admin/login?error=unauthorized";
        }

        // Update last_login
        await supabase
          .from("admin_users")
          .update({ last_login: new Date().toISOString() })
          .eq("email", user.email);

        return true;
      } catch (err) {
        console.error("Kesalahan saat validasi signIn NextAuth:", err);
        return false;
      }
    },
    async jwt({ token, user }) {
      // Saat login pertama kali, ambil data dari Supabase untuk dimasukkan ke JWT
      if (user && user.email) {
        const supabase = await createSupabaseAdminClient();
        const { data: adminUser } = await supabase
          .from("admin_users")
          .select("id, role, unit_kerja, nama_lengkap")
          .eq("email", user.email)
          .single();

        if (adminUser) {
          token.id = adminUser.id;
          token.role = adminUser.role;
          token.unit_kerja = adminUser.unit_kerja;
          token.name = adminUser.nama_lengkap || user.name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).unit_kerja = token.unit_kerja;
        // Kita juga bisa override name kalau mau
        if (token.name) {
          session.user.name = token.name as string;
        }
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
