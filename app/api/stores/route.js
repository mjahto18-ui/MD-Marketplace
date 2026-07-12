import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET() {
  try {
    // Google Auth
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    // ============================
    // 1) جلب جدول Stores
    // ============================
    const storesRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Stores!A:Z",
    });

    const rows = storesRes.data.values || [];

    // ============================
    // 2) تجهيز البيانات حسب ترتيب الأعمدة الصحيح
    // ============================
    const stores = rows.map((row) => ({
      storeID: row[0],            // A
      storeName: row[1],          // B
      category: row[2],           // C
      ownerName: row[3],          // D
      phone: row[4],              // E
      area: row[5],               // F
      address: row[6],            // G
      description: row[7],        // H
      image: row[8],              // I (Logo)
      status: row[9],             // J
      joinDate: row[10],          // K
      commissionRate: row[11],    // L
      deliveryAvailable: row[12], // M
      closeTime: row[13],         // N
      openTime: row[14],          // O
    }));

    return NextResponse.json({
      success: true,
      stores,
    });

  } catch (err) {
    console.error("Stores GET Error:", err);
    return NextResponse.json(
      { success: false, message: "خطأ بجلب المتاجر" },
      { status: 500 }
    );
  }
}
