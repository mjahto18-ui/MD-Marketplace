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

  let cfg = globalThis.__MD_CFG || {};
  try {
    const now = Date.now();
    if (globalThis.__MD_CFG && globalThis.__MD_CFG_TIME && (now - globalThis.__MD_CFG_TIME) < 60000) {
      cfg = globalThis.__MD_CFG;
    } else {
      try {
        const res = await fetch(`${request.nextUrl.origin}/api/global-config`, { 
          cache: 'no-store',
          signal: AbortSignal.timeout(500)
        });
        if (res.ok) {
          cfg = await res.json();
          globalThis.__MD_CFG = cfg;
          globalThis.__MD_CFG_TIME = now;
        }
      } catch {}
    }
  } catch {
    cfg = globalThis.__MD_CFG || {};
  }

  if (cfg.isLocked && pathname !== '/closed') {
    return NextResponse.redirect(new URL('/closed', request.url));
  }
  if (cfg.isLocked) return NextResponse.next();

  // هون مبارح شلنا checkout - اذا بدك يضل مفتوح وقت الحداد شيلو من هالليستا
  const protectedRoutes = ['/shop', '/cart', '/profile', '/orders', '/checkout'];
  // اذا بدك checkout يضل مفتوح حتى بالحداد، خليها هيك:
  // const protectedRoutes = ['/shop', '/cart', '/profile', '/orders'];

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
