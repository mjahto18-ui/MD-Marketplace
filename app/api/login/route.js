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
    const user = (users||[]).find(row => String(row['Phone'] || row['phone'] || row['Mobile'] || row[4] || "").trim() === phoneStr);

    if (!user) {
      return NextResponse.json({ success: false, message: "رقم الهاتف أو رمز الدخول غير صحيح." }, { status: 401 });
    }

    const userStatus = user['Status'] || user['status'] || user[9];
    const lockStatus = user['isLocked'] || user['lock_status'] || user['Locked'] || user[15];
    const storedPin = String(user['PIN'] || user['pin'] || user['Password'] || user[10] || "").trim();
    const attempts = parseInt(user['failedAttempts'] || user['login_attempts'] || user[14] || "0");

    if (String(lockStatus).toUpperCase() === "LOCKED") {
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
      // reset attempts - نفس المنطق
      await supabase.from('users').update({
        'Login Attempts': "0",
        'login_attempts': 0,
        'Attempts': "0"
      }).eq('Phone', phoneStr);

      await supabase.from('users').update({ login_attempts: 0 }).eq('phone', phoneStr);

      const cookieStore = await cookies();
      cookieStore.delete('md_guest');

      const acceptedTermsValue = String(user['Accepted Terms'] || user['accepted_terms'] || user[17] || "").toUpperCase().trim();

      cookieStore.set('session', JSON.stringify({
        customerId: user['Customer ID'] || user['customer_id'] || user[0],
        name: user['Name'] || user['name'] || user[3],
        phone: phoneStr,
        AcceptedTerms: acceptedTermsValue,
        acceptedTerms: acceptedTermsValue
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
          userId: user['User ID'] || user['user_id'] || user[0],
          customerId: user['Customer ID'] || user['customer_id'] || user[7],
          name: user['Name'] || user['name'] || user[3],
          phone: phoneStr,
          role: user['Role'] || user['role'] || user[2],
          email: user['Email'] || user['email'] || user[6],
          AcceptedTerms: acceptedTermsValue
        }
      });
    }

    // PIN غلط - نفس المنطق 3 محاولات
    let newAttempts = attempts + 1;

    if (newAttempts >= 3) {
      await supabase.from('users').update({
        'Login Attempts': String(newAttempts),
        'PIN': "",
        'Lock Status': "Locked",
        'login_attempts': newAttempts,
        'pin': "",
        'lock_status': "Locked"
      }).eq('Phone', phoneStr);

      return NextResponse.json({
        success: false,
        message: "تم قفل الحساب بسبب محاولات دخول غير صحيحة. يرجى التواصل مع فريق الدعم أو طلب إعادة تعيين رمز الدخول لإعادة تفعيل الحساب."
      }, { status: 403 });
    }

    await supabase.from('users').update({
      'Login Attempts': String(newAttempts),
      'login_attempts': newAttempts
    }).eq('Phone', phoneStr);

    return NextResponse.json({
      success: false,
      message: "رقم الهاتف أو رمز الدخول غير صحيح."
    }, { status: 401 });

  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ success: false, message: "خطأ في الخادم" }, { status: 500 });
  }
}
