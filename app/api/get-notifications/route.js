import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req) {
  try {
    const body = await req.json();
    const { customerId } = body;

    if (!customerId) {
      return NextResponse.json({
        success: false,
        message: "Missing customerId",
      });
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

    // -----------------------------
    // Read Notifications Sheet
    // -----------------------------
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Webhook!A:E", // غيّرها حسب اسم الشيت
    });

    const rows = result.data.values || [];

    // -----------------------------
    // Filter by customerId
    // -----------------------------
    const notifications = rows
      .filter(r => r[0] === customerId)
      .map(r => ({
        customerId: r[0],
        title: r[1],
        message: r[2],
        image: r[3],
        date: r[4],
      }))
      .reverse() // أحدث إشعارات أول شي
      .slice(0, 10); // آخر 10 فقط

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
    });
  }
}
