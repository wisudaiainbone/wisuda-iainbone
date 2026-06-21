'use server'

import { supabase } from '@/lib/supabase';
import { redis } from '@/lib/redis';
import { revalidatePath } from 'next/cache';

const CACHE_TTL = 3600; // 1 hour

// Mapping from Supabase snake_case to old JSON UpperCase format to preserve UI compatibility
function mapToLegacyFormat(row: any): Record<string, any> | null {
  if (!row) return null;
  return {
    "NIM": row.nim,
    "NAMA MAHASISWA": row.nama_mahasiswa,
    "NAMA GELAR": row.nama_gelar,
    "TTL": row.ttl,
    "JENIS KELAMIN": row.jenis_kelamin,
    "EMAIL": row.email,
    "PASSWORD": row.password,
    "FAKULTAS": row.fakultas,
    "PRODI": row.prodi,
    "PRODI SINGKAT": row.prodi_singkat,
    "IPK": row.ipk?.toString(),
    "PREDIKAT": row.predikat,
    "TANGGAL YUDISIUM": row.tanggal_yudisium,
    "JUDUL SKRIPSI / TESIS": row.judul_skripsi,
    "ORMAWA": row.ormawa,
    "JABATAN DALAM ORMAWA": row.jabatan_dalam_ormawa,
    "PRESTASI AKD": row.prestasi_akd,
    "PRESTASI ORG": row.prestasi_org,
    "PERIODE": row.periode,
    "STATUS": row.status,
    "SESI": row.sesi,
    "ID WISUDA": row.id_wisuda,
    "URUT": row.urut,
    "WAKTU HADIR": row.waktu_hadir,
    "ID UNDANGAN": row.id_undangan,
    "QR UNDANGAN": row.qr_undangan,
    "TOGA": row.toga,
    "WAKTU TOGA": row.waktu_toga,
    "QR TOGA": row.qr_toga,
    "FOTO": row.foto,
    "SERTIFIKAT": row.sertifikat,
    "TIMESTAMP": row.timestamp,
    "TERDAFTAR": row.terdaftar,
    "SURVEI": row.survei,
    "LOG STATUS": row.log_status ?? [],
    // Add alias for NAMA LENGKAP which might be used in some places
    "NAMA LENGKAP": row.nama_mahasiswa,
  };
}

// Reverse mapping for saving data
function mapToSupabaseFormat(legacy: any) {
  return {
    nim: legacy["NIM"],
    nama_mahasiswa: legacy["NAMA MAHASISWA"] || legacy["NAMA LENGKAP"],
    nama_gelar: legacy["NAMA GELAR"],
    ttl: legacy["TTL"],
    jenis_kelamin: legacy["JENIS KELAMIN"],
    email: legacy["EMAIL"],
    password: legacy["PASSWORD"],
    fakultas: legacy["FAKULTAS"],
    prodi: legacy["PRODI"],
    prodi_singkat: legacy["PRODI SINGKAT"],
    ipk: legacy["IPK"] ? parseFloat(legacy["IPK"]) : null,
    predikat: legacy["PREDIKAT"],
    tanggal_yudisium: legacy["TANGGAL YUDISIUM"],
    judul_skripsi: legacy["JUDUL SKRIPSI / TESIS"],
    ormawa: legacy["ORMAWA"],
    jabatan_dalam_ormawa: legacy["JABATAN DALAM ORMAWA"],
    prestasi_akd: legacy["PRESTASI AKD"],
    prestasi_org: legacy["PRESTASI ORG"],
    periode: legacy["PERIODE"],
    status: legacy["STATUS"],
    sesi: legacy["SESI"],
    id_wisuda: legacy["ID WISUDA"],
    urut: legacy["URUT"] ? parseInt(legacy["URUT"]) : null,
    waktu_hadir: legacy["WAKTU HADIR"],
    id_undangan: legacy["ID UNDANGAN"],
    qr_undangan: legacy["QR UNDANGAN"],
    toga: legacy["TOGA"],
    waktu_toga: legacy["WAKTU TOGA"],
    qr_toga: legacy["QR TOGA"],
    foto: legacy["FOTO"],
    sertifikat: legacy["SERTIFIKAT"],
    timestamp: legacy["TIMESTAMP"],
    terdaftar: legacy["TERDAFTAR"],
    survei: legacy["SURVEI"],
    log_status: legacy["LOG STATUS"],
  };
}

