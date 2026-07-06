import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req) {
  try {
    const { name, email, password, phone, location, company } = await req.json();
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    const customerId = "CUST-" + Date.now();
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: "Customers!A:F",
      valueInputOption: "RAW",
      requestBody: {
        values: [[customerId, name, email, password, phone, company]],
      },
    });
    return NextResponse.json({ success: true, message: "تم إنشاء الحساب بنجاح" });
  } catch (error) {
    return NextResponse.json({ success: false, message: "فشل إنشاء الحساب" }, { status: 500 });
  }
}
