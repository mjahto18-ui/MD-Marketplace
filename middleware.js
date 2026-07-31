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

  // صفحة الحداد - نفس المنطق تبعك بس مع cache 10 ثواني
  // قبل كنت no-store يعني 0 ثواني، هلا 10 ثواني متل ما بدك
  if (pathname !== '/closed') {
    try {
      const baseUrl = request.nextUrl.origin;
      const res = await fetch(`${baseUrl}/api/global-config`, { 
        next: { revalidate: 10 }, // <--- هون التصحيح: 10 ثواني مش 0
        headers: { 'x-middleware': '1' }
      });
      if (res.ok) {
        const cfg = await res.json();
        if ((cfg?.isLocked === true || cfg?.emergency_lock?.value === 'TRUE')) {
          return NextResponse.redirect(new URL('/closed', request.url));
        }
      }
    } catch {
      // اذا فشل الشيت لا تقفل الموقع على العالم
    }
  }

  if (pathname === '/') {
    const session = request.cookies.get('session');
    const isGuest = request.cookies.get('md_guest');
    if (session || isGuest) {
      return NextResponse.redirect(new URL('/shop', request.url));
    }
    return NextResponse.next();
  }

  // ضفنا /products و /shop للحماية - صار صمام الأمان الحقيقي
  const protectedRoutes = ['/cart', '/profile', '/orders', '/checkout', '/products', '/shop'];
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
