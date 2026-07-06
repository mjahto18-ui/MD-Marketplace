import { NextResponse } from "next/server";
import { google } from "googleapis";

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

    // ← هون عم نقرأ من شيت Users
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID, // ← اسم المتغير الصح
      range: "Users!A2:Z", // ← غير Users لاسم شيت الدخول عندك
    });

    const users = res.data.values || [];
    // افترض رقم الهاتف بالعمود C والـ PIN بالعمود D
    const user = users.find(row => row[4] === phone && row[10] === pin);

    if (user) {
      return NextResponse.json({
        success: true,
        message: "تم تسجيل الدخول بنجاح",
        user: { name: user[1], phone: user[2] }
      });
    } else {
      return NextResponse.json({ success: false, message: "رقم الهاتف أو رمز الدخول خطأ" }, { status: 401 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "خطأ في الخادم" }, { status: 500 });
  }
}
