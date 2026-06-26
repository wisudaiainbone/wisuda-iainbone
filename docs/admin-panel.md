# Panduan Panel Admin & Autentikasi

Portal Wisuda IAIN Bone dilengkapi sistem Panel Admin terintegrasi di rute `/admin` dengan autentikasi berbasis **NextAuth.js (Google Provider)** yang aman dan praktis.

---

## 1. Arsitektur Autentikasi Admin

```
[Browser Admin] → Klik "Lanjutkan dengan Google" di /admin/login
       ↓
[Google OAuth] → Validasi identitas akun Gmail
       ↓
[NextAuth signIn] → Cek apakah email terdaftar di tabel `admin_users`
       ↓
   Jika Terdaftar → Terbitkan JWT Session (berisi ID, Role, Unit Kerja)
       ↓
[Next.js Middleware] → Validasi JWT via `getToken()`
       ↓
   Valid & Sesuai Role → /admin (dashboard)   |   Invalid → Redirect ke /admin/login dengan error

> **Jalur Alternatif (Admin Absensi):** Panitia lapangan dapat login tanpa Google menggunakan **Token Presensi** (menciptakan *cookie* `absensi_token`). Jalur ini khusus memberikan akses minimalis ke `/admin/kehadiran` dan `/admin/tamu` (mode scan).
```

| Aspek | Lama ❌ | Baru ✅ |
|---|---|---|
| Autentikasi | Supabase Auth (Email + Password Manual) | NextAuth.js (Google Login SSO) |
| Session | Supabase Cookie | NextAuth JWT Cookie (httpOnly) |
| Registrasi Admin | Input email & password manual | Input email Gmail saja (tanpa password) |
| Manajemen admin | UI di `/admin/manajemen-admin` | UI di `/admin/manajemen-admin` (Tanpa Password, List otomatis diurutkan sesuai hak akses) |

---

## 2. Akses Panel Admin

1. Buka `/admin/login` dan tekan tombol **"Lanjutkan dengan Google"**.
2. Pilih akun Google (Gmail) Anda.
3. Sistem memverifikasi kredensial ke Google, lalu mengecek tabel `admin_users` untuk memastikan email tersebut memiliki akses admin.
4. Setelah berhasil, diarahkan ke Dashboard Admin (`/admin`). Jika email tidak terdaftar, Anda akan dikembalikan dengan pesan error.

---

## 3. Kamus Role Admin (Tingkat Akses)

| ID Role | Nama Tampilan | Deskripsi | Rute yang Diizinkan |
|---|---|---|---|
| `superadmin` | 👑 Superadmin | Akses penuh ke seluruh sistem. | `/*` |
| `admin_institut` | 🏛️ Admin Institut | Mengelola data wisudawan, toga & pengaturan tingkat institusi. | `/admin`, `/admin/wisudawan`, `/admin/toga`, `/admin/pengaturan`, `/admin/prestasi`, `/admin/perbaikan`, `/admin/informasi` |
| `admin_unit` | 🏫 Admin Unit | **Read-only** — melihat data wisudawan & toga terbatas unit kerja/fakultas masing-masing. Tidak bisa Generate/Print/Override di Prestasi. Tersembunyi: menu Tamu. | `/admin`, `/admin/wisudawan`, `/admin/toga`, `/admin/prestasi`, `/admin/perbaikan`, `/admin/informasi` |
| `admin_absensi` | ✅ Admin Absensi | Khusus pencatatan kehadiran wisudawan dan Tamu VIP pada hari H. | `/admin`, `/admin/kehadiran`, `/admin/tamu` |

> ✅ **Middleware Protection:** Jika admin mengakses rute di luar hak aksesnya, Next.js Middleware otomatis menolak dan mengembalikan ke dashboard.

---

## 4. Fitur Dashboard Admin

### Dashboard Statistik Utama (`/admin`)
Halaman utama yang pertama kali dilihat oleh Admin, menyediakan ringkasan analitik berbasis *Interactive Drill-down* (3 Layer: Universitas → Fakultas → Prodi). **Header halaman admin** dilengkapi tombol **Keluar** (merah) yang muncul di sebelah kiri ikon profil untuk akses logout instan tanpa membuka dropdown.
- **Summary Cards**: Menampilkan Total Wisudawan, Jumlah Terdaftar, Calon Wisudawan, dan Persentase Pendaftaran.
- **10 Metrik Visual**:
  - Tren Pendaftaran Harian (Grafik Garis)
  - Distribusi Jenis Kelamin
  - Sebaran Predikat Kelulusan
  - Partisipasi Organisasi Mahasiswa
  - Status Pengisian Toga
  - Status Kehadiran
  - Sebaran IPK (Cum Laude [≥3.50], Sangat Memuaskan, Memuaskan, Baik)
  - Keterisian Sesi Wisuda
  - Status Prestasi (Akademik & Organisasi)
  - Kepatuhan Pengisian Survei
- **Filter Periode**: Mendukung melihat analitik untuk Semua Periode sekaligus atau filter berdasarkan periode spesifik.
- **Export XLSX**: Tombol khusus yang akan meng-export seluruh metrik ke dalam **12 buah Sheet Excel** (mencakup tingkat Fakultas dan rincian per Prodi).
- **Berdasarkan Terdaftar**: Seluruh metrik (kecuali total pendaftar awal) dihitung eksklusif hanya untuk wisudawan dengan status "Terdaftar".

