'use server';

import { supabase } from '@/lib/supabase';
import { redis } from '@/lib/redis';

const DASHBOARD_CACHE_TTL = 900; // 15 menit

export type SummaryCards = {
  totalWisudawan: number;
  terdaftar: number;
  calonWisudawan: number;
  persentaseTerdaftar: number;
};

export type PeriodeData = {
  nama: string;
  total: number;
  terdaftar: number;
  kuota: number;
};

export type FakultasRow = {
  label: string;
  total: number;
  terdaftar: number;
};

export type ProdiRow = {
  label: string;
  fakultas: string;
  total: number;
  terdaftar: number;
};

export type JenisKelaminRow = {
  label: string;
  fakultas?: string;
  L: number;
  P: number;
};

export type PredikatRow = {
  label: string;
  fakultas?: string;
  Cumlaude: number;
  'Sangat Memuaskan': number;
  Memuaskan: number;
  Lainnya: number;
};

export type OrmawaSummary = {
  aktif: number;
  tidakAktif: number;
  byLabel: { label: string; aktif: number; tidakAktif: number }[];
  topOrmawa: { nama: string; jumlah: number }[];
};

export type TogaRow = {
  label: string;
  fakultas?: string;
  S: number; M: number; L: number; XL: number; XXL: number;
};

export type BinaryStatSummary = {
  sudah: number;
  belum: number;
  byLabel: { label: string; fakultas?: string; sudah: number; belum: number }[];
};

export type TrenHarian = {
  tanggal: string;
  jumlah: number;
};

export type IpkRow = {
  label: string;
  fakultas?: string;
  pujian: number; // 3.50 - 4.00
  sangatMemuaskan: number; // 3.01 - 3.49
  memuaskan: number; // 2.76 - 3.00
  baik: number; // 2.00 - 2.75
};

export type SesiSummary = {
  bySesi: { sesi: string; jumlah: number }[];
  byLabel: { label: string; fakultas?: string; [sesi: string]: any }[];
};

export type DashboardStats = {
  summary: SummaryCards;
  periodes: PeriodeData[];
  byFakultas: FakultasRow[];
  byProdi: ProdiRow[];
  jenisKelaminFakultas: JenisKelaminRow[];
  jenisKelaminProdi: JenisKelaminRow[];
  predikatFakultas: PredikatRow[];
  predikatProdi: PredikatRow[];
  ormawaFakultas: OrmawaSummary & { byLabel: { label: string; aktif: number; tidakAktif: number }[] };
  ormawaProdi: OrmawaSummary & { byLabel: { label: string; fakultas?: string; aktif: number; tidakAktif: number }[] };
  togaFakultas: TogaRow[];
  togaProdi: TogaRow[];
  kehadiranFakultas: BinaryStatSummary;
  kehadiranProdi: BinaryStatSummary;
  ambilTogaFakultas: BinaryStatSummary;
  ambilTogaProdi: BinaryStatSummary;
  ipkFakultas: IpkRow[];
  ipkProdi: IpkRow[];
  sesiFakultas: SesiSummary;
  sesiProdi: SesiSummary;
  prestasiFakultas: BinaryStatSummary;
  prestasiProdi: BinaryStatSummary;
  surveiFakultas: BinaryStatSummary;
  surveiProdi: BinaryStatSummary;
  trenHarian: TrenHarian[];
  prodiToFakultas: Record<string, string>;
  cachedAt: string;
};

