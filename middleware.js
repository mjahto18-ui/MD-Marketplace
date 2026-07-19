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
      const me = await fetch(`${request.nextUrl.origin}/api/me`, {
        headers: { Cookie: request.headers.get('cookie') }
      });

      const data = await me.json();

      // إذا ما وافق على الشروط → رجّعو على صفحة الموافقة
      if (!data.user?.AcceptedTerms) {
        return NextResponse.redirect(new URL('/terms-approval', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/shop/:path*', '/cart/:path*', '/profile/:path*', '/orders/:path*']
};
