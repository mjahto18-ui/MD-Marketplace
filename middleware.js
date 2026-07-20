import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.includes('.') || pathname.startsWith('/login') || pathname.startsWith('/terms-approval') || pathname.startsWith('/closed') || pathname.startsWith('/coming-soon')) {
    return NextResponse.next();
  }

  let cfg = {};
  try {
    const res = await fetch(`${request.nextUrl.origin}/api/global-config`, { cache: 'no-store' });
    cfg = await res.json();
  } catch { cfg = {}; }

  if (cfg.isLocked && pathname !== '/closed') {
    return NextResponse.redirect(new URL('/closed', request.url));
  }
  if (cfg.isLocked) return NextResponse.next();

  if (cfg.isComingSoon) {
    const allowed = ['/coming-soon', '/closed'];
    if (!allowed.some(p => pathname.startsWith(p)) && pathname !== '/') {
      return NextResponse.redirect(new URL('/coming-soon', request.url));
    }
    return NextResponse.next();
  }

  if (cfg.isCartClosed && pathname.startsWith('/checkout')) {
    return NextResponse.redirect(new URL('/cart?closed=1', request.url));
  }

  const protectedRoutes = ['/shop', '/cart', '/profile', '/orders', '/checkout'];
  if (protectedRoutes.some(r => pathname.startsWith(r))) {
    const session = request.cookies.get('session');
    const isGuest = request.cookies.get('md_guest');
    if (!session && !isGuest) return NextResponse.redirect(new URL('/login', request.url));

    if (session) {
      try {
        let data;
        try { data = JSON.parse(session.value); } 
        catch { data = JSON.parse(decodeURIComponent(session.value)); }
        
        const accepted = String(data.AcceptedTerms || data.acceptedTerms || "TRUE").toUpperCase();
        if (accepted !== "TRUE") {
          return NextResponse.redirect(new URL('/terms-approval', request.url));
        }
      } catch {
        // لا تطلعو - خليه يمر
        return NextResponse.next();
      }
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'] };
