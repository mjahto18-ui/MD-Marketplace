import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(req) {
  try {
    // قراءة customerID بالطريقة الصحيحة
    const customerID = req.nextUrl.searchParams.get("customerID");

    if (!customerID) {
      return NextResponse.json(
        { success: false, message: "customerID مطلوب" },
        { status: 400 }
      );
    }

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
    // 1) جلب الجداول
    // ============================
    const [cartRes, productsRes, storesRes] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Cart!A:Z",
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Products!A:L",
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Stores!A:O",
      }),
    ]);

    const cartRows = cartRes.data.values?.slice(1) || [];
    const productsRows = productsRes.data.values?.slice(1) || [];
    const storesRows = storesRes.data.values?.slice(1) || [];

    // ============================
    // 2) فلترة سلة الزبون
    // ============================
    const customerCart = cartRows.filter(
      (row) => row[1] === customerID && row[6] === "FALSE"
    );

    // ============================
    // 3) ربط المنتجات والمتاجر
    // ============================
    const cartItems = customerCart.map((row) => {
      const product = productsRows.find((p) => p[0] === row[2]); // Product ID
      const store = storesRows.find((s) => s[0] === row[4]); // Store ID

      const qty = Number(row[3]);
      const lineTotal = Number(row[5]);
      const unitPrice = lineTotal / qty;

      return {
        cartID: row[0],
        productID: row[2],
        name: product ? product[2] : "منتج محذوف",
        image: product ? product[6] : "",
        unitPrice,
        qty,
        lineTotal,
        linePoints: Number(row[9]),
        storeName: store ? store[1] : "متجر محذوف",
      };
    });

    // ============================
    // 4) حساب الوزن والمجموع
    // ============================
    const totalWeight = cartItems.reduce(
      (sum, item) => sum + item.qty * item.linePoints,
      0
    );

    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.lineTotal,
      0
    );

    return NextResponse.json({
      success: true,
      cart: cartItems,
      totalWeight,
      subtotal,
    });

  } catch (err) {
    console.error("Cart GET Error:", err);
    return NextResponse.json(
      { success: false, message: "خطأ بجلب السلة" },
      { status: 500 }
    );
  }
}
