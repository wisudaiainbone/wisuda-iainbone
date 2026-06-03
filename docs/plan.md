# Wisuda IAIN Bone — Web Application

Membangun aplikasi web modern untuk acara wisuda **Institut Agama Islam Negeri (IAIN) Bone** menggunakan **Next.js 14 (App Router)** dan **Tailwind CSS**. Aplikasi ini akan menjadi portal resmi wisuda yang menampilkan informasi, galeri, data wisudawan, dan fitur interaktif lainnya.

---

## Open Questions

> [!IMPORTANT]
> Beberapa pertanyaan di bawah ini perlu dijawab sebelum eksekusi dimulai. Namun eksekusi tetap bisa dimulai dengan asumsi default yang tertera.

| # | Pertanyaan | Asumsi Default |
|---|-----------|----------------|
| 1 | Apakah ada backend/database? (misalnya Supabase, Firebase, atau API eksternal) | **Static + JSON lokal** untuk MVP |
| 2 | Apakah ada fitur pencarian nama wisudawan? | Ya, dengan data JSON lokal |
| 3 | Apakah perlu halaman admin untuk input data? | Tidak (fase 1) |
| 4 | Apakah ada branding resmi IAIN Bone (logo, warna)? | Gunakan hijau tua + emas sebagai palette utama |
| 5 | Apakah perlu login/autentikasi? | Tidak (fase 1) |
| 6 | Versi Tailwind CSS yang digunakan? | **Tailwind CSS v3** |

---

## Proposed Changes

### Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS v3 + custom design tokens
- **Animasi**: Framer Motion
- **UI Components**: shadcn/ui (opsional)
- **Icons**: Lucide React + React Icons
- **Font**: Google Fonts (Playfair Display + Inter)
- **Deploy Target**: Vercel (recommended)

---

### Struktur Halaman & Fitur

#### 1. Landing Page (`/`)
- **Hero Section** — Full-screen dengan video background atau parallax image bertuliskan judul wisuda, angkatan, dan tanggal pelaksanaan
- **Countdown Timer** — Hitung mundur menuju hari wisuda
- **Quick Stats** — Total wisudawan, jumlah prodi, angkatan ke-X
- **CTA Buttons** — "Cari Nama Wisudawan" & "Lihat Rundown"

#### 2. Wisudawan Page (`/wisudawan`)
- **Tabel / Grid Data Wisudawan** — Nama, NIM, Program Studi, IPK (opsional)
- **Filter & Search** — Pencarian real-time berdasarkan nama atau NIM
- **Filter per Prodi / Fakultas**
- **Kartu Wisudawan Individual** — Foto (placeholder avatar), nama, gelar

#### 3. Jadwal & Rundown (`/jadwal`)
- Timeline visual alur acara wisuda
- Informasi tempat, tanggal, dan jam pelaksanaan
- Peta lokasi (Google Maps embed)

#### 4. Galeri (`/galeri`)
- Grid masonry foto kegiatan wisuda
- Lightbox viewer
- Kategori (Gladi Resik, Pelaksanaan, After Party)

#### 5. Tentang (`/tentang`)
- Profil singkat IAIN Bone
- Sambutan Rektor
- Sejarah wisuda

#### 6. Pesan & Ucapan (`/ucapan`) *(opsional fase 2)*
- Form kirim ucapan selamat
- Wall ucapan publik

---

### Komponen Utama

```
src/
├── app/
│   ├── layout.tsx          # Root layout (font, metadata)
│   ├── page.tsx            # Landing page
│   ├── wisudawan/
│   │   └── page.tsx
│   ├── jadwal/
│   │   └── page.tsx
│   ├── galeri/
│   │   └── page.tsx
│   └── tentang/
│       └── page.tsx
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   ├── home/
│   │   ├── HeroSection.tsx
│   │   ├── CountdownTimer.tsx
│   │   ├── StatsSection.tsx
│   │   └── CTASection.tsx
│   ├── wisudawan/
│   │   ├── WisudawanGrid.tsx
│   │   ├── WisudawanCard.tsx
│   │   └── SearchFilter.tsx
│   ├── galeri/
│   │   ├── GalleryGrid.tsx
│   │   └── LightboxViewer.tsx
│   └── ui/
│       ├── AnimatedCounter.tsx
│       └── Timeline.tsx
├── data/
│   └── wisudawan.json      # Data wisudawan (mock)
└── public/
    ├── images/
    └── logo-iain-bone.png
```

---

### Design System

#### Color Palette
| Token | Hex | Deskripsi |
|-------|-----|-----------|
| `primary` | `#1A4731` | Hijau tua (warna khas IAIN) |
| `primary-light` | `#2D6A4F` | Hijau medium |
| `accent` | `#C9A84C` | Emas/gold untuk highlight |
| `accent-light` | `#F0C040` | Emas terang |
| `dark` | `#0D1117` | Background gelap |
| `surface` | `#161B22` | Card surface |
| `text` | `#E6EDF3` | Teks utama |

#### Typography
- **Display/Heading**: Playfair Display (serif, elegan)
- **Body**: Inter (sans-serif, modern)

#### Visual Motif
- Glassmorphism cards
- Subtle gold border glow pada elemen penting
- Particle background atau pattern batik/islami transparan
- Smooth scroll animations (Framer Motion)

---

### Data & Backend (Fase 1 — Static)

Data wisudawan disimpan dalam file `src/data/wisudawan.json`:

```json
[
  {
    "id": 1,
    "nim": "01.22.0001",
    "nama": "Ahmad Fauzi",
    "prodi": "Hukum Ekonomi Syariah",
    "fakultas": "Syariah dan Hukum Islam",
    "ipk": "3.85",
    "gelar": "S.H."
  }
]
```

---

### Halaman & Route Summary

| Route | Halaman | Prioritas |
|-------|---------|-----------|
| `/` | Landing Page + Hero + Countdown | 🔴 Wajib |
| `/wisudawan` | Data & Pencarian Wisudawan | 🔴 Wajib |
| `/jadwal` | Rundown & Jadwal Acara | 🔴 Wajib |
| `/galeri` | Galeri Foto | 🟡 Penting |
| `/tentang` | Profil IAIN Bone | 🟢 Tambahan |
| `/ucapan` | Wall Ucapan Selamat | 🟢 Fase 2 |

---

## Verification Plan

### Automated
- `npm run build` — Pastikan tidak ada build error
- `npm run lint` — Cek code quality

### Manual Verification
- Cek responsivitas di mobile, tablet, dan desktop
- Verifikasi countdown timer bekerja dengan benar
- Cek search/filter wisudawan berfungsi real-time
- Validasi semua animasi berjalan smooth
- Uji lightbox galeri di berbagai browser
