import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req) {
  try {
    const data = await req.json();
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    // ===== هاد الجزء الجديد كله - Check قبل ما نضيف =====
    // 1. جيب كل ارقام التلفونات من العمود C
    const phoneColumn = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: "Customers!C:C", // العمود C = Mobile
    });

    // 2. نظف الارقام وقارن
    const submittedPhone = data.phone.toString().trim();
    const existingPhones = (phoneColumn.data.values || [])
      .flat()
      .map(p => p?.toString().trim())
      .filter(p => p);

    if (existingPhones.includes(submittedPhone)) {
      return NextResponse.json({ 
        success: false, 
        message: "الرقم مسجل مسبقاً، سجل دخول" 
      });
    }
    // ===== خلص جزء الـ Check =====

    // 3. اذا وصل لهون يعني الرقم مش موجود، كمّل التسجيل عادي
    const customerId = "CUST-" + Date.now();
    const now = new Date().toISOString();

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: "Customers!A:V",
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          customerId, // A: Customer ID
          data.name, // B: Name
          submittedPhone, // C: Mobile - استخدمنا الرقم النظيف
          data.area, // D: Area
          data.address, // E: Address
          data.email || '', // F: Email
          now, // G: Join Date
          'Pending', // H: Status
          5, // I: Free Delivery Remaining
          data.registrationLatitude, // J: Registration Latitude
          data.registrationLongitude, // K: Registration Longitude
          data.currentLatitude, // L: Current Latitude
          data.currentLongitude, // M: Current Longitude
          now, // N: Last Location Update
          data.deviceType, // O: Device Type
          data.deviceName, // P: Device Name
          data.browser, // Q: Browser
          data.ipAddress, // R: IP Address
          '', // S: Approved Date
          '', // T: Approved By
          '', // U: Notes
          data.pin // V: PIN
        ]],
      },
    });

    return NextResponse.json({ success: true, message: "تم إرسال طلب الانضمام بنجاح" });
  } catch (error) {
    console.error('Register Error:', error);
    return NextResponse.json({ success: false, message: "فشل إنشاء الحساب" }, { status: 500 });
  }
}
