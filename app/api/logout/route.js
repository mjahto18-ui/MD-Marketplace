export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });

  // امحي كوكي الـ session
  response.cookies.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  // امحي md_guest كمان مشان يرجع زائر نظيف
  response.cookies.set('md_guest', '', {
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