function computeStats(rows: any[], periodeKuota: Record<string, number>): DashboardStats {
  const TOGA_SIZES = ['S', 'M', 'L', 'XL', 'XXL'] as const;
  const PREDIKAT_KEYS = ['Cumlaude', 'Sangat Memuaskan', 'Memuaskan', 'Lainnya'] as const;

  // --- Summary ---
  const totalWisudawan = rows.length;
  const terdaftar = rows.filter(r => r.status === 'Terdaftar').length;
  const calonWisudawan = rows.filter(r => r.status === 'Calon Wisudawan').length;
  const persentaseTerdaftar = totalWisudawan > 0 ? Math.round((terdaftar / totalWisudawan) * 100) : 0;

  // --- Per Periode ---
  const periodeMap: Record<string, { total: number; terdaftar: number }> = {};
  rows.forEach(r => {
    const p = r.periode || 'Tanpa Periode';
    if (!periodeMap[p]) periodeMap[p] = { total: 0, terdaftar: 0 };
    periodeMap[p].total++;
    if (r.status === 'Terdaftar') periodeMap[p].terdaftar++;
  });
  const periodes: PeriodeData[] = Object.entries(periodeMap).map(([nama, v]) => ({
    nama,
    total: v.total,
    terdaftar: v.terdaftar,
    kuota: periodeKuota[nama] ?? 0,
  }));

  // --- Per Fakultas ---
  const fakMap: Record<string, { total: number; terdaftar: number }> = {};
  const prodiMap: Record<string, { total: number; terdaftar: number; fakultas: string }> = {};

  const fakJK: Record<string, { L: number; P: number }> = {};
  const prodiJK: Record<string, { L: number; P: number }> = {};

  const fakPredikat: Record<string, Record<string, number>> = {};
  const prodiPredikat: Record<string, Record<string, number>> = {};

  const fakOrmawa: Record<string, { aktif: number; tidakAktif: number }> = {};
  const prodiOrmawa: Record<string, { aktif: number; tidakAktif: number }> = {};

  const fakToga: Record<string, Record<string, number>> = {};
  const prodiToga: Record<string, Record<string, number>> = {};

  const fakKehadiran: Record<string, { sudah: number; belum: number }> = {};
  const prodiKehadiran: Record<string, { sudah: number; belum: number }> = {};

  const fakAmbilToga: Record<string, { sudah: number; belum: number }> = {};
  const prodiAmbilToga: Record<string, { sudah: number; belum: number }> = {};

  const fakIpk: Record<string, Record<string, number>> = {};
  const prodiIpk: Record<string, Record<string, number>> = {};

  const fakSesi: Record<string, Record<string, number>> = {};
  const prodiSesi: Record<string, Record<string, number>> = {};
  const sesiCount: Record<string, number> = {};

  const fakPrestasi: Record<string, { sudah: number; belum: number }> = {};
  const prodiPrestasi: Record<string, { sudah: number; belum: number }> = {};

  const fakSurvei: Record<string, { sudah: number; belum: number }> = {};
  const prodiSurvei: Record<string, { sudah: number; belum: number }> = {};

  const ormawaCount: Record<string, number> = {};

  rows.forEach(r => {
    const fak = r.fakultas || 'Tanpa Fakultas';
    const prodi = r.prodi || 'Tanpa Prodi';
    const jk = r.jenis_kelamin === 'L' ? 'L' : 'P';
    const rawPredikat = (r.predikat || '').trim();
    const predikatKey: string = rawPredikat.toLowerCase().includes('cumlaude')
      ? 'Cumlaude'
      : rawPredikat.toLowerCase().includes('sangat')
        ? 'Sangat Memuaskan'
        : rawPredikat.toLowerCase().includes('memuaskan')
          ? 'Memuaskan'
          : 'Lainnya';
    const togaKey = (r.toga || '').toUpperCase();
    const hasOrmawa = !!(r.ormawa && r.ormawa.trim() !== '' && r.ormawa.toLowerCase() !== 'tidak ada' && r.ormawa.toLowerCase() !== '-');
    const isRegistered = r.status === 'Terdaftar';
    const isHadir = !!r.waktu_hadir;
    const isAmbilToga = !!r.waktu_toga;
    
    // Fakultas aggregates
    if (!fakMap[fak]) fakMap[fak] = { total: 0, terdaftar: 0 };
    fakMap[fak].total++;
    if (isRegistered) fakMap[fak].terdaftar++;

    // Prodi aggregates
    if (!prodiMap[prodi]) prodiMap[prodi] = { total: 0, terdaftar: 0, fakultas: fak };
    prodiMap[prodi].total++;
    if (isRegistered) prodiMap[prodi].terdaftar++;

    if (isRegistered) {
      // Asumsi IPK
      const rawIpk = r.ipk ? String(r.ipk).replace(',', '.') : '0';
      const ipk = !isNaN(Number(rawIpk)) ? Number(rawIpk) : 0;
      let ipkKey = 'baik';
      if (ipk >= 3.50) ipkKey = 'pujian';
      else if (ipk >= 3.01) ipkKey = 'sangatMemuaskan';
      else if (ipk >= 2.76) ipkKey = 'memuaskan';
      else if (ipk >= 2.00) ipkKey = 'baik';
      
      const sesi = r.sesi ? String(r.sesi).trim() : 'Tanpa Sesi';
      
      const hasPrestasi = !!((r.prestasi_akd && r.prestasi_akd.trim() !== '-' && r.prestasi_akd.trim() !== '') || 
                             (r.prestasi_org && r.prestasi_org.trim() !== '-' && r.prestasi_org.trim() !== ''));
                             
      const isSurvei = !!(r.survei && r.survei.trim() !== '');

      // JK
      if (!fakJK[fak]) fakJK[fak] = { L: 0, P: 0 };
      fakJK[fak][jk]++;
      if (!prodiJK[prodi]) prodiJK[prodi] = { L: 0, P: 0 };
      prodiJK[prodi][jk]++;

      // Predikat
      if (!fakPredikat[fak]) { fakPredikat[fak] = { Cumlaude: 0, 'Sangat Memuaskan': 0, Memuaskan: 0, Lainnya: 0 }; }
      fakPredikat[fak][predikatKey] = (fakPredikat[fak][predikatKey] || 0) + 1;
      if (!prodiPredikat[prodi]) { prodiPredikat[prodi] = { Cumlaude: 0, 'Sangat Memuaskan': 0, Memuaskan: 0, Lainnya: 0 }; }
      prodiPredikat[prodi][predikatKey] = (prodiPredikat[prodi][predikatKey] || 0) + 1;

      // Ormawa
      if (!fakOrmawa[fak]) fakOrmawa[fak] = { aktif: 0, tidakAktif: 0 };
      if (!prodiOrmawa[prodi]) prodiOrmawa[prodi] = { aktif: 0, tidakAktif: 0 };
      if (hasOrmawa) {
        fakOrmawa[fak].aktif++;
        prodiOrmawa[prodi].aktif++;
        ormawaCount[r.ormawa] = (ormawaCount[r.ormawa] || 0) + 1;
      } else {
        fakOrmawa[fak].tidakAktif++;
        prodiOrmawa[prodi].tidakAktif++;
      }

      // Toga
      if (TOGA_SIZES.includes(togaKey as any)) {
        if (!fakToga[fak]) { fakToga[fak] = { S: 0, M: 0, L: 0, XL: 0, XXL: 0 }; }
        fakToga[fak][togaKey] = (fakToga[fak][togaKey] || 0) + 1;
        if (!prodiToga[prodi]) { prodiToga[prodi] = { S: 0, M: 0, L: 0, XL: 0, XXL: 0 }; }
        prodiToga[prodi][togaKey] = (prodiToga[prodi][togaKey] || 0) + 1;
      }

      // Kehadiran
      if (!fakKehadiran[fak]) fakKehadiran[fak] = { sudah: 0, belum: 0 };
      if (!prodiKehadiran[prodi]) prodiKehadiran[prodi] = { sudah: 0, belum: 0 };
      if (isHadir) {
        fakKehadiran[fak].sudah++;
        prodiKehadiran[prodi].sudah++;
      } else {
        fakKehadiran[fak].belum++;
        prodiKehadiran[prodi].belum++;
      }

      // Ambil Toga
      if (!fakAmbilToga[fak]) fakAmbilToga[fak] = { sudah: 0, belum: 0 };
      if (!prodiAmbilToga[prodi]) prodiAmbilToga[prodi] = { sudah: 0, belum: 0 };
      if (isAmbilToga) {
        fakAmbilToga[fak].sudah++;
        prodiAmbilToga[prodi].sudah++;
      } else {
        fakAmbilToga[fak].belum++;
        prodiAmbilToga[prodi].belum++;
      }

      // IPK
      if (!fakIpk[fak]) fakIpk[fak] = { pujian: 0, sangatMemuaskan: 0, memuaskan: 0, baik: 0 };
      fakIpk[fak][ipkKey] = (fakIpk[fak][ipkKey] || 0) + 1;
      if (!prodiIpk[prodi]) prodiIpk[prodi] = { pujian: 0, sangatMemuaskan: 0, memuaskan: 0, baik: 0 };
      prodiIpk[prodi][ipkKey] = (prodiIpk[prodi][ipkKey] || 0) + 1;

      // Sesi
      if (!fakSesi[fak]) fakSesi[fak] = {};
      fakSesi[fak][sesi] = (fakSesi[fak][sesi] || 0) + 1;
      if (!prodiSesi[prodi]) prodiSesi[prodi] = {};
      prodiSesi[prodi][sesi] = (prodiSesi[prodi][sesi] || 0) + 1;
      sesiCount[sesi] = (sesiCount[sesi] || 0) + 1;

      // Prestasi
      if (!fakPrestasi[fak]) fakPrestasi[fak] = { sudah: 0, belum: 0 };
      if (!prodiPrestasi[prodi]) prodiPrestasi[prodi] = { sudah: 0, belum: 0 };
      if (hasPrestasi) {
        fakPrestasi[fak].sudah++;
        prodiPrestasi[prodi].sudah++;
      } else {
        fakPrestasi[fak].belum++;
        prodiPrestasi[prodi].belum++;
      }

      // Survei
      if (!fakSurvei[fak]) fakSurvei[fak] = { sudah: 0, belum: 0 };
      if (!prodiSurvei[prodi]) prodiSurvei[prodi] = { sudah: 0, belum: 0 };
      if (isSurvei) {
        fakSurvei[fak].sudah++;
        prodiSurvei[prodi].sudah++;
      } else {
        fakSurvei[fak].belum++;
        prodiSurvei[prodi].belum++;
      }
    }
  });

  // Top 5 Ormawa
  const topOrmawa = Object.entries(ormawaCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([nama, jumlah]) => ({ nama, jumlah }));

  // --- Tren Harian (dari kolom terdaftar, bukan timestamp) ---
  const trenMap: Record<string, number> = {};
  rows.forEach(r => {
    if (!r.terdaftar) return; // skip jika belum terdaftar
    const tgl = String(r.terdaftar).slice(0, 10); // "YYYY-MM-DD"
    trenMap[tgl] = (trenMap[tgl] || 0) + 1;
  });
  const trenHarian: TrenHarian[] = Object.entries(trenMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([tanggal, jumlah]) => ({ tanggal, jumlah }));

  // --- Compose Results ---
  const byFakultas: FakultasRow[] = Object.entries(fakMap)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([label, v]) => ({ label, ...v }));

  const byProdi: ProdiRow[] = Object.entries(prodiMap)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([label, v]) => ({ label, ...v }));

  const jenisKelaminFakultas: JenisKelaminRow[] = Object.entries(fakJK)
    .map(([label, v]) => ({ label, ...v }));

  const jenisKelaminProdi: JenisKelaminRow[] = Object.entries(prodiJK)
    .map(([label, v]) => ({ label, fakultas: prodiMap[label]?.fakultas, ...v }));

  const predikatFakultas: PredikatRow[] = Object.entries(fakPredikat)
    .map(([label, v]) => ({ label, Cumlaude: v.Cumlaude, 'Sangat Memuaskan': v['Sangat Memuaskan'], Memuaskan: v.Memuaskan, Lainnya: v.Lainnya }));

  const predikatProdi: PredikatRow[] = Object.entries(prodiPredikat)
    .map(([label, v]) => ({ label, fakultas: prodiMap[label]?.fakultas, Cumlaude: v.Cumlaude, 'Sangat Memuaskan': v['Sangat Memuaskan'], Memuaskan: v.Memuaskan, Lainnya: v.Lainnya }));

  const totalAktifFak = Object.values(fakOrmawa).reduce((s, v) => s + v.aktif, 0);
  const totalTidakAktifFak = Object.values(fakOrmawa).reduce((s, v) => s + v.tidakAktif, 0);
  const ormawaFakultas: DashboardStats['ormawaFakultas'] = {
    aktif: totalAktifFak,
    tidakAktif: totalTidakAktifFak,
    topOrmawa,
    byLabel: Object.entries(fakOrmawa).map(([label, v]) => ({ label, ...v })),
  };

  const totalAktifProdi = Object.values(prodiOrmawa).reduce((s, v) => s + v.aktif, 0);
  const totalTidakAktifProdi = Object.values(prodiOrmawa).reduce((s, v) => s + v.tidakAktif, 0);
  const ormawaProdi: DashboardStats['ormawaProdi'] = {
    aktif: totalAktifProdi,
    tidakAktif: totalTidakAktifProdi,
    topOrmawa,
    byLabel: Object.entries(prodiOrmawa).map(([label, v]) => ({ label, ...v })),
  };

  const togaFakultas: TogaRow[] = Object.entries(fakToga)
    .map(([label, v]) => ({ label, S: v.S || 0, M: v.M || 0, L: v.L || 0, XL: v.XL || 0, XXL: v.XXL || 0 }));

  const togaProdi: TogaRow[] = Object.entries(prodiToga)
    .map(([label, v]) => ({ label, fakultas: prodiMap[label]?.fakultas, S: v.S || 0, M: v.M || 0, L: v.L || 0, XL: v.XL || 0, XXL: v.XXL || 0 }));

  const kehadiranFakultas: BinaryStatSummary = {
    sudah: Object.values(fakKehadiran).reduce((s, v) => s + v.sudah, 0),
    belum: Object.values(fakKehadiran).reduce((s, v) => s + v.belum, 0),
    byLabel: Object.entries(fakKehadiran).map(([label, v]) => ({ label, ...v })),
  };

  const kehadiranProdi: BinaryStatSummary = {
    sudah: Object.values(prodiKehadiran).reduce((s, v) => s + v.sudah, 0),
    belum: Object.values(prodiKehadiran).reduce((s, v) => s + v.belum, 0),
    byLabel: Object.entries(prodiKehadiran).map(([label, v]) => ({ label, fakultas: prodiMap[label]?.fakultas, ...v })),
  };

  const ambilTogaFakultas: BinaryStatSummary = {
    sudah: Object.values(fakAmbilToga).reduce((s, v) => s + v.sudah, 0),
    belum: Object.values(fakAmbilToga).reduce((s, v) => s + v.belum, 0),
    byLabel: Object.entries(fakAmbilToga).map(([label, v]) => ({ label, ...v })),
  };

  const ambilTogaProdi: BinaryStatSummary = {
    sudah: Object.values(prodiAmbilToga).reduce((s, v) => s + v.sudah, 0),
    belum: Object.values(prodiAmbilToga).reduce((s, v) => s + v.belum, 0),
    byLabel: Object.entries(prodiAmbilToga).map(([label, v]) => ({ label, fakultas: prodiMap[label]?.fakultas, ...v })),
  };

  const ipkFakultas: IpkRow[] = Object.entries(fakIpk).map(([label, v]) => ({
    label,
    pujian: v.pujian || 0,
    sangatMemuaskan: v.sangatMemuaskan || 0,
    memuaskan: v.memuaskan || 0,
    baik: v.baik || 0,
  }));

  const ipkProdi: IpkRow[] = Object.entries(prodiIpk).map(([label, v]) => ({
    label,
    fakultas: prodiMap[label]?.fakultas,
    pujian: v.pujian || 0,
    sangatMemuaskan: v.sangatMemuaskan || 0,
    memuaskan: v.memuaskan || 0,
    baik: v.baik || 0,
  }));

  const sesiFakultas: SesiSummary = {
    bySesi: Object.entries(sesiCount).map(([sesi, jumlah]) => ({ sesi, jumlah })).sort((a, b) => b.jumlah - a.jumlah),
    byLabel: Object.entries(fakSesi).map(([label, v]) => ({ label, ...v })),
  };

  const sesiProdi: SesiSummary = {
    bySesi: Object.entries(sesiCount).map(([sesi, jumlah]) => ({ sesi, jumlah })).sort((a, b) => b.jumlah - a.jumlah),
    byLabel: Object.entries(prodiSesi).map(([label, v]) => ({ label, fakultas: prodiMap[label]?.fakultas, ...v })),
  };

  const prestasiFakultas: BinaryStatSummary = {
    sudah: Object.values(fakPrestasi).reduce((s, v) => s + v.sudah, 0),
    belum: Object.values(fakPrestasi).reduce((s, v) => s + v.belum, 0),
    byLabel: Object.entries(fakPrestasi).map(([label, v]) => ({ label, ...v })),
  };

  const prestasiProdi: BinaryStatSummary = {
    sudah: Object.values(prodiPrestasi).reduce((s, v) => s + v.sudah, 0),
    belum: Object.values(prodiPrestasi).reduce((s, v) => s + v.belum, 0),
    byLabel: Object.entries(prodiPrestasi).map(([label, v]) => ({ label, fakultas: prodiMap[label]?.fakultas, ...v })),
  };

  const surveiFakultas: BinaryStatSummary = {
    sudah: Object.values(fakSurvei).reduce((s, v) => s + v.sudah, 0),
    belum: Object.values(fakSurvei).reduce((s, v) => s + v.belum, 0),
    byLabel: Object.entries(fakSurvei).map(([label, v]) => ({ label, ...v })),
  };

  const surveiProdi: BinaryStatSummary = {
    sudah: Object.values(prodiSurvei).reduce((s, v) => s + v.sudah, 0),
    belum: Object.values(prodiSurvei).reduce((s, v) => s + v.belum, 0),
    byLabel: Object.entries(prodiSurvei).map(([label, v]) => ({ label, fakultas: prodiMap[label]?.fakultas, ...v })),
  };

  // Map prodi → fakultas untuk keperluan drilldown di client
  const prodiToFakultas: Record<string, string> = {};
  Object.entries(prodiMap).forEach(([prodi, v]) => {
    prodiToFakultas[prodi] = v.fakultas;
  });

  return {
    summary: { totalWisudawan, terdaftar, calonWisudawan, persentaseTerdaftar },
    periodes,
    byFakultas,
    byProdi,
    jenisKelaminFakultas,
    jenisKelaminProdi,
    predikatFakultas,
    predikatProdi,
    ormawaFakultas,
    ormawaProdi: {
      ...ormawaProdi,
      byLabel: Object.entries(prodiOrmawa).map(([label, v]) => ({ label, fakultas: prodiMap[label]?.fakultas, ...v })),
    },
    togaFakultas,
    togaProdi,
    kehadiranFakultas,
    kehadiranProdi,
    ambilTogaFakultas,
    ambilTogaProdi,
    ipkFakultas,
    ipkProdi,
    sesiFakultas,
    sesiProdi,
    prestasiFakultas,
    prestasiProdi,
    surveiFakultas,
    surveiProdi,
    trenHarian,
    prodiToFakultas,
    cachedAt: new Date().toISOString(),
  };
}

