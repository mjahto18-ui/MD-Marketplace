import { google } from "googleapis";

export async function POST(req) {
  try {
    const { mobile, pin } = await req.json();

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: "Users!A2:Z",
    });

    import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { mobile, pin } = await req.json();

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: "Users!A2:Z", // نفترض الترتيب: A=mobile, B=pin, C=status, D=name
    });

    const rows = response.data.values || [];

    // دور على اليوزر
    const userRow = rows.find(row => row[0] === mobile && row[1] === pin);

    if (!userRow) {
      return NextResponse.json({
        success: false,
        msg: 'رقم الهاتف أو PIN غير صحيح'
      }, { status: 401 });
    }

    // تأكد من الحالة - نفترض انها بالعمود C
    if (userRow[2]?.toLowerCase() === 'stopped' || userRow[2]?.toLowerCase() === 'متوقف') {
      return NextResponse.json({
        success: false,
        msg: 'حسابك متوقف، يرجى التواصل معنا'
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      msg: 'تم تسجيل الدخول بنجاح',
      user: {
        mobile: userRow[0],
        name: userRow[3] || '',
        status: userRow[2]
      }
    });

  } catch (e) {
    return NextResponse.json({
      success: false,
      msg: 'خطأ بالسيرفر: ' + e.message
    }, { status: 500 });
  }
}
