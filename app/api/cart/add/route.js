import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req) {
  try {
    const { customerID, productID, qty = 1 } = await req.json();

    if (!customerID || !productID) {
      return NextResponse.json({
        success: false,
        message: "Missing data",
      });
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
    // 1) جلب جدول Products
    // ============================
    const productsRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Products!A:Z",
    });

    const products = productsRes.data.values || [];

    const product = products.find((row) => row[0] === productID);

    if (!product) {
      return NextResponse.json({
        success: false,
        message: "المنتج غير موجود",
      });
    }

    const unitPrice = Number(product[4]);        // Price
    const storeID = product[1];                 // Store ID
    const linePoints = Number(product[11]);     // Weight Point

    // ============================
    // 2) جلب جدول Cart
    // ============================
    const cartRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Cart!A:Z",
    });

    const cartRows = cartRes.data.values || [];

    // ============================
    // 3) هل المنتج موجود بالسلة؟
    // ============================
    const existingIndex = cartRows.findIndex(
      (row) =>
        row[1] === customerID &&
        row[2] === productID &&
        row[6] === "FALSE" // Checked Out
    );

    // ============================
    // 4) إذا موجود → زيد الكمية
    // ============================
    if (existingIndex !== -1) {
      const row = cartRows[existingIndex];
      const oldQty = Number(row[3]);
      const newQty = oldQty + qty;

      row[3] = newQty;                 // Qty
      row[5] = newQty * unitPrice;     // Line Total

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Cart!A${existingIndex + 2}:Z${existingIndex + 2}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [row] },
      });

      return NextResponse.json({
        success: true,
        message: "تم تحديث الكمية بالسلة",
      });
    }

    // ============================
    // 5) إذا مش موجود → ضيف سطر جديد
    // ============================
    const cartID = crypto.randomUUID().replace(/-/g, "").substring(0, 8);

    const newRow = [
      cartID,          // Cart ID
      customerID,      // Customer ID
      productID,       // Product ID
      qty,             // Qty
      storeID,         // Store ID
      qty * unitPrice, // Line Total
      "FALSE",         // Checked Out
      "FALSE",         // Check Out Flagge
      "",              // Request ID
      linePoints       // Line Points
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Cart!A:Z",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [newRow] },
    });

    return NextResponse.json({
      success: true,
      message: "تمت الإضافة للسلة",
    });

  } catch (err) {
    console.error("Cart API Error:", err);
    return NextResponse.json(
      { success: false, message: "خطأ بالاضافة" },
      { status: 500 }
    );
  }
}