export async function getWisudawanByNim(nim: string) {
  const cacheKey = `wisudawan:${nim}`;
  
  try {
    // 1. Coba ambil dari Redis Cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return typeof cached === 'string' ? JSON.parse(cached) : cached;
    }
  } catch (error) {
    console.error("Redis get error:", error);
  }

  // 2. Fetch dari Supabase jika tidak ada di cache
  const { data, error } = await supabase
    .from('wisudawan')
    .select('*')
    .eq('nim', nim)
    .single();

  if (error || !data) {
    return null;
  }

  const legacyData = mapToLegacyFormat(data);

  try {
    // 3. Simpan hasil ke Redis
    await redis.set(cacheKey, JSON.stringify(legacyData), { ex: CACHE_TTL });
  } catch (error) {
    console.error("Redis set error:", error);
  }

  return legacyData;
}

export async function getAllWisudawan(filterOptions?: { role?: string, unitKerja?: string | null }) {
  let query = supabase.from('wisudawan').select('*');

  if (filterOptions?.role === 'admin_unit' && filterOptions?.unitKerja) {
    query = query.eq('fakultas', filterOptions.unitKerja);
  }

  const { data, error } = await query.order('nim', { ascending: true });

  if (error) {
    console.error('Error fetching all wisudawan:', error);
    return [];
  }
  return data;
}

export async function loginWisudawan(nim: string, passwordInput: string) {
  // 1. Dapatkan periode aktif
  const { data: activePeriode, error: periodeError } = await supabase
    .from('periode_wisuda')
    .select('*')
    .eq('status', 'Sedang Dibuka')
    .single();

  if (periodeError || !activePeriode) {
    return { success: false, error: 'Tidak ada periode wisuda yang sedang aktif saat ini. Silakan hubungi Admin.' };
  }

  // 2. Cek apakah wisudawan ada
  const { data: w, error: wError } = await supabase
    .from('wisudawan')
    .select('*')
    .eq('nim', nim)
    .single();

  if (wError || !w) {
    return { 
      success: false, 
      error: `Akun tidak ditemukan. Gunakan fitur "Cek Status NIM" di bawah untuk informasi lebih lanjut.` 
    };
  }

  // 3. Validasi Password
  const { getSetting } = await import('@/actions/settings');
  const defaultPassword = await getSetting('default_password', 'wisuda2026');
  const storedPassword = w.password;

  let isValid = false;
  let usedDefaultPassword = false;

  if (!storedPassword) {
    // Tidak ada password tersimpan -> gunakan default
    isValid = (passwordInput === defaultPassword);
    if (isValid) usedDefaultPassword = true;
  } else if (storedPassword.startsWith('$')) {
    // Password sudah di-hash (format: $sha256$<salt>$<hash>)
    const parts = storedPassword.split('$');
    if (parts.length === 4 && parts[1] === 'sha256') {
      const salt = parts[2];
      const storedHash = parts[3];
      const encoder = new TextEncoder();
      const data = encoder.encode(salt + passwordInput);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      isValid = (computedHash === storedHash);
    } else {
      isValid = (passwordInput === defaultPassword);
      if (isValid) usedDefaultPassword = true;
    }
  } else {
    // Plain text password (backward compat)
    isValid = (passwordInput === storedPassword);
    // Jika plain text cocok dengan defaultPassword, berarti pakai password default
    if (isValid && storedPassword === defaultPassword) usedDefaultPassword = true;
  }

  if (!isValid) {
    return { success: false, error: 'NIM atau Password salah. Periksa kembali data Anda.' };
  }

  return { success: true, data: w, isDefaultPassword: usedDefaultPassword };
}

