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

    // 1. جيب sheetId الصح
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const cartSheet = spreadsheet.data.sheets.find(
      (s) => s.properties.title === "Cart"
    );
    if (!cartSheet) {
      throw new Error("Cart sheet مش موجود. تأكد من اسم التاب");
    }
    const sheetId = cartSheet.properties.sheetId;

    const cartRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Cart!A:J",
    });

    const rows = cartRes.data.values || [];

    // 2. طباعة للـ debug
    console.log("Searching for:", customerID, productID);
    console.log("First 3 rows:", rows.slice(0, 3));

    const rowIndex = rows.findIndex(
      (row) =>
        row[1] && row[2] &&
        String(row[1]).trim() === String(customerID).trim() &&
        String(row[2]).trim() === String(productID).trim()
    );

    console.log("Found at rowIndex:", rowIndex);

    if (rowIndex === -1) {
      return NextResponse.json(
        { success: false, message: "المنتج غير موجود بالسلة" },
        { status: 404 }
      );
    }

    // 3. لو عندك header بالصف 1، خليها rowIndex + 1
    // لو البيانات بتبلش من الصف 1 مباشرة، خليها rowIndex
    const actualRowIndex = rowIndex; // غيّرها لـ rowIndex + 1 لو في header
    console.log("Deleting sheetId:", sheetId, "actualRowIndex:", actualRowIndex);

    const batchResponse = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: "ROWS",
                startIndex: actualRowIndex,
                endIndex: actualRowIndex + 1,
              },
            },
          },
        ],
      },
    });

    console.log("Batch response:", batchResponse.data);

    return NextResponse.json({
      success: true,
      message: "تم حذف المنتج من السلة",
      deletedRow: actualRowIndex + 1, // للـ debug
    });

  } catch (err) {
    console.error("Cart DELETE Error:", err);
    return NextResponse.json(
      { success: false, message: "خطأ بالحذف", error: err.message },
      { status: 500 }
    );
  }
}
