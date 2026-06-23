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
    const { id, sesi: activeSesi } = body; // This is the ID Tamu and Target Sesi

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID Tamu tidak valid' }, { status: 400 });
    }

    // 1. Coba get dari Redis
    let dataStr = await redis.get(`scan:tamu:${id}`);
    let data;

    if (dataStr) {
      data = typeof dataStr === 'string' ? JSON.parse(dataStr) : dataStr;
    } else {
      // 2. Fallback query Supabase
      const { data: dbData, error } = await supabase
        .from('tamu')
        .select('id, nama, jabatan, alamat, sesi, hadir, qr_code')
        .eq('id', id)
        .single();

      if (error || !dbData) {
        return NextResponse.json({ success: false, error: 'Data tamu tidak ditemukan' }, { status: 404 });
      }
      data = dbData;
      // Populate cache
      await redis.set(`scan:tamu:${id}`, JSON.stringify(data), { ex: 172800 });
    }

    // 3. Validasi Sesi
    if (activeSesi && data.sesi !== activeSesi) {
      return NextResponse.json({ 
        success: false, 
        error: 'wrong_session', 
        message: `Sesi tidak sesuai! Tamu terdaftar di ${data.sesi}.`,
        data 
      }, { status: 200 }); // Warning status
    }

    // 4. Validasi Kehadiran
    if (data.hadir) {
      return NextResponse.json({ 
        success: false, 
        error: 'already_taken', 
        message: `Tamu sudah hadir sebelumnya pada ${data.hadir.split(' ')[1] || data.hadir}`,
        data 
      }, { status: 200 }); // Status 200 agar dihandle sebagai warning oleh client
    }

    // 5. Catat waktu kehadiran
    const timestamp = getMakassarTime();
    
    // a. Update Redis (Sync)
    data.hadir = timestamp;
    await redis.set(`scan:tamu:${id}`, JSON.stringify(data), { ex: 172800 });

    // b. Update Supabase (Async fire-and-forget)
    supabase.from('tamu').update({ hadir: timestamp }).eq('id', id).then(({ error }) => {
      if (error) console.error('Failed to update Supabase hadir tamu:', error);
    });

    // 5. Return success
    return NextResponse.json({ 
      success: true, 
      message: 'Berhasil mencatat kehadiran tamu',
      data 
    });

  } catch (err: any) {
    console.error('Scan tamu route error:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
