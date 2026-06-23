import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redis } from '@/lib/redis';
import { supabase } from '@/lib/supabase';

function getMakassarTime() {
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Makassar',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  });
  return formatter.format(new Date());
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    let { id_wisuda, nim } = body;

    // Jika yang dikirim adalah NIM, cari id_wisuda-nya dulu
    if (!id_wisuda && nim) {
      const { data: lookup, error: lookupErr } = await supabase
        .from('wisudawan')
        .select('id_wisuda')
        .eq('nim', nim.trim())
        .single();

      if (lookupErr || !lookup?.id_wisuda) {
        return NextResponse.json({ success: false, error: 'NIM tidak ditemukan atau belum memiliki ID Wisuda' }, { status: 404 });
      }
      id_wisuda = lookup.id_wisuda;
    }

    if (!id_wisuda) {
      return NextResponse.json({ success: false, error: 'QR Code atau NIM tidak valid' }, { status: 400 });
    }

    // 1. Coba get dari Redis
    let dataStr = await redis.get(`scan:toga:${id_wisuda}`);
    let data;

    if (dataStr) {
      data = typeof dataStr === 'string' ? JSON.parse(dataStr) : dataStr;
    } else {
      // 2. Fallback query Supabase
      const { data: dbData, error } = await supabase
        .from('wisudawan')
        .select('nim, nama_mahasiswa, prodi_singkat, fakultas, toga, waktu_toga, id_wisuda')
        .eq('id_wisuda', id_wisuda)
        .single();

      if (error || !dbData) {
        return NextResponse.json({ success: false, error: 'Data wisudawan tidak ditemukan atau QR Code tidak dikenali' }, { status: 404 });
      }
      data = dbData;
      // Populate cache
      await redis.set(`scan:toga:${id_wisuda}`, JSON.stringify(data), { ex: 172800 });
    }

    // 3. Validasi
    if (data.waktu_toga) {
      return NextResponse.json({ 
        success: false, 
        error: 'already_taken', 
        message: 'Toga sudah diambil sebelumnya!',
        data 
      }, { status: 200 }); // Status 200 agar dihandle sebagai warning oleh client
    }

    if (!data.toga) {
      return NextResponse.json({ 
        success: false, 
        error: 'toga_not_filled', 
        message: 'Ukuran toga belum diisi oleh wisudawan!',
        data 
      }, { status: 200 });
    }

    // 4. Catat waktu pengambilan
    const timestamp = getMakassarTime();
    
    // a. Update Redis (Sync)
    data.waktu_toga = timestamp;
    await redis.set(`scan:toga:${id_wisuda}`, JSON.stringify(data), { ex: 172800 });

    // b. Update Supabase (Async fire-and-forget)
    supabase.from('wisudawan').update({ waktu_toga: timestamp }).eq('id_wisuda', id_wisuda).then(({ error }) => {
      if (error) console.error('Failed to update Supabase waktu_toga:', error);
    });

    // Invalidasi dashboard cache secara background
    redis.del('dashboard:stats:all').catch(() => {});

    // 5. Return success
    return NextResponse.json({ 
      success: true, 
      message: 'Berhasil mencatat pengambilan Toga',
      data 
    });

  } catch (err: any) {
    console.error('Scan toga route error:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
