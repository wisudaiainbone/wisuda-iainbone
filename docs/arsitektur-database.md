# Arsitektur Database & Penyimpanan Awan

Dokumen ini menjelaskan bagaimana proyek **Portal Wisuda IAIN Bone** terhubung ke layanan Cloud.

---

## 1. Skema Arsitektur

```
[Browser / Next.js App]
        │
        ├─── Supabase Auth ──────── JWT session (httpOnly cookie)
        │       └── admin_users     Daftar & role admin
        │
        ├─── Supabase (PostgreSQL)  Data relasional utama
        │       ├── wisudawan       Profil, data kelulusan, waktu_toga & waktu_hadir
        │       ├── periode_wisuda  Pengaturan & jadwal wisuda
        │       ├── prodi           Master data Fakultas & Program Studi
        │       ├── admin_users     Daftar admin (FK ke auth.users)
        │       ├── app_settings    Konfigurasi sistem & feature toggles
        │       └── perbaikan_data  Pengajuan perbaikan data akademik wisudawan
        │
        ├─── Upstash Redis ──────── Cache profil wisudawan (TTL 1 jam)
        │                           Cache konfigurasi app_settings (TTL 1 jam)
        │                           Cache scan toga & kehadiran (scan:toga:* / scan:undangan:*)
        │                           ⚠️ Di-bypass untuk halaman profil wisudawan
        │
        └─── Google Apps Script ─── Upload foto/sertifikat ke Google Drive
                                     Ekspor data wisudawan ke Google Sheets
```

---

## 2. Tabel Database

### `wisudawan`
Primary key: `nim`. Menyimpan seluruh data profil wisudawan.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `nim` | TEXT | Primary key |
| `nama_mahasiswa` | TEXT | Nama tanpa gelar |
| `nama_gelar` | TEXT | Auto-generated: nama + gelar (letak cerdas S3 vs lainnya) |
| `password` | TEXT | NULL = pakai default; `$sha256$salt$hash` = password kustom ter-hash |
| `id_wisuda` | TEXT | Format: `[PERIODE]_[TAHUN]_[URUTAN-3-DIGIT]_[NIM]` |
| `status` | TEXT | `'Calon Wisudawan'` atau `'Terdaftar'` |
| `log_status` | JSONB | Array rekaman perubahan status (append-only, tidak pernah ditimpa) |
| `tanggal_yudisium` | DATE | Format baku `YYYY-MM-DD` |
| `toga` | TEXT | Ukuran toga (S/M/L/XL/XXL) |
| `prodi_singkat` | TEXT | Auto-generated singkatan program studi |
| `foto` | TEXT | URL foto di Google Drive |
| `sesi` | TEXT | `'Sesi Satu'` atau `'Sesi Dua'` (ditetapkan Admin per Fakultas) |
| `urut` | INTEGER | Nomor urut wisudawan dalam sesinya (di-generate oleh fitur Nomor) |
| `id_undangan` | TEXT | Format baru: `UND_[Periode]_[Sesi]_[Urut 3 digit]_[NIM]` (contoh: `UND_ANGKATAN-XVII-TAHUN-2026_Sesi-Satu_001_20200050001`) |
| `qr_undangan` | TEXT | URL QR Code undangan dari `api.qrserver.com` |
| `waktu_toga` | TIMESTAMPTZ | Timestamp saat wisudawan mengambil toga (di-set via Scan Toga, NULL = belum ambil) |
| `waktu_hadir` | TIMESTAMPTZ | Timestamp saat wisudawan hadir wisuda (di-set via Scan Kehadiran, NULL = belum hadir) |
| `prestasi_akd` | TEXT | Sebutan prestasi akademik: `'Kesatu'`, `'Kedua'`, `'Ketiga'`, atau kombinasi dengan `'Institut'` (contoh: `'Kesatu, Institut'`). Di-set otomatis oleh tombol Generate di halaman Prestasi. NULL = tidak berprestasi. |

#### Format `log_status`
```json
[
  { "timestamp": "2026-06-01 08:00:00", "status": "Calon Wisudawan", "catatan": "Data diimpor oleh Admin" },
  { "timestamp": "2026-06-13 20:30:00", "status": "Terdaftar", "catatan": "Pendaftaran dikonfirmasi oleh wisudawan via portal" },
  { "timestamp": "2026-06-14 10:00:00", "status": "Reset Password", "catatan": "Password direset ke default oleh Admin" }
]
```

#### Format `id_wisuda`
```
[PERIODE-SLUG]_[TAHUN]_[URUTAN-3-DIGIT]_[NIM]
Contoh: WISUDA-KE-XII_2026_001_20210001001
```

