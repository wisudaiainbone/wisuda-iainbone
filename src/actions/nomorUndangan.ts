'use server';

import { supabase } from '@/lib/supabase';
import { redis } from '@/lib/redis';
import { revalidatePath } from 'next/cache';

export interface ProdiResult {
  prodi: string;
  count: number;
  nomor_dari: number;
  nomor_sampai: number;
}

export interface FakultasResult {
  fakultas: string;
  count: number;
  prodis: ProdiResult[];
}

export interface SesiResult {
  sesi: string;
  count: number;
  byFakultas: FakultasResult[];
}

export interface GenerateNomorResult {
  success: boolean;
  error?: string;
  totalProcessed: number;
  periode: string;
  sesiResults: SesiResult[];
}

export async function generateNomorUndangan(): Promise<GenerateNomorResult> {
  try {
    const { createSupabaseAdminClient } = await import('@/lib/supabase-server');
    const supabaseAdmin = await createSupabaseAdminClient();

    // 1. Ambil periode aktif
    const { data: aktivePeriode, error: periodeError } = await supabaseAdmin
      .from('periode_wisuda')
      .select('id, nama_periode')
      .eq('status', 'Sedang Dibuka')
      .single();

    if (periodeError || !aktivePeriode) {
      return { success: false, error: 'Tidak ada periode wisuda yang sedang aktif.', totalProcessed: 0, periode: '', sesiResults: [] };
    }

    const periode = aktivePeriode.nama_periode as string;

    // 2. Ambil semua wisudawan yang berstatus Terdaftar, periode aktif, dan sesi terisi
    const { data: wisudawanRaw, error: wError } = await supabaseAdmin
      .from('wisudawan')
      .select('nim, sesi, fakultas, prodi, tanggal_yudisium, periode')
      .eq('status', 'Terdaftar')
      .eq('periode', periode)
      .not('sesi', 'is', null);

    if (wError) {
      return { success: false, error: wError.message, totalProcessed: 0, periode, sesiResults: [] };
    }

    if (!wisudawanRaw || wisudawanRaw.length === 0) {
      return { success: false, error: 'Tidak ada wisudawan Terdaftar dengan sesi terisi di periode aktif.', totalProcessed: 0, periode, sesiResults: [] };
    }

    // 3. Ambil data prodi untuk urutan
    const { data: prodiData, error: prodiError } = await supabaseAdmin
      .from('prodi')
      .select('prodi, fakultas, urutan, sesi')
      .order('urutan', { ascending: true });

    if (prodiError) {
      return { success: false, error: prodiError.message, totalProcessed: 0, periode, sesiResults: [] };
    }

    // Buat map: prodi_name -> { urutan, sesi }
    const prodiMap = new Map<string, { urutan: number; sesi: string | null }>();
    for (const p of (prodiData || [])) {
      prodiMap.set(p.prodi, { urutan: p.urutan ?? 999, sesi: p.sesi });
    }

    // 4. Urutkan wisudawan:
    // - Sesi Satu lebih dulu dari Sesi Dua
    // - lalu urutan prodi (dari kolom urutan di tabel prodi)
    // - lalu tanggal_yudisium (ascending - tercepat dulu)
    const SESI_ORDER: Record<string, number> = {
      'Sesi Satu': 1,
      'Sesi Dua': 2,
    };

    const sorted = [...wisudawanRaw].sort((a, b) => {
      const sesiA = SESI_ORDER[a.sesi ?? ''] ?? 99;
      const sesiB = SESI_ORDER[b.sesi ?? ''] ?? 99;
      if (sesiA !== sesiB) return sesiA - sesiB;

      const urutanA = prodiMap.get(a.prodi ?? '')?.urutan ?? 999;
      const urutanB = prodiMap.get(b.prodi ?? '')?.urutan ?? 999;
      if (urutanA !== urutanB) return urutanA - urutanB;

      const tglA = a.tanggal_yudisium ? new Date(a.tanggal_yudisium).getTime() : 0;
      const tglB = b.tanggal_yudisium ? new Date(b.tanggal_yudisium).getTime() : 0;
      return tglA - tglB;
    });

    // 5. Reset dulu semua urut, id_undangan, qr_undangan di periode aktif
    const { error: resetError } = await supabaseAdmin
      .from('wisudawan')
      .update({ urut: null, id_undangan: null, qr_undangan: null })
      .eq('periode', periode)
      .eq('status', 'Terdaftar');

    if (resetError) {
      return { success: false, error: 'Gagal mereset data nomor lama: ' + resetError.message, totalProcessed: 0, periode, sesiResults: [] };
    }

    // 6. Assign nomor urut (reset per sesi)
    type UpdatePayload = { nim: string; urut: number; id_undangan: string; qr_undangan: string };
    const updates: UpdatePayload[] = [];

    const periodeSlug = periode.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
    let currentSesi = '';
    let sesiCounter = 0;

    for (const w of sorted) {
      if (w.sesi !== currentSesi) {
        currentSesi = w.sesi!;
        sesiCounter = 0; // reset per sesi
      }
      sesiCounter++;
      const sesiSlug = w.sesi ? w.sesi.replace(/\s+/g, '-').toUpperCase() : 'NO-SESI';
      const idUndangan = `UND_${periodeSlug}_${sesiSlug}_${String(sesiCounter).padStart(3, '0')}_${w.nim}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(idUndangan)}`;
      updates.push({ nim: w.nim, urut: sesiCounter, id_undangan: idUndangan, qr_undangan: qrUrl });
    }

    // 7. Batch update (per 50 rows agar tidak timeout)
    const BATCH_SIZE = 50;
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(({ nim, urut, id_undangan, qr_undangan }) =>
          supabaseAdmin
            .from('wisudawan')
            .update({ urut, id_undangan, qr_undangan })
            .eq('nim', nim)
        )
      );
    }

    // 8. Invalidasi Redis cache untuk semua NIM yang diproses
    try {
      const pipeline = redis.pipeline();
      for (const u of updates) {
        pipeline.del(`wisudawan:${u.nim}`);
      }
      pipeline.del('dashboard:stats:all');
      await pipeline.exec();
    } catch (redisErr) {
      console.error('Redis pipeline error (non-fatal):', redisErr);
    }

    revalidatePath('/admin/wisudawan');
    revalidatePath('/admin');

    // 9. Susun hasil per sesi > fakultas > prodi untuk ditampilkan di dialog
    const sesiMap = new Map<string, Map<string, Map<string, { nims: string[]; nomor_dari: number; nomor_sampai: number }>>>();

    let updateIndex = 0;
    for (const w of sorted) {
      const u = updates[updateIndex++];
      const sesi = w.sesi ?? 'Tidak Diketahui';
      const fak = w.fakultas ?? 'Tidak Diketahui';
      const prod = w.prodi ?? 'Tidak Diketahui';

      if (!sesiMap.has(sesi)) sesiMap.set(sesi, new Map());
      const fakMap = sesiMap.get(sesi)!;
      if (!fakMap.has(fak)) fakMap.set(fak, new Map());
      const prodMap = fakMap.get(fak)!;
      if (!prodMap.has(prod)) prodMap.set(prod, { nims: [], nomor_dari: u.urut, nomor_sampai: u.urut });
      const entry = prodMap.get(prod)!;
      entry.nims.push(u.nim);
      entry.nomor_sampai = u.urut;
    }

    const sesiResults: SesiResult[] = [];
    for (const [sesi, fakMap] of sesiMap) {
      const byFakultas: FakultasResult[] = [];
      let sesiTotal = 0;
      for (const [fak, prodMap] of fakMap) {
        const prodis: ProdiResult[] = [];
        let fakTotal = 0;
        for (const [prod, entry] of prodMap) {
          prodis.push({ prodi: prod, count: entry.nims.length, nomor_dari: entry.nomor_dari, nomor_sampai: entry.nomor_sampai });
          fakTotal += entry.nims.length;
        }
        byFakultas.push({ fakultas: fak, count: fakTotal, prodis });
        sesiTotal += fakTotal;
      }
      sesiResults.push({ sesi, count: sesiTotal, byFakultas });
    }

    return {
      success: true,
      totalProcessed: updates.length,
      periode,
      sesiResults,
    };
  } catch (err: any) {
    console.error('generateNomorUndangan error:', err);
    return { success: false, error: err.message, totalProcessed: 0, periode: '', sesiResults: [] };
  }
}
