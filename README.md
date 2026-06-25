# Portal Wisuda IAIN Bone

Aplikasi web portal pendaftaran dan informasi wisuda resmi untuk **Institut Agama Islam Negeri (IAIN) Bone**. Proyek ini dibangun menggunakan **Next.js (App Router)** dengan desain modern minimalis.

## 🚀 Fitur Utama

- **Desain Modern & Responsif**: Palet *emerald* dan *slate* premium dengan dukungan Dark Mode penuh.
- **Autentikasi Wisudawan Aman**:
  - *Calon Wisudawan* → login pakai password default (dikonfigurasi admin).
  - **Setup Akun Wajib (First-Time Login)**: Jika wisudawan login dengan password default, sistem mengarahkan ke halaman `/setup/[nim]` untuk mengisi **Email, Ukuran Toga (otomatis terisi dari database utama tanpa cache), dan Password Baru** sebelum bisa masuk ke profil.
  - *Wisudawan Terdaftar* → login pakai password kustom yang di-**hash** (SHA-256 + salt).
  - Tombol **"Cek Status Pendaftaran kamu"** di halaman login untuk cek NIM tanpa perlu login.
- **Autentikasi Admin Aman**: Login admin terpusat via **NextAuth.js (Google Provider)** — session menggunakan JWT. Akses dibatasi ketat berdasarkan kecocokan email Google dengan database `admin_users`. Terdapat jalur alternatif khusus **Token Presensi** (`absensi_token`) untuk panitia lapangan (Role Admin Absensi) agar dapat mengakses Scanner Kehadiran dan Scanner Tamu secara instan tanpa login Google.
- **Panel Admin Terintegrasi**: Dashboard admin (`/admin`) untuk mengelola periode wisuda, data wisudawan, pengaturan sistem, dan akun admin. Header admin dilengkapi **tombol Keluar cepat** di samping ikon profil untuk logout instan tanpa membuka *dropdown*.
- **Halaman Informasi Wisuda** (`/admin/informasi`): Halaman referensi cepat yang menampilkan detail jadwal wisuda semua periode untuk semua role admin — dilengkapi **Countdown Pendaftaran real-time** yang dihitung dari `tanggal_pendaftaran` periode aktif.
- **Dashboard Statistik Canggih (3-Layer Drill-down)**: Halaman utama Admin menyajikan statistik komprehensif (Tren Pendaftaran, Jenis Kelamin, Predikat, Partisipasi Ormawa, Status Toga, Kehadiran, Sebaran IPK, Sesi, Prestasi, dan Kepatuhan Survei).
  - Dilengkapi fitur *Interactive Drill-down* otomatis (Universitas → Fakultas → Prodi) hanya dengan mengklik baris tabel.
  - Memiliki fitur **Export XLSX 12 Sheet** yang mengekspor seluruh rekapan statistik secara berurutan dan terstruktur sampai ke level Prodi.
- **Feature Toggles Real-time**: Admin dapat mengaktifkan/nonaktifkan fitur (edit profil, tampilkan toga/undangan, izinkan perbaikan, dll.) yang langsung aktif di halaman wisudawan tanpa cache delay.
- **Manajemen Wisudawan Lanjutan**: Halaman tabel interaktif dengan toolbar terpadu satu baris (pencarian + tombol aksi bergaya *Tag Cloud*), filter Fakultas/Prodi, import massal (beserta template cerdas, validasi auto-correct *Fuzzy Match*, **validasi wajib isi**, dan **dukungan format tanggal Indonesia**), export Excel, **hapus data satuan maupun massal** (otomatis bersihkan foto di Drive dan cache Redis), edit data lengkap, dan reset password.
  - **Tampilan Responsif Mobile Terbaik**: Mengganti tabel horizontal dengan barisan **Card View** padat dan efisien untuk layar *smartphone*. Info ringkasan data ditampilkan rapat tanpa jeda berlebih, ditambah dukungan klik langsung pada Card untuk navigasi profil yang instan. Tombol aksi (Tambah, Export, Sesi, dll.) berubah menjadi deretan ikon ringkas bergaya *Tag Cloud* atau **Panel Aksi Mengambang (Floating Action Bar)** di bawah layar untuk kenyamanan sentuhan jempol (*thumb-zone*).
  - **Manajemen Admin Lanjutan**: Daftar admin tersusun rapi berdasarkan hierarki otorisasi otomatis (Superadmin → Admin Institut → Admin Unit).
  - **Filter Collapsible (Mobile)**: Seluruh dropdown filter otomatis diciutkan dalam grup "Filter Data" pada tampilan *mobile* agar rapi dan tidak memenuhi layar.
  - **Filter Dinamis SPA (Single Page Application)** *(Baru)*:
    - Proses pencarian dan filter berjalan 100% di *client-side* tanpa memicu *loading* server atau perubahan URL parameter, sehingga navigasi terasa sangat instan dan beban memori server Vercel berkurang drastis.
    - Pemilihan *dropdown* (Fakultas, Prodi, Status, Sesi, dll.) langsung berefek seketika.
    - Tombol **Cari** (atau tombol *Enter*) secara spesifik menyatu di dalam kolom input untuk pencarian teks (NIM/Nama) agar menghindari *stuttering* performa saat mengetik panjang.
    - Di layar *mobile*, seluruh filter dropdown secara cerdas dikelompokkan dalam satu tombol toggle **Filter Data** (*collapsible*) dengan status default tertutup.
    - **Status Toga** — memunculkan kolom `Uk Toga` di tabel secara dinamis ketika diaktifkan.
    - **Filter Sesi** (`Sesi Satu` / `Sesi Dua` / `Tanpa Sesi`) — memunculkan kolom `Sesi` di tabel secara dinamis ketika diaktifkan. Tombol reset (✕) muncul ketika ada filter aktif.
