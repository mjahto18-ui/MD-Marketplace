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
    const { phone, pin } = await req.json();
    const phoneStr = String(phone).trim();
    const supabase = getSupabase();

    const { data: users } = await supabase.from('users').select('*');
    const user = (users||[]).find(row => String(row['Mobile'] || "").trim() === phoneStr);

    if (!user) {
      return NextResponse.json({ success: false, message: "رقم الهاتف أو رمز الدخول غير صحيح." }, { status: 401 });
    }

    const userStatus = user['Status'] || "";
    const lockStatus = user['isLocked'] || "";
    const storedPin = String(user['PIN'] || "").trim();
    const attempts = parseInt(user['failedAttempts'] || "0");

    if (String(lockStatus).toUpperCase() === "TRUE" || String(lockStatus).toUpperCase() === "LOCKED") {
      return NextResponse.json({
        success: false,
        message: "تم قفل الحساب بسبب محاولات دخول غير صحيحة. يرجى التواصل مع فريق الدعم أو طلب إعادة تعيين رمز الدخول لإعادة تفعيل الحساب."
      }, { status: 403 });
    }

    if (String(userStatus).toUpperCase()!== "ACTIVE") {
      return NextResponse.json({
        success: false,
        message: "لا يمكن تسجيل الدخول لأن الحساب غير مفعل. يرجى التواصل مع فريق الدعم لتفعيل الحساب."
      }, { status: 403 });
    }

    if (storedPin === String(pin).trim()) {
      // صح - صفر المحاولات
      await supabase.from('users').update({
        'failedAttempts': "0",
        'isLocked': "FALSE"
      }).eq('Mobile', phoneStr);

      const cookieStore = await cookies();
      cookieStore.delete('md_guest');

      const acceptedTermsValue = String(user['AcceptedTerms'] || "").toUpperCase().trim();

      cookieStore.set('session', JSON.stringify({
        customerId: user['Customer ID'],
        name: user['Name'],
        phone: phoneStr,
        AcceptedTerms: acceptedTermsValue,
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7
      });

      return NextResponse.json({
        success: true,
        message: "تم تسجيل الدخول بنجاح",
        user: {
          userId: user['User ID'],
          customerId: user['Customer ID'],
          name: user['Name'],
          phone: phoneStr,
          role: user['Role'],
          email: user['Email'],
          AcceptedTerms: acceptedTermsValue
        }
      });
    }

    // PIN غلط - 3 محاولات
    let newAttempts = attempts + 1;

    if (newAttempts >= 3) {
      await supabase.from('users').update({
        'failedAttempts': String(newAttempts),
        'PIN': "",
        'isLocked': "TRUE"
      }).eq('Mobile', phoneStr);

      return NextResponse.json({
        success: false,
        message: "تم قفل الحساب بسبب محاولات دخول غير صحيحة. يرجى التواصل مع فريق الدعم أو طلب إعادة تعيين رمز الدخول لإعادة تفعيل الحساب."
      }, { status: 403 });
    }

    await supabase.from('users').update({
      'failedAttempts': String(newAttempts)
    }).eq('Mobile', phoneStr);

    return NextResponse.json({
      success: false,
      message: "رقم الهاتف أو رمز الدخول غير صحيح."
    }, { status: 401 });

  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ success: false, message: "خطأ في الخادم" }, { status: 500 });
  }
}
