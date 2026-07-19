import { NextResponse } from "next/server";
import { google } from "googleapis";
import { cookies } from "next/headers";

export async function POST(req) {
  try {
    // ✅ نفس طريقة /api/me بالضبط
    const cookieStore = cookies();
    const session = cookieStore.get('session');

    if (!session) {
      return NextResponse.json({
        success: false,
        message: "Not logged in",
        notifications: []
      }, { status: 401 });
    }

    const { phone } = JSON.parse(session.value);

    if (!phone) {
       return NextResponse.json({
        success: false,
        message: "Invalid session",
        notifications: []
      }, { status: 401 });
    }

    // -----------------------------
    // Google Sheets Auth
    // -----------------------------
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    // 1. جيب الـ Customer ID من رقم الموبايل
    const customersRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Customers!A:Z",
    });

    const customersRows = customersRes.data.values || [];
    const customersHeaders = customersRows[0];
    const customerRow = customersRows.slice(1).find(row => row[customersHeaders.indexOf('Mobile')] === phone);

    if (!customerRow) {
      return NextResponse.json({ success: false, notifications: [], message: "Customer not found" });
    }

    const customerId = customerRow[customersHeaders.indexOf('Customer ID')];

    // 2. جيب التنبيهات
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Webhook!A:E",
    });

    const rows = result.data.values || [];

    const notifications = rows
     .filter(r => r[0] === customerId)
     .map(r => ({
        customerId: r[0],
        title: r[1],
        message: r[2],
        image: r[3],
        date: r[4],
      }))
     .reverse()
     .slice(0, 10);

    return NextResponse.json({
      success: true,
      notifications,
      count: notifications.length,
    });

  } catch (err) {
    console.log(err);
    return NextResponse.json({
      success: false,
      error: err.message,
      notifications: []
    });
  }
}
