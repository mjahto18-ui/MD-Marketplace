import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { pathname, origin } = request.nextUrl;

  // 1- جيب الريموت كونترول من الشيت (مع Cache)
  let globalConfig;
  try {
    const configRes = await fetch(`${origin}/api/global-config`, {
      next: { revalidate: 60 } // كل دقيقة بيعمل تحديث من الشيت
    });
    globalConfig = await configRes.json();
  } catch (e) {
    globalConfig = { platform_status: 'open', cart_enabled: true, emergency_lock: false };
  }

  // 2- اذا في حالة طوارئ / وفاة - سكر كل شي
  if (globalConfig.emergency_lock === true) {
    if (pathname !== '/closed') {
      return NextResponse.redirect(new URL(`/closed?msg=${encodeURIComponent(globalConfig.message_ar)}`, request.url));
    }
    return NextResponse.next();
  }

  // 3- اذا المنصة coming_soon - امنع السلة والطلبات بس خلي التصفح
  if (globalConfig.platform_status === 'coming_soon') {
    if (pathname.startsWith('/cart') || pathname.startsWith('/checkout') || pathname.startsWith('/orders')) {
      return NextResponse.redirect(new URL(`/coming-soon?days=${globalConfig.daysLeft}`, request.url));
    }
  }

  // 4- اذا night_mode او السلة مسكرة بليل
  if (globalConfig.cart_enabled === false) {
    if (pathname.startsWith('/cart') || pathname.startsWith('/checkout')) {
       return NextResponse.redirect(new URL(`/shop?banner=${encodeURIComponent(globalConfig.message_ar || 'السلة مغلقة حاليا')}`, request.url));
    }
  }

  // 5- الحماية القديمة تبعك - خليتها متل ما هي
  const protectedRoutes = ['/shop', '/cart', '/profile', '/orders'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    const session = request.cookies.get('session');
    const isGuest = request.cookies.get('md_guest');

    if (!session && !isGuest) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (session && !isGuest) {
      try {
        const me = await fetch(`${origin}/api/me`, {
          headers: { Cookie: request.headers.get('cookie') || '' }
        });
        const data = await me.json();
        const accepted = String(data.user?.AcceptedTerms || "").toUpperCase().trim();
        if (accepted !== "TRUE") {
          return NextResponse.redirect(new URL('/terms-approval', request.url));
        }
      } catch (e) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
  }

  // مرر بيانات العد التنازلي لكل الصفحات كـ header
  const response = NextResponse.next();
  response.headers.set('x-platform-status', globalConfig.platform_status || 'open');
  response.headers.set('x-days-left', String(globalConfig.daysLeft || 0));
  return response;
}

export const config = {
  matcher: ['/shop/:path*', '/cart/:path*', '/profile/:path*', '/orders/:path*', '/checkout/:path*']
};
