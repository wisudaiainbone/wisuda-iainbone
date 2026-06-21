-- Tabel untuk menyimpan data program studi
CREATE TABLE IF NOT EXISTS public.prodi (
    id SERIAL PRIMARY KEY,
    fakultas VARCHAR(255) NOT NULL,
    prodi VARCHAR(255) NOT NULL UNIQUE,
    singkatan VARCHAR(50) NOT NULL,
    gelar VARCHAR(50) NOT NULL
);

-- RLS
ALTER TABLE public.prodi ENABLE ROW LEVEL SECURITY;

-- Semua orang bisa baca (publik)
CREATE POLICY "Public prodi read"
ON public.prodi FOR SELECT
USING ( true );

-- Hanya server (service role) yang bisa insert/update/delete
CREATE POLICY "Enable all for prodi (service role)"
ON public.prodi FOR ALL
USING ( true )
WITH CHECK ( true );
