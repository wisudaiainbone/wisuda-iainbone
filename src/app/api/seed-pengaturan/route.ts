import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
// Migration data has been removed.
// import pengaturanData from '@/data/pengaturan.json';

export async function GET() {
  try {
    const periods: any[] = []; // pengaturanData.graduationPeriods;
    const dataToInsert = periods.map((p: any) => {
      const { title, status, ...restSettings } = p;
      return {
        nama_periode: title,
        status: status,
        data_pengaturan: restSettings
      };
    });

    const { data, error } = await supabase
      .from('periode_wisuda')
      .insert(dataToInsert)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil migrasi ${dataToInsert.length} data pengaturan periode ke Supabase.` 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
