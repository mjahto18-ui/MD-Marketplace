import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req) {
  try {
    const { customerID, lat, lng } = await req.json();

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
      range: "Customers!A2:Z",
    });

    const rows = res.data.values || [];

    const rowIndex = rows.findIndex(r => r[0] === customerID);

    if (rowIndex === -1) {
      return NextResponse.json({ ok: false, msg: "Customer not found" });
    }

    // Current Latitude = العمود رقم 10 (A=0)
    // Current Longtitude = العمود رقم 11
    // Last Location Update = العمود رقم 12

    const currentLatCol = 10;
    const currentLngCol = 11;
    const lastUpdateCol = 12;

    const rowNumber = rowIndex + 2;

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data: [
          {
            range: `Customers!${String.fromCharCode(65 + currentLatCol)}${rowNumber}`,
            values: [[lat]],
          },
          {
            range: `Customers!${String.fromCharCode(65 + currentLngCol)}${rowNumber}`,
            values: [[lng]],
          },
          {
            range: `Customers!${String.fromCharCode(65 + lastUpdateCol)}${rowNumber}`,
            values: [[new Date().toLocaleDateString("en-US")]],
          },
        ],
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false });
  }
}
