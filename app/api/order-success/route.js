export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const requestID = searchParams.get("id");

    if (!requestID) {
      return NextResponse.json({ success: false, message: "Missing ID" });
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

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Order Requuest!A:AC",
    });

    const rows = res.data.values || [];
    const header = rows[0];
    const data = rows.slice(1);

    const order = data.find((row) => row[0] === requestID);

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" });
    }

    return NextResponse.json({
      success: true,
      order: {
        requestID: order[0],
        totalAmount: order[6], // عدّلها حسب عمود المجموع عندك
      },
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Error" });
  }
}
