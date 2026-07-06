import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    console.log('Login API called');
    const { mobile, pin } = await req.json();

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: "Users!A2:Z", // A: Mobile, B: PIN, C: Status, D: Name
    });

    const rows = response.data.values || [];
    console.log('Found users:', rows.length);

    const user = rows.find(row => row[0] === mobile && row[1] === pin);

    if (!user) {
      return NextResponse.json({
        success: false,
        msg: 'رقم الهاتف أو PIN غير صحيح'
      });
    }

    if (user[2]?.toLowerCase()!== 'active') {
      return NextResponse.json({
        success: false,
        msg: 'حسابك غير مفعل بعد. تواصل معنا'
      });
    }

    return NextResponse.json({
      success: true,
      msg: 'أهلاً ' + user[3],
      user: { name: user[3], mobile: user[0] }
    });

  } catch (e) {
    console.error('Login Error:', e.message);
    return NextResponse.json({
      success: false,
      msg: 'خطأ بالسيرفر: ' + e.message
    }, { status: 500 });
  }
}
