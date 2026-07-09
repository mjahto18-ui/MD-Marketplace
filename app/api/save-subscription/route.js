import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req) {
  const { userId, subscriptionId } = await req.json();

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
  const userIndex = users.findIndex(row => row[0] === userId);

  if (userIndex === -1) {
    return NextResponse.json({ success: false });
  }

  users[userIndex][16] = subscriptionId; // العامود Q

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    range: `Users!A${userIndex + 2}:Z`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [users[userIndex]] }
  });

  return NextResponse.json({ success: true });
}
