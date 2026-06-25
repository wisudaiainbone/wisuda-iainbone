# Alur Login & Pengalaman Wisudawan

Dokumen ini menjelaskan alur lengkap yang dialami seorang wisudawan saat mengakses Portal Wisuda IAIN Bone.

---

## 1. Alur Masuk (Login)

```
[Wisudawan buka /auth]
       │
       ├─ Masukkan NIM + Password
       │         │
       │         ▼
       │   [loginWisudawan()]
       │         │
       │         ├─ Cek periode aktif (status = 'Sedang Dibuka')
       │         ├─ Cari NIM di tabel wisudawan
       │         └─ Cocokkan password input:
       │              • Jika password NULL    → bandingkan dengan default_password (app_settings)
       │              • Jika password '$...'  → verifikasi SHA-256 + salt (hashed)
       │              • Jika password plaintext → bandingkan langsung (backward compat)
       │
       ├─ Jika password BUKAN default → redirect ke /wisudawan/[nim] (halaman profil)
       └─ Jika password ADALAH default → redirect ke /setup/[nim] (halaman setup akun)
```

---

## 2. Fitur Cek Status NIM

Wisudawan yang **belum tahu** apakah dirinya sudah terdaftar dapat menggunakan fitur ini **tanpa perlu login**:

1. Di halaman `/auth`, klik tombol **"Cek Status Pendaftaran kamu"**.
2. Sebuah **Dialog Modal** muncul di tengah layar.
3. Wisudawan memasukkan NIM mereka dan klik **"Cek"**.
4. Sistem mencocokkan NIM dengan data wisudawan pada **periode aktif** saat itu.
5. Hasil ditampilkan dalam notifikasi di dalam dialog:
   - ✅ **NIM Terdaftar** (hijau): NIM ditemukan di database.
   - ❌ **Belum Terdaftar** (merah): Muncul pesan: *"Kamu belum terdaftar sebagai calon wisudawan pada periode [Nama Periode Aktif]. Segera laporkan kepada Admin Prodi atau Fakultas / Pascasarjana."*

---

## 3. Sistem Password Wisudawan

### Password Default & Setup Akun
Setiap mahasiswa yang diimpor oleh admin otomatis menggunakan sandi bawaan (default password). 

1. Saat mahasiswa **pertama kali login** menggunakan sandi bawaan, sistem akan mengenali (`isDefaultPassword: true`).
2. Mahasiswa **wajib** melewati halaman `/setup/[nim]` untuk:
   - Menambahkan **Email Aktif**
   - Memilih **Ukuran Toga** (Jika telah diatur admin, otomatis terisi dari database utama tanpa cache)
   - Membuat **Password Baru** (minimal 6 karakter)
3. Setelah berhasil mengisi form setup, data email & toga disimpan, dan password baru di-hash (SHA-256).
4. Wisudawan dikembalikan ke halaman `/auth` untuk login menggunakan sandi yang baru mereka buat.

| Kondisi | Password yang Digunakan | Redirect Arah Login |
|---|---|---|
| Wisudawan login pertama kali | `default_password` dari `app_settings` | `/setup/[nim]` (Wajib isi email, toga, & password) |
| Wisudawan sudah setup akun | Password kustom ter-hash (SHA-256 + salt) | `/wisudawan/[nim]` (Halaman Profil) |

### Hashing Password
Saat wisudawan melakukan setup akun, password baru disimpan dalam format hashed:

```
Format penyimpanan: $sha256$<salt>$<hash_hex>
Contoh: $sha256$ab12ef34$3a7b9c...
```

Proses verifikasi login:
1. Sistem membaca format `$sha256$<salt>$<hash>`
2. Menghitung ulang hash dari `salt + passwordInput`
3. Membandingkan dengan hash yang tersimpan

### Reset Password oleh Admin
Admin dapat mereset password wisudawan ke **password default** langsung dari tabel wisudawan di panel admin (ikon kunci 🔑). Aksi ini akan membuat wisudawan tersebut harus mengulangi kembali halaman `/setup/[nim]` saat mereka mencoba login kembali. Aksi ini juga otomatis tercatat di `log_status`.

---

## 4. Halaman Profil Wisudawan (`/wisudawan/[nim]`)

