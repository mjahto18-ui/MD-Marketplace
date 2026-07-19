import { NextResponse } from "next/server";
import { google } from "googleapis";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function POST(req) {
  try {
    // ✅ جيب الـ customerId من الجلسة مش من الـ body
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const decoded = token? verifyToken(token) : null;

    if (!decoded?.id) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized",
        notifications: []
      }, { status: 401 });
    }

    const customerId = decoded.id; // من الجلسة الآمنة

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

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
    });
  }
}