export async function getDashboardStats(periode?: string): Promise<DashboardStats> {
  const cacheKey = `dashboard:stats:${periode ?? 'all'}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return (typeof cached === 'string' ? JSON.parse(cached) : cached) as DashboardStats;
    }
  } catch (err) {
    console.error('Redis get error (dashboard):', err);
  }

  // Query Supabase — hanya kolom yang diperlukan
  const query = supabase
    .from('wisudawan')
    .select('fakultas, prodi, status, jenis_kelamin, predikat, ormawa, toga, waktu_hadir, waktu_toga, terdaftar, periode, timestamp, ipk, sesi, prestasi_akd, prestasi_org, survei');

  const { data: rows, error } = periode
    ? await query.eq('periode', periode)
    : await query;

  if (error) {
    console.error('Supabase dashboard query error:', error);
    return getEmptyStats();
  }

  // Ambil kuota dari tabel periode_wisuda
  const { data: periodeRows } = await supabase
    .from('periode_wisuda')
    .select('nama_periode, kuota');

  const periodeKuota: Record<string, number> = {};
  (periodeRows || []).forEach((p: any) => {
    if (p.nama_periode) periodeKuota[p.nama_periode] = p.kuota ?? 0;
  });

  const stats = computeStats(rows || [], periodeKuota);

  try {
    await redis.set(cacheKey, JSON.stringify(stats), { ex: DASHBOARD_CACHE_TTL });
  } catch (err) {
    console.error('Redis set error (dashboard):', err);
  }

  return stats;
}

export async function invalidateDashboardCache() {
  const keys = ['dashboard:stats:all'];
  try {
    await Promise.all(keys.map(k => redis.del(k)));
  } catch (err) {
    console.error('Redis del error (dashboard):', err);
  }
}

function getEmptyStats(): DashboardStats {
  return {
    summary: { totalWisudawan: 0, terdaftar: 0, calonWisudawan: 0, persentaseTerdaftar: 0 },
    periodes: [],
    byFakultas: [],
    byProdi: [],
    jenisKelaminFakultas: [],
    jenisKelaminProdi: [],
    predikatFakultas: [],
    predikatProdi: [],
    ormawaFakultas: { aktif: 0, tidakAktif: 0, topOrmawa: [], byLabel: [] },
    ormawaProdi: { aktif: 0, tidakAktif: 0, topOrmawa: [], byLabel: [] },
    togaFakultas: [],
    togaProdi: [],
    kehadiranFakultas: { sudah: 0, belum: 0, byLabel: [] },
    kehadiranProdi: { sudah: 0, belum: 0, byLabel: [] },
    ambilTogaFakultas: { sudah: 0, belum: 0, byLabel: [] },
    ambilTogaProdi: { sudah: 0, belum: 0, byLabel: [] },
    ipkFakultas: [],
    ipkProdi: [],
    sesiFakultas: { bySesi: [], byLabel: [] },
    sesiProdi: { bySesi: [], byLabel: [] },
    prestasiFakultas: { sudah: 0, belum: 0, byLabel: [] },
    prestasiProdi: { sudah: 0, belum: 0, byLabel: [] },
    surveiFakultas: { sudah: 0, belum: 0, byLabel: [] },
    surveiProdi: { sudah: 0, belum: 0, byLabel: [] },
    trenHarian: [],
    prodiToFakultas: {},
    cachedAt: new Date().toISOString(),
  };
}

export async function getWisudawanListByProdi(prodi: string, periode?: string) {
  let query = supabase
    .from('wisudawan')
    .select('nim, nama_mahasiswa, fakultas, prodi, status, predikat, ipk, toga, terdaftar')
    .eq('prodi', prodi);

  if (periode) {
    query = query.eq('periode', periode);
  }

  const { data, error } = await query;
  if (error) {
    console.error('getWisudawanListByProdi error:', error);
    return [];
  }
  return data;
}
