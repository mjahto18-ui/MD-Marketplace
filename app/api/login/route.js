export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getSupabase as getSupabaseLib } from "@/lib/supabase";
import { cookies } from 'next/headers';

function getSupabase() {
  return getSupabaseLib();
}

export async function POST(req) {
  try {
    const { phone, pin } = await req.json();
    const phoneStr = String(phone).trim();
    const phoneNoZero = phoneStr.replace(/^0+/, '');
    const supabase = getSupabase();

    // FIXED - بلا select('*') و بلا find - eq + Index دغري
    const USER_COLS = '"User ID", "Customer ID", Name, Mobile, Role, Status, PIN, "isLocked", "failedAttempts", "AcceptedTerms", Email, Active';

    const { data: users, error } = await supabase.from('users')
      .select(USER_COLS)
      .or(`Mobile.eq.${phoneStr},Mobile.eq.${phoneNoZero}`)
      .limit(1);

    if (error) console.error("Login customer error:", error.message);

    const user = users?.[0];

    if (!user) {
      return NextResponse.json({ success: false, message: "رقم الهاتف أو رمز الدخول غير صحيح." }, { status: 401 });
    }

    const role = String(user['Role'] || '').trim();
    const allowedRoles = ['Admin', 'Customer'];
    if(!allowedRoles.includes(role)){
      return NextResponse.json({ success: false, message: `دورك ${role} غير مسموح حاليا` }, { status: 403 });
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
      await supabase.from('users').update({
        'failedAttempts': "0",
        'isLocked': "FALSE"
      }).eq('User ID', user['User ID']);

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

    let newAttempts = attempts + 1;
    if (newAttempts >= 3) {
      await supabase.from('users').update({
        'failedAttempts': String(newAttempts),
        'PIN': "",
        'isLocked': "TRUE"
      }).eq('User ID', user['User ID']);
      return NextResponse.json({
        success: false,
        message: "تم قفل الحساب بسبب محاولات دخول غير صحيحة. يرجى التواصل مع فريق الدعم أو طلب إعادة تعيين رمز الدخول لإعادة تفعيل الحساب."
      }, { status: 403 });
    }

    await supabase.from('users').update({
      'failedAttempts': String(newAttempts)
    }).eq('User ID', user['User ID']);

    return NextResponse.json({
      success: false,
      message: "رقم الهاتف أو رمز الدخول غير صحيح."
    }, { status: 401 });

  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ success: false, message: "خطأ في الخادم" }, { status: 500 });
  }
}