- **Pengumuman Resmi Periode (PDF)** *(Baru)*: Admin dapat mengunggah file PDF pengumuman resmi saat mengedit Periode Wisuda. Tombol unduh otomatis muncul di profil setiap wisudawan yang terdaftar di periode tersebut.
- **Export Daftar Wisudawan (XLSX)** — Tombol teal **Daftar** mengekspor data wisudawan *terdaftar* ke file `.xlsx` dengan 3 tab (Sesi Satu, Sesi Dua, dan **Rekap**). Tab Rekap menyajikan rekapitulasi data otomatis (Total Wisudawan, Ukuran Toga, Jenis Kelamin, dan Distribusi IPK) per Fakultas & Prodi. Proses 100% *client-side*.
- **Generate Slide PPTX** *(Diperbarui)* — Tombol violet **Slide** menghasilkan presentasi PowerPoint (`.pptx`) berukuran 1080×1920px (portrait) untuk layar LED. Slide di-generate per Fakultas, berisi foto wisudawan, nomor urut, nama (Title Case), NIM, Prodi, IPK, dan Predikat (dalam label warna pastel). Dihiasi fitur desain pintar: **Badge Bundar (5 cm)** di sudut kiri atas foto, ornamen teks pembatas `◈ ━━━━━━ ◈`, dan bingkai kustom otomatis menyesuaikan fakultas dari pengaturan *app_settings*.
- **Generate Buku Album Wisudawan** *(Baru)* — Tombol indigo **Album** menghasilkan dokumen berformat tiga kolom (Area Foto | Data: Nama/NIM/Fakultas/Prodi | Area Tanda Tangan) dengan tiga pilihan format ekspor:
  - **PDF** — Siap cetak via `@react-pdf/renderer`, teks dapat diseleksi.
  - **Word (.docx)** — Format yang dapat diedit ulang, menggunakan library `docx`.
  - **Excel (.xlsx)** — Spreadsheet dengan penyisipan foto otomatis per sel, menggunakan `exceljs`.
  - Data diurutkan berdasarkan **Fakultas → Urutan Prodi (sesuai pengaturan) → Nomor Urut**.
  - Opsi centang **"Sertakan Foto Asli"** untuk menyertakan foto wisudawan atau cukup kotak kosong 3×4 sebagai *placeholder*.
  - Dilengkapi *progress bar* saat proses unduh foto berlangsung.
  - Proses sepenuhnya *client-side* — nol beban server Vercel maupun Supabase.
- **Generate Slide PPTX (Prestasi)** *(Baru)* — Tombol violet **Slide** di halaman Prestasi menghasilkan file slide PowerPoint khusus untuk wisudawan peraih prestasi akademik secara serentak lintas fakultas. Mem-filter otomatis wisudawan berprestasi dan mengaplikasikan desain khusus: tanpa teks Judul Penelitian, teks area bawah warna putih, dan ornamen setengah lingkaran raksasa (diameter 45 cm) di dasar slide dengan warna sesuai tema fakultas.
- **Cetak Label Nama Dada (PDF)** — Tombol indigo **Tag** membuka modal pilihan Fakultas, lalu menghasilkan PDF **Folio (F4) Landscape** berisi **12 label per halaman** (grid 3×4) tanpa spasi antar label. Desain label dua kolom: kiri merah maroon (nomor urut 3-digit + singkatan Fakultas-Prodi), kanan putih (logo IAIN Bone + Nama + NIM + footer periode). Proses *client-side* menggunakan `@react-pdf/renderer` — nol beban server Vercel maupun Supabase.
- **Penugasan Periode Otomatis**: Kolom `periode` wisudawan diisi **saat Admin mengimpor data**, bukan saat mahasiswa mendaftar, sehingga pengelompokan periode sudah dipatenkan sejak unggah.
- **Manajemen Sesi Wisuda per Fakultas** *(Baru)*:
  - Admin dapat menetapkan `Sesi Satu` atau `Sesi Dua` per Fakultas melalui dialog khusus di halaman daftar wisudawan (tombol ungu **Sesi**).
  - Penetapan sesi memperbarui kolom `sesi` di tabel `wisudawan` (semua NIM dalam fakultas) **dan** tabel `prodi` secara bersamaan.
  - Cache Redis semua NIM yang terpengaruh dihapus secara massal via **Redis Pipeline** agar data langsung tampil terbaru.
  - Setelah berhasil simpan, dialog tertutup otomatis dan notifikasi sukses muncul.
