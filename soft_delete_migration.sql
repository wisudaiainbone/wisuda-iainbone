-- Migration script untuk Soft Delete Wisudawan
-- Jalankan ini di Supabase SQL Editor

-- 1. (Opsional) Jika sebelumnya Anda menambahkan CHECK constraint pada kolom status,
--    kita perlu memperbaruinya untuk mengizinkan 'Dihapus'.
--    Jika Anda tidak pernah membuat constraint, ini mungkin akan error (bisa diabaikan).
ALTER TABLE wisudawan DROP CONSTRAINT IF EXISTS wisudawan_status_check;

-- 2. (Opsional) Tambahkan kembali constraint yang valid (hanya jika Anda ingin validasi ketat)
-- ALTER TABLE wisudawan ADD CONSTRAINT wisudawan_status_check 
-- CHECK (status IN ('Calon Wisudawan', 'Terdaftar', 'Dihapus'));

-- Tabel log_status sudah berbentuk JSONB, jadi secara otomatis bisa menerima data log baru
-- tanpa perubahan skema.
