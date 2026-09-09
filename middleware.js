import { NextResponse } from 'next/server';

export async function middleware(request) {

  const { pathname } = request.nextUrl;

  // 1. هودي صفحات ما منلمسن ابدا
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

  // 2. حماية الأدمن
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

  // 3. حماية السائق وصاحب المتجر
  if (pathname.startsWith('/driver-owner') || pathname.startsWith('/store-owner')) {

    const adminSession = request.cookies.get('admin_session');

    if (!adminSession) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    return NextResponse.next();
  }

  // 4. صفحة الحداد - اذا الموقع مقفل
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

  // 5. صفحة الرئيسية /
  if (pathname === '/') {

    const session = request.cookies.get('session');
    const isGuest = request.cookies.get('md_guest');

    // اذا عندو جلسة او زائر قديم -> وديه عالشوب
    if (session || isGuest) {
      return NextResponse.redirect(new URL('/shop', request.url));
    }

    // اذا زائر جديد اول مرة -> سجلو بـ guestlogs
    try {

      const baseUrl = request.nextUrl.origin;

      // ننده الـ API اللي عملناه
      const guestRes = await fetch(`${baseUrl}/api/guest`, {
        method: 'POST',
        headers: {
          'x-forwarded-for': request.headers.get('x-forwarded-for') || '',
          'x-real-ip': request.headers.get('x-real-ip') || '',
          'user-agent': request.headers.get('user-agent') || ''
        }
      });

      // مناخد الرد ومنكمل على /
      const response = NextResponse.next();

      // مننسخ الكوكيز md_guest اللي رجعها الـ API
      const setCookie = guestRes.headers.get('set-cookie');

      if(setCookie) {
        response.headers.set('set-cookie', setCookie);
      }

      return response;

    } catch (e) {
      // حتى لو فشل التسجيل منكمل عالموقع عادي
      return NextResponse.next();
    }
  }

  // 6. الصفحات المحمية - سلة و بروفايل و طلبات
  const protectedRoutes = ['/cart', '/profile', '/orders', '/checkout', '/products'];

  const isProtected = protectedRoutes.some(r => pathname.startsWith(r));

  if (isProtected) {

    const session = request.cookies.get('session');
    const isGuest = request.cookies.get('md_guest');

    if (!session && !isGuest) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (session) {

      try {

        let data;

        try {
          data = JSON.parse(session.value);
        } catch {
          data = JSON.parse(decodeURIComponent(session.value));
        }

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

// هون منقلو وين يشتغل الميدلوير
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