- **Generate Nomor Urut & ID Undangan** *(Diperbarui)*:
  - Tombol **Nomor** (kuning-amber) di samping tombol Sesi di halaman daftar wisudawan.
  - Proses men-generate `urut`, `id_undangan`, dan `qr_undangan` untuk wisudawan berstatus **Terdaftar**, periode aktif, dan sesi terisi.
  - Logika pengurutan: **Sesi → Urutan Prodi (kolom `urutan`) → Tanggal Yudisium**. Nomor reset dari 1 di setiap sesi baru.
  - **Format baru**: `UND_[Periode]_[Sesi]_[Urut 3 digit]_[NIM]` (contoh: `UND_ANGKATAN-XVII-TAHUN-2026_Sesi-Satu_001_20200050001`).
  - Dialog interaktif 4 fase: Konfirmasi → Loading (spinner + skeleton) → Hasil (breakdown per Sesi/Fakultas/Prodi) → Error.
  - Batch update 50 rows dan invalidasi Redis Pipeline massal setelah selesai.
- **Manajemen Master Data Prodi & Urutan** *(Baru)*:
  - Halaman Fakultas (`/admin/fakultas`) menampilkan kolom **Urutan** (numerik) dan kolom **Sesi**.
  - Drag-and-drop untuk mengatur urutan baris Prodi secara visual; urutan disimpan ke kolom `urutan` di tabel `prodi`.
  - Tombol **Simpan** dan **Batal** muncul di sticky bar bawah saat ada perubahan urutan yang belum disimpan.
  - Kolom Urutan ini menjadi acuan dalam Generate Nomor Urut wisudawan.
- **Scan QR Code Berkecepatan Tinggi** *(Diperbarui)*:
  - **Scan Toga** (`/admin/toga?tab=scan`): Memindai `qr_toga` (wajib mengandung `_`) untuk mencatat pengambilan toga.
    - Tampilkan **Ukuran Toga** besar agar mudah dibaca operator.
    - Validasi: tolak jika toga belum diisi, atau jika sudah pernah diambil (double-scan).
  - **Scan Kehadiran** (`/admin/kehadiran`): Memindai `qr_undangan` (wajib format `UND_`) untuk mencatat kehadiran di hari H.
    - Validasi **Sesi**: Sistem otomatis menolak wisudawan yang sesinya tidak sesuai dengan sesi aktif yang dipilih admin (Tombol bulat terpisah Sesi 1 / 2).
    - Validasi double-scan: tolak jika wisudawan sudah tercatat hadir.
  - **Input NIM Manual**: Saat kamera aktif, kolom input NIM, tombol 🔍 (cari), dan tombol 📷 (off kamera) tersusun responsif. Ketik NIM lalu Enter untuk proses tanpa QR.
  - **Kamera Potrait Responsif**: Menggunakan default *aspect ratio portrait* (3:4) dan ukuran *qrbox* yang dinamis menyesuaikan layar *mobile*. Resolusi masalah "kamera terkunci" *(React Strict Mode)* ditangani dengan hardware-release delay.
  - **Floating UI & Tabless Navigation**: Tampilan Scan dilengkapi navigasi *floating button (glassmorphism)* di area kamera untuk pengguna perangkat mobile. Saat masuk ke mode Scan, area *tab header* disembunyikan seluruhnya agar ruang kamera di layar menjadi maksimal dan minim gangguan.
  - **Layout Dua Kolom (Desktop)**: Di PC/Laptop, tampilan terbagi — **kolom kiri** area kamera dengan kendali terpusat, **kolom kanan** tabel riwayat scan real-time.
  - **Export XLSX Kehadiran**: Tombol **Export** di panel riwayat kehadiran mengunduh data kehadiran lengkap dalam dua sheet: *Kehadiran* (daftar semua hadir) dan *Rekap* (rekapitulasi per Fakultas & Prodi dengan subtotal).
  - **Info Cache & Badge Timestamp**: Tombol Cache wajib ditekan sebelum scan. Status jumlah data di-*cache* dan **waktu pembaruan terakhir** (contoh: `5 data • 12:00`) selalu tampil sebagai lencana.
  - **Arsitektur Cache Scan (Redis Pipeline Chunking)**: Data dipanaskan ke Upstash Redis dengan proses *chunking* (per 200 data) untuk menghindari batas payload 1MB, dan diberi TTL otomatis 2 Hari (172800 detik) untuk mencegah *memory leak*. Response lookup < 50ms.
  - **Fire-and-forget Update**: Pencatatan waktu (`waktu_toga` / `waktu_hadir`) dikirim ke Supabase secara asinkron agar tidak memperlambat scan berikutnya.
  - **UI Feedback & Debounce**: Kartu hasil warna-warni (sukses/peringatan/error) muncul 4 detik. Delay 3 detik antar scan mencegah pemindaian berulang yang tak disengaja.