### Pengaturan Periode (`/admin/pengaturan`)
Pengelolaan periode wisuda aktif, membaca dari tabel `periode_wisuda`:
- Status Pelaksanaan (Sedang Dibuka / Selesai)
- Kuota Wisudawan
- Jadwal & Tanggal (pendaftaran, pelaksanaan, gladi)
- Tempat Pelaksanaan, Sesi, Jam Sesi
- Pengumuman Tambahan (ditampilkan di profil wisudawan)
- **File Pengumuman Resmi (PDF)** — admin dapat mengunggah file PDF yang otomatis tersimpan ke Google Drive, dan wisudawan dapat mengunduhnya melalui tombol oranye di profil mereka.
- Catatan Pendaftaran (`hint_pendaftaran`) — ditampilkan dengan warna merah di halaman publik dan di kartu Jadwal Wisuda profil
- Link Grup WhatsApp

### Pengaturan Tampilan & Akses (Feature Toggles via `app_settings`)

Halaman Pengaturan menggunakan layout **2-kolom** (menu navigasi kiri 10% / konten kanan 90%) dengan tiga menu:

#### Menu General

| Key | Fungsi | Default |
|---|---|---|
| `default_password` | Password default untuk Calon Wisudawan | `wisuda2026` |
| `allow_edit_profile` | Mengizinkan wisudawan edit data profil | `true` |
| `allow_edit_toga` | Mengizinkan wisudawan ubah ukuran toga | `true` |
| `show_toga_info` | Menampilkan tab & informasi toga di profil | `true` |
| `show_undangan_info` | Menampilkan tab & informasi undangan di profil | `true` |
| `allow_perbaikan` | Mengizinkan wisudawan mengajukan perbaikan data akademik | `true` |
| `show_prestasi_card` | Menampilkan Kartu Prestasi Akademik di halaman profil publik wisudawan (hanya jika memiliki data `prestasi_akd`) | `true` |
| `contoh_foto_url` | URL publik gambar contoh/referensi foto profil wisudawan bertoga (disimpan di Supabase `cert-assets`). Ditampilkan di halaman panduan upload profil wisudawan dengan fitur zoom (lightbox). | ` ` |

Di bagian paling bawah Menu General, terdapat fitur **Bersihkan Seluruh Cache Sistem (Upstash)**. Tombol ini berfungsi menghapus seluruh statistik, profil, dan temporary state secara paksa dari memori server agar disinkronkan kembali dari database asli.

#### Menu Prestasi
Menyimpan data yang akan tercetak di sertifikat penghargaan. Dibagi menjadi dua sub-bagian:

**Upload Gambar**
| Key | Keterangan |
|---|---|
| `cert_bg_url` | URL publik gambar latar belakang sertifikat (Supabase Storage). Admin dapat upload PNG/JPG/WEBP (maks 5 MB) langsung dari UI — tersimpan otomatis ke bucket `cert-assets/backgrounds/`. Area upload Background dan Tanda Tangan memiliki lebar yang sama (`w-48 h-32`). |
| `cert_akd_ttd_url` | URL publik gambar Tanda Tangan Pejabat (PNG transparan direkomendasikan, maks 2 MB). Tersimpan di `cert-assets/signatures/`. Gambar dirender sebagai *overlay* di atas area tanda tangan sertifikat. |

**Sertifikat Prestasi Akademik**
| Key | Keterangan |
|---|---|
| `cert_akd_nomor` | Nomor SK Sertifikat Prestasi Akademik (teks bebas, akan muncul sebagai "Berdasarkan Keputusan Rektor [Nomor]") |
| `cert_akd_tanggal` | Tanggal sertifikat (muncul di area tanda tangan) |
| `cert_akd_jabatan` | Jabatan penandatangan sertifikat akademik |
| `cert_akd_nip` | NIP penandatangan sertifikat akademik |
| `cert_akd_nama` | Nama penandatangan sertifikat akademik |

**Sertifikat Prestasi Organisasi**
| Key | Keterangan |
|---|---|
| `cert_org_nomor` | Nomor Sertifikat Prestasi Organisasi |
| `cert_org_tanggal` | Tanggal Sertifikat Prestasi Organisasi |
| `cert_org_jabatan` | Jabatan Penandatangan Sertifikat Organisasi |
| `cert_org_nip` | NIP Penandatangan Sertifikat Organisasi |
| `cert_org_nama` | Nama Penandatangan Sertifikat Organisasi |

#### Menu Toga
Menungatur jadwal pengambilan toga per Fakultas untuk periode aktif. Tampilan mengikuti gaya Menu General (baris per baris, input teks).

| Field | Keterangan |
|---|---|
| Tempat Pengambilan | Lokasi pengambilan toga global (contoh: Gedung Fakultas Tarbiyah) |
| Waktu per Fakultas | Waktu pengambilan untuk 5 Fakultas: Syariah & Hukum Islam, Tarbiyah, Ushuluddin & Dakwah, Ekonomi & Bisnis Islam, Pascasarjana |

> ⚡ Perubahan pengaturan ini langsung aktif di halaman profil wisudawan karena pengambilan data `app_settings` di halaman profil **bypass Redis cache** (`skipCache: true`).

