import { NextResponse } from "next/server";
import { google } from "googleapis";
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    const { phone, pin } = await req.json();

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: "Users!A2:Z",
    });

    const users = res.data.values || [];

    // A=0 | B=1 | C=2 | D=3 | E=4 Mobile | F=5 Active | G=6 Email | H=7 | I=8 | J=9 Status | K=10 PIN | O=14 failedAttempts | P=15 isLocked
    const userIndex = users.findIndex(row => row[4] === phone);
    const user = users[userIndex];

    if (!user) {
      return NextResponse.json({ success: false, message: "رقم الهاتف أو رمز الدخول غير صحيح." }, { status: 401 });
    }

    // حالة الحساب مقفول
    if (user[15] === "Locked") {
      return NextResponse.json({
        success: false,
        message: "تم قفل الحساب بسبب محاولات دخول غير صحيحة. يرجى التواصل مع فريق الدعم أو طلب إعادة تعيين رمز الدخول لإعادة تفعيل الحساب."
      }, { status: 403 });
    }

    // الحساب غير مفعل
    if (user[9] !== "Active") {
      return NextResponse.json({
        success: false,
        message: "لا يمكن تسجيل الدخول لأن الحساب غير مفعل. يرجى التواصل مع فريق الدعم لتفعيل الحساب."
      }, { status: 403 });
    }

    // PIN صحيح؟
    if (user[10] === pin) {

      // إعادة ضبط المحاولات الفاشلة
      user[14] = "0";

      // حفظ التعديلات
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEETS_ID,
        range: `Users!A${userIndex + 2}:Z`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [user] }
      });

      const cookieStore = cookies();
      cookieStore.delete('md_guest');

      cookieStore.set('session', JSON.stringify({
        customerId: user[0],
        name: user[3],
        phone: user[4]
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
        user: { name: user[3], phone: user[4] }
      });
    }

    // PIN غلط → زيد المحاولات
    let attempts = parseInt(user[14] || "0") + 1;
    user[14] = attempts.toString();

    // إذا صاروا 3 → اقفل الحساب
    if (attempts >= 3) {
      user[10] = "";        // مسح PIN
      user[15] = "Locked";  // قفل الحساب

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

    // محاولة غلط عادية
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