### `periode_wisuda`
Menyimpan konfigurasi periode wisuda: status, kuota, jadwal, tempat, sesi, pengumuman, hint pendaftaran, link WAG, dan link_pengumuman (File PDF di Google Drive). Dikelola admin dari `/admin/pengaturan`.

### `prodi`
Menyimpan daftar master Fakultas, Prodi, Singkatan, dan Gelar. Digunakan untuk validasi import dan penentuan gelar otomatis.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | SERIAL | Primary key |
| `fakultas` | VARCHAR | Nama Fakultas |
| `prodi` | VARCHAR | Nama Prodi (Unique) |
| `singkatan` | VARCHAR | Singkatan Prodi |
| `gelar` | VARCHAR | Gelar Lulusan |
| `sesi` | TEXT | Sesi wisuda yang ditetapkan admin (`'Sesi Satu'` \| `'Sesi Dua'` \| NULL) |
| `urutan` | INTEGER | Urutan tampil Prodi — digunakan sebagai acuan Generate Nomor Urut wisudawan; diatur via drag-and-drop di halaman Admin Fakultas |

### `admin_users`
Metadata admin terhubung ke **Supabase Auth** (`auth.users`) via foreign key.

```sql
admin_users
├── id            UUID (FK → auth.users.id, CASCADE DELETE)
├── nama_lengkap
├── email
├── role          'superadmin' | 'admin_institut' | 'admin_unit' | 'admin_absensi'
├── unit_kerja    Nama Fakultas (wajib untuk admin_unit)
├── is_active     BOOLEAN
├── created_at
└── last_login
```

### `app_settings`
Menyimpan konfigurasi sistem dan feature toggles dalam format key-value.

```sql
app_settings
├── key           VARCHAR(50) PRIMARY KEY
├── value         TEXT
├── description   TEXT
└── updated_at    TIMESTAMP WITH TIME ZONE
```

| Key | Value Default | Keterangan |
|---|---|---|
| `default_password` | `wisuda2026` | Password login default Calon Wisudawan |
| `allow_edit_profile` | `true` | Toggle edit data profil wisudawan |
| `allow_edit_toga` | `true` | Toggle edit ukuran toga |
| `show_toga_info` | `true` | Toggle tampilkan tab/info toga |
| `show_undangan_info` | `true` | Toggle tampilkan tab/info undangan |
| `allow_perbaikan` | `true` | Toggle izinkan wisudawan mengajukan perbaikan data akademik |
| `cert_akd_nomor` | _(kosong)_ | Nomor sertifikat prestasi akademik untuk dicetak |
| `cert_akd_tanggal` | _(kosong)_ | Tanggal sertifikat prestasi akademik |
| `cert_akd_jabatan` | _(kosong)_ | Jabatan penandatangan sertifikat akademik |
| `cert_akd_nip` | _(kosong)_ | NIP penandatangan sertifikat akademik |
| `cert_akd_nama` | _(kosong)_ | Nama penandatangan sertifikat akademik |
| `cert_org_nomor` | _(kosong)_ | Nomor sertifikat prestasi organisasi |
| `cert_org_tanggal` | _(kosong)_ | Tanggal sertifikat prestasi organisasi |
| `cert_org_jabatan` | _(kosong)_ | Jabatan penandatangan sertifikat organisasi |
| `cert_org_nip` | _(kosong)_ | NIP penandatangan sertifikat organisasi |
| `cert_org_nama` | _(kosong)_ | Nama penandatangan sertifikat organisasi |
| `prestasi_override_[periode]` | `{}` | Aturan pengecualian override manual pemenang prestasi per periode (sementara, di-reset otomatis saat Generate ditekan) |

---

---

## 3. Tabel `perbaikan_data` *(Baru)*

Menyimpan pengajuan permohonan perbaikan data akademik dari wisudawan.

```sql
perbaikan_data
├── id               UUID (PRIMARY KEY, auto-generated)
├── nim              VARCHAR(50) FK → wisudawan(nim) CASCADE DELETE
├── detail_perbaikan TEXT (isi pengajuan wisudawan)
├── status           VARCHAR(20) DEFAULT 'proses'
│                    CHECK ('proses' | 'diterima' | 'ditolak')
├── catatan_admin    TEXT (jawaban/alasan dari admin, nullable)
├── created_at       TIMESTAMPTZ (timestamp pengajuan)
└── updated_at       TIMESTAMPTZ (timestamp terakhir diperbarui, auto-update via trigger)
```

**Aturan bisnis:**
- Setiap wisudawan hanya boleh memiliki **1 pengajuan aktif** (status `'proses'`) sekaligus.
- Wisudawan baru bisa mengajukan lagi setelah status pengajuan sebelumnya berubah menjadi `'diterima'` atau `'ditolak'`.
- Pembaruan kolom `updated_at` dilakukan otomatis oleh database trigger.

