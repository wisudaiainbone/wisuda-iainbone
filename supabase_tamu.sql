-- Script untuk membuat tabel Tamu VIP
-- Harap jalankan script ini di SQL Editor Supabase

CREATE TABLE tamu (
  id         TEXT PRIMARY KEY,          -- Format: Tamu_(yyyymmddhhmmss)_[sesi]
  nama       TEXT NOT NULL,
  jabatan    TEXT,
  alamat     TEXT,
  sesi       TEXT,                      -- 'Sesi Satu' | 'Sesi Dua'
  hadir      TIMESTAMP,                 -- Diisi otomatis ketika di-scan
  qr_code    TEXT,                      -- Sama dengan id (digunakan untuk generate QR)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indeks untuk mengoptimalkan query berdasarkan sesi, periode, dan kehadiran
CREATE INDEX idx_tamu_sesi ON tamu(sesi);
CREATE INDEX idx_tamu_hadir ON tamu(hadir);

-- Policy keamanan agar admin bisa melakukan operasi CRUD
-- (Gunakan sesuai setup RLS yang berjalan, jika ada, atau biarkan publik jika RLS belum diaktifkan)
-- Jika Anda menggunakan Service Role Key / RLS nonaktif, tabel ini bisa langsung digunakan.

-- Insert 20 Data Tamu Dummy
INSERT INTO tamu (id, nama, jabatan, alamat, sesi, qr_code) VALUES
('Tamu_202606210001_SesiSatu', 'Prof. Dr. H. Andi Fulan, M.Ag', 'Bupati Bone', 'Watampone', 'Sesi Satu', 'Tamu_202606210001_SesiSatu'),
('Tamu_202606210002_SesiSatu', 'Dr. Budi Santoso', 'Wakil Bupati Bone', 'Watampone', 'Sesi Satu', 'Tamu_202606210002_SesiSatu'),
('Tamu_202606210003_SesiSatu', 'Ir. Haji Ahmad, M.Si', 'Ketua DPRD Bone', 'Watampone', 'Sesi Satu', 'Tamu_202606210003_SesiSatu'),
('Tamu_202606210004_SesiSatu', 'Kombes Pol. Fajaruddin', 'Kapolres Bone', 'Watampone', 'Sesi Satu', 'Tamu_202606210004_SesiSatu'),
('Tamu_202606210005_SesiSatu', 'Letkol Inf. Wijaya', 'Dandim 1407/Bone', 'Watampone', 'Sesi Satu', 'Tamu_202606210005_SesiSatu'),
('Tamu_202606210006_SesiSatu', 'H. Zainal Abidin, Lc', 'Ketua MUI Bone', 'Watampone', 'Sesi Satu', 'Tamu_202606210006_SesiSatu'),
('Tamu_202606210007_SesiSatu', 'Dra. Hj. Aminah', 'Kepala Kemenag Bone', 'Watampone', 'Sesi Satu', 'Tamu_202606210007_SesiSatu'),
('Tamu_202606210008_SesiSatu', 'Prof. Dr. Irwan, M.Pd', 'Rektor UNM', 'Makassar', 'Sesi Satu', 'Tamu_202606210008_SesiSatu'),
('Tamu_202606210009_SesiSatu', 'Dr. Hj. Siti Fatimah', 'Ketua Pengadilan Agama', 'Watampone', 'Sesi Satu', 'Tamu_202606210009_SesiSatu'),
('Tamu_202606210010_SesiSatu', 'H. Abdul Rahman, S.H', 'Ketua Pengadilan Negeri', 'Watampone', 'Sesi Satu', 'Tamu_202606210010_SesiSatu'),
('Tamu_202606210011_SesiDua', 'Andi Muhammad, S.E', 'Kepala Bappeda Bone', 'Watampone', 'Sesi Dua', 'Tamu_202606210011_SesiDua'),
('Tamu_202606210012_SesiDua', 'Dr. Faisal, M.Kes', 'Kepala Dinas Kesehatan Bone', 'Watampone', 'Sesi Dua', 'Tamu_202606210012_SesiDua'),
('Tamu_202606210013_SesiDua', 'Drs. H. M. Yunus', 'Kepala Dinas Pendidikan Bone', 'Watampone', 'Sesi Dua', 'Tamu_202606210013_SesiDua'),
('Tamu_202606210014_SesiDua', 'Ir. Wahyudi', 'Kadis PUPR Bone', 'Watampone', 'Sesi Dua', 'Tamu_202606210014_SesiDua'),
('Tamu_202606210015_SesiDua', 'AKBP H. Anwar', 'Kadis Perhubungan Bone', 'Watampone', 'Sesi Dua', 'Tamu_202606210015_SesiDua'),
('Tamu_202606210016_SesiDua', 'Hj. Nurbaya, S.Pd', 'Ketua PKK Bone', 'Watampone', 'Sesi Dua', 'Tamu_202606210016_SesiDua'),
('Tamu_202606210017_SesiDua', 'Drs. H. Syamsuddin', 'Kepala Kesbangpol Bone', 'Watampone', 'Sesi Dua', 'Tamu_202606210017_SesiDua'),
('Tamu_202606210018_SesiDua', 'Dr. Andi Asrul', 'Ketua Kadin Bone', 'Watampone', 'Sesi Dua', 'Tamu_202606210018_SesiDua'),
('Tamu_202606210019_SesiDua', 'H. M. Arsyad', 'Ketua Baznas Bone', 'Watampone', 'Sesi Dua', 'Tamu_202606210019_SesiDua'),
('Tamu_202606210020_SesiDua', 'Drs. H. M. Said', 'Tokoh Masyarakat', 'Watampone', 'Sesi Dua', 'Tamu_202606210020_SesiDua');