- **Tiket Toga Digital**: Modal Tiket Pengambilan Toga di profil wisudawan menampilkan QR Code asli dengan **logo institusi di tengah**, nama wisuda, periode, institusi, ukuran toga, dan jadwal pengambilan toga per Fakultas.
- **Tiket E-Undangan Digital** *(Diperbarui)*: Tampilan tiket E-Undangan mengikuti gaya tiket Toga — layout rapi, QR Code asli dengan **logo institusi di tengah**, informasi Sesi & Nomor Urut, tata tertib rata tengah.
  - **Tab Rekapitulasi, Scan Toga**: Halaman Toga admin dibagi dua tab aktif — Rekapitulasi dan Scan Toga.
  - **Jadwal Pengambilan Toga Per Fakultas**: Dipindahkan ke halaman **Pengaturan → Menu Toga** — admin dapat mengatur waktu pengambilan per Fakultas (5 Fakultas tersedia) dan tempat pengambilan toga.
- **Pendaftaran Wisuda Otomatis**:
  - ID Wisuda unik otomatis: `[PERIODE]_[TAHUN]_[URUTAN]_[NIM]`.
  - QR Toga di-generate saat pendaftaran dari `id_wisuda`, terintegrasi dengan **logo institusi** di tengah QR.
  - Gelar akademik otomatis dan validasi data merujuk pada tabel master `prodi` di Supabase.
  - `log_status` mencatat setiap perubahan status sebagai rekaman append (tidak ditimpa).
- **Dashboard Profil Dinamis**: Halaman profil wisudawan di `/wisudawan/[nim]` dengan state sync *real-time*, tab konten (Informasi, Undangan, Toga, Pendaftaran, **Perbaikan**).
  - Wisudawan bisa mengganti *Password* via Modal dan mengganti *Foto* langsung melalui form pengeditan data.
  - Tampilan dinamis: jika Admin menonaktifkan pengubahan ukuran toga, blok form Toga akan **disembunyikan**.
  - Validasi ketat: Judul skripsi wajib terdiri dari **minimal 5 kata**.
  - Ketentuan foto: Diwajibkan memakai **Toga** (maksimal 1 MB).
