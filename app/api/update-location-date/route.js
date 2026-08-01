import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req) {
  try {
    const { customerID } = await req.json();

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // جلب كل العملاء
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: "Customers!A2:Z",
    });

    const rows = res.data.values || [];

    // إيجاد صف العميل
    const rowIndex = rows.findIndex(r => r[0] === customerID);

    if (rowIndex === -1) {
      return NextResponse.json({ ok: false, msg: "Customer not found" });
    }

    // عمود Last Location Update هو آخر عمود
    const updateCol = rows[0].length - 1; 

    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: `Customers!${String.fromCharCode(65 + updateCol)}${rowIndex + 2}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[new Date().toLocaleDateString("en-US")]],
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false });
  }
}