#### Menu Slide
Mengelola aset desain untuk fitur Generate Slide PPTX wisudawan.

| Fitur | Keterangan |
|---|---|
| Upload Bingkai | Tersedia 5 slot unggahan bingkai gambar transparan (PNG/WEBP maks 5 MB) khusus untuk masing-masing Fakultas/Pascasarjana. Ukuran ideal 1080×1920px (portrait). Aset akan tersimpan secara otomatis di Supabase Storage bucket `cert-assets/slide-frames/`. |
| Upload Badge Prestasi | Tersedia 3 slot unggahan gambar transparan (PNG/WEBP) untuk ikon/badge prestasi wisudawan yang akan ditampilkan pada fitur Slide Prestasi. |
| Kode Warna Hex | Tersedia input warna hex per Fakultas dengan color picker yang akan digunakan sebagai aksen dekoratif dan background slide default jika foto/bingkai tidak digunakan. Nilai warna ini akan digunakan langsung oleh `pptxgenjs` di client-side. |

### Data Wisudawan (`/admin/wisudawan`)
Pengelolaan data wisudawan dari Supabase, dilengkapi:
- **Toolbar Terpadu & Responsif Mobile**: Kolom pencarian dan semua tombol aksi (Tambah, Export, Sesi, Slide, Tag, Nomor, Daftar, Album) berada dalam satu baris sejajar (`h-10`) di desktop. Di perangkat *mobile*, deretan tombol berubah gaya menjadi **Tag Cloud** mungil yang padat (hanya menampilkan ikon tanpa teks).
- **Pencarian Real-time**: Cari berdasarkan NIM atau Nama. Tombol Reset (✕) muncul otomatis saat ada filter aktif.
- **Tampilan Card View Mobile yang Padat**: Khusus pengguna *smartphone*, tabel data dirender sebagai barisan **Kartu (Card)** interaktif yang merangkum seluruh informasi profil dan aksi tanpa perlu *scroll horizontal*, dengan desain padding dan gap minimum agar hemat ruang layar. Mengklik area manapun pada kartu akan mengarah secara instan ke profil wisudawan bersangkutan berkat fitur prefetch otomatis.
- **Panel Aksi Mengambang (Floating Action Bar)**: Untuk aksi penyimpanan yang penting (seperti menyimpan urutan Fakultas, Setelan Toga, atau mode Scan Tamu), tombol aksi dan pemberitahuan (`hint`) akan ditampilkan mengambang di bawah layar tepat di atas menu navigasi utama agar mudah diakses jempol.
- **Filter Dinamis SPA (Single Page Application)** *(Baru)*:
  - Di layar *mobile*, seluruh filter dropdown secara cerdas dikelompokkan dalam satu tombol toggle **Filter Data** (*collapsible*) dengan status default tertutup.
  - Proses pencarian dan filter berjalan 100% di *client-side* tanpa memicu *loading* server atau perubahan URL parameter, sehingga navigasi sangat instan dan beban memori server (Vercel) serta database Supabase berkurang drastis.
  - **Fakultas, Prodi, Status, Kehadiran, Ambil Toga** — pemilihan langsung berefek seketika pada tabel tanpa harus menekan tombol Cari.
  - **Tombol Cari Khusus Teks** — input teks NIM atau Nama membutuhkan penekanan *Enter* atau klik tombol "Cari" di dalam input agar mencegah penundaan (*stuttering*) saat admin mengetik kata yang panjang.
  - **Status Toga** — memunculkan kolom `Uk Toga` di tabel secara dinamis ketika diaktifkan.
  - **Filter Sesi** (`Sesi Satu` / `Sesi Dua` / `Tanpa Sesi`) — memunculkan kolom `Sesi` di tabel secara dinamis ketika diaktifkan.
- **Pengaturan Sesi per Fakultas** (tombol ungu `Sesi`):
  - Admin dapat menetapkan `Sesi Satu` atau `Sesi Dua` untuk setiap Fakultas.
  - Perubahan disimpan dengan tombol **Simpan** (bukan auto-save).
  - Setelah berhasil disimpan: dialog tertutup otomatis, cache Redis semua NIM di fakultas terkait dihapus secara massal (Redis Pipeline), dan tabel `prodi` juga ikut diperbarui kolom `sesi`-nya.
- **Generate Nomor Urut & ID Undangan** (tombol kuning `Nomor`):
  - Men-generate kolom `urut`, `id_undangan`, dan `qr_undangan` untuk wisudawan berstatus **Terdaftar** di periode aktif yang sudah memiliki Sesi.
  - Proses selalu **mereset** nomor lama terlebih dahulu, lalu generate ulang dari awal berdasarkan urutan: **Sesi → Urutan Prodi (kolom `urutan`) → Tanggal Yudisium**.
  - Nomor urut selalu reset ke 1 di setiap Sesi baru.
  - **Format ID Undangan baru**: `UND_[Periode]_[Sesi]_[Urut 3 digit]_[NIM]`.
    - Contoh: `UND_ANGKATAN-XVII-TAHUN-2026_Sesi-Satu_001_20200050001`
  - Dialog 4 fase: Konfirmasi → Loading (spinner + skeleton animasi) → Hasil breakdown per Sesi/Fakultas/Prodi → Error (dengan tombol Coba Lagi).
