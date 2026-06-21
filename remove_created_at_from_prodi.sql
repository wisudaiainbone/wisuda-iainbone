-- Hapus kolom created_at dari tabel prodi
ALTER TABLE public.prodi 
DROP COLUMN IF EXISTS created_at;
