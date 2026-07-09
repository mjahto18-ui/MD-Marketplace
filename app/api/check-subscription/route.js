import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    range: "Users!A2:Z",
  });

  const users = res.data.values || [];
  const user = users.find(row => row[0] === userId);

  const subscriptionId = user?.[16] || ""; // العامود Q

  return NextResponse.json({
    hasSubscription: subscriptionId !== ""
  });
}
