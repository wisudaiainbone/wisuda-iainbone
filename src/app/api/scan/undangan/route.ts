import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redis, invalidateAllDashboardCache } from '@/lib/redis';
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
    const absensiToken = req.cookies.get('absensi_token')?.value;

    let isAuthorized = false;
    if (session) {
      isAuthorized = true;
    } else if (absensiToken) {
      // Validasi absensi token berdasarkan pengaturan
      const { getSetting } = await import('@/actions/settings');
      const allowAbsensiLogin = await getSetting('allow_absensi_login', 'true', true);
      if (allowAbsensiLogin === 'true') {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    let { id_undangan, nim, active_sesi } = body;

    // Jika yang dikirim adalah NIM, cari id_undangan-nya dulu
    if (!id_undangan && nim) {
      const { data: lookup, error: lookupErr } = await supabase
        .from('wisudawan')
        .select('id_undangan')
        .eq('nim', nim.trim())
        .single();

      if (lookupErr || !lookup?.id_undangan) {
        return NextResponse.json({ success: false, error: 'NIM tidak ditemukan atau belum memiliki ID Undangan' }, { status: 404 });
      }
      id_undangan = lookup.id_undangan;
    }

    if (!id_undangan) {
      return NextResponse.json({ success: false, error: 'QR Code atau NIM tidak valid' }, { status: 400 });
    }

    // 1. Coba get dari Redis
    let dataStr = await redis.get(`scan:undangan:${id_undangan}`);
    let data;

    if (dataStr) {
      data = typeof dataStr === 'string' ? JSON.parse(dataStr) : dataStr;
    } else {
      // 2. Fallback query Supabase
      const { data: dbData, error } = await supabase
        .from('wisudawan')
        .select('nim, nama_mahasiswa, prodi_singkat, fakultas, sesi, urut, waktu_hadir, id_undangan')
        .eq('id_undangan', id_undangan)
        .single();

      if (error || !dbData) {
        return NextResponse.json({ success: false, error: 'Data wisudawan tidak ditemukan atau QR Code tidak dikenali' }, { status: 404 });
      }
      data = dbData;
      // Populate cache
      await redis.set(`scan:undangan:${id_undangan}`, JSON.stringify(data), { ex: 172800 });
    }

    // 3. Validasi Sesi
    // Jika admin memilih sesi tertentu di UI, pastikan wisudawan berada di sesi tersebut
    if (active_sesi && active_sesi !== 'Semua Sesi') {
      if (data.sesi !== active_sesi) {
        return NextResponse.json({ 
          success: false, 
          error: 'wrong_session', 
          message: `Wisudawan terdaftar pada ${data.sesi || 'Sesi tidak diketahui'}, namun scan saat ini untuk ${active_sesi}.`,
          data 
        }, { status: 200 });
      }
    }

    // 4. Validasi Double Scan
    if (data.waktu_hadir) {
      return NextResponse.json({ 
        success: false, 
        error: 'already_taken', 
        message: 'Kehadiran sudah tercatat sebelumnya!',
        data 
      }, { status: 200 }); // Status 200 agar dihandle sebagai warning oleh client
    }

    // 5. Catat waktu kehadiran
    const timestamp = getMakassarTime();
    
    // a. Update Redis (Sync)
    data.waktu_hadir = timestamp;
    await redis.set(`scan:undangan:${id_undangan}`, JSON.stringify(data), { ex: 172800 });

    // b. Update Supabase (Async fire-and-forget)
    supabase.from('wisudawan').update({ waktu_hadir: timestamp }).eq('id_undangan', id_undangan).then(({ error }) => {
      if (error) console.error('Failed to update Supabase waktu_hadir:', error);
    });

    // Invalidasi dashboard cache secara background
    invalidateAllDashboardCache().catch(() => {});

    // 6. Return success
    return NextResponse.json({ 
      success: true, 
      message: 'Berhasil mencatat kehadiran',
      data 
    });

  } catch (err: any) {
    console.error('Scan kehadiran route error:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
