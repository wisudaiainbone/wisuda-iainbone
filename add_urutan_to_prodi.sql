-- Tambahkan kolom urutan ke tabel prodi untuk menyimpan posisi urutan kustom
ALTER TABLE public.prodi 
ADD COLUMN IF NOT EXISTS urutan INTEGER DEFAULT 0;
