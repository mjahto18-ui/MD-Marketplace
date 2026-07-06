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
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: "Customers!A2:Z",
    });
    const users = res.data.values || [];
    // Mobile = column C (index 2), PIN = we'll use password column for now
    const user = users.find(row => row[2] === phone && row[3] === pin && row[7] === 'Active');
    if (user) {
      return NextResponse.json({ 
        success: true, 
        message: "تم تسجيل الدخول بنجاح", 
        user: { 
          customerId: user[0],
          name: user[1], 
          phone: user[2],
          status: user[7]
        } 
      });
    } else {
      return NextResponse.json({ success: false, message: "رقم الهاتف أو رمز الدخول خطأ" }, { status: 401 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "خطأ في الخادم" }, { status: 500 });
  }
}