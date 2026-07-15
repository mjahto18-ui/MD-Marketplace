import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req) {
  try {
    const body = await req.json();

    console.log("===== OneSignal Webhook =====");
    console.log(body);

    // -----------------------------
    // Extract Data From OneSignal
    // -----------------------------
    const customerId = body?.notification?.target?.user?.id;
    const title = body?.notification?.headings?.en || "";
    const message = body?.notification?.contents?.en || "";
    const image = body?.notification?.chrome_web_image || "";
    const date = new Date().toLocaleString("en-US");

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
    // Append Notification
    // -----------------------------
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Webhook!A:E",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[customerId, title, message, image, date]],
      },
    });

    return NextResponse.json({
      success: true,
      message: "Notification saved",
    });

  } catch (err) {
    console.log(err);
    return NextResponse.json({
      success: false,
      error: err.message,
    });
  }
}
