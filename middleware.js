import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { pathname, origin } = request.nextUrl;

  // --- جيب الكونفيج من الشيت ---
  let cfg;
  try {
    const res = await fetch(`${origin}/api/global-config`, { cache: 'no-store' });
    cfg = await res.json();
  } catch { cfg = {}; }

  // وفاة / طوارئ
  if (cfg.isLocked) {
    if (pathname!== '/closed') {
      return NextResponse.redirect(new URL(`/closed`, request.url));
    }
  }

  // قبل الافتتاح - امنع السلة
  if (cfg.isCartClosed && (pathname.startsWith('/cart') || pathname.startsWith('/checkout'))) {
    return NextResponse.redirect(new URL('/shop', request.url));
  }

  // --- حمايتك القديمة ---
  const protectedRoutes = ['/shop', '/cart', '/profile', '/orders'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    const session = request.cookies.get('session');
    const isGuest = request.cookies.get('md_guest');
    if (!session &&!isGuest) return NextResponse.redirect(new URL('/login', request.url));
    if (session &&!isGuest) {
      try {
        const me = await fetch(`${origin}/api/me`, { headers: { Cookie: request.headers.get('cookie') || '' } });
        const data = await me.json();
        const accepted = String(data.user?.AcceptedTerms || "").toUpperCase().trim();
        if (accepted!== "TRUE") return NextResponse.redirect(new URL('/terms-approval', request.url));
      } catch { return NextResponse.redirect(new URL('/login', request.url)); }
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/shop/:path*', '/cart/:path*', '/profile/:path*', '/orders/:path*', '/checkout/:path*']
};
