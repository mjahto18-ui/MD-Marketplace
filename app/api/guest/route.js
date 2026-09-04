export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

export async function POST(req) {
  try {
    const supabase = getSupabase();
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const now = new Date().toISOString();
    
    // Log guest visit - بالأسماء الصحيحة
    await supabase.from('guestlogs').insert([{
      "Log Date": now,
      "IP Adresse": ip,
      "Device Type": userAgent,
      "Date Time": now,
      "Note": "guest visit"
    }]);
    
    const cookieStore = cookies();
    
    cookieStore.delete('session');
    
    cookieStore.set('md_guest', 'true', {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    const cookieStore = cookies();
    cookieStore.delete('session');
    cookieStore.set('md_guest', 'true', {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24
    });
    return NextResponse.json({ success: true });
  }
}
