import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { name, mobile, area, address, lat, lng, pin } = await req.json();

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // 1. تأكد ان الرقم مش مسجل قبل بجدول Customers
    const checkCustomers = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: "Customers!A2:A", // عمود الموبايل
    });
    const existingCustomers = checkCustomers.data.values?.flat() || [];
    if (existingCustomers.includes(mobile)) {
      return NextResponse.json({
        success: false,
        msg: 'هذا الرقم مسجل مسبقاً وبانتظار الموافقة'
      });
    }

    // 2. تأكد مش موجود بـ Users كمان
    const checkUsers = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: "Users!A2:A",
    });
    const existingUsers = checkUsers.data.values?.flat() || [];
    if (existingUsers.includes(mobile)) {
      return NextResponse.json({
        success: false,
        msg: 'عندك حساب بالفعل، سجل دخول'
      });
    }

    // 3. ضيفه على جدول Customers
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: "Customers!A1",
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          mobile, // A
          pin, // B
          name, // C
          area, // D
          address, // E
          lat, // F
          lng, // G
          'pending', // H - Status
          new Date().toLocaleString('ar-SA') // I - CreatedAt
        ]]
      },
    });

    return NextResponse.json({
      success: true,
      msg: 'تم التسجيل بنجاح. سيتم التواصل معك بعد مراجعة البيانات'
    });

  } catch (e) {
    return NextResponse.json({
      success: false,
      msg: 'خطأ بالتسجيل: ' + e.message
    }, { status: 500 });
  }
}
