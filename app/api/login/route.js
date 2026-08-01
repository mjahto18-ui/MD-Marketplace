import { NextResponse } from "next/server";
import { getgooglesheets } from "@/lib/googlesheets";
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    const { phone, pin } = await req.json();
    const phoneStr = String(phone).trim();

    // هون الحل - بيستعمل نفس الكاش تبع باقي الموقع
    const sheets = await getgooglesheets();

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: "Users!A2:Z",
    });

    const users = res.data.values || [];
    const userIndex = users.findIndex(row => String(row[4]).trim() === phoneStr);
    const user = users[userIndex];

    if (!user) {
      return NextResponse.json({ success: false, message: "رقم الهاتف أو رمز الدخول غير صحيح." }, { status: 401 });
    }

    if (user[15] === "Locked") {
      return NextResponse.json({
        success: false,
        message: "تم قفل الحساب بسبب محاولات دخول غير صحيحة. يرجى التواصل مع فريق الدعم أو طلب إعادة تعيين رمز الدخول لإعادة تفعيل الحساب."
      }, { status: 403 });
    }

    if (user[9]!== "Active") {
      return NextResponse.json({
        success: false,
        message: "لا يمكن تسجيل الدخول لأن الحساب غير مفعل. يرجى التواصل مع فريق الدعم لتفعيل الحساب."
      }, { status: 403 });
    }

    if (String(user[10]).trim() === String(pin).trim()) {
      user[14] = "0";
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEETS_ID,
        range: `Users!A${userIndex + 2}:Z`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [user] }
      });

      const cookieStore = await cookies();
      cookieStore.delete('md_guest');

      const acceptedTermsValue = (user[17] || "").toString().toUpperCase().trim();

      cookieStore.set('session', JSON.stringify({
        customerId: user[0],
        name: user[3],
        phone: String(user[4]).trim(),
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
          userId: user[0],
          customerId: user[7],
          name: user[3],
          phone: String(user[4]).trim(),
          role: user[2],
          email: user[6],
          AcceptedTerms: acceptedTermsValue
        }
      });
    }

    let attempts = parseInt(user[14] || "0") + 1;
    user[14] = attempts.toString();

    if (attempts >= 3) {
      user[10] = "";
      user[15] = "Locked";
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEETS_ID,
        range: `Users!A${userIndex + 2}:Z`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [user] }
      });
      return NextResponse.json({
        success: false,
        message: "تم قفل الحساب بسبب محاولات دخول غير صحيحة. يرجى التواصل مع فريق الدعم أو طلب إعادة تعيين رمز الدخول لإعادة تفعيل الحساب."
      }, { status: 403 });
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: `Users!A${userIndex + 2}:Z`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [user] }
    });

    return NextResponse.json({
      success: false,
      message: "رقم الهاتف أو رمز الدخول غير صحيح."
    }, { status: 401 });

  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ success: false, message: "خطأ في الخادم" }, { status: 500 });
  }
}
