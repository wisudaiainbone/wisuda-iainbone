# Wisuda IAIN Bone — Web Application

Membangun aplikasi web modern untuk acara wisuda **Institut Agama Islam Negeri (IAIN) Bone** menggunakan **Next.js 16 (App Router)** dan **Tailwind CSS v4**.

---

## 🎨 Design System

### Color Palette (Emerald & Slate)
| Token | Deskripsi |
|-------|-----------|
| `primary` | Emerald gelap untuk branding dan elemen teks tegas di light mode. |
| `accent` | Emerald cerah untuk *call-to-actions* (CTA), ikon, dan aksen nyala (glow). |
| `bg` | *Slate/Navy* super gelap untuk Dark Mode, Mint keputihan cerah (`#f0fdf4`) untuk Light Mode. |
| `surface` | Card background dengan efek glassmorphism transparan. |

### Typography
- **Display/Heading**: **Outfit** (modern, geometris)
- **Body**: **Inter** (sans-serif, tingkat keterbacaan tinggi)

---

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4 (Inline `@theme` vars di `globals.css`)
- **Animasi**: Framer Motion
- **Icons**: Lucide React
- **Auth Admin**: NextAuth.js (Google Provider + JWT Session)
- **Database**: Supabase (PostgreSQL)

---

## 📂 Struktur File Inti

```
src/
├── app/
│   ├── layout.tsx                # Konfigurasi font (Inter, Outfit) & Provider
│   ├── page.tsx                  # Root landing page
│   ├── globals.css               # Design tokens (var CSS kustom) & Tailwind v4
│   ├── auth/
│   │   └── page.tsx              # Login Wisudawan (NIM + Password) + Cek Status NIM
│   ├── admin/
│   │   ├── login/page.tsx        # Login Admin (email + password)
│   │   └── (dashboard)/
│   │       ├── layout.tsx        # Sidebar & header dashboard admin
│   │       ├── page.tsx          # Beranda dashboard
│   │       ├── pengaturan/       # Kelola periode wisuda + password default sistem
│   │       ├── wisudawan/        # Kelola data wisudawan (cari, filter, import)
│   │       └── manajemen-admin/  # Kelola daftar admin (superadmin only)
│   └── wisudawan/
│       └── [nim]/
│           ├── page.tsx          # Server page (fetch data)
│           └── ClientProfile.tsx # Halaman profil dinamis wisudawan (client)
├── actions/
│   ├── adminAuth.ts              # getAdminSession (NextAuth)
│   ├── adminUsers.ts             # CRUD daftar admin (invite, toggle, delete)
│   ├── periode.ts                # Pengaturan periode wisuda
│   ├── settings.ts               # getSetting, updateSetting (tabel app_settings)
│   └── wisudawan.ts              # Profil wisudawan + loginWisudawan + cekStatusNim
├── lib/
│   ├── auth.ts                   # Konfigurasi NextAuth (Google Provider)
│   ├── supabase.ts               # Supabase client untuk Client Components
│   ├── supabase-server.ts        # Supabase client untuk Server Components/Actions
│   └── redis.ts                  # Upstash Redis client
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── BottomNav.tsx
│   ├── sections/
│   │   ├── HeroSection.tsx
│   │   ├── DataWisudaSection.tsx
│   │   ├── PersyaratanSection.tsx
│   │   ├── JadwalSection.tsx
│   │   ├── TataTertibSection.tsx
│   │   └── FAQSection.tsx
│   └── ui/
│       └── ThemeToggle.tsx
└── middleware.ts                 # Proteksi rute /admin via validasi JWT NextAuth
```

---

## 🚀 Status Implementasi

- [x] Instalasi Next.js 16 + Tailwind CSS v4
- [x] Setup Framer Motion & Lucide Icons
- [x] Pembangunan Navigasi (Navbar Desktop + Bottom Nav)
- [x] 6 Section Utama pada Landing Page
- [x] Dark Mode / Light Mode dengan variabel kustom CSS
- [x] **Autentikasi Admin** (Migrasi ke NextAuth.js Google Provider)
  - Login terpusat dengan akun Gmail (SSO)
  - Middleware validasi JWT dari `next-auth/jwt`
  - Tabel `admin_users` sebagai sumber kebenaran otorisasi (4 Role)
  - Halaman Manajemen Admin (tanpa password) di `/admin/manajemen-admin`
- [x] **Manajemen Wisudawan Lanjutan (Admin)**
  - Halaman detail wisudawan (`/admin/wisudawan/[nim]`)
  - Form **Edit Data Wisudawan** lengkap (`/admin/wisudawan/[nim]/edit`)
- [x] **Autentikasi Wisudawan** (NIM + Password)
  - Menggantikan sistem NIM + Tanggal Lahir
  - Password default `wisuda2026` (konfigurasible via Admin)
  - Pesan error spesifik per kasus (tidak terdaftar, password salah, periode tidak aktif)
- [x] **Fitur Cek Status NIM** di halaman `/auth`
  - Dialog Modal tanpa perlu login
  - Hasil instan: terdaftar / belum + nama periode aktif
- [x] **Halaman Pengaturan Sistem** (`/admin/pengaturan`)
  - Pengaturan periode wisuda
  - Password Default Wisudawan — tersimpan di tabel `app_settings` Supabase
- [x] **Tabel `app_settings`** Supabase (dedicated settings table)
- [x] **Filter Data Wisudawan** (Fakultas + Prodi dropdown)
- [x] **Import Batch Excel** dengan validasi, skip duplikasi, toast hasil
- [x] **Halaman Profil Wisudawan Dinamis** (`/wisudawan/[nim]`)
  - Foto dinamis (inisial jika belum upload foto)
  - Judul "Wisuda Program Sarjana dan Magister [Periode] IAIN Bone"
  - Label periode otomatis dari data wisudawan / periode aktif
  - Nama menggunakan NAMA GELAR jika ada, fallback ke NAMA MAHASISWA
  - Tanggal Yudisium ditampilkan sebagai teks biasa
  - Tab: Informasi, Undangan, Toga, Pendaftaran
  - QR Code Toga & Undangan, edit data mandiri
  - Pemotongan dan kompresi foto *client-side* (rasio 3:4, maks 500KB, auto latar merah)
  - Validasi *real-time* form & ikon centang kelengkapan
- [x] Caching profil wisudawan & settings via Upstash Redis
- [x] Dokumentasi lengkap di folder `docs/`