- **Export Daftar XLSX** (tombol teal `Daftar`):
  - Mengekspor data wisudawan *terdaftar* ke dalam file `.xlsx` dengan **tiga tab** (Sheet): **Sesi Satu**, **Sesi Dua**, dan **Rekap**.
  - Setiap tab sesi mengelompokkan wisudawan per Fakultas (header baris Nama Fakultas kapital + baris header tabel), diurutkan berdasarkan Nomor Urut terkecil.
  - Tab Rekap akan otomatis menghitung statistik Total Terdaftar, Distribusi Ukuran Toga, Distribusi Jenis Kelamin, dan Sebaran IPK di level per Fakultas & Prodi.
  - Kolom Sesi: `No | NAMA | NIM | IPK | Predikat | Prodi`. Menggunakan nama mahasiswa **dengan Gelar**.
  - Proses sepenuhnya *client-side* (tanpa beban server/database).
- **Generate Slide PPTX** (tombol violet `Slide`):
  - Men-generate file presentasi PowerPoint (`.pptx`) berukuran 1080×1920px (portrait) untuk keperluan penayangan di layar acara/videotron.
  - Proses sepenuhnya *client-side* menggunakan `pptxgenjs`.
  - Berisi informasi wisudawan: Nomor Urut, Foto (fetch otomatis dari Google Drive via lh3.googleusercontent dengan *fallback*), Nama lengkap (Title Case 48 pt), NIM, Prodi, Fakultas, IPK, dan Predikat (Title Case di dalam label pastel).
  - Memiliki fitur desain pintar: **Badge Bundar (5 cm)** di pojok kiri atas bingkai (otomatis mengambil singkatan resmi Prodi dari DB) dan ornamen pembatas teks `◈ ━━━━━━ ◈`.
  - Mengambil setting *Warna Tema* dan *Bingkai* secara dinamis berdasarkan fakultas dari `app_settings`.
- **Generate Buku Album Wisudawan** (tombol indigo `Album`) *(Baru)*:
  - Membuka dialog modal dengan pilihan Fakultas (opsional) dan opsi centang "Sertakan Foto Asli".
  - Menghasilkan dokumen format **tiga kolom**: Area Foto | Detail Data (NAMA, NIM, FAKULTAS, PRODI) | Area Tanda Tangan (nomor urut + garis).
  - Menyediakan tiga pilihan format ekspor:
    - 🔴 **Export PDF** — Dokumen siap cetak menggunakan `@react-pdf/renderer`.
    - 🔵 **Export Word (DOCX)** — Dokumen yang dapat diedit ulang menggunakan library `docx`.
    - 🟢 **Export Excel (XLSX)** — Spreadsheet dengan penyisipan foto per baris menggunakan `exceljs`.
  - Data diurutkan sesuai: **Fakultas → Urutan Prodi (dari pengaturan) → Nomor Urut**.
  - Jika opsi foto dimatikan, Area Foto menampilkan kotak kosong "3x4" sebagai panduan *placeholder* dan dokumen dihasilkan instan (tanpa proses unduh foto).
  - Jika opsi foto diaktifkan, foto diunduh satu per satu dari Google Drive dengan *progress bar* yang menampilkan kemajuan secara real-time.
  - Proses sepenuhnya *client-side* — nol beban server Vercel maupun Supabase.
- **Cetak Label Nama Dada** (tombol indigo `Tag`):
  - Membuka **modal pemilihan Fakultas** yang menampilkan jumlah total wisudawan terdaftar untuk fakultas yang dipilih.
  - Menghasilkan file PDF berukuran **Folio (F4) Landscape** (`330mm × 215mm`) berisi **12 label** per halaman (grid 3 kolom × 4 baris), tanpa jarak antar label.
  - **Desain label dua kolom**: Panel kiri merah maroon (Nomor Urut 3-digit besar + Singkatan Fakultas-Prodi), panel kanan putih (logo IAIN Bone + Nama + NIM + teks footer wisuda).
  - Proses sepenuhnya *client-side* menggunakan `@react-pdf/renderer`, tanpa beban server Vercel maupun Supabase.
- **Interaksi Tabel**: Baris tabel wisudawan dapat diklik untuk membuka **Halaman Detail Wisudawan**.
- **Import Batch via Excel**: Unggah file `.xlsx` untuk memasukkan data massal.
  - Template mencakup auto-fill data contoh dan *sheet* Master Fakultas.
  - Dilengkapi fitur **Fuzzy-Match Validation** untuk mencocokkan & memperbaiki otomatis ejaan Fakultas/Prodi.
  - **Validasi Wajib Isi**: Sistem menolak baris yang kosong pada kolom esensial (NIM, Nama, IPK, Predikat, Fakultas, Prodi, Tanggal Yudisium). Kolom Ukuran Toga bersifat opsional.
  - **Parsing Tanggal Khusus**: Membaca file Excel dalam mode *Raw Text* secara ketat untuk kolom Tanggal Yudisium. Wajib berformat **`YYYY-MM-DD`** secara visual pada sel Excel (contoh: `2026-05-13`) untuk mencegah inkonsistensi zona waktu. Format lain akan ditolak secara otomatis.
