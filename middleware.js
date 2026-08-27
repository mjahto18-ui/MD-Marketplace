import { NextResponse } from 'next/server';

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

  // ===== حماية الأدمن =====
  if (pathname.startsWith('/admin')) {
    if (pathname.startsWith('/admin/login')) {
      return NextResponse.next();
    }
    const adminSession = request.cookies.get('admin_session');
    if (!adminSession) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return NextResponse.next();
  }

  // ===== حماية السائق وصاحب المتجر - نفس مسارك القديم بدون نقل =====
  if (pathname.startsWith('/driver-owner')) {
    const adminSession = request.cookies.get('admin_session');
    if (!adminSession) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return NextResponse.next();
  }
  // ===== نهاية الاضافة =====

  // صفحة الحداد - نفس المنطق تبعك
  if (pathname !== '/closed') {
    try {
      const baseUrl = request.nextUrl.origin;
      const res = await fetch(`${baseUrl}/api/global-config`, { 
        next: { revalidate: 10 },
        headers: { 'x-middleware': '1' }
      });
      if (res.ok) {
        const cfg = await res.json();
        if ((cfg?.isLocked === true || cfg?.emergency_lock?.value === 'TRUE')) {
          return NextResponse.redirect(new URL('/closed', request.url));
        }
      }
    } catch {}
  }

  if (pathname === '/') {
    const session = request.cookies.get('session');
    const isGuest = request.cookies.get('md_guest');
    if (session || isGuest) {
      return NextResponse.redirect(new URL('/shop', request.url));
    }
    return NextResponse.next();
  }

  const protectedRoutes = ['/cart', '/profile', '/orders', '/checkout', '/products'];
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
