-- Tambahkan kolom sesi pada tabel prodi jika belum ada
ALTER TABLE public.prodi 
ADD COLUMN IF NOT EXISTS sesi text;
