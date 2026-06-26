import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { isRouteAllowed, type AdminRole } from '@/lib/permissions';
import { verifyWisudawanToken, WISUDAWAN_COOKIE_NAME } from '@/lib/wisudawanSession';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ══════════════════════════════════════════════════════════════
  // BLOK 1: Proteksi rute /admin/*
  // ══════════════════════════════════════════════════════════════
  if (pathname.startsWith('/admin')) {
    // Kecualikan rute login agar tidak terjadi redirect loop
    if (
      pathname.startsWith('/admin/login') ||
      pathname.startsWith('/admin/kehadiran') ||
      pathname.startsWith('/admin/tamu')
    ) {
      return NextResponse.next();
    }

    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (token.role) {
      const role = token.role as AdminRole;
      if (!isRouteAllowed(role, pathname)) {
        const dashboardUrl = new URL('/admin', request.url);
        dashboardUrl.searchParams.set('error', 'forbidden');
        return NextResponse.redirect(dashboardUrl);
      }
    } else {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // ══════════════════════════════════════════════════════════════
  // BLOK 2: Proteksi rute /wisudawan/:nim
  // ══════════════════════════════════════════════════════════════
  if (pathname.startsWith('/wisudawan/')) {
    // Cek cookie sesi wisudawan
    const wisudawanCookie = request.cookies.get(WISUDAWAN_COOKIE_NAME)?.value;
    if (!wisudawanCookie) {
      const loginUrl = new URL('/auth', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      loginUrl.searchParams.set('reason', 'unauthenticated');
      return NextResponse.redirect(loginUrl);
    }

    const session = await verifyWisudawanToken(wisudawanCookie);
    if (!session) {
      // Token invalid atau expired — hapus cookie lama dan redirect
      const loginUrl = new URL('/auth', request.url);
      loginUrl.searchParams.set('reason', 'session_expired');
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete(WISUDAWAN_COOKIE_NAME);
      return response;
    }

    // Isolasi data: wisudawan hanya boleh mengakses profil miliknya sendiri
    const nimInUrl = decodeURIComponent(pathname.split('/')[2] || '');
    if (nimInUrl && session.nim !== nimInUrl) {
      // Redirect ke profil sendiri, bukan profil orang lain
      return NextResponse.redirect(new URL(`/wisudawan/${session.nim}`, request.url));
    }

    return NextResponse.next();
  }

  // ══════════════════════════════════════════════════════════════
  // BLOK 3: Proteksi rute /setup/:nim
  // ══════════════════════════════════════════════════════════════
  if (pathname.startsWith('/setup/')) {
    // /setup (tanpa nim, halaman root setup admin) — lewatkan
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length < 2) return NextResponse.next();

    // Cek cookie sesi wisudawan
    const wisudawanCookie = request.cookies.get(WISUDAWAN_COOKIE_NAME)?.value;
    if (!wisudawanCookie) {
      const loginUrl = new URL('/auth', request.url);
      loginUrl.searchParams.set('reason', 'unauthenticated');
      return NextResponse.redirect(loginUrl);
    }

    const session = await verifyWisudawanToken(wisudawanCookie);
    if (!session) {
      const loginUrl = new URL('/auth', request.url);
      loginUrl.searchParams.set('reason', 'session_expired');
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete(WISUDAWAN_COOKIE_NAME);
      return response;
    }

    // Hanya boleh akses setup jika login dengan password default
    if (!session.isDefaultPassword) {
      // Sudah setup akun sebelumnya, tidak perlu ke halaman setup lagi
      return NextResponse.redirect(new URL(`/wisudawan/${session.nim}`, request.url));
    }

    // Isolasi: hanya boleh setup NIM sendiri
    const nimInUrl = decodeURIComponent(segments[1] || '');
    if (nimInUrl && session.nim !== nimInUrl) {
      return NextResponse.redirect(new URL(`/setup/${session.nim}`, request.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

// Jalankan middleware di rute /admin, /wisudawan, dan /setup
export const config = {
  matcher: ['/admin/:path*', '/wisudawan/:path*', '/setup/:path*'],
};
