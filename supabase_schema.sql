-- Pembuatan Tabel periode_wisuda
CREATE TABLE IF NOT EXISTS public.periode_wisuda (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nama_periode VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'aktif', -- 'aktif' atau 'selesai'
    data_pengaturan JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Pembuatan Tabel wisudawan berdasarkan kolom dari Google Sheets
CREATE TABLE IF NOT EXISTS public.wisudawan (
    -- Data Pribadi & Akses
    nim VARCHAR(50) PRIMARY KEY,
    nama_mahasiswa VARCHAR(255),
    nama_gelar VARCHAR(255),
    ttl VARCHAR(255),
    jenis_kelamin VARCHAR(50),
    email VARCHAR(255),
    password VARCHAR(255),
    
    -- Akademik & Tugas Akhir
    fakultas VARCHAR(255),
    prodi VARCHAR(255),
    prodi_singkat VARCHAR(100),
    ipk NUMERIC(3,2),
    predikat VARCHAR(100),
    tanggal_yudisium VARCHAR(100),
    judul_skripsi TEXT,
    
    -- Prestasi & Organisasi
    ormawa VARCHAR(255),
    jabatan_dalam_ormawa VARCHAR(255),
    prestasi_akd TEXT,
    prestasi_org TEXT,
    
    -- Pelaksanaan Wisuda (Admin & Tiket)
    periode VARCHAR(255),
    status VARCHAR(100),
    sesi VARCHAR(100),
    id_wisuda VARCHAR(100),
    urut INTEGER,
    waktu_hadir VARCHAR(255),
    id_undangan VARCHAR(100),
    qr_undangan TEXT,
    
    -- Atribut Toga
    toga VARCHAR(50),
    waktu_toga VARCHAR(255),
    qr_toga TEXT,
    
    -- Metadata & Files
    foto TEXT,
    sertifikat TEXT,
    timestamp VARCHAR(255),
    terdaftar VARCHAR(50),
    survei VARCHAR(50)
);

-- Mengaktifkan RLS (Row Level Security) - Opsional jika menggunakan dasbor khusus
ALTER TABLE public.wisudawan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.periode_wisuda ENABLE ROW LEVEL SECURITY;

-- Kebijakan anon/public read (Hanya baca untuk data publik)
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.wisudawan FOR SELECT 
USING ( true );

-- Kebijakan admin/update (Secara default kita set ke true karena ini dihandle oleh server action backend)
CREATE POLICY "Enable insert/update for all users" 
ON public.wisudawan FOR ALL 
USING ( true )
WITH CHECK ( true );

CREATE POLICY "Enable all for periode_wisuda" 
ON public.periode_wisuda FOR ALL 
USING ( true )
WITH CHECK ( true );


-- Pembuatan Tabel app_settings
CREATE TABLE IF NOT EXISTS public.app_settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

INSERT INTO public.app_settings (key, value, description)
VALUES ('default_password', 'wisuda2026', 'Password bawaan untuk pendaftaran calon wisudawan')
ON CONFLICT (key) DO NOTHING;