export async function cekStatusNim(nim: string) {
  const { data: activePeriode, error: periodeError } = await supabase
    .from('periode_wisuda')
    .select('*')
    .eq('status', 'Sedang Dibuka')
    .single();

  if (periodeError || !activePeriode) {
    return { success: false, error: 'Tidak ada periode wisuda yang sedang aktif saat ini.' };
  }

  const { data: w, error: wError } = await supabase
    .from('wisudawan')
    .select('nim')
    .eq('nim', nim)
    .single();

  if (wError || !w) {
    return { 
      success: false, 
      error: `Kamu belum terdaftar sebagai calon wisudawan pada periode ${activePeriode.nama_periode}. Segera laporkan kepada Admin Prodi atau Fakultas / Pascasarjana.` 
    };
  }

  return { success: true, message: 'NIM terdaftar! Silakan login menggunakan password default atau password Anda.' };
}

export async function checkExistingNims(nims: string[]) {
  if (!nims || nims.length === 0) return [];
  const { data, error } = await supabase
    .from('wisudawan')
    .select('nim')
    .in('nim', nims);
    
  if (error) {
    console.error('Error checking existing nims:', error);
    return [];
  }
  return data.map(d => d.nim);
}

export async function updateWisudawan(nim: string, updates: Record<string, any>) {
  const supabaseData = mapToSupabaseFormat(updates);

  // Hapus primary key dari data update untuk mencegah error
  delete supabaseData.nim;

  const { error } = await supabase
    .from('wisudawan')
    .update(supabaseData)
    .eq('nim', nim);

  if (error) {
    console.error("Supabase update error:", error);
    throw new Error(error.message);
  }

  // Invalidate cache
  try {
    const cacheKey = `wisudawan:${nim}`;
    await redis.del(cacheKey);
    await redis.del('dashboard:stats:all');
  } catch (err) {
    console.error("Redis del error:", err);
  }

  // Invalidate Next.js cache
  revalidatePath(`/wisudawan/${nim}`);
  revalidatePath(`/admin/wisudawan/${nim}`);
  revalidatePath('/admin/wisudawan');
  return { success: true };
}

/**
 * Simpan URL foto profil wisudawan ke Supabase setelah berhasil diupload ke Google Drive.
 * Hanya mengupdate kolom `foto` — tidak mengubah kolom lainnya.
 */
export async function saveFotoWisudawan(nim: string, fotoUrl: string) {
  const { error } = await supabase
    .from('wisudawan')
    .update({ foto: fotoUrl })
    .eq('nim', nim);

  if (error) {
    console.error("Supabase saveFoto error:", error);
    throw new Error(error.message);
  }

  // Invalidate Redis cache agar data terbaru langsung tersedia
  try {
    const cacheKey = `wisudawan:${nim}`;
    await redis.del(cacheKey);
  } catch (err) {
    console.error("Redis del error:", err);
  }

  // Invalidate Next.js cache
  revalidatePath(`/wisudawan/${nim}`);

  return { success: true };
}


/**
 * Daftarkan wisudawan ke wisuda — mengubah status menjadi "Terdaftar",
 * mengisi kolom `terdaftar` dengan timestamp sekarang, dan mengappend
 * entry baru ke kolom `log_status`.
 */
