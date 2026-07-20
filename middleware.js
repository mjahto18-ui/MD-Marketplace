import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { pathname, origin } = request.nextUrl;

  // --- جيب الكونفيج من الشيت ---
  let cfg;
  try {
    const res = await fetch(`${origin}/api/global-config`, { cache: 'no-store' });
    cfg = await res.json();
  } catch { cfg = {}; }

  // 1- وفاة / طوارئ - سكر كل شي
  if (cfg.isLocked) {
    if (pathname !== '/closed') {
      return NextResponse.redirect(new URL(`/closed`, request.url));
    }
    return NextResponse.next();
  }

  // 2- قبل الافتتاح - امنع الـ CHECKOUT فقط، وخلي السلة تفتح لتطلع المسج
  if (cfg.isCartClosed && pathname.startsWith('/checkout')) {
    return NextResponse.redirect(new URL('/cart', request.url));
  }

  // 3- حمايتك القديمة
  const protectedRoutes = ['/shop', '/cart', '/profile', '/orders'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    const session = request.cookies.get('session');
    const isGuest = request.cookies.get('md_guest');
    if (!session && !isGuest) return NextResponse.redirect(new URL('/login', request.url));
    if (session && !isGuest) {
      try {
        const me = await fetch(`${origin}/api/me`, { headers: { Cookie: request.headers.get('cookie') || '' } });
        const data = await me.json();
        const accepted = String(data.user?.AcceptedTerms || "").toUpperCase().trim();
        if (accepted !== "TRUE") return NextResponse.redirect(new URL('/terms-approval', request.url));
      } catch { return NextResponse.redirect(new URL('/login', request.url)); }
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/shop/:path*', '/cart/:path*', '/profile/:path*', '/orders/:path*', '/checkout/:path*', '/closed']
};
