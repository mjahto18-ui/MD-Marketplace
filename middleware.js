import { NextResponse } from 'next/server';

export async function middleware(request) {
  const protectedRoutes = ['/shop', '/cart', '/profile', '/orders'];
  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    const session = request.cookies.get('session');
    const isGuest = request.cookies.get('md_guest');

    // إذا ما في session وما في guest → رجّعو على login
    if (!session && !isGuest) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // إذا المستخدم مسجّل (مش guest)
    if (session && !isGuest) {
      try {
        const me = await fetch(`${request.nextUrl.origin}/api/me`, {
          headers: { Cookie: request.headers.get('cookie') || '' }
        });

        const data = await me.json();

        // هون كان الغلط - عم نفحص كنص
        const accepted = String(data.user?.AcceptedTerms || "").toUpperCase().trim();
        
        if (accepted !== "TRUE") {
          return NextResponse.redirect(new URL('/terms-approval', request.url));
        }

      } catch (e) {
        // اذا فشل api/me رجعو login
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/shop/:path*', '/cart/:path*', '/profile/:path*', '/orders/:path*']
};
