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

    // A=0 User ID | B=1 Related ID | C=2 Role | D=3 Name | E=4 Mobile | F=5 Active | G=6 Email | H=7 Customer ID | I=8 Store ID | J=9 Status | K=10 PIN
    const user = users.find(row =>
      row[4] === phone && // E = Mobile
      row[10] === pin && // K = PIN
      row[9] === 'Active' // J = Status
    );

    if (user) {
      const cookieStore = cookies();

      // 1. امحي كوكي الزائر اول شي - هاي اللي بتحل المشكلة
      cookieStore.delete('md_guest');

      // 2. بعدين سجل جلسة اليوزر
      cookieStore.set('session', JSON.stringify({
        customerId: user[0], // A = User ID
        name: user[3], // D = Name
        phone: user[4] // E = Mobile
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
    } else {
      return NextResponse.json({ success: false, message: "الحساب غير مفعل أو البيانات خطأ" }, { status: 401 });
    }
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ success: false, message: "خطأ في الخادم" }, { status: 500 });
  }
}
