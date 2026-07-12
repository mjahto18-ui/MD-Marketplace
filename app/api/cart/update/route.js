import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function PUT(req) {
  try {
    const { cartID, qty } = await req.json();

    if (!cartID || !qty) {
      return NextResponse.json(
        { success: false, message: "cartID و qty مطلوبين" },
        { status: 400 }
      );
    }

    if (qty < 1) {
      return NextResponse.json(
        { success: false, message: "الكمية لازم تكون 1 أو أكثر" },
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
    // 1) جلب جدول Cart
    // ============================
    const cartRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Cart!A:Z",
    });

    const cartRows = cartRes.data.values || [];

    // ============================
    // 2) إيجاد المنتج بالسلة
    // ============================
    const index = cartRows.findIndex((row) => row[0] === cartID);

    if (index === -1) {
      return NextResponse.json(
        { success: false, message: "المنتج مش بالسلة" },
        { status: 404 }
      );
    }

    const cartItem = cartRows[index];
    const productID = cartItem[2];

    // ============================
    // 3) جلب جدول Products
    // ============================
    const productsRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Products!A:Z",
    });

    const productsRows = productsRes.data.values || [];

    const product = productsRows.find((row) => row[0] === productID);

    if (!product) {
      return NextResponse.json(
        { success: false, message: "المنتج غير موجود" },
        { status: 404 }
      );
    }

    const unitPrice = Number(product[4]); // Price

    // ============================
    // 4) تعديل الكمية + Line Total
    // ============================
    cartItem[3] = qty;                // Qty
    cartItem[5] = qty * unitPrice;    // Line Total

    // ============================
    // 5) حفظ التعديلات
    // ============================
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Cart!A${index + 2}:Z${index + 2}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [cartItem] },
    });

    return NextResponse.json({
      success: true,
      message: "تم تعديل الكمية",
    });

  } catch (err) {
    console.error("Cart UPDATE Error:", err);
    return NextResponse.json(
      { success: false, message: "خطأ بالتعديل" },
      { status: 500 }
    );
  }
}
