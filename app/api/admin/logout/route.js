export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set('admin_session', '', { maxAge: 0, path: '/' });
  return NextResponse.json({ success: true });
}

export async function GET() {
  const cookieStore = await cookies();
  cookieStore.set('admin_session', '', { maxAge: 0, path: '/' });
  return NextResponse.json({ success: true }); // بلا redirect
}
