-- ════════════════════════════════════════════════════════════════
--  Supabase Storage: Bucket "cert-assets"
--  Jalankan script ini di Supabase SQL Editor
-- ════════════════════════════════════════════════════════════════

-- 1. Buat bucket public "cert-assets"
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cert-assets',
  'cert-assets',
  true,               -- public: URL dapat diakses tanpa auth
  5242880,            -- max 5 MB per file
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp'];

-- 2. Policy: Siapapun bisa membaca/melihat file (public read)
CREATE POLICY "cert-assets: public read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'cert-assets');

-- 3. Policy: Hanya service_role/authenticated yang bisa upload
--    (Catatan: karena kita pakai anon key, tambahkan policy insert untuk anon juga)
CREATE POLICY "cert-assets: anon insert"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'cert-assets');

-- 4. Policy: Hapus file (untuk mengganti background lama)
CREATE POLICY "cert-assets: anon delete"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'cert-assets');
