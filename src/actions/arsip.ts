'use server';

import { supabase } from '@/lib/supabase';
import { redis } from '@/lib/redis';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/actions/adminAuth';

import { type ArsipWisudawan } from '@/lib/arsipUtils';


// ─────────────────────────────────────────────────────────
// ACTION 1: Arsipkan periode (ubah status → Selesai + wisudawan → Arsip)
// ─────────────────────────────────────────────────────────
export async function arsipakanPeriode(periodeId: string, namaPeriode: string) {
  try {
    const session = await getAdminSession();
    if (!session || !['superadmin', 'admin_institut'].includes(session.role ?? '')) {
      return { success: false, error: 'Tidak memiliki izin' };
    }

    // 0. Ambil jumlah total & terdaftar SEBELUM data mungkin dibersihkan nanti,
    //    lalu simpan ke sheet "Ringkasan Periode" di Google Sheets.
    const { data: periodeWisudawanSnap } = await supabase
      .from('wisudawan')
      .select('status')
      .eq('periode', namaPeriode)
      .not('status', 'eq', 'Dihapus');

    const totalWisudawan = periodeWisudawanSnap?.length ?? 0;
    const totalTerdaftar = periodeWisudawanSnap?.filter(w => w.status === 'Terdaftar').length ?? 0;
    const tanggalArsip = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

    const gasUrl = process.env.NEXT_PUBLIC_GAS_WEBAPP_URL;
    if (gasUrl) {
      try {
        await fetch(gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'save_ringkasan_periode',
            nama_periode: namaPeriode,
            total: totalWisudawan,
            terdaftar: totalTerdaftar,
            tanggal_arsip: tanggalArsip,
          }),
        });
      } catch (gasErr) {
        console.warn('[arsipakanPeriode] Gagal simpan ringkasan ke GAS (tidak fatal):', gasErr);
      }
    }

    // 1. Update status periode → Selesai
    const { error: periodeError } = await supabase
      .from('periode_wisuda')
      .update({ status: 'Selesai' })
      .eq('id', periodeId);

    if (periodeError) throw periodeError;

    // 2. Ambil semua NIM wisudawan di periode ini (selain yang sudah Dihapus)
    const { data: wisudawanList, error: fetchError } = await supabase
      .from('wisudawan')
      .select('nim, log_status')
      .eq('periode', namaPeriode)
      .not('status', 'eq', 'Dihapus');

    if (fetchError) throw fetchError;

    if (!wisudawanList || wisudawanList.length === 0) {
      revalidatePath('/admin/periode');
      revalidatePath('/admin');
      return { success: true, updatedCount: 0 };
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const arsipLogEntry = {
      timestamp: now,
      status: 'Periode Selesai',
      catatan: 'Periode diselesaikan — data ditandai selesai oleh sistem',
    };

    // 3. Batch update wisudawan → status Arsip (chunk 50 per request)
    const CHUNK_SIZE = 50;
    const allNims = wisudawanList.map((w) => w.nim);

    for (let i = 0; i < wisudawanList.length; i += CHUNK_SIZE) {
      const chunk = wisudawanList.slice(i, i + CHUNK_SIZE);
      const updates = chunk.map((w) => ({
        nim: w.nim,
        status_periode: 'Selesai',
        log_status: [...(Array.isArray(w.log_status) ? w.log_status : []), arsipLogEntry],
      }));

      const { error: updateError } = await supabase
        .from('wisudawan')
        .upsert(updates, { onConflict: 'nim' });

      if (updateError) throw updateError;
    }

    // 4. Invalidate Redis cache massal via pipeline
    const pipeline = redis.pipeline();
    for (const nim of allNims) {
      pipeline.del(`wisudawan:${nim}`);
    }
    pipeline.del('dashboard:stats:all');
    await pipeline.exec();

    // 5. Revalidate paths
    revalidatePath('/admin/periode');
    revalidatePath('/admin');
    revalidatePath('/admin/wisudawan');

    return { success: true, updatedCount: allNims.length };
  } catch (error: any) {
    console.error('[arsipakanPeriode] Error:', error);
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────────────────
// ACTION 2: Ambil data wisudawan arsip untuk suatu periode
// ─────────────────────────────────────────────────────────
export async function getArsipWisudawan(namaPeriode: string): Promise<ArsipWisudawan[]> {
  const { data, error } = await supabase
    .from('wisudawan')
    .select(`
      nim, nama_mahasiswa, ipk, predikat, fakultas, prodi,
      toga, tanggal_yudisium, periode, status, sesi, email,
      password, timestamp, terdaftar, id_wisuda, ttl, judul_skripsi,
      jenis_kelamin, ormawa, jabatan_dalam_ormawa, foto, sertifikat,
      nama_gelar, prodi_singkat, qr_toga, id_undangan, qr_undangan,
      urut, waktu_toga, waktu_hadir, prestasi_akd, prestasi_org,
      survei, log_status, prestasi_prodi, status_periode
    `)
    .eq('periode', namaPeriode)
    .not('status', 'eq', 'Dihapus')
    .order('sesi', { ascending: true, nullsFirst: false })
    .order('urut', { ascending: true, nullsFirst: false });

  if (error) {
    console.error('[getArsipWisudawan] Error:', error);
    return [];
  }

  return (data ?? []) as ArsipWisudawan[];
}

// ─────────────────────────────────────────────────────────
// ACTION 3: Statistik lengkap periode untuk halaman arsip
// ─────────────────────────────────────────────────────────
export async function getArsipStatistik(namaPeriode: string) {
  const { data: list, error } = await supabase
    .from('wisudawan')
    .select('fakultas, prodi, status, toga, jenis_kelamin, ipk, predikat, waktu_toga, waktu_hadir, sesi, prestasi_akd, prestasi_prodi, prestasi_org, survei')
    .eq('periode', namaPeriode)
    .not('status', 'eq', 'Dihapus');

  if (error || !list) return null;

  const aktif = list.filter(w => ['Terdaftar', 'Arsip', 'Selesai'].includes(w.status ?? ''));
  const total = aktif.length;

  const byFakultas: Record<string, number> = {};
  aktif.forEach(w => {
    const fak = w.fakultas || 'Lainnya';
    byFakultas[fak] = (byFakultas[fak] || 0) + 1;
  });

  const byProdi: Record<string, number> = {};
  aktif.forEach(w => {
    const p = w.prodi || 'Lainnya';
    byProdi[p] = (byProdi[p] || 0) + 1;
  });

  const togaDist: Record<string, number> = { S: 0, M: 0, L: 0, XL: 0, XXL: 0, '-': 0 };
  aktif.forEach(w => {
    const uk = (w.toga ?? '').trim().toUpperCase();
    if (['S', 'M', 'L', 'XL', 'XXL'].includes(uk)) togaDist[uk]++;
    else togaDist['-']++;
  });

  const jkDist = { L: 0, P: 0, Lainnya: 0 };
  aktif.forEach(w => {
    const jk = (w.jenis_kelamin ?? '').trim().toUpperCase();
    if (jk === 'L' || jk === 'LAKI-LAKI') jkDist.L++;
    else if (jk === 'P' || jk === 'PEREMPUAN') jkDist.P++;
    else jkDist.Lainnya++;
  });

  const ipkDist = { Cumlaude: 0, SangatMemuaskan: 0, Memuaskan: 0, Baik: 0 };
  aktif.forEach(w => {
    const ipk = parseFloat(w.ipk ?? '0');
    if (ipk >= 3.50) ipkDist.Cumlaude++;
    else if (ipk >= 3.01) ipkDist.SangatMemuaskan++;
    else if (ipk >= 2.76) ipkDist.Memuaskan++;
    else ipkDist.Baik++;
  });

  const sudahToga = aktif.filter(w => w.waktu_toga).length;
  const sudahHadir = aktif.filter(w => w.waktu_hadir).length;

  const sesiDist: Record<string, number> = { 'Sesi Satu': 0, 'Sesi Dua': 0, '-': 0 };
  aktif.forEach(w => {
    const s = w.sesi ?? '';
    if (s === 'Sesi Satu') sesiDist['Sesi Satu']++;
    else if (s === 'Sesi Dua') sesiDist['Sesi Dua']++;
    else sesiDist['-']++;
  });

  const prestasiAkd = aktif.filter(w => w.prestasi_akd).length;
  const prestasiOrg = aktif.filter(w => w.prestasi_org).length;
  const prestasiProdi = aktif.filter(w => w.prestasi_prodi).length;
  const sudahSurvei = aktif.filter(w => w.survei === 'TRUE').length;

  return {
    total,
    byFakultas,
    byProdi,
    togaDist,
    jkDist,
    ipkDist,
    sudahToga,
    belumToga: total - sudahToga,
    sudahHadir,
    belumHadir: total - sudahHadir,
    sesiDist,
    prestasiAkd,
    prestasiOrg,
    prestasiProdi,
    sudahSurvei,
    belumSurvei: total - sudahSurvei,
  };
}

// ─────────────────────────────────────────────────────────
// ACTION 4: Daftar semua periode berstatus Selesai
// ─────────────────────────────────────────────────────────
export async function getArsipPeriodeList() {
  const { data, error } = await supabase
    .from('periode_wisuda')
    .select('id, nama_periode, status, tanggal_pelaksanaan, created_at, kuota')
    .eq('status', 'Selesai')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getArsipPeriodeList] Error:', error);
    return [];
  }

  return data ?? [];
}

