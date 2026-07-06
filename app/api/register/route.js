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

    const customerId = "CUST-" + Date.now();
    const now = new Date().toISOString();

    // ← هون عم نكتب على شيت Customers
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID, // ← نفس المتغير
      range: "Customers!A:V", // ← اسم شيت العملاء عندك + 22 عمود
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          customerId, // A: Customer ID
          data.name, // B: Name
          data.phone, // C: Mobile
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
    console.error(error); // ← هاد السطر مهم عشان نشوف الخطأ بـ Vercel Logs
    return NextResponse.json({ success: false, message: "فشل إنشاء الحساب" }, { status: 500 });
  }
}