- **Fitur Perbaikan Data Akademik** *(Baru)*:
  - Wisudawan yang telah terdaftar dapat mengajukan permohonan perbaikan data akademik (Nama, NIM, Fakultas, Prodi, IPK, Toga, Predikat, Tgl Yudisium) langsung dari tab **Perbaikan** di halaman profil.
  - Sistem membatasi **satu pengajuan aktif** per wisudawan — pengajuan baru hanya bisa dilakukan setelah pengajuan sebelumnya berstatus *Diterima* atau *Ditolak*.
  - Admin mengelola semua pengajuan melalui halaman `/admin/perbaikan` dengan filter status dan action *Terima*/*Tolak* disertai catatan.
  - Fitur dapat diaktifkan/dinonaktifkan oleh Admin via toggle `allow_perbaikan` di halaman Pengaturan.
- **Halaman Prestasi Akademik** (`/admin/prestasi`):
  - Menampilkan **Wisudawan Terbaik Institut** (IPK tertinggi non-Pascasarjana) dalam banner emas di bagian atas.
  - Tabel peringkat per Fakultas (Top 3) dengan kolom: Peringkat, NIM, Wisudawan, Program Studi, Capaian Akademik, Tgl Yudisium, Opsi.
  - **Warna baris otomatis** berdasarkan peringkat: 🥇 emas (amber) untuk Peringkat 1, 🥈 perak (slate) untuk Peringkat 2, 🥉 perunggu untuk Peringkat 3.
  - **Tombol Generate**: Menghitung ulang peringkat berdasarkan IPK + Tanggal Yudisium murni dan menyimpan hasilnya ke kolom `prestasi_akd` di tabel `wisudawan`. Setiap kali tombol Generate ditekan, seluruh riwayat penggantian manual akan di-reset.
  - **Override Manual**: Tombol "Ganti Wisudawan" untuk mengganti pemenang secara manual. Override disimpan sementara di `app_settings` sebagai aturan pengecualian — dan akan dihapus otomatis saat tombol Generate ditekan.
  - **Print Sertifikat**: Tombol "Print Sertifikat" men-generate file PDF sertifikat penghargaan untuk setiap wisudawan berprestasi menggunakan `@react-pdf/renderer`. Fitur:
    - Teks PDF sepenuhnya bisa diseleksi dan dicopy.
    - Paragraf penghargaan menyertakan nama **Fakultas** wisudawan secara otomatis.
    - **Tanggal & Tempat Pelaksanaan** diambil langsung dari data Periode aktif di database.
    - **Latar Belakang Kustom**: Admin dapat upload gambar PNG/JPG/WEBP dari halaman Pengaturan → Prestasi; gambar disimpan ke **Supabase Storage** dan dirender sebagai latar di belakang teks sertifikat.
    - **Tanda Tangan Digital**: Admin dapat upload gambar tanda tangan pejabat (PNG transparan) dari Pengaturan → Prestasi; gambar disimpan ke Supabase Storage dan dirender sebagai *overlay* di area tanda tangan sertifikat (di belakang teks nama pejabat).
    - Seluruh PDF dikemas dalam satu file `.zip` dan diunduh otomatis.
    - Format nama file: `Sertifikat-AKD_[Fakultas]_[Sebutan]_[NIM]_[Nama].pdf`.
  - **Export XLSX 2-Sheet**: Sheet *Prestasi Akademik* dan *Pengalaman Organisasi* dalam satu file Excel.
- **Kartu Prestasi di Profil Wisudawan** *(Baru)*: Jika wisudawan memiliki data `prestasi_akd`, sebuah kartu bergaya medali akan muncul di halaman profil publik, otomatis menyesuaikan warna berdasarkan peringkat (Emas/Perak/Perunggu/Hijau). Fitur ini dapat diaktifkan/dinonaktifkan oleh Admin via toggle `show_prestasi_card` di Pengaturan → General.
  - **Download Sertifikat PDF Mandiri**: Di dalam Kartu Prestasi, wisudawan berprestasi dapat langsung men-*generate* dan mengunduh sertifikat berformat PDF (*client-side*). Desain sertifikat ini 100% tersinkronisasi dengan pengaturan yang dikonfigurasi admin (nomor SK, tanda tangan, dan *background* bingkai).
- **Bidang Prestasi di Form Wisudawan Disembunyikan**: Field "Prestasi Akademik" dan "Prestasi Organisasi" dihapus dari form input/edit wisudawan (publik maupun edit). Data ini kini dikelola eksklusif oleh Admin melalui modul Generate Prestasi.
- **Pembatasan Admin Unit**: Role `admin_unit` memiliki akses read-only — tombol Generate, Print Sertifikat, Ganti Wisudawan, dan kolom Aksi di halaman Prestasi disembunyikan. Filter data Toga dan Perbaikan otomatis dibatasi sesuai unit kerja/fakultas masing-masing. Menu Tamu disembunyikan.
- **Halaman Tamu** (`/admin/tamu`): Modul manajemen tamu undangan VIP/umum.
  - CRUD Tamu (Nama, Jabatan, Alamat, Sesi) dengan antarmuka dinamis dan *Delete Confirmation Modal*.
  - **QR Code Otomatis**: Digenerate tanpa library tambahan via `api.qrserver.com` berdasar `id_tamu` untuk akses cepat dan bebas kertas. Menampilkan popup *close-up* QR Code saat di-klik pada tabel.
  - **Scan Kehadiran Tamu**: Scanner QR Code khusus tamu yang persis dengan Scan Kehadiran wisudawan, dilengkapi layout dua kolom (kamera di kiri & riwayat real-time di kanan) dan notifikasi visual 4-detik.
  - **Cetak Undangan (PDF)**: Tombol *Print Bulk* dan *Print Satuan* menghasilkan dokumen PDF 2 halaman per tamu (A4 Landscape) menggunakan `@react-pdf/renderer` (Halaman 1 untuk Latar Depan/Surat + QR Code, Halaman 2 untuk Latar Belakang/Susunan Acara). Latar dapat dikustomisasi admin di menu Pengaturan.
  - **Support Dark Mode**: Tampilan label "Sesi" dan *shape* warna pada tombol Aksi akan beradaptasi sempurna dengan sistem Dark/Light mode.
- **Pemrosesan Foto Cerdas**: Crop 3:4 client-side, auto red background, kompresi otomatis (<500KB), dan area aman *safe margin*.
- **Animasi Halus**: Didukung `framer-motion`.
- **Toast Notifikasi Global Terpusat**: Sistem notifikasi terpusat (`src/components/ui/Toast.tsx`) dengan tampilan modern di **tengah layar** — ikon besar, *progress bar* otomatis, *spring animation*, dan dukungan dark mode. Menggantikan seluruh toast lokal di setiap komponen.
- **Reset Password Admin**: Admin dapat mereset password wisudawan ke default dari tabel wisudawan (ikon kunci), dengan catatan otomatis di `log_status`.

## ⚡ Performa & Optimasi Skala Besar
Aplikasi ini telah dirombak untuk menangani lalu lintas pendaftaran wisuda serentak dengan efisiensi tingkat tinggi:
- **Zero N+1 Queries (Promise.all)**: Hampir seluruh *Server Components* dan *Server Actions* telah dioptimasi dengan `Promise.all`. Hal ini mengakhiri antrean lambat kueri sekuensial (waterfall) menjadi proses paralel 100%. Contohnya di halaman Pengaturan, 9 penyetelan dapat disimpan dalam 1 kueri masif secara paralel.
- **Upstash Redis Caching**: Memuat halaman tak perlu lagi menuggu *database* Supabase. Data pengaturan sistem, profil wisudawan, dan data *scan* disimpan dalam memori Redis untuk disajikan ke pengguna dalam hitungan milidetik.
- **Client Router Cache (Instant Navigation)**: Di Next.js 15, navigasi rute dinamis secara bawaan dimatikan cachenya. Kami telah mengaktifkan kembali `staleTimes` selama **5 menit** untuk rute dinamis dan menghidupkan `prefetch={true}` pada *Sidebar* maupun *Bottom Navigation*. Hasilnya? Kunjungan ke menu manapun (bahkan yang pertama kali) akan tampil instan (0 detik) di layar tanpa *loading spinner* sama sekali!
- **Rate Limiting Ganas**: Upstash RateLimit diaktifkan di lapisan Login Wisudawan untuk mencegah serangan *Brute Force* dan *DDoS*. Maksimal 5 percobaan gagal per IP/NIM per 15 menit.

## 💻 Tech Stack

- **Framework**: [Next.js](https://nextjs.org) (App Router)
- **Database**: [Supabase](https://supabase.com) (PostgreSQL + Auth untuk Backend Role)
- **Auth Admin**: [NextAuth.js](https://next-auth.js.org) (Google Provider + JWT Session)
- **Caching**: [Upstash Redis](https://upstash.com)
- **Cloud Storage & Export**: Google Apps Script, Google Drive/Sheets, pustaka `xlsx`
- **Supabase Storage**: Bucket `cert-assets` untuk menyimpan aset sertifikat:
  - `backgrounds/` — Gambar latar belakang sertifikat (PNG/JPG/WEBP, maks 5 MB, public URL)
  - `signatures/` — Gambar tanda tangan pejabat (PNG transparan, maks 2 MB, public URL)
- **PDF Generation**: `@react-pdf/renderer` (generate PDF asli dengan teks selectable, bundled client-side)
- **PPTX Generation**: `pptxgenjs` (generate file presentasi PowerPoint secara *client-side*)
- **Word Generation**: `docx` (generate file Word `.docx` secara *client-side*)
- **Excel Advanced**: `exceljs` (generate Excel dengan penyisipan gambar per sel, *client-side*)
- **Password Hashing**: `bcryptjs` (hash password wisudawan di sisi server)
- **Styling**: Vanilla CSS + CSS Variables (Dark Mode via `next-themes`)
- **Icons**: [Lucide React](https://lucide.dev)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Image Processing**: `react-easy-crop` (Client-side cropping)
- **QR Scanner**: `html5-qrcode` (Kamera scan via WebRTC)
- **Fonts**: Inter (Body) dan Outfit (Display) via Google Fonts

## 🛠 Panduan Instalasi & Menjalankan Lokal

1. **Clone repositori**
   ```bash
   git clone <repository_url>
   cd 5-wisuda-iainbone
   ```

2. **Instal dependensi**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables**
   Salin `.env.example` ke `.env.local` dan isi *credentials* Anda:
   ```bash
   cp .env.example .env.local
   ```
   | Variable | Keterangan |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key Supabase (aman untuk client) |
   | `SUPABASE_SERVICE_ROLE_KEY` | Service role key (rahasia, hanya server) |
   | `UPSTASH_REDIS_REST_URL` | REST URL Upstash Redis |
   | `UPSTASH_REDIS_REST_TOKEN` | Token Upstash Redis |
   | `NEXT_PUBLIC_GAS_WEBAPP_URL` | URL Google Apps Script Web App |

   - Setup Database Supabase
     - Jalankan `supabase_schema.sql` di SQL Editor Supabase.
     - Jalankan `db_migration.sql` di SQL Editor Supabase (tabel `admin_users` + RLS + tabel `app_settings`).
     - Jalankan `perbaikan_migration.sql` di SQL Editor Supabase (tabel `perbaikan_data` + setting `allow_perbaikan`).
     - Tambahkan kolom `sesi` di tabel `prodi` (jalankan `add_sesi_to_prodi.sql`).
     - Tambahkan kolom `urutan` di tabel `prodi` (jalankan `add_urutan_to_prodi.sql`).
     - Hapus kolom `created_at` dari tabel `prodi` jika ada (jalankan `remove_created_at_from_prodi.sql`).
     - Jalankan migration kolom toga dan link pengumuman untuk `periode_wisuda`:
       ```sql
       ALTER TABLE public.periode_wisuda
         ADD COLUMN IF NOT EXISTS waktu_pengambilan_toga JSONB DEFAULT '{}'::jsonb,
         ADD COLUMN IF NOT EXISTS tempat_pengambilan_toga TEXT,
         ADD COLUMN IF NOT EXISTS link_pengumuman TEXT;
       ```
   - Tambahkan kolom scan ke tabel `wisudawan`:
     ```sql
     ALTER TABLE public.wisudawan
       ADD COLUMN IF NOT EXISTS waktu_toga TIMESTAMPTZ,
       ADD COLUMN IF NOT EXISTS waktu_hadir TIMESTAMPTZ;
     ```
   - Setup Supabase Storage untuk latar belakang sertifikat: jalankan `supabase_cert_assets_bucket.sql` di SQL Editor (membuat bucket `cert-assets` dan policies akses).
   - Buka `http://localhost:3000/setup` untuk membuat akun superadmin pertama.

5. **Jalankan *Development Server***
   ```bash
   npm run dev
   ```

6. **Buka di Browser**
   Buka `http://localhost:3000` di peramban Anda.

## 📂 Struktur Proyek

- `src/app/` — Root layout dan halaman utama.
  - `auth/page.tsx` — Login wisudawan (NIM + Password) + dialog Cek Status NIM.
  - `setup/[nim]/` — Halaman Setup Akun Pertama Kali (email, toga, password baru).
  - `admin/login/page.tsx` — Login admin via NextAuth (Google Provider).
  - `admin/(dashboard)/` — Dashboard admin:
    - `wisudawan/` — Data wisudawan (tabel + import/export + toolbar terpadu satu baris + pengaturan sesi + generate nomor undangan + **Generate Slide PPTX**).
  - `toga/` — 3 Tab: Rekapitulasi, Pengaturan Toga (jadwal per Fakultas & tempat), dan **Scan Toga** (QR scanner kamera).
  - `kehadiran/` — **Scan Kehadiran** via QR undangan (kamera, validasi sesi, anti double-scan).
  - `perbaikan/` — Manajemen pengajuan perbaikan data akademik wisudawan.
  - `prestasi/` — Halaman Prestasi Akademik & Pengalaman Organisasi (peringkat otomatis + tombol Generate + override manual + Print Sertifikat PDF + export XLSX).
  - `tamu/` — Halaman Tamu (dalam pengembangan).
  - `fakultas/` — Manajemen master data Fakultas & Prodi (CRUD via `ProdiTableRow`, `ProdiDialog`, `DeleteProdiButton`, drag-and-drop urutan via `ProdiTableClient`).
    - `pengaturan/` — Pengaturan periode wisuda & feature toggles (app_settings) dalam layout 2-kolom (menu kiri / konten kanan). Empat menu: **General** (password, toggle), **Prestasi** (data penandatangan & upload gambar sertifikat), **Toga** (jadwal pengambilan per Fakultas & tempat), dan **Slide** (upload bingkai PPTX & warna hex per Fakultas).
    - `informasi/` — **[Baru]** Halaman referensi informasi wisuda semua periode + Countdown Pendaftaran real-time untuk semua role admin.
    - `manajemen-admin/` — Manajemen akun admin (superadmin only).
  - `wisudawan/[nim]/page.tsx` — Server Component: fetch data + settings (bypass Redis cache), termasuk `allow_perbaikan`.
  - `wisudawan/[nim]/ClientProfile.tsx` — Client Component: UI profil wisudawan termasuk Tiket Toga digital dan **Tab Perbaikan**.
- `src/actions/` — Server Actions Next.js:
  - `adminAuth.ts` — Login, logout, dan get session admin.
  - `adminUsers.ts` — CRUD daftar admin (invite, toggle, delete, update role).
  - `periode.ts` — Pengaturan periode wisuda (aktif diurutkan paling atas).
  - `perbaikan.ts` — CRUD pengajuan perbaikan data wisudawan (buat, list, update status); invalidate cache `wisudawan:[nim]` saat status diperbarui.
  - `prodi.ts` — CRUD master data prodi, `updateProdiOrder` untuk menyimpan urutan drag-and-drop (batch update kolom `urutan`).
  - `sesi.ts` — Penetapan Sesi per Fakultas; update massal `wisudawan.sesi` & `prodi.sesi`; invalidate cache NIM massal via Redis Pipeline.
  - `nomorUndangan.ts` — Generate nomor urut & ID undangan; reset dan batch-update `urut`, `id_undangan`, `qr_undangan`; format `UND_[Periode]_[Sesi]_[Urut]_[NIM]`; invalidasi Redis Pipeline massal.
  - `scanCache.ts` — **[Baru]** Warm-up cache Redis untuk scan Toga (`warmUpTogaCache`) dan Undangan (`warmUpUndanganCache`); `getScanMeta` untuk membaca status cache.
  - `wisudawan.ts` — CRUD wisudawan, login (SHA-256 hash + flag `isDefaultPassword`), daftar wisuda (generate ID + QR + hash password), `setupAkunWisudawan`, reset password, import batch (auto-assign periode).
  - `settings.ts` — Baca/tulis konfigurasi sistem dari tabel `app_settings`.
- `src/app/api/scan/` — **[Baru]** API Route Handlers berkecepatan tinggi:
  - `toga/route.ts` — POST: lookup via `id_wisuda` dari Redis, validasi double-scan & toga terisi, catat `waktu_toga`.
  - `undangan/route.ts` — POST: lookup via `id_undangan` dari Redis, validasi sesi & double-scan, catat `waktu_hadir`.
- `src/lib/` — Instance klien:
  - `supabase.ts` — Client untuk Client Components.
  - `supabase-server.ts` — Client untuk Server Components & Actions.
  - `redis.ts` — Upstash Redis client.
  - `uploadFoto.ts` — Upload foto profil wisudawan ke Google Drive via GAS.
  - `uploadCertBg.ts` — Upload gambar latar sertifikat ke Supabase Storage (`cert-assets`). Validasi tipe/ukuran, hapus file lama otomatis, kembalikan public URL.
- `src/components/ui/Toast.tsx` — Sistem Toast Notifikasi global terpusat (provider + hook `useToast`).
- `src/middleware.ts` — Proteksi rute `/admin` via validasi JWT dari NextAuth.
- `docs/` — Dokumentasi teknis:
  - [`admin-panel.md`](docs/admin-panel.md) — Panduan auth admin, fitur sesi wisuda, manajemen admin, fitur perbaikan, & sistem scan QR.
  - [`arsitektur-database.md`](docs/arsitektur-database.md) — Arsitektur database, schema, strategi caching & tabel invalidasi.
  - [`alur-wisudawan.md`](docs/alur-wisudawan.md) — Alur login, setup akun, sistem password, pengalaman wisudawan, & alur perbaikan.
  - [`plan.md`](docs/plan.md) — Design system & catatan pengembangan.
- `supabase_schema.sql` — Schema tabel dasar Supabase.
- `db_migration.sql` — Migrasi tabel `admin_users` + `app_settings` + RLS policies.
- `perbaikan_migration.sql` — Migrasi tabel `perbaikan_data` + setting `allow_perbaikan`.
- `add_sesi_to_prodi.sql` — Tambah kolom `sesi` ke tabel `prodi`.
- `add_urutan_to_prodi.sql` — Tambah kolom `urutan` ke tabel `prodi` untuk fitur drag-and-drop urutan prodi.
- `remove_created_at_from_prodi.sql` — Hapus kolom `created_at` dari tabel `prodi`.
- `supabase_cert_assets_bucket.sql` — Setup Supabase Storage bucket `cert-assets` + RLS policies (dijalankan sekali di SQL Editor).

## 🔐 Keamanan Auth Admin

| Aspek | Implementasi |
|---|---|
| Session | JWT dari NextAuth.js (httpOnly cookie) |
| Validasi Login | Google OAuth Provider + pengecekan ke tabel `admin_users` |
| Autorisasi Route | Next.js Middleware memeriksa `token.role` |
| Password Wisudawan | SHA-256 + random salt (via Web Crypto API built-in) |
| Otorisasi | Tabel `admin_users` dengan RLS + pengecekan `is_active` |
| Role | 4 Tingkat: `superadmin`, `admin_institut`, `admin_unit`, `admin_absensi` |
| Pembatasan `admin_unit` | Data Toga & Perbaikan difilter per unit kerja/fakultas; Prestasi read-only (tombol Generate/Print/Override disembunyikan); menu Tamu disembunyikan |

## 🎓 Alur Login Wisudawan

```
[/auth] Masukkan NIM + Password
        │
        ├─ Password BUKAN default → /wisudawan/[nim] (langsung ke profil)
        │
        └─ Password ADALAH default → /setup/[nim]
                   │
                   └─ Isi: Email, Ukuran Toga, Password Baru
                              │
                              └─ Berhasil → kembali ke /auth untuk login ulang
```

1. Wisudawan membuka `/auth` dan memasukkan **NIM** + **Password**.
2. Jika belum tahu status pendaftaran, klik **"Cek Status Pendaftaran kamu"** → masukkan NIM → sistem menampilkan apakah NIM terdaftar di periode aktif.
3. *Calon Wisudawan* menggunakan **password default** (dapat dikonfigurasi admin di `/admin/pengaturan`).
4. Saat login pertama kali dengan password default, wisudawan **diwajibkan mengisi Email, Ukuran Toga, dan Password Baru** di halaman `/setup/[nim]` sebelum bisa masuk ke profil.
5. Setelah setup selesai, wisudawan kembali login dengan password baru → masuk ke halaman profil.
6. Admin dapat **mereset password** wisudawan ke default kapan saja dari panel admin.

## 📡 Alur Scan QR Hari H

```
[Admin buka /admin/toga?tab=scan atau /admin/kehadiran]
        │
        └─ Klik "Ambil Cache" → data wisudawan dipanaskan dari Supabase ke Redis
                   │
                   └─ Arahkan QR ke kamera → html5-qrcode decode
                              │
                              └─ POST /api/scan/toga atau /api/scan/undangan
                                         │
                                         ├─ Lookup Redis (< 50ms)
                                         ├─ Validasi: toga terisi, sesi cocok, belum discan
                                         ├─ Set waktu di Redis (sync, instant)
                                         └─ Update Supabase waktu_toga/waktu_hadir (async, background)
                                                    │
                                                    └─ UI tampilkan kartu hijau/kuning/merah (3 detik lalu auto-reset)
```

## 📝 Catatan Tambahan

Proyek ini menggunakan variabel CSS kustom untuk sistem warna (`--color-bg`, `--color-text`, `--color-primary`, dll.) yang memungkinkan dukungan Dark Mode tanpa kelas Tailwind.

---
© 2026 Institut Agama Islam Negeri Bone.