export async function daftarWisuda(nim: string, newPassword: string) {
  // Helper untuk hashing password dengan Web Crypto (SHA-256 + salt)
  const hashPassword = async (plain: string): Promise<string> => {
    const salt = Math.random().toString(36).substring(2, 10);
    const encoder = new TextEncoder();
    const data = encoder.encode(salt + plain);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `$sha256$${salt}$${hashHex}`;
  };

  const getMakassarTime = () => {
    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Makassar',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    });
    return formatter.format(new Date());
  };

  const now = getMakassarTime();

  // 1. Ambil log_status yang sudah ada, serta nama, prodi, dan periode untuk generate gelar
  const { data: existing, error: fetchError } = await supabase
    .from('wisudawan')
    .select('log_status, status, nama_mahasiswa, prodi, periode')
    .eq('nim', nim)
    .single();

  if (fetchError || !existing) {
    throw new Error('Data wisudawan tidak ditemukan.');
  }

  // Pastikan belum terdaftar
  if (existing.status === 'Terdaftar') {
    throw new Error('Wisudawan sudah terdaftar sebelumnya.');
  }

  // 2. Cari gelar dan singkatan prodi dari tabel Supabase
  let namaGelarBaru = existing.nama_mahasiswa;
  let prodiSingkatBaru = null;

  const { data: matchedProdi } = await supabase
    .from('prodi')
    .select('gelar, singkatan, prodi')
    .ilike('prodi', existing.prodi || '')
    .maybeSingle();

  if (matchedProdi) {
    if (matchedProdi.prodi.toUpperCase().startsWith('S3')) {
      namaGelarBaru = `${matchedProdi.gelar} ${existing.nama_mahasiswa}`;
    } else {
      namaGelarBaru = `${existing.nama_mahasiswa}, ${matchedProdi.gelar}`;
    }
    prodiSingkatBaru = matchedProdi.singkatan;
  }

  // 3. Ambil periode yang sedang aktif
  const { data: activePeriod, error: periodError } = await supabase
    .from('periode_wisuda')
    .select('id, nama_periode')
    .eq('status', 'Sedang Dibuka')
    .single();

  if (periodError || !activePeriod) {
    throw new Error('Tidak ada periode pendaftaran yang sedang dibuka.');
  }

  const studentPeriode = existing.periode || activePeriod.nama_periode;

  // 4. Hitung urutan pendaftaran di periode ini untuk generate id_wisuda
  const { count: registeredCount } = await supabase
    .from('wisudawan')
    .select('nim', { count: 'exact', head: true })
    .eq('status', 'Terdaftar')
    .eq('periode', studentPeriode);

  const urutan = (registeredCount ?? 0) + 1;
  const tahun = new Date().getFullYear();
  // Format: [NamaPeriode singkat]_[Tahun]_[Urutan 3 digit]_[NIM]
  const periodeSlug = studentPeriode.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
  const idWisuda = `${periodeSlug}_${tahun}_${String(urutan).padStart(3, '0')}_${nim}`;

  // Generate QR Code URL
  const qrTogaUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(idWisuda)}`;

  // 5. Hash password baru
  const hashedPassword = await hashPassword(newPassword);

  // 6. Buat entry baru dan append ke log lama
  let currentLog: any[] = [];
  if (Array.isArray(existing.log_status)) {
    currentLog = existing.log_status;
  } else if (typeof existing.log_status === 'string') {
    try {
      const parsed = JSON.parse(existing.log_status);
      if (Array.isArray(parsed)) currentLog = parsed;
    } catch (e) {}
  }

  const newEntry = {
    timestamp: now,
    status: 'Terdaftar',
    catatan: 'Pendaftaran dikonfirmasi oleh wisudawan via portal'
  };
  const updatedLog = [...currentLog, newEntry];

  // 7. Update ke database
  const { error: updateError } = await supabase
    .from('wisudawan')
    .update({
      status: 'Terdaftar',
      terdaftar: now,
      id_wisuda: idWisuda,
      qr_toga: qrTogaUrl,
      password: hashedPassword,
      log_status: updatedLog,
      nama_gelar: namaGelarBaru,
      prodi_singkat: prodiSingkatBaru,
    })
    .eq('nim', nim);

  if (updateError) {
    console.error('Supabase daftarWisuda error:', updateError);
    throw new Error(updateError.message);
  }

  // 8. Invalidate cache
  try {
    const cacheKey = `wisudawan:${nim}`;
    await redis.del(cacheKey);
    await redis.del('dashboard:stats:all');
  } catch (err) {
    console.error('Redis del error:', err);
  }

  revalidatePath(`/wisudawan/${nim}`);
  revalidatePath('/admin/wisudawan');
  revalidatePath('/admin');

  return { 
    success: true, 
    terdaftar: now,
    id_wisuda: idWisuda,
    nama_gelar: namaGelarBaru,
    prodi_singkat: prodiSingkatBaru,
    password_hash: hashedPassword
  };
}

export async function changePasswordWisudawan(nim: string, newPassword: string) {
  try {
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    const { error } = await supabase
      .from('wisudawan')
      .update({ password: hashedPassword })
      .eq('nim', nim);

    if (error) throw new Error(error.message);

    try {
      await redis.del(`wisudawan:${nim}`);
    } catch (err) {}

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal mengubah password" };
  }
}

export async function resetPasswordWisudawan(nim: string) {
  try {
    const { getSetting } = await import('@/actions/settings');
    const defaultPassword = await getSetting('default_password', 'wisuda2026');
    
    const getMakassarTime = () => {
      const formatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Asia/Makassar',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
      });
      return formatter.format(new Date());
    };

    const now = getMakassarTime();

    // Ambil log_status yang ada
    const { data: existing } = await supabase
      .from('wisudawan')
      .select('log_status')
      .eq('nim', nim)
      .single();

    let currentLog: any[] = [];
    if (Array.isArray(existing?.log_status)) {
      currentLog = existing.log_status;
    } else if (typeof existing?.log_status === 'string') {
      try {
        const parsed = JSON.parse(existing.log_status);
        if (Array.isArray(parsed)) currentLog = parsed;
      } catch (e) {}
    }

    const newEntry = {
      timestamp: now,
      status: 'Reset Password',
      catatan: `Password direset ke default oleh Admin`
    };
    const updatedLog = [...currentLog, newEntry];

    const { error } = await supabase
      .from('wisudawan')
      .update({ 
        password: defaultPassword,
        log_status: updatedLog
      })
      .eq('nim', nim);

    if (error) {
      return { success: false, error: error.message };
    }

    // Invalidate cache
    try {
      await redis.del(`wisudawan:${nim}`);
    } catch (err) {
      console.error('Redis del error:', err);
    }

    revalidatePath('/admin/wisudawan');
    revalidatePath(`/wisudawan/${nim}`);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}


// Function helper untuk memanggil endpoint GAS (jika upload file dihandle server-side,
// namun disarankan upload dilakukan dari client-side untuk menghindari Vercel body size limit.
// Kita sediakan endpoint ini hanya untuk ekspor ke google sheet atau server-side upload)
export async function exportToGoogleSheets(period: string) {
  // Fetch all for period
  const { data, error } = await supabase
    .from('wisudawan')
    .select('*')
    .eq('periode', period)
    .order('urut', { ascending: true });

  if (error || !data) throw new Error(error.message);

  // Buat header
  const headers = [
    "NIM", "NAMA MAHASISWA", "IPK", "PREDIKAT", "FAKULTAS", "PRODI", 
    "TOGA", "TANGGAL YUDISIUM", "PERIODE", "STATUS", "SESI", "EMAIL", 
    "PASSWORD", "TIMESTAMP", "TERDAFTAR", "ID WISUDA", "TTL", 
    "JUDUL SKRIPSI / TESIS", "JENIS KELAMIN", "ORMAWA", 
    "JABATAN DALAM ORMAWA", "FOTO", "SERTIFIKAT", "NAMA GELAR", 
    "PRODI SINGKAT", "QR TOGA", "ID UNDANGAN", "QR UNDANGAN", 
    "URUT", "WAKTU TOGA", "WAKTU HADIR", "PRESTASI AKD", 
    "PRESTASI ORG", "SURVEI"
  ];

  // Convert row data
  const rows = data.map(r => {
    const legacy = mapToLegacyFormat(r) || {};
    return headers.map(h => legacy[h] || "");
  });

  const payload = {
    action: "export_sheet",
    sheet_name: `Data Wisudawan - ${period}`,
    overwrite: true,
    rows: [headers, ...rows]
  };

  const gasUrl = process.env.NEXT_PUBLIC_GAS_WEBAPP_URL;
  if (!gasUrl) throw new Error("GAS Web App URL not configured");

  const res = await fetch(gasUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const result = await res.json();
  if (result.status !== "success") throw new Error("Failed to export to Google Sheets");

  return result;
}

export async function importWisudawanBatch(data: any[]) {
  try {
    const { createSupabaseServerClient } = await import('@/lib/supabase-server');
    const supabaseServer = await createSupabaseServerClient();
    
    // Ambil session saat ini
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized. Please login first.' };

    // Ambil data admin
    const { data: adminData, error: adminError } = await supabaseServer
      .from('admin_users')
      .select('role, unit_kerja')
      .eq('id', user.id)
      .single();

    if (adminError || !adminData) {
      return { success: false, error: 'Data admin tidak ditemukan.' };
    }

    const role = adminData.role;
    const unitKerja = adminData.unit_kerja;

    // Ambil periode yang sedang aktif
    const { data: activePeriode } = await supabase
      .from('periode_wisuda')
      .select('nama_periode')
      .eq('status', 'Sedang Dibuka')
      .single();
    const namaPeriodeAktif = activePeriode?.nama_periode || null;

    // Ambil daftar nim yang sudah ada di database (untuk di-skip)
    const nimsInUpload = data.map(item => item.nim).filter(Boolean);
    const { data: existingData } = await supabase
      .from('wisudawan')
      .select('nim')
      .in('nim', nimsInUpload);

    const existingNims = new Set(existingData?.map(d => d.nim) || []);

    const getMakassarTime = () => {
      const d = new Date();
      // Format manual agar persis sesuai YYYY-MM-DD HH:mm:ss dalam waktu Makassar (WITA)
      const formatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Asia/Makassar',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      return formatter.format(d);
    };

    const currentTimeMakassar = getMakassarTime();

    const rowsToInsert = [];
    const failedRows = [];

    for (const item of data) {
      const nim = item.nim;
      const nama = item.nama_mahasiswa || nim;

      if (!nim) {
        failedRows.push({ nim: '-', nama: 'Tidak diketahui', reason: 'NIM kosong' });
        continue;
      }

      // Cek apakah sudah ada
      if (existingNims.has(nim)) {
        failedRows.push({ nim, nama, reason: 'NIM sudah terdaftar' });
        continue;
      }

      // Validasi unit_kerja jika role = admin_unit
      if (role === 'admin_unit') {
        if (!unitKerja) {
          failedRows.push({ nim, nama, reason: 'Akun Admin Unit Anda tidak memiliki referensi Fakultas yang valid' });
          continue;
        }
        if (item.fakultas?.toLowerCase().trim() !== unitKerja.toLowerCase().trim()) {
          failedRows.push({ nim, nama, reason: `Bukan Fakultas ${unitKerja}` });
          continue;
        }
      }

      // Validasi IPK
      if (item.ipk === undefined || item.ipk === null || item.ipk === '') {
        failedRows.push({ nim, nama, reason: 'Kolom IPK wajib diisi' });
        continue;
      }

      const ipkStr = item.ipk.toString().trim();
      
      if (!/^\d+\.\d+$/.test(ipkStr)) {
        failedRows.push({ nim, nama, reason: 'Format IPK tidak valid (gunakan titik)' });
        continue;
      }

      const ipkVal = parseFloat(ipkStr);
      if (isNaN(ipkVal) || ipkVal < 0 || ipkVal > 4) {
        failedRows.push({ nim, nama, reason: 'Nilai IPK di luar batas (0 - 4)' });
        continue;
      }

      const initLogEntry = {
        timestamp: currentTimeMakassar,
        status: 'Calon Wisudawan',
        catatan: 'Data diimport oleh admin ke sistem'
      };

      rowsToInsert.push({
        nim: item.nim,
        nama_mahasiswa: item.nama_mahasiswa,
        ipk: ipkVal,
        predikat: item.predikat,
        fakultas: item.fakultas,
        prodi: item.prodi,
        toga: null,
        tanggal_yudisium: item.tanggal_yudisium,
        terdaftar: null,
        periode: namaPeriodeAktif,
        status: 'Calon Wisudawan',
        timestamp: currentTimeMakassar,
        log_status: [initLogEntry]
      });
    }

    if (rowsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('wisudawan')
        .upsert(rowsToInsert, { onConflict: 'nim', ignoreDuplicates: true });

      if (insertError) {
        console.error('Error importing wisudawan batch:', insertError);
        return { success: false, error: insertError.message };
      }
    }

    // Invalidate cache
    await redis.del('wisudawan_list');
    await redis.del('dashboard:stats:all');
    revalidatePath('/admin/wisudawan');
    revalidatePath('/admin');
    
    return { success: true, count: rowsToInsert.length, failedRows };
  } catch (error: any) {
    console.error('Error in importWisudawanBatch:', error);
    return { success: false, error: error.message || 'Terjadi kesalahan.' };
  }
}

export async function deleteWisudawan(nim: string) {
  try {
    const { createSupabaseServerClient } = await import('@/lib/supabase-server');
    const supabaseServer = await createSupabaseServerClient();
    
    // Auth check
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // Role check: admin unit cuma bisa hapus fakultasnya sendiri
    const { data: adminData } = await supabaseServer
      .from('admin_users')
      .select('role, unit_kerja')
      .eq('id', user.id)
      .single();

    if (adminData?.role === 'admin_unit' && adminData.unit_kerja) {
      const { data: mhs } = await supabaseServer.from('wisudawan').select('fakultas').eq('nim', nim).single();
      if (mhs?.fakultas !== adminData.unit_kerja) {
        return { success: false, error: 'Anda tidak memiliki izin menghapus data wisudawan dari fakultas lain.' };
      }
    }

    // Ambil data foto sebelum dihapus
    const { data: mhsData } = await supabaseServer.from('wisudawan').select('foto').eq('nim', nim).single();

    const { error } = await supabaseServer.from('wisudawan').delete().eq('nim', nim);
    
    if (error) {
      console.error('Error deleting wisudawan:', error);
      return { success: false, error: error.message };
    }

    // Jika ada foto, hapus dari Google Drive
    if (mhsData?.foto) {
      const { extractGDriveFileId, deleteFotoFromGDrive } = await import('@/lib/uploadFoto');
      const fileId = extractGDriveFileId(mhsData.foto);
      if (fileId) {
        // Hapus secara background tanpa memblokir respon
        deleteFotoFromGDrive(fileId).catch(err => {
          console.error(`Gagal menghapus foto wisudawan ${nim} dari GDrive:`, err);
        });
      }
    }

    // Invalidate cache
    await redis.del('wisudawan_list');
    await redis.del('dashboard:stats:all');
    revalidatePath('/admin/wisudawan');
    revalidatePath('/admin');
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in deleteWisudawan:', error);
    return { success: false, error: error.message || 'Terjadi kesalahan saat menghapus.' };
  }
}

/**
 * Setup akun pertama kali: simpan email, toga, dan password baru (di-hash).
 * Dipanggil dari halaman /setup/[nim] saat wisudawan login dengan password default.
 */
export async function setupAkunWisudawan(nim: string, email: string, toga: string, newPassword: string) {
  try {
    // Hash password baru (SHA-256 + salt, sama seperti daftarWisuda)
    const hashPassword = async (plain: string): Promise<string> => {
      const salt = Math.random().toString(36).substring(2, 10);
      const encoder = new TextEncoder();
      const data = encoder.encode(salt + plain);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return `$sha256$${salt}$${hashHex}`;
    };

    const hashedPassword = await hashPassword(newPassword);

    const { error } = await supabase
      .from('wisudawan')
      .update({
        email,
        toga,
        password: hashedPassword,
      })
      .eq('nim', nim);

    if (error) {
      return { success: false, error: error.message };
    }

    // Invalidate cache
    try {
      await redis.del(`wisudawan:${nim}`);
    } catch (err) {}

    revalidatePath(`/wisudawan/${nim}`);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Terjadi kesalahan.' };
  }
}