- **Export Multi-format (Dropdown)**: Unduh seluruh data (termasuk filter yang sedang aktif) melalui menu dropdown cerdas yang menyediakan 4 pilihan format: `.xlsx`, `.csv`, `.sql` (perintah single-insert), dan `.json`. Pilihan CSV, SQL, dan JSON dilindungi otorisasi khusus dan hanya bisa diakses oleh role `superadmin` atau `admin_institut`.
- **Kolom Aksi Cepat**:
  - 👁️ **Lihat Profil** — pratinjau profil.
  - 🔑 **Reset Password** — reset password ke default.
  - 🗑️ **Hapus Data Satuan / Massal** — hapus permanen wisudawan secara individual maupun **hapus massal (bulk delete)** menggunakan kotak centang untuk wisudawan yang belum mendaftar. (Otomatis menghapus foto di Google Drive via GAS dan membersihkan cache Upstash Redis).

### Detail Wisudawan (`/admin/wisudawan/[nim]`)
Halaman detail khusus panel admin dengan desain *full-width* minimalis.
- **Header Dinamis**: Menampilkan identitas (NIM - Nama).
- **Data Lengkap**: Informasi akun, data akademik, toga, hingga log status riwayat.
- **QR Code Interaktif**: QR Undangan & Toga yang bisa diklik untuk diperbesar, terintegrasi dengan logo institusi di bagian tengah.
- **Panel Aksi**:
  - **Edit Data**: Mengarahkan ke form edit data khusus admin yang komprehensif.
  - **Reset Password**: Tombol *quick-action* reset sandi ke password default.
  - **Hapus**: Tombol hapus data wisudawan dengan dialog konfirmasi (turut menghapus foto di Google Drive).

### Rekapitulasi Toga (`/admin/toga`)
Halaman khusus panitia untuk pengelolaan kebutuhan ukuran Toga dengan layout tabel *full-width*. Halaman dibagi menjadi **tiga tab**:

#### Tab Rekapitulasi
- **Progress Pengisian Toga**: Membandingkan "Total Data" (keseluruhan data pendaftar yang di-*input* admin pada periode aktif) melawan jumlah pendaftar yang "Sudah Isi" dan "Belum Isi" ukuran toga per fakultas.
- **Rekapitulasi Ukuran**: Ringkasan jumlah Toga yang dibutuhkan per Fakultas untuk masing-masing ukuran (S, M, L, XL, dll).
- **Export Excel**: Tombol khusus "Export XLSX" yang akan mengunduh file `.xlsx` berisi dua tab:
  - *Data Toga*: List lengkap Nama, Fakultas, dan Ukuran Toga wisudawan.
  - *Rekapitulasi*: Rangkuman statistik jumlah toga per fakultas dan ukuran.

#### Tab Pengaturan
- Admin dapat mengatur waktu pengambilan toga per Fakultas dan tempat pengambilan toga global untuk periode aktif.

