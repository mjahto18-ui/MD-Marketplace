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
      range: "Customers!A2:U",
    });

    const rows = response.data.values || [];
    // عمود C = موبايل, عمود D = PIN, عمود H = Status
    const user = rows.find(row => row[2] === mobile && row[3] === pin);

    if (!user) {
      return NextResponse.json({ success: false, msg: 'يرجى التسجيل او التأكد من البيانات' });
    }

    if (user[7]!== 'active') {
      return NextResponse.json({ success: false, msg: 'حسابك قيد الانتظار، سوف يصلك اشعار قريباً' });
    }

    return NextResponse.json({
      success: true,
      user: { id: user[0], name: user[1], mobile: user[2], role: 'user' }
    });

  } catch (e) {
    return NextResponse.json({ success: false, msg: 'خطأ بالسيرفر' }, { status: 500 });
  }
}
