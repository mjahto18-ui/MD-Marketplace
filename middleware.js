import { NextResponse } from 'next/server';
import { getGlobalConfig } from '@/lib/getGlobalConfig';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/terms-approval') ||
    pathname.startsWith('/closed') ||
    pathname.startsWith('/coming-soon')
  ) {
    return NextResponse.next();
  }

  // فحص الطوارئ - صار يقرا مباشر بدون fetch
  try {
    const cfg = await getGlobalConfig();
    if ((cfg?.isLocked === true || cfg?.emergency_lock?.value === 'TRUE') && pathname !== '/closed') {
      // لا تعمل redirect لجوجل بوت مشان الأرشفة
      const userAgent = request.headers.get('user-agent') || '';
      if (!userAgent.toLowerCase().includes('googlebot') && !userAgent.toLowerCase().includes('inspectiontool')) {
        return NextResponse.redirect(new URL('/closed', request.url));
      }
    }
  } catch {
    // اذا فشل لا تكب حدا
  }

  const protectedRoutes = ['/shop', '/cart', '/profile', '/orders', '/checkout'];
  if (protectedRoutes.some(r => pathname.startsWith(r))) {
    const session = request.cookies.get('session');
    const isGuest = request.cookies.get('md_guest');
    if (!session && !isGuest) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (session) {
      try {
        let data;
        try { data = JSON.parse(session.value); } 
        catch { data = JSON.parse(decodeURIComponent(session.value)); }
        const accepted = String(data.AcceptedTerms || data.acceptedTerms || "TRUE").toUpperCase();
        if (accepted !== "TRUE" && pathname !== '/terms-approval') {
          return NextResponse.redirect(new URL('/terms-approval', request.url));
        }
      } catch {
        return NextResponse.next();
      }
    }
  }

  return NextResponse.next();
}

export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'] };
