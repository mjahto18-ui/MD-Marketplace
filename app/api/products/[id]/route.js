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
      range: "Products!A:Z", // حسب الأعمدة الموجودة بالصورة
    });

    const products = productsRes.data.values || [];

    // Product ID موجود بالعمود A (index 0)
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
    // 3) تجهيز بيانات المنتج حسب ترتيب الأعمدة الصحيح
    // ============================
    const productData = {
      productID: product[0],            // A
      storeID: product[1],              // B
      name: product[2],                 // C
      category: product[3],             // D
      unit: product[4],                 // E
      price: Number(product[5]),        // F
      image: product[6],                // G
      description: product[7],          // H
      available: product[8],            // I
      stock: Number(product[9]),        // J
      active: product[10],              // K
      weightPoint: Number(product[11]), // L
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
