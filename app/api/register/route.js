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

    // ===== 1) Check رقم الهاتف =====
    const phoneColumn = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: "Customers!C:C",
    });

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

    // ===== 2) جيب كل الـ New PINs من عمود W =====
    const pinColumn = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: "Customers!W:W",
    });

    const existingNewPins = (pinColumn.data.values || [])
      .flat()
      .map(p => p?.toString().trim())
      .filter(p => p);

    // ===== 3) ولّد PIN جديد غير مكرّر =====
    function generateUniqueNewPIN() {
      let pin;
      do {
        pin = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digits
      } while (existingNewPins.includes(pin));
      return pin;
    }

    const newPIN = generateUniqueNewPIN();

    // ===== 4) كتابة الصف كامل بعمود W الجديد =====
    const customerId = "CUST-" + Date.now();
    const now = new Date().toISOString();

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: "Customers!A:W",
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          customerId,              // A
          data.name,               // B
          submittedPhone,          // C
          data.area,               // D
          data.address,            // E
          data.email || '',        // F
          now,                     // G
          'Pending',               // H
          5,                       // I
          data.registrationLatitude,   // J
          data.registrationLongitude,  // K
          data.currentLatitude,        // L
          data.currentLongitude,        // M
          now,                     // N
          data.deviceType,         // O
          data.deviceName,         // P
          data.browser,            // Q
          data.ipAddress,          // R
          '',                      // S
          '',                      // T
          '',                      // U
          data.pin,                // V ← العميل بيكتبو، ما خصّنا فيه
          newPIN                   // W ← شغلنا الحقيقي
        ]],
      },
    });

    return NextResponse.json({
      success: true,
      message: "تم إرسال طلب الانضمام بنجاح"
    });

  } catch (error) {
    console.error('Register Error:', error);
    return NextResponse.json({
      success: false,
      message: "فشل إنشاء الحساب"
    }, { status: 500 });
  }
}
