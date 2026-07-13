export const dynamic = "force-dynamic";   // ← الحل الأساسي

import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(req, { params }) {
  try {
    const productID = params.id;

    if (!productID) {
      return NextResponse.json({
        success: false,
        message: "Missing product ID",
      });
    }

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
      range: "Products!A:Z",
    });

    const products = productsRes.data.values || [];

    const product = products.find((row) => row[0] === productID);

    if (!product) {
      return NextResponse.json(
        { success: false, message: "المنتج غير موجود" },
        { status: 404 }
      );
    }

    // ============================
    // 2) جلب جدول Stores
    // ============================
    const storesRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Stores!A:Z",
    });

    const stores = storesRes.data.values || [];

    const store = stores.find((row) => row[0] === product[1]); // Store ID

    // ============================
    // 3) تجهيز بيانات المنتج
    // ============================
    const productData = {
      productID: product[0],
      storeID: product[1],
      name: product[2],
      category: product[3],
      unit: product[4],
      price: Number(product[5]),
      image: product[6],
      description: product[7],
      available: product[8],
      stock: Number(product[9]),
      active: product[10],
      weightPoint: Number(product[11]),
      storeName: store ? store[1] : "متجر محذوف",
    };

    return NextResponse.json({
      success: true,
      product: productData,
    });

  } catch (err) {
    console.error("Product GET Error:", err);
    return NextResponse.json(
      { success: false, message: "خطأ بجلب المنتج" },
      { status: 500 }
    );
  }
}
