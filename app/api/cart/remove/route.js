import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function DELETE(req) {
  try {
    const cartID = req.nextUrl.searchParams.get("cartID");

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

    // 1) جلب كل الصفوف بدون حذف الـ header
    const cartRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Cart!A:Z",
    });

    const rows = cartRes.data.values || [];

    // 2) إيجاد الصف الحقيقي داخل الـ Sheet
    const rowIndex = rows.findIndex((row) => String(row[0]).trim() === String(cartID).trim());

    if (rowIndex === -1) {
      return NextResponse.json(
        { success: false, message: "المنتج مش بالسلة" },
        { status: 404 }
      );
    }

    // 3) حذف الصف الحقيقي من الـ Sheet
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: 0, // أول شيت عادةً
                dimension: "ROWS",
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      },
    });

    return NextResponse.json({
      success: true,
      message: "تم حذف المنتج من السلة",
    });

  } catch (err) {
    console.error("Cart DELETE Error:", err);
    return NextResponse.json(
      { success: false, message: "خطأ بالحذف" },
      { status: 500 }
    );
  }
}
