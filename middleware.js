import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // لا تدقق بهالصفحات
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

  // --- هون الكاش ---
  let cfg = {};
  try {
    const now = Date.now();
    // اذا في كاش وعمرو اقل من دقيقة - خدو منو
    if (globalThis.__MD_CFG && globalThis.__MD_CFG_TIME && (now - globalThis.__MD_CFG_TIME) < 60000) {
      cfg = globalThis.__MD_CFG;
    } else {
      // اذا ما في كاش - جيبو من جوجل مرة وحدة
      const res = await fetch(`${request.nextUrl.origin}/api/global-config`, { cache: 'no-store' });
      if (res.ok) {
        cfg = await res.json();
        globalThis.__MD_CFG = cfg;
        globalThis.__MD_CFG_TIME = now;
      } else {
        cfg = globalThis.__MD_CFG || {};
      }
    }
  } catch {
    // اذا جوجل وقع - خد القديم ولا تكب حدا برا
    cfg = globalThis.__MD_CFG || {};
  }

  // 1- حداد فقط = قفل كامل
  if (cfg.isLocked && pathname !== '/closed') {
    return NextResponse.redirect(new URL('/closed', request.url));
  }
  if (cfg.isLocked) return NextResponse.next();

  // حماية الصفحات
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
        return NextResponse.next(); // اذا الكوكي خربان لا تكبو برا - خليه يفوت
      }
    }
  }

  return NextResponse.next();
}

export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'] };
