-- ============================================================
-- MIGRASI: Tabel admin_users untuk sistem Auth Admin Baru
-- Jalankan di SQL Editor Supabase Dashboard
-- ============================================================

-- Role yang tersedia:
-- 'superadmin'     : Akses penuh ke seluruh sistem
-- 'admin_institut' : Akses fitur utama (wisudawan, pengaturan)
-- 'admin_unit'     : Akses data wisudawan tingkat unit/fakultas
-- 'admin_absensi'  : Akses khusus pencatatan kehadiran wisudawan

-- 1. Buat tabel admin_users yang terhubung ke Supabase Auth
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nama_lengkap VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) DEFAULT 'admin_unit' CHECK (role IN (
        'superadmin',
        'admin_institut',
        'admin_unit',
        'admin_absensi'
    )),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_login TIMESTAMP WITH TIME ZONE,
    unit_kerja VARCHAR(255)
);

-- 1b. Jika tabel sudah ada sebelumnya (dengan role lama 'admin'/'superadmin'),
--     jalankan query ini untuk memperbarui constraint:
-- ALTER TABLE public.admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
-- ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_role_check
--     CHECK (role IN ('superadmin', 'admin_institut', 'admin_unit', 'admin_absensi'));
-- UPDATE public.admin_users SET role = 'admin_institut' WHERE role = 'admin';
-- ALTER TABLE public.admin_users ALTER COLUMN role SET DEFAULT 'admin_unit';

-- 2. Aktifkan Row Level Security
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Admin yang sudah terautentikasi bisa READ semua admin
CREATE POLICY "Admin dapat melihat daftar admin"
ON public.admin_users FOR SELECT
TO authenticated
USING (true);

-- 4. Policy: Hanya superadmin yang bisa INSERT admin baru
CREATE POLICY "Hanya superadmin yang bisa menambah admin"
ON public.admin_users FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = auth.uid() AND role = 'superadmin' AND is_active = true
  )
);

-- 5. Policy: Superadmin bisa UPDATE (termasuk toggle status & role)
CREATE POLICY "Hanya superadmin yang bisa update admin"
ON public.admin_users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = auth.uid() AND role = 'superadmin' AND is_active = true
  )
);

-- 6. Policy: Superadmin bisa DELETE admin
CREATE POLICY "Hanya superadmin yang bisa hapus admin"
ON public.admin_users FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = auth.uid() AND role = 'superadmin' AND is_active = true
  )
);

-- 7. Policy: Admin boleh UPDATE last_login miliknya sendiri
CREATE POLICY "Admin bisa update last_login sendiri"
ON public.admin_users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());


-- ============================================================
-- SEED: Daftarkan admin pertama (superadmin)
-- ============================================================
-- Tidak perlu SQL manual! Gunakan halaman setup otomatis:
--
-- 1. Pastikan SUPABASE_SERVICE_ROLE_KEY sudah diisi di .env.local
-- 2. Jalankan app: npm run dev
-- 3. Buka di browser: http://localhost:3000/setup
-- 4. Isi form nama, email, password → klik "Buat Superadmin"
-- 5. Setelah berhasil, halaman /setup otomatis tidak bisa diakses lagi
-- ============================================================


-- ============================================================
-- MIGRASI LAMA: Kolom baru pada tabel periode_wisuda
-- (Sudah pernah dijalankan sebelumnya — abaikan jika sudah)
-- ============================================================

-- ALTER TABLE periode_wisuda 
-- ADD COLUMN IF NOT EXISTS kuota INTEGER DEFAULT 0,
-- ADD COLUMN IF NOT EXISTS tanggal_pendaftaran TEXT,
-- ADD COLUMN IF NOT EXISTS tanggal_pelaksanaan TEXT,
-- ADD COLUMN IF NOT EXISTS tempat_pelaksanaan TEXT,
-- ADD COLUMN IF NOT EXISTS waktu_sesi_1 TEXT,
-- ADD COLUMN IF NOT EXISTS waktu_sesi_2 TEXT,
-- ADD COLUMN IF NOT EXISTS jadwal_gladi TEXT,
-- ADD COLUMN IF NOT EXISTS pengumuman TEXT;



-- NEW: App Settings Table
CREATE TABLE IF NOT EXISTS public.app_settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insert default application settings if not exists
INSERT INTO public.app_settings (key, value, description) VALUES 
('default_password', 'wisuda2026', 'Password bawaan untuk pendaftaran calon wisudawan'),
('allow_edit_toga', 'true', 'Izinkan wisudawan mengubah ukuran toga'),
('allow_edit_profile', 'true', 'Izinkan wisudawan mengedit profil dan melengkapi data pendaftaran'),
('show_toga_info', 'true', 'Tampilkan informasi jadwal dan QR pengambilan Toga di profil publik'),
('show_undangan_info', 'true', 'Tampilkan informasi E-Undangan dan QR Code di profil publik')
ON CONFLICT (key) DO NOTHING;


-- ============================================================
-- MIGRASI: Kolom log_status (audit trail perubahan status)
-- Tambahkan kolom baru ke tabel wisudawan
-- Jalankan di SQL Editor Supabase Dashboard
-- ============================================================

-- Tambah kolom log_status sebagai JSONB array
ALTER TABLE public.wisudawan
  ADD COLUMN IF NOT EXISTS log_status JSONB DEFAULT '[]'::jsonb;

-- Index GIN untuk query cepat pada kolom JSONB (opsional, direkomendasikan)
CREATE INDEX IF NOT EXISTS idx_wisudawan_log_status
  ON public.wisudawan USING GIN (log_status);

-- Format setiap entry dalam array log_status:
-- { "timestamp": "2026-06-13T14:20:00+08:00", "status": "Calon Wisudawan", "catatan": "Data diimport oleh admin" }
-- Entry bersifat append-only, diurutkan dari yang paling lama ke yang paling baru.

-- ============================================================
-- MIGRASI: Tambah kolom waglink, theme, status_color & Hapus data_pengaturan
-- Jalankan di SQL Editor Supabase Dashboard
-- ============================================================

-- 1. Tambahkan kolom baru
ALTER TABLE public.periode_wisuda
  ADD COLUMN IF NOT EXISTS waglink TEXT,
  ADD COLUMN IF NOT EXISTS theme TEXT,
  ADD COLUMN IF NOT EXISTS status_color TEXT,
  ADD COLUMN IF NOT EXISTS hint_pendaftaran TEXT;

-- 2. Migrasikan data yang sudah ada dari JSONB ke kolom baru (opsional jika sudah ada data)
UPDATE public.periode_wisuda 
SET 
  waglink = data_pengaturan->>'wagLink',
  theme = data_pengaturan->>'themeImage',
  status_color = data_pengaturan->>'statusColor';

-- 3. Hapus kolom data_pengaturan
ALTER TABLE public.periode_wisuda DROP COLUMN IF EXISTS data_pengaturan;

-- ============================================================
-- MIGRASI: Jadikan nama_periode sebagai UNIQUE KEY
-- ============================================================
ALTER TABLE public.periode_wisuda
  ADD CONSTRAINT periode_wisuda_nama_periode_key UNIQUE (nama_periode);

-- Ubah tipe data id menjadi VARCHAR agar bisa menampung format 2026-XXXXXX
ALTER TABLE public.periode_wisuda
  ALTER COLUMN id TYPE VARCHAR(20) USING id::VARCHAR;
