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
      range: "Stores!A:O",
    });

    const rows = storesRes.data.values || [];

    // ============================
    // 2) تجهيز البيانات
    // ============================
    const stores = rows.map((row) => ({
      storeID: row[0],
      storeName: row[1],
      image: row[2] || "",
      address: row[3] || "",
      phone: row[4] || "",
      category: row[5] || "",
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