**Migration file:** `perbaikan_migration.sql`

---

## 4. Tabel `tamu` *(Baru)*

Menyimpan daftar tamu undangan eksternal untuk acara wisuda.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | VARCHAR(50) | Primary key (Format: `Tamu_{UUID}`) |
| `nama` | TEXT | Nama lengkap tamu |
| `jabatan` | TEXT | Jabatan atau instansi tamu (Opsional) |
| `alamat` | TEXT | Alamat tamu (Opsional) |
| `sesi` | TEXT | `'Sesi Satu'` atau `'Sesi Dua'` |
| `hadir` | TIMESTAMPTZ | Waktu kedatangan saat di-scan (NULL = belum hadir) |
| `qr_code` | TEXT | URL gambar QR Code dari `api.qrserver.com` |
| `created_at` | TIMESTAMPTZ | Timestamp pembuatan data |

**Aturan bisnis:**
- Kolom `periode` tidak ada di tabel ini; tamu tidak terikat secara kaku pada satu periode spesifik di database.
- Untuk mencetak undangan, Admin menggunakan dropdown *Periode Aktif* di antarmuka yang akan disematkan langsung secara *on-the-fly* pada dokumen cetak PDF.
- Tabel ini diakses menggunakan mode `Service Role` (Bypass RLS) pada saat operasi mutasi untuk keamanan data admin.

**Migration file:** `supabase_tamu.sql`

---

## 5. Row Level Security (RLS)

| Tabel | Policy |
|---|---|
| `wisudawan` | Public SELECT; semua operasi mutasi via server action (service role) |
| `periode_wisuda` | Semua operasi via server action |
| `prodi` | Public SELECT; mutasi via server action |
| `admin_users` | SELECT: semua `authenticated`; INSERT/UPDATE/DELETE: hanya `superadmin` |
| `app_settings` | Semua operasi via server action (service role) |
| `perbaikan_data` | SELECT/INSERT/UPDATE: via server action (service role) |
| `tamu` | Operasi via server action (service role bypass RLS) |

---

## 6. Strategi Caching & Bypass

| Data | Caching | Keterangan |
|---|---|---|
| Profil wisudawan (`wisudawan:[nim]`) | Redis 1 jam | Dihapus saat wisudawan update data |
| Pengaturan (`setting_[key]`) | Redis 1 jam | Dihapus oleh `updateSetting()` |
| Halaman Admin Dashboard (`prefetch`) | **Browser Cache (Next.js)** | `staleTimes` dikonfigurasi 5 menit di `next.config.ts`. Memberikan navigasi klien-sisi super cepat. |
| Pengaturan di halaman profil wisudawan | **Bypass Redis** (`skipCache: true`) | Agar perubahan admin langsung aktif tanpa menunggu TTL |
| Data perbaikan (`perbaikan_data`) | **Tidak di-cache** | Selalu fresh dari Supabase |
| Data tamu (`tamu`) | **Tidak di-cache** | Operasi real-time via server actions untuk akurasi data |

---

## 7. Setup Supabase

