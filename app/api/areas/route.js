import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: "Areas!A2:B",
    });

    const rows = res.data.values || [];

    const areas = rows.map((row) => ({
      id: row[0],
      name: row[1],
    }));

    return NextResponse.json({ areas });
  } catch (error) {
    console.error("Areas API Error:", error);
    return NextResponse.json({ areas: [] }, { status: 500 });
  }
}
