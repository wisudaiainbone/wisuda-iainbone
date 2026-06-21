import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

const prodiData = [
  { fakultas: "Fakultas Syariah dan Hukum Islam", prodi: "Hukum Keluarga Islam", singkatan: "HKI", gelar: "S.H." },
  { fakultas: "Fakultas Syariah dan Hukum Islam", prodi: "Hukum Tatanegara", singkatan: "HTN", gelar: "S.H." },
  { fakultas: "Fakultas Syariah dan Hukum Islam", prodi: "Hukum Ekonomi Syariah", singkatan: "HES", gelar: "S.H." },
  { fakultas: "Fakultas Tarbiyah", prodi: "Pendidikan Agama Islam", singkatan: "PAI", gelar: "S.Pd." },
  { fakultas: "Fakultas Tarbiyah", prodi: "Pendidikan Bahasa Arab", singkatan: "PBA", gelar: "S.Pd." },
  { fakultas: "Fakultas Tarbiyah", prodi: "Tadris Bahasa Inggris", singkatan: "TBI", gelar: "S.Pd." },
  { fakultas: "Fakultas Tarbiyah", prodi: "Manajemen Pendidikan Islam", singkatan: "MPI", gelar: "S.Pd." },
  { fakultas: "Fakultas Tarbiyah", prodi: "Pendidikan Guru Madrasah Ibtidaiyah", singkatan: "PGMI", gelar: "S.Pd." },
  { fakultas: "Fakultas Tarbiyah", prodi: "Pendidikan Islam Anak Usia Dini", singkatan: "PIAUD", gelar: "S.Pd." },
  { fakultas: "Fakultas Ushuluddin dan Dakwah", prodi: "Ilmu Al-Qur'an Dan Tafsir", singkatan: "IAT", gelar: "S.Ag." },
  { fakultas: "Fakultas Ushuluddin dan Dakwah", prodi: "Komunikasi Dan Penyiaran Islam", singkatan: "KPI", gelar: "S.Sos." },
  { fakultas: "Fakultas Ushuluddin dan Dakwah", prodi: "Bimbingan Penyuluhan Islam", singkatan: "BPI", gelar: "S.Sos." },
  { fakultas: "Fakultas Ekonomi dan Bisnis Islam", prodi: "Ekonomi Syariah", singkatan: "ES", gelar: "S.E." },
  { fakultas: "Fakultas Ekonomi dan Bisnis Islam", prodi: "Perbankan Syariah", singkatan: "PS", gelar: "S.E." },
  { fakultas: "Fakultas Ekonomi dan Bisnis Islam", prodi: "Akuntansi Syariah", singkatan: "AS", gelar: "S.Akun." },
  { fakultas: "Fakultas Ekonomi dan Bisnis Islam", prodi: "Manajemen Bisnis Syariah", singkatan: "MBS", gelar: "S.E." },
  { fakultas: "Pascasarjana", prodi: "S3 Pendidikan Agama Islam", singkatan: "PAI", gelar: "Dr." },
  { fakultas: "Pascasarjana", prodi: "S2 Pendidikan Agama Islam", singkatan: "PAI", gelar: "M.Pd." },
  { fakultas: "Pascasarjana", prodi: "S2 Pendidikan Bahasa Arab", singkatan: "PBA", gelar: "M.Pd." },
  { fakultas: "Pascasarjana", prodi: "S2 Ekonomi Syariah", singkatan: "ES", gelar: "M.E." },
  { fakultas: "Pascasarjana", prodi: "S2 Hukum Keluarga Islam", singkatan: "HKI", gelar: "M.H." },
  { fakultas: "Pascasarjana", prodi: "S2 Hukum Tatanegara", singkatan: "HTN", gelar: "M.H." },
];

export async function GET() {
  try {
    const supabase = await createSupabaseAdminClient();

    const { error } = await supabase
      .from('prodi')
      .upsert(prodiData, { onConflict: 'prodi', ignoreDuplicates: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil menyimpan ${prodiData.length} data prodi ke Supabase.`,
      count: prodiData.length,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
