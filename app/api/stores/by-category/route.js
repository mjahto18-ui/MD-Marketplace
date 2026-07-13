import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryID = searchParams.get("id");

    if (!categoryID) {
      return NextResponse.json({ success: false, message: "Missing category ID" });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Stores!A:Z",
    });

    const rows = res.data.values || [];
    const headers = rows[0];
    const data = rows.slice(1);

    const stores = data
      .filter(row => row[headers.indexOf("Category")] === categoryID)
      .map(row => {
        const store = {};
        headers.forEach((h, i) => store[h] = row[i] || "");
        return store;
      });

    return NextResponse.json({ success: true, stores });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Error" });
  }
}
