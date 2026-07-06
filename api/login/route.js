import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { mobile, pin } = await req.json();
    console.log('Login attempt:', mobile, pin);

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: "Users!A2:N", // من A لـ N عشان نجيب كل الأعمدة
    });

    const rows = response.data.values || [];
    console.log('Found users:', rows.length);

    // Mobile = العمود E = index 4
    // PIN = العمود K = index 10
    // Status = العمود J = index 9
    // Name = العمود D = index 3
    // Active = العمود F = index 5

    const user = rows.find(row => {
      const userMobile = row[4]; // E: Mobile
      const userPin = row[10]; // K: PIN
      return userMobile === mobile && userPin === pin;
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        msg: 'رقم الهاتف أو PIN غير صحيح'
      });
    }

    const userStatus = user[9]; // J: Status
    const userActive = user[5]; // F: Active

    if (userStatus?.toLowerCase()!== 'active' || userActive!== 'TRUE') {
      return NextResponse.json({
        success: false,
        msg: 'حسابك غير مفعل بعد. تواصل معنا'
      });
    }

    return NextResponse.json({
      success: true,
      msg: 'أهلاً ' + user[3], // D: Name
      user: {
        name: user[3], // D: Name
        mobile: user[4], // E: Mobile
        role: user[2], // C: Role
        userId: user[0] // A: User ID
      }
    });

  } catch (e) {
    console.error('Login Error:', e);
    return NextResponse.json({
      success: false,
      msg: 'خطأ بالسيرفر: ' + e.message
    }, { status: 500 });
  }
}
