import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function DELETE(req) {
  try {
    const customerID = req.nextUrl.searchParams.get("customerID");
    const productID = req.nextUrl.searchParams.get("productID");

    if (!customerID ||!productID) {
      return NextResponse.json(
        { success: false, message: "customerID و productID مطلوبين" },
        { status: 400 }
      );
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    // 1. جيب الـ sheetId الصح
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId })
    const cartSheet = spreadsheet.data.sheets.find(s => s.properties.title === 'Cart')
    if (!cartSheet) throw new Error("Cart sheet not found")
    const sheetId = cartSheet.properties.sheetId

    const cartRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Cart!A:J",
    });

    const rows = cartRes.data.values || [];

    const rowIndex = rows.findIndex(
      (row) =>
        String(row[1]).trim() === String(customerID).trim() &&
        String(row[2]).trim() === String(productID).trim()
    );

    if (rowIndex === -1) {
      return NextResponse.json(
        { success: false, message: "المنتج غير موجود بالسلة" },
        { status: 404 }
      );
    }

    // 2. لو عندك header زيد 1. لو بتبدأ البيانات من الصف 1 شيل السطر هذا
    const actualRowIndex = rowIndex // + 1 إذا في header

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId, // استخدمنا الـ ID الصح
                dimension: "ROWS",
                startIndex: actualRowIndex,
                endIndex: actualRowIndex + 1,
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
      { success: false, message: "خطأ بالحذف", error: err.message },
      { status: 500 }
    );
  }
}