Setelah login dengan password kustom berhasil, wisudawan diarahkan ke halaman profil mereka. Seluruh pengaturan tampilan (toggle fitur) diambil **langsung dari database Supabase** tanpa melalui cache Redis agar perubahan admin langsung aktif.

### Hero Header
- **Foto profil** (jika belum ada foto, menampilkan inisial nama dengan latar warna).
- **Label Periode** — diambil dari kolom `periode` data wisudawan.
- **Status Pendaftaran** — badge hijau (Terdaftar) atau merah (Belum).
- **Nama lengkap dengan gelar**, Fakultas, Prodi, NIM.
- **Kartu QR Toga & Undangan** + nilai IPK dan Predikat.

### Notifikasi Global (jika admin menutup pendaftaran)
Banner merah **"Masa Pendaftaran & Edit Data Telah Ditutup oleh Admin"** muncul secara global di atas semua tab ketika admin menonaktifkan `allow_edit_profile`.

### Kartu Jadwal Wisuda (Kiri / Mobile Top)
Menampilkan judul *"Wisuda Program Sarjana dan Magister [Periode] IAIN Bone"* beserta:
- Periode, Pelaksanaan, Tempat, Sesi, Nomor Urut, Jam Sesi.
- Catatan Pendaftaran (`hint_pendaftaran`) tampil **di atas tombol Lihat Undangan Wisuda** jika diisi admin — sebagai pengingat bahwa jadwal dapat berubah sewaktu-waktu.
- Tombol **Lihat Undangan Wisuda** (merah) — membuka Tiket E-Undangan digital.
- Tombol Gabung WhatsApp Group (jika ada link WAG).

### Tab Konten — Wisudawan Aktif (Status: Terdaftar)
| Tab | Isi |
|---|---|
| **Informasi** | Pengumuman penting, Judul Skripsi/Tesis, Data Akademik, Prestasi & Organisasi |
| **Undangan** | QR E-Undangan asli (dengan logo di tengah), detail tempat & sesi, nomor urut, tata tertib. Terkunci jika admin menonaktifkan `show_undangan_info`. Tombol **Buka E-Undangan** membuka Tiket E-Undangan digital bergaya tiket Toga |
| **Toga** | Tiket Toga (QR Code Asli dengan logo), ukuran, waktu pengambilan, catatan. Terkunci jika admin menonaktifkan `show_toga_info` |
| **Pendaftaran** | Waktu daftar, Email, TTL, Jenis Kelamin |
| **Perbaikan** | Daftar riwayat pengajuan perbaikan data akademik beserta statusnya. Tombol ajukan muncul jika `allow_perbaikan = true` dan tidak ada pengajuan aktif |

### Tampilan Calon Wisudawan (Status: Calon Wisudawan)
Calon wisudawan **tidak** melihat sistem tab. Mereka langsung melihat area pengisian data persyaratan wisuda:
- Status kelengkapan data (hijau jika lengkap, kuning jika belum)
- Tombol "Lengkapi Data" / "Edit Data"
- Tombol "Daftar Wisuda" (muncul jika semua persyaratan telah diisi)

### Edit Data & Lengkapi Persyaratan
Wisudawan wajib melengkapi persyaratan wisuda (Toga, Data Kontak, Judul Skripsi) dan dapat mengisi opsi tambahan (Organisasi & Prestasi). Terdapat validasi otomatis:
- **Format Email**: Wajib format email yang valid.
- **Validasi Judul Skripsi**: Wajib diisi dengan **minimal 5 kata**.
- **Otomatisasi Toga**: Form Ukuran Toga akan **disembunyikan sepenuhnya** jika pengubahan toga dinonaktifkan oleh Admin.
- **Tempat Lahir**: Otomatis dikoreksi menjadi *Title Case*.
- **Otomatisasi Form**: Jika kolom Nama Organisasi (Ormawa) diisi, maka kolom Jabatan Ormawa otomatis wajib (required). Jika dikosongkan, kolom jabatan akan dinonaktifkan (disabled).
- **Ganti Foto Cepat**: Tersedia antarmuka pengubahan foto secara langsung di bagian paling atas form tanpa perlu keluar dari mode edit.
- **Visual Feedback**: Ikon centang hijau pada judul kartu yang telah terisi lengkap.

