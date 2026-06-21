-- ============================================================
-- MIGRASI: Tabel perbaikan_data
-- Fitur: Wisudawan dapat mengajukan permohonan perbaikan data akademik
-- Jalankan di SQL Editor Supabase Dashboard
-- ============================================================

-- 1. Buat tabel perbaikan_data
CREATE TABLE IF NOT EXISTS public.perbaikan_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nim VARCHAR(50) NOT NULL REFERENCES public.wisudawan(nim) ON DELETE CASCADE,
    detail_perbaikan TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'proses'
        CHECK (status IN ('proses', 'diterima', 'ditolak')),
    catatan_admin TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Index untuk query cepat berdasarkan NIM
CREATE INDEX IF NOT EXISTS idx_perbaikan_data_nim
    ON public.perbaikan_data (nim);

-- Index untuk filter berdasarkan status
CREATE INDEX IF NOT EXISTS idx_perbaikan_data_status
    ON public.perbaikan_data (status);

-- 3. Aktifkan Row Level Security
ALTER TABLE public.perbaikan_data ENABLE ROW LEVEL SECURITY;

-- 4. Policy: Semua bisa SELECT (karena akses dikontrol di server action)
CREATE POLICY "Enable select for all"
    ON public.perbaikan_data FOR SELECT
    USING (true);

-- 5. Policy: Semua bisa INSERT (karena akses dikontrol di server action)
CREATE POLICY "Enable insert for all"
    ON public.perbaikan_data FOR INSERT
    WITH CHECK (true);

-- 6. Policy: Semua bisa UPDATE (karena akses dikontrol di server action)
CREATE POLICY "Enable update for all"
    ON public.perbaikan_data FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- 7. Fungsi otomatis update kolom updated_at
CREATE OR REPLACE FUNCTION update_perbaikan_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_perbaikan_updated_at
    BEFORE UPDATE ON public.perbaikan_data
    FOR EACH ROW
    EXECUTE FUNCTION update_perbaikan_updated_at();

-- ============================================================
-- SEED: Tambah setting allow_perbaikan ke app_settings
-- ============================================================
INSERT INTO public.app_settings (key, value, description)
VALUES ('allow_perbaikan', 'true', 'Izinkan wisudawan mengajukan perbaikan data akademik (Nama, NIM, Fakultas, Prodi, IPK, Toga, Predikat, Tgl Yudisium)')
ON CONFLICT (key) DO NOTHING;
