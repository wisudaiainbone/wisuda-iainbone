-- =====================================================================
-- Migration: Tambah kolom prestasi_prodi di tabel wisudawan
-- Jalankan di Supabase SQL Editor
-- =====================================================================

ALTER TABLE wisudawan
ADD COLUMN IF NOT EXISTS prestasi_prodi TEXT;

-- Komentar:
-- Kolom ini menyimpan sebutan prestasi terbaik di tingkat Program Studi.
-- Nilai: 'Kesatu', 'Kedua', 'Ketiga', atau NULL jika tidak berprestasi.
-- Di-set otomatis oleh tombol "Generate" di tab Prestasi Prodi.
