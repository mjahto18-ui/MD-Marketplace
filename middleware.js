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
    pathname.startsWith('/coming-soon') ||
    pathname.startsWith=== '/'
  ) {
    return NextResponse.next();
  }

  const protectedRoutes = ['/shop', '/cart', '/profile', '/orders', '/checkout'];
  if (protectedRoutes.some(r => pathname.startsWith(r))) {
    const session = request.cookies.get('session');
    const isGuest = request.cookies.get('md_guest');
    if (!session && !isGuest) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'] };
