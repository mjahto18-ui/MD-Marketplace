export const dynamic = "force-dynamic";   // ← الحل الأساسي

import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(req) {
  try {
    // قراءة storeID من URL بالطريقة الصحيحة
    const storeID = req.nextUrl.searchParams.get("storeID");

    // Google Auth
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    // ============================
    // 1) جلب جدول Products
    // ============================
    const productsRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Products!A:L",
    });

    const rows = productsRes.data.values || [];
    const productsRows = rows.slice(1); // تجاهل الـ Header

    // ============================
    // 2) جلب جدول Stores
    // ============================
    const storesRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Stores!A:O",
    });

    const storesRows = storesRes.data.values || [];
    const storesData = storesRows.slice(1); // تجاهل الـ Header

    // ============================
    // 3) فلترة حسب Store ID (اختياري)
    // ============================
    let filteredProducts = productsRows;

    if (storeID) {
      filteredProducts = productsRows.filter((row) => row[1] === storeID);
    }

    // ============================
    // 4) تجهيز البيانات وربطها مع Stores
    // ============================
    const products = filteredProducts.map((row) => {
      const store = storesData.find((s) => s[0] === row[1]); // Store ID

      return {
        productID: row[0],
        storeID: row[1],
        name: row[2],
        category: row[3],
        unit: row[4],
        price: Number(row[5]),
        image: row[6],
        description: row[7],
        available: row[8],
        stock: Number(row[9]),
        active: row[10],
        weightPoint: Number(row[11]),
        storeName: store ? store[1] : "متجر محذوف",
      };
    });

    return NextResponse.json({
      success: true,
      products,
    });

  } catch (err) {
    console.error("Products GET Error:", err);
    return NextResponse.json(
      { success: false, message: "خطأ بجلب المنتجات" },
      { status: 500 }
    );
  }
}
