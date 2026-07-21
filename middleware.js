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

  // --- كاش محسن + ما بيدق على حالو ---
  let cfg = {};
  try {
    const now = Date.now();
    if (globalThis.__MD_CFG && globalThis.__MD_CFG_TIME && (now - globalThis.__MD_CFG_TIME) < 60000) {
      cfg = globalThis.__MD_CFG;
    } else {
      // جيب مباشرة من جوجل بتايم اوت 500ms - لا تدق على /api/global-config
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 500);
      const SHEET_URL = process.env.GLOBAL_CONFIG_URL || process.env.NEXT_PUBLIC_SHEET_CONFIG_URL;
      
      if (SHEET_URL) {
        const res = await fetch(SHEET_URL, { signal: controller.signal, cache: 'no-store' });
        clearTimeout(t);
        if (res.ok) {
          const text = await res.text();
          // حلل بسرعة اذا في حداد
          cfg = { isLocked: text.includes('TRUE') && text.toLowerCase().includes('lock') };
          globalThis.__MD_CFG = cfg;
          globalThis.__MD_CFG_TIME = now;
        }
      } else {
        // اذا ما في رابط شيت، جيب من ال API بس بتايم اوت
        const res = await fetch(`${request.nextUrl.origin}/api/global-config`, { 
          signal: AbortSignal.timeout(500),
          cache: 'no-store' 
        });
        if (res.ok) {
          cfg = await res.json();
          globalThis.__MD_CFG = cfg;
          globalThis.__MD_CFG_TIME = now;
        }
      }
    }
  } catch {
    // اهم سطر: اذا فشل - لا تكب حدا، خد القديم
    cfg = globalThis.__MD_CFG || {};
  }

  if (cfg.isLocked && pathname !== '/closed') {
    return NextResponse.redirect(new URL('/closed', request.url));
  }
  if (cfg.isLocked) return NextResponse.next();

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
