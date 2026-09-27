export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  
  // ✅ امحي بنفس الـ options يلي انحط فيها
  cookieStore.set('admin_session', '', { 
    maxAge: 0, 
    path: '/', 
    httpOnly: true, 
    sameSite: 'lax', 
    secure: false,
    expires: new Date(0) 
  });
  
  // ✅ legacy fallback
  cookieStore.set('admin_session', '', { 
    maxAge: 0, 
    path: '/',
    expires: new Date(0) 
  });

  return NextResponse.json({ success: true });
}

export async function GET() {
  const cookieStore = await cookies();
  
  cookieStore.set('admin_session', '', { 
    maxAge: 0, 
    path: '/', 
    httpOnly: true, 
    sameSite: 'lax', 
    secure: false,
    expires: new Date(0) 
  });

  cookieStore.set('admin_session', '', { 
    maxAge: 0, 
    path: '/',
    expires: new Date(0) 
  });

  return NextResponse.json({ success: true });
}
