import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { isRouteAllowed, type AdminRole } from '@/lib/permissions';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Hanya memproteksi rute yang dimulai dengan /admin
  if (pathname.startsWith('/admin')) {
    // Kecualikan rute login agar tidak terjadi redirect loop, dan kecualikan /admin/kehadiran dan /admin/tamu
    if (pathname.startsWith('/admin/login') || pathname.startsWith('/admin/kehadiran') || pathname.startsWith('/admin/tamu')) {
      return NextResponse.next();
    }

    // Gunakan getToken dari next-auth/jwt
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    // Jika tidak ada session (token), redirect ke login
    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Cek apakah role admin diizinkan mengakses rute ini
    if (token.role) {
      const role = token.role as AdminRole;
      if (!isRouteAllowed(role, pathname)) {
        // Admin login tapi tidak punya akses ke rute ini → redirect ke dashboard
        const dashboardUrl = new URL('/admin', request.url);
        dashboardUrl.searchParams.set('error', 'forbidden');
        return NextResponse.redirect(dashboardUrl);
      }
    } else {
      // Token tidak memiliki role (invalid account structure)
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// Jalankan middleware di semua rute /admin
export const config = {
  matcher: ['/admin/:path*'],
};
