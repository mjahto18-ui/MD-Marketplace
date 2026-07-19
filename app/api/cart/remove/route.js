import { NextResponse } from "next/server";
import { google } from "googleapis";
import { cookies } from "next/headers";

async function getCustomerIDFromSession(sheets, spreadsheetId) {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) return null;
  let phone;
  try {
    const session = JSON.parse(sessionCookie);
    phone = session.phone || session.Mobile || session.user?.phone || sessionCookie;
  } catch { phone = sessionCookie; }
  if (!phone) return null;

  const customersRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Customers!A:Z" });
  const customers = customersRes.data.values || [];
  const header = customers[0] || [];
  const mobileIdx = header.findIndex(h => h.toLowerCase().includes('mobile') || h.toLowerCase().includes('phone'));
  const customerIdIdx = header.findIndex(h => h.toLowerCase().includes('customer') && h.toLowerCase().includes('id'));
  for (let i = 1; i < customers.length; i++) {
    if (customers[i][mobileIdx] === phone || customers[i][1] === phone || customers[i][2] === phone) {
      return customers[i][customerIdIdx >=0 ? customerIdIdx : 0] || customers[i][0];
    }
  }
  const usersRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Users!A:Z" });
  const users = usersRes.data.values?.slice(1) || [];
  const user = users.find(row => row.includes(phone));
  return user ? user[0] : null;
}

export async function DELETE(req) {
  try {
    // ما عاد ناخد customerID من الفرونت
    const productID = req.nextUrl.searchParams.get("productID");
    if (!productID) {
      return NextResponse.json({ success: false, message: "productID مطلوب" }, { status: 400 });
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

    const customerID = await getCustomerIDFromSession(sheets, spreadsheetId);
    if (!customerID) {
      return NextResponse.json({ success: false, message: "لازم تسجل دخول" }, { status: 401 });
    }

    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const cartSheet = spreadsheet.data.sheets.find((s) => s.properties.title === "Cart");
    if (!cartSheet) throw new Error("Cart sheet مش موجود");
    const sheetId = cartSheet.properties.sheetId;

    const cartRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Cart!A:J" });
    const rows = cartRes.data.values || [];

    const rowIndex = rows.findIndex(
      (row) => row[1] && row[2] && String(row[1]).trim() === String(customerID).trim() && String(row[2]).trim() === String(productID).trim() && row[6] === "FALSE"
    );

    if (rowIndex === -1) {
      return NextResponse.json({ success: false, message: "المنتج غير موجود بالسلة" }, { status: 404 });
    }

    const actualRowIndex = rowIndex;
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ deleteDimension: { range: { sheetId, dimension: "ROWS", startIndex: actualRowIndex, endIndex: actualRowIndex + 1 } } }],
      },
    });

    return NextResponse.json({ success: true, message: "تم حذف المنتج من السلة" });
  } catch (err) {
    console.error("Cart DELETE Error:", err);
    return NextResponse.json({ success: false, message: "خطأ بالحذف", error: err.message }, { status: 500 });
  }
}
