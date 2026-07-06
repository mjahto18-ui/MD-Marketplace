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
      range: "Users!A2:N",
    });

    const rows = response.data.values || [];
    console.log('Found users:', rows.length);

    const user = rows.find(row => {
      const userMobile = String(row[4] || '').trim().replace(/^0+/, ''); // E: Mobile
      const userPin = String(row[10] || '').trim(); // K: PIN
      const inputMobile = String(mobile || '').trim().replace(/^0+/, '');
      const inputPin = String(pin || '').trim();

      console.log('Checking user:', userMobile, inputMobile, userPin, inputPin);

      return userMobile === inputMobile && userPin === inputPin;
    });

    if (!user) {
      console.log('User not found');
      return NextResponse.json({
        success: false,
        msg: 'رقم الهاتف أو PIN غير صحيح'
      });
    }

    const userStatus = user[9]; // J: Status
    const userActive = user[5]; // F: Active
    console.log('User status:', userStatus, userActive);

    if (userStatus?.toLowerCase()!== 'active' || userActive!== 'TRUE') {
      return NextResponse.json({
        success: false,
        msg: 'حسابك غير مفعل بعد. تواصل معنا'
      });
    }

    return NextResponse.json({
      success: true,
      msg: 'أهلاً ' + user[3],
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