// ─────────────────────────────────────────────────────────
// ACTION 5: Kirim satu chunk wisudawan ke Google Sheets
// ─────────────────────────────────────────────────────────
export async function migrasiChunkKeGSheets(params: {
  sheetName: string;
  rows: string[][];
  overwrite: boolean;
}): Promise<{ success: boolean; sheetUrl?: string; error?: string }> {
  const gasUrl = process.env.NEXT_PUBLIC_GAS_WEBAPP_URL;
  if (!gasUrl) return { success: false, error: 'GAS URL tidak dikonfigurasi' };

  try {
    const body = {
      action: 'export_sheet',
      sheet_name: params.sheetName,
      rows: params.rows,
      overwrite: params.overwrite,
    };

    const res = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    if (json.status !== 'success') {
      return { success: false, error: json.message ?? 'Error dari GAS' };
    }

    return { success: true, sheetUrl: json.sheetUrl };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────
// ACTION 6: Kirim statistik ke Google Sheets (satu kali)
// ─────────────────────────────────────────────────────────
export async function migrasiStatistikKeGSheets(params: {
  sheetName: string;
  namaPeriode: string;
}): Promise<{ success: boolean; sheetUrl?: string; error?: string }> {
  const gasUrl = process.env.NEXT_PUBLIC_GAS_WEBAPP_URL;
  if (!gasUrl) return { success: false, error: 'GAS URL tidak dikonfigurasi' };

  try {
    const statistik = await getArsipStatistik(params.namaPeriode);
    if (!statistik) return { success: false, error: 'Gagal mengambil data statistik' };

    const rows: string[][] = [
      ['[STATISTIK PERIODE]', params.namaPeriode],
      ['Total Wisudawan Aktif', String(statistik.total)],
      ['Sudah Ambil Toga', String(statistik.sudahToga)],
      ['Belum Ambil Toga', String(statistik.belumToga)],
      ['Hadir Wisuda', String(statistik.sudahHadir)],
      ['Tidak Hadir', String(statistik.belumHadir)],
      ['Sudah Survei', String(statistik.sudahSurvei)],
      ['Belum Survei', String(statistik.belumSurvei)],
      ['[FAKULTAS]', ''],
      ...Object.entries(statistik.byFakultas).map(([k, v]) => [`Fakultas: ${k}`, String(v)]),
      ['[PRODI]', ''],
      ...Object.entries(statistik.byProdi).map(([k, v]) => [`Prodi: ${k}`, String(v)]),
      ['[UKURAN TOGA]', ''],
      ...Object.entries(statistik.togaDist).map(([k, v]) => [`Toga: ${k}`, String(v)]),
      ['[JENIS KELAMIN]', ''],
      ['Jenis Kelamin: Laki-Laki', String(statistik.jkDist.L)],
      ['Jenis Kelamin: Perempuan', String(statistik.jkDist.P)],
      ['Jenis Kelamin: Tidak Diketahui', String(statistik.jkDist.Lainnya)],
      ['[SEBARAN IPK]', ''],
      ['IPK: Cum Laude (>=3.50)', String(statistik.ipkDist.Cumlaude)],
      ['IPK: Sangat Memuaskan (3.01-3.49)', String(statistik.ipkDist.SangatMemuaskan)],
      ['IPK: Memuaskan (2.76-3.00)', String(statistik.ipkDist.Memuaskan)],
      ['IPK: Baik (<2.76)', String(statistik.ipkDist.Baik)],
      ['[SEBARAN SESI]', ''],
      ['Sesi: Sesi Satu', String(statistik.sesiDist['Sesi Satu'])],
      ['Sesi: Sesi Dua', String(statistik.sesiDist['Sesi Dua'])],
      ['Sesi: Tanpa Sesi', String(statistik.sesiDist['-'])],
      ['[DATA PRESTASI]', ''],
      ['Prestasi: Akademik', String(statistik.prestasiAkd)],
      ['Prestasi: Organisasi', String(statistik.prestasiOrg)],
      ['Prestasi: Prodi', String(statistik.prestasiProdi)],
    ];

    const body = {
      action: 'export_statistik_horizontal',
      sheet_name: params.sheetName,
      rows,
      overwrite: false,
    };

    const res = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    if (json.status !== 'success') {
      return { success: false, error: json.message ?? 'Error dari GAS' };
    }

    return { success: true, sheetUrl: json.sheetUrl };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
