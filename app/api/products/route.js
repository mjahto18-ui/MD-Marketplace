import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeID = searchParams.get("storeID"); // فلتر اختياري

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
    // 1) جلب جدول Products
    // ============================
    const productsRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Products!A:L",
    });

    const productsRows = productsRes.data.values || [];

    // ============================
    // 2) جلب جدول Stores
    // ============================
    const storesRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Stores!A:O",
    });

    const storesRows = storesRes.data.values || [];

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
      const store = storesRows.find((s) => s[0] === row[1]); // Store ID

      return {
        productID: row[0],
        name: row[2],
        price: Number(row[4]),
        image: row[5],
        weightPoint: Number(row[11]),
        storeID: row[1],
        storeName: store ? store[1] : "متجر محذوف",
        description: row[6] || "",
        category: row[3] || "",
        stock: Number(row[10]) || 0,
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
