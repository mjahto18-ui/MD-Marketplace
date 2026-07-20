import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { pathname, origin } = request.nextUrl;

  // لا تدقق بالـ API والملفات
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // جيب الكونفيج
  let cfg = {};
  try {
    const res = await fetch(`${origin}/api/global-config`, { cache: 'no-store', next: { revalidate: 0 } });
    cfg = await res.json();
  } catch { cfg = {}; }

  // 1- حداد - اهم واحد
  if (cfg.isLocked) {
    if (pathname !== '/closed') {
      return NextResponse.redirect(new URL('/closed', request.url));
    }
    return NextResponse.next(); // اذا هو بصفحة الحداد خليه
  }

  // 2- coming soon
  if (cfg.isComingSoon) {
    const allowed = ['/coming-soon', '/login', '/terms-approval', '/closed'];
    const isAllowed = allowed.some(p => pathname.startsWith(p));
    if (!isAllowed && pathname !== '/') {
      return NextResponse.redirect(new URL('/coming-soon', request.url));
    }
    // اذا هو بصفحة الكومينغ سون خليه
    if (pathname.startsWith('/coming-soon')) return NextResponse.next();
  }

  // 3- السلة مسكرة - لا تودي على cart اذا هو بقلب الـ cart
  if (cfg.isCartClosed && pathname.startsWith('/checkout')) {
    return NextResponse.redirect(new URL('/cart?closed=1', request.url));
  }

  // 4- حماية تسجيل الدخول والشروط
  const protectedRoutes = ['/shop', '/cart', '/profile', '/orders', '/checkout'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/terms-approval');

  if (isProtectedRoute && !isAuthPage) {
    const session = request.cookies.get('session');
    const isGuest = request.cookies.get('md_guest');
    
    if (!session && !isGuest) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (session && !isGuest) {
      // لا تعمل fetch لـ /api/me هون - بيبطئ وبيعمل لووب
      // اقرا من الكوكيز مباشرة
      try {
        const raw = session.value;
        const decoded = decodeURIComponent(raw);
        const data = JSON.parse(decoded);
        const accepted = String(data.AcceptedTerms || data.acceptedTerms || data.user?.AcceptedTerms || "").toUpperCase();
        
        // اذا مو موافق ومانو رايح على صفحة الشروط
        if (accepted !== "TRUE" && pathname !== '/terms-approval') {
          return NextResponse.redirect(new URL('/terms-approval', request.url));
        }
      } catch (e) {
        // اذا الكوكيز خربان
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
