import { google } from "googleapis";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

export async function POST(req) {
  try {
    const { name, mobile, area, address, lat, lng } = await req.json();

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const checkCustomers = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: "Customers!C2:C",
    });
    const checkUsers = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: "Users!C2:C",
    });

    const allMobiles = [
     ...(checkCustomers.data.values?.flat() || []),
     ...(checkUsers.data.values?.flat() || [])
    ];

    if (allMobiles.includes(mobile)) {
      return NextResponse.json({ success: false, msg: 'الرقم مسجل من قبل' });
    }

    const customerId = 'C' + Date.now();
    const pin = randomBytes(2).toString('hex').toUpperCase();

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: "Customers!A:U",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          customerId, name, mobile, pin, area, address, lat, lng, 'pending',
          new Date().toLocaleString('ar-SA'), '', '', '', '', '', '', '', '', '', '', ''
        ]],
      },
    });

    return NextResponse.json({
      success: true,
      msg: `طلبك قيد الانتظار. كلمة السر: ${pin} احتفظ فيها. سوف يصلك اشعار قريباً`
    });

  } catch (e) {
    return NextResponse.json({ success: false, msg: 'فشل التسجيل: ' + e.message }, { status: 500 });
  }
}
