import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cartID = searchParams.get("cartID");

    if (!cartID) {
      return NextResponse.json(
        { success: false, message: "cartID مطلوب" },
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
      range: "Cart!A:J",
    });

    const cartRows = cartRes.data.values || [];

    // ============================
    // 2) إيجاد الصف المطلوب حذفه
    // ============================
    const index = cartRows.findIndex((row) => row[0] === cartID);

    if (index === -1) {
      return NextResponse.json(
        { success: false, message: "المنتج مش بالسلة" },
        { status: 404 }
      );
    }

    // ============================
    // 3) حذف الصف
    // ============================
    cartRows.splice(index, 1);

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Cart!A:Z",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: cartRows },
    });

    return NextResponse.json({
      success: true,
      message: "تم الحذف",
    });

  } catch (err) {
    console.error("Cart DELETE Error:", err);
    return NextResponse.json(
      { success: false, message: "خطأ بالحذف" },
      { status: 500 }
    );
  }
}
