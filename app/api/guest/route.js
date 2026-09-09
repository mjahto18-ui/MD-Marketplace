export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// هيدي الفنكشن بتجيب السوبربيز
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = createClient(url, key);

  return supabase;
}

// هيدي الفنكشن بتجيب الـ IP تبع الزائر الحقيقي
// لأنه وراء Vercel بيجي بـ x-forwarded-for
function getClientIp(req){

  const forwarded = req.headers.get('x-forwarded-for');

  if(forwarded) {
    // اذا فيه اكتر من IP ناخد اول واحد هو الحقيقي
    const firstIp = forwarded.split(',')[0].trim();
    return firstIp;
  }

  // اذا ما لقينا forwarded منجرب x-real-ip
  const realIp = req.headers.get('x-real-ip');

  if(realIp) {
    return realIp;
  }

  // اذا ما لقينا شي
  return 'unknown';
}

// هيدا الـ POST اللي بيندهلو الميدلوير
export async function POST(req) {

  try {

    // 1. نجهز سوبربيز
    const supabase = getSupabase();

    // 2. نجيب معلومات الزائر
    const ipRaw = getClientIp(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const now = new Date().toISOString();

    // 3. هون منحفظ كل بيانات المنطقة
    let geoData = {};

    // 4. نجيب الموقع الجغرافي من ipapi.co
    // هيدا بيعطينا 1000 طلب ببلاش باليوم
    // وبيعطينا المنطقة Liban-Nord اللي بدك ياها
    try {

      // ما مننده الـ API اذا الـ IP محلي (localhost)
      const isLocalIp = ipRaw === 'unknown'
                     || ipRaw.startsWith('192.')
                     || ipRaw.startsWith('10.')
                     || ipRaw.startsWith('127.')
                     || ipRaw === '::1';

      if(isLocalIp === false) {

        const response = await fetch(`https://ipapi.co/${ipRaw}/json/`, {
          headers: {
            'User-Agent': 'md-marketplace'
          },
          cache: 'no-store'
        });

        const json = await response.json();

        // اذا ما فيه error منحفظ البيانات
        if(json.error === undefined) {
          geoData = json;
        }
      }

    } catch (geoError) {
      console.log('فشل جلب الموقع الجغرافي', geoError);
      // حتى لو فشل منكمل عادي ومنسجل الزيارة بدون موقع
    }

    // 5. نسجل الزيارة بجدول guestlogs
    // هون منحط كل العواميد الجديدة
    await supabase.from('guestlogs').insert([
      {
        "Log Date": now,
        "IP Adresse": ipRaw,
        "Device Type": userAgent,
        "Date Time": now,
        "Note": "guest visit",

        // العواميد النضيفة الجديدة
        country: geoData.country_name || null, // Lebanon
        city: geoData.city || null, // Tripoli
        region: geoData.region || null, // Liban-Nord
        lat: geoData.latitude || null, // 34.43
        lng: geoData.longitude || null, // 35.84
        org: geoData.org || null, // Wave Net LLC
        timezone: geoData.timezone || null, // Asia/Beirut

        // هيدا العمود بيحفظ كل الـ JSON متل ما هو
        // فيك تطالع منو اي شي بعدين
        raw_geo: geoData
      }
    ]);

    // 6. نحط كوكيز 24 ساعة
    // يعني اذا رجع نفس الزائر اليوم ما منسجلو مرة تانية
    // بكرا بتنمحي لحالا وبينعد زيارة جديدة
    const cookieStore = await cookies();

    cookieStore.set('md_guest', 'true', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24
    });

    // 7. نرجع نجاح
    return NextResponse.json({
      success: true,
      geo: geoData
    });

  } catch (error) {

    console.error('خطأ في تسجيل الزائر', error);

    // حتى لو صار خطأ منرجع success
    // مشان ما نوقف الموقع كرمال تسجيل زائر
    return NextResponse.json({ success: true });
  }
}