#### Tab Scan Toga
Modul pemindai QR untuk mencatat pengambilan toga. Lihat bagian **[Scan QR Toga & Kehadiran](#scan-qr-toga--kehadiran)** untuk detail.

### Manajemen Admin (`/admin/manajemen-admin`) — *Superadmin Only*
- Lihat semua admin beserta role, status, unit kerja, dan waktu login terakhir.
- **Tampilan Responsif Mobile**: Daftar admin dirender sebagai barisan Kartu (Card) dengan label Role dan Status yang disusun padat sejajar dengan tombol aksi.
- **Tambah admin baru**: Masukkan Nama Lengkap, Email Google, Role, dan Unit Kerja (Password tidak lagi dibutuhkan karena menggunakan Google Login).
- **Toggle aktif/nonaktif** akun admin.
- **Ubah role** admin melalui tombol Edit.
- **Hapus admin** secara permanen.

### Perbaikan Data Wisudawan (`/admin/perbaikan`)
Halaman pengelolaan semua pengajuan perbaikan data akademik yang diajukan wisudawan.
- **Filter Status**: Tab filter *Semua*, *Proses*, *Diterima*, *Ditolak* disertai hitungan.
- **Pencarian**: Cari berdasarkan NIM atau nama wisudawan.
- **Card per Pengajuan**: Menampilkan identitas wisudawan, status badge, timestamp, dan isi detail pengajuan.
- **Aksi Respon**:
  - ✅ **Terima**: Ubah status menjadi `diterima`, opsional isi catatan admin.
  - ❌ **Tolak**: Ubah status menjadi `ditolak`, opsional isi catatan admin.
- Catatan admin yang diisi akan tampil di sisi wisudawan pada riwayat pengajuan mereka.

> ⚠️ Halaman ini menampilkan pengajuan dari seluruh wisudawan. Perubahan data aktual di tabel `wisudawan` masih harus dilakukan secara manual oleh Admin melalui form Edit Data Wisudawan.

### Prestasi Akademik (`/admin/prestasi`)
Halaman peringkat otomatis wisudawan berprestasi berdasarkan IPK tertinggi dan tanggal yudisium terlama.
- **Wisudawan Terbaik Institut**: Banner emas di bagian atas menampilkan peraih IPK tertinggi secara keseluruhan (kecuali Pascasarjana), lengkap dengan nama gelar, NIM, IPK, Predikat, Prodi, Fakultas, dan Tgl Yudisium.
- **Tabel Peringkat per Fakultas**: Tabel lengkap menampilkan Top 3 wisudawan terbaik per Fakultas dengan kolom: Peringkat, NIM, Wisudawan, Program Studi, Capaian Akademik, Tgl Yudisium, dan Opsi.
- **Warna Baris Peringkat**: Setiap baris diberi warna latar dan garis kiri berwarna sesuai medali:
  - 🥇 **Peringkat 1** — latar kuning emas (amber) + garis kiri amber
  - 🥈 **Peringkat 2** — latar abu-abu perak (slate) + garis kiri slate
  - 🥉 **Peringkat 3** — latar oranye perunggu + garis kiri amber-700
- **Tombol Generate**: Menghitung ulang peringkat dari awal berdasarkan IPK + Tanggal Yudisium, menyimpan hasilnya ke kolom `prestasi_akd` di tabel `wisudawan`. **Setiap kali Generate ditekan, seluruh override manual di-reset** dan sistem kembali ke perhitungan murni.
- **Override Manual**: Tombol **Ganti Wisudawan** di setiap baris memungkinkan admin mengganti pemenang secara manual. Override disimpan sementara di `app_settings` dengan key `prestasi_override_[periode]` sebagai "aturan pengecualian" agar tidak bertabrakan saat ada beberapa penggantian berurutan.
- **Print Sertifikat (PDF)**: Tombol "Print Sertifikat" men-generate file PDF `PIAGAM PENGHARGAAN` bergaya resmi untuk setiap wisudawan yang `prestasi_akd`-nya terisi (tidak null). Fitur ini:
  - Menggunakan `@react-pdf/renderer` — menghasilkan PDF asli dengan teks yang bisa diseleksi dan dicopy.
  - Data penandatangan (Nomor SK, Jabatan, NIP, Nama) diambil dari menu Pengaturan → Prestasi.
  - Tanggal dan Tempat Pelaksanaan diambil otomatis dari data **Periode aktif** di database.
  - **Latar Belakang Kustom**: Jika URL background telah diisi di Pengaturan → Prestasi, gambar tersebut dirender sebagai *layer* belakang sertifikat (bukan halaman terpisah).
  - **Tanda Tangan Digital**: Gambar tanda tangan pejabat (upload dari Pengaturan → Prestasi) dirender sebagai *overlay* di area tanda tangan, di belakang teks nama dan jabatan, sehingga tidak menutupi identitas penandatangan.
  - **Format Paragraf**: Kalimat penghargaan otomatis menyertakan nama **Fakultas** wisudawan (misal: "Wisudawan Terbaik Ketiga Fakultas Tarbiyah" atau "Wisudawan Terbaik Ketiga Pascasarjana").
  - Semua PDF dikemas menjadi satu file `.zip` oleh `jszip` dan diunduh otomatis.
  - **Format nama file**: `Sertifikat-AKD_[Fakultas]_[Sebutan]_[NIM]_[Nama Mahasiswa].pdf`.
  - Progress generate ditampilkan real-time di tombol (contoh: "Memproses 3/16 PDF...").
- **Generate Slide PPTX (Prestasi)**: Tombol "Slide" men-generate file presentasi khusus untuk wisudawan peraih prestasi akademik:
  - Proses *client-side* murni, membuat 1 file slide lintas-fakultas secara bersamaan.
  - Secara otomatis mem-filter dan hanya men-generate slide untuk wisudawan yang memiliki data prestasi.
  - Menggunakan desain khusus: tanpa teks Judul Penelitian, warna teks bottom-half berwarna putih, dan penambahan ornamen *setengah lingkaran raksasa (diameter 45 cm)* di posisi terbawah slide yang mengikuti warna tema masing-masing Fakultas.
  - Fitur *Title Case*, label IPK pastel, dan bingkai foto tetap dipertahankan seperti pada fitur slide utama.
- **Export XLSX**: Tombol Export di kanan atas menghasilkan file Excel berisi dua sheet:
  - *Prestasi Akademik*: Peringkat Institut + peringkat per Fakultas, kolom NIM, IPK, Tgl Yudisium, Fakultas, Prodi, Status.
  - *Pengalaman Organisasi*: Data Ormawa & jabatan wisudawan terpilih.

### Informasi Wisuda (`/admin/informasi`)
Halaman referensi cepat yang menampilkan informasi publik wisuda untuk semua periode — **read-only**, tersedia untuk semua role admin.
- Setiap periode ditampilkan sebagai kartu ringkas dengan status badge, detail jadwal, dan countdown pendaftaran real-time.
- Countdown dihitung dari `tanggal_pendaftaran` periode dan ditampilkan dengan warna hijau emerald (aktif) atau abu-abu (tidak aktif).
- Informasi yang ditampilkan: Tanggal & Tempat Pelaksanaan, Sesi 1 & 2, Jadwal Gladi, Pengumuman, dan Catatan Pendaftaran.

### Tamu VIP (`/admin/tamu`)
Halaman manajemen tamu undangan VIP eksternal. Tersedia 2 fungsionalitas utama:
- **Daftar Tamu**: Menambah, mengedit, menghapus, serta melihat daftar tamu secara *real-time*. Mendukung fitur **Export Excel** dan **Cetak Undangan Massal (Generate PDF)** yang berisi Nomor, Nama, Jabatan, QR Code unik, dan tata tertib, yang disesuaikan formatnya dari menu Pengaturan.
- **Scan Kehadiran**: Pindai QR Code tiket undangan tamu menggunakan kamera secara langsung atau pencarian ID manual. Dilengkapi layout floating navigation untuk berpindah antara scan Tamu VIP dan Scan Wisuda di perangkat mobile.

### Scan QR Toga & Kehadiran

Fitur pemindai QR berkecepatan tinggi untuk hari pelaksanaan toga dan wisuda. Menggunakan arsitektur **Redis-first** untuk latensi minimal.

#### Scan Toga (`/admin/toga?tab=scan`)
Digunakan ~5 hari sebelum wisuda untuk mencatat pengambilan toga.
- **Cara kerja**: Pindai `qr_toga` (berisi `id_wisuda`) dari tiket wisudawan.
- **Tampilan hasil**: Ukuran toga ditampilkan dengan font besar agar mudah dibaca operator.
- **Validasi**:
  - Tolak jika ukuran toga belum diisi (`toga_not_filled`).
  - Tolak jika wisudawan sudah pernah mengambil toga (`already_taken`).
- **Tombol "Cache" (ikon Database)**: Wajib diklik sebelum sesi scan dimulai untuk menarik data ke Redis.
- **Input NIM Manual**: Ketik NIM langsung di kolom pencarian (tampil saat kamera aktif) lalu tekan Enter atau ikon 🔍 untuk proses kehadiran tanpa QR.
- **Layout Dua Kolom (Desktop)**: Saat dibuka di PC/Laptop, tampilan terbagi:
  - **Kolom Kiri**: Area kamera full-height dengan tombol kendali (Cache / Scan, atau input NIM / Off).
  - **Kolom Kanan**: Tabel riwayat scan toga terbaru (Waktu, NIM, Nama, Prodi) yang diperbarui real-time.

#### Scan Kehadiran (`/admin/kehadiran`)
Digunakan pada hari wisuda untuk mencatat kehadiran.
- **Cara kerja**: Pindai `qr_undangan` (berisi `id_undangan`) dari tiket undangan.
- **Validasi Format**: Wajib berawalan `UND_`. Jika tidak, akan ditolak (menghindari salah scan tiket lain).
- **Validasi Sesi**: Admin memilih "Sesi Aktif" (tombol bulat 1 atau 2). Sistem menolak wisudawan yang sesinya tidak sesuai.
- **Validasi Double-scan**: Tolak jika wisudawan sudah tercatat hadir.
- **Tombol "Cache"**: Wajib diklik sebelum sesi scan dimulai.
- **Input NIM Manual**: Ketik NIM langsung di kolom pencarian.
- **Badge Info Bawah Tengah**: Menampilkan Sesi aktif dan jumlah data cache beserta **waktu cache terakhir diambil** (contoh: `5 data • 12:00`).
- **Layout Dua Kolom (Desktop)**: Tampilan terbagi:
  - **Kolom Kiri (Kamera)**: Menggunakan rasio *portrait* (`aspectRatio: 0.75`) secara default. *qrbox* (kotak scan) beradaptasi dinamis lebih lebar (`85%`) di layar mobile dengan `min-h-[50vh]`.
  - **Kolom Kanan**: Tabel riwayat kehadiran terbaru yang diperbarui real-time.
- **Export XLSX**: Tombol **Export** di pojok kanan atas panel "Riwayat Kehadiran Terbaru" (desktop) memungkinkan admin mengunduh data kehadiran lengkap (tanpa limit) dalam format `.xlsx` dengan dua sheet:
  - *Kehadiran*: Daftar lengkap seluruh wisudawan hadir (No, NIM, Nama, Fakultas, Prodi, Sesi, Waktu Hadir).
  - *Rekap*: Rekapitulasi jumlah kehadiran per Fakultas & Prodi beserta subtotal per Fakultas dan grand total.

#### Arsitektur Teknis Scan

[Admin klik "Ambil Cache"]
       │
       └─ warmUpTogaCache() / warmUpUndanganCache()
              │
              ├─ Fetch kolom minimal dari Supabase
              └─ Simpan ke Redis via pipeline (Proses Chunking per 200 data):
                   scan:toga:[id_wisuda]     = { nim, nama, toga, waktu_toga, ... } [EX: 172800]
                   scan:undangan:[id_undangan] = { nim, nama, sesi, waktu_hadir, ... } [EX: 172800]
                   scan:meta:toga / scan:meta:undangan = { cached_at, total, periode } [EX: 172800]

[Admin Aktifkan Kamera] → Mulai html5-qrcode (Delay 500ms mencegah React Strict Mode hardware-lock)

[Admin scan QR] → POST /api/scan/toga atau /api/scan/undangan
       │
       ├─ redis.get(scan:toga:[id]) — lookup instant (< 50ms)
       ├─ Validasi: format prefix, toga ada? sesi cocok? sudah discan?
       ├─ redis.set(scan:toga:[id], { ...data, waktu_toga: now }) — atomic update
       └─ supabase.update({ waktu_toga: now }) — fire-and-forget (background)
              │
              └─ Response HTTP dikembalikan tanpa menunggu Supabase selesai

| Key Redis | TTL | Isi |
|---|---|---|
| `scan:toga:[id_wisuda]` | 2 Hari (172800 detik) | Data wisudawan untuk lookup toga |
| `scan:undangan:[id_undangan]` | 2 Hari (172800 detik) | Data wisudawan untuk lookup kehadiran |
| `scan:meta:toga` | 2 Hari (172800 detik) | `{ cached_at, total, periode }` |
| `scan:meta:undangan` | 2 Hari (172800 detik) | `{ cached_at, total, periode }` |

---

## 5. Setup Awal Admin (Wajib Dilakukan Sekali)

### Langkah 1: Jalankan SQL Migration
Buka **Supabase Dashboard → SQL Editor**, tempel dan jalankan isi file `db_migration.sql`.

> File ini membuat tabel `admin_users`, `app_settings`, dan seluruh RLS policies yang diperlukan.

### Langkah 2: Isi Service Role Key
Dari **Supabase Dashboard → Settings → API → `service_role` key**:
```
SUPABASE_SERVICE_ROLE_KEY=eyJ...dari_supabase_dashboard...
```
> ⚠️ **Jangan** commit key ini ke git.

### Langkah 3: Buat Admin Pertama via Halaman Setup
```
http://localhost:3000/setup
```
Isi **nama lengkap** dan **email Google** Anda. (Password tidak perlu diisi karena akan di-generate otomatis oleh backend).
Klik **"Buat Superadmin"**. Setelah selesai, Anda bisa langsung login dengan Google.

> ✅ Halaman `/setup` otomatis tidak bisa diakses lagi setelah admin pertama berhasil dibuat.

---

## 6. File-File Auth Admin

| File | Fungsi |
|---|---|
| `src/app/api/auth/[...nextauth]/route.ts` | Konfigurasi NextAuth API Endpoint |
| `src/lib/auth.ts` | NextAuth Options & logika validasi akun (`signIn` callback memeriksa `admin_users`) |
| `src/middleware.ts` | Proteksi rute `/admin` — validasi JWT `getToken()` |
| `src/actions/adminAuth.ts` | `loginAdmin`, `logoutAdmin`, `getAdminSession` |
| `src/actions/adminUsers.ts` | CRUD daftar admin (invite, toggle, delete, update role) |
| `src/actions/settings.ts` | `getSetting`, `updateSetting` — baca/tulis tabel `app_settings` |

---

## 7. Server Actions

| Action File | Fungsi |
|---|---|
| `adminAuth.ts` | Autentikasi admin |
| `adminUsers.ts` | Manajemen daftar admin |
| `periode.ts` | Pengaturan periode wisuda |
| `settings.ts` | Konfigurasi sistem & feature toggles |
| `wisudawan.ts` | Data wisudawan, login (hashed password), daftar wisuda, import batch, reset password |
| `perbaikan.ts` | CRUD pengajuan perbaikan data wisudawan; invalidate cache `wisudawan:[nim]` saat status diperbarui |
| `sesi.ts` | Penetapan Sesi per Fakultas; update massal `wisudawan.sesi` & `prodi.sesi`; invalidate cache NIM massal via Redis Pipeline |
| `prodi.ts` | CRUD master data prodi; `updateProdiOrder` — batch update kolom `urutan` untuk drag-and-drop |
| `nomorUndangan.ts` | Generate nomor urut & ID undangan (format `UND_[Periode]_[Sesi]_[Urut]_[NIM]`); reset `urut`/`id_undangan`/`qr_undangan`; batch update + invalidasi Redis Pipeline massal |
| `scanCache.ts` | **[Baru]** `warmUpTogaCache` & `warmUpUndanganCache` — pipeline Redis warm-up dari Supabase; `getScanMeta` — baca status cache |
| `scanHistory.ts` | **[Baru]** `getRecentScans` — fetch 20 data scan kehadiran/toga terbaru dari Supabase untuk kolom riwayat di desktop |
| `prestasiOverrides.ts` | `generatePrestasi` (reset override + hitung ulang), `setPrestasiOverride` / `removePrestasiOverride` (simpan/hapus override manual), `syncPrestasiAkdToDb` (batch update kolom `prestasi_akd` ke Supabase) |

---

## 8. API Routes Scan (Edge-Compatible)

| Route | Method | Fungsi |
|---|---|---|
| `/api/scan/toga` | POST | Lookup `id_wisuda` atau `nim` dari Redis, validasi, catat `waktu_toga` |
| `/api/scan/undangan` | POST | Lookup `id_undangan` atau `nim` dari Redis, validasi sesi, catat `waktu_hadir` |

Kedua route ini menggunakan **Next.js Route Handlers** (bukan Server Actions) untuk overhead minimal. Update ke Supabase dilakukan secara **fire-and-forget** agar response HTTP dikembalikan segera setelah Redis diperbarui.

---

## 8. Notifikasi Toast Global

Seluruh aksi admin (simpan, hapus, error validasi) menggunakan sistem **Toast Notifikasi Global** yang terpusat di `src/components/ui/Toast.tsx`.
- Posisi: **tengah layar** (bukan pojok).
- Tipe: `success` (emerald), `error` (rose), `info` (blue).
- Fitur: ikon besar, *progress bar* otomatis, tombol tutup manual, animasi spring.
- API: `const { showToast } = useToast()` — digunakan di semua Client Component.
