import { NextResponse } from 'next/server';

export function middleware(request) {
  // الصفحات اللي بدها login اجباري
  const protectedRoutes = ['/shop', '/cart', '/profile', '/orders'];
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    const session = request.cookies.get('session');
    
    if (!session) {
      // اذا مش مسجل دخول رجعه على /login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

// هون بتحدد على اي مسارات يشتغل الـ Middleware
export const config = {
  matcher: ['/shop/:path*', '/cart/:path*', '/profile/:path*', '/orders/:path*']
};
