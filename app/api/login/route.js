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

    // ← نقرأ من شيت Users مش Customers
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: "Users!A2:Z",
    });

    const users = res.data.values || [];

    // العمود D=3 للهاتف، J=9 للـ PIN، نفترض Status بالعمود H=7
    const user = users.find(row =>
      row[4] === phone &&
      row[10] === pin &&
      row[9] === 'Active' // ← لازم يكون Active عشان يفوت
    );

    if (user) {
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