### Unggah Foto Wisuda
Wisudawan juga wajib mengunggah pas foto berlatar merah. Sistem mendukung:
- **Client-side Cropping**: Rasio 3:4 dengan geser & zoom.
- **Auto Red Background**: Transparan otomatis diisi warna merah.
- **Auto Compression**: Dikompresi ≤500 KB.

### Proses Pendaftaran Akhir (Daftar Wisuda)
Setelah semua data wajib dan foto terisi, kartu **"Daftar Wisuda"** muncul. Saat diklik:
1. Wisudawan melihat konfirmasi final.
2. Sistem men-generate **ID Wisuda** unik: `[PERIODE]_[TAHUN]_[URUTAN-3-DIGIT]_[NIM]` (digunakan untuk background QR generator tiket toga).
3. Gelar akademik otomatis di-generate dari `prodi.json`.
4. Status wisudawan berubah menjadi **Terdaftar** dan entry baru dicatat di `log_status`.

### Fitur Pengaturan Akun Tambahan (Setelah Terdaftar)
- **Ubah Password**: Wisudawan bisa sewaktu-waktu mengubah sandi mereka lewat ikon kunci (🔑) di bar navigasi atas.
- **Ubah Foto Wisuda**: Wisudawan bisa mengganti foto yang sudah diunggah sebelumnya saat menekan "Edit Data". Modul *Cropping* (dengan batas aman area kepala/bahu) akan secara otomatis muncul.

### Fitur Unduh Sertifikat Peringkat Prestasi
Bagi wisudawan yang memiliki predikat prestasi akademik (terisi pada data `PRESTASI AKD`), sebuah tombol **"Download Sertifikat PDF"** akan muncul di dalam kartu Prestasi Akademik.
- Sertifikat di-*generate* langsung di perangkat pengguna (*client-side*).
- Desain, tanda tangan, nomor SK, dan latar belakang (*background*) tersinkronisasi penuh dengan pengaturan sertifikat yang dibuat oleh admin.

---

## 5. Alur Penolakan NIM Tidak Aktif

Jika tidak ada periode yang berstatus `'Sedang Dibuka'` di tabel `periode_wisuda`, sistem akan mengembalikan pesan saat login:

> *"Tidak ada periode wisuda yang sedang aktif saat ini. Silakan hubungi Admin."*

---

## 6. Alur Pengajuan Perbaikan Data Akademik

Fitur ini tersedia di **Tab Perbaikan** pada halaman profil wisudawan yang telah terdaftar.

```
[Wisudawan buka Tab Perbaikan]
       │
       ├─ Jika allow_perbaikan = false  →  Banner: Fitur dinonaktifkan Admin
       │
       ├─ Jika ada pengajuan aktif (status='proses')
       │      →  Banner: Tunggu respon admin, tombol ajukan disembunyikan
       │
       └─ Jika tidak ada pengajuan aktif
              →  Tombol "Ajukan Perbaikan" muncul
                     │
                     └─ Klik → Modal form terbuka
                             │
                             ├─ Info: hanya untuk Nama, NIM, Fakultas, Prodi,
                             │       IPK, Toga, Predikat, Tgl Yudisium
                             ├─ Textarea: detail perubahan yang diminta
                             └─ Submit → createPerbaikan() → DB status='proses'
                                          │
                                          └─ Muncul di daftar dengan badge "Sedang Diproses"
```

**Respon Admin (di `/admin/perbaikan`):**
```
Admin lihat daftar pengajuan
       │
       ├─ Klik "Terima" → Input catatan (opsional) → status='diterima'
       └─ Klik "Tolak"  → Input catatan (opsional) → status='ditolak'
                                    │
                                    └─ Wisudawan bisa mengajukan ulang
```

**Aturan:**
- Satu wisudawan hanya boleh punya **1 pengajuan aktif** (`status='proses'`) dalam satu waktu.
- Setelah status menjadi `'diterima'` atau `'ditolak'`, wisudawan bisa mengajukan permintaan baru.
- Data aktual di tabel `wisudawan` diperbarui **secara manual oleh Admin** setelah menyetujui pengajuan.
