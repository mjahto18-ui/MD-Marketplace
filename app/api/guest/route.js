export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

function getClientIp(req){
  const forwarded = req.headers.get('x-forwarded-for');
  if(forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

export async function POST(req) {
  let geo = { country: null, city: null, lat: null, lng: null };

  try {
    const supabase = getSupabase();
    const ipRaw = getClientIp(req);
    const ipForLog = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'; // منحفظ القديم متل ما كان للتوافق
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const now = new Date().toISOString();

    // نحاول نجيب الاحداثيات - اذا فشل ما منوقف شي
    try {
      if(ipRaw!== 'unknown' &&!ipRaw.startsWith('192.') &&!ipRaw.startsWith('10.') &&!ipRaw.startsWith('127.') && ipRaw!== '::1'){
        const r = await fetch(`http://ip-api.com/json/${ipRaw}?fields=status,country,city,lat,lon`, { cache: 'no-store' });
        const d = await r.json();
        if(d.status === 'success'){
          geo.country = d.country;
          geo.city = d.city;
          geo.lat = d.lat;
          geo.lng = d.lon;
        }
      }
    } catch (e) {}

    // Log guest visit - نفس الأسماء القديمة + الجداد
    await supabase.from('guestlogs').insert([{
      "Log Date": now,
      "IP Adresse": ipForLog, // تاركو متل ما كان قبل مشان ما نكسر شي
      "Device Type": userAgent,
      "Date Time": now,
      "Note": "guest visit",
      "country": geo.country,
      "city": geo.city,
      "lat": geo.lat,
      "lng": geo.lng
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
    // حتى لو فشل الـ insert منحط الكوكيز متل القديم
    try {
      const cookieStore = cookies();
      cookieStore.delete('session');
      cookieStore.set('md_guest', 'true', {
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24
      });
    } catch(e){}
    return NextResponse.json({ success: true });
  }
}