1. Buat proyek di [Supabase](https://supabase.com/).
2. Masuk ke **SQL Editor** dan eksekusi secara berurutan:
   - `supabase_schema.sql` — tabel dasar (`wisudawan`, `periode_wisuda`)
   - `db_migration.sql` — tabel `admin_users` + `app_settings` + RLS policies
   - `perbaikan_migration.sql` — tabel `perbaikan_data` + setting `allow_perbaikan`
   - `supabase_tamu.sql` — tabel `tamu` + indeks kehadiran
3. Salin kredensial ke `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` ← diperlukan untuk operasi admin (bypass RLS)
4. Pastikan Supabase Storage memiliki bucket public bernama `cert-assets` (opsional, jika menggunakan gambar latar sertifikat yang dinamis dari Supabase).
5. Setup akun admin pertama — lihat panduan di `docs/admin-panel.md`.

---

## 8. Setup Upstash Redis

1. Buat database di [Upstash](https://upstash.com/).
2. Salin *REST URL* dan *REST Token* ke `.env.local`:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

**Cache keys yang digunakan:**
| Key | TTL | Isi |
|---|---|---|
| `wisudawan:[nim]` | 3600 detik | Profil wisudawan |
| `setting_[key]` | 3600 detik | Nilai dari tabel `app_settings` |
| `scan:toga:[id_wisuda]` | Tidak ada TTL | Data wisudawan untuk scan toga (NIM, nama, toga, waktu_toga, dll.) |
| `scan:undangan:[id_undangan]` | Tidak ada TTL | Data wisudawan untuk scan kehadiran (NIM, nama, sesi, waktu_hadir, dll.) |
| `scan:tamu:[id_tamu]` | Tidak ada TTL | Data tamu undangan untuk scan kehadiran (Nama, sesi, hadir, dll.) |
| `scan:meta:toga` | Tidak ada TTL | Metadata cache toga: `{ cached_at, total, periode }` |
| `scan:meta:undangan` | Tidak ada TTL | Metadata cache undangan: `{ cached_at, total, periode }` |
| `scan:meta:tamu` | Tidak ada TTL | Metadata cache tamu: `{ cached_at, total, periode }` |

> ⚠️ Halaman profil wisudawan (`/wisudawan/[nim]`) mengambil pengaturan langsung dari Supabase tanpa cache Redis agar feature toggles aktif seketika.

> ℹ️ Cache scan (`scan:toga:*`, `scan:undangan:*`, dan `scan:tamu:*`) tidak memiliki TTL otomatis karena sengaja di-refresh manual oleh admin via tombol "Ambil Cache" sebelum sesi scan dimulai.

---

## 9. Setup Google Apps Script (Upload & Export)

1. Buka [Google Apps Script](https://script.google.com/) dan buat proyek baru.
2. Salin *source code* dari file `gas_script.gs` ke editor tersebut.
3. Masuk ke **Project Settings** → **Script Properties**, tambahkan:
   - `UPLOAD_FOLDER_ID`: ID folder Google Drive untuk foto dan ijazah.
   - `SPREADSHEET_ID`: ID Google Spreadsheet untuk ekspor data.
4. Klik **Deploy → New Deployment** → pilih **Web App** → Akses: **Anyone**.
5. Salin *Web App URL* ke `.env.local` sebagai `NEXT_PUBLIC_GAS_WEBAPP_URL`.

---

## 10. Alur Invalidasi Cache

Ketika wisudawan atau admin mengubah data:

1. UI memanggil *Server Action* (misalnya `updateWisudawan`, `setSesiByFakultas`, `updateStatusPerbaikan`).
2. Action memperbarui *row* di Supabase.
3. Action **menghapus key** yang relevan dari Upstash Redis:
   - `wisudawan:[nim]` — profil wisudawan yang terpengaruh (bisa massal via Redis Pipeline untuk perubahan sesi per-fakultas).
   - `dashboard:stats:all` — statistik dashboard jika data berubah signifikan.
4. Action memanggil `revalidatePath(...)` untuk memperbarui *Data Cache* Next.js:
   - Path wisudawan (`/wisudawan/[nim]`)
   - Path admin detail (`/admin/wisudawan/[nim]`)
   - Path daftar (`/admin/wisudawan`)
   - Path dashboard (`/admin`)
5. Request berikutnya melakukan *fetch* ulang ke Supabase dan Redis diisi kembali.

**Action yang melakukan invalidasi cache:**
| Action | Cache yang Dihapus | revalidatePath |
|---|---|---|
| `updateWisudawan` | `wisudawan:[nim]`, `dashboard:stats:all` | `/wisudawan/[nim]`, `/admin/wisudawan/[nim]`, `/admin/wisudawan` |
| `setSesiByFakultas` | `wisudawan:[nim]` semua NIM di fakultas (Pipeline) | `/admin/wisudawan`, `/admin`, `'/' layout` |
| `updateStatusPerbaikan` | `wisudawan:[nim]` dari perbaikan | `/wisudawan/[nim]`, `/admin/wisudawan/[nim]`, `/admin/perbaikan` |
| `daftarWisuda` | `wisudawan:[nim]`, `dashboard:stats:all` | `/wisudawan/[nim]`, `/admin/wisudawan` |
| `importWisudawan` | `dashboard:stats:all` | `/admin/wisudawan`, `/admin` |
| `deleteWisudawan` | `wisudawan:[nim]`, `dashboard:stats:all` | `/admin/wisudawan`, `/admin` |
| `updateSetting` | `setting_[key]` | `/admin/pengaturan` |
| `generateNomorUndangan` | `wisudawan:[nim]` semua NIM terproses (Pipeline) + `dashboard:stats:all` | `/admin/wisudawan`, `/admin` |
| `updateProdiOrder` | — (tidak ada cache) | `/admin/fakultas` |
| `warmUpTogaCache` | — (menambah cache baru, bukan menghapus) | — |
| `warmUpUndanganCache` | — (menambah cache baru, bukan menghapus) | — |
| `/api/scan/toga` (POST) | — (mengupdate key yang sudah ada di Redis) | — |
| `/api/scan/undangan` (POST) | — (mengupdate key yang sudah ada di Redis) | — |
