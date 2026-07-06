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
    
    // Generate Customer ID
    const customerId = "CUST-" + Date.now();
    const now = new Date().toISOString();
    
    // Check if phone already exists
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: "Customers!C2:C",
    });
    const phones = existing.data.values?.flat() || [];
    if (phones.includes(data.phone)) {
      return NextResponse.json({ success: false, message: "رقم الهاتف مسجل مسبقاً" }, { status: 400 });
    }
    
    // Append to Customers sheet with all columns
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: "Customers!A:Z",
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          customerId,                    // A: Customer ID
          data.name,                     // B: Name
          data.phone,                    // C: Mobile
          data.area,                     // D: Area
          data.address,                  // E: Address
          data.email || '',              // F: Email
          data.joinDate || now,          // G: Join Date
          data.status || 'Pending',      // H: Status
          data.freeDeliveryRemaining || 5, // I: Free Delivery Remaining
          data.registrationLatitude || '', // J: Registration Latitude
          data.registrationLongitude || '', // K: Registration Longitude
          data.currentLatitude || '',    // L: Current Latitude
          data.currentLongitude || '',   // M: Current Longitude
          now,                           // N: Last Location Update
          data.deviceType || '',         // O: Device Type
          data.deviceName || '',         // P: Device Name
          data.browser || '',            // Q: Browser
          data.ipAddress || '',          // R: IP Address
          '',                            // S: Approved Date
          '',                            // T: Approved By
          '',                            // U: Notes
          data.pin                       // V: PIN (storing in extra column)
        ]],
      },
    });
    
    return NextResponse.json({ success: true, message: "تم إرسال طلب الانضمام بنجاح. سيتم مراجعته قريباً" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "فشل إنشاء الحساب" }, { status: 500 });
  }
}