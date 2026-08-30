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
    
    // Log guest visit - نفس المنطق
    await supabase.from('guest_logs').insert([{
      "Timestamp": new Date().toISOString(),
      "IP": req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      "User Agent": req.headers.get('user-agent') || 'unknown',
      "timestamp": new Date().toISOString(),
      "ip": req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      "user_agent": req.headers.get('user-agent') || 'unknown'
    }]);
    
    // حط كوكي الزائر من السيرفر - نفس المنطق بالحرف
    const cookieStore = cookies();
    
    // 1. امحي session اذا موجودة
    cookieStore.delete('session');
    
    // 2. حط كوكي الزائر
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
    // حتى لو فشل الـ log، حط الكوكي وخليه يفوت كزائر - نفس المنطق
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
