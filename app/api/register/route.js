import { google } from "googleapis";
import { NextResponse } from "next/server";
import { headers } from 'next/headers';

export async function POST(req) {
  try {
    console.log('Register API called');
    const { name, mobile, area, address, email, lat, lng } = await req.json();
    const headersList = headers();

    // معلومات الجهاز
    const userAgent = headersList.get('user-agent') || '';
    const ip = headersList.get('x-forwarded-for')?.split(',')[0] || 'Unknown';
    const deviceType = /Mobile|Android|iPhone|iPad/.test(userAgent)? 'Mobile' : 'Desktop';
    const deviceName = /iPhone/.test(userAgent)? 'iPhone'
                     : /Android/.test(userAgent)? 'Android'
                     : /iPad/.test(userAgent)? 'iPad' : 'PC';
    const browser = /Edg/.test(userAgent)? 'Edge'
                  : /Chrome/.test(userAgent)? 'Chrome'
                  : /Firefox/.test(userAgent)? 'Firefox'
                  : /Safari/.test(userAgent)? 'Safari' : 'Other';

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // تأكد الرقم مش موجود
    const check = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: "Customers!C2:C",
    });
    if (check.data.values?.flat().includes(mobile)) {
      return NextResponse.json({ success: false, msg: 'هذا الرقم مسجل مسبقاً' });
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB'); // 29/06/2026
    const timeStr = now.toLocaleString('en-GB'); // 29/06/2026, 14:30:00
    const customerId = crypto.randomUUID().slice(0, 8);

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: "Customers!A1",
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          customerId, // A: Customer ID
          name, // B: Name
          mobile, // C: Mobile
          area, // D: Area
          address, // E: Adress
          email || '', // F: Email
          dateStr, // G: Join Date
          'pending', // H: Status
          0, // I: Free Delivery Remaining
          lat, // J: Registration Latitude
          lng, // K: Registration Longitude
          lat, // L: Current Latitude
          lng, // M: Current Longtitude
          timeStr, // N: Last Location Update
          deviceType, // O: Device Type
          deviceName, // P: Device Name
          browser, // Q: Browser
          ip, // R: IP Address
          '', // S: Approved Date
          '', // T: Approved By
          'طلب جديد من الموقع' // U: Notes
        ]]
      },
    });

    return NextResponse.json({
      success: true,
      msg: 'تم استلام طلبك بنجاح. سيتم التواصل معك خلال 24 ساعة لتفعيل الحساب'
    });

  } catch (e) {
    console.error('Register Error:', e.message);
    return NextResponse.json({
      success: false,
      msg: 'خطأ بالسيرفر: ' + e.message
    }, { status: 500 });
  }
}
